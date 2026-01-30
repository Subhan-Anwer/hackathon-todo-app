"""User authentication models."""
from typing import Optional
from pydantic import BaseModel


class User(BaseModel):
    """
    User model for authentication responses.

    Represents the authenticated user extracted from JWT token claims.
    This model is used throughout the application to identify the current user.

    Attributes:
        user_id: Unique user identifier (TEXT/UUID string from Better Auth)
        email: User email address (optional)

    Notes:
        - In a full Better Auth implementation, this would include additional fields
          like name, created_at, etc.
        - The user_id is a TEXT (UUID string) type, matching Better Auth's user.id column
        - This model is NOT a database model - it's an in-memory representation
          of the authenticated user for the current request
    """

    user_id: str
    email: Optional[str] = None

    class Config:
        """Pydantic configuration."""
        # Allow both dict and object attribute access
        from_attributes = True
