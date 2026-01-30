# Implementation Tasks: Authentication & Security

**Feature**: 002-auth-security
**Branch**: `002-auth-security`
**Generated**: 2026-01-29
**Input**: spec.md (5 user stories), plan.md, data-model.md, contracts/

---

## Task Overview

| Phase | User Story | Task Count | Parallelizable | Independent Test |
|-------|------------|------------|----------------|------------------|
| Phase 1 | Setup | 4 | 2 | Environment configured, dependencies installed |
| Phase 2 | Foundational | 4 | 3 | Database schema supports user isolation, JWT infrastructure works |
| Phase 3 | US1 - Signup | 6 | 4 | User can create account and receive JWT token |
| Phase 4 | US2 - Signin | 5 | 3 | User can authenticate and access protected resources |
| Phase 5 | US3 - Protected Resources | 7 | 4 | User can only access own tasks, data isolation enforced |
| Phase 6 | US4 - Access Rejection | 4 | 3 | Unauthenticated requests properly rejected |
| Phase 7 | US5 - Sign Out | 4 | 2 | User can explicitly end session |
| Phase 8 | Polish | 3 | 3 | Error handling consistent, documentation complete |
| **TOTAL** | **5 Stories** | **37** | **24** | **All stories independently testable** |

---

## Phase 1: Setup & Environment Configuration

**Goal**: Configure environment variables, install dependencies, and set up project structure for authentication implementation.

**Independent Test**: Run `npm install` in frontend and `pip install -r requirements.txt` in backend without errors. Verify `.env.local` file exists with all required secrets.

### Tasks

- [X] T001 Create `.env.local` file in repository root with JWT_SECRET, BETTER_AUTH_SECRET, DATABASE_URL, and API URLs per quickstart.md
- [X] T002 Create `.env.example` template file with placeholder values for all secrets (for version control)
- [X] T003 [P] Install Better Auth in frontend: `cd frontend && npm install better-auth`
- [X] T004 [P] Install PyJWT in backend: `cd backend && pip install pyjwt && pip freeze > requirements.txt`

---

## Phase 2: Foundational Infrastructure

**Goal**: Set up database schema, JWT verification infrastructure, and Better Auth configuration that all user stories depend on.

**Independent Test**: Database migration completes successfully. Backend can verify a test JWT token. Better Auth API route responds to requests.

### Tasks

- [X] T005 [P] Create database migration `backend/migrations/add_user_id_to_tasks.sql` to add user_id column with foreign key to user table per data-model.md
- [X] T006 [P] Create backend auth module structure: `backend/app/auth/__init__.py`, `jwt_handler.py`, `dependencies.py`, `models.py` per plan.md
- [X] T007 [P] Configure Better Auth in `frontend/lib/auth.ts` with database provider, JWT secret, and session configuration per quickstart.md
- [X] T008 Create Better Auth API route handler in `frontend/app/api/auth/[...all]/route.ts` per plan.md

---

## Phase 3: User Story 1 - New User Account Creation (P1)

**User Story**: A new user visits the application and needs to create an account to access the task management features.

**Goal**: Implement complete signup flow from frontend form to user account creation and JWT token issuance.

**Independent Test**:
1. Navigate to `/signup` page
2. Enter valid email and password (meeting requirements)
3. Submit form
4. Verify: User account created in database, JWT token received, redirected to dashboard
5. Verify with invalid email: Error message shown
6. Verify with weak password: Validation feedback shown

**Acceptance Scenarios** (from spec.md):
- ✅ Valid signup → account created, JWT issued, redirected
- ✅ Duplicate email → clear error message
- ✅ Weak password → validation feedback

### Tasks

