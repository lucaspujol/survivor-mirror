# GéoEmploi

Carte interactive d'offres d'emploi géolocalisées.

React + TypeScript + Vite · FastAPI (Python 3.12) · PostgreSQL 16

## Prérequis

Docker avec le plugin Compose v2 (`docker compose version`).
Ubuntu : `sudo apt install -y docker-compose-v2`

## Installation

```sh
cp .env.example .env
docker compose up --build
```

## Utilisation

```sh
docker compose up          # démarrer
docker compose up -d       # démarrer en arrière-plan
docker compose down        # arrêter
docker compose logs -f     # logs (ajouter api | web | db pour un service)
docker compose up --build  # après ajout d'une dépendance
```

| Service | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| API | http://localhost:8000/api/health |
| Swagger | http://localhost:8000/api/docs |
| PostgreSQL | localhost:5433 |

Hot reload actif des deux côtés, aucun rebuild nécessaire pour modifier le code.

## Support de l'éditeur

Les dépendances vivent dans les conteneurs : sans installation locale,
l'éditeur signale des imports introuvables. Pour l'autocomplétion et le
typage :

```sh
cd web && npm install
cd api && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
```

Sans effet sur les conteneurs, qui gardent leurs propres dépendances.
