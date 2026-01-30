# Implementation Plan: Frontend UI & Full-Stack Integration

**Branch**: `003-frontend-integration` | **Date**: 2026-01-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-frontend-integration/spec.md`

## Summary

This feature implements a complete, production-ready Next.js frontend that integrates with the existing FastAPI backend through REST APIs. The frontend provides a responsive web interface for users to manage their tasks securely through authenticated sessions. The primary technical approach is to build upon the partially-implemented Next.js App Router structure, focusing on completing the API integration layer, authentication flow, error handling, loading states, and responsive UI components. All user interactions will be backed by secure JWT-authenticated API calls to ensure complete data isolation and security.

**Current State**: Frontend directory exists with basic structure (auth pages, task pages) but lacks complete API integration, proper error/loading states, and production-ready authentication flow.

**Goal**: Complete end-to-end integration where users can sign in via Better Auth, view their tasks, create/edit/delete tasks, and toggle completion status—all through a responsive, accessible web interface that properly handles errors and loading states.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 16+ (App Router), React 18+
**Primary Dependencies**: Next.js, React, Tailwind CSS, Better Auth client library, native fetch API for HTTP requests
**Storage**: Backend-managed Neon PostgreSQL (no direct database access from frontend)
**Testing**: React Testing Library, Jest, E2E tests with Playwright (if requested)
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge - last 2 versions), mobile-responsive (320px minimum width)
**Project Type**: Web application with frontend + backend separation
**Performance Goals**: Initial page load < 3s on 3G, API requests complete within 2s, UI updates < 100ms, handle 100 concurrent users
**Constraints**: Must use Next.js App Router (not Pages Router), JWT in Authorization header only, no localStorage for tokens in production, WCAG 2.1 Level A accessibility minimum
**Scale/Scope**: Single-user tasks feature, ~10 pages/components, API client abstraction layer, authentication middleware, responsive layouts for mobile/tablet/desktop

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Compliance

✅ **Spec-Driven Development**: This feature follows the mandatory workflow (spec → plan → tasks → implement)

✅ **User Data Isolation**: Frontend will only display data received from backend; all filtering enforced by backend JWT validation

✅ **Authentication-First Architecture**: Authentication state managed via Better Auth; all API requests include JWT token; protected routes enforce authentication

✅ **Monorepo Structure**: Frontend in `frontend/` directory, backend in `backend/` directory; clear separation maintained

### Technology Stack Compliance

✅ **Frontend**: Next.js 16+ with App Router ✓, React Server and Client Components ✓, Tailwind CSS ✓, Mobile-first responsive design ✓

✅ **Backend Integration**: Consumes FastAPI REST APIs ✓, no direct database access ✓

✅ **Authentication**: Better Auth integration ✓, JWT tokens ✓

✅ **Development Tools**: Claude Code for generation ✓, Spec-Kit Plus workflow ✓

### Workflow Compliance

✅ **Specialized Agent Delegation**:
- Frontend work will be delegated to `nextjs-frontend-builder` agent
- Any backend API contract issues will involve `fastapi-backend-dev` agent
- Authentication integration will involve `auth-security-specialist` agent if needed

### Quality Gates

✅ **Specification Gate**: User stories with acceptance criteria defined in spec.md
✅ **Architecture Gate**: Technical decisions documented in this plan.md
✅ **Security Gate**: User isolation verified (backend enforced), authentication enforced (JWT required)
✅ **Testing Gate**: Acceptance scenarios defined in spec.md (tests implementation optional)
✅ **Documentation Gate**: PHR will be created after plan completion

### Constitution Violations

**None**: This feature fully complies with all constitutional requirements.

## Project Structure

### Documentation (this feature)

```text
specs/003-frontend-integration/
├── plan.md              # This file (/sp.plan command output)
├── spec.md              # Feature specification (already created)
├── research.md          # Phase 0 output (to be created)
├── data-model.md        # Phase 1 output (to be created)
├── quickstart.md        # Phase 1 output (to be created)
├── contracts/           # Phase 1 output (to be created)
│   ├── api-endpoints.md # REST API contract documentation
│   └── types.ts         # TypeScript interfaces for API contracts
├── checklists/          # Quality validation
│   └── requirements.md  # Spec quality checklist (already created)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
# Web application structure (frontend + backend)
backend/
├── app/
│   ├── api/v1/
│   │   └── tasks.py         # Existing: Task CRUD endpoints
│   ├── auth/                # Existing: Better Auth integration
│   ├── models/
│   │   └── task.py          # Existing: Task model
│   ├── schemas/             # Existing: Pydantic schemas
│   └── database.py          # Existing: Database connection
└── tests/                   # Backend tests

