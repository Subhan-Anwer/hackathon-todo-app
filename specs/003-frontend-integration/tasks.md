# Tasks: Frontend UI & Full-Stack Integration

**Input**: Design documents from `/specs/003-frontend-integration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - not explicitly requested in feature specification, so test tasks are excluded

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a web application with frontend/backend separation:
- **Frontend**: `frontend/` directory (Next.js 16+ App Router)
- **Backend**: `backend/` directory (FastAPI - already implemented)
- Paths include full relative path from repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and foundational TypeScript types that all user stories depend on

- [x] T001 Create TypeScript type definitions in frontend/lib/types/task.ts (Task, TaskCreate, TaskUpdate interfaces)
- [x] T002 [P] Create TypeScript type definitions in frontend/lib/types/user.ts (User interface)
- [x] T003 [P] Create TypeScript type definitions in frontend/lib/types/auth.ts (AuthCredentials, SignUpData interfaces)
- [x] T004 [P] Create TypeScript type definitions in frontend/lib/types/api.ts (ApiResponse, ApiError interfaces)
- [x] T005 [P] Create TypeScript type definitions in frontend/lib/types/forms.ts (FormState interface)
- [x] T006 [P] Create TypeScript type definitions in frontend/lib/types/ui.ts (LoadingState, AsyncState interfaces)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### API Client Layer (Foundation for all API calls)

- [x] T007 Implement base API client with JWT authentication in frontend/lib/api/client.ts (includes fetch wrapper, retry logic, error handling, Authorization header injection)
- [x] T008 [P] Create API client error classes (ApiError, NetworkError) in frontend/lib/api/client.ts
- [x] T009 Implement task API functions in frontend/lib/api/tasks.ts (list, get, create, update, delete, toggleComplete using apiClient)

### Custom Hooks (Foundation for component state management)

- [x] T010 [P] Implement useApi hook in frontend/lib/hooks/useApi.ts (generic async data fetching with loading/error states)
- [x] T011 [P] Implement useForm hook in frontend/lib/hooks/useForm.ts (form state management with validation)

### Validation Utilities

- [x] T012 Implement validation utilities in frontend/lib/utils/validation.ts (required, minLength, maxLength, email validators, composeValidators function)

### UI Components (Foundation for all pages)

- [x] T013 [P] Create Button component in frontend/components/ui/Button.tsx (reusable button with loading state, variants, touch-friendly)
- [x] T014 [P] Create Input component in frontend/components/ui/Input.tsx (reusable input with error display, validation state)
- [x] T015 [P] Create LoadingSpinner component in frontend/components/ui/LoadingSpinner.tsx (loading indicator for async operations)
- [x] T016 [P] Create ErrorMessage component in frontend/components/ui/ErrorMessage.tsx (error display with retry button option)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Authenticated Task Viewing (Priority: P1) 🎯 MVP

**Goal**: Users can sign in and view their personal task list in a responsive web interface

**Independent Test**: Sign in with valid credentials and verify task list loads showing only user-specific tasks with proper responsive layout on mobile/tablet/desktop

### Implementation for User Story 1

#### Authentication Infrastructure (US1 + US4 combined - both P1)

- [x] T017 [US1] Configure Better Auth in frontend/lib/auth/config.ts (client and server auth configuration, JWT settings)
- [x] T018 [US1] Implement session management utilities in frontend/lib/auth/session.ts (getSession, requireAuth server-side functions)
- [x] T019 [US1] Implement useAuth hook in frontend/lib/hooks/useAuth.ts (client-side authentication state hook using Better Auth useSession)
- [x] T020 [US1] Update Next.js middleware in frontend/middleware.ts (route protection logic, redirect unauthenticated users to /signin, preserve callbackUrl)

#### Sign-In Page

- [x] T021 [P] [US1] Create SignInForm component in frontend/components/auth/SignInForm.tsx (email/password inputs, validation, Better Auth sign-in integration)
- [x] T022 [US1] Update sign-in page in frontend/app/(auth)/signin/page.tsx (render SignInForm, handle callbackUrl redirect after successful signin)

#### Sign-Up Page

- [x] T023 [P] [US1] Create SignUpForm component in frontend/components/auth/SignUpForm.tsx (email/password/name inputs, password confirmation, validation, Better Auth sign-up integration)
- [x] T024 [US1] Update sign-up page in frontend/app/(auth)/signup/page.tsx (render SignUpForm, redirect to /tasks after successful signup)

#### Task List Display

- [x] T025 [P] [US1] Create EmptyState component in frontend/components/tasks/EmptyState.tsx (display when user has no tasks, prompt to create first task)
- [x] T026 [P] [US1] Create TaskCard component in frontend/components/tasks/TaskCard.tsx (display single task with title, description, completion status, created date, completion toggle, edit/delete buttons)
- [x] T027 [US1] Implement useTasks hook in frontend/lib/hooks/useTasks.ts (task list state management, CRUD operations using task API)
- [x] T028 [US1] Update TaskList component in frontend/components/tasks/TaskList.tsx (fetch tasks on mount, display TaskCard for each task, show EmptyState when empty, handle loading/error states)
- [x] T029 [US1] Update task list page in frontend/app/(dashboard)/tasks/page.tsx (Server Component that fetches tasks server-side with session, passes to TaskList client component, implements responsive layout)

#### Layout Components

- [x] T030 [P] [US1] Create Header component in frontend/components/layout/Header.tsx (app header with logo, navigation links, sign-out button for desktop)
- [x] T031 [P] [US1] Create MobileNav component in frontend/components/layout/MobileNav.tsx (mobile navigation drawer/menu with tasks link, sign-out)
- [x] T032 [US1] Update dashboard layout in frontend/app/(dashboard)/layout.tsx (include Header, MobileNav, responsive container with padding)

#### Landing Page

- [x] T033 [US1] Update landing page in frontend/app/page.tsx (redirect authenticated users to /tasks, show sign-in/sign-up links for unauthenticated users)

**Checkpoint**: At this point, User Story 1 is fully functional - users can sign up, sign in, view their task list with responsive design, and authentication is enforced

---

## Phase 4: User Story 2 - Task Creation and Updates (Priority: P2)

**Goal**: Users can create new tasks and edit existing tasks through form interfaces

**Independent Test**: Create a new task via form and verify it appears in list, then edit the task and confirm changes persist

### Implementation for User Story 2

#### Task Form Component

- [x] T034 [P] [US2] Create TaskForm component in frontend/components/tasks/TaskForm.tsx (reusable form for create/edit with title and description inputs, validation using useForm hook, submit handler, loading state)

#### Task Creation Page

- [x] T035 [US2] Create new task page in frontend/app/(dashboard)/tasks/new/page.tsx (render TaskForm in create mode, call taskApi.create on submit, redirect to /tasks on success, show validation errors)

#### Task Edit Page

- [x] T036 [US2] Update edit task page in frontend/app/(dashboard)/tasks/[id]/edit/page.tsx (fetch task data server-side, render TaskForm with initial values in edit mode, call taskApi.update on submit, redirect to /tasks on success)

#### Update TaskCard for Navigation

- [x] T037 [US2] Update TaskCard component to add Edit button linking to /tasks/[id]/edit (add edit icon button with proper accessibility label)

**Checkpoint**: At this point, User Story 2 is fully functional - users can create and edit tasks with validation and error handling

---

## Phase 5: User Story 3 - Task Completion and Deletion (Priority: P3)

**Goal**: Users can toggle task completion status and delete tasks with confirmation

**Independent Test**: Toggle a task's completion status and verify UI updates, then delete a task after confirmation and verify it's removed

### Implementation for User Story 3

#### Confirm Dialog Component

- [x] T038 [P] [US3] Create ConfirmDialog component in frontend/components/ui/ConfirmDialog.tsx (modal dialog for delete confirmation with cancel/confirm buttons, focus trap, ARIA modal attributes)

#### Task Completion Toggle

- [x] T039 [US3] Update TaskCard component to implement completion toggle (checkbox that calls taskApi.toggleComplete, optimistic UI update, revert on error, visual distinction for completed tasks with strikethrough/grayed style)

#### Task Deletion

- [x] T040 [US3] Update TaskCard component to implement delete functionality (delete button that opens ConfirmDialog, calls taskApi.delete on confirmation, removes task from list on success, shows error on failure)

#### Update useTasks Hook

- [x] T041 [US3] Update useTasks hook to include toggleComplete and deleteTask functions (handle optimistic updates, error recovery, state synchronization)

**Checkpoint**: At this point, User Story 3 is fully functional - users can complete and delete tasks with proper confirmation and error handling

---

## Phase 6: User Story 4 - Authentication-Aware Routing (Priority: P1)

**Note**: This user story was implemented as part of Phase 3 (User Story 1) since both are P1 and authentication is required for task viewing.

**Already Complete**:
- ✅ T020: Middleware route protection
- ✅ T018: Session management utilities
- ✅ T019: useAuth hook
- ✅ T022: Callback URL handling in sign-in page

**No additional tasks needed** - this user story's requirements are satisfied by Phase 3 implementation.

---

## Phase 7: User Story 5 - Loading and Error States (Priority: P3)

**Goal**: Display loading indicators during async operations and user-friendly error messages with retry options

**Independent Test**: Simulate slow network to verify loading states, simulate API failure to verify error messages and retry functionality

### Implementation for User Story 5

#### Loading States

- [x] T042 [P] [US5] Create TaskListSkeleton component in frontend/components/tasks/TaskListSkeleton.tsx (skeleton screen showing 3 placeholder task cards with pulse animation)
- [x] T043 [US5] Update task list page to implement Suspense boundary with TaskListSkeleton as fallback in frontend/app/(dashboard)/tasks/page.tsx

#### Error Boundary

- [x] T044 [P] [US5] Create ErrorBoundary component in frontend/components/ui/ErrorBoundary.tsx (React error boundary class component with retry functionality, fallback UI)
- [x] T045 [US5] Wrap dashboard layout with ErrorBoundary in frontend/app/(dashboard)/layout.tsx

#### Update Components with Loading/Error States

- [x] T046 [US5] Update TaskList component to use LoadingSpinner during initial fetch and ErrorMessage for fetch failures in frontend/components/tasks/TaskList.tsx
- [x] T047 [US5] Update TaskForm component to show loading state during submission and handle API errors with ErrorMessage in frontend/components/tasks/TaskForm.tsx
- [x] T048 [US5] Update TaskCard component to handle loading state during completion toggle and deletion in frontend/components/tasks/TaskCard.tsx

**Checkpoint**: At this point, User Story 5 is fully functional - all async operations show loading indicators and errors are handled gracefully with retry options

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final touches, accessibility improvements, and responsive design refinements

### Responsive Design Enhancements

- [x] T049 [P] Add responsive breakpoint styles to TaskList component for mobile/tablet/desktop layouts in frontend/components/tasks/TaskList.tsx
- [x] T050 [P] Verify and enhance mobile navigation in MobileNav component with hamburger menu and touch-friendly controls in frontend/components/layout/MobileNav.tsx
- [x] T051 [P] Add responsive typography scaling to all components using Tailwind responsive classes (text-base sm:text-lg lg:text-xl pattern)

### Accessibility Improvements

- [x] T052 [P] Add ARIA labels to all icon-only buttons (edit, delete, completion toggle) across TaskCard component
- [x] T053 [P] Implement keyboard navigation for TaskCard (Enter/Space for toggle, Delete key for deletion)
- [x] T054 [P] Add skip-to-content link in root layout for keyboard users in frontend/app/layout.tsx
- [x] T055 [P] Verify all form inputs have proper labels and error message announcements (aria-describedby, role="alert")

### Performance Optimizations

- [x] T056 [P] Add loading.tsx files for route-based loading states in frontend/app/(dashboard)/tasks/loading.tsx
- [x] T057 [P] Add error.tsx files for route-based error handling in frontend/app/(dashboard)/tasks/error.tsx
- [x] T058 [P] Optimize image assets if any (compress, use Next.js Image component)

### Final Validation

- [x] T059 Run Lighthouse accessibility audit and fix any issues flagged (target score > 90)
- [x] T060 Test authentication flow end-to-end (signup, signin, signout, protected route access)
- [x] T061 Test task CRUD operations end-to-end (create, read, update, delete, toggle completion)
- [x] T062 Verify responsive design on real devices (mobile phone, tablet, desktop)
- [x] T063 Verify error handling and recovery (network errors, API failures, validation errors)

**Checkpoint**: Feature is complete, polished, accessible, and production-ready

---

## Dependencies & Parallel Execution

### User Story Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundation)
                      ↓
         Phase 3 (US1 - P1) + Phase 6 (US4 - P1)  ← MVP
                      ↓
              Phase 4 (US2 - P2)
                      ↓
        ┌─────────────┴─────────────┐
   Phase 5 (US3 - P3)    Phase 7 (US5 - P3)  ← Can run in parallel
        └─────────────┬─────────────┘
                      ↓
              Phase 8 (Polish)
```

