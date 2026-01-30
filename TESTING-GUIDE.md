# Testing Guide - Frontend Integration (003)

This guide covers all testing requirements for the frontend integration feature (Tasks T059-T063).

## Prerequisites

Before testing, ensure both servers are running:

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## T059: Lighthouse Accessibility Audit ⚡

**Goal**: Achieve accessibility score > 90

### Running Lighthouse

1. **Open Chrome DevTools** (F12)
2. **Navigate to "Lighthouse" tab**
3. **Configure audit**:
   - Categories: Select "Accessibility"
   - Device: Desktop and Mobile
4. **Run audit** on these pages:
   - `/tasks` (task list)
   - `/tasks/new` (create task)
   - `/signin` (authentication)

### Expected Results

**Target Scores**:
- ✅ Accessibility: > 90
- ✅ Best Practices: > 80
- ✅ Performance: > 70 (acceptable for dev)

### Common Issues & Fixes

| Issue | Fix Applied |
|-------|-------------|
| Missing alt text | All images use Next.js Image with alt |
| Low contrast text | Using Tailwind's gray-900/gray-600 |
| Missing ARIA labels | All icon buttons have aria-label |
| Form labels missing | All inputs have proper label associations |
| Focus indicators | All interactive elements have focus:ring |

### Verification Checklist

- [ ] All icon buttons have aria-label attributes
- [ ] All form inputs have associated labels
- [ ] Color contrast ratios meet WCAG AA (4.5:1)
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Screen reader can access all content
- [ ] No duplicate IDs in DOM
- [ ] Landmarks are properly used (nav, main, aside)

---

## T060: Authentication Flow End-to-End 🔐

**Goal**: Verify complete authentication lifecycle

### Test Scenarios

#### 1. Sign Up Flow

**Steps**:
1. Navigate to `/signup`
2. Fill in form:
   - Email: `test@example.com`
   - Password: `TestPass123!`
   - Name: `Test User` (optional)
3. Submit form

**Expected**:
- ✅ Form validates (email format, password strength)
- ✅ Submit button shows loading state
- ✅ User is created in database
- ✅ JWT token is set in httpOnly cookie
- ✅ Redirected to `/tasks`
- ✅ User session is active

**Verification**:
```bash
# Check user in database
psql $DATABASE_URL -c "SELECT id, email, name FROM user WHERE email='test@example.com';"

# Check session cookie in browser DevTools
# Application > Cookies > better-auth.session_token (should exist)
```

#### 2. Sign In Flow

**Steps**:
1. Sign out if currently signed in
2. Navigate to `/signin`
3. Fill in form:
   - Email: `test@example.com`
   - Password: `TestPass123!`
4. Submit form

**Expected**:
- ✅ Form validates (required fields)
- ✅ Submit button shows loading state
- ✅ Credentials are verified against database
- ✅ JWT token is set in httpOnly cookie
- ✅ Redirected to `/tasks` (or callbackUrl if set)
- ✅ User session is active

**Error Cases**:
- Wrong password → "Invalid credentials" error
- Non-existent email → "Invalid credentials" error (no information leakage)
- Empty fields → Validation errors shown

#### 3. Protected Route Access

**Test A**: Access without authentication

1. Open incognito window (or clear cookies)
2. Navigate to `/tasks`

**Expected**:
- ✅ Middleware redirects to `/signin`
- ✅ callbackUrl preserves intended destination: `/signin?callbackUrl=/tasks`

**Test B**: Access with authentication

1. Sign in as `test@example.com`
2. Navigate to `/tasks`

**Expected**:
- ✅ Page loads successfully
- ✅ User's tasks are displayed
- ✅ No redirect occurs

#### 4. Sign Out Flow

**Steps**:
1. While signed in, click "Sign Out" button
2. Observe behavior

**Expected**:
- ✅ Button shows loading state
- ✅ Session token is cleared (check DevTools cookies)
- ✅ Redirected to `/signin`
- ✅ Attempting to access `/tasks` redirects back to `/signin`

**Verification**:
```bash
# Check session is invalidated
# In browser DevTools: Application > Cookies
# better-auth.session_token should be deleted
```

#### 5. Token Expiration

**Steps**:
1. Sign in successfully
2. Wait 24 hours (or manually expire token if possible)
3. Try to access `/tasks` or perform an action

**Expected**:
- ✅ Backend returns 401 Unauthorized
- ✅ Frontend clears session and redirects to `/signin`
- ✅ Error message shown: "Session expired, please sign in again"