frontend/
├── app/
│   ├── (auth)/              # Auth route group
│   │   ├── signin/          # Existing: Sign-in page (needs completion)
│   │   │   └── page.tsx
│   │   └── signup/          # Existing: Sign-up page (needs completion)
│   │       └── page.tsx
│   ├── (dashboard)/         # Protected route group
│   │   ├── layout.tsx       # Existing: Dashboard layout
│   │   └── tasks/           # Task management pages
│   │       ├── page.tsx     # Existing: Task list (needs enhancement)
│   │       ├── new/         # Existing: Create task page
│   │       │   └── page.tsx
│   │       └── [id]/edit/   # Existing: Edit task page
│   │           └── page.tsx
│   ├── api/auth/[...all]/   # Existing: Better Auth API route
│   │   └── route.ts
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   ├── tasks/               # Task-related components
│   │   ├── TaskList.tsx     # Existing: Task list component (needs enhancement)
│   │   ├── TaskCard.tsx     # To create: Individual task display
│   │   ├── TaskForm.tsx     # To create: Reusable task form
│   │   └── EmptyState.tsx   # To create: Empty state component
│   ├── ui/                  # Shared UI components
│   │   ├── Button.tsx       # To create: Reusable button
│   │   ├── Input.tsx        # To create: Reusable input
│   │   ├── LoadingSpinner.tsx # To create: Loading indicator
│   │   ├── ErrorMessage.tsx # To create: Error display
│   │   └── ConfirmDialog.tsx # To create: Confirmation modal
│   └── layout/              # Layout components
│       ├── Header.tsx       # To create: App header with navigation
│       └── MobileNav.tsx    # To create: Mobile navigation
├── lib/
│   ├── api/                 # API client layer
│   │   ├── client.ts        # To create: Base API client with auth
│   │   ├── tasks.ts         # Existing: Task API functions (needs enhancement)
│   │   └── auth.ts          # To create: Auth API functions
│   ├── auth/                # Authentication utilities
│   │   ├── session.ts       # To create: Session management
│   │   └── middleware.ts    # To create: Auth middleware helpers
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts       # To create: Authentication state hook
│   │   ├── useTasks.ts      # To create: Task management hook
│   │   └── useApi.ts        # To create: Generic API hook
│   └── utils/               # Utility functions
│       ├── validation.ts    # To create: Form validation
│       └── formatting.ts    # To create: Date/text formatting
├── middleware.ts            # Existing: Next.js middleware for auth
└── tests/                   # Frontend tests
    ├── components/          # Component tests
    ├── integration/         # Integration tests
    └── e2e/                 # End-to-end tests
