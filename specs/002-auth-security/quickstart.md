# Authentication & Security Quickstart Guide

**Feature**: 002-auth-security
**Date**: 2026-01-29
**Audience**: Developers implementing authentication and authorization

This guide provides step-by-step instructions for setting up JWT-based authentication in the Hackathon Todo App.

---

## Prerequisites

Before starting, ensure you have:

- [x] Node.js 18+ installed (for Next.js frontend)
- [x] Python 3.11+ installed (for FastAPI backend)
- [x] PostgreSQL database connection configured (Neon Serverless)
- [x] Git repository cloned
- [x] Project structure (frontend/ and backend/ directories)

---

## Step 1: Environment Configuration

### Create Environment Variables

Create `.env.local` in repository root:

```bash
# Shared JWT secret (CRITICAL: Must be same in frontend and backend)
# Generate with: openssl rand -base64 32
JWT_SECRET=your-secure-256-bit-secret-minimum-32-characters-long-here

# Better Auth configuration
BETTER_AUTH_SECRET=your-better-auth-secret-also-32-chars-minimum
BETTER_AUTH_URL=http://localhost:3000

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (Neon Serverless PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

### Generate Secure Secrets

```bash
# Generate JWT secret (minimum 256 bits)
openssl rand -base64 32

# Generate Better Auth secret
openssl rand -base64 32
```

### Create .env.example Template

```bash
# Copy .env.local to .env.example and remove actual secrets
cp .env.local .env.example

# Edit .env.example and replace secrets with placeholders
# JWT_SECRET=REPLACE_WITH_SECURE_SECRET_MIN_32_CHARS
# BETTER_AUTH_SECRET=REPLACE_WITH_BETTER_AUTH_SECRET
# DATABASE_URL=REPLACE_WITH_YOUR_NEON_DATABASE_URL
```

### Add to .gitignore

```bash
# Ensure .env.local is never committed
echo ".env.local" >> .gitignore
echo ".env" >> .gitignore
```

---

## Step 2: Backend Setup (FastAPI)

### 2.1 Install Dependencies

```bash
cd backend

# Install JWT verification library
pip install pyjwt

# Install other required packages (if not already installed)
pip install fastapi sqlmodel uvicorn python-dotenv

# Update requirements.txt
pip freeze > requirements.txt
```

### 2.2 Create Authentication Module

Create directory structure:

```bash
mkdir -p backend/app/auth
touch backend/app/auth/__init__.py
touch backend/app/auth/jwt_handler.py
touch backend/app/auth/dependencies.py
```

### 2.3 Implement JWT Verification (`backend/app/auth/jwt_handler.py`)

```python
import os
import jwt
from datetime import datetime
from fastapi import HTTPException, status

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"

if not JWT_SECRET:
    raise ValueError("JWT_SECRET environment variable is not set")

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

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
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

### 2.4 Create FastAPI Dependency (`backend/app/auth/dependencies.py`)

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .jwt_handler import verify_jwt_token

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    FastAPI dependency that verifies JWT and returns user data.
    Use this in endpoint parameters to protect routes.

    Usage:
        @router.get("/tasks")
        async def get_tasks(current_user: dict = Depends(get_current_user)):
            user_id = current_user["user_id"]
            # ... filter tasks by user_id
    """
    token = credentials.credentials
    payload = verify_jwt_token(token)

    # Extract user_id from JWT claims (try both standard and custom field names)
    user_id = payload.get("sub") or payload.get("user_id")
    email = payload.get("email")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing user identifier",
        )

    return {
        "user_id": user_id,
        "email": email,
    }
```

### 2.5 Update Task Endpoints with Authentication

Example for `backend/app/api/tasks.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from ..auth.dependencies import get_current_user
from ..models.task import Task
from ..database import get_session

router = APIRouter()

@router.get("/tasks")
async def get_tasks(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get all tasks for the authenticated user."""
    user_id = current_user["user_id"]

    # CRITICAL: Filter by user_id from JWT
    statement = select(Task).where(Task.user_id == user_id)
    tasks = session.exec(statement).all()

    return {"success": True, "data": tasks}

