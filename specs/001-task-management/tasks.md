# Tasks: Task Management (Core Todo Domain)

**Input**: Design documents from `/specs/001-task-management/`
**Prerequisites**: plan.md (complete), spec.md (complete), research.md (complete), data-model.md (complete), contracts/ (complete)

**Tests**: Tests are NOT included per specification requirements. Testing strategy uses manual acceptance testing against defined scenarios.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/app/`, `frontend/app/`, `frontend/components/`, `frontend/lib/`
- All paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and environment configuration

- [x] T001 Verify backend/ and frontend/ directories exist per monorepo structure
- [x] T002 [P] Create backend requirements.txt with FastAPI 0.115+, SQLModel 0.0.16+, Pydantic 2.x, python-jose, alembic, pytest
- [x] T003 [P] Create frontend package.json with Next.js 16+, React 19+, Tailwind CSS 4.x, TypeScript 5.x
- [x] T004 [P] Create backend/.env.example with DATABASE_URL, JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRY_HOURS, API_HOST, API_PORT, CORS_ORIGINS
- [x] T005 [P] Create frontend/.env.local.example with NEXT_PUBLIC_API_URL, AUTH_SECRET, AUTH_URL
- [x] T006 Install backend dependencies from requirements.txt
- [x] T007 Install frontend dependencies from package.json

**Checkpoint**: Environment ready for development

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Foundation

- [x] T008 Create backend/app/database.py with Neon PostgreSQL connection using SQLModel engine
- [x] T009 Configure Alembic for database migrations in backend/alembic/
- [x] T010 Create tasks table migration script with schema: id (PK), user_id (FK indexed), title (varchar 500), description (text nullable), completed (boolean default false), created_at (timestamp), updated_at (timestamp)
- [x] T011 Create indexes on tasks table: idx_tasks_user_id, idx_tasks_completed, idx_tasks_created_at
- [ ] T012 Run migration to create tasks table in development database

### Authentication Foundation

- [x] T013 Create backend/app/auth/jwt.py with JWT verification middleware and get_current_user dependency function
- [x] T014 Implement HTTPBearer security scheme in backend/app/auth/jwt.py
- [x] T015 Implement user_id extraction from JWT token claims in get_current_user function

### Backend Foundation

- [x] T016 Create backend/app/models/task.py with SQLModel Task model (id, user_id, title, description, completed, created_at, updated_at)
- [x] T017 [P] Create backend/app/schemas/task.py with TaskCreate Pydantic schema (title with validation, description)
- [x] T018 [P] Create backend/app/schemas/task.py with TaskUpdate Pydantic schema (title with validation, description)
- [x] T019 [P] Create backend/app/schemas/task.py with TaskResponse Pydantic schema (all fields from Task model)
- [x] T020 [P] Create backend/app/schemas/error.py with Error response schema (success, error with message and code)
- [x] T021 Add title validator to TaskCreate and TaskUpdate schemas: strip whitespace, validate non-empty, validate length 1-500 chars
- [x] T022 Create backend/app/api/v1/ directory for versioned API routes
- [x] T023 Create backend/main.py with FastAPI app initialization, CORS middleware, and API router mounting

### Frontend Foundation

- [x] T024 Create frontend/lib/types.ts with Task interface matching backend TaskResponse schema
- [x] T025 Create frontend/lib/api/client.ts with base API client and authentication token injection logic
- [x] T026 Create frontend/lib/auth/context.tsx with auth context for user authentication state (placeholder for auth integration)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create and View My First Task (Priority: P1) 🎯 MVP

**Goal**: Enable authenticated users to create tasks with title/description and view their personal task list

**Independent Test**: Log in as a user, create a task with title "Buy groceries", verify it appears in task list with incomplete status. Create another task with title and description, verify both fields preserved. Verify only authenticated user's tasks are displayed.

### Backend Implementation for User Story 1

- [x] T027 [P] [US1] Create POST /api/v1/tasks endpoint in backend/app/api/v1/tasks.py for creating tasks
- [x] T028 [P] [US1] Create GET /api/v1/tasks endpoint in backend/app/api/v1/tasks.py for listing user's tasks
- [x] T029 [US1] Implement create_task function: extract user_id from JWT, validate TaskCreate schema, create Task model instance, persist to database
- [x] T030 [US1] Implement list_tasks function: extract user_id from JWT, query tasks filtered by user_id, order by created_at descending
- [x] T031 [US1] Add JWT authentication middleware to both endpoints using Depends(get_current_user)
- [x] T032 [US1] Add user_id filtering to database queries in list_tasks: WHERE user_id = current_user.id
- [x] T033 [US1] Mount tasks router to /api/v1 prefix in backend/main.py

### Frontend Implementation for User Story 1

- [x] T034 [P] [US1] Create frontend/lib/api/tasks.ts with fetchTasks function (GET /api/v1/tasks)
- [x] T035 [P] [US1] Create frontend/lib/api/tasks.ts with createTask function (POST /api/v1/tasks)
- [x] T036 [US1] Create frontend/app/(dashboard)/tasks/page.tsx as Server Component that fetches and displays task list
- [x] T037 [US1] Create frontend/components/tasks/TaskList.tsx Client Component to render array of tasks
- [x] T038 [US1] Create frontend/components/tasks/TaskItem.tsx Client Component to render single task with title, description, completion checkbox
- [x] T039 [US1] Create frontend/app/(dashboard)/tasks/new/page.tsx with task creation form
- [x] T040 [US1] Create frontend/components/tasks/TaskForm.tsx Client Component with title and description input fields
- [x] T041 [US1] Implement form submission in TaskForm: call createTask API, handle success/error, redirect to task list on success
- [x] T042 [US1] Add empty state message to TaskList: "No tasks yet. Create your first task!" when tasks array is empty
- [x] T043 [US1] Add task count display to task list page: "You have X tasks" or "X incomplete, Y complete"

**Checkpoint**: User Story 1 complete - users can create tasks and see their personal task list. This is a fully functional MVP.

---

## Phase 4: User Story 2 - Mark Tasks Complete (Priority: P2)

**Goal**: Enable users to toggle task completion status and visually distinguish complete from incomplete tasks

**Independent Test**: Create a task "Write report", mark it as complete, verify status changes and visual indicator appears. Toggle completed task back to incomplete, verify status reverts. Refresh page and verify completion state persists.

### Backend Implementation for User Story 2

- [ ] T044 [US2] Create PATCH /api/v1/tasks/{id}/complete endpoint in backend/app/api/v1/tasks.py for toggling completion
- [ ] T045 [US2] Implement toggle_task_completion function: extract user_id from JWT, verify task exists and belongs to user, invert completed boolean, update updated_at timestamp
- [ ] T046 [US2] Add ownership verification: query WHERE id = task_id AND user_id = current_user.id, return 404 if not found
- [ ] T047 [US2] Update Task model's updated_at field to current UTC timestamp on completion toggle

### Frontend Implementation for User Story 2

- [ ] T048 [US2] Create frontend/lib/api/tasks.ts with toggleTaskCompletion function (PATCH /api/v1/tasks/{id}/complete)
- [ ] T049 [US2] Add completion checkbox to TaskItem component with onChange handler calling toggleTaskCompletion
- [ ] T050 [US2] Add visual styling to TaskItem: strikethrough text for completed tasks using Tailwind CSS
- [ ] T051 [US2] Implement router.refresh() after completion toggle to refresh Server Component data
- [ ] T052 [US2] Add completed/incomplete visual distinction: different background color or icon for completed tasks
- [ ] T053 [US2] Update task count display to show breakdown: "X incomplete, Y complete"

**Checkpoint**: User Story 2 complete - users can track progress by marking tasks complete. Both US1 and US2 work independently.

---

## Phase 5: User Story 3 - Update Task Details (Priority: P3)

**Goal**: Enable users to edit task title and description after creation

**Independent Test**: Create task "Call client", update title to "Call client - discuss Q1 budget", verify change persists. Update description, verify it saves. Attempt to clear title, verify system prevents empty title.

### Backend Implementation for User Story 3

- [ ] T054 [US3] Create PUT /api/v1/tasks/{id} endpoint in backend/app/api/v1/tasks.py for updating task details
- [ ] T055 [US3] Implement update_task function: extract user_id from JWT, verify ownership, validate TaskUpdate schema, update title and description
- [ ] T056 [US3] Add ownership verification to update_task: return 404 if task not found or doesn't belong to user
- [ ] T057 [US3] Preserve task ownership, completion status, and created_at timestamp during update
- [ ] T058 [US3] Update Task model's updated_at field to current UTC timestamp on update

### Frontend Implementation for User Story 3

- [ ] T059 [US3] Create frontend/lib/api/tasks.ts with updateTask function (PUT /api/v1/tasks/{id})
- [ ] T060 [US3] Create frontend/app/(dashboard)/tasks/[id]/edit/page.tsx with edit task form
- [ ] T061 [US3] Reuse TaskForm component in edit page, pre-populate with existing task data
- [ ] T062 [US3] Implement update submission: call updateTask API with task ID, handle validation errors
- [ ] T063 [US3] Add client-side validation to TaskForm: prevent submission if title is empty or whitespace-only
- [ ] T064 [US3] Display validation errors from backend in TaskForm (title too long, empty title, description too long)
- [ ] T065 [US3] Add "Edit" button/link to TaskItem component linking to edit page

**Checkpoint**: User Story 3 complete - users can refine task information. All three stories work independently.

---

## Phase 6: User Story 4 - Delete Unwanted Tasks (Priority: P4)

**Goal**: Enable users to permanently remove tasks from their list

**Independent Test**: Create task "Old meeting notes", delete it, verify it disappears from list. Refresh page, verify task does not reappear. Attempt to delete another user's task, verify error response.

### Backend Implementation for User Story 4

- [ ] T066 [US4] Create DELETE /api/v1/tasks/{id} endpoint in backend/app/api/v1/tasks.py for deleting tasks
- [ ] T067 [US4] Implement delete_task function: extract user_id from JWT, verify ownership, delete task from database
- [ ] T068 [US4] Add ownership verification to delete_task: return 404 if task not found or doesn't belong to user
- [ ] T069 [US4] Return success response with message: {"success": true, "data": {"message": "Task deleted successfully"}}

### Frontend Implementation for User Story 4

- [ ] T070 [US4] Create frontend/lib/api/tasks.ts with deleteTask function (DELETE /api/v1/tasks/{id})
- [ ] T071 [US4] Add "Delete" button to TaskItem component with onClick handler
- [ ] T072 [US4] Implement delete confirmation dialog: use window.confirm("Delete this task?") before deletion
- [ ] T073 [US4] Call deleteTask API on confirmation, refresh task list on success using router.refresh()
- [ ] T074 [US4] Handle delete errors: display error message if deletion fails (e.g., task not found)

**Checkpoint**: User Story 4 complete - users have full CRUD control over tasks. All four stories work independently.

---

## Phase 7: User Story 5 - View Task List with Filtering (Priority: P5)

**Goal**: Enhance task list display with visual organization and optional completion filtering

**Independent Test**: Create mix of complete and incomplete tasks, verify visual distinction is clear. View empty task list, verify helpful message displayed. Load task list with 10 tasks, verify consistent formatting and task count display.

### Backend Implementation for User Story 5

- [ ] T075 [US5] Add optional completed query parameter to GET /api/v1/tasks endpoint for filtering by status
- [ ] T076 [US5] Implement completion filtering in list_tasks: if completed param provided, add WHERE completed = {value} to query
- [ ] T077 [US5] Ensure unfiltered queries return all user's tasks (both complete and incomplete)

### Frontend Implementation for User Story 5

- [ ] T078 [US5] Create frontend/components/tasks/TaskFilters.tsx Client Component with filter buttons/toggles
- [ ] T079 [US5] Add filter state management: "All", "Active" (incomplete), "Completed" filter options
- [ ] T080 [US5] Update fetchTasks in tasks.ts to accept optional completed parameter
- [ ] T081 [US5] Implement filter logic: pass completed=false for "Active", completed=true for "Completed", no param for "All"
- [ ] T082 [US5] Add TaskFilters component to task list page above TaskList component
- [ ] T083 [US5] Update task list to refresh when filter changes using router.refresh() or state management
- [ ] T084 [US5] Enhance visual distinction: use color coding or icons for complete vs incomplete tasks (beyond strikethrough)
- [ ] T085 [US5] Update empty state message based on active filter: "No incomplete tasks" vs "No completed tasks" vs "No tasks yet"

**Checkpoint**: User Story 5 complete - task list provides enhanced organization. All five user stories work independently and together.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final quality checks

### Error Handling & Validation

- [ ] T086 [P] Add error boundary to frontend task pages for graceful error handling
- [ ] T087 [P] Implement consistent error response format across all backend endpoints
- [ ] T088 [P] Add validation error display for character limits in frontend (title 500, description 5000)
- [ ] T089 Add loading states to frontend: skeleton loaders or spinners during API calls

### Performance & Optimization

- [ ] T090 [P] Add database query logging in backend for performance monitoring
- [ ] T091 [P] Verify indexes are being used: check EXPLAIN ANALYZE on user_id queries
- [ ] T092 Test with 100 tasks per user to verify performance targets (< 3 seconds rendering)

### Security Hardening

- [ ] T093 [P] Verify JWT secret is cryptographically secure (32+ bytes) in backend configuration
- [ ] T094 [P] Ensure CORS origins are properly configured to allow only frontend URL
- [ ] T095 [P] Verify 404 responses for unauthorized access (not 403) to prevent user enumeration
- [ ] T096 Add rate limiting to task creation endpoint (optional: prevent abuse)

### Documentation & Developer Experience

- [x] T097 [P] Update backend README.md with setup instructions, API endpoints, environment variables
- [x] T098 [P] Update frontend README.md with development server commands, component structure
- [ ] T099 [P] Verify quickstart.md manual acceptance tests can be executed successfully
- [ ] T100 Generate API documentation using FastAPI's automatic Swagger UI at /docs

### Code Quality

- [ ] T101 [P] Run backend linter (ruff or flake8) and fix any issues
- [ ] T102 [P] Run frontend linter (ESLint) and fix any issues
- [ ] T103 [P] Format all code with appropriate formatters (black for Python, prettier for TypeScript)
- [ ] T104 Remove any TODO comments or debug logging statements

### Final Integration Validation

- [ ] T105 Test complete user journey: signup → create task → mark complete → update → delete
- [ ] T106 Verify multi-user isolation: create tasks as User A, login as User B, verify User B cannot see User A's tasks
- [ ] T107 Test edge cases: empty title validation, long title/description, special characters/emojis in content
- [ ] T108 Verify all acceptance scenarios from spec.md User Stories 1-5 pass

**Checkpoint**: Feature complete and production-ready

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
  - Each user story can proceed independently after Foundation is complete
  - Recommended sequential order: US1 → US2 → US3 → US4 → US5 (by priority)
  - Can be parallelized if multiple developers available
- **Polish (Phase 8)**: Depends on desired user stories being complete (minimum US1 for MVP)

### User Story Dependencies

- **User Story 1 (P1) - Phase 3**: Foundation only - NO dependencies on other stories
- **User Story 2 (P2) - Phase 4**: Foundation only - Builds on US1 UI but independently testable
- **User Story 3 (P3) - Phase 5**: Foundation only - Reuses TaskForm but independently testable
- **User Story 4 (P4) - Phase 6**: Foundation only - Adds delete to existing UI but independently testable
- **User Story 5 (P5) - Phase 7**: Foundation only - Enhances existing list view but independently testable

### Within Each User Story

**Backend Tasks** (can parallelize marked [P]):
1. API endpoints (often parallelizable if different operations)
2. Business logic implementation (sequential within same function)
3. Authorization and validation (integrate into endpoints)

**Frontend Tasks** (can parallelize marked [P]):
1. API client functions (parallelizable - different files)
2. Page components (sequential if dependent on API client)
3. Reusable UI components (parallelizable - different files)
4. Integration and styling (sequential - depends on components)

### Parallel Opportunities

**Within Phase 1 (Setup)**:
- T002, T003, T004, T005 can all run in parallel

**Within Phase 2 (Foundational)**:
- Database tasks (T008-T012) must be sequential (migration dependencies)
- Auth tasks (T013-T015) can run in parallel
- Backend schema tasks (T017-T021) can run in parallel after T016
- Frontend foundation (T024-T026) can run in parallel

**Within Each User Story**:
- Backend endpoints for different operations can run in parallel
- Frontend API client functions can run in parallel
- Frontend components can run in parallel (e.g., TaskList + TaskItem + TaskForm)

**Between User Stories (if team capacity allows)**:
- After Foundation completes, different developers can work on US1, US2, US3 simultaneously
- Each developer implements backend + frontend for their assigned story
- Stories integrate independently without conflicts

**Within Phase 8 (Polish)**:
- Most polish tasks marked [P] can run in parallel (different concerns)

---

## Parallel Example: User Story 1

```bash
# After Foundation is complete, launch User Story 1 backend tasks:
Task T027: "Create POST /api/v1/tasks endpoint"
Task T028: "Create GET /api/v1/tasks endpoint"
# These can start in parallel (different operations, will be in same file but distinct functions)

