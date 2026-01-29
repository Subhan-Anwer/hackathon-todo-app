"""Create tasks table

Revision ID: 001
Revises:
Create Date: 2026-01-29

This migration creates the tasks table with proper indexes for multi-user data isolation.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Create tasks table with:
    - id (primary key, auto-increment)
    - user_id (foreign key to users.id, indexed)
    - title (varchar 500, required)
    - description (text, optional)
    - completed (boolean, default false)
    - created_at (timestamp with timezone, default now)
    - updated_at (timestamp with timezone, default now)

    Indexes:
    - idx_tasks_user_id: For filtering tasks by user (critical for data isolation)
    - idx_tasks_completed: For filtering by completion status
    - idx_tasks_created_at: For ordering by creation date
    """
    # Create tasks table
    op.create_table(
        'tasks',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        # Note: Foreign key to users.id - users table will be created by Better Auth
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )

    # Create indexes for performance
    op.create_index('idx_tasks_user_id', 'tasks', ['user_id'])
    op.create_index('idx_tasks_completed', 'tasks', ['completed'])
    op.create_index('idx_tasks_created_at', 'tasks', ['created_at'])

    # Create composite index for common query pattern: user's incomplete tasks
    op.create_index('idx_tasks_user_completed', 'tasks', ['user_id', 'completed'])


def downgrade() -> None:
    """Drop tasks table and all indexes."""
    # Drop indexes first
    op.drop_index('idx_tasks_user_completed', table_name='tasks')
    op.drop_index('idx_tasks_created_at', table_name='tasks')
    op.drop_index('idx_tasks_completed', table_name='tasks')
    op.drop_index('idx_tasks_user_id', table_name='tasks')

    # Drop table
    op.drop_table('tasks')