```

**Structure Decision**: Using the existing web application structure with frontend/backend separation. The frontend follows Next.js 16+ App Router conventions with route groups for organizing authenticated vs public pages. Components are organized by feature (tasks), shared UI elements (ui), and layout components. The lib directory contains the API client layer that abstracts backend communication, authentication utilities, custom hooks for state management, and utility functions. This structure supports clear separation of concerns and makes it easy to locate and maintain code.

## Complexity Tracking

> **No violations detected - this section is empty**

All constitutional requirements are satisfied without exceptions.

## Phase 0: Research & Discovery

### Research Tasks

1. **Better Auth JWT Integration Pattern**
   - **Question**: How to properly integrate Better Auth with Next.js App Router for JWT-based authentication?
   - **Research Focus**: Server Components vs Client Components for auth state, JWT token storage patterns, session management, refresh token handling
   - **Deliverable**: Recommended pattern for auth integration with code examples

2. **Next.js App Router Data Fetching Patterns**
   - **Question**: Best practices for data fetching with Server Components vs Client Components when authentication is required?
   - **Research Focus**: Server-side data fetching with cookies, client-side data fetching with JWT, loading states, error boundaries
   - **Deliverable**: Data fetching strategy for authenticated routes

3. **API Client Architecture**
   - **Question**: How to structure a type-safe API client that handles authentication, retries, and error handling?
   - **Research Focus**: Fetch API vs Axios, TypeScript interfaces for type safety, retry logic, error handling patterns, request/response interceptors
   - **Deliverable**: API client architecture design

4. **Form State Management**
   - **Question**: Best approach for form state management in Next.js App Router without external libraries?
   - **Research Focus**: React useState/useReducer patterns, form validation, optimistic updates, error handling
   - **Deliverable**: Form management pattern for task creation/editing

5. **Loading and Error States**
   - **Question**: How to implement consistent loading and error states across the application?
   - **Research Focus**: Suspense boundaries, error boundaries, loading skeletons, error recovery patterns
   - **Deliverable**: Loading/error state implementation strategy

6. **Responsive Design Implementation**
   - **Question**: Tailwind CSS patterns for mobile-first responsive design in task management UI?
   - **Research Focus**: Breakpoint strategies, mobile navigation patterns, touch-friendly controls, responsive tables/lists
   - **Deliverable**: Responsive design guide with Tailwind classes

7. **Protected Route Implementation**
   - **Question**: How to implement route protection in Next.js App Router with Better Auth?
   - **Research Focus**: Middleware-based protection, redirect patterns, session validation, route groups
   - **Deliverable**: Protected route implementation pattern

8. **Accessibility Best Practices**
   - **Question**: WCAG 2.1 Level A compliance for task management interface?
   - **Research Focus**: Semantic HTML, ARIA attributes, keyboard navigation, screen reader support, focus management
   - **Deliverable**: Accessibility checklist for components

### Expected Outputs

All research findings will be documented in `research.md` with:
- **Decision**: The chosen approach for each research area
- **Rationale**: Why this approach was selected
- **Alternatives Considered**: What other options were evaluated and why they were rejected
- **Implementation Notes**: Key considerations and gotchas
- **Code Examples**: Sample implementations where helpful

## Phase 1: Design & Contracts

### Data Model

**Frontend Models** (TypeScript interfaces - not database models):

1. **Task Interface** (frontend/lib/types/task.ts)
   ```typescript
   interface Task {
     id: string;
     user_id: string;
     title: string;
     description: string | null;
     completed: boolean;
     created_at: string; // ISO 8601 timestamp
     updated_at: string; // ISO 8601 timestamp
   }
   ```

2. **User Interface** (frontend/lib/types/user.ts)
   ```typescript
   interface User {
     user_id: string;
     email: string;
     name?: string;
   }
   ```

3. **API Response Wrapper** (frontend/lib/types/api.ts)
   ```typescript
   interface ApiResponse<T> {
     success: boolean;
     data?: T;
     error?: {
       message: string;
       code: string;
     };
   }
   ```

4. **Form State** (frontend/lib/types/forms.ts)
   ```typescript
   interface FormState<T> {
     values: T;
     errors: Partial<Record<keyof T, string>>;
     isSubmitting: boolean;
     isDirty: boolean;
   }
   ```

**Output**: Complete type definitions in `data-model.md`

### API Contracts

**Backend API Endpoints** (already implemented, documented for frontend consumption):

1. **Authentication Endpoints**
   - `POST /api/auth/signin` - Sign in with email/password, returns JWT
   - `POST /api/auth/signup` - Create new user account
   - `POST /api/auth/signout` - Invalidate session
   - `GET /api/auth/session` - Get current user session

2. **Task Endpoints** (all require JWT authentication)
   - `GET /api/v1/tasks` - Get all tasks for authenticated user
   - `POST /api/v1/tasks` - Create new task
   - `GET /api/v1/tasks/{id}` - Get specific task (verify ownership)
   - `PUT /api/v1/tasks/{id}` - Update task (verify ownership)
   - `DELETE /api/v1/tasks/{id}` - Delete task (verify ownership)
   - `PATCH /api/v1/tasks/{id}/complete` - Toggle task completion

**Request/Response Schemas**:

```typescript
// Task Creation
POST /api/v1/tasks
Request: { title: string; description?: string }
Response: { id: string; user_id: string; title: string; description: string | null; completed: boolean; created_at: string; updated_at: string }

// Task Update
PUT /api/v1/tasks/{id}
Request: { title?: string; description?: string; completed?: boolean }
Response: { id: string; user_id: string; title: string; description: string | null; completed: boolean; created_at: string; updated_at: string }

// Task List
GET /api/v1/tasks
Response: Array<Task>