# Frontend API client functions (parallel):
Task T034: "Create fetchTasks function"
Task T035: "Create createTask function"
# Different exports in same file, can be written in parallel

# Frontend components (parallel):
Task T037: "Create TaskList.tsx"
Task T038: "Create TaskItem.tsx"
Task T040: "Create TaskForm.tsx"
# Different files, different components, fully parallel
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

**Minimum Viable Product Scope**:
1. Complete Phase 1: Setup (T001-T007)
2. Complete Phase 2: Foundational (T008-T026) - CRITICAL
3. Complete Phase 3: User Story 1 (T027-T043)
4. Complete Phase 8: Minimal Polish (T086-T089, T097-T099, T105)
5. **STOP and VALIDATE**: Test User Story 1 acceptance scenarios
6. Deploy/demo MVP - users can create and view tasks

**MVP Delivers**:
- Task creation with title and description
- Personal task list (user-isolated)
- Basic note-taking capability
- Foundation for all future stories

### Incremental Delivery (Recommended)

**Release 1: MVP (User Story 1)**
- Setup + Foundation + US1 + Essential Polish
- Deploy and gather user feedback
- Validates core architecture and user data isolation

**Release 2: Task Tracking (Add User Story 2)**
- Implement completion toggling
- Visual distinction between states
- Deploy - now users can track progress