**Independent Stories**:
- US1 (Authenticated Task Viewing) + US4 (Authentication-Aware Routing) - Combined, blocking
- US2 (Task Creation/Updates) - Depends on US1
- US3 (Task Completion/Deletion) - Depends on US1
- US5 (Loading/Error States) - Can run parallel with US3

### Parallel Execution Opportunities

**Phase 1 (Setup)**: Tasks T002-T006 can run in parallel (different files)

**Phase 2 (Foundation)**:
- T008 can run parallel with T007
- T009 depends on T007 (needs apiClient)
- T010-T011 can run in parallel with each other
- T013-T016 (UI components) can all run in parallel

**Phase 3 (US1)**:
- T021, T023, T025, T026, T030, T031 can all run in parallel (different components)
- T022 depends on T021 (needs SignInForm)
- T024 depends on T023 (needs SignUpForm)
- T027 depends on T009 (needs task API)
- T028 depends on T026, T027 (needs TaskCard and useTasks)
- T029 depends on T028 (needs TaskList)
- T032 depends on T030, T031 (needs Header and MobileNav)

**Phase 4 (US2)**:
- T034 is independent (can start anytime after Phase 2)
- T035, T036 depend on T034 (need TaskForm)

**Phase 5 (US3)**:
- T038 can run in parallel with T039-T041
- T039-T041 can run in sequence or together

