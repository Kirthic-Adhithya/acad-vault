# Academic Vault — Walkthrough

## What Was Built

Full-stack "Academic Vault" app: FastAPI backend + Vite/React frontend, verified working locally with SQLite, ready to swap to RDS MySQL with a single env var change.

---

## File Map

```
lab_project/
├── backend/
│   ├── __init__.py
│   ├── main.py          ← FastAPI app; serves React dist as static files
│   ├── config.py        ← reads DATABASE_URL, S3_BUCKET_NAME, AWS_REGION
│   ├── database.py      ← SQLAlchemy engine; handles SQLite ↔ MySQL portably
│   ├── models.py        ← Submission ORM model
│   ├── schemas.py       ← Pydantic request/response shapes
│   ├── routes/
│   │   ├── health.py    ← GET /api/health  (pings DB with SELECT 1)
│   │   └── submissions.py ← all 5 /api/submissions routes
│   ├── services/
│   │   └── s3_service.py ← upload_file(), generate_presigned_url()
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx       ← view-state machine: list | upload | detail
│   │   ├── api.js        ← Axios wrappers for all endpoints
│   │   ├── index.css     ← dark glassmorphism design system
│   │   └── components/
│   │       ├── SubmissionList.jsx   ← hero + card grid + skeleton loaders
│   │       ├── UploadForm.jsx       ← drag-drop + progress bar
│   │       ├── SubmissionDetail.jsx ← metadata + presigned download
│   │       └── ToastContainer.jsx  ← fixed notification stack
│   ├── vite.config.js    ← dev proxy /api → localhost:8000
│   ├── index.html
│   └── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## Verified Results

| Test | Result |
|------|--------|
| `pip install -r backend/requirements.txt` | ✅ All 33 packages installed |
| `npm install` | ✅ 88 packages, 0 errors |
| `GET /api/health` | ✅ `{ "status": "ok", "db_connected": true }` |
| `GET /api/submissions` | ✅ `[]` (empty list, correct) |
| `npm run build` | ✅ 91 modules, 211 KB JS, 12 KB CSS |
| `GET /` (after build) | ✅ 200 OK — FastAPI serves React's `index.html` |

---

## How to Run Locally

**Terminal 1 — Backend:**
```bash
cd "lab_project"
.venv\Scripts\activate
copy .env.example .env   # edit AWS keys for S3 if needed
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```
API docs: http://localhost:8000/docs

**Terminal 2 — Frontend dev server:**
```bash
cd "lab_project/frontend"
npm run dev
```
App: http://localhost:5173 — Vite proxies `/api` → port 8000 automatically.

---

## Connecting to RDS (Checkpoint 4)

When Member 1 provides the RDS endpoint, edit `.env`:
```
DATABASE_URL=mysql+pymysql://admin:PASSWORD@YOUR_RDS_ENDPOINT:3306/academic_vault
```
Restart uvicorn. `GET /api/health` will return `db_connected: true` against RDS. Tables are created automatically on startup (`create_all`).

## Connecting to S3 (local dev)

Add to `.env`:
```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=your-actual-bucket
```
Same boto3 code runs on EC2 with the IAM role — no branching needed.

---

## Design Decisions (viva-ready)

| Decision | Rationale |
|----------|-----------|
| S3 upload before DB insert | Guarantees no orphan DB rows pointing at missing S3 objects |
| Presigned URLs, not proxied bytes | Temporary + scoped access; backend never touches file bytes after upload |
| `DATABASE_URL` env var | Same code runs on SQLite locally and RDS in production — zero rewrites |
| boto3 credential chain | Local: key in `.env`; EC2: IAM role — same code path, no `if/else` |
| Single port (EC2) | FastAPI serves built React as static files — one SG rule, no CORS in prod |
