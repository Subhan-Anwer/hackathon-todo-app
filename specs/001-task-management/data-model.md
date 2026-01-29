# Data Model: Task Management

**Feature**: 001-task-management | **Date**: 2026-01-29 | **Phase**: 1 (Design)

## Overview

This document defines the conceptual data model for task management. It describes entities, relationships, validation rules, and state transitions without implementation-specific details.

## Entity: Task

### Description

A Task represents a single work item or todo entry owned by a specific user. Each task has a unique identifier, belongs to exactly one user (immutable ownership), and can be marked as complete or incomplete.

### Attributes

| Attribute | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| `id` | Integer | Auto-generated | Primary key, unique, auto-increment | Unique identifier for the task |
| `user_id` | Integer | Yes | Foreign key to User entity, immutable, indexed | Owner of the task (set at creation, never changes) |
| `title` | String | Yes | 1-500 characters after trimming, non-whitespace | Task title or summary |
| `description` | String | No | 0-5000 characters, nullable | Optional detailed description of the task |
| `completed` | Boolean | Yes | Default: false | Completion status (false = incomplete, true = complete) |
| `created_at` | Timestamp | Auto-generated | UTC timestamp, immutable | When the task was created |
| `updated_at` | Timestamp | Auto-updated | UTC timestamp, updates on modification | Last modification timestamp |

### Validation Rules

**Title Validation** (FR-002, FR-017):
- Must not be empty or null
- Must contain at least one non-whitespace character
- Leading and trailing whitespace must be trimmed before storage
- Maximum length: 500 characters after trimming
- Validation applies to both creation and updates

**Description Validation** (FR-001):
- Optional field (can be null or empty string)
- Maximum length: 5000 characters
- No trimming required (preserve user formatting)

**Completed Validation** (FR-015):
- Must be boolean value (true or false)
- Cannot be null or undefined
- Defaults to false when task is created

**User ID Validation** (FR-003):
- Must reference a valid user in the User entity
- Set automatically from authenticated user context at creation time
- Cannot be modified after task creation (immutable ownership)
- Must never be accepted from client input (security requirement)

### Indexes

| Column(s) | Type | Purpose |
|-----------|------|---------|
| `id` | Primary Key | Unique identification and direct lookup |
| `user_id` | Foreign Key + Index | Fast filtering by owner (primary access pattern) |
| `completed` | Index | Efficient filtering by completion status |
| `created_at` | Index (optional) | Efficient sorting by creation date |

**Index Rationale**:
- `user_id` index is critical: all queries filter by authenticated user (100% of operations)
- `completed` index enables efficient filtering (e.g., "show incomplete tasks only")
- `created_at` index supports default sort order (newest first)

### Relationships

**Task → User (Many-to-One)**:
- Each task belongs to exactly one user
- A user can have zero or many tasks
- Foreign key constraint ensures referential integrity
- Relationship is immutable after creation

**Cardinality**: N tasks : 1 user (many-to-one)

**Cascade Behavior** (requires ADR decision):
- **On User Delete**: Recommended approach TBD (CASCADE deletes tasks vs. RESTRICT prevents deletion vs. SET NULL orphans tasks)
- **Note**: User deletion is out of scope for this feature but should be considered by authentication spec

## Entity: Task Ownership

### Description

Task Ownership is not a separate database entity but rather a conceptual relationship embedded in the Task entity through the `user_id` foreign key. This section documents the ownership semantics and enforcement rules.

### Ownership Rules

**Establishment** (FR-003):
- Ownership is established at task creation time
- The authenticated user making the CREATE request becomes the owner
- User ID is extracted from JWT token (never from request body)

**Immutability** (FR-003, FR-007):
- Once created, task ownership never changes
- No "transfer ownership" or "reassign task" operations exist
- Updates to title/description preserve ownership
- Completion status changes preserve ownership

**Authorization** (FR-004, FR-010):
- Only the owner can view a task's details
- Only the owner can update a task's title or description
- Only the owner can toggle a task's completion status
- Only the owner can delete a task
- Attempts to access tasks owned by other users return 404 (not found)

**Isolation Guarantee** (SC-003):
- 100% of task operations must return only tasks owned by the authenticated user
- No operation can expose tasks from other users
- Backend enforces isolation at query level (all queries include user_id filter)

## State Transitions

### Task Lifecycle

