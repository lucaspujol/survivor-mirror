# ChômageGo

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

The demo dataset is loaded right after the migrations, so a fresh stack already
has offers on the map and the accounts listed below.

## Demo accounts

Seeded by [`api/app/seed.py`](api/app/seed.py), one per role the application
handles, already filled in with a profile, offers or applications.

| Role | Email | Password |
| --- | --- | --- |
| Job seeker (`seeker`) | `candidat@demo.chomagego.example` | `ChomageGo2026!` |
| Employer (`employer`) | `employeur@demo.chomagego.example` | `ChomageGo2026!` |
| Administrator (`admin`) | `admin@demo.chomagego.example` | `ChomageGo2026!` |

The administrator can only come from the seed: `/api/auth/register` refuses the
`admin` role on purpose (see [`api/app/schemas.py`](api/app/schemas.py)).

> This password is a **fictional placeholder for the demo**, published on
> purpose and shared by every seeded account. It protects nothing. The
> `@demo.chomagego.example` domain is reserved by RFC 2606 and can never
> receive mail, and the seeded companies, people and offers are all invented.

The seed is idempotent — running it again creates no duplicate and deletes
nothing — so it can be replayed at any time:

```sh
docker compose exec api python -m app.seed
```

## Demo build artifact

Every run of the CI workflow publishes a `chomagego-demo-build` artifact
containing the compiled frontend, the API with its migrations and a Compose
file that runs the prototype **without this repository**.

Download it from the run page (*Actions* → the run → *Artifacts*), then:

```sh
unzip chomagego-demo-build.zip -d chomagego-demo
cd chomagego-demo
docker compose up --build   # then open http://localhost:8080
```

`DEMO.md` inside the artifact documents the accounts and the walkthrough. The
same bundle is produced locally by:

```sh
./scripts/build-demo-bundle.sh   # -> build/chomagego-demo-build/
```

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
