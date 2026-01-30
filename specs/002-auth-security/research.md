# Authentication & Security Research Findings

**Feature**: 002-auth-security
**Date**: 2026-01-29
**Research Phase**: Phase 0 - Unknowns Resolution

This document contains research findings for implementing JWT-based authentication and authorization in the Hackathon Todo App.

---

## R1: Better Auth Integration with Next.js 16 App Router

### Decision

Use Better Auth with Next.js 16 App Router configured for JWT token issuance, stored in httpOnly cookies, with automatic token attachment to API requests via custom fetch wrapper.

### Rationale

Better Auth provides a modern, type-safe authentication solution designed for Next.js App Router with built-in JWT support. HttpOnly cookies prevent XSS attacks while maintaining seamless authentication state across client and server components.

### Alternatives Considered

- **Option A: localStorage for JWT storage** - Rejected because:
  - Vulnerable to XSS attacks (JavaScript can access localStorage)
  - Tokens can be stolen by malicious scripts
  - Not accessible from Server Components

- **Option B: NextAuth.js** - Rejected because:
  - Better Auth is more modern and designed specifically for App Router
  - Better Auth has cleaner TypeScript support
  - Better Auth provides simpler JWT configuration

- **Selected Option C: Better Auth with httpOnly cookies** - Chosen because:
  - HttpOnly cookies immune to XSS (JavaScript cannot access)
  - Cookies automatically sent with requests (no manual attachment needed)
  - Works seamlessly with Server and Client Components
  - Better Auth handles cookie management automatically

### Implementation Guidance

**Step 1: Install Better Auth**
```bash
cd frontend
npm install better-auth
```

**Step 2: Configure Better Auth in `frontend/lib/auth.ts`**
```typescript
import { betterAuth } from "better-auth"

export const auth = betterAuth({
  database: {
    provider: "postgres",
    url: process.env.DATABASE_URL,
  },
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24, // 24 hours
    updateAge: 60 * 60 * 24, // 24 hours
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: "24h",
  },
  trustedOrigins: [process.env.NEXT_PUBLIC_API_URL],
})
```

**Step 3: Create API route handler in `frontend/app/api/auth/[...all]/route.ts`**
```typescript
import { auth } from "@/lib/auth"

export const { GET, POST } = auth.handler
```

**Step 4: Create auth client for frontend in `frontend/lib/auth-client.ts`**
```typescript
import { createAuthClient } from "better-auth/client"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
})
```

**Step 5: Extract JWT for API calls**
```typescript
// In frontend/lib/api-client.ts
import { authClient } from "./auth-client"

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const session = await authClient.getSession()

  const headers = {
    ...options.headers,
    "Content-Type": "application/json",
  }

  if (session?.data?.accessToken) {
    headers["Authorization"] = `Bearer ${session.data.accessToken}`
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
    { ...options, headers }
  )

  return response
}
```

**Step 6: Create authentication context provider**
```typescript
// In frontend/lib/auth-context.tsx
"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { authClient } from "./auth-client"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authClient.getSession().then((data) => {
      setSession(data?.data)
      setLoading(false)
    })
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

### References

- Better Auth Documentation: https://www.better-auth.com/docs
- Next.js 16 App Router: https://nextjs.org/docs/app
- JWT Best Practices: OWASP JWT Cheat Sheet

---

## R2: FastAPI JWT Verification Best Practices

### Decision

Use PyJWT library with FastAPI dependency injection pattern, implementing `get_current_user` as a reusable dependency that verifies JWT and extracts user identity.

### Rationale

PyJWT is the industry-standard JWT library for Python, and FastAPI's dependency injection system provides clean separation of authentication logic while making the authenticated user available to all endpoints.

### Alternatives Considered

- **Option A: python-jose library** - Rejected because:
  - Heavier dependency with more features than needed
  - PyJWT is more widely used and maintained
  - PyJWT has simpler API for our use case

- **Option B: Manual JWT verification in each endpoint** - Rejected because:
  - Code duplication across endpoints
  - Error-prone (easy to forget verification)
  - Harder to test and maintain
  - Violates DRY principle

- **Option C: Global middleware for all routes** - Rejected because:
  - Cannot exclude health check and auth endpoints
  - Less flexible than dependency injection
  - Harder to customize per-endpoint behavior

- **Selected Option D: PyJWT + FastAPI dependencies** - Chosen because:
  - Idiomatic FastAPI pattern
  - Centralized verification logic
  - Easy to add to protected endpoints
  - Testable and maintainable
  - Dependency injection automatically handles errors

### Implementation Guidance

**Step 1: Install PyJWT**
```bash
cd backend
pip install pyjwt
```

**Step 2: Create JWT handler in `backend/app/auth/jwt_handler.py`**
```python
import jwt
from datetime import datetime
from typing import Optional
from fastapi import HTTPException, status

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"

