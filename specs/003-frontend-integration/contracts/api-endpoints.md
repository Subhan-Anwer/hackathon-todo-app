# API Endpoints Contract

**Feature**: 003-frontend-integration
**Date**: 2026-01-30
**Backend**: FastAPI (Python)
**Base URL**: `http://localhost:8000` (development) | `${NEXT_PUBLIC_API_URL}` (production)

## Overview

This document defines the REST API contract between the Next.js frontend and FastAPI backend. All endpoints follow REST conventions, use JSON for request/response bodies, and require JWT authentication (except auth endpoints).

**Authentication**: JWT tokens must be included in the `Authorization` header as `Bearer <token>` for all protected endpoints.

---

## Authentication Endpoints

### POST /api/auth/signup

Create a new user account.

**Authentication**: None required (public endpoint)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe" // optional
}
```

**Success Response** (201 Created):
```json
{
  "user": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2026-01-30T14:30:00.000Z"
  },
  "session": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2026-01-31T14:30:00.000Z"
  }
}
```

**Error Responses**:
- **400 Bad Request**: Invalid email format or weak password
  ```json
  {
    "detail": "Invalid email format"
  }
  ```
- **409 Conflict**: Email already registered
  ```json
  {
    "detail": "Email already exists"
  }
  ```

**Frontend Usage**:
```typescript
import { auth } from "@/lib/auth/client";

await auth.signUp.email({
  email: "user@example.com",
  password: "securepassword123",
  name: "John Doe"
});
```

---

### POST /api/auth/signin

Authenticate existing user and obtain JWT token.

**Authentication**: None required (public endpoint)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success Response** (200 OK):
```json
{
  "user": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "session": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2026-01-31T14:30:00.000Z"
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid credentials
  ```json
  {
    "detail": "Invalid email or password"
  }
  ```
- **400 Bad Request**: Missing required fields
  ```json
  {
    "detail": "Email and password are required"
  }
  ```

**Frontend Usage**:
```typescript
import { auth } from "@/lib/auth/client";

await auth.signIn.email({
  email: "user@example.com",
  password: "securepassword123"
});
```

---

### POST /api/auth/signout

Invalidate current user session.

**Authentication**: Required (JWT token)

**Request Body**: None

**Success Response** (200 OK):
```json
{
  "message": "Signed out successfully"
}
```

**Error Responses**:
- **401 Unauthorized**: Missing or invalid JWT token
  ```json
  {
    "detail": "Unauthorized"
  }
  ```

**Frontend Usage**:
```typescript
import { auth } from "@/lib/auth/client";

await auth.signOut();
```

---

### GET /api/auth/session

Get current user session information.

**Authentication**: Required (JWT token)

**Request Body**: None

**Success Response** (200 OK):
```json
{
  "user": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "session": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2026-01-31T14:30:00.000Z"
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Missing or invalid JWT token
  ```json
  {
    "detail": "Unauthorized"
  }
  ```

**Frontend Usage**:
```typescript
import { auth } from "@/lib/auth/client";

const session = await auth.api.getSession();
```

---

## Task Endpoints

**All task endpoints require JWT authentication.**

### GET /api/v1/tasks

Retrieve all tasks for the authenticated user.

**Authentication**: Required (JWT token)

**Query Parameters**: None

**Success Response** (200 OK):
```json
[
  {
    "id": "task-uuid-1",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "completed": false,
    "created_at": "2026-01-30T10:00:00.000Z",
    "updated_at": "2026-01-30T10:00:00.000Z"
  },
  {
    "id": "task-uuid-2",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Finish project",
    "description": null,
    "completed": true,
    "created_at": "2026-01-29T15:30:00.000Z",
    "updated_at": "2026-01-30T09:15:00.000Z"
  }
]
```

**Empty Response** (200 OK):
```json
[]
```

**Error Responses**:
- **401 Unauthorized**: Missing or invalid JWT token
  ```json
  {
    "detail": "Unauthorized"
  }
  ```
- **500 Internal Server Error**: Database error
  ```json
  {
    "detail": "Failed to retrieve tasks"
  }
  ```

**Frontend Usage**:
```typescript
import { taskApi } from "@/lib/api/tasks";

const tasks = await taskApi.list();
```

**Notes**:
- Response is always an array (empty array if no tasks)
- Tasks are filtered by `user_id` from JWT token (backend enforced)
- Tasks are sorted by `created_at` descending (newest first)

---

### GET /api/v1/tasks/{id}

Retrieve a specific task by ID.

**Authentication**: Required (JWT token)

**Path Parameters**:
- `id` (string, required): Task UUID

**Success Response** (200 OK):
```json
{
  "id": "task-uuid-1",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "created_at": "2026-01-30T10:00:00.000Z",
  "updated_at": "2026-01-30T10:00:00.000Z"
}
```

**Error Responses**:
- **401 Unauthorized**: Missing or invalid JWT token
  ```json
  {
    "detail": "Unauthorized"
  }
  ```
- **403 Forbidden**: Task belongs to different user
  ```json
  {
    "detail": "You do not have permission to access this task"
  }
  ```
- **404 Not Found**: Task does not exist
  ```json
  {
    "detail": "Task not found"
  }
  ```

**Frontend Usage**:
```typescript
import { taskApi } from "@/lib/api/tasks";

const task = await taskApi.get("task-uuid-1");
```

**Notes**:
- Backend verifies task ownership before returning data
- Returns 404 if task doesn't exist OR if it belongs to another user (security)

---

### POST /api/v1/tasks

Create a new task for the authenticated user.

**Authentication**: Required (JWT token)

**Request Body**:
```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread" // optional
}
```

**Minimal Request**:
```json
{
  "title": "Buy groceries"
}
```

**Success Response** (201 Created):
```json
{
  "id": "task-uuid-1",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "created_at": "2026-01-30T14:30:00.000Z",
  "updated_at": "2026-01-30T14:30:00.000Z"
}
```

**Error Responses**:
- **401 Unauthorized**: Missing or invalid JWT token
  ```json
  {
    "detail": "Unauthorized"
  }
  ```
- **400 Bad Request**: Missing or invalid title
  ```json
  {
    "detail": "Title is required and cannot be empty"
  }
  ```
- **422 Unprocessable Entity**: Validation error
  ```json
  {
    "detail": [
      {
        "loc": ["body", "title"],
        "msg": "field required",
        "type": "value_error.missing"
      }
    ]
  }
  ```

**Frontend Usage**:
```typescript
import { taskApi } from "@/lib/api/tasks";

