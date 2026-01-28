---
name: backend-skill
description: Design and implement production-grade backend systems including API routes, request/response handling, database connections, and application architecture. Use this skill whenever the user asks to build, extend, or refactor backend logic or server-side systems.
---

# Backend Engineering Skill

This skill guides the creation of **robust, scalable, and production-ready backend systems**. It focuses on **clarity, correctness, performance, and maintainability**, avoiding fragile demo-style implementations or tightly coupled logic.

Use this skill whenever building APIs, handling server-side logic, or connecting applications to databases.

---

## Scope

This skill applies to:
- REST and RPC-style APIs
- Backend services and microservices
- Full-stack applications (server side)
- Internal tools and data services

It supports modern backend stacks such as Node.js, Express, Fastify, NestJS, Bun, and similar ecosystems.

---

## Backend Thinking

Before writing code, understand the **system intent** and commit to a **clear architectural direction**:

- **Purpose**  
  What problem does this backend solve? Who consumes it (frontend, mobile app, third-party services)?

- **API Shape**  
  RESTful, RPC, or hybrid. Resource-driven vs action-driven endpoints.

- **Data Model**  
  What entities exist? How do they relate? Where is the source of truth?

- **Constraints**  
  Performance requirements, scalability, framework choices, deployment environment.

- **Differentiation**  
  What makes this backend reliable and easy to work with? Clean contracts, predictable errors, and consistent structure.

**CRITICAL:** Backend systems must be intentionally designed. Ad-hoc routes and unstructured logic lead to unmaintainable systems.

---

## Core Capabilities

### 1. Route Generation

- Clean and predictable API routes
- RESTful conventions where appropriate
- Logical grouping of routes by domain
- Clear separation of public vs protected routes
- Versioning strategies when needed

---

### 2. Request & Response Handling

- Input validation and sanitization
- Consistent response formats
- Proper HTTP status codes
- Centralized error handling
- Middleware for cross-cutting concerns (auth, logging, rate limiting)

---

### 3. Business Logic Layer

- Separation of concerns between routes and logic
- Reusable service functions
- Domain-focused modules
- Avoiding “fat controllers”

---

### 4. Database Integration

- Secure and efficient DB connections
- ORM or query-builder best practices
- Transaction handling
- Data validation at the persistence layer
- Connection pooling and lifecycle management

Supported databases may include:
- PostgreSQL, MySQL
- MongoDB
- SQLite
- Other SQL or NoSQL systems

---

### 5. Configuration & Environment

- Environment-based configuration
- Secure handling of secrets
- Clear startup and shutdown behavior
- Dependency injection where appropriate

---

## Backend Architecture Guidelines

Focus on:

- **Structure**  
  Predictable folder layout and naming conventions.

- **Consistency**  
  Uniform request/response shapes and error formats.

- **Scalability**  
  Stateless services, clear boundaries, and future extensibility.

- **Observability**  
  Logging, error reporting, and debuggability built in.

- **Performance**  
  Avoid unnecessary queries, blocking operations, and inefficient data access patterns.

---

## Non-Negotiable Rules

- Never trust client input
- Always validate and sanitize requests
- Never hardcode secrets
- Always handle errors explicitly
- Never let database logic leak into route handlers

---

## Anti-Patterns to Avoid

- Business logic embedded directly in routes
- Inconsistent response formats
- Silent failures or swallowed errors
- Tight coupling between routes and database schemas
- Copy-pasted routes without abstraction

---

## Implementation Standards

Backend implementations must be:

- Production-ready (not pseudocode)
- Framework-aware
- Modular and testable
- Clearly separated into layers
- Easy to reason about and extend

The best backend code is **boring, predictable, and stable**.

---

## Philosophy

Backend systems are the **spine of an application**.

Great backends:
- Enforce clear contracts
- Scale without rewrites
- Fail loudly and safely
- Are easy for other developers to consume

When in doubt, prioritize **clarity, structure, and long-term maintainability** over short-term convenience.