**Phase 7 (US5)**:
- T042, T044 can run in parallel (different components)
- All other US5 tasks can run in parallel after T042, T044 are done

**Phase 8 (Polish)**:
- T049-T058 can all run in parallel (different concerns)
- T059-T063 should run in sequence (validation tasks)

### MVP Scope (Minimum Viable Product)

**MVP = Phase 1 + Phase 2 + Phase 3 (US1 + US4)**

This delivers:
- ✅ User authentication (signup, signin, signout)
- ✅ Protected routes with middleware
- ✅ Task list viewing with empty state
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Basic loading and error handling
- ✅ Complete authentication flow

**MVP excludes**:
- ❌ Task creation/editing (US2)
- ❌ Task completion/deletion (US3)
- ❌ Advanced loading states (US5)
- ❌ Polish and accessibility enhancements (Phase 8)

**Post-MVP Increments**:
1. **Increment 2**: Add Phase 4 (US2) - Task creation and updates
2. **Increment 3**: Add Phase 5 (US3) - Task completion and deletion
3. **Increment 4**: Add Phase 7 (US5) - Enhanced loading/error states
4. **Increment 5**: Add Phase 8 - Polish and accessibility

---

## Implementation Strategy

### Recommended Approach

1. **Complete Phase 1 + Phase 2 first** (foundational infrastructure)
2. **Implement MVP (Phase 3)** and test thoroughly
3. **Add features incrementally** (Phase 4 → Phase 5/7 → Phase 8)
4. **Test each increment independently** before moving to next