**Release 3: Task Editing (Add User Story 3)**
- Implement update functionality
- Deploy - users can refine task information

**Release 4: Task Management (Add User Story 4)**
- Implement deletion
- Deploy - users have full CRUD control

**Release 5: Enhanced UX (Add User Story 5)**
- Implement filtering and enhanced visuals
- Deploy - polished user experience

**Benefits of Incremental Delivery**:
- Each release adds value without breaking previous functionality
- User feedback informs subsequent stories
- Reduces risk by validating architecture early
- Demonstrates progress at each milestone

### Parallel Team Strategy

**If multiple developers/agents available**:

**Stage 1: Foundation (All Together)**
- Entire team collaborates on Setup + Foundational phases
- Ensures shared understanding of architecture
- ~26 tasks (T001-T026)

**Stage 2: Parallel User Stories (Split Work)**
Once Foundation is complete:
- **Developer/Agent A**: User Story 1 (T027-T043) - 17 tasks
- **Developer/Agent B**: User Story 2 (T044-T053) - 10 tasks
- **Developer/Agent C**: User Story 3 (T054-T065) - 12 tasks
- Stories complete independently and can be tested in isolation

**Stage 3: Sequential Remaining Stories**
- User Story 4 (T066-T074) - 9 tasks
- User Story 5 (T075-T085) - 11 tasks
- Can be done by single developer or split

