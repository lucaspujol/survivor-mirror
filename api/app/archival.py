"""When a job offer stops being open to applications.

Brief §2.2: an offer is archived 30 days after publication. Archiving is a
read-time rule rather than a stored flag: the cutoff is computed whenever an
offer is looked at, so no state can go stale between two runs of a background
job, and an employer keeps seeing their own offers — labelled as archived —
instead of watching them disappear.

Lives in its own module so both the API surface and the application routes can
apply the same rule without importing each other.
"""

from datetime import datetime, timedelta, timezone

from app.models import Job

# Kept in sync with OFFER_LIFETIME_DAYS in web/src/lib/offers.ts.
OFFER_LIFETIME_DAYS = 30


def archival_cutoff() -> datetime:
    """Offers published before this instant are archived."""
    return datetime.now(timezone.utc) - timedelta(days=OFFER_LIFETIME_DAYS)


def is_archived(job: Job) -> bool:
    return job.created_at <= archival_cutoff()
