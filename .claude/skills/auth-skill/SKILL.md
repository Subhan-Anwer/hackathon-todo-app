---
name: auth-skill
description: Design and implement secure, production-ready authentication systems including signup, signin, password hashing, JWT-based auth, and Better Auth integrations. Use this skill whenever the user asks to build, audit, or improve authentication and authorization flows.   
---

# Auth Skill

This skill guides the creation of **secure, scalable, and production-grade authentication systems**. It prioritizes **correctness, security, and maintainability** over shortcuts, demos, or fragile implementations.

Use this skill whenever authentication, authorization, or identity management is involved.

---

## Scope

This skill applies to:
- Backend-only systems
- Full-stack applications
- APIs and microservices
- Web and mobile authentication flows

It supports modern frameworks and runtimes such as Node.js, Next.js, Express, Fastify, NestJS, and similar environments.

---

## Auth Thinking

Before writing code, establish a **clear security model**:

- **Threat Model**  
  Identify what is being protected, who the users are, and what attackers might attempt (credential stuffing, token theft, replay attacks).

- **Auth Strategy**  
  Choose between stateless JWT auth, session-based auth, hybrid approaches, or third-party identity solutions.

- **Trust Boundaries**  
  The server is the source of truth. The client is never trusted.

- **Auth Lifecycle**  
  Signup → Verification → Signin → Token issuance → Token refresh → Logout → Password reset.

- **Security Posture**  
  Secure-by-default decisions with minimal attack surface.

**CRITICAL:** Avoid “works locally” shortcuts. Auth code must be production-safe from day one.

---

## Core Capabilities

### 1. Signup & Signin

- Secure user registration
- Input validation and normalization
- Email or OTP verification
- Rate limiting and brute-force protection
- Generic error messages to prevent user enumeration

---

### 2. Password Hashing & Storage

- Use industry-standard hashing (`bcrypt`, `argon2`, or equivalent)
- Proper salting and configurable cost factors
- Never store or log plaintext passwords
- Secure password reset flows using expiring tokens

---

### 3. JWT & Token-Based Authentication

- Access tokens and refresh tokens
- Token expiration and rotation
- Secure signing algorithms (HS256 / RS256)
- HTTP-only cookies vs Authorization headers
- Middleware for token validation and role checks

---

### 4. Authorization

- Role-Based Access Control (RBAC)
- Permission-based authorization
- Route-level and resource-level guards
- Principle of least privilege

---

### 5. Better Auth Integration

- Correct Better Auth configuration
- Database adapters and framework bindings
- Provider configuration and callbacks
- Session handling and token management
- Secure defaults with controlled customization

---

## Security Rules (Non-Negotiable)

- Never store plaintext passwords
- Never roll custom cryptography
- Never expose secrets to the client
- Never trust JWT payloads without verification
- Never leak auth state via error messages

Additional best practices:
- Use environment variables for secrets
- Rotate secrets and keys
- Log auth events without sensitive data
- Enforce HTTPS everywhere
- Protect against CSRF where applicable

---

## Implementation Standards

Auth implementations must be:

- Production-ready (no pseudocode)
- Framework-aware
- Secure by default
- Clearly structured
- Separated into logical layers (routes, services, middleware)

Auth code should be **boring, predictable, and correct**.

---

## Anti-Patterns to Avoid

- Weak or outdated password hashing
- Long-lived tokens without rotation
- Storing JWTs in localStorage without justification
- Mixing auth logic directly into UI components
- Copy-pasted auth code without understanding

---

## Philosophy

Authentication is **infrastructure**, not a feature.

Great auth systems:
- Scale safely
- Are easy to audit
- Fail securely
- Resist common attack vectors

When in doubt, choose **clarity, correctness, and security** over cleverness.
