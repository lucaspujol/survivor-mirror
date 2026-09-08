import httpx
from typing import cast
from datetime import date, datetime, timezone
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from geoalchemy2.functions import ST_MakeEnvelope
from geoalchemy2.shape import from_shape, to_shape
from pydantic import BaseModel, model_validator
from pyproj import Transformer
from shapely.geometry import Point
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from app.archival import archival_cutoff
from app.db import get_session
from app.deps import CurrentAdmin, CurrentEmployer, CurrentUser
from app.models import Application, Employer, Job, Report, User, Warning

from app import storage
from app.routers import applications, auth, dashboard

app = FastAPI(
    title="GéoEmploi API",
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(applications.router)

@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": app.version}

ADRESSE_API_URL = "https://api-adresse.data.gouv.fr/search/"

class GeocodingResult(BaseModel):
    lat: float
    lng: float
    city: str
    source: str
    score: float
    obtained_at: date

def geocode_address(address: str) -> GeocodingResult:
    response = httpx.get(ADRESSE_API_URL, params={"q": address, "limit": 1}, timeout=5.0)
    response.raise_for_status()
    data = response.json()

    features = data.get("features", [])
    if not features:
        raise ValueError(f"Aucun résultat de géocodage pour l'adresse : {address}")

    best = features[0]
    lng, lat = best["geometry"]["coordinates"]
    properties = best["properties"]
    score = properties.get("score", 0.0)

    return GeocodingResult(
        lat=lat,
        lng=lng,
        city=properties.get("city", ""),
        source="api-adresse.data.gouv.fr",
        score=score,
        obtained_at=date.today(),
    )

_wgs84_to_lambert93 = Transformer.from_crs("EPSG:4326", "EPSG:2154", always_xy=True)

def to_lambert93(lat: float, lng: float) -> tuple[float, float]:
    x, y = _wgs84_to_lambert93.transform(lng, lat)
    return x, y

class JobOffer(BaseModel):
    id: int
    title: str
    company: str
    description: str
    contract_type: str
    contract_duration: str | None
    work_mode: str  # "on_site", "hybrid", "remote"
    time_commitment: str  # "full_time", "part_time"
    address: str | None
    city: str
    # None pour une offre 100% télétravail : pas de lieu de travail géographique.
    lat: float | None
    lng: float | None
    geocoding_source: str | None
    geocoding_score: float | None
    geocoding_date: date | None

class AdminJobOffer(JobOffer):
    lambert93_x: float | None
    lambert93_y: float | None

def job_to_offer(job: Job) -> JobOffer:
    if job.location is not None:
        point = cast(Point, to_shape(job.location))
        lat, lng = point.y, point.x
    else:
        lat, lng = None, None

    return JobOffer(
        id=job.id,
        title=job.title,
        company=job.employer.company_name,
        description=job.description,
        contract_type=job.contract_type,
        contract_duration=job.contract_duration,
        work_mode=job.work_mode,
        time_commitment=job.time_commitment,
        address=job.location_address,
        city=job.location_city,
        lat=lat,
        lng=lng,
        geocoding_source=job.geocoding_source,
        geocoding_score=job.geocoding_score,
        geocoding_date=job.geocoded_at.date() if job.geocoded_at else None,
    )

@app.get("/api/offres", response_model=list[JobOffer])
def list_offers(
    south: float | None = None,
    west: float | None = None,
    north: float | None = None,
    east: float | None = None,
    session: Session = Depends(get_session),
) -> list[JobOffer]:
    # Les offres 100% télétravail n'ont pas de position : elles sont exclues
    # de la carte par construction (isnot(None)), mais restent visibles dans
    # la liste "Mes offres" de l'employeur.
    query = (
        select(Job)
        .options(joinedload(Job.employer))
        .where(Job.location.isnot(None))
        # Archived offers leave the map: they are no longer open to apply to.
        .where(Job.created_at > archival_cutoff())
    )

    if south is not None and west is not None and north is not None and east is not None:
        envelope = ST_MakeEnvelope(west, south, east, north, 4326)
        query = query.where(func.ST_Within(Job.location, envelope))

    jobs = session.execute(query).scalars().all()
    return [job_to_offer(job) for job in jobs]

@app.get("/api/admin/offres", response_model=list[AdminJobOffer])
def list_offers_admin(
    _admin: CurrentAdmin, session: Session = Depends(get_session)
) -> list[AdminJobOffer]:
    query = (
        select(Job)
        .options(joinedload(Job.employer))
        .where(Job.location.isnot(None))
        .where(Job.created_at > archival_cutoff())
    )
    jobs = session.execute(query).scalars().all()

    result = []
    for job in jobs:
        offer = job_to_offer(job)
        # Garanti non-None par le filtre `.where(Job.location.isnot(None))`
        # ci-dessus ; l'assertion prouve cette invariante au vérificateur de
        # types, qui ne voit que le type déclaré (float | None).
        assert offer.lat is not None and offer.lng is not None
        x, y = to_lambert93(offer.lat, offer.lng)
        result.append(AdminJobOffer(**offer.model_dump(), lambert93_x=x, lambert93_y=y))
    return result

class OfferCreate(BaseModel):
    """The company is not part of the payload: an offer belongs to the
    employer whose session publishes it."""

    title: str
    description: str
    contract_type: str  # "cdi", "cdd", "stage", "alternance", "interim", "freelance"
    contract_duration: str | None = None  # ex: "3 mois" — pertinent hors CDI
    work_mode: str  # "on_site", "hybrid", "remote"
    time_commitment: str  # "full_time", "part_time"
    address: str | None = None  # obligatoire sauf si work_mode == "remote"

    @model_validator(mode="after")
    def address_required_unless_remote(self) -> "OfferCreate":
        if self.work_mode != "remote" and not self.address:
            raise ValueError(
                "L'adresse est obligatoire, sauf pour une offre 100% télétravail."
            )
        return self

@app.post("/api/offres", response_model=JobOffer, status_code=201)
def create_offer(
    payload: OfferCreate,
    user: CurrentEmployer,
    session: Session = Depends(get_session),
) -> JobOffer:
    employer = session.get(Employer, user.id)
    if employer is None:
        # An employer account always carries its profile row; a missing one
        # means the account is broken, not that the request is wrong.
        raise HTTPException(status_code=500, detail="Employer profile is missing")

    if payload.work_mode == "remote":
        job = Job(
            employer_id=employer.user_id,
            title=payload.title,
            description=payload.description,
            contract_type=payload.contract_type,
            contract_duration=payload.contract_duration,
            work_mode=payload.work_mode,
            time_commitment=payload.time_commitment,
            location_address=None,
            location_city="Télétravail",
            location=None,
            location_status="pending",
        )
    else:
        # Garanti non-None par le validateur `address_required_unless_remote`
        # ci-dessus ; l'assertion sert juste à le prouver au vérificateur de
        # types, qui ne voit que le type déclaré (str | None).
        assert payload.address is not None
        try:
            geo = geocode_address(payload.address)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        job = Job(
            employer_id=employer.user_id,
            title=payload.title,
            description=payload.description,
            contract_type=payload.contract_type,
            contract_duration=payload.contract_duration,
            work_mode=payload.work_mode,
            time_commitment=payload.time_commitment,
            location_address=payload.address,
            location_city=geo.city or "Ville inconnue",
            location=from_shape(Point(geo.lng, geo.lat), srid=4326),
            geocoding_source=geo.source,
            geocoding_score=geo.score,
            geocoded_at=datetime.now(timezone.utc),
            location_status="geocoded",
        )

    session.add(job)
    session.commit()
    session.refresh(job, attribute_names=["employer"])

    return job_to_offer(job)

class OfferUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    contract_type: str | None = None
    contract_duration: str | None = None
    work_mode: str | None = None
    time_commitment: str | None = None
    address: str | None = None

def get_job_or_404(session: Session, offer_id: int) -> Job:
    job = session.get(Job, offer_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"Offre {offer_id} introuvable.")
    return job

def require_owner_or_admin(user, job: Job) -> None:
    """L'admin modère (peut agir sur toute offre) ; un employeur ne touche
    qu'à ses propres offres ; personne d'autre n'a le droit.
    """
    if user.role == "admin":
        return
    if user.role == "employer" and job.employer_id == user.id:
        return
    raise HTTPException(
        status_code=403, detail="Vous n'avez pas le droit de modifier cette offre."
    )

@app.patch("/api/offres/{offer_id}", response_model=JobOffer)
def update_offer(
    offer_id: int,
    payload: OfferUpdate,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
) -> JobOffer:
    job = get_job_or_404(session, offer_id)
    require_owner_or_admin(current_user, job)

    if payload.title is not None:
        job.title = payload.title
    if payload.description is not None:
        job.description = payload.description
    if payload.contract_type is not None:
        job.contract_type = payload.contract_type
    if payload.contract_duration is not None:
        job.contract_duration = payload.contract_duration
    if payload.work_mode is not None:
        job.work_mode = payload.work_mode
    if payload.time_commitment is not None:
        job.time_commitment = payload.time_commitment

    if job.work_mode == "remote":
        # Basculer vers le télétravail efface toute position existante,
        # même si une adresse a été envoyée dans la même requête : elle
        # n'aurait plus de sens pour ce mode.
        job.location_address = None
        job.location_city = "Télétravail"
        job.location = None
        job.geocoding_source = None
        job.geocoding_score = None
        job.geocoded_at = None
        job.location_status = "pending"
    elif payload.address is not None:
        try:
            geo = geocode_address(payload.address)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        job.location_address = payload.address
        job.location_city = geo.city or "Ville inconnue"
        job.location = from_shape(Point(geo.lng, geo.lat), srid=4326)
        job.geocoding_source = geo.source
        job.geocoding_score = geo.score
        job.geocoded_at = datetime.now(timezone.utc)
        job.location_status = "geocoded"
    # NB : passer de "remote" à "on_site"/"hybrid" SANS fournir de nouvelle
    # adresse dans la même requête laisse l'offre sans position. Pas géré
    # ici — à traiter côté frontend en rendant l'adresse obligatoire dès que
    # le mode choisi n'est plus "remote".

    session.commit()
    session.refresh(job, attribute_names=["employer"])

    return job_to_offer(job)

@app.delete("/api/offres/{offer_id}", status_code=204)
def delete_offer(
    offer_id: int, current_user: CurrentUser, session: Session = Depends(get_session)
) -> None:
    job = get_job_or_404(session, offer_id)
    require_owner_or_admin(current_user, job)

    # The cascade removes the application rows, which would leave their CVs and
    # cover letters behind as orphan files: the ids have to be read first.
    application_ids = session.scalars(
        select(Application.id).where(Application.job_id == job.id)
    ).all()

    session.delete(job)
    session.commit()

    for application_id in application_ids:
        storage.delete_application_files(application_id)


# --- Offer reporting ---
# Restricted to signed-in accounts (seeker or employer), to limit abuse.
# An account can only report a given offer once: the unique constraint in
# the database is what actually enforces this, not a client-side check,
# which could always be bypassed by calling the API directly.

class ReportCreate(BaseModel):
    reason: str  # "fraudulent", "non_compliant", "expired", "other"
    comment: str | None = None


@app.post("/api/offres/{offer_id}/signalements", status_code=201)
def report_offer(
    offer_id: int,
    payload: ReportCreate,
    current_user: CurrentUser,
    session: Session = Depends(get_session),
) -> dict[str, str]:
    get_job_or_404(session, offer_id)  # clean 404 rather than an obscure FK constraint violation

    report = Report(
        job_id=offer_id,
        reporter_id=current_user.id,
        reason=payload.reason,
        comment=payload.comment,
    )
    session.add(report)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=409, detail="Vous avez déjà signalé cette offre."
        )
    return {"status": "ok"}