### Specialized Agent Delegation

Per constitutional requirements, delegate work to specialized agents:

- **Frontend Agent** (`nextjs-frontend-builder`): All UI components, pages, hooks (Tasks T001-T063)
- **Auth Agent** (`auth-security-specialist`): Better Auth configuration (Tasks T017-T020, T021-T024)
- **Backend Agent** (`fastapi-backend-dev`): Not needed (backend already implemented)

### Task Execution Tips

1. **Start with T001-T016** (Setup + Foundation) before any user stories
2. **Verify foundation works** before proceeding to user stories
3. **Implement user stories in priority order** (P1 → P2 → P3)
4. **Test each story independently** before moving to next
5. **Mark tasks with [P] as parallel candidates** when assigning work
6. **Use story labels [US#]** to track which story each task belongs to

---

## Summary

**Total Tasks**: 63 tasks
- Phase 1 (Setup): 6 tasks
- Phase 2 (Foundation): 10 tasks
- Phase 3 (US1 + US4): 17 tasks
- Phase 4 (US2): 4 tasks
- Phase 5 (US3): 4 tasks
- Phase 6 (US4): 0 tasks (already in Phase 3)
- Phase 7 (US5): 7 tasks
- Phase 8 (Polish): 15 tasks

**Parallel Opportunities**: 32 tasks marked with [P] can run in parallel

**User Story Breakdown**:
- US1 (Authenticated Task Viewing): 17 tasks ← MVP
- US2 (Task Creation/Updates): 4 tasks
- US3 (Task Completion/Deletion): 4 tasks
- US4 (Authentication-Aware Routing): Integrated with US1
- US5 (Loading/Error States): 7 tasks

**Independent Test Criteria Met**:
- ✅ Each user story has clear goal and acceptance criteria
- ✅ Each user story can be tested independently
- ✅ Each user story delivers standalone value
- ✅ Dependencies between stories are documented

**MVP Ready**: Phases 1-3 deliver a complete, functional MVP (23 tasks)

**Format Validation**:
- ✅ All tasks follow `- [ ] [ID] [P?] [Story?] Description with file path` format
- ✅ All task IDs are sequential (T001-T063)
- ✅ All user story tasks have [US#] labels
- ✅ All parallelizable tasks have [P] markers
- ✅ All tasks include specific file paths
