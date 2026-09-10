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
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from app.archival import archival_cutoff
from app.db import get_session
from app.deps import CurrentAdmin, CurrentEmployer, CurrentUser
from app.models import REPORT_STATUSES, Application, Employer, Job, JobSeeker, Report, User, Warning

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
    employer_id: int
    description: str
    contract_type: str
    contract_duration: str | None
    work_mode: str  # "on_site", "hybrid", "remote"
    time_commitment: str  # "full_time", "part_time"
    address: str | None
    city: str
    # None for a fully remote offer: no geographic workplace.
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
        employer_id=job.employer_id,
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
    # Fully remote offers have no position, so they can never get a pin -
    # but that's a map-only limitation, not a reason to hide them from the
    # results list entirely. Bounds filtering below only applies to offers
    # that actually have a location; remote ones stay in every viewport.
    query = (
        select(Job)
        .options(joinedload(Job.employer))
        .where(or_(Job.location.isnot(None), Job.work_mode == "remote"))
        # Archived offers leave the map: they are no longer open to apply to.
        .where(Job.created_at > archival_cutoff())
    )

    if south is not None and west is not None and north is not None and east is not None:
        envelope = ST_MakeEnvelope(west, south, east, north, 4326)
        # Remote offers aren't "inside" or "outside" any viewport - a map pan
        # shouldn't make them appear and disappear from the list below it.
        query = query.where(
            or_(Job.work_mode == "remote", func.ST_Within(Job.location, envelope))
        )

    jobs = session.execute(query).scalars().all()
    return [job_to_offer(job) for job in jobs]


class PublicEmployerOffer(BaseModel):
    id: int
    title: str
    contract_type: str
    work_mode: str
    city: str
    created_at: datetime


class PublicEmployerDetail(BaseModel):
    id: int
    company_name: str
    email: str
    phone: str | None
    description: str | None
    offers: list[PublicEmployerOffer]


@app.get("/api/employeurs/{employer_id}", response_model=PublicEmployerDetail)
def get_employer_public(
    employer_id: int, session: Session = Depends(get_session)
) -> PublicEmployerDetail:
    """Public company profile: no auth required, reachable by anyone who
    clicks a company name from an offer, signed in or not."""
    employer = session.execute(
        select(Employer)
        .options(joinedload(Employer.user))
        .where(Employer.user_id == employer_id)
    ).scalar_one_or_none()
    if employer is None:
        raise HTTPException(status_code=404, detail=f"Entreprise {employer_id} introuvable.")

    jobs = session.execute(
        select(Job)
        .where(Job.employer_id == employer_id)
        .order_by(Job.created_at.desc())
    ).scalars().all()

    return PublicEmployerDetail(
        id=employer.user_id,
        company_name=employer.company_name,
        email=employer.user.email,
        phone=employer.phone,
        description=employer.description,
        offers=[
            PublicEmployerOffer(
                id=job.id,
                title=job.title,
                contract_type=job.contract_type,
                work_mode=job.work_mode,
                city=job.location_city,
                created_at=job.created_at,
            )
            for job in jobs
        ],
    )

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
        # Guaranteed non-None by the `.where(Job.location.isnot(None))`
        # filter above; the assertion only proves that invariant to the type
        # checker, which only sees the declared type (float | None).
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
    contract_duration: str | None = None  # e.g. "3 months" - relevant outside CDI
    work_mode: str  # "on_site", "hybrid", "remote"
    time_commitment: str  # "full_time", "part_time"
    address: str | None = None  # required unless work_mode == "remote"

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
        # Guaranteed non-None by `address_required_unless_remote` above; the
        # assertion only proves it to the type checker, which only sees the
        # declared type (str | None).
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
    """Admin moderates (can act on any offer); an employer only touches
    their own offers; no one else is allowed.
    """
    if user.role == "admin":
        return
    if user.role == "employer" and job.employer_id == user.id:
        return
    raise HTTPException(
        status_code=403, detail="Vous n'avez pas le droit de modifier cette offre."
    )


@app.get("/api/offres/{offer_id}", response_model=JobOffer)
def get_offer_public(offer_id: int, session: Session = Depends(get_session)) -> JobOffer:
    """Public single-offer lookup, used to deep-link the map onto one
    specific offer (e.g. from an admin's user account page)."""
    job = session.execute(
        select(Job).options(joinedload(Job.employer)).where(Job.id == offer_id)
    ).scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=404, detail=f"Offre {offer_id} introuvable.")
    return job_to_offer(job)

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
        # Switching to remote clears any existing position, even if an
        # address was sent in the same request: it would no longer be
        # meaningful for this mode.
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
    # NB: switching from "remote" to "on_site"/"hybrid" WITHOUT providing a
    # new address in the same request leaves the offer without a position.
    # Not handled here - to be enforced client-side by requiring the address
    # as soon as the chosen mode is no longer "remote".

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


