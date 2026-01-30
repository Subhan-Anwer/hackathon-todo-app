"""Authentication and authorization modules.

This module provides JWT-based authentication for the FastAPI backend.
It integrates with Better Auth (frontend) by verifying JWT tokens issued
during user signup/signin flows.

Main exports:
    - verify_jwt_token: Low-level JWT verification function
    - get_current_user: FastAPI dependency for protected endpoints
    - User: Pydantic model representing authenticated user

Usage:
    from app.auth import get_current_user, User

    @router.get("/protected")
    async def protected_route(current_user: User = Depends(get_current_user)):
        # Access verified user identity
        user_id = current_user.user_id
        email = current_user.email
        return {"message": f"Hello {email}"}
"""

from .jwt_handler import verify_jwt_token
from .dependencies import get_current_user
from .models import User

__all__ = [
    "verify_jwt_token",
    "get_current_user",
    "User",
]
