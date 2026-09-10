"""Applying to an offer, and reading applications from both sides.

The two sides never share an endpoint: a job seeker reads their own
applications, an employer reads the candidates of the offers they published.
Ownership is checked on every route, so an id guessed from another account's
screen returns 404 rather than someone else's personal data.
"""

from fastapi import (
    APIRouter,
    BackgroundTasks,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload

from app import storage
from app.archival import is_archived
from app.mail import notify_new_application
from app.deps import CurrentEmployer, CurrentSeeker, CurrentUser, DbSession
from app.routers.dashboard import _experiences_out
from app.models import Application, ApplicationDocument, Job, JobSeeker
from app.schemas import (
    ApplicationDocumentOut,
    ApplicationStatusIn,
    EmployerApplicantOut,
    SeekerApplicationDetailOut,
)

router = APIRouter(prefix="/api", tags=["applications"])


def _documents_of(application: Application) -> list[ApplicationDocumentOut]:
    # CV first, cover letter second: the order the form asks for them.
    ordered = sorted(application.documents, key=lambda doc: doc.kind != "cv")
    return [
        ApplicationDocumentOut(
            id=document.id,
            kind=document.kind,
            original_name=document.original_name,
            mime_type=document.mime_type,
            size_bytes=document.size_bytes,
        )
        for document in ordered
    ]


def _seeker_detail(application: Application) -> SeekerApplicationDetailOut:
    job = application.job
    return SeekerApplicationDetailOut(
        id=application.id,
        job_id=job.id,
        job_title=job.title,
        company=job.employer.company_name,
        city=job.location_city,
        status=application.status,
        created_at=application.created_at,
        updated_at=application.updated_at,
        first_name=application.first_name,
        last_name=application.last_name,
        phone=application.phone,
        message=application.message,
        contract_type=job.contract_type,
        work_mode=job.work_mode,
        address=job.location_address,
        job_description=job.description,
        documents=_documents_of(application),
    )


def _applicant(application: Application, seeker: JobSeeker) -> EmployerApplicantOut:
    return EmployerApplicantOut(
        id=application.id,
        job_id=application.job_id,
        job_title=application.job.title,
        status=application.status,
        first_name=application.first_name,
        last_name=application.last_name,
        email=seeker.user.email,
        phone=application.phone,
        message=application.message,
        skills=list(seeker.skills),
        experiences=_experiences_out(seeker),
        availability=seeker.availability,
        documents=_documents_of(application),
        created_at=application.created_at,
        updated_at=application.updated_at,
    )


@router.post(
    "/candidatures",
    response_model=SeekerApplicationDetailOut,
    status_code=status.HTTP_201_CREATED,
)
def apply_to_offer(
    user: CurrentSeeker,
    db: DbSession,
    background: BackgroundTasks,
    # multipart/form-data: the form carries files, so its scalar fields arrive
    # as form parts rather than as a JSON body.
    job_id: int = Form(...),
    first_name: str = Form(..., min_length=1),
    last_name: str = Form(..., min_length=1),
    phone: str | None = Form(None),
    message: str | None = Form(None),
    cv: UploadFile = File(...),
    cover_letter: UploadFile | None = File(None),
) -> SeekerApplicationDetailOut:
    """Send an application, with the CV required and the cover letter
    optional."""
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Offre {job_id} introuvable.")

    # An archived offer is off the map, but a stale tab or a direct call could
    # still post to it.
    if is_archived(job):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Cette offre est archivée : elle n'accepte plus de candidature.",
        )

    already = db.scalar(
        select(Application).where(
            Application.job_id == job_id, Application.job_seeker_id == user.id
        )
    )
    if already is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Vous avez déjà postulé à cette offre."
        )

    application = Application(
        job_id=job_id,
        job_seeker_id=user.id,
        first_name=first_name.strip(),
        last_name=last_name.strip(),
        phone=(phone or "").strip() or None,
        message=(message or "").strip() or None,
    )
    db.add(application)
    # The id names the directory the files are written to, so the row has to
    # exist before they are saved.
    db.flush()

    uploads = [("cv", cv)]
    if cover_letter is not None and cover_letter.filename:
        uploads.append(("cover_letter", cover_letter))

    saved_paths: list[str] = []
    try:
        for kind, upload in uploads:
            stored_path, size = storage.save_upload(upload, application.id, kind)
            saved_paths.append(stored_path)
            db.add(
                ApplicationDocument(
                    application_id=application.id,
                    kind=kind,
                    original_name=upload.filename or f"{kind}.pdf",
                    stored_path=stored_path,
                    mime_type=upload.content_type or "application/octet-stream",
                    size_bytes=size,
                )
            )
        db.commit()
    except Exception:
        # A rejected file must not leave the ones already written behind: the
        # transaction is rolled back, so nothing in the database points at them.
        db.rollback()
        for path in saved_paths:
            storage.delete_file(path)
        raise

    db.refresh(application)

    # Read before queueing: the session closes when the request ends, and the
    # background task would otherwise walk job -> employer -> user on a
    # detached instance.
    employer_email = job.employer.user.email
    job_title = job.title

    # Queued after the commit, so a mail only goes out for an application that
    # is actually stored, and off the request path: the candidate's answer must
    # not wait on an SMTP round trip, nor fail if the mail server is down.
    background.add_task(notify_new_application, employer_email, job_title)

    return _seeker_detail(application)


