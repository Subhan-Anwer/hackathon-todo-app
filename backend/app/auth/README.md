# Backend Authentication Module

## Overview

This module provides JWT-based authentication for the FastAPI backend. It integrates with Better Auth (frontend) by verifying JWT tokens issued during user signup/signin flows.

## Module Structure

```
app/auth/
├── __init__.py          # Module initialization, exports verify_jwt_token, get_current_user, User
├── jwt_handler.py       # JWT token verification logic
├── dependencies.py      # FastAPI dependency for get_current_user
└── models.py            # User authentication models (User class)
```

## Files Description

### jwt_handler.py

**Purpose**: Core JWT verification logic

**Main Function**: `verify_jwt_token(token: str) -> dict`

**Features**:
- Decodes JWT token using PyJWT (python-jose library)
- Verifies token signature with shared JWT_SECRET
- Checks token expiration automatically
- Returns decoded payload with user identity claims
- Raises HTTPException(401) for invalid/expired tokens

**Implementation Details**:
- Algorithm: HS256 (HMAC with SHA-256)
- Secret: Loaded from JWT_SECRET environment variable
- Error handling: Generic error messages to prevent information leakage
- Security: Cryptographic signature verification prevents token tampering

### dependencies.py

**Purpose**: FastAPI dependency for authentication

**Main Function**: `get_current_user(credentials) -> User`

**Features**:
- FastAPI dependency using HTTPBearer security scheme
- Extracts JWT token from Authorization: Bearer <token> header
- Calls verify_jwt_token() for validation
- Extracts user_id from token claims (tries 'sub', 'user_id', 'id')
- Converts user_id to integer
- Returns User model with user_id and email

**Usage in Endpoints**:
```python
@router.get("/tasks")
async def get_tasks(current_user: User = Depends(get_current_user)):
    user_id = current_user.user_id
    # Use user_id for data filtering
```

**Security Guarantees**:
- User identity is cryptographically verified
- user_id sourced exclusively from verified JWT claims
- Cannot be spoofed via request body or query parameters
- Enforces multi-user data isolation at API layer

### models.py

**Purpose**: Authentication data models

**Main Class**: `User(BaseModel)`

**Fields**:
- `user_id: int` - Unique user identifier
- `email: Optional[str]` - User email address

**Usage**:
- Type-safe representation of authenticated user
- Used in endpoint function signatures
- Enables IDE autocomplete and type checking

### __init__.py

**Purpose**: Module initialization and public API

**Exports**:
- `verify_jwt_token` - Low-level JWT verification function
- `get_current_user` - FastAPI dependency for protected endpoints
- `User` - User model class

**Usage**:
```python
from app.auth import get_current_user, User
```

## Environment Configuration

### Required Variables

Create `.env` or `.env.local` in backend directory:

```bash
# Shared JWT secret (CRITICAL: Must be same in frontend and backend)
# Generate with: openssl rand -base64 32
JWT_SECRET=your-secure-256-bit-secret-minimum-32-characters

# JWT algorithm (recommended: HS256)
JWT_ALGORITHM=HS256

# JWT expiry in hours
JWT_EXPIRY_HOURS=24
```

### Security Requirements

- JWT_SECRET must be minimum 32 characters (256 bits)
- Use cryptographically random secret (openssl rand -base64 32)
- NEVER commit secrets to version control
- Must match JWT_SECRET in frontend Better Auth configuration

## Usage Examples

### Protecting an Endpoint

```python
from fastapi import APIRouter, Depends
from app.auth import get_current_user, User

router = APIRouter()

@router.get("/tasks")
async def get_tasks(current_user: User = Depends(get_current_user)):
    """Get all tasks for authenticated user."""
    user_id = current_user.user_id
    email = current_user.email
    
    # user_id is guaranteed to be present and verified
    # Use it to filter data by authenticated user
    return {"user_id": user_id, "email": email}
```

### Filtering Data by User

```python
from sqlmodel import Session, select
from app.models.task import Task
from app.database import get_session

@router.get("/tasks")
async def get_tasks(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get all tasks for authenticated user."""
    user_id = current_user.user_id
    
    # CRITICAL: Always filter by user_id from JWT
    statement = select(Task).where(Task.user_id == user_id)
    tasks = session.exec(statement).all()
    
    return {"success": True, "data": tasks}
```

