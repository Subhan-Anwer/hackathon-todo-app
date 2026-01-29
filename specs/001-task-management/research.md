# Research & Architectural Decisions: Task Management

**Feature**: 001-task-management | **Date**: 2026-01-29 | **Phase**: 0 (Research)

## Overview

This document captures architectural research and key technical decisions for implementing the Task Management feature. All decisions align with the project constitution and support the functional requirements defined in spec.md.

## Key Architectural Decisions

### Decision 1: Task Ownership Enforcement Location

**Context**: Task ownership must be enforced to ensure 100% user data isolation (FR-004, FR-010, SC-003).

**Options Considered**:

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A. Frontend Enforcement | Frontend filters tasks by user_id before display | Simple frontend logic | Insecure - backend still exposes all data; client can be manipulated |
| B. Backend Enforcement | Backend filters all queries by authenticated user_id from JWT | Secure; impossible to bypass; single source of truth | Requires JWT middleware on all endpoints |
| C. Hybrid Approach | Backend enforces, frontend also filters | Defense in depth | Redundant; complexity without security benefit |

**Decision**: **Option B - Backend Enforcement** ✅

**Rationale**:
- **Security**: Frontend enforcement is insufficient - malicious clients can manipulate requests to access other users' tasks
- **Constitution Compliance**: Constitution principle II mandates backend enforcement at database query level
- **Single Source of Truth**: Backend is the authoritative source for authorization decisions
- **Defense in Depth**: JWT middleware creates a secure boundary that cannot be bypassed
- **Simplicity**: Frontend becomes simpler - it only displays data the backend sends (which is already user-filtered)

**Implementation Approach**:
- JWT verification middleware extracts user_id from token before all task endpoints
- All SQLModel queries include `.where(Task.user_id == current_user.id)` filter
- Ownership verification before update/delete operations (compare task.user_id with JWT user_id)
- Return 404 (not 403) for tasks that don't exist or don't belong to user (prevents information leakage)

**Trade-offs Accepted**:
- Every task endpoint requires JWT middleware overhead (~1-2ms per request)
- Backend must maintain authentication state awareness

---

### Decision 2: Task Completion Model

**Context**: Users need to mark tasks as complete/incomplete (FR-008, User Story 2).

**Options Considered**:

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A. Boolean `completed` | Single boolean field (true/false) | Simple queries; clear semantics; sufficient for MVP | Cannot represent future states (archived, snoozed) |
| B. Status Enum | Enum field (pending, in_progress, completed, archived) | Extensible; supports workflow states | Overengineered for current requirements; complex queries |
| C. Timestamp-based | `completed_at` timestamp (NULL = incomplete) | Can track completion time | Less intuitive; NULL handling complexity |

**Decision**: **Option A - Boolean `completed` Field** ✅

**Rationale**:
- **YAGNI Principle**: Spec explicitly scopes to complete/incomplete binary state only
- **Query Simplicity**: `WHERE completed = false` is simpler than enum-based filtering
- **Performance**: Boolean index is more efficient than enum or timestamp indexes
- **User Model Alignment**: Spec uses "complete" and "incomplete" terminology consistently
- **Constitution Compliance**: Spec-first workflow mandates implementing only specified behavior

**Implementation Approach**:
- Database: `completed BOOLEAN DEFAULT FALSE NOT NULL`
- SQLModel: `completed: bool = Field(default=False)`
- API: PATCH `/tasks/{id}/complete` toggles boolean state
- Frontend: Checkbox UI element bound to completed state