const newTask = await taskApi.create({
  title: "Buy groceries",
  description: "Milk, eggs, bread"
});
```

**Notes**:
- `user_id` is automatically set from JWT token (NEVER from request body)
- `id`, `completed`, `created_at`, `updated_at` are auto-generated
- `description` is optional (defaults to null)
- `completed` defaults to false

---

### PUT /api/v1/tasks/{id}

Update an existing task (full or partial update).

**Authentication**: Required (JWT token)

**Path Parameters**:
- `id` (string, required): Task UUID

**Request Body** (all fields optional):
```json
{
  "title": "Buy groceries and cook",
  "description": "Milk, eggs, bread, chicken",
  "completed": true
}
```

**Partial Update Examples**:
```json
// Update only title
{
  "title": "Buy groceries and cook"
}

// Update only completion status
{
  "completed": true
}

// Clear description
{
  "description": null
}
```

**Success Response** (200 OK):
```json
{
  "id": "task-uuid-1",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Buy groceries and cook",
  "description": "Milk, eggs, bread, chicken",
  "completed": true,
  "created_at": "2026-01-30T10:00:00.000Z",
  "updated_at": "2026-01-30T14:35:00.000Z"
}
```

**Error Responses**:
- **401 Unauthorized**: Missing or invalid JWT token
  ```json
  {
    "detail": "Unauthorized"
  }
  ```
- **403 Forbidden**: Task belongs to different user
  ```json
  {
    "detail": "You do not have permission to modify this task"
  }
  ```
- **404 Not Found**: Task does not exist
  ```json
  {
    "detail": "Task not found"
  }
  ```
- **400 Bad Request**: Empty title provided
  ```json
  {
    "detail": "Title cannot be empty"
  }
  ```

**Frontend Usage**:
```typescript
import { taskApi } from "@/lib/api/tasks";

// Full update
const updated = await taskApi.update("task-uuid-1", {
  title: "Buy groceries and cook",
  description: "Milk, eggs, bread, chicken",
  completed: true
});

// Partial update
const updated = await taskApi.update("task-uuid-1", {
  title: "Buy groceries and cook"
});
```

**Notes**:
- Backend verifies task ownership before updating
- `updated_at` is automatically set to current timestamp
- `user_id`, `id`, `created_at` are immutable and ignored if included

---

### DELETE /api/v1/tasks/{id}

Delete a task permanently.

**Authentication**: Required (JWT token)

**Path Parameters**:
- `id` (string, required): Task UUID

**Request Body**: None

**Success Response** (204 No Content):
```
(empty response body)
```

**Error Responses**:
- **401 Unauthorized**: Missing or invalid JWT token
  ```json
  {
    "detail": "Unauthorized"
  }
  ```
- **403 Forbidden**: Task belongs to different user
  ```json
  {
    "detail": "You do not have permission to delete this task"
  }
  ```
- **404 Not Found**: Task does not exist
  ```json
  {
    "detail": "Task not found"
  }
  ```

**Frontend Usage**:
```typescript
import { taskApi } from "@/lib/api/tasks";

