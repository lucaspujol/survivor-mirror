"""Outgoing notifications.

Brief §2.2: the employer must be notified of every new application. What
travels by mail is deliberately thin - the offer's title and a link back into
the application, never the candidate's name, phone number or documents.
Personal data stays inside the platform, where the employer is already
authenticated to read it; a mailbox is somewhere we do not control, and
minimisation is the rule this project states at the top of its data model.

Sending is best-effort. A notification that fails must never turn a recorded
application into an error for the candidate, so every failure is logged and
swallowed by `send_email`.
"""

import logging
import smtplib
from email.message import EmailMessage

from app.config import get_settings

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, body: str) -> bool:
    """Send one plain-text mail. Returns whether it went out.

    With no `smtp_host` configured the mail is dropped and reported as not
    sent: an environment without a mail server (a bare `uvicorn`, a test run)
    should stay silent rather than raise.
    """
    settings = get_settings()
    if not settings.smtp_host:
        logger.info("No SMTP host configured, skipping mail to %s", to)
        return False

    message = EmailMessage()
    message["From"] = settings.mail_from
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)

    try:
        # Short timeout: this runs in a background task, but a hung connection
        # would still tie up a worker thread until the socket gives up.
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
            smtp.send_message(message)
    except (smtplib.SMTPException, OSError):
        logger.exception("Could not send mail to %s", to)
        return False

    logger.info("Sent %r to %s", subject, to)
    return True


def notify_new_application(employer_email: str, job_title: str) -> bool:
    """Tell an employer that one of their offers received an application.

    Says which offer and nothing about who applied: the employer opens the
    application to see that.
    """
    settings = get_settings()
    body = (
        f"Bonjour,\n\n"
        f"Vous avez reçu une nouvelle candidature pour votre offre "
        f"« {job_title} ».\n\n"
        f"Consultez-la depuis votre espace : {settings.app_base_url}/mes-offres\n\n"
        f"-- \n"
        f"GéoEmploi - message automatique, merci de ne pas y répondre."
    )
    return send_email(
        to=employer_email,
        subject=f"Nouvelle candidature - {job_title}",
        body=body,
    )
