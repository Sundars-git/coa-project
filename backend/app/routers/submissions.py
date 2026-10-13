"""Submissions router — start exam, save answers, submit, view results."""

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional

from app.schemas import StartExamRequest, SaveAnswerRequest, SubmissionOut, ResultOut, AnswerReview
from app.dependencies import get_current_user
from app.database import get_db
from app.data import get_exam_by_id, get_questions_for_exam, get_question_by_id

router = APIRouter(prefix="/api/submissions", tags=["submissions"])


def _compute_grade(pct: float) -> str:
    if pct >= 90:
        return "A+"
    elif pct >= 80:
        return "A"
    elif pct >= 70:
        return "B"
    elif pct >= 60:
        return "C"
    elif pct >= 50:
        return "D"
    else:
        return "F"


@router.post("", response_model=SubmissionOut)
def start_exam(body: StartExamRequest, current_user: dict = Depends(get_current_user)):
    exam = get_exam_by_id(body.exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam["status"] not in ("active",):
        raise HTTPException(status_code=400, detail="Exam is not currently available")

    db = get_db()
    try:
        # Check for existing submission
        existing = db.execute(
            "SELECT id, status FROM submissions WHERE student_id=? AND exam_id=?",
            (current_user["id"], body.exam_id)
        ).fetchone()

        if existing:
            if existing["status"] == "submitted":
                raise HTTPException(status_code=409, detail="You have already submitted this exam")
            # Resume in_progress
            return SubmissionOut(
                id=existing["id"],
                student_id=current_user["id"],
                exam_id=body.exam_id,
                started_at=db.execute(
                    "SELECT started_at FROM submissions WHERE id=?", (existing["id"],)
                ).fetchone()["started_at"],
                submitted_at=None,
                status=existing["status"],
            )

        sub_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        db.execute(
            "INSERT INTO submissions (id, student_id, exam_id, started_at, status) VALUES (?,?,?,?,?)",
            (sub_id, current_user["id"], body.exam_id, now, "in_progress")
        )

        # Pre-create answer rows (unanswered)
        questions = get_questions_for_exam(body.exam_id, include_correct=False)
        for q in questions:
            db.execute(
                "INSERT OR IGNORE INTO answers (id, submission_id, question_id) VALUES (?,?,?)",
                (str(uuid.uuid4()), sub_id, q["id"])
            )

        db.commit()
        return SubmissionOut(
            id=sub_id, student_id=current_user["id"], exam_id=body.exam_id,
            started_at=now, submitted_at=None, status="in_progress"
        )
    finally:
        db.close()


@router.patch("/{submission_id}/answers")
def save_answer(
    submission_id: str,
    body: SaveAnswerRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    try:
        sub = db.execute(
            "SELECT * FROM submissions WHERE id=? AND student_id=?",
            (submission_id, current_user["id"])
        ).fetchone()
        if not sub:
            raise HTTPException(status_code=404, detail="Submission not found")
        if sub["status"] != "in_progress":
            raise HTTPException(status_code=400, detail="Exam already submitted")

        db.execute(
            "UPDATE answers SET selected_option=? WHERE submission_id=? AND question_id=?",
            (body.selected_option, submission_id, body.question_id)
        )
        db.commit()
        return {"ok": True}
    finally:
        db.close()


@router.post("/{submission_id}/submit", response_model=ResultOut)
def submit_exam(submission_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        sub = db.execute(
            "SELECT * FROM submissions WHERE id=? AND student_id=?",
            (submission_id, current_user["id"])
        ).fetchone()
        if not sub:
            raise HTTPException(status_code=404, detail="Submission not found")
        if sub["status"] == "submitted":
            # Return existing result
            result = db.execute(
                "SELECT * FROM results WHERE submission_id=?", (submission_id,)
            ).fetchone()
            if result:
                exam = get_exam_by_id(sub["exam_id"])
                return ResultOut(**dict(result), exam_title=exam["title"] if exam else "Unknown", passed=bool(result["passed"]))

        exam = get_exam_by_id(sub["exam_id"])
        if not exam:
            raise HTTPException(status_code=404, detail="Exam data not found")

        # Grade answers
        questions_with_correct = get_questions_for_exam(sub["exam_id"], include_correct=True)
        correct_map = {q["id"]: q["correct_option"] for q in questions_with_correct}

        answers = db.execute(
            "SELECT * FROM answers WHERE submission_id=?", (submission_id,)
        ).fetchall()

        score = 0
        for ans in answers:
            is_correct = ans["selected_option"] == correct_map.get(ans["question_id"])
            db.execute(
                "UPDATE answers SET is_correct=? WHERE id=?",
                (1 if is_correct else 0, ans["id"])
            )
            if is_correct:
                score += 1

        now = datetime.now(timezone.utc).isoformat()
        total = exam["total_marks"]
        pct = round((score / total) * 100, 1) if total > 0 else 0.0
        grade = _compute_grade(pct)
        passed = score >= exam["pass_mark"]

        result_id = str(uuid.uuid4())
        db.execute(
            """INSERT OR REPLACE INTO results
               (id, submission_id, student_id, exam_id, raw_score, total_marks,
                percentage, grade, passed, graded_at)
               VALUES (?,?,?,?,?,?,?,?,?,?)""",
            (result_id, submission_id, current_user["id"], sub["exam_id"],
             score, total, pct, grade, 1 if passed else 0, now)
        )
        db.execute(
            "UPDATE submissions SET status='submitted', submitted_at=? WHERE id=?",
            (now, submission_id)
        )
        db.commit()

        # Build answer review
        answers_after = db.execute(
            "SELECT * FROM answers WHERE submission_id=?", (submission_id,)
        ).fetchall()
        reviews = []
        for ans in answers_after:
            q = next((x for x in questions_with_correct if x["id"] == ans["question_id"]), None)
            if q:
                reviews.append(AnswerReview(
                    question_id=q["id"],
                    question_text=q["question_text"],
                    selected_option=ans["selected_option"],
                    correct_option=q["correct_option"],
                    is_correct=bool(ans["is_correct"]),
                    option_a=q["option_a"],
                    option_b=q["option_b"],
                    option_c=q["option_c"],
                    option_d=q["option_d"],
                ))

        return ResultOut(
            id=result_id, submission_id=submission_id,
            student_id=current_user["id"], exam_id=sub["exam_id"],
            exam_title=exam["title"],
            raw_score=score, total_marks=total,
            percentage=pct, grade=grade, passed=passed,
            graded_at=now, answers=reviews,
        )
    finally:
        db.close()


@router.get("/my/results", response_model=List[ResultOut])
def my_results(current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        rows = db.execute(
            "SELECT * FROM results WHERE student_id=? ORDER BY graded_at DESC",
            (current_user["id"],)
        ).fetchall()
        results = []
        for r in rows:
            exam = get_exam_by_id(r["exam_id"])
            d = dict(r)
            d["passed"] = bool(d["passed"])
            d["exam_title"] = exam["title"] if exam else "Unknown"
            results.append(ResultOut(**d))
        return results
    finally:
        db.close()


@router.get("/{submission_id}/result", response_model=ResultOut)
def get_result(submission_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        sub = db.execute(
            "SELECT * FROM submissions WHERE id=?", (submission_id,)
        ).fetchone()
        if not sub:
            raise HTTPException(status_code=404, detail="Submission not found")
        # Students can only see their own
        if current_user["role"] == "student" and sub["student_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")

        result = db.execute(
            "SELECT * FROM results WHERE submission_id=?", (submission_id,)
        ).fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Result not yet available")

        exam = get_exam_by_id(sub["exam_id"])
        questions_with_correct = get_questions_for_exam(sub["exam_id"], include_correct=True)
        answers = db.execute(
            "SELECT * FROM answers WHERE submission_id=?", (submission_id,)
        ).fetchall()

        reviews = []
        for ans in answers:
            q = next((x for x in questions_with_correct if x["id"] == ans["question_id"]), None)
            if q:
                reviews.append(AnswerReview(
                    question_id=q["id"], question_text=q["question_text"],
                    selected_option=ans["selected_option"],
                    correct_option=q["correct_option"],
                    is_correct=bool(ans["is_correct"]),
                    option_a=q["option_a"], option_b=q["option_b"],
                    option_c=q["option_c"], option_d=q["option_d"],
                ))

        res_dict = dict(result)
        res_dict["passed"] = bool(res_dict["passed"])
        res_dict["exam_title"] = exam["title"] if exam else "Unknown"
        res_dict["answers"] = reviews
        return ResultOut(**res_dict)
    finally:
        db.close()
