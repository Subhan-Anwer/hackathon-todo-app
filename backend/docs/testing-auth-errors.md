# Authentication Error Testing Guide

This guide provides manual testing procedures for Tasks T027-T030: Standardized error responses and access rejection handling.

## Prerequisites

1. Backend server running: `uvicorn main:app --reload`
2. Test tools: `curl`, `jq` (optional for JSON formatting)
3. Valid JWT token from Better Auth (see "Getting a Test Token" section)

## Test Environment

- **Backend URL**: `http://localhost:8000`
- **Protected Endpoints**: `/api/v1/tasks`, `/api/v1/tasks/{id}`
- **Unprotected Endpoints**: `/health`, `/`

---

## Getting a Test Token

### Method 1: Using Better Auth (Recommended)

```bash
# Sign up a test user
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# Sign in and extract token
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }' \
  | jq -r '.token'
```

### Method 2: Generate Test Token (Python)

```python
from jose import jwt
from datetime import datetime, timedelta, timezone
import os

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
JWT_ALGORITHM = "HS256"

payload = {
    "sub": "test-user-123",
    "email": "test@example.com",
    "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    "iat": datetime.now(timezone.utc)
}

token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
print(token)
```

---

## Task T027: Standardized Error Responses

### Test 1: Missing Authorization Header (401)

**Expected**: 401 Unauthorized with WWW-Authenticate header

```bash
curl -v http://localhost:8000/api/v1/tasks
```

**Verify**:
- Status code: `401`
- Header: `WWW-Authenticate: Bearer`
- Response body contains `detail` field with error message

**Example Response**:
```json
{
  "detail": "Not authenticated"
}
```

---

### Test 2: Invalid/Malformed Token (401)

**Expected**: 401 Unauthorized with generic error message

```bash
curl -v http://localhost:8000/api/v1/tasks \
  -H "Authorization: Bearer invalid-token-12345"
```

**Verify**:
- Status code: `401`
- Header: `WWW-Authenticate: Bearer`
- Error message is generic (no token structure details revealed)

**Example Response**:
```json
{
  "detail": "Invalid authentication token"
}
```

---

### Test 3: Expired Token (401)

**Expected**: 401 Unauthorized with expiration indicator

**Step 1**: Generate expired token

```python
from jose import jwt
from datetime import datetime, timedelta, timezone
import os

JWT_SECRET = os.getenv("JWT_SECRET")
payload = {
    "sub": "test-user-123",
    "email": "test@example.com",
    "exp": datetime.now(timezone.utc) - timedelta(hours=1),  # Expired 1 hour ago
    "iat": datetime.now(timezone.utc) - timedelta(hours=2)
}
expired_token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
print(expired_token)
```

**Step 2**: Test with expired token

```bash
curl -v http://localhost:8000/api/v1/tasks \
  -H "Authorization: Bearer <expired_token>"
```

**Verify**:
- Status code: `401`
- Header: `WWW-Authenticate: Bearer`
- Error message mentions expiration: `"Token expired"`

**Example Response**:
```json
{
  "detail": "Token expired"
}
```

---

## Task T028: Token Expiration Check

### Test 4: Explicit Expiration Verification

**Expected**: JWT library checks expiration and returns clear error

```bash
# Use the expired token from Test 3
curl -v http://localhost:8000/api/v1/tasks \
  -H "Authorization: Bearer <expired_token>" \
  | jq '.'
```

**Verify**:
- Response contains `"Token expired"` in detail field
- NOT a generic "Invalid token" message
- Distinguishes expired tokens from other invalid tokens

---

## Task T029: Frontend 401 Handling

### Test 5: Frontend Session Clearing

This test requires the Next.js frontend to be running.

**Step 1**: Sign in to the application
**Step 2**: Open browser DevTools > Network tab
**Step 3**: Manually expire your token (edit cookie or wait for natural expiration)
**Step 4**: Perform any action that calls the backend API

**Expected Behavior**:
1. API request returns `401 Unauthorized`
2. Frontend `api-client.ts` intercepts the error
3. Frontend calls `authClient.signOut()`
4. User is redirected to `/signin?error=unauthorized`

**Verify in Code**: `/frontend/lib/api-client.ts`

```typescript
if (response.status === 401) {
  // Token expired or invalid - clear session and redirect
  await authClient.signOut()
  if (typeof window !== "undefined") {
    window.location.href = "/signin?error=unauthorized"
  }
  throw new Error("Unauthorized")
}
```

---

## Task T030: Health Check Endpoint Unprotected

### Test 6: Health Check Without Authentication

