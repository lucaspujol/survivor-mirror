import httpx
from typing import cast
from datetime import date, datetime, timezone
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from geoalchemy2.functions import ST_MakeEnvelope
from geoalchemy2.shape import from_shape, to_shape
from pydantic import BaseModel
from pyproj import Transformer
from shapely.geometry import Point
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload
from app.db import get_session
from app.models import Employer, Job, User

from app.routers import auth

app = FastAPI(
    title="ChômageGo API",
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
    city: str
    lat: float
    lng: float
    geocoding_source: str | None
    geocoding_score: float | None
    geocoding_date: date | None

class AdminJobOffer(JobOffer):
    lambert93_x: float
    lambert93_y: float

def job_to_offer(job: Job) -> JobOffer:
    assert job.location is not None
    point = cast(Point, to_shape(job.location))
    return JobOffer(
        id=job.id,
        title=job.title,
        company=job.employer.company_name,
        description=job.description,
        city=job.location_city,
        lat=point.y,
        lng=point.x,
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
    query = (
        select(Job)
        .options(joinedload(Job.employer))
        .where(Job.location.isnot(None))
    )

    if south is not None and west is not None and north is not None and east is not None:
        envelope = ST_MakeEnvelope(west, south, east, north, 4326)
        query = query.where(func.ST_Within(Job.location, envelope))

    jobs = session.execute(query).scalars().all()
    return [job_to_offer(job) for job in jobs]

@app.get("/api/admin/offres", response_model=list[AdminJobOffer])
def list_offers_admin(session: Session = Depends(get_session)) -> list[AdminJobOffer]:
    query = select(Job).options(joinedload(Job.employer)).where(Job.location.isnot(None))
    jobs = session.execute(query).scalars().all()

    result = []
    for job in jobs:
        offer = job_to_offer(job)
        x, y = to_lambert93(offer.lat, offer.lng)
        result.append(AdminJobOffer(**offer.model_dump(), lambert93_x=x, lambert93_y=y))
    return result

class OfferCreate(BaseModel):
    title: str
    company: str
    description: str
    address: str

def slugify_email(company: str) -> str:
    slug = "".join(c.lower() if c.isalnum() else "-" for c in company).strip("-")
    return f"contact@{slug}.seed.local"

def get_or_create_employer(session: Session, company_name: str) -> Employer:
    existing = session.query(Employer).filter(Employer.company_name == company_name).first()
    if existing:
        return existing

    user = User(
        email=slugify_email(company_name),
        password_hash="not-a-real-password",
        role="employer",
    )
    session.add(user)
    session.flush()

    employer = Employer(user_id=user.id, company_name=company_name, activity_verified=True)
    session.add(employer)
    session.flush()
    return employer

@app.post("/api/offres", response_model=JobOffer, status_code=201)
def create_offer(payload: OfferCreate, session: Session = Depends(get_session)) -> JobOffer:
    try:
        geo = geocode_address(payload.address)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    employer = get_or_create_employer(session, payload.company)

    job = Job(
        employer_id=employer.user_id,
        title=payload.title,
        description=payload.description,
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
    address: str | None = None

def get_job_or_404(session: Session, offer_id: int) -> Job:
    job = session.get(Job, offer_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"Offre {offer_id} introuvable.")
    return job

@app.patch("/api/offres/{offer_id}", response_model=JobOffer)
def update_offer(
    offer_id: int, payload: OfferUpdate, session: Session = Depends(get_session)
) -> JobOffer:
    job = get_job_or_404(session, offer_id)

    if payload.title is not None:
        job.title = payload.title
    if payload.description is not None:
        job.description = payload.description

    if payload.address is not None:
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

    session.commit()
    session.refresh(job, attribute_names=["employer"])

    return job_to_offer(job)

@app.delete("/api/offres/{offer_id}", status_code=204)
def delete_offer(offer_id: int, session: Session = Depends(get_session)) -> None:
    job = get_job_or_404(session, offer_id)
    session.delete(job)
    session.commit()