def verify_jwt_token(token: str) -> dict:
    """
    Verify JWT token and return decoded payload.
    Raises HTTPException if token is invalid or expired.
    """
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )

        # Check expiration
        exp = payload.get("exp")
        if exp and datetime.fromtimestamp(exp) < datetime.now():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return payload

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
```

**Step 3: Create dependency in `backend/app/auth/dependencies.py`**
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .jwt_handler import verify_jwt_token
from ..models.user import User

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    FastAPI dependency that verifies JWT and returns user data.
    Use this in endpoint parameters to protect routes.
    """
    token = credentials.credentials
    payload = verify_jwt_token(token)

    # Extract user_id from JWT claims
    user_id = payload.get("user_id") or payload.get("sub")
    email = payload.get("email")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    return {
        "user_id": user_id,
        "email": email,
    }
```

**Step 4: Use dependency in protected endpoints**
```python
from fastapi import APIRouter, Depends
from ..auth.dependencies import get_current_user

router = APIRouter()

@router.get("/tasks")
async def get_tasks(current_user: dict = Depends(get_current_user)):
    """
    Get all tasks for the authenticated user.
    current_user is automatically populated by the dependency.
    """
    user_id = current_user["user_id"]
    # Filter tasks by user_id...
    return {"tasks": tasks}
```

**Step 5: Error handling configuration**
```python
# Generic error responses prevent information leakage
# 401: Missing or invalid token (authentication failed)
# 403: Valid token but insufficient permissions (authorization failed)
```

**Performance Optimization**:
- JWT verification is CPU-bound but fast (<5ms per request)
- No database lookup required (stateless verification)
- Consider caching decoded tokens for repeated requests (optional)

### References

- PyJWT Documentation: https://pyjwt.readthedocs.io/
- FastAPI Security: https://fastapi.tiangolo.com/tutorial/security/
- FastAPI Dependencies: https://fastapi.tiangolo.com/tutorial/dependencies/

---

## R3: User Table Management with Better Auth

### Decision

Better Auth automatically creates and manages the `user` table in the connected PostgreSQL database. The application should reference the Better Auth user table via foreign key in the `tasks` table.

### Rationale

Better Auth handles all user table schema management, migrations, and password hashing. The application should treat the user table as read-only and only reference it via foreign keys.

### Alternatives Considered

- **Option A: Manually create user table** - Rejected because:
  - Better Auth expects to manage its own schema
  - Risk of schema conflicts with Better Auth
  - Duplicates functionality Better Auth provides
  - Loses automatic migrations

- **Option B: Duplicate user data in separate table** - Rejected because:
  - Data redundancy and synchronization issues
  - Violates single source of truth principle
  - Increases complexity unnecessarily

- **Selected Option C: Use Better Auth user table** - Chosen because:
  - Better Auth handles schema creation and migrations
  - Automatic password hashing and security best practices
  - Single source of truth for user data
  - Foreign key relationships maintain referential integrity

### Implementation Guidance

**Step 1: Better Auth creates user table automatically**

