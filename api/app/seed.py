"""Idempotent demo dataset for the ChômageGo prototype.

Run it as many times as you like: every row is looked up by a natural key
before being inserted, so a second run is a no-op and nothing already in the
database is deleted or overwritten.

    docker compose exec api python -m app.seed

The Compose stacks run it automatically after `alembic upgrade head`, so a
fresh `docker compose up` already contains the demo accounts.

Everything here is fictional: the companies, the people and the job offers do
not exist. Only the municipal coordinates are real, and they are public
geographic facts, not personal data. The demo password is a placeholder
documented in the README; it protects nothing.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models import Application, Employer, Job, JobSeeker, User
from app.security import hash_password

# `.example` is reserved by RFC 2606: the domain cannot be registered and no
# mail can ever reach it. `.local` and `.test` are rejected outright by the
# EmailStr validator, so they cannot be used for accounts that must sign in.
DEMO_DOMAIN = "demo.chomagego.example"
# Placeholder shared by every seeded account. Not a secret: it is published in
# the README so the demo can be replayed by anyone.
DEMO_PASSWORD = "ChomageGo2026!"

ADMIN_EMAIL = f"admin@{DEMO_DOMAIN}"
EMPLOYER_EMAIL = f"employeur@{DEMO_DOMAIN}"
SEEKER_EMAIL = f"candidat@{DEMO_DOMAIN}"

_NOW = datetime.now(timezone.utc)

# --- Employers -------------------------------------------------------------
# (email, company name, activity verified)
EMPLOYERS: list[tuple[str, str, bool]] = [
    (EMPLOYER_EMAIL, "Numérique Océan", True),
    (f"recrutement.quatre-epis@{DEMO_DOMAIN}", "Boulangerie Les Quatre Épis", True),
    (f"contact.rivedoux@{DEMO_DOMAIN}", "Atelier Rivedoux", True),
    (f"rh.vallee-verte@{DEMO_DOMAIN}", "Transports Vallée Verte", True),
    (f"emploi.parc-fleuri@{DEMO_DOMAIN}", "Clinique du Parc Fleuri", True),
    (f"saisons.ventoux@{DEMO_DOMAIN}", "Coopérative Maraîchère du Ventoux", True),
    (f"carrieres.belle-escale@{DEMO_DOMAIN}", "Groupe Hôtelier Belle Escale", True),
    (f"atelier.saint-eloi@{DEMO_DOMAIN}", "Fonderie Saint-Éloi", False),
    (f"librairie.fil-rouge@{DEMO_DOMAIN}", "Librairie Le Fil Rouge", True),
    (f"chantiers.ecorenov@{DEMO_DOMAIN}", "EcoRénov Habitat", False),
]

# --- Job seekers -----------------------------------------------------------
# (email, first name, last name, skills, experience, availability)
SEEKERS: list[tuple[str, str, str, list[str], str, date]] = [
    (
        SEEKER_EMAIL,
        "Camille",
        "Fontaine",
        ["Python", "FastAPI", "PostgreSQL", "Git"],
        "Quatre ans de développement back-end dans une PME de logistique, "
        "puis une année de reconversion vers les données géographiques.",
        date(2026, 10, 1),
    ),
    (
        f"nadia.belkacem@{DEMO_DOMAIN}",
        "Nadia",
        "Belkacem",
        ["Accueil", "Gestion de planning", "Anglais courant"],
        "Six ans de réception en hôtellerie saisonnière sur la Côte d'Azur.",
        date(2026, 9, 15),
    ),
    (
        f"yann.moreau@{DEMO_DOMAIN}",
        "Yann",
        "Moreau",
        ["Maintenance industrielle", "Soudure", "Habilitation électrique B1V"],
        "Douze ans de maintenance en fonderie, dont trois comme chef d'équipe.",
        date(2026, 9, 8),
    ),
    (
        f"lea.tavares@{DEMO_DOMAIN}",
        "Léa",
        "Tavares",
        ["Vente", "Conseil client", "Caisse"],
        "Deux ans en librairie indépendante, en alternance avec une licence "
        "de lettres modernes.",
        date(2026, 11, 3),
    ),
]

# --- Job offers ------------------------------------------------------------
# (company, title, description, address, city, latitude, longitude)
JOBS: list[tuple[str, str, str, str, str, float, float]] = [
    (
        "Numérique Océan",
        "Développeur·euse back-end Python",
        "Conception et maintenance des API d'une plateforme de suivi "
        "logistique. Stack FastAPI, PostgreSQL et PostGIS. Deux jours de "
        "télétravail par semaine.",
        "12 quai de la Fosse, 44000 Nantes",
        "Nantes",
        47.2098,
        -1.5674,
    ),
    (
        "Numérique Océan",
        "Chargé·e de support applicatif",
        "Premier niveau de support auprès des collectivités utilisatrices : "
        "qualification des incidents, rédaction des fiches de suivi, "
        "accompagnement des nouveaux comptes.",
        "12 quai de la Fosse, 44000 Nantes",
        "Nantes",
        47.2098,
        -1.5674,
    ),
    (
        "Boulangerie Les Quatre Épis",
        "Boulanger·ère",
        "Fabrication des pains au levain et des viennoiseries pour deux "
        "points de vente. Prise de poste à 4 h, deux jours de repos "
        "consécutifs.",
        "8 rue Esquermoise, 59800 Lille",
        "Lille",
        50.6390,
        3.0611,
    ),
    (
        "Atelier Rivedoux",
        "Menuisier·ère d'agencement",
        "Fabrication sur mesure de mobilier de commerce en atelier, pose "
        "ponctuelle sur chantier en Charente-Maritime.",
        "5 rue du Port, 17000 La Rochelle",
        "La Rochelle",
        46.1558,
        -1.1521,
    ),
    (
        "Atelier Rivedoux",
        "Assistant·e administratif·ve",
        "Suivi des devis et des commandes fournisseurs, accueil téléphonique "
        "et préparation des éléments de paie pour un atelier de douze "
        "personnes.",
        "21 cours du Médoc, 33300 Bordeaux",
        "Bordeaux",
        44.8578,
        -0.5601,
    ),
    (
        "Transports Vallée Verte",
        "Chauffeur·euse poids lourd",
        "Distribution régionale en semi-remorque, tournées de jour au départ "
        "de Grenoble. Permis CE et FIMO à jour exigés.",
        "40 avenue de Vizille, 38000 Grenoble",
        "Grenoble",
        45.1846,
        5.7141,
    ),
    (
        "Clinique du Parc Fleuri",
        "Infirmier·ère de bloc opératoire",
        "Intégration d'une équipe de bloc de six personnes en chirurgie "
        "ambulatoire. Diplôme d'État requis, formation IBODE prise en charge.",
        "3 allée Jean Jaurès, 31000 Toulouse",
        "Toulouse",
        43.6108,
        1.4467,
    ),
    (
        "Coopérative Maraîchère du Ventoux",
        "Agent·e de conditionnement",
        "Tri, calibrage et mise en cagette des fruits de saison. Contrat "
        "saisonnier de six mois, formation assurée sur place.",
        "18 route de Morières, 84000 Avignon",
        "Avignon",
        43.9352,
        4.8320,
    ),
    (
        "Groupe Hôtelier Belle Escale",
        "Réceptionniste de nuit",
        "Accueil des clients, clôture des caisses et rondes de sécurité dans "
        "un établissement de 80 chambres. Anglais courant demandé.",
        "27 promenade des Anglais, 06000 Nice",
        "Nice",
        43.6952,
        7.2650,
    ),
    (
        "Fonderie Saint-Éloi",
        "Technicien·ne de maintenance",
        "Maintenance préventive et curative des fours et des lignes de "
        "moulage. Astreinte une semaine sur quatre.",
        "14 rue des Messageries, 57000 Metz",
        "Metz",
        49.1130,
        6.1780,
    ),
    (
        "Librairie Le Fil Rouge",
        "Libraire rayon jeunesse",
        "Conseil aux lecteurs, réception des offices et animation des "
        "rencontres scolaires du mercredi.",
        "9 rue des Orfèvres, 67000 Strasbourg",
        "Strasbourg",
        48.5817,
        7.7480,
    ),
    (
        "EcoRénov Habitat",
        "Poseur·euse d'isolation thermique",
        "Chantiers de rénovation énergétique chez des particuliers en "
        "Ille-et-Vilaine. Véhicule de service fourni.",
        "62 boulevard de Metz, 35000 Rennes",
        "Rennes",
        48.1173,
        -1.6778,
    ),
]

# --- Applications ----------------------------------------------------------
# (seeker email, company, job title, status, days since it was sent)
APPLICATIONS: list[tuple[str, str, str, str, int]] = [
    (SEEKER_EMAIL, "Numérique Océan", "Développeur·euse back-end Python", "under_review", 6),
    (SEEKER_EMAIL, "Numérique Océan", "Chargé·e de support applicatif", "sent", 2),
    (SEEKER_EMAIL, "Atelier Rivedoux", "Assistant·e administratif·ve", "rejected", 21),
    (f"nadia.belkacem@{DEMO_DOMAIN}", "Groupe Hôtelier Belle Escale", "Réceptionniste de nuit", "accepted", 12),
    (f"yann.moreau@{DEMO_DOMAIN}", "Fonderie Saint-Éloi", "Technicien·ne de maintenance", "under_review", 9),
    (f"lea.tavares@{DEMO_DOMAIN}", "Librairie Le Fil Rouge", "Libraire rayon jeunesse", "sent", 4),
]


def _get_or_create_user(session: Session, email: str, role: str) -> User:
    """Return the account for `email`, creating it with the demo password if
    it is missing. An existing account is never modified: hashing only happens
    on the insert path, which also keeps repeat runs fast."""
    user = session.scalar(select(User).where(User.email == email))
    if user is not None:
        return user
    user = User(email=email, password_hash=hash_password(DEMO_PASSWORD), role=role)
    session.add(user)
    session.flush()
    return user


def _seed_admin(session: Session) -> None:
    # The API deliberately refuses to register an admin (see app/schemas.py),
    # so the demo administrator can only come from here.
    _get_or_create_user(session, ADMIN_EMAIL, "admin")


def _seed_employers(session: Session) -> dict[str, Employer]:
    employers: dict[str, Employer] = {}
    for email, company_name, verified in EMPLOYERS:
        user = _get_or_create_user(session, email, "employer")
        employer = session.get(Employer, user.id)
        if employer is None:
            employer = Employer(
                user_id=user.id, company_name=company_name, activity_verified=verified
            )
            session.add(employer)
            session.flush()
        employers[company_name] = employer
    return employers


def _seed_seekers(session: Session) -> dict[str, JobSeeker]:
    seekers: dict[str, JobSeeker] = {}
    for email, first_name, last_name, skills, experience, availability in SEEKERS:
        user = _get_or_create_user(session, email, "seeker")
        seeker = session.get(JobSeeker, user.id)
        if seeker is None:
            seeker = JobSeeker(
                user_id=user.id,
                first_name=first_name,
                last_name=last_name,
                skills=skills,
                experience=experience,
                availability=availability,
            )
            session.add(seeker)
            session.flush()
        seekers[email] = seeker
    return seekers


def _seed_jobs(session: Session, employers: dict[str, Employer]) -> dict[tuple[str, str], Job]:
    jobs: dict[tuple[str, str], Job] = {}
    for company, title, description, address, city, lat, lng in JOBS:
        employer = employers[company]
        existing = session.scalar(
            select(Job).where(Job.employer_id == employer.user_id, Job.title == title)
        )
        if existing is None:
            existing = Job(
                employer_id=employer.user_id,
                title=title,
                description=description,
                location_address=address,
                location_city=city,
                location=from_shape(Point(lng, lat), srid=4326),
                # The coordinates are shipped with the dataset, so the seed
                # never calls the Adresse API: it must work offline and in CI.
                geocoding_source="chomagego-demo-seed",
                geocoding_score=1.0,
                geocoded_at=_NOW,
                location_status="geocoded",
            )
            session.add(existing)
            session.flush()
        jobs[(company, title)] = existing
    return jobs


def _seed_applications(
    session: Session,
    seekers: dict[str, JobSeeker],
    jobs: dict[tuple[str, str], Job],
) -> None:
    for email, company, title, status, days_ago in APPLICATIONS:
        seeker = seekers[email]
        job = jobs[(company, title)]
        existing = session.scalar(
            select(Application).where(
                Application.job_id == job.id,
                Application.job_seeker_id == seeker.user_id,
            )
        )
        if existing is None:
            session.add(
                Application(
                    job_id=job.id,
                    job_seeker_id=seeker.user_id,
                    status=status,
                    created_at=_NOW - timedelta(days=days_ago),
                )
            )
    session.flush()


def seed(session: Session) -> None:
    """Insert whatever is missing, leaving every existing row untouched."""
    _seed_admin(session)
    employers = _seed_employers(session)
    seekers = _seed_seekers(session)
    jobs = _seed_jobs(session, employers)
    _seed_applications(session, seekers, jobs)
    session.commit()


def main() -> None:
    with SessionLocal() as session:
        seed(session)
        counts = {
            "users": len(session.scalars(select(User.id)).all()),
            "employers": len(session.scalars(select(Employer.user_id)).all()),
            "job_seekers": len(session.scalars(select(JobSeeker.user_id)).all()),
            "jobs": len(session.scalars(select(Job.id)).all()),
            "applications": len(session.scalars(select(Application.id)).all()),
        }
    summary = ", ".join(f"{name}={count}" for name, count in counts.items())
    print(f"[seed] demo dataset ready: {summary}")
    print(f"[seed] demo accounts: {ADMIN_EMAIL}, {EMPLOYER_EMAIL}, {SEEKER_EMAIL}")


if __name__ == "__main__":
    main()
