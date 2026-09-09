"""Storage of the files attached to an application (CV, cover letter).

Files live on disk, under `UPLOADS_DIR`, and the database only keeps their
metadata. The name on disk is generated here: a candidate's filename is never
used to build a path, so a name like "../../etc/passwd" cannot escape the
uploads directory. The original name is kept in the database and only reappears
as the filename of a download.
"""

import os
import secrets
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

UPLOADS_DIR = Path(os.getenv("UPLOADS_DIR", "/app/uploads"))

# A CV or a cover letter is a document, not a media file: PDF and the two Word
# formats cover what candidates actually send.
ALLOWED_MIME_TYPES = {
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
}
ALLOWED_LABEL = "PDF, DOC ou DOCX"
MAX_FILE_SIZE = 5 * 1024 * 1024
MAX_FILE_SIZE_LABEL = "5 Mo"


def _extension_for(upload: UploadFile) -> str:
    """The extension to store the file under, from its declared type.

    Falls back to the uploaded name's suffix when the browser sends a generic
    content type, which some do for .doc files.
    """
    extension = ALLOWED_MIME_TYPES.get(upload.content_type or "")
    if extension is not None:
        return extension
    suffix = Path(upload.filename or "").suffix.lower()
    if suffix in set(ALLOWED_MIME_TYPES.values()):
        return suffix
    raise HTTPException(
        status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        f"Format de fichier non accepté : envoyez un {ALLOWED_LABEL}.",
    )


def save_upload(upload: UploadFile, application_id: int, kind: str) -> tuple[str, int]:
    """Write one uploaded file and return its path (relative to the uploads
    root) and its size in bytes.

    The size is checked while reading, in chunks: a client-declared
    Content-Length cannot be trusted, and a large file must not be buffered
    whole in memory before being rejected.
    """
    extension = _extension_for(upload)
    directory = UPLOADS_DIR / str(application_id)
    directory.mkdir(parents=True, exist_ok=True)

    relative_path = f"{application_id}/{kind}-{secrets.token_hex(8)}{extension}"
    destination = UPLOADS_DIR / relative_path

    size = 0
    with destination.open("wb") as target:
        while chunk := upload.file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_FILE_SIZE:
                target.close()
                destination.unlink(missing_ok=True)
                raise HTTPException(
                    status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    f"Fichier trop volumineux : {MAX_FILE_SIZE_LABEL} maximum.",
                )
            target.write(chunk)

    if size == 0:
        destination.unlink(missing_ok=True)
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Le fichier envoyé est vide.")

    return relative_path, size


def absolute_path(stored_path: str) -> Path:
    return UPLOADS_DIR / stored_path


def delete_file(stored_path: str) -> None:
    absolute_path(stored_path).unlink(missing_ok=True)


def delete_application_files(application_id: int) -> None:
    """Drop every file of one application, and the directory holding them.

    Deleting the row cascades in the database but says nothing about the disk,
    so this is called before the delete that would make the paths unreachable.
    """
    directory = UPLOADS_DIR / str(application_id)
    if not directory.is_dir():
        return
    for entry in directory.iterdir():
        if entry.is_file():
            entry.unlink(missing_ok=True)
    # Only removes it when empty: a leftover would mean something unexpected
    # is in there, and that is worth keeping rather than deleting blindly.
    try:
        directory.rmdir()
    except OSError:
        pass
