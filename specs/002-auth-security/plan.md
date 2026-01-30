# Implementation Plan: Authentication & Security (User Identity Domain)

**Branch**: `002-auth-security` | **Date**: 2026-01-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-auth-security/spec.md`

## Summary

Implement JWT-based authentication and authorization system that enforces multi-user data isolation across the Hackathon Todo App. The system consists of:

**Frontend (Better Auth)**:
- User signup and signin interfaces
- JWT token management and storage
- Authorization header injection for API requests
- Authentication state management and route protection

**Backend (FastAPI)**:
- JWT token verification middleware
- User identity extraction from verified tokens
- Per-user data filtering on all protected endpoints
- Standardized error responses (401 Unauthorized, 403 Forbidden)

**Security Model**:
- Stateless backend authentication using shared JWT secret
- User ID sourced exclusively from verified JWT claims (never from request body/params)
- Ownership verification before update/delete operations
- Zero trust model: backend enforces all security boundaries

**Technical Approach**: Extend existing task management API with authentication middleware layer, integrate Better Auth on frontend for user management, and retrofit task endpoints to enforce per-user filtering based on JWT user_id claims.

## Technical Context

**Language/Version**:
- Frontend: JavaScript/TypeScript (Next.js 16+ with App Router)
- Backend: Python 3.11+ (FastAPI)

**Primary Dependencies**:
- Frontend: Better Auth (authentication provider), Next.js 16+, React, Tailwind CSS
- Backend: FastAPI, PyJWT or python-jose (JWT verification), SQLModel (ORM), Pydantic (validation)

**Storage**: Neon Serverless PostgreSQL (user table managed by Better Auth, tasks table with user_id foreign key)

**Testing**:
- Backend: pytest with FastAPI TestClient
- Frontend: Next.js testing utilities
- Integration: End-to-end auth flow testing

**Target Platform**:
- Frontend: Web browsers (modern, responsive, mobile-first)
- Backend: Linux server (Docker/serverless deployment)

**Project Type**: Web application (separate frontend and backend)

**Performance Goals**:
- JWT verification: <5ms per request
- Signup flow: <1 minute end-to-end
- Signin flow: <10 seconds end-to-end
- API throughput: Support 1,000 concurrent authenticated users

**Constraints**:
- JWT verification must not bottleneck API performance
- Authentication state must persist across page navigation
- Stateless backend (no server-side session storage)
- Shared JWT secret between frontend and backend (via environment variables)

**Scale/Scope**:
- Multi-user application (hundreds to thousands of users)
- 5 user stories (3 P1, 1 P2, 1 P3)
- 28 functional requirements across 5 categories
- 2 main integration points: Better Auth ↔ Frontend, Frontend ↔ Backend

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Check (Phase 0 Gate)

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| **I. Spec-Driven Development** | Specification created via /sp.specify | ✅ PASS | spec.md complete with 5 user stories, 28 requirements |
| **II. User Data Isolation** | Multi-user isolation required | ✅ PASS | Core feature purpose - enforcing per-user task access |
| **III. Authentication-First Architecture** | Auth before protected features | ✅ PASS | This IS the auth feature - implementing before other features |
| **IV. Monorepo Structure** | Frontend/backend separation | ✅ PASS | Frontend (Next.js) and backend (FastAPI) clearly separated |
| **Technology Stack** | Mandatory tech stack | ✅ PASS | Better Auth, Next.js 16+, FastAPI, SQLModel, Neon PostgreSQL |
| **Spec-Kit Workflow** | Follow /sp.specify → /sp.plan → /sp.tasks | ✅ PASS | Currently in /sp.plan phase |
| **Specialized Agents** | Delegate to domain agents | ✅ PASS | Plan identifies auth, frontend, backend, database agents |

**Gate Status**: ✅ PASSED - Proceed to Phase 0 Research

### Post-Design Check (Re-evaluated after Phase 1)

Will re-evaluate after data-model.md and contracts/ are generated to ensure:
- User isolation enforced at database query level (II)
- JWT verification middleware applied to all protected routes (III)
- No manual coding shortcuts taken (I)

## Project Structure

### Documentation (this feature)

```text
specs/002-auth-security/
├── spec.md              # Feature specification (/sp.specify output)
├── plan.md              # This file (/sp.plan output)
├── research.md          # Phase 0 research findings
├── data-model.md        # Phase 1 data entities and relationships
├── quickstart.md        # Phase 1 developer setup guide
├── contracts/           # Phase 1 API contracts
│   ├── auth-api.yaml    # Authentication endpoint contracts
│   └── protected-api.yaml # Protected task endpoint contracts
├── checklists/          # Quality validation checklists
│   └── requirements.md  # Spec quality validation
└── tasks.md             # Phase 2 - NOT created by /sp.plan, created by /sp.tasks
```

### Source Code (repository root)

```text
# Web application structure (frontend + backend)

