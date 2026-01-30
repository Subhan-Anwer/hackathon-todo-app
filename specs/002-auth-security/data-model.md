# Data Model: Authentication & Security

**Feature**: 002-auth-security
**Date**: 2026-01-29
**Input**: research.md findings + spec.md requirements

This document defines the data entities, relationships, and access patterns for the authentication and authorization system.

---

## Entity Relationship Diagram

```
┌─────────────────────┐
│       User          │
│  (Better Auth)      │
├─────────────────────┤
│ id (PK)            │◄─────┐
│ email (UNIQUE)      │      │
│ emailVerified       │      │
│ name                │      │
│ createdAt           │      │ One-to-Many
│ updatedAt           │      │
└─────────────────────┘      │
                             │
                             │
┌─────────────────────┐      │
│       Account       │      │
│  (Better Auth)      │      │
├─────────────────────┤      │
│ id (PK)            │      │
│ userId (FK)        ├──────┘
│ accountId           │
│ providerId          │
│ password (hashed)   │
│ ...                 │
└─────────────────────┘


┌─────────────────────┐
│       Task          │
│  (Application)      │
├─────────────────────┤
│ id (PK)            │
│ user_id (FK)       ├──────┐
│ title               │      │ Many-to-One
│ description         │      │
│ status              │      │
│ created_at          │      │
│ updated_at          │      │
└─────────────────────┘      │
                             │
                             │
                             └─────────►┌─────────────────────┐
                                        │       User          │
                                        │  (Better Auth)      │
                                        ├─────────────────────┤
                                        │ id (PK)            │
                                        └─────────────────────┘
```

---

## Entity 1: User

### Purpose
Represents an authenticated user account. Managed entirely by Better Auth library.

### Table Name
`user`

### Attributes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique user identifier (UUID string) |
| `email` | TEXT | UNIQUE, NOT NULL | User email address for authentication |
| `emailVerified` | BOOLEAN | DEFAULT FALSE | Whether email has been verified |
| `name` | TEXT | NULLABLE | User's display name (optional) |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

### Relationships

- **One-to-Many with Task**: One user can own multiple tasks
  - Foreign key: `task.user_id` → `user.id`
  - Cascade: ON DELETE CASCADE (deleting user deletes their tasks)

- **One-to-Many with Account**: One user can have multiple authentication accounts
  - Foreign key: `account.userId` → `user.id`
  - Managed by Better Auth

### Validation Rules

1. **Email Validation**:
   - Must be valid email format (RFC 5322)
   - Must be unique across all users
   - Case-insensitive comparison

2. **Email Verification**:
   - emailVerified defaults to FALSE
   - Better Auth handles email verification flow

### Access Patterns

1. **Lookup by email** (signin flow):
   ```sql
   SELECT * FROM user WHERE email = $1;
   ```
   - Used during authentication
   - Indexed for performance (UNIQUE constraint provides index)

2. **Lookup by ID** (JWT verification):
   ```sql
   SELECT * FROM user WHERE id = $1;
   ```
   - Used to validate user still exists
   - Primary key provides index

### Schema Management

- **Created by**: Better Auth automatically on first run
- **Migrations**: Managed by Better Auth
- **Application Access**: Read-only (via JWT claims)
- **Direct Modifications**: None (Better Auth handles all user updates)

### Security Notes

- ⚠️ **Application should NOT directly modify this table**
- ⚠️ **User ID comes from JWT claims, not queries**
- ⚠️ **Better Auth handles password hashing automatically**

---

## Entity 2: Account

### Purpose
Stores authentication credentials for users. Managed by Better Auth. Supports multiple authentication providers (email/password, OAuth, etc.).

### Table Name
`account`

### Attributes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique account identifier |
| `userId` | TEXT | FOREIGN KEY → user(id) | Reference to user |
| `accountId` | TEXT | NOT NULL | Provider-specific account ID |
| `providerId` | TEXT | NOT NULL | Auth provider identifier (email, google, etc.) |
| `password` | TEXT | NULLABLE | Bcrypt hashed password (for email provider) |
| ... | ... | ... | Other Better Auth managed fields |

### Relationships

- **Many-to-One with User**: Multiple accounts can belong to one user
  - Foreign key: `userId` → `user.id`

### Security Notes

- ⚠️ **Passwords are bcrypt hashed by Better Auth**
- ⚠️ **Application NEVER accesses password field**
- ⚠️ **Better Auth manages this table entirely**

