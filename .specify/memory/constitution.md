<!--
SYNC IMPACT REPORT
==================
Version Change: [TEMPLATE] → 1.0.0
Modified Principles: Initial constitution creation
Added Sections:
  - Core Principles (4 principles defined)
  - Technology Stack Requirements
  - Development Workflow
  - Governance
Removed Sections: None (initial creation)
Templates Requiring Updates:
  ✅ plan-template.md - Reviewed, aligns with constitution requirements
  ✅ spec-template.md - Reviewed, aligns with user story requirements
  ✅ tasks-template.md - Reviewed, aligns with user story structure
Follow-up TODOs: None
-->

# Multi-User Todo Web Application Constitution

## Core Principles

### I. Spec-Driven Development (NON-NEGOTIABLE)

All development MUST follow the Spec-Kit Plus workflow without manual coding:
- Every feature starts with a specification document
- Implementation plans must be generated before coding
- Tasks must be broken down and tracked
- All code must be generated via Claude Code
- No manual code writing is permitted

**Rationale**: Ensures consistent, documented, and traceable development process. Prevents ad-hoc changes and maintains architectural integrity.

### II. User Data Isolation (NON-NEGOTIABLE)

Multi-user data MUST be strictly isolated per user:
- Backend must enforce user isolation at the database query level
- All queries MUST filter by authenticated user ID from JWT token
- User ID must NEVER be trusted from request body or query parameters
- Resource ownership must be verified before update/delete operations
- Frontend must only display user-specific data received from backend

**Rationale**: Core security requirement for multi-user applications. Data leakage between users is unacceptable and violates user trust.

### III. Authentication-First Architecture

Authentication must be implemented before protected features:
- Better Auth with JWT tokens is the authentication standard
- All API routes (except auth endpoints) must require authentication
- JWT verification middleware must be applied to protected routes
- Frontend must handle authentication state and token management
- Session management must follow Better Auth patterns

**Rationale**: Security cannot be retrofitted. Authentication must be foundational infrastructure that all features depend on.

### IV. Monorepo Structure

Project MUST maintain a clear monorepo structure with frontend and backend separation:
- Frontend: Next.js 16+ with App Router in `frontend/` directory
- Backend: Python FastAPI in `backend/` directory
- Shared configuration at repository root
- Clear separation of concerns between presentation and business logic
- Database access only through backend APIs

**Rationale**: Maintains clear architectural boundaries, enables independent scaling, and enforces proper separation of concerns.

## Technology Stack Requirements

The following technology stack is MANDATORY and cannot be substituted:

**Frontend**:
- Next.js 16+ with App Router
- React Server and Client Components
- Tailwind CSS for styling
- Mobile-first responsive design

**Backend**:
- Python FastAPI for REST APIs
- SQLModel for ORM and type-safe queries
- Pydantic for request/response validation
- JWT middleware for authentication

**Database**:
- Neon Serverless PostgreSQL
- Proper foreign key relationships
- Migration scripts for schema changes
- Connection pooling for serverless

**Authentication**:
- Better Auth library
- JWT token-based authentication
- Secure session management

**Development Tools**:
- Claude Code for all code generation
- Spec-Kit Plus for workflow management
- Git for version control

**Rationale**: Technology choices have been made to support rapid development, type safety, serverless deployment, and modern best practices. Changing these would require architectural redesign.

## Development Workflow

### Spec-Kit Plus Workflow (MANDATORY)

All development MUST follow this sequence:

1. **Specification** (`/sp.specify`): Write feature requirements with user stories
2. **Planning** (`/sp.plan`): Generate architectural design and technical decisions
3. **Task Generation** (`/sp.tasks`): Break plan into testable, ordered tasks
4. **Implementation** (`/sp.implement`): Execute tasks via Claude Code
5. **History Recording**: PHR (Prompt History Record) for every user interaction
6. **ADR Documentation**: Architectural Decision Records for significant choices

**Skip Conditions**: None - this workflow applies to ALL features without exception.

**Rationale**: Ensures consistent quality, traceability, and prevents undocumented changes.

### Specialized Agent Delegation (MANDATORY)

Work MUST be delegated to specialized Claude Code agents:

- **Auth Agent** (`auth-security-specialist`): All authentication and security work
- **Frontend Agent** (`nextjs-frontend-builder`): All UI and Next.js development
- **Backend Agent** (`fastapi-backend-dev`): All API and FastAPI development
- **Database Agent** (`neon-db-manager`): All schema design and database operations

**Never implement these domains directly**. Always use the Task tool to delegate to the appropriate specialized agent.

**Rationale**: Specialized agents have domain-specific expertise and ensure best practices are followed.

### Quality Gates

Every feature must pass these gates:

1. **Specification Gate**: User stories with acceptance criteria defined
2. **Architecture Gate**: Technical decisions documented in plan.md
3. **Security Gate**: User isolation verified, authentication enforced
4. **Testing Gate**: Acceptance scenarios validated (when tests requested)
5. **Documentation Gate**: PHR created for the work session

**Rationale**: Quality cannot be inspected in; it must be built into the process.

## Governance

### Amendment Process

This constitution can be amended through:

1. Proposal of constitution change with rationale
2. Review of impact on existing artifacts and templates
3. Update of constitution via `/sp.constitution` command
4. Version bump according to semantic versioning
5. Sync impact report documenting changes
6. Propagation of changes to dependent templates

### Versioning Policy

Constitution versions follow semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Backward incompatible governance/principle removals or redefinitions
- **MINOR**: New principle/section added or materially expanded guidance
- **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements

### Compliance

All development work must verify compliance with this constitution:

- Code reviews must check for constitution adherence
- Violations must be justified in the Complexity Tracking section of plan.md
- Simpler alternatives must be documented when introducing complexity
- Security principles (User Data Isolation, Authentication-First) are NON-NEGOTIABLE and cannot be violated under any circumstances

### Enforcement

The main Claude Code agent acts as the constitution enforcer:

- Refuses to implement work that violates core principles
- Delegates to specialized agents per governance rules
- Creates PHRs for all user interactions
- Suggests ADRs for architecturally significant decisions
- Validates quality gates before proceeding

**Version**: 1.0.0 | **Ratified**: 2026-01-28 | **Last Amended**: 2026-01-28
