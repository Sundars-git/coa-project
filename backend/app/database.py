"""
SQLite database for submissions and results.
Auth/users/exams are handled in-memory (auth.py and data.py).
"""

import sqlite3
import os
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "portal.db"


def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_db()
    cur = conn.cursor()

    cur.executescript("""
        CREATE TABLE IF NOT EXISTS submissions (
            id          TEXT PRIMARY KEY,
            student_id  TEXT NOT NULL,
            exam_id     TEXT NOT NULL,
            started_at  TEXT NOT NULL,
            submitted_at TEXT,
            status      TEXT NOT NULL DEFAULT 'in_progress',
            UNIQUE(student_id, exam_id)
        );

        CREATE TABLE IF NOT EXISTS answers (
            id              TEXT PRIMARY KEY,
            submission_id   TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
            question_id     TEXT NOT NULL,
            selected_option TEXT,
            is_correct      INTEGER,
            UNIQUE(submission_id, question_id)
        );

        CREATE TABLE IF NOT EXISTS results (
            id              TEXT PRIMARY KEY,
            submission_id   TEXT NOT NULL UNIQUE REFERENCES submissions(id),
            student_id      TEXT NOT NULL,
            exam_id         TEXT NOT NULL,
            raw_score       INTEGER NOT NULL,
            total_marks     INTEGER NOT NULL,
            percentage      REAL NOT NULL,
            grade           TEXT NOT NULL,
            passed          INTEGER NOT NULL,
            graded_at       TEXT NOT NULL
        );
    """)
    conn.commit()
    conn.close()