---

## Entity 3: Task

### Purpose
Represents a todo task belonging to a specific authenticated user. Extended from original console app to include user ownership.

### Table Name
`tasks`

### Attributes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique task identifier |
| `user_id` | TEXT | FOREIGN KEY → user(id), NOT NULL, INDEXED | Owner of the task (CRITICAL) |
| `title` | VARCHAR(200) | NOT NULL | Task title |
| `description` | TEXT | NULLABLE | Optional task description |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | Task status (enum) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Task creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last modification timestamp |

### Relationships

- **Many-to-One with User**: Multiple tasks belong to one user
  - Foreign key: `user_id` → `user.id`
  - Cascade: ON DELETE CASCADE
  - Indexed for query performance

### Validation Rules

1. **user_id**:
   - Must reference a valid user.id
   - Cannot be NULL
   - Enforced by database foreign key constraint

2. **title**:
   - Cannot be empty string
   - Maximum length 200 characters
   - Validated by backend Pydantic schema

3. **status**:
   - Must be one of: `"pending"`, `"in_progress"`, `"completed"`
   - Validated by backend Pydantic schema
   - Consider database CHECK constraint or ENUM type

### Access Patterns

1. **PRIMARY: Fetch tasks by user** (most common query):
   ```sql
   SELECT * FROM tasks
   WHERE user_id = $1
   ORDER BY created_at DESC;
   ```
   - ⚠️ **CRITICAL**: ALL queries MUST filter by user_id
   - Index on user_id ensures O(log n) performance

2. **Create task for user**:
   ```sql
   INSERT INTO tasks (user_id, title, description, status, created_at, updated_at)
   VALUES ($1, $2, $3, 'pending', NOW(), NOW())
   RETURNING *;
   ```
   - user_id comes from JWT claims (NEVER from request body)

3. **Update task with ownership verification**:
   ```sql
   UPDATE tasks
   SET title = $2, description = $3, status = $4, updated_at = NOW()
   WHERE id = $1 AND user_id = $5
   RETURNING *;
   ```
   - WHERE clause includes both id AND user_id
   - Returns NULL if user doesn't own task (403 Forbidden)

4. **Delete task with ownership verification**:
   ```sql
   DELETE FROM tasks
   WHERE id = $1 AND user_id = $2;
   ```
   - WHERE clause includes both id AND user_id
   - No rows affected if user doesn't own task (403 Forbidden)

### Indexes

1. **Primary Key Index** (automatic):
   ```sql
   CREATE INDEX idx_tasks_id ON tasks(id);
   ```

2. **User ID Index** (required for performance):
   ```sql
   CREATE INDEX idx_tasks_user_id ON tasks(user_id);
   ```
   - Enables fast filtering by user_id
   - Critical for multi-user performance

3. **Composite Index** (optional optimization):
   ```sql
   CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
   ```
   - Useful for filtering by user and status
   - Consider if "get pending tasks" is common query

### Migration from Single-User to Multi-User

**If tasks table already exists without user_id**:

```sql
-- Step 1: Add user_id column (nullable initially)
ALTER TABLE tasks ADD COLUMN user_id TEXT;

-- Step 2: Create a default/migration user or delete test data
-- Option A: Delete all existing tasks (if test data)
-- DELETE FROM tasks;

-- Option B: Create a migration user and assign tasks
-- INSERT INTO user (id, email, name) VALUES ('migration-user-id', 'migration@example.com', 'Migration User');
-- UPDATE tasks SET user_id = 'migration-user-id' WHERE user_id IS NULL;

-- Step 3: Make user_id NOT NULL
ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE tasks
ADD CONSTRAINT fk_tasks_user
FOREIGN KEY (user_id) REFERENCES user(id)
ON DELETE CASCADE;

-- Step 5: Create index
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
```

### Security Constraints

⚠️ **CRITICAL SECURITY REQUIREMENTS**:

1. **User ID Source**:
   - ✅ **ALWAYS** extract user_id from verified JWT claims
   - ❌ **NEVER** trust user_id from request body
   - ❌ **NEVER** trust user_id from query parameters
   - ❌ **NEVER** trust user_id from URL path

2. **Query Filtering**:
   - ✅ **ALWAYS** filter queries by `user_id = jwt_claims.user_id`
   - ❌ **NEVER** query all tasks without user filter
   - ❌ **NEVER** trust client-provided user_id for filtering