**Trade-offs Accepted**:
- Cannot track when task was completed (could add `completed_at` later if needed)
- Cannot represent intermediate states (but spec doesn't require them)

**Future Extension Path**: If future spec requires completion timestamps or workflow states, can add `completed_at` timestamp or migrate to enum without breaking API contracts (boolean maps to enum variants).

---

### Decision 3: API Granularity and REST Design

**Context**: Backend must expose task operations via REST API (FR-001 through FR-018).

**Options Considered**:

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A. Action-Based | Separate endpoints per action (`/create-task`, `/delete-task`, etc.) | Explicit naming | Non-RESTful; proliferation of endpoints |
| B. RESTful Resources | Standard REST (`GET /tasks`, `POST /tasks`, `PUT /tasks/{id}`, etc.) | Industry standard; HTTP verb semantics; cacheable | Requires understanding of REST conventions |
| C. GraphQL | Single endpoint with query language | Flexible queries; reduced over-fetching | Overengineered for CRUD; additional complexity |

**Decision**: **Option B - RESTful Resource-Based Endpoints** ✅

**Rationale**:
- **Constitution Alignment**: CLAUDE.md explicitly states "Must align with REST-based architecture"
- **HTTP Semantics**: Leverage standard HTTP verbs (GET=read, POST=create, PUT=update, DELETE=delete)
- **Caching**: GET requests are cacheable by HTTP intermediaries
- **Tooling**: OpenAPI/Swagger documentation generates automatically from FastAPI route decorators
- **Industry Standard**: Developers expect REST patterns for CRUD operations

**Implementation Approach**:

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/v1/tasks` | GET | List all user's tasks | Yes |
| `/api/v1/tasks` | POST | Create new task | Yes |
| `/api/v1/tasks/{id}` | GET | Get single task details | Yes |
| `/api/v1/tasks/{id}` | PUT | Update task title/description | Yes |
| `/api/v1/tasks/{id}` | DELETE | Delete task permanently | Yes |
| `/api/v1/tasks/{id}/complete` | PATCH | Toggle completion status | Yes |

**Design Decisions**:
- Completion toggle uses PATCH (partial update) on sub-resource `/complete`
- All endpoints return consistent JSON format: `{"success": bool, "data": {...}, "error": {...}}`
- Use 404 for not-found/not-authorized (prevents user enumeration)
- Use 400 for validation errors, 401 for missing auth, 422 for unprocessable entities

**Trade-offs Accepted**:
- Requires understanding of REST/HTTP conventions
- Toggle completion requires dedicated endpoint (can't use generic PATCH due to clearer semantics)

---

### Decision 4: Validation Strategy

**Context**: Task titles must be validated (FR-001, FR-002, FR-017), and invalid data must be rejected.

**Options Considered**:

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A. Frontend-Only | JavaScript validation before submission | Instant feedback; reduced server load | Insecure; can be bypassed; backend accepts invalid data |
| B. Backend-Enforced | Pydantic models validate all inputs | Secure; prevents invalid persistence; single source of truth | Requires network round-trip for feedback |
| C. Duplicated | Both frontend and backend validate | Best UX; secure | Maintenance burden; validation logic duplication |

**Decision**: **Option B - Backend-Enforced Validation** (with optional frontend enhancement) ✅

**Rationale**:
- **Security**: Frontend validation can be bypassed - backend must be authoritative
- **Data Integrity**: Invalid data must never reach the database
- **Pydantic Integration**: FastAPI automatically validates request bodies against Pydantic schemas
- **Single Source of Truth**: Validation rules live in one place (backend schemas)
- **Constitution Compliance**: Aligns with backend-first security model

**Implementation Approach**:

**Backend (Required)**:
```python
class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=5000)

    @validator('title')
    def title_must_not_be_whitespace(cls, v):
        if not v.strip():
            raise ValueError('Title must contain non-whitespace characters')
        return v.strip()  # Trim whitespace (FR-017)
```

**Validation Rules**:
- Title: 1-500 characters after trimming, non-empty, non-whitespace-only
- Description: 0-5000 characters (optional)
- Completed: Boolean only (no null/undefined)
- User ID: Extracted from JWT (never accepted from request body)

**Error Response Format**:
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {"field": "title", "error": "Title must contain non-whitespace characters"}
    ]
  }
}
```

**Frontend (Optional Enhancement)**:
- Can add client-side validation for better UX (instant feedback)
- Must match backend rules exactly
- Never rely on frontend validation for security

**Trade-offs Accepted**:
- User must wait for server response to see validation errors
- Network latency affects validation feedback speed

**Future Enhancement**: Add frontend validation matching backend rules for instant feedback while maintaining backend enforcement.

---

## Technology Stack Research

### FastAPI for REST API

**Chosen Framework**: FastAPI 0.115+

