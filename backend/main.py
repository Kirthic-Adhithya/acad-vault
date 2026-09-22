"""
main.py — FastAPI application entry point.

Responsibilities:
  - Create DB tables on startup (idempotent)
  - Register API routes under /api prefix
  - Mount compiled frontend static files at /
  - Catch-all route → index.html for SPA client-side routing
  - CORS allowed for localhost:5173 (Vite dev server) so the frontend proxy works
"""
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.database import Base, engine
from backend.routes import health, submissions
from backend.services.s3_service import LOCAL_STORAGE_DIR

# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Academic Vault",
    description="Secure document storage — FastAPI + React + S3 + RDS",
    version="1.0.0",
)

# CORS — only needed so Vite's dev proxy can hit the backend during development.
# In production, frontend and backend are served from the same origin (same port).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Startup: create tables if they don't exist
# ---------------------------------------------------------------------------
@app.on_event("startup")
def create_tables():
    # Import models so SQLAlchemy sees them before create_all
    from backend import models  # noqa: F401
    Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------------------------
# API routes — all under /api so static file serving doesn't shadow them
# ---------------------------------------------------------------------------
app.include_router(health.router, prefix="/api")
app.include_router(submissions.router, prefix="/api")

@app.get("/api/local-download/{s3_key:path}", tags=["Submissions"])
def local_download(s3_key: str):
    """Fallback endpoint for local development without AWS credentials."""
    local_path = LOCAL_STORAGE_DIR / s3_key
    if not local_path.is_file():
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="File not found in local storage.")
    return FileResponse(str(local_path))

# ---------------------------------------------------------------------------
# Static file serving (production)
# Serves the compiled Vite output from frontend/dist.
# Only mounted when the dist folder actually exists — safe to skip in dev.
# ---------------------------------------------------------------------------
FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    # Serve assets (JS/CSS/images) from /assets
    app.mount(
        "/assets",
        StaticFiles(directory=str(FRONTEND_DIST / "assets")),
        name="assets",
    )

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        """
        Catch-all: any path that isn't an API route gets index.html.
        This is what makes client-side routing work on a hard refresh.
        """
        requested = FRONTEND_DIST / full_path
        if requested.is_file():
            return FileResponse(str(requested))
        return FileResponse(str(FRONTEND_DIST / "index.html"))