Better Auth will create a table with this schema:
```sql
CREATE TABLE user (
    id TEXT PRIMARY KEY,              -- UUID or string ID
    email TEXT UNIQUE NOT NULL,
    emailVerified BOOLEAN DEFAULT FALSE,
    name TEXT,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE account (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES user(id),
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    password TEXT,                    -- Bcrypt hashed by Better Auth
    ...
);
```

**Step 2: Add user_id to tasks table**

Create migration to add foreign key to tasks:
```sql
-- Migration: add_user_id_to_tasks.sql

-- Add user_id column
ALTER TABLE tasks
ADD COLUMN user_id TEXT;

-- Create foreign key constraint
ALTER TABLE tasks
ADD CONSTRAINT fk_tasks_user
FOREIGN KEY (user_id) REFERENCES user(id)
ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- IMPORTANT: For existing tasks, you may need to:
-- 1. Assign them to a default user, OR
-- 2. Delete them if they're test data, OR
-- 3. Make user_id nullable initially and clean up later

-- Example: Make nullable first, then enforce after data migration
-- ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;
```

**Step 3: Update Task model in SQLModel**
```python
# backend/app/models/task.py
from sqlmodel import Field, SQLModel, Relationship
from typing import Optional
from datetime import datetime

class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)  # Foreign key to Better Auth user
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None)
    status: str = Field(default="pending")  # pending, in_progress, completed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

**Step 4: Query pattern for user isolation**
```python
from sqlmodel import Session, select

# CORRECT: Filter by user_id from JWT
def get_user_tasks(session: Session, user_id: str):
    statement = select(Task).where(Task.user_id == user_id)
    tasks = session.exec(statement).all()
    return tasks

# INCORRECT: Never trust user_id from request body
# This is a security vulnerability!
```

**Migration Strategy**:
1. Better Auth creates user table on first run
2. Create migration to add user_id column to tasks table
3. If tasks table has existing data:
   - Option A: Delete test data (if non-production)
   - Option B: Create a default user and assign existing tasks
   - Option C: Make user_id nullable initially, clean up manually, then enforce NOT NULL

### References

- Better Auth Database Schema: https://www.better-auth.com/docs/concepts/database
- SQLModel Relationships: https://sqlmodel.tiangolo.com/tutorial/relationship-attributes/
- PostgreSQL Foreign Keys: https://www.postgresql.org/docs/current/ddl-constraints.html

---

## R4: JWT Token Claims Structure

### Decision

Use standard JWT claims structure with `sub` (subject) for user_id, `email` for user email, `exp` for expiration, and `iat` for issued-at timestamp. Better Auth and FastAPI must share the same JWT secret via environment variable.

### Rationale

Standard JWT claims ensure interoperability and follow industry best practices. Using `sub` for user identification is the RFC 7519 standard, while custom claims provide application-specific data.

### Alternatives Considered

- **Option A: Custom claim names (e.g., userId instead of sub)** - Rejected because:
  - Deviates from JWT standard (RFC 7519)
  - Less interoperable with standard JWT libraries
  - No significant benefit over standard claims

- **Option B: Minimal claims (only user_id)** - Rejected because:
  - Missing security features (expiration tracking)
  - No issued-at timestamp for debugging
  - Harder to debug authentication issues

- **Selected Option C: Standard JWT claims** - Chosen because:
  - Follows RFC 7519 standard
  - Compatible with all JWT libraries
  - Includes essential security features (exp, iat)
  - Balances security and functionality

### Implementation Guidance

**Step 1: Configure Better Auth JWT payload**
```typescript
// frontend/lib/auth.ts
export const auth = betterAuth({
  jwt: {
    secret: process.env.JWT_SECRET,  // MUST match backend
    expiresIn: "24h",
  },
  // Better Auth automatically includes standard claims:
  // - sub: user.id
  // - email: user.email
  // - iat: issued at timestamp
  // - exp: expiration timestamp
})
```

**Step 2: JWT Claims Structure**

Standard JWT token payload:
```json
{
  "sub": "user-uuid-12345",           // Standard: user identifier
  "email": "user@example.com",        // Custom: user email for display
  "iat": 1706515200,                  // Standard: issued at (Unix timestamp)
  "exp": 1706601600                   // Standard: expires at (Unix timestamp)
}
```

Alternative naming (if Better Auth uses different field names):
```json
{
  "user_id": "user-uuid-12345",       // If Better Auth uses user_id instead of sub
  "email": "user@example.com",
  "iat": 1706515200,
  "exp": 1706601600
}
```

**Step 3: Backend JWT verification**
```python
# backend/app/auth/jwt_handler.py
import os
import jwt

