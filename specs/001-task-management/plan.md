# Implementation Plan: Task Management (Core Todo Domain)

**Branch**: `001-task-management` | **Date**: 2026-01-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-task-management/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement core task lifecycle management for a multi-user todo application. The system enables authenticated users to create, view, update, delete, and mark tasks as complete while ensuring strict data isolation per user. Backend enforces ownership at the database query level using authenticated user IDs from JWT tokens. Frontend provides intuitive task management UI that consumes secured REST APIs.

**Technical Approach**: RESTful API architecture with FastAPI backend, SQLModel ORM for type-safe database operations, Neon Serverless PostgreSQL for persistence, and Next.js App Router frontend with server/client components. Authentication context (user_id) is extracted from JWT tokens and enforced by backend middleware before all task operations.

## Technical Context

**Language/Version**:
- Backend: Python 3.11+
- Frontend: TypeScript 5.x / Node.js 20+

**Primary Dependencies**:
- Backend: FastAPI 0.115+, SQLModel 0.0.16+, Pydantic 2.x, python-jose (JWT)
- Frontend: Next.js 16+, React 19+, Tailwind CSS 4.x

**Storage**: Neon Serverless PostgreSQL (single tasks table with user_id foreign key)

**Testing**:
- Backend: pytest for API contract tests, validation tests, and authorization tests
- Frontend: Manual acceptance testing against defined scenarios

**Target Platform**:
- Backend: Linux server / containerized deployment
- Frontend: Web browsers (desktop and mobile)

**Project Type**: Web application (separate frontend/ and backend/ directories)

**Performance Goals**:
- Task creation: < 2 seconds from submission to display
- Task list rendering: < 3 seconds for up to 100 tasks
- API response time: < 200ms p95 for single-task operations

**Constraints**:
- 100% user data isolation (zero tolerance for cross-user data leakage)
- All task operations require authenticated user context
- Character limits: 500 for title, 5000 for description
- No pagination required for initial version (up to 100 tasks per user)

**Scale/Scope**:
- Multiple concurrent users (10-100 expected)
- ~100 tasks per user maximum (performance target)
- 5 REST API endpoints (CRUD + toggle completion)
- 3-5 frontend pages/components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Specification Gate ✅ PASS
- [x] User stories with acceptance criteria defined (5 prioritized stories)
- [x] Functional requirements specified (18 requirements, FR-001 to FR-018)
- [x] Success criteria measurable (10 criteria with specific metrics)
- [x] Edge cases identified (8 edge cases documented)
- [x] Dependencies and assumptions documented

**Evidence**: spec.md contains complete user scenarios, acceptance criteria, functional requirements, and success criteria validated by requirements.md checklist.

### Spec-Driven Development Gate ✅ PASS
- [x] Feature specification created via `/sp.specify` command
- [x] Implementation plan being generated via `/sp.plan` command
- [x] No manual coding has occurred
- [x] Workflow follows Spec-Kit Plus sequence

**Evidence**: Feature created on branch 001-task-management with complete spec.md. This plan.md is being generated via `/sp.plan`.

### User Data Isolation Gate ✅ PASS
- [x] Multi-user data isolation required by specification
- [x] Backend enforcement at database query level specified (FR-004, FR-010)
- [x] User ID from JWT token required (documented in Dependencies)
- [x] Resource ownership verification before operations (FR-010)
- [x] Frontend displays only user-specific data (FR-004)

**Evidence**:
- FR-004: "System MUST display only tasks owned by the currently authenticated user"
- FR-010: "System MUST prevent users from accessing, viewing, updating, or deleting tasks owned by other users"
- SC-003: "System correctly isolates user data such that 100% of task operations return only tasks owned by the authenticated user"
- Assumptions section: "User ID is available to the task management system for all operations"

### Authentication-First Architecture Gate ✅ PASS
- [x] Authentication system listed as dependency
- [x] JWT token verification assumed as prerequisite
- [x] All task operations require authentication (FR-004, FR-010)
- [x] User ID extraction from JWT specified

