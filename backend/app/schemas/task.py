"""Pydantic schemas for task request/response validation."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class TaskCreate(BaseModel):
    """Schema for creating a new task."""

    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=5000)

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        """Strip whitespace and validate title is non-empty."""
        v = v.strip()
        if not v:
            raise ValueError("Title cannot be empty or whitespace-only")
        if len(v) > 500:
            raise ValueError("Title cannot exceed 500 characters")
        return v

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        """Strip whitespace from description if provided."""
        if v is not None:
            v = v.strip()
            if len(v) > 5000:
                raise ValueError("Description cannot exceed 5000 characters")
            # Return None for empty descriptions
            return v if v else None
        return v


class TaskUpdate(BaseModel):
    """Schema for updating an existing task."""

    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=5000)

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        """Strip whitespace and validate title is non-empty if provided."""
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Title cannot be empty or whitespace-only")
            if len(v) > 500:
                raise ValueError("Title cannot exceed 500 characters")
            return v
        return v

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        """Strip whitespace from description if provided."""
        if v is not None:
            v = v.strip()
            if len(v) > 5000:
                raise ValueError("Description cannot exceed 5000 characters")
            # Return None for empty descriptions
            return v if v else None
        return v


class TaskResponse(BaseModel):
    """Schema for task responses."""

    id: int
    user_id: str  # TEXT/UUID from Better Auth user.id
    title: str
    description: Optional[str]
    completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
