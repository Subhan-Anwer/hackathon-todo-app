# Testing Guide - Authentication & Route Protection

**Feature**: 002-auth-security (Tasks T031-T037)
**Date**: 2026-01-29

## Overview

This guide provides step-by-step instructions to test the signout functionality, route protection middleware, and security features.

---

## Prerequisites

1. **Backend Running**:
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn main:app --reload --port 8000
   ```

2. **Frontend Running**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Environment Configured**:
   - Both `.env` (backend) and `.env.local` (frontend) properly configured
   - Database migrations applied

---

## Test Phase 7: Session Management & Sign Out

### Test T031: SignoutButton Component

**Objective**: Verify signout button clears session and redirects to signin

**Steps**:

1. **Sign in with valid credentials**:
   - Navigate to http://localhost:3000/signin
   - Enter valid email and password
   - Click "Sign In"
   - Should redirect to /tasks

2. **Verify authenticated state**:
   - Should see task list page
   - Should see "Sign Out" button in top-right corner
   - Open DevTools → Application → Cookies
   - Verify `better-auth.session_token` cookie exists

3. **Click Sign Out button**:
   - Click the red "Sign Out" button
   - Button should show "Signing out..." during process
   - Should redirect to /signin page

4. **Verify session cleared**:
   - Open DevTools → Application → Cookies
   - Verify `better-auth.session_token` cookie is removed
   - Navigate to http://localhost:3000/tasks
   - Should redirect back to /signin (route protection)

**Expected Results**:
- ✅ Sign out button visible when authenticated
- ✅ Loading state shown during signout
- ✅ Redirects to /signin after signout
- ✅ Session token cookie removed
- ✅ Cannot access protected routes after signout

---

### Test T032: Route Protection Middleware

**Objective**: Verify middleware protects routes and redirects properly

**Test Case 1: Unauthenticated Access to Protected Route**

**Steps**:
1. Clear all cookies (DevTools → Application → Clear Storage)
2. Navigate directly to http://localhost:3000/tasks
3. Observe behavior

**Expected Result**:
- ✅ Immediately redirected to /signin
- ✅ URL includes callback parameter: `/signin?callbackUrl=/tasks`

**Test Case 2: Post-Login Redirect to Original Destination**

**Steps**:
1. From step above (at /signin?callbackUrl=/tasks)
2. Sign in with valid credentials
3. Observe redirect behavior

**Expected Result**:
- ✅ After signin, redirected to /tasks (original destination)
- ✅ Not redirected to home page first

**Test Case 3: Authenticated Access to Auth Pages**

**Steps**:
1. Sign in successfully (should be at /tasks)
2. Try to navigate to http://localhost:3000/signin
3. Try to navigate to http://localhost:3000/signup

**Expected Result**:
- ✅ Both attempts redirect back to /tasks
- ✅ Cannot access signin/signup when already authenticated

**Test Case 4: Public Routes Accessible**

**Steps**:
1. Sign out or clear cookies
2. Navigate to http://localhost:3000/

**Expected Result**:
- ✅ Home page loads without redirect
- ✅ Can access public routes without authentication

---

### Test T033 & T034: Dashboard Layout with SignoutButton

**Objective**: Verify dashboard layout wraps protected pages

**Steps**:

1. **Sign in and navigate to tasks**:
   - Sign in at /signin
   - Should see tasks page with navigation bar

2. **Verify navigation structure**:
   - Top navigation bar present with white background
   - "Todo App" logo on left
   - "Sign Out" button on right
   - Content area below navigation
   - Responsive on mobile (test at 375px width)

3. **Navigate to different protected pages**:
   - Go to /tasks
   - Go to /tasks/new (if exists)
   - Navigation persists across all pages

**Expected Results**:
- ✅ Consistent navigation across all dashboard pages
- ✅ SignoutButton visible on all protected pages
- ✅ Layout responsive on mobile
- ✅ Proper spacing and visual hierarchy

---

## Test Phase 8: Polish & Security

### Test T035: CORS Configuration

**Objective**: Verify CORS allows frontend origin and blocks others

**Test Case 1: Valid Origin (Allowed)**

**Steps**:
```bash
curl -i -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  -X OPTIONS \
  http://localhost:8000/api/v1/tasks
```

**Expected Result**:
```
HTTP/1.1 200 OK
access-control-allow-origin: http://localhost:3000
access-control-allow-credentials: true
access-control-allow-methods: DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT
access-control-allow-headers: authorization, content-type
```

**Test Case 2: Invalid Origin (Blocked)**

**Steps**:
```bash
curl -i -H "Origin: http://evil.com" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  http://localhost:8000/api/v1/tasks
```

**Expected Result**:
- ✅ No `access-control-allow-origin` header returned
- ✅ Request blocked by browser CORS policy

**Test Case 3: Credentials Allowed**

**Steps**:
```bash
curl -i -H "Origin: http://localhost:3000" \
  http://localhost:8000/health
```

**Expected Result**:
```
access-control-allow-credentials: true
```

---

### Test T036: Authentication Schemas

**Objective**: Verify Pydantic schemas validate authentication data

**Test Case 1: Valid Signup Data**

**Steps**:
```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securePassword123",
    "name": "Test User"
  }'
```

**Expected Result**:
- ✅ 201 Created status
- ✅ Returns user data and token
- ✅ Password not included in response

**Test Case 2: Invalid Email Format**

**Steps**:
```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "securePassword123"
  }'
```

**Expected Result**:
- ✅ 422 Unprocessable Entity
- ✅ Error message: "value is not a valid email address"

**Test Case 3: Missing Required Field**

**Steps**:
```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Expected Result**:
- ✅ 422 Unprocessable Entity
- ✅ Error indicates "password" field required

---