**Rationale**:
- **Constitution Mandate**: Required by project constitution
- **Performance**: Async/await support for concurrent request handling
- **Type Safety**: Full type hints enable editor autocomplete and static analysis
- **Auto Documentation**: OpenAPI/Swagger docs generated automatically from route definitions
- **Pydantic Integration**: Native support for request/response validation
- **Dependency Injection**: Built-in DI system for JWT middleware and database sessions

**Best Practices**:
- Use APIRouter for modular endpoint organization
- Dependency injection for user authentication (`Depends(get_current_user)`)
- Response models for type-safe responses
- Exception handlers for consistent error responses

---

### SQLModel for ORM

**Chosen ORM**: SQLModel 0.0.16+

**Rationale**:
- **Constitution Mandate**: Required by project constitution
- **Type Safety**: Combines SQLAlchemy and Pydantic for validated models
- **Single Definition**: One model serves as both ORM and validation schema
- **FastAPI Integration**: Native compatibility with FastAPI response models
- **Migration Support**: Uses Alembic for schema migrations

**Best Practices**:
- Define `Task` model with SQLModel base class
- Use `Field()` for column definitions and validation
- Implement relationships with `Relationship()` for user foreign keys
- Create separate Pydantic schemas for request/response when needed

**Data Model Design**:
```python
class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    title: str = Field(max_length=500, index=False)
    description: Optional[str] = Field(default=None, max_length=5000)
    completed: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

---

### Neon Serverless PostgreSQL

**Chosen Database**: Neon Serverless PostgreSQL

**Rationale**:
- **Constitution Mandate**: Required by project constitution
- **Serverless**: Auto-scaling, pay-per-use pricing model
- **PostgreSQL Compatibility**: Full PostgreSQL 15+ feature set
- **Connection Pooling**: Built-in pooling for serverless environments
- **Branching**: Database branching for preview deployments

**Best Practices**:
- Use connection pooling (Neon's built-in pooler or pgbouncer)
- Set reasonable connection limits for serverless (max_connections in config)
- Use indexes on user_id and completed columns for query performance
- Enable SSL/TLS for connections (required in production)

**Connection String Format**:
```
postgresql://user:password@host/database?sslmode=require
```

---

### Next.js 16 App Router

**Chosen Frontend Framework**: Next.js 16+ with App Router

**Rationale**:
- **Constitution Mandate**: Required by project constitution
- **Server Components**: Reduced client bundle size, faster initial loads
- **Client Components**: Interactivity where needed (forms, toggles)
- **TypeScript**: Type-safe frontend development
- **API Routes**: Can create backend-for-frontend if needed

**Best Practices**:
- Use Server Components for task list fetching (reduce client JS)
- Use Client Components for forms and interactive elements
- Implement optimistic UI updates for better perceived performance
- Use `fetch()` with cache control for data fetching

---

## Integration Patterns

### JWT Authentication Flow

**Pattern**: JWT token verification middleware extracts user context

**Flow**:
1. User authenticates → Better Auth issues JWT token
2. Frontend stores token (localStorage or httpOnly cookie)
3. Frontend includes token in Authorization header: `Bearer <token>`
4. Backend middleware verifies JWT signature and expiry
5. Backend extracts user_id from JWT claims
6. Backend injects `current_user` into request context
7. Task operations filter by `current_user.id`

**Security Considerations**:
- JWT secret must be cryptographically secure (32+ bytes)
- Token expiry should be reasonable (1-24 hours)
- Refresh token mechanism for long-lived sessions
- HTTPS required in production (prevent token interception)

---

### Frontend-Backend Communication

**Pattern**: RESTful API client with token management

**Implementation**:
```typescript
// lib/api/tasks.ts
async function fetchTasks(): Promise<Task[]> {
  const token = getAuthToken(); // From auth context
  const response = await fetch(`${API_URL}/api/v1/tasks`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  return data.data; // Extract from success envelope
}
```

**Error Handling**:
- 401 → Redirect to login (token expired/invalid)
- 404 → Task not found or not authorized
- 400/422 → Validation error (display to user)
- 500 → Server error (generic error message)

---

## Performance Considerations

### Database Query Optimization

**Indexes Required**:
- `user_id` (foreign key): Enables fast filtering by user (primary access pattern)
- `completed` (boolean): Enables fast filtering by completion status
- `created_at` (timestamp): Enables efficient sorting for display order

**Query Pattern**:
```python
# Optimized query with indexes
tasks = session.exec(
    select(Task)
    .where(Task.user_id == current_user.id)
    .order_by(Task.created_at.desc())
).all()
```

**Expected Performance**:
- Index scan on user_id: O(log n) lookup + O(k) results (k = tasks per user)
- Target: < 50ms for queries with 100 tasks per user

---

### API Response Times

**Targets** (from SC-001, SC-008):
- Single task operations: < 200ms p95
- Task list fetch (100 tasks): < 3 seconds total (includes network + rendering)

**Optimization Strategies**:
- Database connection pooling (reuse connections)
- Efficient SQL queries with proper indexes
- Minimal data transfer (only required fields)
- HTTP/2 for multiplexed requests

---

## Testing Strategy

### Backend Testing

**Test Levels**:

1. **Unit Tests** (`tests/test_validation.py`):
   - Pydantic model validation
   - Title trimming logic
   - Character limit enforcement

2. **Authorization Tests** (`tests/test_authorization.py`):
   - User A cannot access User B's tasks
   - Missing JWT returns 401
   - Invalid JWT returns 401
   - Task not found returns 404 (not 403)

3. **API Contract Tests** (`tests/test_tasks_api.py`):
   - POST /tasks creates task
   - GET /tasks returns only user's tasks
   - PUT /tasks/{id} updates title/description
   - DELETE /tasks/{id} removes task
   - PATCH /tasks/{id}/complete toggles status

**Testing Tools**:
- pytest for test runner
- httpx for API client testing
- pytest-asyncio for async test support
- SQLite in-memory for test database (faster than PostgreSQL)

---

### Frontend Testing

**Approach**: Manual acceptance testing against defined scenarios (spec.md)

**Test Cases** (from User Stories):
- Create task and verify it appears in list
- Mark task complete and verify visual indicator
- Update task title and verify persistence
- Delete task and verify removal
- Verify only authenticated user's tasks displayed

**Future Enhancement**: Automated E2E tests with Playwright or Cypress.

---

## Security Considerations

### Data Isolation

**Mechanism**: Multi-layered enforcement

1. **Database Level**: Foreign key constraint ensures tasks reference valid users
2. **Query Level**: All queries filter by authenticated user_id
3. **Authorization Level**: Ownership verification before update/delete
4. **Response Level**: 404 instead of 403 prevents user enumeration

**Threat Model**:
- **Threat**: Malicious user attempts to access another user's tasks
- **Mitigation**: Backend filters all queries by JWT user_id; impossible to bypass
- **Verification**: Authorization tests in test suite

---

### Input Validation

**Mechanism**: Pydantic schema validation on all inputs

**Protected Against**:
- SQL Injection: SQLModel uses parameterized queries
- XSS: Frontend escapes user content (React default behavior)
- Overly Long Input: Character limits enforced (title 500, description 5000)
- Whitespace-Only Input: Trimming and validation reject empty titles
- Unicode Attacks: Pydantic handles encoding correctly

---

## Open Questions & Future Considerations

### Resolved During Research

All technical uncertainties from spec.md have been resolved through architectural decisions documented above.

### Future Enhancements (Out of Scope)

These are explicitly excluded from current spec but documented for future reference:

1. **Task Completion Timestamps**: Add `completed_at` field to track when task was completed
2. **Pagination**: Add limit/offset parameters for users with >100 tasks
3. **Search/Filter**: Full-text search on title/description
4. **Bulk Operations**: Select multiple tasks for batch delete/complete
5. **Optimistic UI Updates**: Update frontend immediately, rollback on error
6. **Offline Support**: Service worker + IndexedDB for offline task management
7. **Real-time Sync**: WebSocket connection for multi-device synchronization

---

## Conclusion

All architectural decisions documented above support the functional requirements in spec.md while complying with the project constitution. The design prioritizes:

1. **Security**: Backend-enforced data isolation and validation
2. **Simplicity**: RESTful patterns, boolean completion model, straightforward architecture
3. **Performance**: Indexed queries, connection pooling, efficient data transfer
4. **Maintainability**: Type-safe code, clear separation of concerns, testable design

**Next Phase**: Phase 1 (Design & Contracts) - Create data-model.md, API contracts, and quickstart.md.