**Stage 4: Polish (All Together or Parallel)**
- Team reviews and completes polish tasks (T086-T108)
- Integration testing across all stories

**Parallel Coordination Points**:
- Daily sync to review Foundation progress
- After Foundation: minimal coordination needed (independent stories)
- Before Polish: integration review to ensure stories work together

---

## Task Summary

**Total Tasks**: 108 tasks

**Task Count by Phase**:
- Phase 1 (Setup): 7 tasks
- Phase 2 (Foundational): 19 tasks (CRITICAL BLOCKER)
- Phase 3 (User Story 1 - P1): 17 tasks 🎯 MVP
- Phase 4 (User Story 2 - P2): 10 tasks
- Phase 5 (User Story 3 - P3): 12 tasks
- Phase 6 (User Story 4 - P4): 9 tasks
- Phase 7 (User Story 5 - P5): 11 tasks
- Phase 8 (Polish): 23 tasks

**Task Count by Story**:
- US1 (Create and View): 17 tasks
- US2 (Mark Complete): 10 tasks
- US3 (Update Details): 12 tasks
- US4 (Delete Tasks): 9 tasks
- US5 (Filtering): 11 tasks

**Parallelization Potential**:
- Setup phase: 4 tasks can run in parallel (57%)
- Foundational phase: 8 tasks can run in parallel (42%)
- User stories: All 5 stories can run in parallel after Foundation
- Polish phase: 14 tasks can run in parallel (61%)