### Test T037: Security Audit Verification

**Objective**: Verify all security checklist items

**Manual Verification Steps**:

1. **JWT Secret Strength**:
   ```bash
   # Backend .env
   cat backend/.env | grep JWT_SECRET
   # Should be 44 characters (base64 encoded 256 bits)
   ```

2. **No Secrets in Git**:
   ```bash
   git log --all --full-history -- "*/.env" "*/.env.local"
   # Should return no results
   ```

3. **Protected Endpoints Use Dependency**:
   ```bash
   grep -r "get_current_user" backend/app/api/v1/tasks.py
   # Should show all CRUD endpoints use this dependency
   ```

4. **User ID from JWT Only**:
   ```bash
   grep -r "user_id" backend/app/schemas/task.py
   # TaskCreate and TaskUpdate should NOT have user_id field
   ```

5. **Ownership Verification**:
   ```bash
   # Check update endpoint has ownership check
   grep -A 10 "def update_task" backend/app/api/v1/tasks.py | grep "user_id"
   ```

**Expected Results**: All items in security audit document verified ✅

---

## Integration Testing

### End-to-End User Flow Test

**Scenario**: Complete user journey from signup to task management

**Steps**:

1. **Signup**:
   - Navigate to /signup
   - Enter email, password, name
   - Submit form
   - Should redirect to /tasks
   - Session token cookie set

2. **Create Task**:
   - Click "New Task"
   - Fill in task details
   - Submit
   - Should see task in list

3. **Signout**:
   - Click "Sign Out"
   - Redirected to /signin
   - Session cleared

4. **Signin Again**:
   - Enter same credentials
   - Should redirect to /tasks
   - Should see previously created task

5. **Access Restriction**:
   - Create new user account (different email)
   - Sign in as new user
   - Verify cannot see first user's tasks

**Expected Results**:
- ✅ Complete flow works without errors
- ✅ Data persists across sessions
- ✅ User isolation maintained

---

## Performance Testing

### Load Test: Concurrent Sign Ins

**Objective**: Verify system handles multiple simultaneous authentications

**Steps**:
```bash
# Using Apache Bench (install with: sudo apt-get install apache2-utils)
ab -n 100 -c 10 -p signin.json -T application/json \
  http://localhost:8000/api/v1/auth/signin
```

**Expected Results**:
- ✅ All requests complete successfully
- ✅ Average response time < 200ms
- ✅ No failed requests

---

## Error Handling Testing

### Test Error Scenarios

**Test Case 1: Invalid Credentials**
```bash
curl -X POST http://localhost:8000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrongpassword"}'
```

**Expected**: 401 with generic error message (no user info leaked)

**Test Case 2: Expired Token**
- Set JWT_EXPIRY_HOURS=0.001 (temporary)
- Sign in
- Wait 5 seconds
- Try to access /api/v1/tasks
- Should get 401 Token expired

**Test Case 3: Malformed Token**
```bash
curl -H "Authorization: Bearer not.a.valid.token" \
  http://localhost:8000/api/v1/tasks
```

**Expected**: 401 Invalid credentials

---

## Browser Compatibility Testing

Test the following browsers:

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

**Test Features**:
- Sign in/Sign out
- Route protection redirects
- Cookie handling
- Responsive layout

---

## Accessibility Testing

### WCAG Compliance

**Test Tools**:
- Lighthouse (Chrome DevTools)
- axe DevTools extension
- Keyboard navigation

**Test Checklist**:
- [ ] Sign out button keyboard accessible (Tab + Enter)
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Screen reader announces button state
- [ ] Loading state announced

---

## Test Results Template

```markdown
## Test Execution Report

**Date**: YYYY-MM-DD
**Tester**: [Name]
**Environment**: Development / Staging / Production

### Phase 7: Session Management
- [ ] T031: SignoutButton - PASS / FAIL
- [ ] T032: Route Protection - PASS / FAIL
- [ ] T033: Dashboard Layout - PASS / FAIL
- [ ] T034: Protected Layout - PASS / FAIL

### Phase 8: Polish & Security
- [ ] T035: CORS Configuration - PASS / FAIL
- [ ] T036: Auth Schemas - PASS / FAIL
- [ ] T037: Security Audit - PASS / FAIL

### Issues Found:
1. [Issue description]
   - Severity: Critical / High / Medium / Low
   - Steps to reproduce
   - Expected vs Actual

### Sign-off:
All critical tests passed: YES / NO
Ready for production: YES / NO
```

---

## Automated Testing

### Run Backend Tests

```bash
cd backend
source venv/bin/activate
pytest tests/test_auth.py -v
pytest tests/test_tasks.py -v
```

### Run Frontend Tests (if implemented)

```bash
cd frontend
npm test
```

---

## Troubleshooting Common Issues

### Issue: Infinite redirect loop
**Cause**: Middleware matching pattern too broad
**Fix**: Check `middleware.ts` matcher config

### Issue: CORS error in browser
**Cause**: CORS_ORIGINS not including frontend URL
**Fix**: Update backend/.env CORS_ORIGINS

### Issue: 401 on valid token
**Cause**: JWT_SECRET mismatch between frontend/backend
**Fix**: Ensure both use same BETTER_AUTH_SECRET

### Issue: SignoutButton not appearing
**Cause**: Dashboard layout not wrapping route
**Fix**: Verify route inside (dashboard) folder

---

## Next Steps After Testing

1. ✅ All tests pass → Mark tasks T031-T037 as complete
2. ⚠️ Some tests fail → Document issues and fix before proceeding
3. Document test results in task management system
4. Create PHR (Prompt History Record) for this work session
5. Proceed to next feature or prepare for production deployment

---

**Testing Guide Version**: 1.0
**Last Updated**: 2026-01-29
