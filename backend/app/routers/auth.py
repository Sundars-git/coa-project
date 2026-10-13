"""Auth router — login only, no signup."""

from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas import LoginRequest, TokenResponse, UserInfo
from app.auth import authenticate_user, create_access_token
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    user = authenticate_user(body.email.lower().strip(), body.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token({"sub": user["id"], "role": user["role"]})
    return TokenResponse(
        access_token=token,
        user=UserInfo(**{k: v for k, v in user.items() if k != "password_hash"}),
    )


@router.get("/me", response_model=UserInfo)
def get_me(current_user: dict = Depends(get_current_user)):
    return UserInfo(**{k: v for k, v in current_user.items() if k != "password_hash"})
