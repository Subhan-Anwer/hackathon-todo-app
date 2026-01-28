---
name: database-design
description: Design and implement robust, production-grade database schemas including table creation, migrations, constraints, and long-term schema evolution. Use this skill whenever the user asks to design, modify, or reason about databases.
---

# Database Design Skill

This skill guides the creation of **reliable, scalable, and production-grade database schemas**. It prioritizes **data integrity, performance, and long-term maintainability** over quick hacks or fragile designs.

Use this skill whenever tables, migrations, schemas, or data models are involved.

---

## Scope

This skill applies to:
- Relational databases (PostgreSQL, MySQL, SQLite)
- Schema-first application design
- Backend and full-stack systems
- Greenfield projects and legacy database evolution

It supports SQL-first workflows as well as ORMs and migration tools.

---

## Data Modeling Thinking

Before writing SQL or migrations, deeply understand the **data and its lifecycle**:

- **Purpose**  
  What real-world concepts are being modeled? What questions must the data answer?

- **Access Patterns**  
  How is the data read and written? What needs to be fast? What can be slow?

- **Consistency & Integrity**  
  What invariants must always hold true? What must never be allowed?

- **Change Over Time**  
  How will this schema evolve? What breaks when requirements change?

- **Constraints**  
  Database engine, scale expectations, regulatory or auditing requirements.

**CRITICAL:** A schema is harder to change than application code. Design with tomorrow in mind.

---

## Core Capabilities

### 1. Table Design

- Clear, intentional table structures
- Meaningful column naming
- Appropriate data types
- Primary keys and foreign keys
- Defaults and NOT NULL constraints

Tables should represent **facts**, not implementation shortcuts.

---

### 2. Relationships & Normalization

- One-to-one, one-to-many, and many-to-many relationships
- Proper normalization to avoid duplication
- Intentional denormalization when justified by performance
- Referential integrity enforced at the database level

Never rely on application code alone to enforce relationships.

---

### 3. Migrations

- Forward-only, reversible migrations where possible
- Schema changes that are safe for production data
- Zero-downtime migration strategies
- Clear separation between schema and data migrations
- Versioned, auditable migration history

Migrations are **contracts with the past**—treat them carefully.

---

### 4. Indexing & Performance

- Indexes aligned with query patterns
- Avoiding premature or excessive indexing
- Composite and partial indexes when appropriate
- Understanding tradeoffs between write and read performance

Indexes exist to serve queries, not assumptions.

---

### 5. Constraints & Safety

- Unique constraints
- Foreign key constraints
- Check constraints for business rules
- Cascading rules applied intentionally

Data integrity belongs in the database, not only in application logic.

---

## Database Safety Rules (Non-Negotiable)

- Never rely solely on the app layer for data integrity
- Never delete production data without backups
- Never run destructive migrations blindly
- Never store unrelated data in a single column
- Never guess data types—be explicit

Additional best practices:
- Use transactions for multi-step changes
- Test migrations on realistic data volumes
- Monitor slow queries
- Keep schemas readable and documented

---

## Implementation Standards

Database work must be:

- Production-safe
- Explicit and readable
- Forward-compatible
- Easy to reason about
- Designed for failure recovery

Schemas should be **boring, predictable, and trustworthy**.

---

## Anti-Patterns to Avoid

- Overloaded “god tables”
- Missing foreign keys
- Storing structured data as unvalidated JSON
- Irreversible or destructive migrations
- Renaming columns without migration history
- Encoding business logic implicitly in column names

---

## Philosophy

Databases are **long-term memory**, not short-term state.

Great database design:
- Makes bugs harder to create
- Makes data easier to trust
- Survives changing requirements
- Scales without drama

When in doubt, choose **clarity, correctness, and integrity** over cleverness.