---

## T061: Task CRUD Operations End-to-End ✅

**Goal**: Verify complete task management lifecycle

### Prerequisites

- User is signed in
- At least 2 users exist for multi-user isolation testing

### Test Scenarios

#### 1. Create Task

**Steps**:
1. Navigate to `/tasks`
2. Click "New Task" button
3. Fill in form:
   - Title: "Buy groceries"
   - Description: "Milk, eggs, bread"
4. Click "Create Task"

**Expected**:
- ✅ Form validation works (title required, max lengths)
- ✅ Submit button shows loading state
- ✅ API call to `POST /api/v1/tasks` succeeds
- ✅ Task is created with user_id from JWT
- ✅ Redirected to `/tasks`
- ✅ New task appears in list

**Verification**:
```bash
# Check task in database
psql $DATABASE_URL -c "SELECT id, title, description, user_id FROM tasks WHERE title='Buy groceries';"
```

#### 2. Read Tasks

**Steps**:
1. Navigate to `/tasks`
2. Observe task list

**Expected**:
- ✅ Loading skeleton appears briefly
- ✅ All user's tasks are displayed
- ✅ Each task shows:
  - Title
  - Description (if present)
  - Completion checkbox
  - Created date
  - Edit and Delete buttons
- ✅ Empty state shown if no tasks
- ✅ Tasks sorted by creation date (newest first)

#### 3. Update Task

**Steps**:
1. Click "Edit" on a task
2. Modify title: "Buy groceries" → "Buy groceries and snacks"
3. Modify description: Add "and chips"
4. Click "Save Changes"

**Expected**:
- ✅ Form pre-fills with existing data
- ✅ Validation works
- ✅ Submit button shows loading state
- ✅ API call to `PUT /api/v1/tasks/{id}` succeeds
- ✅ Redirected to `/tasks`
- ✅ Updated task shows new data
- ✅ Updated_at timestamp is updated

**Verification**:
```bash
# Check update in database
psql $DATABASE_URL -c "SELECT title, description, updated_at FROM tasks WHERE id='<task-id>';"
```

#### 4. Toggle Completion

**Steps**:
1. On task list, click checkbox of incomplete task
2. Observe behavior
3. Click checkbox again to uncheck

**Expected**:
- ✅ Checkbox toggles immediately (optimistic update)
- ✅ Task title gets strikethrough and gray color when complete
- ✅ API call to `PATCH /api/v1/tasks/{id}/toggle` succeeds
- ✅ On error, checkbox reverts to previous state
- ✅ Completed_at timestamp set/cleared in database

#### 5. Delete Task

**Steps**:
1. Click "Delete" button on a task
2. Confirmation dialog appears
3. Click "Cancel" → dialog closes, task remains
4. Click "Delete" again
5. Click "Confirm" in dialog

**Expected**:
- ✅ Confirmation dialog shows task title
- ✅ Escape key closes dialog
- ✅ Click outside closes dialog
- ✅ Cancel preserves task
- ✅ Confirm button shows loading state
- ✅ API call to `DELETE /api/v1/tasks/{id}` succeeds
- ✅ Task removed from list immediately
- ✅ Dialog closes
- ✅ Task deleted from database

**Verification**:
```bash
# Verify deletion
psql $DATABASE_URL -c "SELECT COUNT(*) FROM tasks WHERE id='<deleted-task-id>';"
# Should return 0
```

### Multi-User Isolation Testing

**Critical Test**: Verify users can only access their own tasks

**Setup**:
1. Create User A: `usera@example.com`
2. Create User B: `userb@example.com`
3. User A creates 3 tasks
4. User B creates 2 tasks

