"""
models.py — SQLAlchemy ORM model for the submissions table.

Column types are deliberately plain (Integer, String, Text, DateTime) so
the schema runs identically on SQLite (dev) and MySQL/RDS (production).
"""
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String, Text

from backend.database import Base


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)   # assignment | report | certificate
    description = Column(Text, nullable=True)
    s3_key = Column(String(500), nullable=False)     # path inside the S3 bucket
    uploaded_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