@router.post("/tasks", status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create new task for authenticated user."""
    user_id = current_user["user_id"]

    # Create task with user_id from JWT (NOT from request body)
    task = Task(
        user_id=user_id,  # From JWT claims
        title=task_data.title,
        description=task_data.description,
        status=task_data.status or "pending",
    )

    session.add(task)
    session.commit()
    session.refresh(task)

    return {"success": True, "data": task}

@router.put("/tasks/{task_id}")
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update task (ownership verified)."""
    user_id = current_user["user_id"]

    # Fetch task and verify ownership
    statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    task = session.exec(statement).first()

    if not task:
        # Return 403 if task exists but user doesn't own it
        # Return 404 if task doesn't exist at all
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Update fields
    if task_data.title is not None:
        task.title = task_data.title
    if task_data.description is not None:
        task.description = task_data.description
    if task_data.status is not None:
        task.status = task_data.status

    task.updated_at = datetime.utcnow()
    session.add(task)
    session.commit()
    session.refresh(task)

    return {"success": True, "data": task}
```

### 2.6 Database Migration (Add user_id to tasks)

Create migration file `backend/migrations/add_user_id_to_tasks.sql`:

```sql
-- Add user_id column to tasks table
ALTER TABLE tasks ADD COLUMN user_id TEXT;

-- Create foreign key constraint
ALTER TABLE tasks
ADD CONSTRAINT fk_tasks_user
FOREIGN KEY (user_id) REFERENCES user(id)
ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Note: For existing tasks, decide on migration strategy:
-- Option A: Delete test data
-- DELETE FROM tasks;

-- Option B: Assign to default user (create user first)
-- UPDATE tasks SET user_id = 'default-user-id' WHERE user_id IS NULL;

-- Make user_id NOT NULL after migration
ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;
```

---

## Step 3: Frontend Setup (Next.js)

### 3.1 Install Better Auth

```bash
cd frontend

# Install Better Auth
npm install better-auth

# Install other dependencies (if not already installed)
npm install next react react-dom
```

### 3.2 Configure Better Auth (`frontend/lib/auth.ts`)

```typescript
import { betterAuth } from "better-auth"

export const auth = betterAuth({
  database: {
    provider: "postgres",
    url: process.env.DATABASE_URL as string,
  },
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24, // 24 hours
    updateAge: 60 * 60 * 24, // 24 hours
  },
  jwt: {
    secret: process.env.JWT_SECRET as string,
    expiresIn: "24h",
  },
  trustedOrigins: [process.env.NEXT_PUBLIC_API_URL as string],
})
```

### 3.3 Create Better Auth API Route

Create `frontend/app/api/auth/[...all]/route.ts`:

```typescript
import { auth } from "@/lib/auth"

export const { GET, POST } = auth.handler
```

### 3.4 Create Auth Client (`frontend/lib/auth-client.ts`)

```typescript
import { createAuthClient } from "better-auth/client"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
})

// Helper functions
export const signUp = async (email: string, password: string, name?: string) => {
  return authClient.signUp.email({
    email,
    password,
    name,
  })
}

export const signIn = async (email: string, password: string) => {
  return authClient.signIn.email({
    email,
    password,
  })
}

export const signOut = async () => {
  return authClient.signOut()
}

export const getSession = async () => {
  return authClient.getSession()
}
```

### 3.5 Create API Client with JWT Injection (`frontend/lib/api-client.ts`)

```typescript
import { authClient } from "./auth-client"

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const session = await authClient.getSession()

  if (!session?.data?.accessToken) {
    // Redirect to signin if not authenticated
    window.location.href = "/signin?error=session-expired"
    throw new Error("Not authenticated")
  }

  const headers: HeadersInit = {
    ...options.headers,
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.data.accessToken}`,
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  )

  if (response.status === 401) {
    // Token expired or invalid
    await authClient.signOut()
    window.location.href = "/signin?error=unauthorized"
    throw new Error("Unauthorized")
  }

  return response
}
```

### 3.6 Create Authentication Context (`frontend/lib/auth-context.tsx`)

```typescript
"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { authClient } from "./auth-client"

interface AuthContextType {
  session: any
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
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

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
```

### 3.7 Create Route Protection Middleware (`frontend/middleware.ts`)

