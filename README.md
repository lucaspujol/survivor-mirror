# GéoEmploi

Interactive map of geolocated job offers.

React + TypeScript + Vite · FastAPI (Python 3.12) · PostgreSQL 16 + PostGIS

## Requirements

Docker with the Compose v2 plugin (`docker compose version`).
Ubuntu: `sudo apt install -y docker-compose-v2`

## Setup

```sh
cp .env.example .env
docker compose up --build
```

## Usage

```sh
docker compose up          # start
docker compose up -d       # start in the background
docker compose down        # stop
docker compose logs -f     # logs (add api | web | db for a single service)
docker compose up --build -V  # after adding a dependency
```

| Service | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| API | http://localhost:8000/api/health |
| Swagger | http://localhost:8000/api/docs |
| PostgreSQL | localhost:5433 |

Alembic migrations are applied automatically when the API starts. The schema
and the migration commands are documented in [docs/database.md](docs/database.md).

Hot reload is active on both sides; no rebuild is needed to change code.

`-V` (`--renew-anon-volumes`) is required after adding a frontend dependency:
without it the anonymous volume keeps the old `node_modules` and Vite cannot
find the new packages. The database (a named volume) is unaffected.

## Editor support

Dependencies live inside the containers, so without a local install your editor
reports unresolved imports. For autocompletion and type checking:

```sh
cd web && npm install
cd api && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
```

This has no effect on the containers, which keep their own dependencies.