await taskApi.delete("task-uuid-1");
// No return value on success
```

**Notes**:
- Deletion is permanent (no soft delete)
- Backend verifies task ownership before deleting
- Returns 204 No Content on success (no response body)

---

### PATCH /api/v1/tasks/{id}/complete

Toggle task completion status.

**Authentication**: Required (JWT token)

**Path Parameters**:
- `id` (string, required): Task UUID

**Request Body**: None (completion status is toggled automatically)

**Success Response** (200 OK):
```json
{
  "id": "task-uuid-1",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": true,
  "created_at": "2026-01-30T10:00:00.000Z",
  "updated_at": "2026-01-30T14:40:00.000Z"
}
```

**Error Responses**:
- **401 Unauthorized**: Missing or invalid JWT token
  ```json
  {
    "detail": "Unauthorized"
  }
  ```
- **403 Forbidden**: Task belongs to different user
  ```json
  {
    "detail": "You do not have permission to modify this task"
  }
  ```
- **404 Not Found**: Task does not exist
  ```json
  {
    "detail": "Task not found"
  }
  ```

**Frontend Usage**:
```typescript
import { taskApi } from "@/lib/api/tasks";

// Toggle completion (false → true or true → false)
const updated = await taskApi.toggleComplete("task-uuid-1");
console.log(updated.completed); // New completion status
```

**Notes**:
- Automatically toggles between true and false
- No request body needed (backend reads current state and flips it)
- `updated_at` is automatically set to current timestamp
- More convenient than PUT for simple completion toggle

---

## Common HTTP Status Codes

### Success Codes
- **200 OK**: Request succeeded, response body contains data
- **201 Created**: Resource created successfully, response body contains new resource
- **204 No Content**: Request succeeded, no response body (e.g., DELETE)

### Client Error Codes
- **400 Bad Request**: Invalid request body or parameters
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: Valid token but insufficient permissions (e.g., accessing another user's task)
- **404 Not Found**: Resource does not exist
- **409 Conflict**: Resource already exists (e.g., email already registered)
- **422 Unprocessable Entity**: Validation error (Pydantic validation failed)

### Server Error Codes
- **500 Internal Server Error**: Unexpected server error (database failure, etc.)

---

## Authentication Flow

### Sign-Up Flow
```
1. User fills sign-up form (email, password, name)
2. Frontend validates input (email format, password length)
3. Frontend sends POST /api/auth/signup
4. Backend creates user account + session
5. Backend returns JWT token in response
6. Frontend stores token in Better Auth session (httpOnly cookie)
7. Frontend redirects to /tasks
```

### Sign-In Flow
```
1. User fills sign-in form (email, password)
2. Frontend sends POST /api/auth/signin
3. Backend validates credentials
4. Backend generates JWT token with user_id in claims
5. Backend returns JWT token in response
6. Frontend stores token in Better Auth session (httpOnly cookie)
7. Frontend redirects to /tasks (or callbackUrl if present)
```

### Protected Request Flow
```
1. User navigates to /tasks page
2. Next.js middleware checks Better Auth session
3. If no session, redirect to /signin
4. If session exists, allow page to render
5. Page fetches tasks via GET /api/v1/tasks
6. API client extracts JWT from session
7. API client adds Authorization: Bearer <token> header
8. Backend validates JWT signature
9. Backend extracts user_id from JWT claims
10. Backend filters tasks WHERE user_id = <token.user_id>
11. Backend returns user-specific tasks
12. Frontend displays tasks
```

### Sign-Out Flow
```
1. User clicks Sign Out button
2. Frontend sends POST /api/auth/signout
3. Backend invalidates session (optional, depends on Better Auth config)
4. Frontend clears Better Auth session cookie
5. Frontend redirects to /signin
```

---

## Error Handling Contract

### Frontend Responsibilities
1. **Retry Logic**: Retry requests on network errors (not on 4xx errors)
2. **Error Display**: Show user-friendly error messages from API responses
3. **Token Refresh**: Handle token expiration (401) by redirecting to sign-in
4. **Validation**: Client-side validation to reduce unnecessary API calls

### Backend Guarantees
1. **Consistent Format**: All errors return JSON with "detail" field
2. **Security**: Never expose sensitive information in error messages
3. **User Ownership**: Always verify task ownership via JWT before any operation
4. **Input Validation**: Validate all inputs and return 400/422 for invalid data

---

## CORS Configuration

**Backend must allow frontend origin**:
```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Development
        "https://yourdomain.com",  # Production
    ],
    allow_credentials=True,  # Required for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Rate Limiting (Future Enhancement)

Currently not implemented, but recommended for production:
- **Auth endpoints**: 5 requests per minute per IP
- **Task endpoints**: 100 requests per minute per user

---

## Summary

- **4 authentication endpoints**: signup, signin, signout, session
- **6 task endpoints**: list, get, create, update, delete, toggleComplete
- **JWT authentication** required for all task endpoints
- **User isolation** enforced by backend via JWT `user_id` claims
- **RESTful conventions** followed (GET, POST, PUT, PATCH, DELETE)
- **Consistent error format** with HTTP status codes and detail messages

This contract serves as the single source of truth for frontend-backend communication.