- [X] T009 [P] [US1] Implement JWT verification function in `backend/app/auth/jwt_handler.py` using PyJWT library per quickstart.md
- [X] T010 [P] [US1] Implement `get_current_user` FastAPI dependency in `backend/app/auth/dependencies.py` per quickstart.md
- [X] T011 [P] [US1] Create auth client in `frontend/lib/auth-client.ts` with signUp, signIn, signOut, getSession helpers per quickstart.md
- [X] T012 [P] [US1] Create SignupForm component in `frontend/components/auth/SignupForm.tsx` with email/password validation
- [X] T013 [US1] Create signup page in `frontend/app/(auth)/signup/page.tsx` that uses SignupForm component
- [X] T014 [US1] Implement signup success redirect to dashboard with JWT token persistence

---

## Phase 4: User Story 2 - Existing User Sign In (P1)

**User Story**: An existing user returns to the application and needs to sign in with their credentials.

**Goal**: Implement complete signin flow with JWT token issuance and authentication state persistence.

**Independent Test**:
1. Create a test user account (via signup or direct database insert)
2. Navigate to `/signin` page
3. Enter correct email and password
4. Submit form
5. Verify: JWT token received, redirected to dashboard, authentication state persists across page navigation
6. Verify with incorrect credentials: Generic error message shown

**Acceptance Scenarios** (from spec.md):
- ✅ Correct credentials → JWT issued, redirected to dashboard
- ✅ Incorrect credentials → generic error (no email/password leak)
- ✅ Authentication state persists across navigation

### Tasks

- [X] T015 [P] [US2] Create SigninForm component in `frontend/components/auth/SigninForm.tsx` with email/password fields
- [X] T016 [P] [US2] Create signin page in `frontend/app/(auth)/signin/page.tsx` that uses SigninForm component
- [X] T017 [P] [US2] Create authentication context provider in `frontend/lib/auth-context.tsx` for session state management per quickstart.md
- [X] T018 [US2] Wrap root layout in `frontend/app/layout.tsx` with AuthProvider to enable global auth state
- [X] T019 [US2] Implement signin error handling with generic error messages (no information leakage) per FR-022

---

## Phase 5: User Story 3 - Accessing Protected Task Resources (P1)

**User Story**: An authenticated user makes requests to create, read, update, or delete tasks with enforced data isolation.

**Goal**: Retrofit existing task API endpoints with JWT authentication and per-user filtering.

**Independent Test**:
1. Create User A and User B accounts
2. Authenticate as User A, create Task 1
3. Verify User A can fetch only Task 1
4. Authenticate as User B, attempt to fetch Task 1
5. Verify User B receives 403 Forbidden or empty result
6. Verify User B cannot update or delete Task 1 (403 Forbidden)

**Acceptance Scenarios** (from spec.md):
- ✅ Authenticated user fetches only their own tasks
- ✅ User cannot update another user's task (403 Forbidden)
- ✅ User ID extracted from JWT, not request body

### Tasks

- [X] T020 [P] [US3] Update Task model in `backend/app/models/task.py` to add user_id field with foreign key constraint per data-model.md
- [X] T021 [P] [US3] Update Task schemas in `backend/app/schemas/task.py` to include user_id validation (not from request body) per plan.md
- [X] T022 [P] [US3] Create API client with JWT injection in `frontend/lib/api-client.ts` per quickstart.md
- [X] T023 [P] [US3] Update GET /api/tasks endpoint in `backend/app/api/tasks.py` to add `get_current_user` dependency and filter by user_id per protected-api.yaml
- [X] T024 [US3] Update POST /api/tasks endpoint in `backend/app/api/tasks.py` to extract user_id from JWT (not request body) per quickstart.md
- [X] T025 [US3] Update PUT /api/tasks/{task_id} endpoint in `backend/app/api/tasks.py` to verify ownership before update (403 if mismatch) per protected-api.yaml
- [X] T026 [US3] Update DELETE /api/tasks/{task_id} endpoint in `backend/app/api/tasks.py` to verify ownership before delete (403 if mismatch) per protected-api.yaml

---