JWT_SECRET = os.getenv("JWT_SECRET")  # MUST match frontend
JWT_ALGORITHM = "HS256"

def verify_jwt_token(token: str) -> dict:
    payload = jwt.decode(
        token,
        JWT_SECRET,
        algorithms=[JWT_ALGORITHM]
    )

    # Extract user_id (try both standard and custom field names)
    user_id = payload.get("sub") or payload.get("user_id")
    email = payload.get("email")

    return {
        "user_id": user_id,
        "email": email,
    }
```

**Step 4: Environment variable configuration**

`.env.local` (frontend and backend):
```bash
# CRITICAL: This secret MUST be the same in frontend and backend
# Generate with: openssl rand -base64 32
JWT_SECRET=your-256-bit-secret-here-minimum-32-characters-long

# Better Auth also needs its own secret (can be different)
BETTER_AUTH_SECRET=your-better-auth-secret-here
```

**Step 5: Token expiration strategy**

- **Default expiration**: 24 hours (configurable)
- **No refresh tokens**: For simplicity, use fixed 24-hour tokens
- **Future enhancement**: Implement refresh tokens for extended sessions

**Security considerations**:
- JWT secret MUST be minimum 256 bits (32 characters)
- Never commit secrets to version control (.env in .gitignore)
- Use environment variables for all environments
- Rotate secrets periodically in production

### References

- JWT RFC 7519: https://datatracker.ietf.org/doc/html/rfc7519
- JWT Claims: https://www.iana.org/assignments/jwt/jwt.xhtml
- JWT Best Practices: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html

---

## R5: Frontend Route Protection Pattern

### Decision

Use Next.js 16 middleware to protect routes, redirect unauthenticated users to signin, and handle token expiration gracefully. Combine with authentication context for client-side state management.

### Rationale

Next.js middleware runs before page render, enabling server-side authentication checks and redirects without flashing protected content. Authentication context provides client-side state for conditional UI rendering.

### Alternatives Considered

- **Option A: Client-side only protection** - Rejected because:
  - Protected content flashes before redirect
  - Not SEO friendly
  - Can be bypassed by disabling JavaScript
  - Worse user experience

- **Option B: getServerSideProps on each page** - Rejected because:
  - Repetitive code across all protected pages
  - Not compatible with App Router Server Components
  - Harder to maintain consistency

- **Selected Option C: Middleware + Auth Context** - Chosen because:
  - Centralized authentication logic
  - Server-side redirect before page render
  - No content flash
  - Clean separation of concerns
  - Works with both Server and Client Components

### Implementation Guidance

**Step 1: Create middleware in `frontend/middleware.ts`**
```typescript
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("better-auth.session_token")
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/signin", "/signup", "/", "/api/auth"]
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Protected routes (dashboard, tasks, etc.)
  const isProtectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/tasks")

  if (isProtectedRoute && !token) {
    // Redirect to signin if accessing protected route without token
    const signinUrl = new URL("/signin", request.url)
    signinUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signinUrl)
  }

  if ((pathname === "/signin" || pathname === "/signup") && token) {
    // Redirect to dashboard if already authenticated
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
```

**Step 2: Wrap app in AuthProvider**
```typescript
// frontend/app/layout.tsx
import { AuthProvider } from "@/lib/auth-context"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

**Step 3: Protected layout for dashboard**
```typescript
// frontend/app/(dashboard)/layout.tsx
"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardLayout({ children }) {
  const { session, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !session) {
      router.push("/signin")
    }
  }, [session, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!session) {
    return null  // Middleware will redirect, but prevent flash
  }

  return (
    <div>
      <nav>{/* Navigation with signout button */}</nav>
      <main>{children}</main>
    </div>
  )
}
```

**Step 4: Handle expired tokens**
```typescript
// frontend/lib/api-client.ts
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const session = await authClient.getSession()

  if (!session?.data?.accessToken) {
    // Token expired or missing - redirect to signin
    window.location.href = "/signin?error=session-expired"
    return
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
    {
      ...options,
      headers: {
        ...options.headers,
        "Authorization": `Bearer ${session.data.accessToken}`,
        "Content-Type": "application/json",
      },
    }
  )

  if (response.status === 401) {
    // Backend rejected token - clear session and redirect
    await authClient.signOut()
    window.location.href = "/signin?error=unauthorized"
    return
  }

  return response
}
```

**Step 5: Signin page with callback URL**
```typescript
// frontend/app/(auth)/signin/page.tsx
"use client"

import { useSearchParams } from "next/navigation"

export default function SigninPage() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const error = searchParams.get("error")

  return (
    <div>
      {error === "session-expired" && (
        <div>Your session has expired. Please sign in again.</div>
      )}
      {error === "unauthorized" && (
        <div>Authentication failed. Please sign in.</div>
      )}
      {/* Signin form */}
    </div>
  )
}
```

**Token Persistence**:
- Better Auth stores tokens in httpOnly cookies
- Cookies persist across page navigation automatically
- Server Components can access cookies for SSR
- Client Components use auth context for state

**Error Handling**:
- Expired token → Redirect to signin with error message
- Invalid token → Clear session and redirect
- Network error → Show retry UI
- No token → Redirect to signin

### References

- Next.js 16 Middleware: https://nextjs.org/docs/app/building-your-application/routing/middleware
- Better Auth Session: https://www.better-auth.com/docs/concepts/session
- Next.js Authentication: https://nextjs.org/docs/app/building-your-application/authentication

---

## Summary of Research Findings

### Technology Stack Decisions

| Component | Decision | Library/Tool |
|-----------|----------|--------------|
| Frontend Auth | Better Auth with JWT | better-auth |
| JWT Storage | httpOnly Cookies | Browser cookies |
| Backend JWT Verification | PyJWT + FastAPI Dependencies | pyjwt |
| User Table | Better Auth Managed | Automatic schema |
| JWT Claims | Standard RFC 7519 | sub, email, exp, iat |
| Route Protection | Next.js Middleware | middleware.ts |

### Critical Implementation Requirements

1. **Shared JWT Secret**: Frontend and backend MUST use the same `JWT_SECRET` environment variable
2. **User ID Source**: ALWAYS extract user_id from JWT claims, NEVER from request body
3. **Foreign Key**: tasks.user_id references user.id with CASCADE delete
4. **Token Storage**: Use httpOnly cookies (not localStorage) for XSS protection
5. **Error Messages**: Generic messages for auth failures (prevent information leakage)
6. **Route Protection**: Server-side middleware + client-side context
7. **Database Queries**: ALL task queries MUST filter by user_id from JWT

### Security Checklist

- [ ] JWT_SECRET is minimum 256 bits (32+ characters)
- [ ] Secrets stored in environment variables, not code
- [ ] HttpOnly cookies prevent XSS attacks
- [ ] Generic error messages prevent information leakage
- [ ] User ID sourced exclusively from verified JWT
- [ ] All task endpoints require authentication
- [ ] Ownership verified before update/delete operations
- [ ] Better Auth and FastAPI share same JWT secret

### Next Steps

This research document resolves all "NEEDS CLARIFICATION" items from the Technical Context section in plan.md. Proceed to Phase 1 (Design & Contracts) to create:
- data-model.md (entity definitions)
- contracts/ (API specifications)
- quickstart.md (developer setup guide)