backend/
├── app/
│   ├── auth/                    # Authentication module (NEW)
│   │   ├── __init__.py
│   │   ├── middleware.py        # JWT verification middleware
│   │   ├── dependencies.py      # FastAPI dependency for get_current_user
│   │   ├── jwt_handler.py       # JWT decode and validation logic
│   │   └── models.py            # User authentication models
│   ├── api/
│   │   ├── tasks.py             # MODIFY: Add auth dependency, user filtering
│   │   └── health.py            # Unprotected health check
│   ├── models/
│   │   └── task.py              # MODIFY: Add user_id field and relationship
│   ├── schemas/
│   │   ├── task.py              # MODIFY: Update with user_id validation
│   │   └── auth.py              # NEW: Authentication response schemas
│   ├── database.py              # Database connection (existing)
│   ├── config.py                # MODIFY: Add JWT_SECRET, auth config
│   └── main.py                  # MODIFY: Register auth middleware
├── tests/
│   ├── test_auth_middleware.py  # NEW: JWT verification tests
│   ├── test_task_auth.py        # NEW: Task authorization tests
│   └── test_tasks.py            # MODIFY: Add auth to existing tests
├── migrations/                  # Database migrations
│   └── add_user_id_to_tasks.sql # MODIFY: Add user_id column if needed
└── requirements.txt             # MODIFY: Add PyJWT or python-jose

frontend/
├── app/
│   ├── (auth)/                  # Auth pages group (NEW)
│   │   ├── signin/
│   │   │   └── page.tsx         # Signin page
│   │   └── signup/
│   │       └── page.tsx         # Signup page
│   ├── (dashboard)/             # Protected pages group (NEW)
│   │   ├── tasks/
│   │   │   └── page.tsx         # MODIFY: Add auth protection
│   │   └── layout.tsx           # Protected layout with auth check
│   ├── api/                     # API routes (if needed)
│   │   └── auth/                # Better Auth API routes
│   │       └── [...all]/route.ts
│   └── layout.tsx               # Root layout
├── components/                  # React components
│   ├── auth/                    # NEW: Auth components
│   │   ├── SigninForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── SignoutButton.tsx
│   └── tasks/                   # MODIFY: Update to use auth
│       └── TaskList.tsx
├── lib/
│   ├── auth.ts                  # NEW: Better Auth configuration
│   ├── api-client.ts            # MODIFY: Add JWT token injection
│   └── auth-context.tsx         # NEW: Auth state management
├── middleware.ts                # NEW: Route protection middleware
└── package.json                 # MODIFY: Add better-auth dependency

