"""Applying to an offer, and handling the applications an offer received.

Brief: applying requires an authenticated job seeker, the seeker's profile is
transmitted to the employer, and the employer is notified on every new
application.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.deps import CurrentEmployer, CurrentSeeker, DbSession
from app.models import Application, Job, JobSeeker, Notification
from app.schemas import (
    ApplicationCreateIn,
    ApplicationStatusIn,
    EmployerApplicationOut,
    SeekerApplicationOut,
    SeekerProfileOut,
)

router = APIRouter(prefix="/api", tags=["applications"])

STATUS_LABELS = {
    "sent": "envoyée",
    "under_review": "en cours d'examen",
    "accepted": "acceptée",
    "rejected": "refusée",
}


def _profile_of(seeker: JobSeeker) -> SeekerProfileOut:
    return SeekerProfileOut(
        first_name=seeker.first_name,
        last_name=seeker.last_name,
        email=seeker.user.email,
        skills=list(seeker.skills),
        experience=seeker.experience,
        availability=seeker.availability,
    )


def _to_employer_out(application: Application) -> EmployerApplicationOut:
    return EmployerApplicationOut(
        id=application.id,
        job_id=application.job_id,
        job_title=application.job.title,
        status=application.status,
        created_at=application.created_at,
        updated_at=application.updated_at,
        applicant=_profile_of(application.job_seeker),
    )


@router.post(
    "/candidatures",
    response_model=SeekerApplicationOut,
    status_code=status.HTTP_201_CREATED,
)
def apply_to_offer(
    payload: ApplicationCreateIn, user: CurrentSeeker, db: DbSession
) -> SeekerApplicationOut:
    """Apply to an offer. The seeker's profile is what reaches the employer,
    so there is nothing to send beyond the offer id."""
    job = db.get(Job, payload.job_id)
    if job is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cette offre n'existe plus.")
    if job.expires_at <= datetime.now(timezone.utc):
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Cette offre est archivée et n'accepte plus de candidature."
        )

    already = db.scalar(
        select(Application).where(
            Application.job_id == job.id, Application.job_seeker_id == user.id
        )
    )
    if already is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Vous avez déjà postulé à cette offre."
        )

    application = Application(job_id=job.id, job_seeker_id=user.id, status="sent")
    db.add(application)

    # Brief: the employer is notified on each new application. Same
    # transaction as the application itself, so a notification can never
    # describe an application that was rolled back.
    seeker = db.get(JobSeeker, user.id)
    applicant_name = f"{seeker.first_name} {seeker.last_name}" if seeker else user.email
    db.add(
        Notification(
            user_id=job.employer_id,
            type="application_received",
            title="Nouvelle candidature",
            body=f"{applicant_name} a postulé à l'offre « {job.title} ».",
            job_id=job.id,
        )
    )

    db.commit()
    db.refresh(application)

    return SeekerApplicationOut(
        id=application.id,
        job_id=job.id,
        job_title=job.title,
        company=job.employer.company_name,
        city=job.location_city,
        status=application.status,
        created_at=application.created_at,
        updated_at=application.updated_at,
    )


@router.get("/offres/{offer_id}/candidatures", response_model=list[EmployerApplicationOut])
def offer_applications(
    offer_id: int, user: CurrentEmployer, db: DbSession
) -> list[EmployerApplicationOut]:
    """Applicants for one of the employer's own offers, profile included."""
    job = db.get(Job, offer_id)
    if job is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offre introuvable.")
    if job.employer_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Cette offre n'est pas la vôtre.")

    applications = db.scalars(
        select(Application)
        .options(
            joinedload(Application.job),
            joinedload(Application.job_seeker).joinedload(JobSeeker.user),
        )
        .where(Application.job_id == job.id)
        .order_by(Application.created_at.desc())
    ).all()

    return [_to_employer_out(application) for application in applications]


@router.patch("/candidatures/{application_id}", response_model=EmployerApplicationOut)
def update_application_status(
    application_id: int,
    payload: ApplicationStatusIn,
    user: CurrentEmployer,
    db: DbSession,
) -> EmployerApplicationOut:
    """Move an application through its lifecycle. Only the employer who owns
    the offer may do this; the seeker is notified of the outcome."""
    application = db.scalar(
        select(Application)
        .options(
            joinedload(Application.job),
            joinedload(Application.job_seeker).joinedload(JobSeeker.user),
        )
        .where(Application.id == application_id)
    )
    if application is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Candidature introuvable.")
    if application.job.employer_id != user.id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Cette candidature ne concerne pas vos offres."
        )

    if application.status != payload.status:
        application.status = payload.status
        db.add(
            Notification(
                user_id=application.job_seeker_id,
                type="application_status",
                title="Candidature mise à jour",
                body=(
                    f"Votre candidature à « {application.job.title} » est "
                    f"désormais {STATUS_LABELS[payload.status]}."
                ),
                job_id=application.job_id,
            )
        )
        db.commit()
        db.refresh(application)

    return _to_employer_out(application)