// Authentication
POST /api/auth/signin
Request: { email: string; password: string }
Response: { token: string; user: User }
```

**Output**: Complete API contract documentation in `contracts/api-endpoints.md` and TypeScript interfaces in `contracts/types.ts`

### Component Architecture

**Page Components** (Server Components by default):
- `/app/(auth)/signin/page.tsx` - Sign-in page
- `/app/(auth)/signup/page.tsx` - Sign-up page
- `/app/(dashboard)/tasks/page.tsx` - Task list page (authenticated)
- `/app/(dashboard)/tasks/new/page.tsx` - Create task page
- `/app/(dashboard)/tasks/[id]/edit/page.tsx` - Edit task page

**UI Components** (Client Components for interactivity):
- `TaskList` - Displays list of tasks with loading/empty/error states
- `TaskCard` - Individual task display with completion toggle and actions
- `TaskForm` - Reusable form for creating/editing tasks
- `EmptyState` - Empty state when no tasks exist
- `LoadingSpinner` - Loading indicator
- `ErrorMessage` - Error display with retry option
- `ConfirmDialog` - Confirmation modal for deletions
- `Button`, `Input` - Reusable form controls
- `Header`, `MobileNav` - Layout components

**Custom Hooks**:
- `useAuth()` - Authentication state and actions
- `useTasks()` - Task list state and CRUD operations
- `useApi<T>()` - Generic API request hook with loading/error states
- `useForm<T>()` - Form state management and validation

**API Client Layer**:
- `lib/api/client.ts` - Base HTTP client with auth headers and error handling
- `lib/api/tasks.ts` - Task-specific API functions
- `lib/api/auth.ts` - Authentication API functions

### Agent Context Update

After completing Phase 1 design, run:
```bash
.specify/scripts/bash/update-agent-context.sh claude
```

This will update the agent context file with:
- Next.js 16+ App Router patterns
- Better Auth JWT integration
- TypeScript interface definitions
- API client architecture
- Component structure

### Quickstart Documentation

Create `quickstart.md` with:
1. **Prerequisites**: Node.js 18+, Backend API running, environment variables configured
2. **Setup Instructions**: Install dependencies, configure .env.local, run development server
3. **Development Workflow**: Creating new pages, adding components, API integration patterns
4. **Testing Strategy**: Component tests, integration tests, E2E test examples
5. **Common Patterns**: Authentication flows, data fetching, form handling, error states
6. **Troubleshooting**: Common issues and solutions

## Phase 2: Task Breakdown

**This phase is completed by the `/sp.tasks` command, NOT by `/sp.plan`.**

The `/sp.tasks` command will generate `tasks.md` with:
- Implementation tasks organized by priority (P1, P2, P3 from user stories)
- Each task with acceptance criteria, dependencies, and test cases
- Tasks ordered by dependency chain
- Clear separation between Server Components and Client Components
- Tasks for API client layer, authentication integration, UI components, and responsive layouts

**Example task structure that will be generated**:
```markdown
### Task 1.1: Implement Base API Client (P1)
**Priority**: P1 (blocks all API-dependent tasks)
**Type**: Infrastructure
**Files**: lib/api/client.ts

**Description**: Create base HTTP client that handles JWT authentication, request/response interceptors, error handling, and retry logic.

**Acceptance Criteria**:
- Client automatically adds Authorization header with JWT token
- Client handles 401 responses by redirecting to sign-in
- Client retries failed requests for network errors
- Client provides type-safe interfaces for all endpoints

**Dependencies**: None (foundational)
**Blocked By**: None
**Blocks**: All API integration tasks
```

## User Input Considerations

The user requested specific focus on:

1. **Empty State**: "Empty state shown when no tasks exist"
   - ✅ Addressed in User Story 1, Acceptance Scenario 3
   - ✅ Component planned: `EmptyState.tsx`
   - ✅ Will be implemented in task breakdown with clear acceptance criteria

2. **Error State**: "Error state shown on API failure"
   - ✅ Addressed in User Story 5 (Loading and Error States)
   - ✅ Component planned: `ErrorMessage.tsx`
   - ✅ Error handling strategy defined in Phase 0 research
   - ✅ Will be implemented across all API-calling components

3. **Spec Validation - UI maps to backend capabilities**:
   - ✅ All functional requirements (FR-032 to FR-039) define API integration contracts
   - ✅ API contracts section in Phase 1 documents all backend endpoints
   - ✅ No frontend feature attempts to bypass backend (all CRUD through API)
   - ✅ Data model section shows frontend types mirror backend responses

4. **Spec Validation - No frontend bypasses backend security**:
   - ✅ FR-033: All API requests include JWT token in Authorization header
   - ✅ FR-034: JWT stored securely (not localStorage)
   - ✅ FR-035: 401 responses redirect to sign-in (no local auth bypass)
   - ✅ Constitutional requirement: User Data Isolation enforced by backend
   - ✅ Frontend only displays data received from authenticated API calls

**Validation Confirmed**: All user input requirements are addressed in the plan and specification.

## Next Steps

1. ✅ **Phase 0 Complete**: Create `research.md` with findings from research tasks
2. ✅ **Phase 1 Complete**: Create `data-model.md`, `contracts/` directory with API documentation, and `quickstart.md`
3. ✅ **Phase 1 Complete**: Run agent context update script
4. ⏸️ **Phase 2 Pending**: Run `/sp.tasks` command to generate implementation tasks in `tasks.md`
5. ⏸️ **Implementation Pending**: Run `/sp.implement` to execute tasks via Claude Code

**Branch**: `003-frontend-integration`
**Status**: Plan complete, ready for research phase
**Next Command**: Continue to Phase 0 (research) in this same `/sp.plan` execution