# Shared configuration
.env.local                       # NEW: JWT_SECRET, BETTER_AUTH_SECRET, API URLs
.env.example                     # NEW: Environment variable template
```

**Structure Decision**: Using **Web Application** structure with clear frontend/backend separation. Authentication logic is centralized in backend/app/auth/ module, with Better Auth integration in frontend/lib/auth.ts. This aligns with Constitution Principle IV (Monorepo Structure) and enables independent development of authentication concerns.

## Complexity Tracking

> **No violations - this section intentionally left empty**

This feature fully complies with all constitution principles:
- ✅ Spec-Driven Development: Following /sp.specify → /sp.plan → /sp.tasks workflow
- ✅ User Data Isolation: Core purpose of this feature - implementing isolation enforcement
- ✅ Authentication-First Architecture: This IS the authentication feature
- ✅ Monorepo Structure: Clear frontend/backend separation maintained
- ✅ Technology Stack: Using mandated Better Auth, Next.js, FastAPI, SQLModel, Neon
- ✅ Specialized Agents: Will delegate to auth, frontend, backend, database agents

No simpler alternatives needed - the approach is minimal viable implementation of JWT-based auth.

## Phase 0: Research & Unknowns Resolution

### Research Questions

Based on Technical Context and feature requirements, the following areas require investigation:

#### R1: Better Auth Integration with Next.js 16 App Router

**Question**: How do we configure Better Auth to work with Next.js 16 App Router, issue JWT tokens, and integrate with FastAPI backend?

**Why needed**: Better Auth is frontend authentication library; need to understand:
- Better Auth setup and configuration for App Router
- JWT token issuance and storage (cookies vs localStorage)
- How to extract and attach JWT to API requests
- Session management patterns

**Research tasks**:
- Review Better Auth documentation for Next.js 16+ App Router
- Identify JWT token generation configuration
- Determine token storage strategy (httpOnly cookies recommended for security)
- Document integration pattern for API client

#### R2: FastAPI JWT Verification Best Practices

**Question**: What is the recommended pattern for JWT verification middleware in FastAPI that extracts user identity and makes it available to endpoints?

**Why needed**: Backend must verify JWT tokens and extract user_id for filtering, need:
- JWT verification library (PyJWT vs python-jose)
- Middleware vs dependency injection pattern
- Error handling for invalid/expired tokens
- Performance optimization strategies

**Research tasks**:
- Compare PyJWT and python-jose for FastAPI usage
- Document recommended middleware pattern for JWT verification
- Identify FastAPI dependency injection pattern for `get_current_user`
- Document error handling for authentication failures

#### R3: User Table Management with Better Auth

**Question**: Does Better Auth manage the user table schema, or do we need to create it manually? How do we reference users from the tasks table?

**Why needed**: Need to understand:
- Whether Better Auth creates and manages user table
- User table schema structure (user_id, email, password_hash)
- How to reference user_id as foreign key in tasks table
- Migration strategy for adding user_id to existing tasks

**Research tasks**:
- Review Better Auth documentation on database integration
- Identify user table schema and primary key structure
- Document foreign key relationship pattern for tasks table
- Determine migration strategy (is tasks table already created?)

#### R4: JWT Token Claims Structure

**Question**: What claims should be included in JWT tokens, and how do we ensure consistency between Better Auth (issuer) and FastAPI (verifier)?

**Why needed**: Frontend and backend must agree on:
- Required claims (user_id, email, exp, iat)
- Claim names (standardized vs custom)
- Token expiration strategy
- Shared secret configuration

**Research tasks**:
- Document standard JWT claims structure
- Identify Better Auth JWT payload configuration
- Define shared secret management strategy (environment variables)
- Document token expiration recommendations (24 hours default)

#### R5: Frontend Route Protection Pattern

**Question**: What is the recommended pattern for protecting Next.js App Router routes and redirecting unauthenticated users?

**Why needed**: Frontend must:
- Check authentication state before rendering protected pages
- Redirect unauthenticated users to signin
- Handle expired tokens gracefully
- Persist auth state across navigation

**Research tasks**:
- Review Next.js 16 middleware for route protection
- Document authentication context pattern for App Router
- Identify token refresh/expiration handling strategy
- Define redirect flow for unauthenticated access

### Research Output Format

Each research finding should be documented in `research.md` with:

```markdown
### [Research Question Title]

**Decision**: [What was chosen/decided]

**Rationale**: [Why this approach was selected]

