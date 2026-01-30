# Quick Start Testing Guide - Tasks T031-T037

**Feature**: Authentication Phase 7 & 8 (Signout, Route Protection, Security)
**Quick Testing**: 5 minutes to verify all functionality

---

## Prerequisites

```bash
# Terminal 1: Start Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2: Start Frontend
cd frontend
npm run dev
```

---

## Quick Test Sequence (5 minutes)

### Test 1: Sign Out Functionality (1 min)

1. **Navigate**: http://localhost:3000/signin
2. **Sign In**: Use existing account or sign up
3. **Verify**: Should see /tasks page with "Sign Out" button in top-right
4. **Click**: "Sign Out" button
5. **Expected**:
   - ✅ Button shows "Signing out..."
   - ✅ Redirects to /signin
   - ✅ Open DevTools → Application → Cookies → Verify `better-auth.session_token` removed

**Status**: PASS / FAIL

---

### Test 2: Route Protection (2 min)

#### Part A: Unauthenticated Access
1. **Ensure**: Signed out (cookies cleared)
2. **Navigate**: http://localhost:3000/tasks
3. **Expected**: ✅ Immediately redirects to /signin?callbackUrl=/tasks

#### Part B: Callback URL Preservation
4. **Sign In**: Enter credentials at /signin
5. **Expected**: ✅ After signin, redirects back to /tasks (not home page)

#### Part C: Authenticated Cannot Access Auth Pages
6. **While Signed In**: Try to visit http://localhost:3000/signin
7. **Expected**: ✅ Redirects to /tasks
8. **Try**: http://localhost:3000/signup
9. **Expected**: ✅ Redirects to /tasks

**Status**: PASS / FAIL

---

### Test 3: Dashboard Layout (1 min)

1. **Navigate**: http://localhost:3000/tasks (while signed in)
2. **Verify Navigation Bar**:
   - ✅ White bar at top with shadow
   - ✅ "Todo App" text on left
   - ✅ Red "Sign Out" button on right
   - ✅ Content area below with task list

3. **Test Responsiveness**:
   - Open DevTools → Toggle device toolbar
   - Resize to mobile (375px)
   - ✅ Navigation still functional on mobile
   - ✅ Sign Out button visible

**Status**: PASS / FAIL

---

### Test 4: CORS Configuration (30 sec)

```bash
# From terminal
curl -i -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  http://localhost:8000/api/v1/tasks
```

**Expected Output**:
```
access-control-allow-origin: http://localhost:3000
access-control-allow-credentials: true
```

**Status**: PASS / FAIL

---

### Test 5: Security Validation (30 sec)

#### Invalid Email Format
```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "not-an-email", "password": "test123"}'
```

**Expected**: `422 Unprocessable Entity` with email validation error

#### Unauthorized Access
```bash
curl http://localhost:8000/api/v1/tasks
```

**Expected**: `401 Unauthorized` or `403 Forbidden`

**Status**: PASS / FAIL

---

## Complete User Flow Test (3 min)

### Scenario: New User Journey

1. **Sign Up**:
   - Go to http://localhost:3000/signup
   - Email: `testuser@example.com`
   - Password: `SecurePass123`
   - Name: `Test User`
   - Click "Sign Up"
   - ✅ Should redirect to /tasks
   - ✅ Navigation bar with "Sign Out" visible

2. **Create Task**:
   - Click "New Task"
   - Fill in task details
   - Submit
   - ✅ Task appears in list

3. **Sign Out**:
   - Click "Sign Out" button
   - ✅ Redirects to /signin
   - ✅ Cookies cleared

4. **Sign In Again**:
   - Enter same email/password
   - Click "Sign In"
   - ✅ Redirects to /tasks
   - ✅ Previously created task still visible

5. **User Isolation**:
   - Sign out
   - Create new account (different email)
   - Sign in with new account
   - ✅ Cannot see first user's tasks
   - ✅ Empty task list

**Status**: PASS / FAIL

