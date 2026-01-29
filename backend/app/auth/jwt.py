"""JWT authentication and authorization."""
import os
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from dotenv import load_dotenv

load_dotenv()

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

if not JWT_SECRET:
    raise ValueError("JWT_SECRET environment variable is not set")

# Security scheme
security = HTTPBearer()


class User:
    """
    User model extracted from JWT token.

    In a full implementation with Better Auth, this would include
    additional fields like email, name, etc.
    """

    def __init__(self, id: int, email: Optional[str] = None):
        self.id = id
        self.email = email


def verify_token(token: str) -> dict:
    """
    Verify JWT token and extract claims.

    Args:
        token: JWT token string

    Returns:
        dict: Token payload/claims

    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    """
    Dependency function to extract and verify current user from JWT token.

    This function:
    1. Extracts JWT token from Authorization header
    2. Verifies token signature and expiration
    3. Extracts user_id from token claims
    4. Returns User object for use in route handlers

    Args:
        credentials: HTTP Bearer token from Authorization header

    Returns:
        User: Current authenticated user

    Raises:
        HTTPException: If token is invalid or user_id not found in claims

    Usage:
        @router.get("/protected")
        def protected_route(current_user: User = Depends(get_current_user)):
            # current_user.id is guaranteed to be present
            return {"user_id": current_user.id}
    """
    token = credentials.credentials
    payload = verify_token(token)

    # Extract user_id from token claims
    user_id = payload.get("sub") or payload.get("user_id") or payload.get("id")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: user_id not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Convert to int if string
    try:
        user_id = int(user_id)
    except (ValueError, TypeError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: user_id must be an integer",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e

    # Extract optional email
    email = payload.get("email")

    return User(id=user_id, email=email)
