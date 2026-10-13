"""
Pydantic schemas for request/response validation.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Auth ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserInfo"


class UserInfo(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    student_id: Optional[str]
    department: str
    avatar_initials: str


# ── Exams ─────────────────────────────────────────────────────────────────────

class QuestionOut(BaseModel):
    id: str
    exam_id: str
    order_index: int
    marks: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    # correct_option is never included in student-facing schema


class ExamOut(BaseModel):
    id: str
    title: str
    subject: str
    description: str
    duration_minutes: int
    total_marks: int
    pass_mark: int
    scheduled_at: str
    status: str
    question_count: Optional[int] = None


class ExamDetail(ExamOut):
    questions: List[QuestionOut] = []


# ── Submissions ───────────────────────────────────────────────────────────────

class StartExamRequest(BaseModel):
    exam_id: str


class SaveAnswerRequest(BaseModel):
    question_id: str
    selected_option: str  # "a" | "b" | "c" | "d"


class SubmissionOut(BaseModel):
    id: str
    student_id: str
    exam_id: str
    started_at: str
    submitted_at: Optional[str]
    status: str


# ── Results ───────────────────────────────────────────────────────────────────

class AnswerReview(BaseModel):
    question_id: str
    question_text: str
    selected_option: Optional[str]
    correct_option: str
    is_correct: bool
    option_a: str
    option_b: str
    option_c: str
    option_d: str


class ResultOut(BaseModel):
    id: str
    submission_id: str
    student_id: str
    exam_id: str
    exam_title: str
    raw_score: int
    total_marks: int
    percentage: float
    grade: str
    passed: bool
    graded_at: str
    answers: Optional[List[AnswerReview]] = None


# ── Metrics ───────────────────────────────────────────────────────────────────

class LiveMetrics(BaseModel):
    # Real measurements from the running app
    real_lambda: float          # req/s from actual HTTP requests
    real_W: float               # avg response time seconds (actual)
    real_L: float               # L = λW (actual)
    real_request_count: int     # requests in last 60s window

    # Simulated traffic
    sim_lambda: float
    sim_W: float
    sim_L: float
    sim_running: bool

    # System health
    health: str                 # "healthy" | "degraded" | "overloaded"
    timestamp: str


class DataPoint(BaseModel):
    timestamp: str
    real_lambda: float
    real_W: float
    real_L: float
    sim_lambda: float
    sim_W: float
    sim_L: float


class SimulatorConfig(BaseModel):
    arrival_rate: float = 1200.0
    mean_response_time: float = 0.25
    response_time_std: float = 0.05
    mode: str = "normal"        # normal | db_slowdown | spike


class AdminStats(BaseModel):
    total_students: int
    total_exams: int
    total_submissions: int
    total_results: int
    active_exams: int