@router.get("/candidatures/{application_id}", response_model=SeekerApplicationDetailOut)
def my_application(
    application_id: int, user: CurrentSeeker, db: DbSession
) -> SeekerApplicationDetailOut:
    """One of the signed-in job seeker's applications, in full."""
    application = db.scalar(
        select(Application)
        .options(
            joinedload(Application.job).joinedload(Job.employer),
            selectinload(Application.documents),
        )
        .where(
            Application.id == application_id, Application.job_seeker_id == user.id
        )
    )
    if application is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, f"Candidature {application_id} introuvable."
        )
    return _seeker_detail(application)


@router.get(
    "/mes-offres/{offer_id}/candidatures", response_model=list[EmployerApplicantOut]
)
def offer_applicants(
    offer_id: int, user: CurrentEmployer, db: DbSession
) -> list[EmployerApplicantOut]:
    """The candidates who applied to one of the employer's own offers."""
    job = db.get(Job, offer_id)
    if job is None or job.employer_id != user.id:
        # 404 rather than 403 for someone else's offer: the employer has no
        # business learning whether that id exists.
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, f"Offre {offer_id} introuvable."
        )

    applications = db.scalars(
        select(Application)
        .options(
            joinedload(Application.job),
            joinedload(Application.job_seeker).joinedload(JobSeeker.user),
            # Without this the experiences of every candidate are fetched one
            # query at a time when the list is rendered.
            joinedload(Application.job_seeker).selectinload(JobSeeker.experiences),
            selectinload(Application.documents),
        )
        .where(Application.job_id == offer_id)
        .order_by(Application.created_at.desc())
    ).all()

    return [
        _applicant(application, application.job_seeker) for application in applications
    ]


@router.patch("/candidatures/{application_id}/statut", response_model=EmployerApplicantOut)
def update_application_status(
    application_id: int,
    payload: ApplicationStatusIn,
    user: CurrentEmployer,
    db: DbSession,
) -> EmployerApplicantOut:
    """Move an application through its lifecycle. Only the employer who
    published the offer decides."""
    application = db.scalar(
        select(Application)
        .options(
            joinedload(Application.job),
            joinedload(Application.job_seeker).joinedload(JobSeeker.user),
            # Without this the experiences of every candidate are fetched one
            # query at a time when the list is rendered.
            joinedload(Application.job_seeker).selectinload(JobSeeker.experiences),
            selectinload(Application.documents),
        )
        .where(Application.id == application_id)
    )
    if application is None or application.job.employer_id != user.id:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, f"Candidature {application_id} introuvable."
        )

    application.status = payload.status
    db.commit()
    db.refresh(application)
    return _applicant(application, application.job_seeker)


@router.get("/candidatures/{application_id}/documents/{document_id}")
def download_document(
    application_id: int, document_id: int, user: CurrentUser, db: DbSession
) -> FileResponse:
    """Serve a CV or a cover letter to the two people entitled to it: the
    candidate who sent it, and the employer who received it."""
    document = db.scalar(
        select(ApplicationDocument)
        .options(joinedload(ApplicationDocument.application).joinedload(Application.job))
        .where(
            ApplicationDocument.id == document_id,
            ApplicationDocument.application_id == application_id,
        )
    )
    if document is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document introuvable.")

    application = document.application
    is_owner = user.role == "seeker" and application.job_seeker_id == user.id
    is_recipient = user.role == "employer" and application.job.employer_id == user.id
    if not (is_owner or is_recipient):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document introuvable.")

    path = storage.absolute_path(document.stored_path)
    if not path.is_file():
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "Le fichier n'est plus disponible."
        )

    return FileResponse(
        path, media_type=document.mime_type, filename=document.original_name
    )