**Expected**: 200 OK without requiring Authorization header

```bash
curl http://localhost:8000/health
```

**Verify**:
- Status code: `200`
- Response contains `status: "healthy"`
- No authentication required

**Example Response**:
```json
{
  "status": "healthy",
  "service": "todo-api",
  "timestamp": "2026-01-29T22:30:00Z"
}
```

---

### Test 7: Health Check WITH Invalid Token (Still Works)

**Expected**: Health check works even with invalid Authorization header

```bash
curl http://localhost:8000/health \
  -H "Authorization: Bearer garbage-token"
```

**Verify**:
- Status code: `200` (still succeeds)
- Authentication header is ignored
- Same healthy response as Test 6

---

## Additional Security Tests

### Test 8: No Information Leakage in Error Messages

**Verify that error messages don't reveal**:
- Whether a user exists
- Token structure details
- Database schema information
- Internal server errors

**Test various invalid tokens**:

```bash
# Empty token
curl -v http://localhost:8000/api/v1/tasks \
  -H "Authorization: Bearer "

# SQL injection attempt
curl -v http://localhost:8000/api/v1/tasks \
  -H "Authorization: Bearer '; DROP TABLE users; --"

# JWT with modified signature
curl -v http://localhost:8000/api/v1/tasks \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6OTk5OTk5OTk5OX0.invalid"
```

**All should return**:
- Generic `401 Unauthorized`
- No stack traces
- No database error details
- No JWT structure information

---

### Test 9: WWW-Authenticate Header Presence

**Verify all 401 responses include WWW-Authenticate header per RFC 7235**

```bash
curl -v http://localhost:8000/api/v1/tasks 2>&1 | grep -i "www-authenticate"
```

**Expected**:
```
< WWW-Authenticate: Bearer
```

---

### Test 10: Valid Token Successful Authentication

**Expected**: Valid token allows access to protected endpoints

```bash
# Get a valid token (from Better Auth or test token generator)
VALID_TOKEN="eyJ..."

curl http://localhost:8000/api/v1/tasks \
  -H "Authorization: Bearer $VALID_TOKEN"
```

**Verify**:
- Status code: `200` (or `500` if database not configured, but NOT `401`)
- Request proceeds to business logic
- User ID is extracted from token

---

## Success Criteria Checklist

- [ ] **T027**: Standardized error responses (401, 403) with consistent JSON structure
- [ ] **T028**: Token expiration explicitly checked and returns "Token expired" message
- [ ] **T029**: Frontend handles 401 by clearing session and redirecting to signin
- [ ] **T030**: Health check endpoint exists and does NOT require authentication
- [ ] All error messages are generic (no information leakage)
- [ ] WWW-Authenticate header included in all 401 responses
- [ ] Expired tokens are distinguished from invalid tokens
- [ ] Health check works with or without authentication

---

## Troubleshooting

### Issue: All requests return 500 errors

**Cause**: Database not configured or JWT_SECRET not set

**Solution**:
```bash
# Check environment variables
echo $JWT_SECRET

# Set JWT_SECRET if missing
export JWT_SECRET="your-secret-key-here"

# Verify database connection
curl http://localhost:8000/health
```

### Issue: Token appears valid but returns 401

**Causes**:
1. JWT_SECRET mismatch between token generator and backend
2. Token expired
3. Token missing required claims (sub, user_id, or id)

**Debug**:
```bash
# Decode token to inspect claims (without verification)
python3 -c "
import sys
import base64
import json

token = sys.argv[1]
parts = token.split('.')
payload = parts[1]
# Add padding if needed
payload += '=' * (4 - len(payload) % 4)
decoded = base64.urlsafe_b64decode(payload)
print(json.dumps(json.loads(decoded), indent=2))
" <your_token>
```

**Verify**:
- `exp` claim is in the future
- `sub` or `user_id` claim exists
- Token was signed with same JWT_SECRET as backend

---

## Automated Test Suite

Run the complete automated test suite:

```bash
# Run all authentication error tests
python -m pytest tests/test_auth_errors.py -v

# Run with coverage
python -m pytest tests/test_auth_errors.py --cov=app/auth --cov-report=term

# Run specific test class
python -m pytest tests/test_auth_errors.py::TestAuthenticationErrors -v
```

---

## References

- Spec: `/specs/002-auth-security/spec.md` - User Story 4
- API Contract: `/specs/002-auth-security/contracts/protected-api.yaml`
- FR-023: Standardized error response requirements
- RFC 7235: HTTP Authentication (WWW-Authenticate header)
