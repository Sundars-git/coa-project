"""Admin router — dashboard stats and all submissions view."""

from fastapi import APIRouter, Depends
from app.dependencies import require_admin
from app.database import get_db
from app.data import get_all_exams
from app.auth import DEMO_USERS_PUBLIC
from app.schemas import AdminStats

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/dashboard", response_model=AdminStats)
def admin_dashboard(admin: dict = Depends(require_admin)):
    db = get_db()
    try:
        total_submissions = db.execute("SELECT COUNT(*) FROM submissions").fetchone()[0]
        total_results = db.execute("SELECT COUNT(*) FROM results").fetchone()[0]
        exams = get_all_exams()
        active_exams = sum(1 for e in exams if e["status"] == "active")
        # Count demo students (exclude admins)
        students = [u for u in DEMO_USERS_PUBLIC if u["role"] == "student"]
        return AdminStats(
            total_students=len(students),
            total_exams=len(exams),
            total_submissions=total_submissions,
            total_results=total_results,
            active_exams=active_exams,
        )
    finally:
        db.close()


@router.get("/submissions")
def get_all_submissions(admin: dict = Depends(require_admin)):
    from app.auth import DEMO_USERS
    from app.data import get_exam_by_id
    db = get_db()
    try:
        rows = db.execute(
            "SELECT s.*, r.raw_score, r.total_marks, r.percentage, r.grade, r.passed "
            "FROM submissions s LEFT JOIN results r ON r.submission_id = s.id "
            "ORDER BY s.started_at DESC"
        ).fetchall()

        user_map = {u["id"]: u for u in DEMO_USERS.values()}
        result = []
        for row in rows:
            user = user_map.get(row["student_id"], {})
            exam = get_exam_by_id(row["exam_id"])
            result.append({
                "submission_id": row["id"],
                "student_name": user.get("full_name", "Unknown"),
                "student_id": user.get("student_id", "—"),
                "exam_title": exam["title"] if exam else "Unknown",
                "status": row["status"],
                "started_at": row["started_at"],
                "submitted_at": row["submitted_at"],
                "raw_score": row["raw_score"],
                "total_marks": row["total_marks"],
                "percentage": row["percentage"],
                "grade": row["grade"],
                "passed": bool(row["passed"]) if row["passed"] is not None else None,
            })
        return result
    finally:
        db.close()
