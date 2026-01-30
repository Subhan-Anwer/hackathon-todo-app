"""Task model for SQLModel ORM."""
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class Task(SQLModel, table=True):
    """
    Task model representing a todo item.

    Each task belongs to a specific user and contains title, description,
    and completion status. User data isolation is enforced at the query level.
    """

    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    # CRITICAL: Foreign key to Better Auth's user table (singular, TEXT id)
    user_id: str = Field(
        foreign_key="user.id",
        index=True,
        nullable=False,
        description="Owner of the task (UUID string from Better Auth)"
    )
    title: str = Field(max_length=500, nullable=False)
    description: Optional[str] = Field(default=None, max_length=5000)
    completed: bool = Field(default=False, nullable=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def mark_updated(self):
        """Update the updated_at timestamp to current UTC time."""
        self.updated_at = datetime.now(timezone.utc)
