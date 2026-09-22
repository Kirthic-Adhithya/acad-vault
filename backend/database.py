"""
database.py — SQLAlchemy engine, session factory, and base class.

Works with SQLite locally and MySQL (RDS) in production: the only thing
that changes is the DATABASE_URL environment variable.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from backend.config import settings

# SQLite needs check_same_thread=False so FastAPI can share it across
# async workers.  The connect_args dict is ignored by MySQL drivers.
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    # Keep a small pool; fine-tune for production
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# ---------------------------------------------------------------------------
# FastAPI dependency — yields a DB session and always closes it afterwards.
# ---------------------------------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
