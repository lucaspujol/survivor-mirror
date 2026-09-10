"""Role-scoped listings behind the signed-in screens.

Each endpoint is restricted to the role that owns the data and only ever
returns rows belonging to the caller, so the three demo accounts see three
different, non-empty screens.
"""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import joinedload

from app.archival import is_archived
from app.deps import CurrentAdmin, CurrentEmployer, CurrentSeeker, DbSession
from app.models import (
    Application,
    Employer,
    Job,
    JobSeeker,
    SeekerExperience,
    User,
)
from app.schemas import (
    AdminUserOut,
    EmployerOfferOut,
    SeekerApplicationOut,
    SeekerExperienceOut,
    SeekerProfileIn,
    SeekerProfileOut,
)

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


def _experiences_out(seeker: JobSeeker) -> list[SeekerExperienceOut]:
    """The seeker's positions, most recent first. A position still held sorts
    above finished ones started the same day."""
    ordered = sorted(
        seeker.experiences,
        key=lambda entry: (entry.start_date, entry.end_date is None),
        reverse=True,
    )
    return [
        SeekerExperienceOut(
            id=entry.id,
            position=entry.position,
            contract_type=entry.contract_type,
            company=entry.company,
            start_date=entry.start_date,
            end_date=entry.end_date,
            description=entry.description,
        )
        for entry in ordered
    ]


def _profile_out(seeker: JobSeeker) -> SeekerProfileOut:
    return SeekerProfileOut(
        first_name=seeker.first_name,
        last_name=seeker.last_name,
        skills=list(seeker.skills),
        experiences=_experiences_out(seeker),
        availability=seeker.availability,
    )


def _get_own_profile(user: User, db: DbSession) -> JobSeeker:
    seeker = db.get(JobSeeker, user.id)
    if seeker is None:
        # The profile row is created with the account, so its absence is a
        # broken account rather than a bad request.
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR, "Job seeker profile is missing"
        )
    return seeker


@router.get("/profil", response_model=SeekerProfileOut)
def my_profile(user: CurrentSeeker, db: DbSession) -> SeekerProfileOut:
    """The signed-in job seeker's professional profile."""
    return _profile_out(_get_own_profile(user, db))


@router.put("/profil", response_model=SeekerProfileOut)
def update_my_profile(
    payload: SeekerProfileIn, user: CurrentSeeker, db: DbSession
) -> SeekerProfileOut:
    """Replace the signed-in job seeker's profile.

    Brief §2.1 asks for the *management* of a professional profile, not just
    its creation: skills, experience and availability are what an employer
    reads next to an application, and until now only the seed could write
    them.

    PUT rather than PATCH: the form submits the whole profile, so emptying a
    field has to mean emptying it.
    """
    seeker = _get_own_profile(user, db)

    seeker.first_name = payload.first_name.strip()
    seeker.last_name = payload.last_name.strip()
    # Blank entries and duplicates come from the way the form is filled in,
    # not from anything the job seeker meant to declare. Order is kept: it is
    # the order they chose to present themselves in.
    seen: set[str] = set()
    skills: list[str] = []
    for raw in payload.skills:
        skill = raw.strip()
        if skill and skill.lower() not in seen:
            seen.add(skill.lower())
            skills.append(skill)
    seeker.skills = skills
    # The whole list is replaced. Matching entries one by one would need
    # stable ids from the form, and buys nothing: these rows carry no history.
    seeker.experiences.clear()
    for entry in payload.experiences:
        seeker.experiences.append(
            SeekerExperience(
                position=entry.position.strip(),
                contract_type=entry.contract_type,
                company=entry.company.strip(),
                start_date=entry.start_date,
                end_date=entry.end_date,
                description=(entry.description or "").strip() or None,
            )
        )

    seeker.availability = payload.availability

    db.commit()
    db.refresh(seeker)
    return _profile_out(seeker)


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
            work_mode=job.work_mode,
            time_commitment=job.time_commitment,
            city=job.location_city,
            address=job.location_address,
            location_status=job.location_status,
            application_count=application_count,
            view_count=job.view_count,
            archived=is_archived(job),
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