**Alternatives Considered**:
- **Option A**: [Description] - Rejected because [reason]
- **Option B**: [Description] - Rejected because [reason]
- **Selected Option C**: [Description] - Chosen because [reason]

**Implementation Guidance**:
- [Step-by-step guidance for Claude Code]
- [Configuration examples]
- [Code patterns to follow]

**References**:
- [Documentation links]
- [Example repositories]
```

## Phase 1: Design & Contracts

### Phase 1a: Data Model Design

**Input**: research.md findings + feature spec entities

**Output**: `data-model.md` containing:

#### Entity: User (Managed by Better Auth)

**Purpose**: Represents an authenticated user account

**Attributes**:
- `user_id` (UUID or integer, primary key) - Unique user identifier
- `email` (string, unique, indexed) - User email address
- `password_hash` (string) - Bcrypt hashed password (managed by Better Auth)
- `created_at` (timestamp) - Account creation time
- `updated_at` (timestamp) - Last modification time

**Relationships**:
- One user → Many tasks (one-to-many)

**Validation Rules**:
- Email must be valid format and unique
- Password must meet strength requirements (8+ chars, uppercase, lowercase, number)

**Access Patterns**:
- Lookup by email (signin)
- Lookup by user_id (JWT verification)

**Notes**:
- Table created and managed by Better Auth
- Application code reads user_id from JWT claims, does not directly modify user table

#### Entity: Task (Extended with user_id)

**Purpose**: Represents a todo task belonging to a specific user

**Attributes**:
- `task_id` (UUID or integer, primary key) - Unique task identifier
- `user_id` (UUID or integer, foreign key to User, indexed) - **NEW: Owner of task**
- `title` (string, required) - Task title
- `description` (string, optional) - Task details
- `status` (enum: pending/in_progress/completed) - Task status
- `created_at` (timestamp) - Task creation time
- `updated_at` (timestamp) - Last modification time

**Relationships**:
- Many tasks → One user (many-to-one)
- Foreign key: `task.user_id` references `user.user_id`

**Validation Rules**:
- user_id must reference valid user (enforced at database level)
- Title must not be empty
- Status must be one of allowed enum values

**Access Patterns**:
- **PRIMARY**: Fetch tasks by user_id (filtered queries)
- Create task with user_id from JWT
- Update/delete task after verifying user_id matches JWT user_id

**Security Constraints**:
- ⚠️ **CRITICAL**: ALL queries must filter by user_id from JWT
- ⚠️ **CRITICAL**: NEVER trust user_id from request body or query parameters
- ⚠️ **CRITICAL**: Verify ownership before update/delete operations

#### Entity: JWT Token (Conceptual, not persisted)

**Purpose**: Cryptographically signed token containing user identity claims

**Claims Structure**:
- `user_id` (string or integer) - User identifier from user table
- `email` (string) - User email for display purposes
- `exp` (timestamp) - Expiration time (Unix timestamp)
- `iat` (timestamp) - Issued-at time (Unix timestamp)

**Lifecycle**:
1. Issued by Better Auth after successful signup/signin
2. Stored in frontend (httpOnly cookie or secure localStorage)
3. Attached to API requests via Authorization header
4. Verified by backend JWT middleware
5. Expires after configured duration (default 24 hours)

**Security Properties**:
- Signed with shared secret (HS256 or RS256 algorithm)
- Tamper-proof (signature verification fails if modified)
- Stateless (no server-side session storage required)

### Phase 1b: API Contracts

**Input**: research.md + functional requirements

**Output**: OpenAPI specifications in `contracts/` directory

#### Contract: auth-api.yaml (Conceptual - Better Auth manages)

```yaml
# Note: Better Auth provides these endpoints automatically
# This contract documents the expected behavior for integration

POST /api/auth/signup
  Request:
    email: string (valid email format)
    password: string (min 8 chars, uppercase, lowercase, number)
  Response 201:
    user_id: string
    email: string
    jwt_token: string
  Response 400:
    error: "Email already exists" | "Password too weak"