```
[DOES NOT EXIST]
       |
       | POST /tasks (Create)
       v
[INCOMPLETE] (completed = false)
       |
       | PATCH /tasks/{id}/complete (Toggle)
       v
   [COMPLETE] (completed = true)
       |
       | PATCH /tasks/{id}/complete (Toggle)
       v
[INCOMPLETE] (completed = false)
       |
       | DELETE /tasks/{id} (Delete)
       v
[DOES NOT EXIST]
```

### State Transition Rules

**Creation** (User Story 1):
- Initial state: completed = false
- Requires: authenticated user, valid title
- Side effects: assigns user_id from JWT, sets created_at and updated_at timestamps

**Completion Toggle** (User Story 2):
- Allowed transitions: incomplete ↔ complete
- Operation: invert boolean value (false → true or true → false)
- Side effects: updates updated_at timestamp
- Restrictions: only owner can toggle

**Update Title/Description** (User Story 3):
- Allowed from: any state (incomplete or complete)
- Does not change: completed status, ownership, creation timestamp
- Side effects: updates updated_at timestamp
- Restrictions: only owner can update, title validation must pass

**Deletion** (User Story 4):
- Allowed from: any state (incomplete or complete)
- Operation: permanent removal from database
- No soft delete or archive functionality
- Restrictions: only owner can delete
- Side effects: task no longer exists, cannot be recovered

### Concurrent Modification Strategy

**Approach**: Last-write-wins (as per spec Assumptions)

**Behavior**:
- No optimistic locking or version fields required
- If two update operations occur simultaneously, last one to commit wins
- Frontend may implement optimistic UI updates but must handle backend conflicts

**Future Enhancement**: Add `version` field for optimistic locking if concurrent editing becomes an issue.

## Data Integrity Constraints

### Database-Level Constraints

**Primary Key**:
- `id` must be unique across all tasks
- Auto-incrementing integer (ensures uniqueness)

**Foreign Key**:
- `user_id` must reference valid user in User entity
- Prevents orphaned tasks (tasks with invalid user_id)
- Cascade behavior TBD by authentication spec

**NOT NULL Constraints**:
- `id` cannot be null (primary key)
- `user_id` cannot be null (ownership required)
- `title` cannot be null (required field)
- `completed` cannot be null (boolean state required)
- `created_at` cannot be null (timestamp required)
- `updated_at` cannot be null (timestamp required)

**CHECK Constraints** (optional, enforced by application):
- `title` length between 1 and 500 characters
- `description` length between 0 and 5000 characters (if not null)

### Application-Level Validation

**Whitespace Validation** (FR-002, FR-017):
- Title must not be only whitespace
- Trim leading/trailing whitespace before storage
- Enforced in Pydantic schemas before database write

**Character Encoding**:
- All text fields must support UTF-8 encoding
- Emojis and special characters allowed (FR-016)
- Database must use UTF-8 collation

## Query Patterns

### Primary Access Patterns

**Pattern 1: List User's Tasks** (FR-005):
```
SELECT * FROM tasks
WHERE user_id = {authenticated_user_id}
ORDER BY created_at DESC
```
- Used by: GET /api/v1/tasks
- Frequency: High (every page load)
- Optimization: Index on user_id + created_at

**Pattern 2: Get Single Task** (FR-006):
```
SELECT * FROM tasks
WHERE id = {task_id}
  AND user_id = {authenticated_user_id}
```
- Used by: GET /api/v1/tasks/{id}
- Frequency: Medium (detail views)
- Optimization: Primary key lookup + user_id check

**Pattern 3: Filter by Completion Status** (User Story 5):
```
SELECT * FROM tasks
WHERE user_id = {authenticated_user_id}
  AND completed = {true|false}
ORDER BY created_at DESC
```
- Used by: Frontend filtering
- Frequency: Medium (user toggles filter)
- Optimization: Composite index on (user_id, completed)

**Pattern 4: Update Task** (FR-007):
```
UPDATE tasks
SET title = {new_title},
    description = {new_description},
    updated_at = {current_timestamp}
WHERE id = {task_id}
  AND user_id = {authenticated_user_id}
```
- Used by: PUT /api/v1/tasks/{id}
- Frequency: Low (occasional edits)
- Optimization: Primary key + user_id check

**Pattern 5: Delete Task** (FR-009):
```
DELETE FROM tasks
WHERE id = {task_id}
  AND user_id = {authenticated_user_id}
```
- Used by: DELETE /api/v1/tasks/{id}
- Frequency: Low (occasional deletions)
- Optimization: Primary key + user_id check

## Performance Considerations

### Expected Data Volumes