class ReportOut(BaseModel):
    id: int
    job_id: int
    job_title: str
    reason: str
    comment: str | None
    status: str
    reporter_email: str
    created_at: datetime


@app.get("/api/admin/signalements", response_model=list[ReportOut])
def list_reports(
    _admin: CurrentAdmin,
    job_id: int | None = None,
    session: Session = Depends(get_session),
) -> list[ReportOut]:
    query = (
        select(Report)
        .options(joinedload(Report.job), joinedload(Report.reporter))
        .order_by(Report.created_at.desc())
    )
    if job_id is not None:
        query = query.where(Report.job_id == job_id)

    reports = session.execute(query).scalars().all()
    return [
        ReportOut(
            id=r.id,
            job_id=r.job_id,
            job_title=r.job.title,
            reason=r.reason,
            comment=r.comment,
            status=r.status,
            reporter_email=r.reporter.email,
            created_at=r.created_at,
        )
        for r in reports
    ]


# --- Offer moderation (admin) ---

class AdminOfferDetail(BaseModel):
    id: int
    title: str
    description: str
    contract_type: str
    contract_duration: str | None
    work_mode: str
    time_commitment: str
    address: str | None
    city: str
    lat: float | None
    lng: float | None
    employer_id: int
    employer_email: str
    company: str
    created_at: datetime