### Verifying Resource Ownership

```python
@router.put("/tasks/{task_id}")
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update task (ownership verified)."""
    user_id = current_user.user_id
    
    # Fetch task and verify ownership in single query
    statement = select(Task).where(
        Task.id == task_id,
        Task.user_id == user_id  # Ownership check
    )
    task = session.exec(statement).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Update task fields
    task.title = task_data.title
    session.commit()
    
    return {"success": True, "data": task}
```

## Security Best Practices

### DO

✓ Always use `get_current_user` dependency on protected endpoints
✓ Source user_id exclusively from `current_user.user_id`
✓ Filter all database queries by user_id from JWT
✓ Verify ownership before update/delete operations
✓ Use generic error messages ("Invalid credentials")
✓ Store JWT_SECRET in environment variables
✓ Use HTTPS in production

### DO NOT

✗ Never trust user_id from request body or query parameters
✗ Never skip JWT verification on "internal" endpoints
✗ Never reveal whether email exists in error messages
✗ Never hardcode JWT_SECRET in source code
✗ Never implement custom JWT verification (use PyJWT)
✗ Never store passwords in plain text (Better Auth handles this)
✗ Never return user_id in responses unless necessary

## Error Handling

### 401 Unauthorized

Returned when:
- Authorization header is missing
- Token is invalid or malformed
- Token signature verification fails
- Token has expired
- user_id claim is missing from token

**Response Format**:
```json
{
  "detail": "Invalid authentication token"
}
```

**Headers**:
```
WWW-Authenticate: Bearer
```

### 403 Forbidden

Returned when:
- Token is valid but user doesn't own the resource
- User attempts to access another user's data

**Response Format**:
```json
{
  "detail": "Forbidden"
}
```

## Testing

### Unit Tests

Test JWT verification:
```python
from app.auth import verify_jwt_token
from jose import jwt
from datetime import datetime, timedelta

def test_valid_token():
    payload = {
        "sub": "123",
        "email": "test@example.com",
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    decoded = verify_jwt_token(token)
    assert decoded["sub"] == "123"

def test_expired_token():
    payload = {
        "sub": "123",
        "exp": datetime.utcnow() - timedelta(hours=1)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    with pytest.raises(HTTPException) as exc:
        verify_jwt_token(token)
    assert exc.value.status_code == 401
```

### Integration Tests

Test protected endpoints:
```python
from fastapi.testclient import TestClient

def test_protected_endpoint_without_token(client: TestClient):
    response = client.get("/api/tasks")
    assert response.status_code == 401

def test_protected_endpoint_with_token(client: TestClient, auth_token: str):
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.get("/api/tasks", headers=headers)
    assert response.status_code == 200
```

## Dependencies

From requirements.txt:
- `PyJWT==2.10.1` - JWT encoding/decoding
- `python-jose==3.5.0` - Additional JWT utilities
- `fastapi==0.128.0` - Web framework
- `pydantic==2.12.5` - Data validation

## OpenAPI Documentation

The `get_current_user` dependency automatically adds:
- "Authorize" button to Swagger UI
- Bearer token input field
- Security scheme documentation
- Lock icons on protected endpoints

## Troubleshooting

### "JWT_SECRET environment variable is not set"

**Solution**: Create `.env` file in backend directory with JWT_SECRET

### "Invalid authentication token"

**Causes**:
- Token signed with different secret
- Token from different environment (dev vs prod)
- Frontend and backend JWT_SECRET mismatch

**Solution**: Ensure JWT_SECRET is identical in frontend and backend

### "Token expired"

**Causes**:
- Token older than JWT_EXPIRY_HOURS
- System clock mismatch

**Solution**: Sign in again to get new token

## References

- FastAPI Security: https://fastapi.tiangolo.com/tutorial/security/
- PyJWT Documentation: https://pyjwt.readthedocs.io/
- Better Auth Integration: /specs/002-auth-security/quickstart.md
- Implementation Plan: /specs/002-auth-security/plan.md
