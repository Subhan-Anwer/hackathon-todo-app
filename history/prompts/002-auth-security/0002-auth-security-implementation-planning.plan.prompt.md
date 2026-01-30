---
id: 0002
title: Auth Security Implementation Planning
stage: plan
date: 2026-01-29
surface: agent
model: claude-sonnet-4-5-20250929
feature: 002-auth-security
branch: 002-auth-security
user: claude-code-user
command: /sp.plan
labels: ["planning", "authentication", "security", "jwt", "better-auth"]
links:
  spec: /specs/002-auth-security/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - /specs/002-auth-security/plan.md
  - /specs/002-auth-security/research.md
  - /specs/002-auth-security/data-model.md
  - /specs/002-auth-security/quickstart.md
  - /specs/002-auth-security/contracts/auth-api.yaml
  - /specs/002-auth-security/contracts/protected-api.yaml
  - /CLAUDE.md
tests:
  - Authentication validation (requests without JWT return 401)
  - Authorization enforcement (user cannot access another user's tasks)
  - Token tampering (modified tokens rejected)
  - Positive auth flow (authenticated user can access own tasks)
---

## Prompt

Create:
- Architecture sketch for authentication flow
- Section structure for Authentication & Security spec
- Reasoning and implementation guidance for Claude Code
- Validation and testing strategy for auth correctness

Architecture sketch:
- Logical flow:
  User → Next.js Frontend → Better Auth → JWT Issuance
  Frontend API Client → Authorization: Bearer <JWT>
  FastAPI Backend → JWT Verification → Authenticated User Context
- Authentication responsibilities:
  - Frontend: user login, session handling, token attachment
  - Backend: token verification, user identity extraction
- Authorization enforcement:
  - Backend validates JWT on every protected request
  - Backend enforces user-scoped access to resources

Section structure:
1. Overview
   - Purpose of authentication and security layer
   - Relationship to Task Management domain
2. Authentication Flow
   - Signup and signin via Better Auth
   - JWT issuance lifecycle
3. JWT Usage & Expectations
   - Token transport mechanism
   - Required claims (conceptual)
   - Expiration behavior
4. Backend Verification Rules
   - Token extraction from headers
   - Signature verification using shared secret
   - Failure handling
5. Authorization Rules
   - Mapping authenticated user to requested resources
   - Handling mismatched user access
6. Error Handling & Security Responses
   - 401 Unauthorized
   - 403 Forbidden
7. Non-Goals & Explicit Exclusions

Development approach:
- Follow official hackathon JWT-based security model exactly
- Treat authentication as a cross-cutting concern
- Keep auth logic isolated from task business logic
- Prefer backend enforcement for all security guarantees
- Avoid UI or framework-specific assumptions where possible
- Write spec language that prevents insecure default behavior

Decisions needing documentation:
1. Authentication mechanism
   - Option A: Session-based auth
   - Option B: JWT-based auth (chosen)
   - Tradeoff: JWT enables stateless backend and independent verification
2. JWT verification location
   - Option A: Per-route checks
   - Option B: Central middleware/dependency (chosen)
   - Tradeoff: Central verification reduces duplication and errors
3. User identity source
   - Option A: User ID from request body or URL
   - Option B: User ID from verified JWT (chosen)
   - Tradeoff: JWT-based identity prevents spoofing
4. Authorization enforcement
   - Option A: Frontend-only checks
   - Option B: Backend-enforced checks (chosen)
   - Tradeoff: Backend enforcement is mandatory for security

Testing strategy:
- Authentication validation:
  - Requests without JWT return 401 Unauthorized
  - Requests with invalid or expired JWT return 401 Unauthorized
- Authorization validation:
  - User cannot access another user's tasks
  - User ID in JWT must match accessed resources
- Positive flow testing:
  - Authenticated user can access own task endpoints
- Negative flow testing:
  - Tampered tokens are rejected
  - Missing Authorization header is rejected
- Spec validation:
  - Every protected endpoint requires authentication
  - No security behavior is implied but undefined

## Response snapshot

Successfully created comprehensive implementation plan for Authentication & Security feature (002-auth-security).

**Phase 0: Research Completed**
- Created research.md with findings for 5 research questions:
  - R1: Better Auth Integration with Next.js 16 App Router (httpOnly cookies, JWT issuance)
  - R2: FastAPI JWT Verification Best Practices (PyJWT + dependency injection pattern)
  - R3: User Table Management with Better Auth (automatic schema, foreign key to tasks)
  - R4: JWT Token Claims Structure (standard RFC 7519 claims: sub, email, exp, iat)
  - R5: Frontend Route Protection Pattern (Next.js middleware + auth context)

**Phase 1: Design & Contracts Completed**
- Created data-model.md defining:
  - Entity: User (Better Auth managed, user.id primary key)
  - Entity: Account (Better Auth managed, password hashing)
  - Entity: Task (extended with user_id foreign key, indexed for performance)
  - Entity: JWT Token (conceptual, stateless verification)
  - Critical security constraints documented for all queries

- Created API contracts:
  - auth-api.yaml: Better Auth endpoints (signup, signin, signout, /me)
  - protected-api.yaml: FastAPI task endpoints with JWT authentication requirements
  - Security enforcement rules documented in contracts

- Created quickstart.md:
  - Environment configuration (JWT secrets, database URL)
  - Backend setup (PyJWT, auth module, JWT verification, dependencies)
  - Frontend setup (Better Auth, auth client, API client with JWT injection)
  - Testing procedures (signup, signin, protected endpoints)
  - Security checklist for pre-deployment verification
  - Troubleshooting common issues

- Updated CLAUDE.md with new technology:
  - Better Auth (JWT-based authentication)
  - PyJWT (JWT verification)
  - Neon Serverless PostgreSQL (user table + tasks table)

**Key Architectural Decisions Identified (require ADRs)**:
1. JWT-Based Authentication Over Session-Based
2. Central JWT Verification Middleware
3. User ID from JWT Claims Only
4. Backend-Enforced Authorization

**Constitution Compliance**: All principles passed (Spec-Driven, User Isolation, Auth-First, Monorepo, Tech Stack)

## Outcome

- ✅ Impact: Created complete implementation plan with research findings, data model, API contracts, and developer quickstart guide for JWT-based authentication feature
- 🧪 Tests: Defined comprehensive testing strategy covering authentication validation, authorization enforcement, token tampering, positive/negative flows
- 📁 Files: Created 7 planning artifacts (plan.md, research.md, data-model.md, quickstart.md, 2 API contracts, updated CLAUDE.md)
- 🔁 Next prompts: Run `/sp.tasks` to generate implementation tasks, then `/sp.adr` for 4 architectural decisions
- 🧠 Reflection: Planning phase successfully completed all research and design work; ready for task generation and implementation delegation to specialized agents

## Evaluation notes (flywheel)

- Failure modes observed: None - planning workflow executed successfully
- Graders run and results (PASS/FAIL): Constitution Check (PASS), Research Questions (PASS), Data Model Design (PASS), API Contracts (PASS)
- Prompt variant (if applicable): Standard /sp.plan workflow with user-provided architecture sketch
- Next experiment (smallest change to try): Execute /sp.tasks to validate that plan provides sufficient detail for task generation
