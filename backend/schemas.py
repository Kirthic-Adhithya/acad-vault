"""
schemas.py — Pydantic models for request validation and response serialisation.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# ---------------------------------------------------------------------------
# Request body (multipart fields come in as Form params, but we validate here)
# ---------------------------------------------------------------------------
class SubmissionCreate(BaseModel):
    title: str
    category: str
    description: Optional[str] = None


# ---------------------------------------------------------------------------
# Response shapes
# ---------------------------------------------------------------------------
class SubmissionListItem(BaseModel):
    """Lightweight — shown in the list view. s3_key deliberately excluded."""
    id: int
    title: str
    category: str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SubmissionDetail(BaseModel):
    """Full record — shown in the detail view."""
    id: int
    title: str
    category: str
    description: Optional[str]
    s3_key: str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DownloadResponse(BaseModel):
    download_url: str
    expires_in: int   # seconds


class HealthResponse(BaseModel):
    status: str
    db_connected: bool
    timestamp: datetime