**Per User**:
- Target: 0-100 tasks (SC-008 performance target)
- Maximum: ~1000 tasks (soft limit, no hard constraint)

**System-Wide**:
- Users: 10-100 concurrent users initially
- Total tasks: ~10,000 tasks maximum in early deployment

### Storage Estimates

**Per Task**:
- Fixed fields: ~50 bytes (id, user_id, completed, timestamps)
- Title: ~500 bytes maximum (average ~50 bytes)
- Description: ~5000 bytes maximum (average ~200 bytes)
- **Total per task**: ~250 bytes average, ~5550 bytes maximum

**100 Tasks per User**:
- Average: ~25 KB per user
- Maximum: ~555 KB per user

**10,000 Total Tasks**:
- Average: ~2.5 MB total
- Maximum: ~55 MB total

**Conclusion**: Storage is not a constraint. Database performance bottleneck will be query optimization, not storage capacity.

### Query Performance Targets

**Target Latencies** (from SC-001, SC-008):
- List tasks query: < 50ms (database only)
- Single task lookup: < 10ms (primary key + index)
- Update/delete operations: < 20ms
- API response time (including network): < 200ms p95

**Optimization Strategies**:
- Proper indexing on user_id and completed
- Connection pooling for database connections
- Limit result set size (no unbounded queries)

## Migration Strategy

### Initial Schema

**Task Table Creation**:
```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
```

**Note**: Actual migration scripts will be generated by Database Agent (neon-db-manager) during implementation phase.

### Backward Compatibility

**Initial Version**: No backward compatibility concerns (new feature)

**Future Migrations**:
- Adding new columns: Use nullable columns or default values
- Changing constraints: Requires data migration if existing data violates new rules
- Schema versioning: Use Alembic migration numbers

## Security Considerations

### Data Isolation

**Mechanism**: Foreign key + query-level filtering

**Enforcement Points**:
1. Database foreign key constraint prevents orphaned tasks
2. All queries include `WHERE user_id = {authenticated_user_id}`
3. JWT middleware extracts user_id before query execution
4. No query can bypass user_id filter

**Threat Mitigation**:
- SQL Injection: Parameterized queries (SQLModel handles this)
- Unauthorized Access: User ID from JWT, never from request body
- User Enumeration: Return 404 (not 403) for tasks that don't exist or don't belong to user

### Data Validation

**Input Sanitization**:
- Title and description are user-provided text (no executable code)
- XSS protection: Frontend (React) escapes output by default
- SQL injection protection: ORM uses parameterized queries
- Character encoding: UTF-8 handles international characters safely

**Sensitive Data**:
- Tasks may contain sensitive user information in title/description
- Enforce HTTPS in production (prevent man-in-the-middle attacks)
- Database encryption at rest (Neon provides this)
- Logs should not include task content (only IDs)

## Appendix: Sample Data

### Example Task Records

**Task 1: Simple Todo**
```json
{
  "id": 1,
  "user_id": 42,
  "title": "Buy groceries",
  "description": null,
  "completed": false,
  "created_at": "2026-01-29T10:30:00Z",
  "updated_at": "2026-01-29T10:30:00Z"
}
```

**Task 2: Detailed Task**
```json
{
  "id": 2,
  "user_id": 42,
  "title": "Meeting prep",
  "description": "Review agenda and prepare slides for quarterly review meeting on Friday",
  "completed": false,
  "created_at": "2026-01-29T11:15:00Z",
  "updated_at": "2026-01-29T11:15:00Z"
}
```

**Task 3: Completed Task**
```json
{
  "id": 3,
  "user_id": 42,
  "title": "Submit invoice",
  "description": "Invoice #2024-Q4-001 submitted to accounting",
  "completed": true,
  "created_at": "2026-01-28T09:00:00Z",
  "updated_at": "2026-01-29T14:20:00Z"
}
```

**Task 4: Special Characters**
```json
{
  "id": 4,
  "user_id": 42,
  "title": "🎉 Celebrate launch! 🚀",
  "description": "Team celebration @ café - don't forget 🎂",
  "completed": false,
  "created_at": "2026-01-29T16:00:00Z",
  "updated_at": "2026-01-29T16:00:00Z"
}
```

## Conclusion

This data model supports all functional requirements (FR-001 through FR-018) and success criteria (SC-001 through SC-010) defined in spec.md. The design prioritizes simplicity, security (data isolation), and performance (indexed queries) while maintaining flexibility for future enhancements.

**Next Steps**: Generate API contracts (OpenAPI specification) and quickstart documentation.