**Evidence**:
- Dependencies section: "Authentication System: Task management depends on a functioning user authentication system that provides verified user identity for all operations"
- Dependencies section: "User ID Availability: The system must receive an authenticated user ID (from JWT token or session) with every request to enforce task ownership"
- Out of Scope explicitly excludes auth implementation: "User Authentication/Authorization Implementation: JWT verification, session management, and user signup/signin flows are handled separately"

### Monorepo Structure Gate ✅ PASS
- [x] Frontend in frontend/ directory (Next.js App Router)
- [x] Backend in backend/ directory (Python FastAPI)
- [x] Clear separation of concerns specified
- [x] Database access only through backend APIs

**Evidence**: CLAUDE.md defines project structure with frontend/ and backend/ separation. Constitution requires monorepo structure.

### Technology Stack Gate ✅ PASS
- [x] Next.js 16+ with App Router (frontend)
- [x] React Server and Client Components (frontend)
- [x] Tailwind CSS (frontend)
- [x] Python FastAPI (backend)
- [x] SQLModel ORM (backend)
- [x] Pydantic validation (backend)
- [x] Neon Serverless PostgreSQL (database)
- [x] JWT authentication (auth)

**Evidence**: Technical Context aligns with constitution's mandatory technology stack. CLAUDE.md specifies all required technologies.

### Quality Gates Checkpoint ✅ PASS
- [x] Specification gate passed (documented above)
- [x] Architecture gate in progress (this plan.md)
- [x] Security gate verified (data isolation enforced)
- [x] Testing gate: acceptance scenarios defined in spec
- [x] Documentation gate: PHR will be created at completion

**Evidence**: All gates either passed or in progress as expected for planning phase.

### Specialized Agent Delegation Gate ✅ PASS (Planned)
- [x] Database work identified → will delegate to `neon-db-manager`
- [x] Backend API work identified → will delegate to `fastapi-backend-dev`
- [x] Authentication middleware identified → will delegate to `auth-security-specialist`
- [x] Frontend UI work identified → will delegate to `nextjs-frontend-builder`

**Evidence**: CLAUDE.md defines specialized agent delegation strategy. Implementation phase will use Task tool to delegate to appropriate agents.

### Overall Constitution Compliance: ✅ PASS

All constitution gates passed. Feature specification and technical approach fully comply with project constitution. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-task-management/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (architectural decisions)
├── data-model.md        # Phase 1 output (database schema design)
├── quickstart.md        # Phase 1 output (developer onboarding)
├── contracts/           # Phase 1 output (API contracts)
│   └── tasks-api.yaml   # OpenAPI specification for task endpoints
├── checklists/          # Quality validation checklists
│   └── requirements.md  # Spec quality checklist (completed)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── models/
│   │   └── task.py           # SQLModel Task model with user_id FK
│   ├── schemas/
│   │   ├── task.py           # Pydantic request/response schemas
│   │   └── error.py          # Error response schemas
│   ├── api/
│   │   └── v1/
│   │       ├── tasks.py      # Task CRUD endpoints
│   │       └── deps.py       # Dependency injection (JWT validation)
│   ├── services/
│   │   └── task_service.py   # Business logic layer
│   ├── auth/
│   │   └── jwt.py            # JWT token verification middleware
│   └── database.py           # Neon PostgreSQL connection
├── tests/
│   ├── test_tasks_api.py     # API contract tests
│   ├── test_authorization.py # User isolation tests
│   └── test_validation.py    # Input validation tests
├── main.py                   # FastAPI app entry point
└── requirements.txt          # Python dependencies

