# Authentication Error Responses - Quick Reference

**Last Updated**: 2026-01-29
**Tasks**: T027-T030

---

## HTTP Status Codes

| Status Code | Error Type | When to Use |
|------------|-----------|-------------|
| **401 Unauthorized** | Authentication failed | Missing, invalid, or expired token |
| **403 Forbidden** | Authorization failed | Valid token but insufficient permissions |
| **404 Not Found** | Resource not found | Task doesn't exist |

---

## Error Response Format

All authentication errors follow this structure:

```json
{
  "detail": "Error message here"
}
```

**Note**: FastAPI's HTTPException returns a simple `detail` field. For custom error structures matching the spec's `ErrorResponse` schema, use custom exception handlers.

---

## Authentication Error Types

### 1. Missing Authorization Header

**Scenario**: Request made without `Authorization` header

```bash
curl http://localhost:8000/api/v1/tasks
```

**Response**:
```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer
Content-Type: application/json

{
  "detail": "Not authenticated"
}
```

**Raised by**: FastAPI's `HTTPBearer` security scheme

---

### 2. Invalid Token Format

**Scenario**: Token is malformed or has invalid signature

```bash
curl http://localhost:8000/api/v1/tasks \
  -H "Authorization: Bearer invalid-token"
```

**Response**:
```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer

{
  "detail": "Invalid authentication token"
}
```

**Raised by**: `verify_jwt_token()` → `JWTError` exception

---

### 3. Expired Token

**Scenario**: Token's `exp` claim is in the past

```bash
curl http://localhost:8000/api/v1/tasks \
  -H "Authorization: Bearer <expired_token>"
```

**Response**:
```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer

{
  "detail": "Token expired"
}
```

**Raised by**: `verify_jwt_token()` → `jwt.ExpiredSignatureError`

---

### 4. Missing User ID in Token

**Scenario**: Token valid but missing `sub`, `user_id`, or `id` claim

**Response**:
```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer

{
  "detail": "Invalid token: user identifier not found"
}
```

**Raised by**: `get_current_user()` dependency

---

### 5. Authorization Error (403)

**Scenario**: User authenticated but accessing resource they don't own

```bash
# User A tries to access User B's task
curl http://localhost:8000/api/v1/tasks/123 \
  -H "Authorization: Bearer <user_a_token>"
```

**Response**:
```http
HTTP/1.1 403 Forbidden

{
  "detail": "Forbidden"
}
```

**Raised by**: Ownership verification in task endpoints

---

## Using Custom Error Classes

### In Your Code

```python
from app.auth.dependencies import AuthenticationError, AuthorizationError

# Raise authentication error (401)
if not valid_token:
    raise AuthenticationError("Token expired")

# Raise authorization error (403)
if task.user_id != current_user.user_id:
    raise AuthorizationError("Cannot access this resource")
```

### Benefits

- ✅ Automatic `WWW-Authenticate` header for 401s
- ✅ Consistent error format
- ✅ Clear separation between authn (401) and authz (403)

---

## Unprotected Endpoints

### Health Check Endpoint

**Path**: `/health`

**Authentication**: ❌ NOT REQUIRED

**Purpose**: Load balancer health checks, monitoring

```bash
curl http://localhost:8000/health
```

**Response**:
```json
{
  "status": "healthy",
  "service": "todo-api",
  "timestamp": "2026-01-29T22:30:00Z"
}
```

---

## Frontend Error Handling

### In api-client.ts

```typescript
if (response.status === 401) {
  // Token expired or invalid
  await authClient.signOut()
  window.location.href = "/signin?error=unauthorized"
  throw new Error("Unauthorized")
}
```

**Behavior**:
1. Detect 401 response
2. Clear user session
3. Redirect to signin page
4. Display error message

---

## Testing

### Quick Test Commands

```bash
# Test missing auth
curl -v http://localhost:8000/api/v1/tasks

# Test invalid token
curl -v http://localhost:8000/api/v1/tasks \
  -H "Authorization: Bearer invalid"

# Test health check (no auth)
curl http://localhost:8000/health

# Run automated tests
python -m pytest tests/test_auth_errors.py -v
```

---

## Security Best Practices

### ✅ DO

- Always include `WWW-Authenticate: Bearer` header in 401 responses
- Use generic error messages to prevent information leakage
- Verify token signature and expiration on every request
- Extract user_id from verified JWT claims (never from request body)

### ❌ DON'T

- Don't reveal whether user exists in error messages
- Don't expose token structure or internal errors
- Don't skip authentication for task endpoints
- Don't trust user_id from request body/query params

---

## Error Response Examples

### Standardized Error Response (Future Enhancement)

For custom error responses matching the spec's `ErrorResponse` schema:

```json
{
  "success": false,
  "error": {
    "message": "Token expired",
    "code": "TOKEN_EXPIRED"
  }
}
```

**To implement**: Create custom exception handler in `main.py`

```python
@app.exception_handler(AuthenticationError)
async def authentication_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "message": exc.detail,
                "code": "AUTHENTICATION_FAILED"
            }
        },
        headers=exc.headers
    )
```

---

## Common Issues

### Issue: All requests return 401

**Cause**: JWT_SECRET not set or mismatch

**Solution**:
```bash
export JWT_SECRET="your-secret-key-here"
```

### Issue: Token appears valid but fails

**Cause**: Missing required claims (`sub`, `user_id`, `id`)

**Solution**: Ensure Better Auth includes user ID in JWT payload

### Issue: Frontend doesn't redirect on 401

**Cause**: `api-client.ts` not used for API calls

**Solution**: Always use `apiGet`, `apiPost`, etc. from `api-client.ts`

---

## Quick Reference: Error Codes

| HTTP Status | Error Message | Cause |
|------------|--------------|-------|
| 401 | "Not authenticated" | No Authorization header |
| 401 | "Invalid authentication token" | Malformed or invalid signature |
| 401 | "Token expired" | Token exp claim in past |
| 401 | "Invalid token: user identifier not found" | Missing sub/user_id claim |
| 403 | "Forbidden" | Valid token but insufficient permissions |

---

## Related Files

- Implementation: `/backend/app/auth/dependencies.py`
- JWT Verification: `/backend/app/auth/jwt_handler.py`
- Tests: `/backend/tests/test_auth_errors.py`
- Manual Testing Guide: `/backend/docs/testing-auth-errors.md`
- Full Summary: `/backend/docs/T027-T030-implementation-summary.md`
