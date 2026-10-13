"""
FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.middleware.timing import TimingMiddleware
from app.database import init_db
from app.routers import auth, exams, submissions, admin, metrics

app = FastAPI(
    title="University Exam Portal API",
    description="Smart Online Exam Portal with Little's Law monitoring",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Timing middleware (must be added AFTER CORS) ──────────────────────────────
app.add_middleware(TimingMiddleware)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(exams.router)
app.include_router(submissions.router)
app.include_router(admin.router)
app.include_router(metrics.router)


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    init_db()
    print("[OK] Database initialised")
    print("[OK] Exam Portal API is running")
    print("[INFO] Docs: http://localhost:8000/docs")


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Exam Portal API"}