POST /api/auth/signin
  Request:
    email: string
    password: string
  Response 200:
    user_id: string
    email: string
    jwt_token: string
  Response 401:
    error: "Invalid credentials" (generic message)

POST /api/auth/signout
  Response 200:
    message: "Signed out successfully"

GET /api/auth/me
  Headers:
    Authorization: Bearer <jwt_token>
  Response 200:
    user_id: string
    email: string
  Response 401:
    error: "Unauthorized"
```

#### Contract: protected-api.yaml (FastAPI Backend)

```yaml
# Task Management Endpoints (Protected)

GET /api/tasks
  Description: Fetch all tasks for authenticated user
  Headers:
    Authorization: Bearer <jwt_token> (REQUIRED)
  Response 200:
    tasks: [
      {
        task_id: string
        user_id: string (matches JWT user_id)
        title: string
        description: string
        status: "pending" | "in_progress" | "completed"
        created_at: timestamp
        updated_at: timestamp
      }
    ]
  Response 401:
    error: "Unauthorized" (missing or invalid token)

POST /api/tasks
  Description: Create new task for authenticated user
  Headers:
    Authorization: Bearer <jwt_token> (REQUIRED)
  Request:
    title: string (required)
    description: string (optional)
    status: "pending" (default)
  Response 201:
    task_id: string
    user_id: string (from JWT, not request body)
    title: string
    description: string
    status: string
    created_at: timestamp
  Response 401:
    error: "Unauthorized"
  Response 400:
    error: "Validation error" (missing title, etc.)

GET /api/tasks/{task_id}
  Description: Fetch specific task (ownership verified)
  Headers:
    Authorization: Bearer <jwt_token> (REQUIRED)
  Response 200:
    task: { task_id, user_id, title, description, status, ... }
  Response 401:
    error: "Unauthorized"
  Response 403:
    error: "Forbidden" (task belongs to different user)
  Response 404:
    error: "Task not found"

PUT /api/tasks/{task_id}
  Description: Update task (ownership verified)
  Headers:
    Authorization: Bearer <jwt_token> (REQUIRED)
  Request:
    title: string (optional)
    description: string (optional)
    status: string (optional)
  Response 200:
    task: { updated task object }
  Response 401:
    error: "Unauthorized"
  Response 403:
    error: "Forbidden" (task belongs to different user)
  Response 404:
    error: "Task not found"

DELETE /api/tasks/{task_id}
  Description: Delete task (ownership verified)
  Headers:
    Authorization: Bearer <jwt_token> (REQUIRED)
  Response 204:
    (no content)
  Response 401:
    error: "Unauthorized"
  Response 403:
    error: "Forbidden" (task belongs to different user)
  Response 404:
    error: "Task not found"

# Health Check Endpoint (Unprotected)

GET /api/health
  Description: Health check for monitoring
  Response 200:
    status: "healthy"
```

**Security Enforcement Rules** (documented in contract):
1. All task endpoints require valid JWT token in Authorization header
2. User ID is extracted from JWT claims (NEVER from request body or URL params)
3. Task queries are filtered by `user_id = jwt_claims.user_id`
4. Update/delete operations verify task ownership before execution
5. 401 returned for missing/invalid/expired tokens
6. 403 returned for valid token but unauthorized resource access

### Phase 1c: Quickstart Guide

**Output**: `quickstart.md` - Developer setup guide

```markdown
# Authentication & Security Quickstart

## Prerequisites

- Better Auth library installed in frontend
- PyJWT or python-jose installed in backend
- Neon PostgreSQL database connection configured
- Environment variables configured for JWT secret

## Environment Configuration

Create `.env.local` with:

```
# Shared JWT secret (minimum 256 bits)
JWT_SECRET=your-secure-secret-here-min-32-chars

# Better Auth configuration
BETTER_AUTH_SECRET=your-better-auth-secret
BETTER_AUTH_URL=http://localhost:3000

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:8000

# Database
DATABASE_URL=postgresql://user:pass@host/db
```

