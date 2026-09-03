"""Role-scoped listings behind the signed-in screens.

Each endpoint is restricted to the role that owns the data and only ever
returns rows belonging to the caller, so the three demo accounts see three
different, non-empty screens.
"""

from fastapi import APIRouter
from sqlalchemy import func, select
from sqlalchemy.orm import joinedload

from app.deps import CurrentAdmin, CurrentEmployer, CurrentSeeker, DbSession
from app.models import Application, Employer, Job, JobSeeker, User
from app.schemas import AdminUserOut, EmployerOfferOut, SeekerApplicationOut

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/candidatures", response_model=list[SeekerApplicationOut])
def my_applications(user: CurrentSeeker, db: DbSession) -> list[SeekerApplicationOut]:
    """The signed-in job seeker's applications, most recent first."""
    applications = db.scalars(
        select(Application)
        .options(joinedload(Application.job).joinedload(Job.employer))
        .where(Application.job_seeker_id == user.id)
        .order_by(Application.created_at.desc())
    ).all()

    return [
        SeekerApplicationOut(
            id=application.id,
            job_id=application.job.id,
            job_title=application.job.title,
            company=application.job.employer.company_name,
            city=application.job.location_city,
            status=application.status,
            created_at=application.created_at,
            updated_at=application.updated_at,
        )
        for application in applications
    ]


@router.get("/mes-offres", response_model=list[EmployerOfferOut])
def my_offers(user: CurrentEmployer, db: DbSession) -> list[EmployerOfferOut]:
    """The signed-in employer's offers, with how many applications each one
    has received."""
    counts = (
        select(Application.job_id, func.count(Application.id).label("total"))
        .group_by(Application.job_id)
        .subquery()
    )
    rows = db.execute(
        select(Job, func.coalesce(counts.c.total, 0))
        .outerjoin(counts, counts.c.job_id == Job.id)
        .where(Job.employer_id == user.id)
        .order_by(Job.created_at.desc(), Job.id.desc())
    ).all()

    return [
        EmployerOfferOut(
            id=job.id,
            title=job.title,
            description=job.description,
            contract_type=job.contract_type,
            contract_duration=job.contract_duration,
            city=job.location_city,
            address=job.location_address,
            location_status=job.location_status,
            application_count=application_count,
            created_at=job.created_at,
        )
        for job, application_count in rows
    ]


@router.get("/admin/utilisateurs", response_model=list[AdminUserOut])
def list_users(_admin: CurrentAdmin, db: DbSession) -> list[AdminUserOut]:
    """Every account, with the name carried by its profile row. Read-only:
    the prototype has no account administration yet."""
    offer_counts = (
        select(Job.employer_id, func.count(Job.id).label("total"))
        .group_by(Job.employer_id)
        .subquery()
    )
    application_counts = (
        select(Application.job_seeker_id, func.count(Application.id).label("total"))
        .group_by(Application.job_seeker_id)
        .subquery()
    )

    rows = db.execute(
        select(
            User,
            JobSeeker,
            Employer,
            func.coalesce(offer_counts.c.total, 0),
            func.coalesce(application_counts.c.total, 0),
        )
        .outerjoin(JobSeeker, JobSeeker.user_id == User.id)
        .outerjoin(Employer, Employer.user_id == User.id)
        .outerjoin(offer_counts, offer_counts.c.employer_id == User.id)
        .outerjoin(application_counts, application_counts.c.job_seeker_id == User.id)
        .order_by(User.role, User.id)
    ).all()

    users: list[AdminUserOut] = []
    for user, seeker, employer, offer_count, application_count in rows:
        if seeker is not None:
            display_name = f"{seeker.first_name} {seeker.last_name}"
        elif employer is not None:
            display_name = employer.company_name
        else:
            # Admins have no profile row: the account is the whole record.
            display_name = user.email
        users.append(
            AdminUserOut(
                id=user.id,
                email=user.email,
                role=user.role,
                display_name=display_name,
                activity_verified=employer.activity_verified if employer else None,
                offer_count=offer_count,
                application_count=application_count,
                created_at=user.created_at,
            )
        )
    return users
