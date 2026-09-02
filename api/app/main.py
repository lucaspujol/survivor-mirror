import httpx
from datetime import date
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pyproj import Transformer

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

@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": app.version}

ADRESSE_API_URL = "https://api-adresse.data.gouv.fr/search/"

class GeocodingResult(BaseModel):
    lat: float
    lng: float
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
    score = best["properties"].get("score", 0.0)

    return GeocodingResult(
        lat=lat,
        lng=lng,
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
    lat: float
    lng: float
    geocoding_source: str
    geocoding_score: float
    geocoding_date: date

class AdminJobOffer(JobOffer):
    lambert93_x: float
    lambert93_y: float

MOCK_OFFERS: list[JobOffer] = [
    JobOffer(id=1, title="Développeur·se web junior", company="Studio Kaleo", lat=48.8566, lng=2.3522,
              geocoding_source="api-adresse.data.gouv.fr", geocoding_score=0.92, geocoding_date=date(2026, 9, 1)),
    JobOffer(id=2, title="Data analyst", company="Nova Insights", lat=48.8606, lng=2.3376,
              geocoding_source="api-adresse.data.gouv.fr", geocoding_score=0.88, geocoding_date=date(2026, 9, 1)),
    JobOffer(id=3, title="Chef·fe de projet digital", company="Aster & Co", lat=48.8496, lng=2.3612,
              geocoding_source="api-adresse.data.gouv.fr", geocoding_score=0.95, geocoding_date=date(2026, 9, 1)),
    JobOffer(id=4, title="Designer UX/UI", company="Pixel Atelier", lat=48.8530, lng=2.3499,
              geocoding_source="api-adresse.data.gouv.fr", geocoding_score=0.90, geocoding_date=date(2026, 9, 1)),
    JobOffer(id=5, title="Community manager", company="Ampli Studio", lat=48.8666, lng=2.3450,
              geocoding_source="api-adresse.data.gouv.fr", geocoding_score=0.87, geocoding_date=date(2026, 9, 1)),
    JobOffer(id=6, title="Développeur·se backend", company="Kobalt Tech", lat=48.8460, lng=2.3700,
              geocoding_source="api-adresse.data.gouv.fr", geocoding_score=0.93, geocoding_date=date(2026, 9, 1)),
    JobOffer(id=7, title="Product owner", company="Fluent Labs", lat=48.8720, lng=2.3320,
              geocoding_source="api-adresse.data.gouv.fr", geocoding_score=0.91, geocoding_date=date(2026, 9, 1)),
    JobOffer(id=8, title="Chargé·e de communication", company="Ville de Lyon", lat=45.7640, lng=4.8357,
              geocoding_source="api-adresse.data.gouv.fr", geocoding_score=0.94, geocoding_date=date(2026, 9, 1)),
    JobOffer(id=9, title="Assistant·e RH", company="Groupe Solane", lat=45.7590, lng=4.8420,
              geocoding_source="api-adresse.data.gouv.fr", geocoding_score=0.89, geocoding_date=date(2026, 9, 1)),
    JobOffer(id=10, title="Comptable", company="Cabinet Verrier", lat=45.7700, lng=4.8280,
              geocoding_source="api-adresse.data.gouv.fr", geocoding_score=0.86, geocoding_date=date(2026, 9, 1)),
    JobOffer(id=11, title="Vendeur·se en boutique", company="Maison Ferran", lat=45.7610, lng=4.8500,
              geocoding_source="api-adresse.data.gouv.fr", geocoding_score=0.85, geocoding_date=date(2026, 9, 1)),
    JobOffer(id=12, title="Technicien·ne de maintenance", company="Atelier Nord", lat=43.2965, lng=5.3698,
              geocoding_source="api-adresse.data.gouv.fr", geocoding_score=0.92, geocoding_date=date(2026, 9, 1)),
    JobOffer(id=13, title="Agent·e logistique", company="PortSud Logistique", lat=43.3020, lng=5.3750,
              geocoding_source="api-adresse.data.gouv.fr", geocoding_score=0.90, geocoding_date=date(2026, 9, 1)),
    JobOffer(id=14, title="Serveur·se", company="Le Bistrot du Vieux Port", lat=43.2950, lng=5.3600,
              geocoding_source="api-adresse.data.gouv.fr", geocoding_score=0.83, geocoding_date=date(2026, 9, 1)),
    JobOffer(id=15, title="Ingénieur·e agronome", company="Ferme du Perche", lat=48.4500, lng=0.7500,
              geocoding_source="api-adresse.data.gouv.fr", geocoding_score=0.78, geocoding_date=date(2026, 9, 1)),
    JobOffer(id=16, title="Guide touristique", company="Office du Tourisme d'Annecy", lat=45.8992, lng=6.1294,
              geocoding_source="api-adresse.data.gouv.fr", geocoding_score=0.88, geocoding_date=date(2026, 9, 1)),
    JobOffer(id=17, title="Menuisier·ère", company="Atelier Bois Vivant", lat=47.2184, lng=-1.5536,
              geocoding_source="api-adresse.data.gouv.fr", geocoding_score=0.81, geocoding_date=date(2026, 9, 1)),
]

@app.get("/api/offres", response_model=list[JobOffer])
def list_offers(
    south: float | None = None,
    west: float | None = None,
    north: float | None = None,
    east: float | None = None,
) -> list[JobOffer]:
    if south is None or west is None or north is None or east is None:
        return MOCK_OFFERS

    return [
        offer
        for offer in MOCK_OFFERS
        if south <= offer.lat <= north and west <= offer.lng <= east
    ]

@app.get("/api/admin/offres", response_model=list[AdminJobOffer])
def list_offers_admin() -> list[AdminJobOffer]:
    result = []
    for offer in MOCK_OFFERS:
        x, y = to_lambert93(offer.lat, offer.lng)
        result.append(AdminJobOffer(**offer.model_dump(), lambert93_x=x, lambert93_y=y))
    return result

class OfferCreate(BaseModel):
    title: str
    company: str
    address: str

@app.post("/api/offres", response_model=JobOffer, status_code=201)
def create_offer(payload: OfferCreate) -> JobOffer:
    try:
        geo = geocode_address(payload.address)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    new_offer = JobOffer(
        id=max((offer.id for offer in MOCK_OFFERS), default=0) + 1,
        title=payload.title,
        company=payload.company,
        lat=geo.lat,
        lng=geo.lng,
        geocoding_source=geo.source,
        geocoding_score=geo.score,
        geocoding_date=geo.obtained_at,
    )
    MOCK_OFFERS.append(new_offer)
    return new_offer
