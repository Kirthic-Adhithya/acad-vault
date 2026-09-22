"""
submissions.py — all /submissions routes.

Upload order (per design doc):
  1. Validate inputs
  2. Upload file to S3 → get s3_key
  3. Only if S3 succeeds, write metadata row to DB
This guarantees no orphan DB rows pointing at non-existent S3 objects.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import get_db
from backend.models import Submission
from backend.schemas import DownloadResponse, SubmissionDetail, SubmissionListItem
from backend.services import s3_service

router = APIRouter(prefix="/submissions", tags=["Submissions"])

VALID_CATEGORIES = {"assignment", "report", "certificate"}


@router.get("", response_model=List[SubmissionListItem])
def list_submissions(db: Session = Depends(get_db)):
    """Lightweight list — omits s3_key."""
    return db.query(Submission).order_by(Submission.uploaded_at.desc()).all()


@router.post("", response_model=SubmissionDetail, status_code=201)
async def create_submission(
    title: str = Form(...),
    category: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Create a new submission.
    S3 upload happens first — DB write is skipped if the upload fails.
    """
    if category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=422,
            detail=f"category must be one of: {', '.join(sorted(VALID_CATEGORIES))}",
        )

    if not file.filename:
        raise HTTPException(status_code=422, detail="file is required")

    # 1. Upload to S3 — raises 502 on failure
    s3_key = await s3_service.upload_file(file, category)

    # 2. Only if S3 succeeded, persist metadata
    submission = Submission(
        title=title,
        category=category,
        description=description,
        s3_key=s3_key,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@router.get("/{submission_id}", response_model=SubmissionDetail)
def get_submission(submission_id: int, db: Session = Depends(get_db)):
    """Return the full record including s3_key."""
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if sub is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    return sub


@router.get("/{submission_id}/download", response_model=DownloadResponse)
def get_download_url(submission_id: int, db: Session = Depends(get_db)):
    """
    Generate a short-lived presigned S3 URL.
    The browser fetches the file directly from S3 — the backend never proxies bytes.
    """
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if sub is None:
        raise HTTPException(status_code=404, detail="Submission not found")

    url = s3_service.generate_presigned_url(sub.s3_key, settings.PRESIGNED_URL_EXPIRY)
    return DownloadResponse(
        download_url=url,
        expires_in=settings.PRESIGNED_URL_EXPIRY,
    )
