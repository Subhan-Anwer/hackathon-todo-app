# Database Migration Guide

This guide explains how to apply database migrations for the hackathon-todo-app backend.

## Migration System

The project uses **Alembic** for database migrations with SQLModel ORM integration.

## Available Migrations

### Migration 001: Create Tasks Table
- **File**: `alembic/versions/001_create_tasks_table.py`
- **Purpose**: Initial tasks table creation
- **Status**: Superseded by migration 002

### Migration 002: Better Auth Integration
- **Alembic**: `alembic/versions/002_change_user_id_to_text.py`
- **Raw SQL**: `migrations/002_add_user_id_to_tasks.sql`
- **Purpose**: Change `user_id` from INTEGER to TEXT for Better Auth compatibility
- **Impact**: BREAKING CHANGE - Deletes all existing tasks
- **Date**: 2026-01-29

## Prerequisites

### Environment Setup
Ensure your `.env` file has the correct database connection:

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
```

For Neon Serverless PostgreSQL, use the connection string from your Neon console:
```bash
DATABASE_URL=postgresql://user:password@ep-xxxxx.region.neon.tech/dbname?sslmode=require
```

### Dependencies
```bash
pip install alembic sqlmodel psycopg2-binary
```

## Migration Methods

### Method 1: Using Alembic (Recommended)

Alembic provides version control and tracking for migrations.

#### Check Current Migration Version
```bash
cd backend
alembic current
```

#### View Migration History
```bash
alembic history --verbose
```

#### Apply All Pending Migrations
```bash
alembic upgrade head
```

#### Apply Specific Migration
```bash
alembic upgrade 002
```

#### Rollback One Migration
```bash
alembic downgrade -1
```

#### Rollback to Specific Version
```bash
alembic downgrade 001
```

### Method 2: Using Raw SQL

For direct database execution without Alembic tracking.

#### Using psql Command Line
```bash
psql $DATABASE_URL -f backend/migrations/002_add_user_id_to_tasks.sql
```

#### Using psql Interactive
```bash
psql $DATABASE_URL
\i backend/migrations/002_add_user_id_to_tasks.sql
\q
```

#### Using Python Script
```python
from app.database import engine

with open("migrations/002_add_user_id_to_tasks.sql", "r") as f:
    sql = f.read()

with engine.connect() as conn:
    conn.execute(sql)
    conn.commit()
```

## Verification

### Check Schema After Migration

```bash
# Connect to database
psql $DATABASE_URL

# Describe tasks table
\d tasks

# Check user_id column type (should be 'text')
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;

# Verify foreign key constraint
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'tasks';

# Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'tasks'
ORDER BY indexname;
```

### Expected Output

**tasks table structure:**
```
 Column      | Type                     | Nullable | Default
-------------+--------------------------+----------+-------------------
 id          | integer                  | not null | nextval('...')
 user_id     | text                     | not null |
 title       | character varying(500)   | not null |
 description | text                     |          |
 completed   | boolean                  | not null | false
 created_at  | timestamp with time zone | not null | CURRENT_TIMESTAMP
 updated_at  | timestamp with time zone | not null | CURRENT_TIMESTAMP

Indexes:
    "tasks_pkey" PRIMARY KEY, btree (id)
    "idx_tasks_user_id" btree (user_id)
    "idx_tasks_completed" btree (completed)
    "idx_tasks_created_at" btree (created_at)
    "idx_tasks_user_completed" btree (user_id, completed)

Foreign-key constraints:
    "fk_tasks_user" FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
```

## Troubleshooting

### Error: relation "user" does not exist

**Problem**: Better Auth has not created the `user` table yet.

**Solution**:
1. Ensure Better Auth is properly configured in your frontend
2. Run the frontend application to trigger Better Auth initialization
3. Or manually create the user table (not recommended):
   ```sql
   CREATE TABLE "user" (
       id TEXT PRIMARY KEY,
       email TEXT UNIQUE NOT NULL,
       "emailVerified" BOOLEAN DEFAULT FALSE,
       name TEXT,
       "createdAt" TIMESTAMP DEFAULT NOW(),
       "updatedAt" TIMESTAMP DEFAULT NOW()
   );
   ```

### Error: constraint "tasks_user_id_fkey" does not exist

**Problem**: Migration 001 created a different constraint name.

**Solution**: Modify migration 002 to drop the actual constraint name:
```sql
-- Find actual constraint name
SELECT constraint_name FROM information_schema.table_constraints
WHERE table_name = 'tasks' AND constraint_type = 'FOREIGN KEY';

-- Update migration DROP CONSTRAINT statement accordingly
```

### Error: cannot cast type integer to text

**Problem**: Migration trying to convert existing data.

**Solution**: This migration deletes all data before type change. If you need to preserve data:
1. Export tasks before migration
2. Apply migration (deletes data)
3. Re-import with UUID mapping

### Alembic: "Can't locate revision identified by 'xxx'"

**Problem**: Alembic revision chain is broken.

**Solution**:
```bash
# Check revision chain
alembic history

# Stamp database to correct version
alembic stamp head

# Or reset to base and reapply
alembic downgrade base
alembic upgrade head
```

## Best Practices

### Development Environment
1. Run migrations frequently to catch issues early
2. Test migrations on local database first
3. Keep test data minimal for easy recreation
4. Use Alembic for migration tracking

### Staging/Production Environment
1. **Always backup database before migration**
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test migration on staging first**
3. **Plan downtime window** if migration is not zero-downtime
4. **Have rollback plan ready**
5. **Monitor application logs** after migration
6. **Verify data integrity** with sample queries

### Zero-Downtime Migrations

For production systems, follow this pattern:
1. Make schema changes backward-compatible first
2. Deploy new application code that works with both schemas
3. Run migration
4. Deploy code that uses new schema exclusively
5. Clean up old schema in next migration

Example for adding nullable columns:
- Migration 1: Add column as nullable
- Deploy: Code uses new column but handles NULL
- Migration 2: Populate column with data
- Deploy: Code assumes column is always present
- Migration 3: Make column NOT NULL

## Migration Development

### Creating New Migration

```bash
# Generate new migration file
cd backend
alembic revision -m "description_of_change"

# Edit the generated file in alembic/versions/
# Implement upgrade() and downgrade() functions

# Test migration
alembic upgrade head

# Test rollback
alembic downgrade -1

# Re-test upgrade
alembic upgrade head
```

### Migration Template

```python
"""Description of migration

Revision ID: 00X
Revises: 00Y
Create Date: YYYY-MM-DD
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '00X'
down_revision: Union[str, None] = '00Y'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Apply migration."""
    # Your upgrade logic here
    pass


def downgrade() -> None:
    """Revert migration."""
    # Your downgrade logic here
    pass
```

## References

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLModel Documentation](https://sqlmodel.tiangolo.com/)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Neon Serverless PostgreSQL](https://neon.tech/docs)