## Backend Setup

1. Install dependencies: `pip install pyjwt fastapi sqlmodel`
2. Configure JWT middleware in `backend/app/main.py`
3. Create auth module with JWT verification logic
4. Add `get_current_user` dependency to protected endpoints
5. Run migrations to add user_id to tasks table

## Frontend Setup

1. Install Better Auth: `npm install better-auth`
2. Configure Better Auth in `frontend/lib/auth.ts`
3. Create authentication context provider
4. Add route protection middleware
5. Implement signin/signup forms

## Testing Authentication

```bash
# Test signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Test signin and capture JWT
JWT=$(curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' | jq -r '.jwt_token')

# Test protected endpoint
curl http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $JWT"
```

## Security Checklist

- [ ] JWT_SECRET is cryptographically random (min 256 bits)
- [ ] Secrets never committed to version control
- [ ] All task endpoints use `get_current_user` dependency
- [ ] User ID sourced from JWT, not request body
- [ ] Ownership verified before update/delete
- [ ] Generic error messages for failed auth
- [ ] HTTPS enforced in production
```

### Phase 1d: Agent Context Update

**Action**: Run `.specify/scripts/bash/update-agent-context.sh claude`

This will update `CLAUDE.md` with new technology added in this feature:
- Better Auth (JWT-based authentication)
- PyJWT or python-jose (JWT verification)

## Phase 2: Task Generation

**NOTE**: Phase 2 (task generation) is NOT executed by `/sp.plan`.

After this plan is complete, the user should run `/sp.tasks` to generate the tasks.md file based on this implementation plan and the feature specification.

## Architecture Decisions Requiring ADRs

The following architecturally significant decisions were made during planning and should be documented with `/sp.adr` command:

### AD1: JWT-Based Authentication Over Session-Based

**Decision**: Use JWT tokens for stateless authentication instead of server-side sessions

**Context**: Multi-user application requiring secure user identification across frontend and backend

**Alternatives**:
- Session-based auth (cookies with server-side session store)
- OAuth2 with external identity provider

**Rationale**:
- Stateless backend aligns with serverless deployment strategy
- JWT enables independent verification without database lookups
- Better Auth provides JWT issuance out of the box
- Simpler deployment (no session store infrastructure)

**Tradeoffs**:
- Cannot revoke tokens before expiration (must wait for natural expiry)
- Token payload visible (base64 encoded, not encrypted)
- Token size larger than session ID

**Command to document**: `/sp.adr jwt-auth-over-sessions`

### AD2: Central JWT Verification Middleware

**Decision**: Implement JWT verification as FastAPI middleware/dependency injection, not per-route checks

**Context**: All protected endpoints need JWT verification; need to avoid code duplication

**Alternatives**:
- Manual JWT verification in each endpoint handler
- Decorator-based verification

**Rationale**:
- FastAPI dependency injection pattern is idiomatic
- Centralized verification reduces error-prone duplication
- `get_current_user` dependency makes authenticated user available to all endpoints
- Easier to test and maintain single verification logic

**Tradeoffs**:
- All developers must remember to add dependency (but this is less error-prone than manual checks)
- Slightly less flexible than per-route custom logic

**Command to document**: `/sp.adr central-jwt-middleware`

### AD3: User ID from JWT Claims Only

**Decision**: Source user_id exclusively from verified JWT claims, never from request body or URL parameters

**Context**: Need to prevent user identity spoofing and ensure data isolation

**Alternatives**:
- Trust user_id from request body (INSECURE)
- Include user_id in URL parameters (INSECURE)

**Rationale**:
- Only JWT claims are cryptographically verified
- Request body/params can be forged by malicious clients
- This is the ONLY secure way to identify the authenticated user
- Enforces Constitution Principle II (User Data Isolation)

**Tradeoffs**:
- None - this is a security requirement, not a tradeoff

**Command to document**: `/sp.adr user-id-from-jwt-only`

### AD4: Backend-Enforced Authorization

**Decision**: Enforce all authorization checks on backend, not frontend

**Context**: Need to ensure security even if frontend is compromised or bypassed

**Alternatives**:
- Frontend-only route protection (INSECURE)
- Hybrid frontend + backend checks

**Rationale**:
- Frontend checks are for UX only, not security
- Attackers can bypass frontend entirely (direct API calls)
- Backend is the security boundary and must enforce all rules
- Aligns with zero-trust security model

**Tradeoffs**:
- None - backend enforcement is mandatory for security

**Command to document**: `/sp.adr backend-enforced-authorization`

## Post-Phase 1 Constitution Re-Check

*Re-evaluate after data-model.md and contracts/ are complete*

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| **II. User Data Isolation** | Isolation at database query level | ⏳ PENDING | Will verify in data-model.md that all task queries filter by user_id |
| **III. Authentication-First** | JWT middleware on protected routes | ⏳ PENDING | Will verify in contracts/ that all task endpoints require JWT |
| **I. Spec-Driven Development** | No manual coding | ⏳ PENDING | Will verify tasks delegate to specialized agents |

**Re-check will be performed after**:
- research.md is generated (Phase 0 complete)
- data-model.md is generated (Phase 1a complete)
- contracts/ are generated (Phase 1b complete)

## Testing Strategy

### Authentication Testing

**Test Category**: JWT Verification

Test cases:
1. Request without Authorization header → 401 Unauthorized
2. Request with invalid JWT signature → 401 Unauthorized
3. Request with expired JWT token → 401 Unauthorized
4. Request with malformed JWT (not base64, missing parts) → 401 Unauthorized
5. Request with valid JWT → Extract user_id and proceed

**Test Category**: Authorization Enforcement

Test cases:
1. User A creates task → task.user_id = A
2. User A fetches tasks → Only tasks where user_id = A returned
3. User A attempts to update User B's task → 403 Forbidden
4. User A attempts to delete User B's task → 403 Forbidden
5. User A attempts to fetch task with task_id belonging to User B → 403 Forbidden

**Test Category**: Token Tampering

Test cases:
1. Modify JWT payload (change user_id) → Signature verification fails → 401
2. Modify JWT header (change algorithm) → Verification fails → 401
3. Use JWT signed with different secret → Signature mismatch → 401

**Test Category**: Positive Authentication Flow

Test cases:
1. Signup with valid credentials → Account created, JWT issued
2. Signin with valid credentials → JWT issued
3. Use JWT to access protected endpoint → Success
4. JWT persists across page navigation → Auth state maintained

**Test Category**: Error Handling

Test cases:
1. Signup with existing email → 400 Bad Request with clear message
2. Signup with weak password → 400 Bad Request with requirements
3. Signin with wrong password → 401 with generic message (no info leak)
4. Signin with non-existent email → 401 with generic message (no info leak)

### Specification Validation

**Validation Rule**: Every protected endpoint explicitly requires authentication

- [ ] GET /api/tasks requires Authorization header
- [ ] POST /api/tasks requires Authorization header
- [ ] GET /api/tasks/{id} requires Authorization header
- [ ] PUT /api/tasks/{id} requires Authorization header
- [ ] DELETE /api/tasks/{id} requires Authorization header
- [ ] GET /api/health does NOT require authentication (health check exempt)

**Validation Rule**: No implied security behavior

- [ ] All security requirements from spec.md are implemented
- [ ] No security assumptions made without specification
- [ ] All error codes (401, 403) documented in contracts

## Implementation Guidance for Claude Code

### Agent Delegation Strategy

This feature requires coordination across multiple specialized agents:

1. **Database Agent** (`neon-db-manager`):
   - Add user_id column to tasks table (if not already present)
   - Create foreign key relationship to user table
   - Verify user table exists (created by Better Auth)
   - Create database migration script

2. **Backend Agent** (`fastapi-backend-dev`):
   - Implement JWT verification middleware
   - Create `get_current_user` dependency
   - Update task endpoints to use auth dependency
   - Add user_id filtering to all task queries
   - Implement ownership verification for update/delete
   - Add standardized error responses (401, 403)

3. **Auth Agent** (`auth-security-specialist`):
   - Verify JWT verification logic security
   - Audit user_id sourcing (must be from JWT only)
   - Review error messages (no information leakage)
   - Validate token expiration configuration
   - Ensure secrets management follows best practices

4. **Frontend Agent** (`nextjs-frontend-builder`):
   - Integrate Better Auth with Next.js App Router
   - Create signup/signin forms
   - Implement authentication context provider
   - Add route protection middleware
   - Build signout functionality
   - Implement JWT injection for API client

### Execution Order

**Recommended task sequence**:

1. Database Agent: Add user_id to tasks table, verify user table
2. Backend Agent: Implement JWT middleware and dependencies
3. Backend Agent: Update task endpoints with auth filtering
4. Auth Agent: Security audit of backend auth implementation
5. Frontend Agent: Integrate Better Auth and create auth pages
6. Frontend Agent: Add route protection and auth context
7. Integration Testing: End-to-end auth flow validation

### Critical Security Checkpoints

**Before merging to main**:

- [ ] All task queries filter by `user_id FROM JWT claims`
- [ ] No user_id accepted from request body or query parameters
- [ ] Ownership verified before update/delete operations
- [ ] JWT secret configured via environment variable (not hardcoded)
- [ ] Generic error messages for authentication failures
- [ ] All protected endpoints have `get_current_user` dependency
- [ ] Better Auth and FastAPI share the same JWT secret

### Common Pitfalls to Avoid

1. **❌ DO NOT** trust user_id from request body
   - **✅ DO** extract user_id from verified JWT claims

2. **❌ DO NOT** skip JWT verification for "internal" endpoints
   - **✅ DO** require authentication on ALL task endpoints

3. **❌ DO NOT** reveal whether email exists in signin error messages
   - **✅ DO** use generic "Invalid credentials" message

4. **❌ DO NOT** hardcode JWT secret in source code
   - **✅ DO** read from environment variable

5. **❌ DO NOT** implement custom JWT verification logic
   - **✅ DO** use established libraries (PyJWT or python-jose)

6. **❌ DO NOT** store passwords in plain text (Better Auth handles this)
   - **✅ DO** trust Better Auth's password hashing

7. **❌ DO NOT** return user_id in API response unless necessary
   - **✅ DO** only return user_id when explicitly needed for frontend

8. **❌ DO NOT** implement frontend-only security
   - **✅ DO** enforce all security on backend

## Summary and Next Steps

### Phase 0 Deliverables (This Command)
- [x] Implementation plan created (this file)
- [ ] research.md to be generated with findings for R1-R5

### Phase 1 Deliverables (This Command)
- [ ] data-model.md documenting User, Task, JWT Token entities
- [ ] contracts/auth-api.yaml (Better Auth endpoints - conceptual)
- [ ] contracts/protected-api.yaml (FastAPI task endpoints)
- [ ] quickstart.md with setup instructions
- [ ] CLAUDE.md updated with Better Auth + PyJWT technologies

### Phase 2 Deliverables (Next Command: `/sp.tasks`)
- [ ] tasks.md with dependency-ordered implementation tasks

### ADRs to Create (After Planning)
- [ ] `/sp.adr jwt-auth-over-sessions`
- [ ] `/sp.adr central-jwt-middleware`
- [ ] `/sp.adr user-id-from-jwt-only`
- [ ] `/sp.adr backend-enforced-authorization`

### Implementation Phase (After Tasks: `/sp.implement`)
- [ ] Delegate database work to `neon-db-manager` agent
- [ ] Delegate backend auth to `fastapi-backend-dev` agent
- [ ] Security audit with `auth-security-specialist` agent
- [ ] Frontend integration with `nextjs-frontend-builder` agent

**Ready for**: Phase 0 research generation (next section of this command)
