---
id: 0001
title: Constitution Phase II Ratification
stage: constitution
date: 2026-01-28
surface: agent
model: claude-sonnet-4-5
feature: none
branch: master
user: subhan
command: /sp.constitution
labels: ["constitution", "governance", "phase-2", "principles"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - null
---

## Prompt

```text
# Project Constitution – Phase II

## Objective
Build a full-stack, multi-user Todo web application using Spec-Kit Plus and Claude Code.

## Constraints
- No manual coding; all code generated via Claude Code
- Follow Spec-Kit workflow strictly
- Use monorepo structure
- Use Better Auth with JWT
- Use Neon PostgreSQL with SQLModel

## Quality Rules
- Each feature must have a spec before implementation
- Backend must enforce user isolation
- Frontend must call backend via a single API client
- Authentication required for all API routes
```

## Response snapshot

Constitution v1.0.0 created with 4 core principles:

1. **Spec-Driven Development (NON-NEGOTIABLE)**: All code via Claude Code, no manual coding
2. **User Data Isolation (NON-NEGOTIABLE)**: Multi-user data strictly isolated by user ID from JWT
3. **Authentication-First Architecture**: Better Auth with JWT before protected features
4. **Monorepo Structure**: Frontend (Next.js) and Backend (FastAPI) separation

Additional sections defined:
- Technology Stack Requirements (mandatory stack)
- Development Workflow (Spec-Kit Plus workflow + specialized agent delegation)
- Governance (amendment process, versioning, compliance, enforcement)

Templates reviewed for consistency:
- ✅ plan-template.md aligns with constitution requirements
- ✅ spec-template.md aligns with user story requirements
- ✅ tasks-template.md aligns with user story structure

## Outcome

- ✅ Impact: Constitution v1.0.0 ratified with core principles for multi-user Todo app
- 🧪 Tests: N/A (governance document)
- 📁 Files: .specify/memory/constitution.md created
- 🔁 Next prompts: /sp.specify to create first feature spec following constitution principles
- 🧠 Reflection: Constitution establishes non-negotiable security requirements (user isolation, authentication-first) and mandates specialized agent delegation for all domain work

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): PASS - All placeholders filled, no template tokens remaining, semantic versioning applied
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Validate constitution enforcement during first feature specification