@app.get("/api/admin/offres/{offer_id}", response_model=AdminOfferDetail)
def get_offer_admin(
    offer_id: int, _admin: CurrentAdmin, session: Session = Depends(get_session)
) -> AdminOfferDetail:
    job = session.execute(
        select(Job)
        .options(joinedload(Job.employer).joinedload(Employer.user))
        .where(Job.id == offer_id)
    ).scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=404, detail=f"Offre {offer_id} introuvable.")

    lat, lng = (None, None)
    if job.location is not None:
        point = cast(Point, to_shape(job.location))
        lat, lng = point.y, point.x

    return AdminOfferDetail(
        id=job.id,
        title=job.title,
        description=job.description,
        contract_type=job.contract_type,
        contract_duration=job.contract_duration,
        work_mode=job.work_mode,
        time_commitment=job.time_commitment,
        address=job.location_address,
        city=job.location_city,
        lat=lat,
        lng=lng,
        employer_id=job.employer.user_id,
        employer_email=job.employer.user.email,
        company=job.employer.company_name,
        created_at=job.created_at,
    )


class ReportStatusUpdate(BaseModel):
    status: str  # "pending", "reviewed", "dismissed"


@app.patch("/api/admin/signalements/{report_id}", response_model=ReportOut)
def update_report_status(
    report_id: int,
    payload: ReportStatusUpdate,
    _admin: CurrentAdmin,
    session: Session = Depends(get_session),
) -> ReportOut:
    report = session.get(Report, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail=f"Signalement {report_id} introuvable.")

    report.status = payload.status
    session.commit()
    session.refresh(report, attribute_names=["job", "reporter"])

    return ReportOut(
        id=report.id,
        job_id=report.job_id,
        job_title=report.job.title,
        reason=report.reason,
        comment=report.comment,
        status=report.status,
        reporter_email=report.reporter.email,
        created_at=report.created_at,
    )


