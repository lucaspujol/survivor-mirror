# GéoEmploi - demo build

This directory is the `geoemploi-demo-build` artifact produced by GitHub
Actions. It contains the **compiled** frontend, the API sources with their
migrations, and a Compose file that wires them together. Running it does not
require the repository, a Node toolchain or a Python toolchain.

Build provenance is recorded in [`BUILD-INFO.txt`](BUILD-INFO.txt).

## Requirements

Docker with the Compose v2 plugin (`docker compose version`) and network
access, so the base images and the Python dependencies can be downloaded.

## Start

```sh
docker compose up --build
```

The API applies the Alembic migrations, loads the demo dataset, then starts;
nginx serves the compiled frontend once the API answers its health check.
First run takes a few minutes (image downloads); later runs take seconds.

| Service | URL |
| --- | --- |
| Application | http://localhost:8080 |
| API health | http://localhost:8000/api/health |
| Swagger | http://localhost:8000/api/docs |
| Boîte mail de démo | http://localhost:8025 |

The stack runs [mailpit](https://mailpit.axllent.org/), which captures the
notification mails instead of delivering them: nothing is ever sent to a real
address, and no mail account is needed to run the demo.

Stop with `docker compose down`, or `docker compose down -v` to also drop the
database and start again from a blank one.

## Demo accounts

One account per role handled by the application. They are created by the seed
and are already filled in with a profile, offers or applications.

| Role | Email | Password |
| --- | --- | --- |
| Job seeker (`seeker`) | `candidat@demo.geoemploi.example` | `geoemploi2026!` |
| Employer (`employer`) | `employeur@demo.geoemploi.example` | `geoemploi2026!` |
| Administrator (`admin`) | `admin@demo.geoemploi.example` | `geoemploi2026!` |

The administrator matters: the API deliberately refuses to register an `admin`
(`api/app/schemas.py`), so this account can only come from the seed.

> The password above is a **fictional placeholder for the demo**, published on
> purpose and shared by every seeded account. It protects nothing and must
> never be reused. The same goes for `JWT_SECRET` and the database password in
> `compose.yaml`: replace them before anything leaves a demo machine.

The secondary seeded accounts (other employers, other job seekers) use the same
password and the same `@demo.geoemploi.example` domain, reserved by RFC 2606:
it cannot be registered and no mail can ever reach it.

## Demo walkthrough

1. Open http://localhost:8080 - the map shows the seeded offers across France,
   clustered; zooming refetches only the visible bounds.
2. Click a marker: the popup gives the job title and the company. Signed out,
   the page invites you to sign in as an employer to publish.
3. Sign in as `candidat@demo.geoemploi.example` - the sidebar shows
   *Mes candidatures*, listing Camille Fontaine's three applications with the
   offer, the company, the city, the status and the dates.
4. Still signed in as the job seeker, open an offer from the map and click
   *Postuler*: fill in the form, attach a CV, and send. The application
   appears in *Mes candidatures*, and the employer is notified by mail -
   open http://localhost:8025 to read it. The mail names the offer and links
   back to the employer's dashboard; it deliberately carries no name, phone
   number or attachment, so nothing personal leaves the platform.
5. Sign in as `employeur@demo.geoemploi.example` - the sidebar shows
   *Mes offres*, listing the two offers of *Numérique Océan* and the
   applications each has received. The publish form appears under the map.
6. Publish an offer from that form. The address field autocompletes through
   the government Adresse API, so this step needs internet access; the offer
   is attached to the signed-in employer and the new marker appears without a
   reload.
7. Sign in as `admin@demo.geoemploi.example` - the *Administration* section
   appears with *Utilisateurs*, the read-only list of the 15 accounts, their
   role and their activity.

Every section is restricted to the role that owns it, in the interface **and**
in the API: an address that a role cannot open shows the 404 page, and the
matching endpoint answers 401 signed out or 403 with the wrong role. Only an
employer can publish an offer.

## Dataset

Twelve job offers from ten fictional companies, placed on real municipal
coordinates (Nantes, Lille, La Rochelle, Bordeaux, Grenoble, Toulouse,
Avignon, Nice, Metz, Strasbourg, Rennes), four job seekers and six
applications spread over the four statuses.

Everything is invented: the companies, the people and the offers do not exist.
No real personal data is shipped. Only the municipal coordinates are real, and
they are public geographic facts.

## Contents

| Path | What it is |
| --- | --- |
| `web/dist/` | Compiled frontend (Vite production build) |
| `web/Dockerfile`, `web/nginx.conf` | nginx image serving `dist/` and proxying `/api` |
| `api/` | API sources, Alembic migrations, `requirements.txt`, Dockerfile |
| `compose.yaml` | The three-service demo stack |
| `BUILD-INFO.txt` | Commit, branch, build date, workflow run |
