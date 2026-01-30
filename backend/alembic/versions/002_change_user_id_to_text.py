"""Change user_id to TEXT for Better Auth compatibility

Revision ID: 002
Revises: 001
Create Date: 2026-01-29

This migration changes the user_id column from INTEGER to TEXT to match
Better Auth's user.id field type (UUID string), and updates the foreign key
to reference the correct 'user' table (singular, managed by Better Auth).

BREAKING CHANGE: This migration will delete all existing tasks due to
data type change. Safe for development, but requires data migration in production.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Change user_id from INTEGER to TEXT to match Better Auth user table.

    Steps:
    1. Drop existing foreign key constraint to users.id (incorrect reference)
    2. Drop existing index on user_id
    3. Delete existing tasks (data type change requires this)
    4. Change user_id column from INTEGER to TEXT
    5. Add foreign key constraint to user.id (Better Auth table, singular)
    6. Recreate index on user_id

    Note: Better Auth creates 'user' table (singular), not 'users' (plural).
    """

    # Step 1: Drop existing foreign key constraint
    # The constraint name may vary; using op.drop_constraint with if_exists
    op.drop_constraint('tasks_user_id_fkey', 'tasks', type_='foreignkey')

    # Step 2: Drop existing index
    op.drop_index('idx_tasks_user_id', table_name='tasks')

    # Step 3: Clear existing data (required for type change)
    # Safe for development; in production would need data migration strategy
    op.execute('DELETE FROM tasks')

    # Step 4: Change column type from INTEGER to TEXT
    op.alter_column(
        'tasks',
        'user_id',
        existing_type=sa.Integer(),
        type_=sa.Text(),
        existing_nullable=False,
        nullable=False
    )

    # Step 5: Add foreign key to Better Auth 'user' table (singular)
    # Better Auth creates 'user' table with TEXT id field
    op.create_foreign_key(
        'fk_tasks_user',
        'tasks',
        'user',  # Better Auth table name (singular)
        ['user_id'],
        ['id'],
        ondelete='CASCADE'
    )

    # Step 6: Recreate index for query performance
    op.create_index('idx_tasks_user_id', 'tasks', ['user_id'])


def downgrade() -> None:
    """
    Revert user_id back to INTEGER (for rollback purposes).

    WARNING: This will delete all tasks and revert to incorrect schema.
    This downgrade is primarily for development rollback scenarios.
    """

    # Drop Better Auth foreign key constraint
    op.drop_constraint('fk_tasks_user', 'tasks', type_='foreignkey')

    # Drop index
    op.drop_index('idx_tasks_user_id', table_name='tasks')

    # Clear data (required for type change)
    op.execute('DELETE FROM tasks')

    # Change column type back to INTEGER
    op.alter_column(
        'tasks',
        'user_id',
        existing_type=sa.Text(),
        type_=sa.Integer(),
        existing_nullable=False,
        nullable=False
    )

    # Recreate old foreign key to users.id (incorrect, but matches old state)
    op.create_foreign_key(
        'tasks_user_id_fkey',
        'tasks',
        'users',
        ['user_id'],
        ['id'],
        ondelete='CASCADE'
    )

    # Recreate index
    op.create_index('idx_tasks_user_id', 'tasks', ['user_id'])
