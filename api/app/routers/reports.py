"""Reporting an offer, and the moderation queue behind it.

Brief §5: the employer is responsible for the content of an offer, and users
must be able to report offers that are fraudulent or non-compliant.
"""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import joinedload

from app.deps import CurrentAdmin, CurrentUser, DbSession
from app.models import Job, Report
from app.schemas import ReportCreateIn, ReportOut, ReportStatusIn

router = APIRouter(prefix="/api", tags=["reports"])


def _to_report_out(report: Report) -> ReportOut:
    return ReportOut(
        id=report.id,
        job_id=report.job_id,
        job_title=report.job.title,
        company=report.job.employer.company_name,
        reason=report.reason,
        details=report.details,
        status=report.status,
        reporter_email=report.reporter.email,
        created_at=report.created_at,
    )


@router.post(
    "/signalements", response_model=ReportOut, status_code=status.HTTP_201_CREATED
)
def report_offer(payload: ReportCreateIn, user: CurrentUser, db: DbSession) -> ReportOut:
    """Flag an offer for moderation. Any signed-in account may report, so a
    seeker, an employer who spots a competitor's fraud, or an admin can all
    file one. Reporting twice is refused rather than silently duplicated."""
    job = db.get(Job, payload.job_id)
    if job is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cette offre n'existe plus.")

    already = db.scalar(
        select(Report).where(Report.job_id == job.id, Report.reporter_id == user.id)
    )
    if already is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Vous avez déjà signalé cette offre."
        )

    report = Report(
        job_id=job.id,
        reporter_id=user.id,
        reason=payload.reason,
        details=payload.details,
        status="pending",
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return _to_report_out(report)


@router.get("/admin/signalements", response_model=list[ReportOut])
def list_reports(_admin: CurrentAdmin, db: DbSession) -> list[ReportOut]:
    """The moderation queue: pending reports first, newest first within each
    status."""
    reports = db.scalars(
        select(Report)
        .options(joinedload(Report.job).joinedload(Job.employer), joinedload(Report.reporter))
        .order_by(
            # 'pending' sorts before the resolved ones whatever the alphabet says.
            func.coalesce(Report.status, "").notin_(["pending"]),
            Report.created_at.desc(),
        )
    ).all()
    return [_to_report_out(report) for report in reports]


@router.patch("/admin/signalements/{report_id}", response_model=ReportOut)
def update_report_status(
    report_id: int, payload: ReportStatusIn, _admin: CurrentAdmin, db: DbSession
) -> ReportOut:
    """Mark a report as handled or unfounded. Deleting the offending offer is
    a separate call (DELETE /api/offres/{id}), which an admin may already
    make on any offer."""
    report = db.scalar(
        select(Report)
        .options(joinedload(Report.job).joinedload(Job.employer), joinedload(Report.reporter))
        .where(Report.id == report_id)
    )
    if report is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Signalement introuvable.")

    report.status = payload.status
    db.commit()
    db.refresh(report)
    return _to_report_out(report)
