"""Authentication schemas for request/response validation."""
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any


class ErrorDetail(BaseModel):
    """Error detail structure."""
    message: str
    code: Optional[str] = None


class ErrorResponse(BaseModel):
    """Standardized error response."""
    success: bool = False
    error: ErrorDetail


class AuthResponse(BaseModel):
    """Authentication response."""
    success: bool = True
    data: Dict[str, Any]


class UserSignup(BaseModel):
    """User signup request schema."""
    email: EmailStr
    password: str
    name: Optional[str] = None


class UserSignin(BaseModel):
    """User signin request schema."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token response schema."""
    access_token: str
    token_type: str = "bearer"
    expires_in: Optional[int] = None


class UserResponse(BaseModel):
    """User information response."""
    id: str
    email: str
    name: Optional[str] = None
    created_at: Optional[str] = None