## Phase 6: User Story 4 - Unauthenticated Access Rejection (P2)

**User Story**: A user attempts to access protected API endpoints without valid authentication.

**Goal**: Ensure all protected endpoints reject unauthenticated, invalid, or expired tokens with appropriate error codes.

**Independent Test**:
1. Make API request to GET /api/tasks without Authorization header → 401 Unauthorized
2. Make API request with invalid JWT token → 401 Unauthorized
3. Make API request with expired JWT token → 401 Unauthorized with expiration message
4. Make API request to health check endpoint without auth → 200 OK (unprotected)

**Acceptance Scenarios** (from spec.md):
- ✅ No Authorization header → 401 Unauthorized
- ✅ Invalid/malformed token → 401 Unauthorized
- ✅ Expired token → 401 Unauthorized with expiration indicator

### Tasks

- [X] T027 [P] [US4] Implement standardized error responses in `backend/app/auth/dependencies.py` for 401 Unauthorized cases per FR-023
- [X] T028 [P] [US4] Add token expiration check in `backend/app/auth/jwt_handler.py` per quickstart.md
- [X] T029 [P] [US4] Implement frontend 401 handling in `frontend/lib/api-client.ts` to clear tokens and redirect per quickstart.md
- [X] T030 [US4] Verify health check endpoint GET /api/health remains unprotected (no auth dependency) per protected-api.yaml

---

## Phase 7: User Story 5 - Session Management and Sign Out (P3)

**User Story**: An authenticated user wants to explicitly sign out of the application.

**Goal**: Implement signout functionality that clears frontend tokens and redirects to login.

**Independent Test**:
1. Sign in as a user
2. Verify authenticated (can access tasks)
3. Click signout button
4. Verify: Redirected to signin page, JWT token cleared from storage
5. Attempt to access protected page → Redirected to signin
6. Note: Backend still accepts token until expiration (stateless JWT behavior)

**Acceptance Scenarios** (from spec.md):
- ✅ Signout → JWT removed from frontend, redirected to login
- ✅ Post-signout protected page access → Redirect to signin
- ✅ Backend still accepts token until expiration (expected behavior)

### Tasks

- [X] T031 [P] [US5] Create SignoutButton component in `frontend/components/auth/SignoutButton.tsx` that calls authClient.signOut()
- [X] T032 [P] [US5] Implement route protection middleware in `frontend/middleware.ts` to redirect unauthenticated users per quickstart.md
- [X] T033 [US5] Add SignoutButton to dashboard layout in `frontend/app/(dashboard)/layout.tsx`
- [X] T034 [US5] Create protected dashboard layout in `frontend/app/(dashboard)/layout.tsx` with authentication check per quickstart.md

---

## Phase 8: Polish & Cross-Cutting Concerns

**Goal**: Ensure consistent error handling, complete documentation, and production readiness.

**Independent Test**: All error responses follow standard format. Security checklist passes. ADRs documented.

### Tasks

- [X] T035 [P] Add CORS middleware configuration in `backend/app/main.py` to allow frontend origin per troubleshooting guide
- [X] T036 [P] Create authentication schemas in `backend/app/schemas/auth.py` for standardized error responses per FR-023
- [X] T037 [P] Verify all secrets are in `.env.local` and not committed to version control (.gitignore check) per security checklist

---

## Dependency Graph

### User Story Completion Order

```
Phase 1 (Setup) → Phase 2 (Foundational)
                      ↓
        ┌─────────────┼─────────────┬─────────────┐
        ↓             ↓             ↓             ↓
   Phase 3 (US1)  Phase 4 (US2)  Phase 5 (US3)  Phase 6 (US4)
   [Signup]       [Signin]       [Protected]    [Rejection]
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      ↓
                 Phase 7 (US5)
                 [Sign Out]
                      ↓
                 Phase 8 (Polish)
```

