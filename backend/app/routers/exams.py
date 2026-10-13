"""Exams router — student-facing (no correct answers) and admin CRUD."""

from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.schemas import ExamOut, ExamDetail, QuestionOut
from app.dependencies import get_current_user, require_admin
from app.data import get_all_exams, get_exam_by_id, get_questions_for_exam

router = APIRouter(prefix="/api/exams", tags=["exams"])


@router.get("", response_model=List[ExamOut])
def list_exams(current_user: dict = Depends(get_current_user)):
    exams = get_all_exams()
    result = []
    for e in exams:
        questions = get_questions_for_exam(e["id"])
        out = ExamOut(**e, question_count=len(questions))
        result.append(out)
    return result


@router.get("/{exam_id}", response_model=ExamDetail)
def get_exam(exam_id: str, current_user: dict = Depends(get_current_user)):
    exam = get_exam_by_id(exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    include_correct = current_user["role"] == "admin"
    questions_raw = get_questions_for_exam(exam_id, include_correct=include_correct)
    questions = [QuestionOut(**q) for q in questions_raw]

    return ExamDetail(**exam, question_count=len(questions), questions=questions)