**Test 1**: Read isolation
1. Sign in as User A
2. Navigate to `/tasks`
3. Expected: See only 3 tasks (User A's)

**Test 2**: Update isolation
1. Sign in as User B
2. Try to access User A's task edit page: `/tasks/{user-a-task-id}/edit`
3. Expected: 404 Not Found or 403 Forbidden

**Test 3**: Delete isolation
1. Sign in as User B
2. Attempt to delete User A's task via API:
   ```bash
   curl -X DELETE http://localhost:8000/api/v1/tasks/{user-a-task-id} \
     -H "Authorization: Bearer {user-b-jwt-token}"
   ```
3. Expected: 404 Not Found (task doesn't exist for this user)

**Verification**:
```bash
# All tasks should still exist
psql $DATABASE_URL -c "SELECT id, user_id FROM tasks ORDER BY created_at;"
```

---

## T062: Responsive Design on Real Devices 📱

**Goal**: Verify mobile-first responsive design works across devices

### Test Devices

**Required**:
- Mobile phone (< 640px)
- Tablet (640px - 1024px)
- Desktop (> 1024px)

**Alternative**: Use Chrome DevTools Device Mode

### Test Scenarios

#### 1. Mobile Phone (< 640px)

**Pages to Test**: `/tasks`, `/tasks/new`, `/signin`

**Checklist**:
- [ ] Navigation fits on screen without horizontal scroll
- [ ] Task cards stack vertically (1 column)
- [ ] Buttons are touch-friendly (min 44x44px)
- [ ] Form inputs are full-width
- [ ] Text is readable without zooming
- [ ] Hamburger menu works (if implemented)
- [ ] Modal dialogs fit within viewport
- [ ] Typography scales appropriately

**Task List** (`/tasks`):
- Header: "My Tasks" stacks above "New Task" button
- Task cards: 1 column, full width
- Edit/Delete buttons: Large enough for thumb
- Checkbox: 20px × 20px (easy to tap)

**Forms** (`/tasks/new`, `/signin`):
- Input fields: Full width, comfortable padding
- Submit/Cancel buttons: Full width or 50/50 split
- Error messages: Clearly visible
- Labels: Above inputs, not floating

**Confirmation Dialog**:
- Fits in viewport with padding
- Buttons: Stacked vertically or 50/50
- Text: Readable size (16px+)

#### 2. Tablet (640px - 1024px)

**Task List**:
- [ ] Task cards display in 2-column grid
- [ ] Navigation bar uses flexbox (title left, buttons right)
- [ ] Forms are centered with max-width

**Typography**:
- [ ] Text size increases slightly (sm: breakpoint)
- [ ] Headings are more prominent

#### 3. Desktop (> 1024px)

**Task List**:
- [ ] Task cards display in 3-column grid
- [ ] Maximum content width enforced (max-w-7xl)
- [ ] Hover states work on interactive elements
- [ ] Focus states visible for keyboard users

### Chrome DevTools Testing

**Steps**:
1. Open DevTools (F12)
2. Click "Toggle Device Toolbar" (Ctrl+Shift+M)
3. Test these presets:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1920px)

**Rotate Device**:
- Test landscape and portrait orientations
- Verify layout adapts correctly

### Responsive Typography Check

**Verify these classes are applied**:

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Page h1 | text-2xl | text-3xl | text-3xl |
| Task title | text-base | text-lg | text-lg |
| Task description | text-sm | text-base | text-base |
| Buttons | text-sm | text-base | text-base |

---

## T063: Error Handling and Recovery 🚨

**Goal**: Verify all error scenarios are handled gracefully

### Error Scenarios

#### 1. Network Errors

**Simulate**: Turn off backend server or disconnect internet

**Test A**: Task list fails to load
1. Stop backend server
2. Navigate to `/tasks`
3. Expected:
   - ✅ Loading skeleton appears
   - ✅ After timeout, error message: "Failed to load tasks"
   - ✅ "Retry" button available
   - ✅ Click retry → attempts to reload

**Test B**: Task creation fails
1. Fill out new task form
2. Stop backend before submitting
3. Click "Create Task"
4. Expected:
   - ✅ Submit button shows loading
   - ✅ After timeout, error message shown
   - ✅ Form data is preserved
   - ✅ User can retry after fixing connection

#### 2. API Errors

**Test A**: 401 Unauthorized
1. Manually delete session cookie
2. Try to create/edit/delete task
3. Expected:
   - ✅ 401 response triggers signout
   - ✅ Redirect to `/signin?error=unauthorized`
   - ✅ Error message: "Session expired"

**Test B**: 404 Not Found
1. Navigate to `/tasks/invalid-id-12345/edit`
2. Expected:
   - ✅ Loading state → Error state
   - ✅ Error message: "Task not found"
   - ✅ "Back to Tasks" button available

**Test C**: 422 Validation Error
1. Create task with title > 200 characters
2. Submit form
3. Expected:
   - ✅ Frontend validation catches first
   - ✅ If bypassed, backend returns 422
   - ✅ Error message shows field errors

#### 3. JavaScript Errors

**Simulate**: Trigger an unhandled error in component

**Method**: Add `throw new Error("Test error")` in component

**Test**:
1. Trigger error in TaskList component
2. Expected:
   - ✅ ErrorBoundary catches error
   - ✅ Fallback UI shown: "Something went wrong"
   - ✅ Error message displayed
   - ✅ "Try Again" button resets boundary

#### 4. Form Validation Errors

**Test A**: Required field
1. Leave title empty in task form
2. Try to submit
3. Expected:
   - ✅ Error message: "Title is required"
   - ✅ Input border turns red
   - ✅ Submit button stays enabled
   - ✅ Error disappears when field is filled

**Test B**: Max length
1. Enter 201 characters in title
2. Expected:
   - ✅ Error message: "Title must be less than 200 characters"
   - ✅ Character count shown (if implemented)

**Test C**: Email format
1. On signin, enter invalid email: "notanemail"
2. Expected:
   - ✅ Error message: "Invalid email format"

#### 5. Optimistic Update Failures

**Test**: Toggle completion fails

**Setup**: Mock API to return error on toggle

**Steps**:
1. Click checkbox to complete task
2. API call fails
3. Expected:
   - ✅ Checkbox checks immediately (optimistic)
   - ✅ After API fails, checkbox unchecks (revert)
   - ✅ Error toast/message shown
   - ✅ Task state matches database

#### 6. Route-Level Errors

**Test**: error.tsx boundary

**Simulate**: Cause error during page render

**Expected**:
- ✅ route error.tsx catches error
- ✅ Shows "Failed to Load Tasks"
- ✅ "Try Again" button calls reset()
- ✅ Error is logged to console

---

## Testing Completion Checklist

### T059: Lighthouse Audit
- [ ] Run Lighthouse on `/tasks` page
- [ ] Accessibility score > 90
- [ ] Fix any flagged issues
- [ ] Document results

### T060: Authentication Flow
- [ ] Sign up new user successfully
- [ ] Sign in with existing user
- [ ] Protected routes redirect when not authenticated
- [ ] Sign out clears session
- [ ] Token expiration handled gracefully

### T061: CRUD Operations
- [ ] Create task successfully
- [ ] Read/list tasks correctly
- [ ] Update task saves changes
- [ ] Toggle completion works with optimistic updates
- [ ] Delete task with confirmation
- [ ] Multi-user isolation verified

### T062: Responsive Design
- [ ] Tested on mobile (< 640px)
- [ ] Tested on tablet (640-1024px)
- [ ] Tested on desktop (> 1024px)
- [ ] All breakpoints work correctly
- [ ] Touch targets are adequate (44x44px)

### T063: Error Handling
- [ ] Network errors show error UI
- [ ] 401 redirects to signin
- [ ] 404 shows not found message
- [ ] Form validation works
- [ ] Optimistic updates revert on error
- [ ] ErrorBoundary catches JS errors

---

## Automated Testing (Optional)

### Run Frontend Tests

```bash
cd frontend
npm test
```

### Run Backend Tests

```bash
cd backend
pytest tests/ -v
```

### E2E Testing with Playwright (if set up)

```bash
npx playwright test
```

---

## Success Criteria

All tests must pass before marking tasks complete:

- ✅ Lighthouse accessibility score > 90
- ✅ All authentication flows work end-to-end
- ✅ All CRUD operations work correctly
- ✅ Multi-user data isolation is enforced
- ✅ Responsive design works on all device sizes
- ✅ All error scenarios are handled gracefully
- ✅ No unhandled errors in console
- ✅ All form validations work
- ✅ Loading states appear for async operations
- ✅ Error messages are user-friendly

---

## Reporting Issues

If any test fails, document:

1. **Test ID**: (e.g., T061 - Update Task)
2. **Steps to Reproduce**: Exact steps taken
3. **Expected Result**: What should happen
4. **Actual Result**: What actually happened
5. **Screenshots**: If UI issue
6. **Console Errors**: Any JavaScript errors
7. **Network**: API request/response if applicable

Create an issue in the project repository with this information.

---

## Post-Testing

Once all tests pass:

1. Mark tasks T059-T063 as complete in `specs/003-frontend-integration/tasks.md`
2. Create PHR (Prompt History Record) documenting testing session
3. Update CLAUDE.md if needed
4. Commit changes with message: "test: complete frontend integration testing (T059-T063)"
5. Consider creating a PR for review

---

**Last Updated**: 2026-01-30
**Feature**: 003-frontend-integration
**Status**: Ready for testing