```typescript
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("better-auth.session_token")
  const { pathname } = request.nextUrl

  // Public routes
  const publicRoutes = ["/signin", "/signup", "/", "/api/auth"]
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Protected routes
  const isProtectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/tasks")

  if (isProtectedRoute && !token) {
    const signinUrl = new URL("/signin", request.url)
    signinUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signinUrl)
  }

  if ((pathname === "/signin" || pathname === "/signup") && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
```

---

## Step 4: Testing Authentication

### 4.1 Start Backend Server

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### 4.2 Start Frontend Server

```bash
cd frontend
npm run dev
```

### 4.3 Test Signup Flow

```bash
# Test signup via API
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "name": "Test User"
  }'

# Expected response:
# {
#   "user_id": "user-uuid-...",
#   "email": "test@example.com",
#   "jwt_token": "eyJhbGci..."
# }
```

### 4.4 Test Signin Flow

```bash
# Test signin and capture JWT token
JWT=$(curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }' | jq -r '.jwt_token')

echo "JWT Token: $JWT"
```

### 4.5 Test Protected Endpoints

```bash
# Test getting tasks (should be empty initially)
curl http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $JWT"

# Expected response:
# {
#   "success": true,
#   "data": []
# }

# Test creating a task
curl -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "description": "This is a test task",
    "status": "pending"
  }'

# Expected response:
# {
#   "success": true,
#   "data": {
#     "id": 1,
#     "user_id": "user-uuid-...",
#     "title": "Test Task",
#     ...
#   }
# }
```

### 4.6 Test Authentication Failures

```bash
# Test without token (should fail with 401)
curl http://localhost:8000/api/tasks

# Test with invalid token (should fail with 401)
curl http://localhost:8000/api/tasks \
  -H "Authorization: Bearer invalid-token-here"

# Test accessing another user's task (should fail with 403)
# First create a second user and task, then try to access with first user's token
```

---

## Step 5: Security Checklist

Before deploying or merging to main, verify:

- [ ] `JWT_SECRET` is minimum 256 bits (32+ characters) and cryptographically random
- [ ] Secrets are stored in environment variables, never in code
- [ ] `.env.local` is in `.gitignore` and never committed
- [ ] All task endpoints use `get_current_user` dependency
- [ ] User ID is sourced from JWT claims, never from request body
- [ ] All task queries filter by `user_id` from JWT
- [ ] Ownership is verified before update/delete operations
- [ ] Generic error messages are used for authentication failures
- [ ] HTTPS is enforced in production
- [ ] Better Auth and FastAPI share the same `JWT_SECRET`
- [ ] HttpOnly cookies are used for token storage (not localStorage)

---

## Troubleshooting

### Issue: "Invalid token" error

**Solution**: Ensure Better Auth and FastAPI use the same `JWT_SECRET`.

```bash
# Verify in .env.local:
grep JWT_SECRET .env.local

# Should be identical in both frontend and backend configuration
```

### Issue: "Token expired" error

**Solution**: Generate a new token by signing in again. Consider increasing token expiration if needed.

```typescript
// In frontend/lib/auth.ts
jwt: {
  expiresIn: "48h",  // Increase to 48 hours if needed
}
```

### Issue: "CORS errors" when calling backend

**Solution**: Configure CORS in FastAPI to allow requests from frontend origin.

```python
# In backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("NEXT_PUBLIC_APP_URL")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: User table not created

**Solution**: Better Auth creates the user table automatically on first run. Ensure `DATABASE_URL` is correct and database exists.

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT * FROM user LIMIT 1;"
```

---

## Next Steps

After completing the quickstart:

1. **Review security implementation** with `auth-security-specialist` agent
2. **Build signup/signin UI** with `nextjs-frontend-builder` agent
3. **Run automated tests** to verify authentication flow
4. **Create additional tasks** as defined in tasks.md
5. **Document architectural decisions** with `/sp.adr` command

---

## References

- Better Auth Documentation: https://www.better-auth.com/docs
- FastAPI Security: https://fastapi.tiangolo.com/tutorial/security/
- PyJWT Documentation: https://pyjwt.readthedocs.io/
- Next.js Authentication: https://nextjs.org/docs/app/building-your-application/authentication
- OWASP JWT Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