# Ordered worst-to-best: the group's displayed status is whichever member
# report is least resolved, so an offer with any pending report never looks
# "dismissed" just because other reporters' complaints were already closed.
REPORT_STATUS_PRIORITY = {status: index for index, status in enumerate(REPORT_STATUSES)}


class ReportGroupOut(BaseModel):
    job_id: int
    job_title: str
    report_count: int
    employer_id: int
    company_name: str
    employer_email: str
    warning_count: int
    status: str
    latest_report_at: datetime


@app.get("/api/admin/signalements/par-offre", response_model=list[ReportGroupOut])
def list_reports_grouped_by_offer(
    _admin: CurrentAdmin, session: Session = Depends(get_session)
) -> list[ReportGroupOut]:
    reports = session.execute(
        select(Report).options(
            joinedload(Report.job).joinedload(Job.employer).joinedload(Employer.user)
        )
    ).scalars().all()

    groups: dict[int, list[Report]] = {}
    for r in reports:
        groups.setdefault(r.job_id, []).append(r)

    employer_ids = {group[0].job.employer_id for group in groups.values()}
    warning_counts: dict[int, int] = {}
    if employer_ids:
        rows = session.execute(
            select(Warning.user_id, func.count())
            .where(Warning.user_id.in_(employer_ids))
            .group_by(Warning.user_id)
        ).all()
        warning_counts = {user_id: count for user_id, count in rows}

    result = []
    for job_id, group in groups.items():
        job = group[0].job
        employer = job.employer
        worst = min(group, key=lambda r: REPORT_STATUS_PRIORITY[r.status])
        result.append(
            ReportGroupOut(
                job_id=job_id,
                job_title=job.title,
                report_count=len(group),
                employer_id=employer.user_id,
                company_name=employer.company_name,
                employer_email=employer.user.email,
                warning_count=warning_counts.get(employer.user_id, 0),
                status=worst.status,
                latest_report_at=max(r.created_at for r in group),
            )
        )
    return result


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
    status: str  # "pending", "in_progress", "reviewed", "dismissed"


@app.patch("/api/admin/signalements/{report_id}", response_model=ReportOut)
def update_report_status(
    report_id: int,
    payload: ReportStatusUpdate,
    _admin: CurrentAdmin,
    session: Session = Depends(get_session),
) -> ReportOut:
    if payload.status not in REPORT_STATUSES:
        raise HTTPException(
            status_code=422,
            detail=f"Statut invalide. Valeurs acceptées : {', '.join(REPORT_STATUSES)}.",
        )

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


class AdminUserWarningOut(BaseModel):
    id: int
    reason: str
    issued_by_email: str | None
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
    warnings: list[AdminUserWarningOut]


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

    warning_rows = session.execute(
        select(Warning, User.email)
        .outerjoin(User, User.id == Warning.issued_by)
        .where(Warning.user_id == user_id)
        .order_by(Warning.created_at.desc())
    ).all()
    warnings = [
        AdminUserWarningOut(
            id=warning.id,
            reason=warning.reason,
            issued_by_email=admin_email,
            created_at=warning.created_at,
        )
        for warning, admin_email in warning_rows
    ]

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
        warnings=warnings,
    )


class AdminOfferApplication(BaseModel):
    id: int
    job_seeker_id: int
    applicant_name: str
    applicant_email: str
    status: str
    created_at: datetime


@app.get(
    "/api/admin/offres/{offer_id}/candidatures", response_model=list[AdminOfferApplication]
)
def list_offer_applications_admin(
    offer_id: int, _admin: CurrentAdmin, session: Session = Depends(get_session)
) -> list[AdminOfferApplication]:
    get_job_or_404(session, offer_id)

    query = (
        select(Application)
        .options(joinedload(Application.job_seeker).joinedload(JobSeeker.user))
        .where(Application.job_id == offer_id)
        .order_by(Application.created_at.desc())
    )
    applications = session.execute(query).scalars().all()
    return [
        AdminOfferApplication(
            id=a.id,
            job_seeker_id=a.job_seeker_id,
            applicant_name=f"{a.job_seeker.first_name} {a.job_seeker.last_name}",
            applicant_email=a.job_seeker.user.email,
            status=a.status,
            created_at=a.created_at,
        )
        for a in applications
    ]
