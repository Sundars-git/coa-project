"""
Hardcoded demo credentials and user store.
No database — users are defined here at startup.
"""

from typing import Optional
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
import bcrypt

SECRET_KEY = "exam-portal-secret-key-change-in-production-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours for demo

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

# ---------------------------------------------------------------------------
# Hardcoded demo users (no signup, no DB lookup for auth)
# ---------------------------------------------------------------------------
DEMO_USERS = {
    "admin@uniportal.edu": {
        "id": "usr-admin-001",
        "email": "admin@uniportal.edu",
        "full_name": "Prof. Kamatchi Sundar",
        "role": "admin",
        "student_id": None,
        "department": "Computer Science & Engineering",
        "avatar_initials": "KS",
        # bcrypt hash of "Admin@1234"
        "password_hash": hash_password("Admin@1234"),
    },
    "nishthika@student.edu": {
        "id": "usr-stu-001",
        "email": "nishthika@student.edu",
        "full_name": "Nishthika",
        "role": "student",
        "student_id": "STU-2024-001",
        "department": "Computer Science & Engineering",
        "avatar_initials": "NS",
        "password_hash": hash_password("Student@1234"),
    },
    "fathima@student.edu": {
        "id": "usr-stu-002",
        "email": "fathima@student.edu",
        "full_name": "Fathima",
        "role": "student",
        "student_id": "STU-2024-002",
        "department": "Information Technology",
        "avatar_initials": "FA",
        "password_hash": hash_password("Student@1234"),
    },
    "kamatchi@student.edu": {
        "id": "usr-stu-003",
        "email": "kamatchi@student.edu",
        "full_name": "Kamatchi Sundar",
        "role": "student",
        "student_id": "STU-2024-003",
        "department": "Computer Science & Engineering",
        "avatar_initials": "KS",
        "password_hash": hash_password("Student@1234"),
    },
    # Backwards-compatible aliases
    "alice@student.edu": {
        "id": "usr-stu-001",
        "email": "nishthika@student.edu",
        "full_name": "Nishthika",
        "role": "student",
        "student_id": "STU-2024-001",
        "department": "Computer Science & Engineering",
        "avatar_initials": "NS",
        "password_hash": hash_password("Student@1234"),
    },
    "bob@student.edu": {
        "id": "usr-stu-002",
        "email": "fathima@student.edu",
        "full_name": "Fathima",
        "role": "student",
        "student_id": "STU-2024-002",
        "department": "Information Technology",
        "avatar_initials": "FA",
        "password_hash": hash_password("Student@1234"),
    },
    "carol@student.edu": {
        "id": "usr-stu-003",
        "email": "kamatchi@student.edu",
        "full_name": "Kamatchi Sundar",
        "role": "student",
        "student_id": "STU-2024-003",
        "department": "Computer Science & Engineering",
        "avatar_initials": "KS",
        "password_hash": hash_password("Student@1234"),
    },
}


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def authenticate_user(email: str, password: str) -> Optional[dict]:
    user = DEMO_USERS.get(email)
    if not user:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    return user


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def get_user_by_id(user_id: str) -> Optional[dict]:
    for user in DEMO_USERS.values():
        if user["id"] == user_id:
            return user
    return None


# Public list (no password hashes) — safe to pass to admin endpoints
_unique_users = {u["id"]: u for u in DEMO_USERS.values()}
DEMO_USERS_PUBLIC = [
    {k: v for k, v in u.items() if k != "password_hash"}
    for u in _unique_users.values()
]
