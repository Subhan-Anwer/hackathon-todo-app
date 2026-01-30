-- Migration 002: Change user_id to TEXT for Better Auth Compatibility
-- Date: 2026-01-29
-- Author: Database Migration (Neon DB Manager Agent)
--
-- Purpose: Align tasks table with Better Auth user management system
-- Impact: BREAKING CHANGE - Deletes all existing tasks due to type conversion
--
-- This migration changes user_id from INTEGER to TEXT to match Better Auth's
-- UUID string format, and updates the foreign key to reference the correct
-- 'user' table (singular, managed by Better Auth).

-- ==============================================================================
-- UPGRADE: Apply changes to align with Better Auth
-- ==============================================================================

BEGIN;

-- Step 1: Drop existing foreign key constraint to incorrect users table
-- Note: Constraint name may vary by database; adjust if needed
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;

-- Step 2: Drop existing index on user_id (will recreate after type change)
DROP INDEX IF EXISTS idx_tasks_user_id;

-- Step 3: Clear existing data (REQUIRED for type change)
-- WARNING: This deletes all tasks in the database
-- Safe for development; production requires data migration strategy
DELETE FROM tasks;

-- Step 4: Change user_id column from INTEGER to TEXT
-- This matches Better Auth's user.id field type (UUID string)
ALTER TABLE tasks ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Step 5: Add foreign key constraint to Better Auth's user table
-- Better Auth creates 'user' table (singular), not 'users' (plural)
-- ON DELETE CASCADE ensures tasks are deleted when user is deleted
ALTER TABLE tasks
ADD CONSTRAINT fk_tasks_user
FOREIGN KEY (user_id) REFERENCES "user"(id)
ON DELETE CASCADE;

-- Step 6: Recreate index on user_id for query performance
-- This index is CRITICAL for multi-user data isolation queries
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Verify the changes
DO $$
BEGIN
    -- Check that user_id is now TEXT type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks'
        AND column_name = 'user_id'
        AND data_type = 'text'
    ) THEN
        RAISE EXCEPTION 'Migration failed: user_id is not TEXT type';
    END IF;

    -- Check that foreign key exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'tasks'
        AND constraint_name = 'fk_tasks_user'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE EXCEPTION 'Migration failed: foreign key constraint not created';
    END IF;

    -- Check that index exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'tasks'
        AND indexname = 'idx_tasks_user_id'
    ) THEN
        RAISE EXCEPTION 'Migration failed: index not created';
    END IF;

    RAISE NOTICE 'Migration 002 completed successfully';
END $$;

COMMIT;

-- ==============================================================================
-- ROLLBACK: Revert changes (for emergency use only)
-- ==============================================================================

-- To rollback this migration, run the following:
-- WARNING: This will delete all tasks and revert to incorrect schema

/*
BEGIN;

-- Drop Better Auth foreign key
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS fk_tasks_user;

-- Drop index
DROP INDEX IF EXISTS idx_tasks_user_id;

-- Clear data (required for type change)
DELETE FROM tasks;

-- Change user_id back to INTEGER
ALTER TABLE tasks ALTER COLUMN user_id TYPE INTEGER USING user_id::INTEGER;

-- Recreate old foreign key to users.id (incorrect, but matches old state)
ALTER TABLE tasks
ADD CONSTRAINT tasks_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id)
ON DELETE CASCADE;

-- Recreate index
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

RAISE NOTICE 'Migration 002 rolled back';

COMMIT;
*/

-- ==============================================================================
-- USAGE NOTES
-- ==============================================================================

-- Execute this migration using psql:
--   psql $DATABASE_URL -f backend/migrations/002_add_user_id_to_tasks.sql

-- Or using Alembic:
--   cd backend && alembic upgrade head

-- Verify migration:
--   psql $DATABASE_URL -c "\d tasks"

-- Expected output for user_id column:
--   Column    | Type | Collation | Nullable | Default
--   user_id   | text |           | not null |

-- ==============================================================================
-- PRODUCTION CONSIDERATIONS
-- ==============================================================================

-- If running in production with existing data:
-- 1. Backup database before migration
-- 2. Create data export:
--    COPY (SELECT id, user_id, title, description, completed, created_at, updated_at
--          FROM tasks) TO '/tmp/tasks_backup.csv' WITH CSV HEADER;
-- 3. Apply migration (this will delete all tasks)
-- 4. Re-import with UUID mapping:
--    -- First, create UUID mapping for old user IDs
--    -- Then reimport tasks with correct TEXT user_id values
-- 5. Verify data integrity
-- 6. Test application functionality