---

## Red Flags (Stop & Fix If You See These)

🚨 **Critical Issues**:
- Infinite redirect loop between /signin and /tasks
- SignoutButton not visible on /tasks page
- CORS error in browser console when calling API
- 401 error with valid authentication token
- Session token not removed after signout

⚠️ **Warning Signs**:
- Sign out button doesn't show loading state
- Can access /tasks without being signed in
- Can access /signin while already authenticated
- Task list shows other users' tasks

---

## Troubleshooting

### Issue: Infinite Redirect Loop
**Symptom**: Browser keeps redirecting between pages
**Fix**: Check `middleware.ts` - ensure matcher pattern excludes static files
**Verify**:
```typescript
matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
```

### Issue: CORS Error
**Symptom**: Browser console shows CORS policy error
**Fix**: Update `backend/.env`:
```bash
CORS_ORIGINS=http://localhost:3000
```
**Restart**: Backend server

### Issue: 401 with Valid Token
**Symptom**: Authenticated user gets 401 on API calls
**Fix**: Ensure `BETTER_AUTH_SECRET` matches in both:
- `backend/.env`
- `frontend/.env.local`
**Restart**: Both servers

### Issue: SignoutButton Not Visible
**Symptom**: No sign out button on tasks page
**Fix**: Verify `/tasks` page is inside `(dashboard)` folder
**Check**:
```
app/(dashboard)/tasks/page.tsx  ✅
app/tasks/page.tsx              ❌ Wrong location
```

---

## Quick Verification Commands

### Check Files Exist
```bash
# From project root
ls frontend/components/auth/SignoutButton.tsx
ls frontend/middleware.ts
ls frontend/app/\(dashboard\)/layout.tsx
ls backend/app/schemas/auth.py
ls backend/docs/security-audit.md
```

**Expected**: All files should exist (no "No such file" errors)

### Check Environment Variables
```bash
# Backend
cat backend/.env | grep -E "CORS_ORIGINS|JWT_SECRET|BETTER_AUTH_SECRET"

# Frontend
cat frontend/.env.local | grep -E "NEXT_PUBLIC_API_URL|BETTER_AUTH_SECRET"
```

**Expected**: All variables defined with values (not empty)

### Check Servers Running
```bash
# Check backend
curl http://localhost:8000/health

# Check frontend
curl http://localhost:3000
```

**Expected**: Both return HTTP 200 responses

---

## Test Results Summary

```
✅ Test 1: Sign Out Functionality       PASS / FAIL
✅ Test 2: Route Protection             PASS / FAIL
✅ Test 3: Dashboard Layout             PASS / FAIL
✅ Test 4: CORS Configuration           PASS / FAIL
✅ Test 5: Security Validation          PASS / FAIL
✅ Complete User Flow                   PASS / FAIL

Overall Status: _____ / 6 tests passed
```

---

## Next Steps After Testing

### If All Tests Pass ✅
1. Mark tasks T031-T037 as complete
2. Create Prompt History Record (PHR)
3. Commit changes to git
4. Proceed to next feature

### If Some Tests Fail ⚠️
1. Document failing tests
2. Review error messages
3. Check troubleshooting section above
4. Consult detailed testing-guide.md
5. Fix issues and re-test

### If Critical Failures 🚨
1. Check logs: backend terminal and browser console
2. Verify environment variables
3. Confirm both servers running
4. Review security-audit.md for requirements
5. Consult T031-T037-implementation-summary.md

---

## Reference Documents

- **Detailed Testing**: `backend/docs/testing-guide.md`
- **Implementation Details**: `backend/docs/T031-T037-implementation-summary.md`
- **Security Audit**: `backend/docs/security-audit.md`
- **Error Reference**: `backend/docs/auth-error-responses-reference.md`

---

**Quick Start Version**: 1.0
**Last Updated**: 2026-01-29
**Testing Time**: ~5 minutes for quick tests, ~10 minutes with user flow
