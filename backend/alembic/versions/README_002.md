# Migration 002: Change user_id to TEXT for Better Auth Compatibility

**Revision ID**: 002
**Date**: 2026-01-29
**Type**: Schema Modification (BREAKING CHANGE)

## Purpose

This migration aligns the `tasks` table schema with Better Auth's user management system by:
1. Changing `user_id` column from INTEGER to TEXT (to match Better Auth's UUID string format)
2. Updating foreign key reference from `users.id` to `user.id` (Better Auth uses singular table name)
3. Ensuring proper data isolation for multi-user task management

## Changes

### Before
```sql
user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
```

### After
```sql
user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
```

## Migration Steps

### Upgrade (001 → 002)
1. Drop existing foreign key constraint `tasks_user_id_fkey`
2. Drop index `idx_tasks_user_id`
3. **DELETE all existing tasks** (required for type change)
4. Alter `user_id` column from INTEGER to TEXT
5. Create foreign key constraint `fk_tasks_user` referencing `user(id)`
6. Recreate index `idx_tasks_user_id`

### Downgrade (002 → 001)
1. Drop Better Auth foreign key constraint
2. Drop index
3. **DELETE all tasks**
4. Alter `user_id` column from TEXT to INTEGER
5. Recreate old foreign key to `users.id`
6. Recreate index

## Data Impact

⚠️ **BREAKING CHANGE**: This migration **deletes all existing tasks**.

**Rationale**: PostgreSQL cannot automatically convert INTEGER to TEXT with data preservation when foreign key constraints are involved. This is safe for development environments where test data can be recreated.

**Production Considerations**: If running in production with real data:
1. Create a data migration strategy:
   - Export existing tasks with user mapping
   - Apply schema migration
   - Re-import tasks with correct TEXT user_id values
2. Consider downtime window
3. Test migration on staging database first
4. Have rollback plan ready

## How to Run

### Apply Migration
```bash
cd backend
alembic upgrade head
```

### Verify Migration
```bash
alembic current
# Should show: 002 (head)

# Check schema in psql
psql $DATABASE_URL -c "\d tasks"
# Verify user_id is type 'text'
```

### Rollback (if needed)
```bash
alembic downgrade 001
```

## Dependencies

**Requires**:
- Better Auth must have created the `user` table before running this migration
- `user` table must have `id` column of type TEXT

**Blocks**:
- Any code that assumes `user_id` is INTEGER type
- Any queries that join tasks with a `users` table (plural)

## Testing

After migration, verify:

1. **Schema correctness**:
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'tasks' AND column_name = 'user_id';
   ```
   Expected: `data_type = 'text'`, `is_nullable = 'NO'`

2. **Foreign key constraint**:
   ```sql
   SELECT constraint_name, table_name, column_name,
          foreign_table_name, foreign_column_name
   FROM information_schema.key_column_usage
   WHERE table_name = 'tasks' AND column_name = 'user_id';
   ```
   Expected: References `user.id` with CASCADE delete

3. **Index exists**:
   ```sql
   SELECT indexname, indexdef
   FROM pg_indexes
   WHERE tablename = 'tasks' AND indexname = 'idx_tasks_user_id';
   ```
   Expected: Index on `user_id` column

## Related Files

- **Migration**: `backend/alembic/versions/002_change_user_id_to_text.py`
- **Model**: `backend/app/models/task.py` (updated `user_id` type)
- **Spec**: `specs/002-auth-security/data-model.md`

## Notes

- This migration is idempotent (can be run multiple times safely)
- Foreign key constraint name changed from `tasks_user_id_fkey` to `fk_tasks_user` for clarity
- Better Auth uses singular table names (`user`, `account`, `session`)
- PostgreSQL constraint names are case-insensitive