frontend/
├── app/
│   ├── (auth)/               # Auth pages (out of scope for this feature)
│   ├── (dashboard)/
│   │   ├── tasks/
│   │   │   ├── page.tsx      # Task list page (Server Component)
│   │   │   ├── new/
│   │   │   │   └── page.tsx  # Create task page
│   │   │   └── [id]/
│   │   │       ├── page.tsx  # View task details
│   │   │       └── edit/
│   │   │           └── page.tsx  # Edit task page
│   │   └── layout.tsx        # Dashboard layout
│   └── api/                  # API routes (if needed for server actions)
├── components/
│   ├── tasks/
│   │   ├── TaskList.tsx      # Client Component: task list display
│   │   ├── TaskItem.tsx      # Client Component: single task item
│   │   ├── TaskForm.tsx      # Client Component: create/edit form
│   │   └── TaskFilters.tsx   # Client Component: completion filter
│   └── ui/                   # Reusable UI components
├── lib/
│   ├── api/
│   │   └── tasks.ts          # API client for task endpoints
│   ├── auth/
│   │   └── context.tsx       # Auth context (user_id extraction)
│   └── utils.ts              # Helper functions
└── tests/                    # Frontend tests (manual for MVP)

.env                          # Environment variables (DATABASE_URL, JWT_SECRET, etc.)
```

**Structure Decision**: Web application structure (Option 2) selected. This feature adds task management capabilities to existing monorepo structure with clear separation between backend (FastAPI) and frontend (Next.js). Backend enforces all business logic and authorization. Frontend acts as presentation layer consuming secured APIs.

**Key Architectural Elements**:
1. **Backend Service Layer**: Separates business logic (task_service.py) from API routes for testability
2. **JWT Middleware**: Extracts user_id from tokens before all task operations (auth/jwt.py)
3. **SQLModel Integration**: Type-safe ORM models with Pydantic validation (models/task.py)
4. **Next.js App Router**: Server Components for data fetching, Client Components for interactivity
5. **API Client Abstraction**: Centralizes HTTP calls and token management (lib/api/tasks.ts)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations detected**. All architectural decisions align with project constitution. No complexity budget consumed.

## Phase 0: Research & Architectural Decisions

**Status**: ✅ Complete

**Artifacts Generated**:
- [research.md](./research.md) - Comprehensive architectural decisions document

**Key Decisions Documented**:
1. **Task Ownership Enforcement**: Backend-enforced at query level using JWT user_id
2. **Task Completion Model**: Boolean field (completed: true/false) for MVP simplicity
3. **API Granularity**: RESTful resource-based endpoints following HTTP semantics
4. **Validation Strategy**: Backend-enforced via Pydantic schemas with optional frontend enhancement

**Technology Stack Validated**:
- FastAPI 0.115+ for REST API (async/await, auto-documentation, type safety)
- SQLModel 0.0.16+ for ORM (type-safe, Pydantic integration)
- Neon Serverless PostgreSQL for persistence (auto-scaling, connection pooling)
- Next.js 16+ App Router for frontend (Server Components + Client Components)

**Integration Patterns Defined**:
- JWT authentication flow (Better Auth → Frontend → Backend verification)
- Frontend-backend communication (REST API client with token management)
- Database query optimization (indexes on user_id, completed, created_at)

---

## Phase 1: Design & Contracts

**Status**: ✅ Complete

**Artifacts Generated**:
- [data-model.md](./data-model.md) - Complete data model specification
- [contracts/tasks-api.yaml](./contracts/tasks-api.yaml) - OpenAPI 3.0 specification
- [quickstart.md](./quickstart.md) - Developer implementation guide
- CLAUDE.md updated with active technologies

### Data Model Summary

**Entity: Task**
- **Attributes**: id, user_id (FK), title, description, completed, created_at, updated_at
- **Validation Rules**: Title 1-500 chars (trimmed), description 0-5000 chars, completed boolean
- **Indexes**: user_id (primary access), completed (filtering), created_at (sorting)
- **Relationships**: Many-to-one with User (immutable ownership)

**State Transitions**: DOES NOT EXIST → INCOMPLETE → COMPLETE ↔ INCOMPLETE → DOES NOT EXIST

### API Contracts Summary

**Endpoints Defined** (5 total):
1. `GET /api/v1/tasks` - List all user's tasks (with optional completion filter)
2. `POST /api/v1/tasks` - Create new task
3. `GET /api/v1/tasks/{id}` - Get single task details
4. `PUT /api/v1/tasks/{id}` - Update task title/description
5. `DELETE /api/v1/tasks/{id}` - Delete task permanently
6. `PATCH /api/v1/tasks/{id}/complete` - Toggle completion status

**Security**: All endpoints require JWT Bearer authentication

**Error Responses**: Standardized format with success flag, error code, and optional details

### Agent Context Updated

**CLAUDE.md Changes**:
- Added active technology: "Neon Serverless PostgreSQL (single tasks table with user_id foreign key)"
- Documented recent change for 001-task-management feature

---

## Phase 2: Task Generation (NOT PART OF /sp.plan)

**Command**: `/sp.tasks` (separate command, run after plan completion)

**Expected Output**: tasks.md with dependency-ordered, testable tasks

**Task Breakdown Preview**:
1. Database schema creation (Database Agent)
2. JWT middleware implementation (Auth Agent)
3. Backend API endpoints (Backend Agent)
4. Backend testing (Backend Agent)
5. Frontend API client (Frontend Agent)
6. Frontend UI components (Frontend Agent)
7. Frontend pages (Frontend Agent)
8. Integration testing (manual)

---

## Implementation Readiness Checklist

### Planning Artifacts ✅ Complete
- [x] Feature specification (spec.md)
- [x] Implementation plan (plan.md) - This file
- [x] Architectural decisions (research.md)
- [x] Data model design (data-model.md)
- [x] API contracts (contracts/tasks-api.yaml)
- [x] Developer quickstart (quickstart.md)
- [x] Constitution compliance verified

### Prerequisites for Implementation
- [x] All architectural decisions documented
- [x] Database schema defined
- [x] API endpoints specified
- [x] Authentication dependencies identified
- [x] Validation rules documented
- [x] Testing strategy defined
- [ ] Tasks.md generated (run `/sp.tasks`)
- [ ] Implementation begun (run `/sp.implement`)

### Agent Delegation Strategy

**Confirmed Agents for Implementation**:
1. **Database Agent** (`neon-db-manager`):
   - Create tasks table with proper schema
   - Add indexes (user_id, completed, created_at)
   - Generate Alembic migration script

2. **Auth Agent** (`auth-security-specialist`):
   - Implement JWT verification middleware
   - Create get_current_user dependency for FastAPI
   - Handle token validation and user_id extraction

3. **Backend Agent** (`fastapi-backend-dev`):
   - Create SQLModel Task model
   - Create Pydantic request/response schemas
   - Implement all 6 API endpoints with user_id filtering
   - Write backend tests (contract, authorization, validation)

4. **Frontend Agent** (`nextjs-frontend-builder`):
   - Create API client (lib/api/tasks.ts)
   - Build task list page (Server Component)
   - Build task components (Client Components)
   - Create task forms (create/edit pages)

---

## Risk Assessment

### High Priority Risks

**Risk 1: Authentication Dependency**
- **Description**: Task management requires functioning JWT authentication
- **Mitigation**: Authentication spec must be implemented first, or mock auth for testing
- **Impact**: Blocker if authentication not available
- **Status**: Acknowledged dependency in spec and plan

**Risk 2: User Data Isolation**
- **Description**: Critical security requirement - must achieve 100% isolation
- **Mitigation**: Backend-enforced filtering + comprehensive authorization tests
- **Impact**: High - data leakage is unacceptable
- **Status**: Mitigation designed into architecture (research.md Decision 1)

### Medium Priority Risks

**Risk 3: Frontend-Backend Integration**
- **Description**: API client must handle JWT tokens correctly
- **Mitigation**: Centralized API client with consistent token injection
- **Impact**: Medium - auth errors would block frontend
- **Status**: Quickstart.md provides implementation guidance

**Risk 4: Database Migration**
- **Description**: Foreign key to users table requires users table exists first
- **Mitigation**: Verify users table exists before running migration
- **Impact**: Medium - migration would fail without prerequisite
- **Status**: Documented in quickstart.md and data-model.md

### Low Priority Risks

**Risk 5: Performance Degradation**
- **Description**: Large task lists (>100 tasks) may slow down
- **Mitigation**: Proper indexing on user_id, created_at; pagination out of scope
- **Impact**: Low - performance target is 100 tasks, within reasonable limits
- **Status**: Documented in spec assumptions and data-model.md

---

## Success Metrics

### Implementation Success Criteria

**Backend Metrics**:
- All 6 API endpoints implemented and tested
- 100% pass rate on authorization tests (user isolation)
- API response times < 200ms p95 for single-task operations
- All validation tests passing (title trimming, character limits, etc.)

**Frontend Metrics**:
- All 5 user stories testable via UI
- Task creation → display latency < 2 seconds
- Visual distinction between complete/incomplete tasks
- All acceptance scenarios from spec.md verifiable

**Quality Metrics**:
- Zero constitution violations
- All architectural decisions documented with rationale
- Code generated exclusively via Claude Code agents (no manual coding)
- PHR created for planning session

---

## Next Steps

**Immediate Actions**:
1. ✅ Review this plan for completeness and accuracy
2. ✅ Verify all Phase 0 and Phase 1 artifacts are complete
3. Run `/sp.tasks` to generate dependency-ordered task breakdown
4. Review generated tasks.md and approve for implementation
5. Run `/sp.implement` to begin implementation via specialized agents
6. Execute tasks in order: Database → Auth → Backend → Frontend
7. Run tests at each layer before proceeding to next
8. Create PHR documenting planning session
9. Commit all planning artifacts to branch 001-task-management

**Post-Implementation**:
1. Manual acceptance testing against User Stories 1-5
2. Backend automated tests (pytest)
3. Create commit with generated code
4. Push to remote branch
5. Create pull request for code review
6. Merge to main upon approval

---

## Appendix A: Architectural Decision Records (ADRs)

**ADR Candidates Identified**:

Based on the three-part significance test (Impact + Alternatives + Scope):

### ADR-001: Backend-Enforced User Data Isolation ✅ Significant

- **Impact**: Long-term security architecture for multi-user system
- **Alternatives**: Frontend enforcement, hybrid approach (both evaluated in research.md)
- **Scope**: Cross-cutting concern affecting all task operations and future features

**Recommendation**: Document as ADR after implementation validates approach

### ADR-002: RESTful API Design Pattern ✅ Significant

- **Impact**: Defines API interaction model for all future features
- **Alternatives**: Action-based endpoints, GraphQL (both evaluated)
- **Scope**: Cross-cutting concern affecting frontend-backend contract

**Recommendation**: Document as ADR (establishes REST as project standard)

### ADR-003: Boolean Completion Model ⚠️ Borderline

- **Impact**: Affects task state representation
- **Alternatives**: Status enum, timestamp-based (both evaluated)
- **Scope**: Specific to task entity, but sets precedent for state modeling

**Recommendation**: Optional - can defer until pattern repeats in other features

**Note**: User should run `/sp.adr <title>` command to create ADRs for significant decisions after implementation validation.

---

## Appendix B: Open Questions

**All questions resolved during research phase.**

No open questions or pending decisions remain. All architectural uncertainties have been addressed through research and documented in research.md.

---

## Appendix C: Document Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-01-29 | 1.0.0 | Initial plan created via /sp.plan command | Claude Code |
| 2026-01-29 | 1.0.0 | Phase 0 research completed (research.md) | Claude Code |
| 2026-01-29 | 1.0.0 | Phase 1 design completed (data-model.md, contracts, quickstart.md) | Claude Code |
| 2026-01-29 | 1.0.0 | Agent context updated (CLAUDE.md) | Claude Code |
| 2026-01-29 | 1.0.0 | Plan finalized and ready for /sp.tasks | Claude Code |

---

**Plan Status**: ✅ COMPLETE - Ready for `/sp.tasks` command

**Constitution Compliance**: ✅ VERIFIED - All gates passed, zero violations

**Next Command**: `/sp.tasks` to generate testable, dependency-ordered task breakdown