**Critical Path**:
1. Phase 1 (Setup) - Blocks all work
2. Phase 2 (Foundational) - Blocks all user stories
3. Phase 3 (US1 Signup) + Phase 4 (US2 Signin) - Can be done in parallel after Phase 2
4. Phase 5 (US3 Protected Resources) - Requires US1 or US2 for testing
5. Phase 6 (US4 Access Rejection) - Can be done in parallel with US1-US5
6. Phase 7 (US5 Sign Out) - Requires US2 for testing
7. Phase 8 (Polish) - Can be done in parallel with user stories

**Parallelization Opportunities**:
- Phase 1: T003 (frontend npm) and T004 (backend pip) can run in parallel
- Phase 2: T005, T006, T007 can run in parallel (different tech stacks)
- Phase 3: T009, T010, T011, T012 can run in parallel (independent components)
- Phase 4: T015, T016, T017 can run in parallel (independent components)
- Phase 5: T020, T021, T022, T023 can run in parallel (different files)
- Phase 6: All 4 tasks (T027-T030) can run in parallel
- Phase 7: T031, T032 can run in parallel
- Phase 8: All 3 tasks (T035-T037) can run in parallel

---

## Parallel Execution Examples

### Example 1: Maximize Parallelism (Multiple Developers/Agents)

**Iteration 1** (Complete Phase 1 Setup):
- Developer A: T001, T002 (sequential - env files)
- Developer B: T003 (frontend npm install)
- Developer C: T004 (backend pip install)

**Iteration 2** (Complete Phase 2 Foundational):
- Developer A: T005 (database migration)
- Developer B: T006 (backend auth module structure)
- Developer C: T007 (Better Auth config)
- Developer D: T008 (Better Auth API route)

**Iteration 3** (Parallel User Stories):
- Team 1 (US1 Signup): T009, T010, T011, T012 → T013, T014
- Team 2 (US2 Signin): T015, T016, T017 → T018, T019
- Team 3 (US4 Access Rejection): T027, T028, T029, T030

**Iteration 4** (Protected Resources):
- Team 1: T020, T021, T022, T023 (parallel) → T024, T025, T026 (sequential)

**Iteration 5** (Sign Out + Polish):
- Team 1: T031, T032 (parallel) → T033, T034
- Team 2: T035, T036, T037 (parallel)

**Total Time**: 5 iterations (vs 37 sequential)

### Example 2: Single Developer/Agent (Optimal Flow)

**Day 1** - Setup & Foundation:
1. T001, T002 (env setup)
2. T003, T004 (install dependencies) [parallel]
3. T005, T006, T007, T008 (foundational infrastructure) [mostly parallel]

**Day 2** - Core Authentication (US1 + US2):
4. T009, T010 (JWT backend) [parallel]
5. T011 (auth client)
6. T012, T015 (signup/signin forms) [parallel]
7. T013, T016 (signup/signin pages) [parallel]
8. T017, T018 (auth context + provider)
9. T014, T019 (success handling + error handling)

**Day 3** - Protected Resources (US3):
10. T020, T021, T022 (models, schemas, API client) [parallel]
11. T023, T024, T025, T026 (task endpoints with auth)

**Day 4** - Access Control (US4 + US5):
12. T027, T028, T029, T030 (rejection handling) [parallel]
13. T031, T032 (signout components) [parallel]
14. T033, T034 (dashboard protection)

**Day 5** - Polish:
15. T035, T036, T037 (CORS, schemas, security audit) [parallel]

**Total Time**: 5 days (vs 37 sequential tasks)

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)

**Recommended MVP**: User Story 1 + User Story 2 + User Story 3 (P1 stories only)

**MVP Deliverable**:
- Users can sign up (US1)
- Users can sign in (US2)
- Users can only access their own tasks (US3)
- **Value**: Complete authentication with data isolation - fully functional multi-user system

**Tasks for MVP**: T001-T026 (26 tasks, excludes US4, US5, Polish)