3. **Ownership Verification**:
   - ✅ **ALWAYS** verify task.user_id matches JWT user_id before update
   - ✅ **ALWAYS** verify task.user_id matches JWT user_id before delete
   - ✅ **ALWAYS** include user_id in WHERE clause for modifications

4. **Error Responses**:
   - Return 403 Forbidden if task exists but user_id doesn't match
   - Return 404 Not Found if task doesn't exist at all
   - Do NOT leak whether task exists for other users

### SQLModel Implementation

```python
from sqlmodel import Field, SQLModel
from typing import Optional
from datetime import datetime

class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)

    # CRITICAL: Foreign key to user table
    user_id: str = Field(
        foreign_key="user.id",
        index=True,
        nullable=False,
        description="Owner of the task (from JWT claims)"
    )

    title: str = Field(
        min_length=1,
        max_length=200,
        description="Task title"
    )

    description: Optional[str] = Field(
        default=None,
        description="Optional task description"
    )

    status: str = Field(
        default="pending",
        regex="^(pending|in_progress|completed)$",
        description="Task status"
    )

    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Task creation timestamp"
    )

    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Last update timestamp"
    )
```

---

## Entity 4: JWT Token (Conceptual)

### Purpose
Cryptographically signed token containing user identity claims. NOT persisted in database (stateless authentication).

### Lifecycle

1. **Issuance**: Better Auth generates JWT after successful signup/signin
2. **Storage**: Stored in httpOnly cookie in browser
3. **Transmission**: Sent to backend via `Authorization: Bearer <token>` header
4. **Verification**: Backend verifies signature using shared JWT secret
5. **Expiration**: Token expires after 24 hours (configurable)

### Claims Structure

Standard JWT payload:
```json
{
  "sub": "user-uuid-12345",           // User ID (standard claim)
  "email": "user@example.com",        // User email
  "iat": 1706515200,                  // Issued at (Unix timestamp)
  "exp": 1706601600                   // Expires at (Unix timestamp)
}
```

Alternative (if Better Auth uses custom field names):
```json
{
  "user_id": "user-uuid-12345",       // User ID (custom claim)
  "email": "user@example.com",
  "iat": 1706515200,
  "exp": 1706601600
}
```

### Security Properties

1. **Signature**: HMAC SHA-256 (HS256) using shared secret
2. **Tamper-Proof**: Any modification invalidates signature
3. **Stateless**: No database lookup required for verification
4. **Time-Limited**: Expires after configured duration
5. **Verifiable**: Both frontend and backend can verify using shared secret

### Verification Process

```python
import jwt

def verify_jwt_token(token: str) -> dict:
    """
    Verify JWT signature and expiration.
    Extract user_id and email from claims.
    """
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"]
        )

        # Extract user identity
        user_id = payload.get("sub") or payload.get("user_id")
        email = payload.get("email")

        if not user_id:
            raise ValueError("Invalid token payload")

        return {
            "user_id": user_id,
            "email": email,
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
```

### Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| Secret | `JWT_SECRET` env var | Minimum 256 bits (32+ chars) |
| Algorithm | HS256 | HMAC SHA-256 symmetric signing |
| Expiration | 24 hours | Default token lifetime |
| Issuer | Better Auth | Token generation service |
| Verifier | FastAPI | Token verification service |

---

## Summary

### Database Tables

| Table | Owner | Purpose | Application Access |
|-------|-------|---------|-------------------|
| `user` | Better Auth | User accounts | Read-only via JWT |
| `account` | Better Auth | Auth credentials | No direct access |
| `tasks` | Application | User todos | Full CRUD with user filtering |

### Critical Relationships

1. **User → Task**: One-to-Many, CASCADE delete
   - Ensures data isolation per user
   - Foreign key enforces referential integrity

2. **User → Account**: One-to-Many (Better Auth managed)
   - Supports multiple auth providers per user

### Security Model

- **Authentication**: JWT token verifies user identity
- **Authorization**: user_id from JWT filters all data access
- **Isolation**: Database foreign keys + application filtering
- **Trust Boundary**: Backend is the only trusted component

### Query Performance

- Index on `tasks.user_id` enables O(log n) filtering
- Primary key indexes for direct lookups
- Consider composite indexes for common filter combinations

### Next Steps

Use this data model to:
1. Create database migration scripts
2. Implement SQLModel models in backend
3. Generate API contracts in contracts/ directory
4. Build FastAPI endpoints with proper filtering