@app.delete("/api/admin/utilisateurs/{user_id}", status_code=204)
def delete_user_admin(
    user_id: int, _admin: CurrentAdmin, session: Session = Depends(get_session)
) -> None:
    target = session.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail=f"Utilisateur {user_id} introuvable.")
    if target.role == "admin":
        # Guards against locking the platform out of every admin account by mistake.
        raise HTTPException(
            status_code=403,
            detail="Impossible de supprimer un compte administrateur depuis cet écran.",
        )
    session.delete(target)
    session.commit()


class WarningCreate(BaseModel):
    reason: str


class WarningOut(BaseModel):
    id: int
    user_id: int
    reason: str
    created_at: datetime


@app.post(
    "/api/admin/utilisateurs/{user_id}/avertissements",
    response_model=WarningOut,
    status_code=201,
)
def warn_user(
    user_id: int,
    payload: WarningCreate,
    current_admin: CurrentAdmin,
    session: Session = Depends(get_session),
) -> WarningOut:
    target = session.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail=f"Utilisateur {user_id} introuvable.")

    warning = Warning(user_id=user_id, issued_by=current_admin.id, reason=payload.reason)
    session.add(warning)
    session.commit()
    session.refresh(warning)

    return WarningOut(
        id=warning.id,
        user_id=warning.user_id,
        reason=warning.reason,
        created_at=warning.created_at,
    )