### Incremental Delivery

**Increment 1** (MVP): US1 + US2 + US3
- Duration: ~3 days with parallelization
- Delivers: Core authentication and data isolation
- Test: Create 2 users, verify data isolation

**Increment 2**: US4 (Access Rejection)
- Duration: ~1 day
- Adds: Robust error handling for unauthenticated access
- Test: Attempt access without/with invalid tokens

**Increment 3**: US5 (Sign Out) + Polish
- Duration: ~1 day
- Adds: User session control and production polish
- Test: Signout flow and security checklist

### Suggested Agent Delegation

Based on CLAUDE.md specialized agents:

1. **Database Agent** (`neon-db-manager`):
   - T005 (database migration for user_id)

2. **Backend Agent** (`fastapi-backend-dev`):
   - T006, T009, T010 (auth module and JWT infrastructure)
   - T020, T021, T023, T024, T025, T026 (task endpoints with auth)
   - T027, T028, T030 (error handling)
   - T035, T036 (CORS and schemas)

3. **Auth Agent** (`auth-security-specialist`):
   - T037 (security audit)
   - Review of T009, T010, T027, T028 (JWT security)

4. **Frontend Agent** (`nextjs-frontend-builder`):
   - T003, T007, T008, T011 (Better Auth setup)
   - T012, T013, T014, T015, T016, T017, T018, T019 (auth UI)
   - T022, T029, T031, T032, T033, T034 (API client and route protection)

---

## Task Validation Checklist

✅ **Format Compliance**:
- [ ] All tasks have checkbox format: `- [ ]`
- [ ] All tasks have sequential Task IDs (T001-T037)
- [ ] All user story tasks have [USX] labels
- [ ] All parallelizable tasks have [P] marker
- [ ] All tasks include specific file paths

✅ **Organization**:
- [ ] Tasks organized by user story phases
- [ ] Each phase has clear goal and independent test
- [ ] Dependencies clearly documented

✅ **Completeness**:
- [ ] All 5 user stories from spec.md covered
- [ ] All 28 functional requirements mapped to tasks
- [ ] All contracts endpoints implemented
- [ ] All data model entities implemented

✅ **Testability**:
- [ ] Each phase has independent test criteria
- [ ] MVP scope clearly defined
- [ ] Acceptance scenarios from spec.md mapped to tasks

---

## Notes for Implementation

### Critical Security Requirements

⚠️ **MUST** verify during implementation:
- User ID sourced ONLY from JWT claims (T024, T025, T026)
- All task queries filtered by user_id from JWT (T023, T024, T025, T026)
- Ownership verified before update/delete (T025, T026)
- JWT secret configured via environment variable (T001)
- Generic error messages (no info leakage) (T019, T027)

### Testing Approach

Since tests are not explicitly requested in spec.md, implementation should include manual testing per "Independent Test" criteria in each phase. If automated tests are needed later, add test tasks following the same [P] and [USX] labeling convention.

### File Paths Reference

All file paths are documented in plan.md Project Structure section (lines 120-178). Refer to that section for exact directory structure.

### Environment Variables

Required in `.env.local` (T001):
```bash
JWT_SECRET=<256-bit-secret>
BETTER_AUTH_SECRET=<256-bit-secret>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://...
```

---

## Summary

- **Total Tasks**: 37
- **Parallelizable Tasks**: 24 (65%)
- **User Stories**: 5 (3 P1, 1 P2, 1 P3)
- **MVP Tasks**: 26 (T001-T026)
- **Estimated Duration** (with parallelization): 5 days
- **Estimated Duration** (sequential): 37 task units

**Next Steps**:
1. Review and approve this task breakdown
2. Run `/sp.implement` to begin execution
3. Follow agent delegation strategy for specialized work
4. Use parallel execution examples to optimize workflow
5. Test each phase independently before proceeding
6. Create ADRs for architectural decisions identified in plan.md
