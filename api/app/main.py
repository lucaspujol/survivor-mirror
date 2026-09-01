from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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

@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

class JobOffer(BaseModel):
    id: int
    title: str
    company: str
    lat: float
    lng: float

MOCK_OFFERS: list[JobOffer] = [
    JobOffer(id=1, title="Développeur web junior", company="Studio Kaleo", lat=48.8566, lng=2.3522),
    JobOffer(id=2, title="Data analyst", company="Nova Insights", lat=48.8606, lng=2.3376),
    JobOffer(id=3, title="Chef de projet digital", company="Aster & Co", lat=48.8496, lng=2.3612),
    JobOffer(id=4, title="Designer UX/UI", company="Pixel Atelier", lat=48.8530, lng=2.3499),
    JobOffer(id=5, title="Community manager", company="Ampli Studio", lat=48.8666, lng=2.3450),
    JobOffer(id=6, title="Développeur backend", company="Kobalt Tech", lat=48.8460, lng=2.3700),
    JobOffer(id=7, title="Product owner", company="Fluent Labs", lat=48.8720, lng=2.3320),
 
    JobOffer(id=8, title="Chargé de communication", company="Ville de Lyon", lat=45.7640, lng=4.8357),
    JobOffer(id=9, title="Assistant RH", company="Groupe Solane", lat=45.7590, lng=4.8420),
    JobOffer(id=10, title="Comptable", company="Cabinet Verrier", lat=45.7700, lng=4.8280),
    JobOffer(id=11, title="Vendeur en boutique", company="Maison Ferran", lat=45.7610, lng=4.8500),
 
    JobOffer(id=12, title="Technicien de maintenance", company="Atelier Nord", lat=43.2965, lng=5.3698),
    JobOffer(id=13, title="Agent logistique", company="PortSud Logistique", lat=43.3020, lng=5.3750),
    JobOffer(id=14, title="Serveur", company="Le Bistrot du Vieux Port", lat=43.2950, lng=5.3600),
 
    JobOffer(id=15, title="Ingénieur agronome", company="Ferme du Perche", lat=48.4500, lng=0.7500),
    JobOffer(id=16, title="Guide touristique", company="Office du Tourisme d'Annecy", lat=45.8992, lng=6.1294),
    JobOffer(id=17, title="Menuisier", company="Atelier Bois Vivant", lat=47.2184, lng=-1.5536),
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