@app.get("/api/admin/utilisateurs/{user_id}/avertissements", response_model=list[WarningOut])
def list_warnings(
    user_id: int, _admin: CurrentAdmin, session: Session = Depends(get_session)
) -> list[WarningOut]:
    query = (
        select(Warning)
        .where(Warning.user_id == user_id)
        .order_by(Warning.created_at.desc())
    )
    warnings = session.execute(query).scalars().all()
    return [
        WarningOut(id=w.id, user_id=w.user_id, reason=w.reason, created_at=w.created_at)
        for w in warnings
    ]


# --- Admin: single user detail (account page) ---

class AdminUserJobOut(BaseModel):
    id: int
    title: str
    city: str
    work_mode: str
    application_count: int
    created_at: datetime


class AdminUserApplicationOut(BaseModel):
    id: int
    job_id: int
    job_title: str
    company: str
    city: str
    status: str
    created_at: datetime


class AdminUserDetail(BaseModel):
    id: int
    email: str
    role: str
    display_name: str
    created_at: datetime
    activity_verified: bool | None
    jobs: list[AdminUserJobOut]
    applications: list[AdminUserApplicationOut]


@app.get("/api/admin/utilisateurs/{user_id}", response_model=AdminUserDetail)
def get_user_admin(
    user_id: int, _admin: CurrentAdmin, session: Session = Depends(get_session)
) -> AdminUserDetail:
    user = session.get(
        User,
        user_id,
        options=[joinedload(User.job_seeker), joinedload(User.employer)],
    )
    if user is None:
        raise HTTPException(status_code=404, detail=f"Utilisateur {user_id} introuvable.")

    if user.job_seeker is not None:
        display_name = f"{user.job_seeker.first_name} {user.job_seeker.last_name}"
    elif user.employer is not None:
        display_name = user.employer.company_name
    else:
        display_name = user.email

    jobs: list[AdminUserJobOut] = []
    applications: list[AdminUserApplicationOut] = []

    if user.employer is not None:
        counts = (
            select(Application.job_id, func.count(Application.id).label("total"))
            .group_by(Application.job_id)
            .subquery()
        )
        rows = session.execute(
            select(Job, func.coalesce(counts.c.total, 0))
            .outerjoin(counts, counts.c.job_id == Job.id)
            .where(Job.employer_id == user.id)
            .order_by(Job.created_at.desc())
        ).all()
        jobs = [
            AdminUserJobOut(
                id=job.id,
                title=job.title,
                city=job.location_city,
                work_mode=job.work_mode,
                application_count=count,
                created_at=job.created_at,
            )
            for job, count in rows
        ]

    if user.job_seeker is not None:
        apps = session.execute(
            select(Application)
            .options(joinedload(Application.job).joinedload(Job.employer))
            .where(Application.job_seeker_id == user.id)
            .order_by(Application.created_at.desc())
        ).scalars().all()
        applications = [
            AdminUserApplicationOut(
                id=application.id,
                job_id=application.job_id,
                job_title=application.job.title,
                company=application.job.employer.company_name,
                city=application.job.location_city,
                status=application.status,
                created_at=application.created_at,
            )
            for application in apps
        ]

    return AdminUserDetail(
        id=user.id,
        email=user.email,
        role=user.role,
        display_name=display_name,
        created_at=user.created_at,
        activity_verified=user.employer.activity_verified if user.employer else None,
        jobs=jobs,
        applications=applications,
    )