**Critical Path** (Sequential Dependencies):
1. Phase 1 (Setup) → Phase 2 (Foundation) → Phase 3 (US1) = Minimum for MVP
2. Total critical path: ~43 tasks for MVP
3. Full feature: 108 tasks (but many can be parallelized)

**Suggested MVP Scope**:
- Phases 1-3 + Essential polish (T001-T043 + T086-T089, T097-T099, T105)
- Total: ~55 tasks
- Delivers: Task creation, viewing, user isolation
- Validates: Architecture, security, user experience foundation

---

## Notes

- **[P] markers**: 44 tasks marked as parallelizable (41% of total)
- **[Story] labels**: 59 tasks tagged with user story labels for traceability
- **Independent stories**: Each user story is self-contained and testable independently
- **No test tasks**: Per specification, using manual acceptance testing instead of automated tests
- **Commit strategy**: Commit after each completed task or logical group (e.g., all endpoints for one story)
- **Stop checkpoints**: End of each user story phase for independent validation
- **Agent delegation**:
  - Database tasks (T008-T012) → `neon-db-manager` agent
  - Auth tasks (T013-T015) → `auth-security-specialist` agent
  - Backend tasks (T016-T023, T027-T033, T044-T047, T054-T058, T066-T069, T075-T077) → `fastapi-backend-dev` agent
  - Frontend tasks (T024-T026, T034-T043, T048-T053, T059-T065, T070-T074, T078-T085) → `nextjs-frontend-builder` agent
- **Quality gates**: Verify constitution compliance at each checkpoint
- **Data isolation**: Verified at every user story checkpoint (critical security requirement)
