"""
health.py — /health endpoint.

Pings the database with SELECT 1 so the response is a live indicator of
RDS connectivity, not just "the Python process is running."
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """
    Returns:
      status: "ok" | "degraded"
      db_connected: True if SELECT 1 succeeds
      timestamp: current UTC time
    """
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass

    return HealthResponse(
        status="ok" if db_ok else "degraded",
        db_connected=db_ok,
        timestamp=datetime.now(timezone.utc),
    )
