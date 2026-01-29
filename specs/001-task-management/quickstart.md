# Quickstart Guide: Task Management Implementation

**Feature**: 001-task-management | **Date**: 2026-01-29 | **Phase**: 1 (Design)

## Overview

This quickstart guide provides implementation guidance for the Task Management feature. It is intended for developers (or AI agents) implementing the backend API, frontend UI, and database schema based on the specifications in this directory.

**Prerequisites**:
- Feature specification: [spec.md](./spec.md)
- Implementation plan: [plan.md](./plan.md)
- Architectural decisions: [research.md](./research.md)
- Data model: [data-model.md](./data-model.md)
- API contracts: [contracts/tasks-api.yaml](./contracts/tasks-api.yaml)

## Implementation Sequence

### Phase 1: Database Schema (Database Agent)

**Agent**: `neon-db-manager`

**Tasks**:
1. Create `tasks` table with proper schema
2. Add foreign key constraint to `users` table
3. Create indexes on `user_id`, `completed`, and `created_at`
4. Generate migration script (Alembic)
5. Test migration on development database

**Schema Definition**:
```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
```

**Validation**:
- Verify `users` table exists (prerequisite for foreign key)
- Confirm indexes created successfully
- Test foreign key constraint enforcement

---

### Phase 2: Backend API (Backend Agent + Auth Agent)

**Agents**: `fastapi-backend-dev` (primary), `auth-security-specialist` (JWT middleware)

#### Step 2.1: JWT Authentication Middleware (Auth Agent)

**Tasks**:
1. Create JWT verification middleware (`backend/app/auth/jwt.py`)
2. Implement `get_current_user` dependency for FastAPI
3. Extract user_id from JWT token claims
4. Handle token validation errors (expired, invalid signature, missing token)

**Example Middleware**:
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> int:
    """Extract and validate user ID from JWT token."""
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
```

#### Step 2.2: SQLModel Task Model (Backend Agent)

**Tasks**:
1. Create Task SQLModel (`backend/app/models/task.py`)
2. Define relationships to User model
3. Add validation constraints

**Example Model**:
```python
from sqlmodel import Field, SQLModel
from datetime import datetime
from typing import Optional

class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    title: str = Field(max_length=500, index=False)
    description: Optional[str] = Field(default=None, max_length=5000)
    completed: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

#### Step 2.3: Pydantic Schemas (Backend Agent)

**Tasks**:
1. Create request/response schemas (`backend/app/schemas/task.py`)
2. Add validation logic (title trimming, non-whitespace check)

**Example Schemas**:
```python
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=5000)

    @validator('title')
    def title_must_not_be_whitespace(cls, v):
        if not v.strip():
            raise ValueError('Title must contain non-whitespace characters')
        return v.strip()

class TaskUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=5000)

    @validator('title')
    def title_must_not_be_whitespace(cls, v):
        if not v.strip():
            raise ValueError('Title must contain non-whitespace characters')
        return v.strip()

class TaskResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

#### Step 2.4: API Endpoints (Backend Agent)

**Tasks**:
1. Create task router (`backend/app/api/v1/tasks.py`)
2. Implement all CRUD endpoints (see contracts/tasks-api.yaml)
3. Apply JWT middleware to all endpoints
4. Enforce user_id filtering on all queries

**Example Router**:
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from app.auth.jwt import get_current_user
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.database import get_session

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("", response_model=List[TaskResponse])
async def list_tasks(
    user_id: int = Depends(get_current_user),
    completed: Optional[bool] = None,
    session: Session = Depends(get_session)
):
    """List all tasks for authenticated user."""
    query = select(Task).where(Task.user_id == user_id)
    if completed is not None:
        query = query.where(Task.completed == completed)
    query = query.order_by(Task.created_at.desc())
    tasks = session.exec(query).all()
    return tasks

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create a new task for authenticated user."""
    task = Task(
        user_id=user_id,
        title=task_data.title,
        description=task_data.description,
        completed=False
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return task

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get a single task by ID."""
    task = session.exec(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update task title and description."""
    task = session.exec(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.title = task_data.title
    task.description = task_data.description
    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)
    return task

@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Delete a task permanently."""
    task = session.exec(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    session.delete(task)
    session.commit()
    return {"success": True, "data": {"message": "Task deleted successfully"}}

@router.patch("/{task_id}/complete", response_model=TaskResponse)
async def toggle_task_completion(
    task_id: int,
    user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Toggle task completion status."""
    task = session.exec(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.completed = not task.completed
    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)
    return task
```

#### Step 2.5: Backend Testing (Backend Agent)

**Tasks**:
1. Write API contract tests (`backend/tests/test_tasks_api.py`)
2. Write authorization tests (`backend/tests/test_authorization.py`)
3. Write validation tests (`backend/tests/test_validation.py`)

**Test Categories**:
- **Contract Tests**: Verify all endpoints match OpenAPI spec
- **Authorization Tests**: Verify user isolation (User A can't access User B's tasks)
- **Validation Tests**: Verify input validation (empty title, long strings, etc.)

---

### Phase 3: Frontend UI (Frontend Agent)

**Agent**: `nextjs-frontend-builder`

#### Step 3.1: API Client (Frontend Agent)

**Tasks**:
1. Create task API client (`frontend/lib/api/tasks.ts`)
2. Implement fetch wrappers for all endpoints
3. Handle authentication token injection
4. Handle error responses

**Example API Client**:
```typescript
// frontend/lib/api/tasks.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function getAuthToken(): Promise<string> {
  // Extract from auth context or localStorage
  return localStorage.getItem('token') || '';
}

export async function fetchTasks(): Promise<Task[]> {
  const token = await getAuthToken();
  const response = await fetch(`${API_URL}/api/v1/tasks`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }

  const data = await response.json();
  return data.data;
}

export async function createTask(taskData: TaskCreate): Promise<Task> {
  const token = await getAuthToken();
  const response = await fetch(`${API_URL}/api/v1/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(taskData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  const data = await response.json();
  return data.data;
}

// Similar functions for updateTask, deleteTask, toggleComplete...
```

#### Step 3.2: Task List Page (Frontend Agent)

**Tasks**:
1. Create task list page (`frontend/app/(dashboard)/tasks/page.tsx`)
2. Fetch tasks from API (Server Component)
3. Display task list with completion indicators
4. Add create task link/button

**Example Page**:
```typescript
// frontend/app/(dashboard)/tasks/page.tsx
import { fetchTasks } from '@/lib/api/tasks';
import TaskList from '@/components/tasks/TaskList';

export default async function TasksPage() {
  const tasks = await fetchTasks();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Tasks</h1>
      <TaskList tasks={tasks} />
    </div>
  );
}
```

#### Step 3.3: Task Components (Frontend Agent)

**Tasks**:
1. Create TaskList component (`frontend/components/tasks/TaskList.tsx`)
2. Create TaskItem component (`frontend/components/tasks/TaskItem.tsx`)
3. Create TaskForm component (`frontend/components/tasks/TaskForm.tsx`)
4. Implement completion checkbox toggle
5. Implement delete confirmation

**Example Components**:
```typescript
// frontend/components/tasks/TaskItem.tsx
'use client';

import { Task } from '@/lib/types';
import { toggleTaskCompletion, deleteTask } from '@/lib/api/tasks';
import { useRouter } from 'next/navigation';

export default function TaskItem({ task }: { task: Task }) {
  const router = useRouter();

  const handleToggle = async () => {
    await toggleTaskCompletion(task.id);
    router.refresh(); // Refresh server component
  };

  const handleDelete = async () => {
    if (confirm('Delete this task?')) {
      await deleteTask(task.id);
      router.refresh();
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border rounded">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={handleToggle}
      />
      <span className={task.completed ? 'line-through' : ''}>
        {task.title}
      </span>
      <button onClick={handleDelete} className="ml-auto text-red-500">
        Delete
      </button>
    </div>
  );
}
```

#### Step 3.4: Create/Edit Task Forms (Frontend Agent)

**Tasks**:
1. Create form for new tasks (`frontend/app/(dashboard)/tasks/new/page.tsx`)
2. Create form for editing tasks (`frontend/app/(dashboard)/tasks/[id]/edit/page.tsx`)
3. Implement form validation (client-side matching backend rules)
4. Handle submission and error display

---

## Testing Strategy

### Backend Testing Checklist

**API Contract Tests**:
- [ ] POST /tasks creates task with valid data
- [ ] GET /tasks returns only authenticated user's tasks
- [ ] GET /tasks/{id} returns task details
- [ ] PUT /tasks/{id} updates title and description
- [ ] DELETE /tasks/{id} removes task
- [ ] PATCH /tasks/{id}/complete toggles completion status

**Authorization Tests**:
- [ ] User A cannot access User B's tasks via GET /tasks/{id}
- [ ] User A cannot update User B's tasks via PUT /tasks/{id}
- [ ] User A cannot delete User B's tasks via DELETE /tasks/{id}
- [ ] User A cannot toggle User B's tasks via PATCH /tasks/{id}/complete
- [ ] Missing JWT token returns 401 Unauthorized
- [ ] Invalid JWT token returns 401 Unauthorized

**Validation Tests**:
- [ ] Empty title returns validation error
- [ ] Whitespace-only title returns validation error
- [ ] Title > 500 characters returns validation error
- [ ] Description > 5000 characters returns validation error
- [ ] Special characters and emojis in title/description are preserved

### Frontend Testing Checklist

**Manual Acceptance Tests** (from spec.md User Stories):

**User Story 1: Create and View**:
- [ ] Create task with title "Buy groceries" → appears in list
- [ ] Create task with title and description → both fields preserved
- [ ] View task list → shows only my tasks, not other users' tasks
- [ ] Create 6th task → total count shows 6 tasks

**User Story 2: Mark Complete**:
- [ ] Mark incomplete task as complete → status changes, visual indicator appears
- [ ] Toggle completed task back to incomplete → status reverts
- [ ] View list with mixed completion states → can distinguish complete from incomplete
- [ ] Refresh page after marking complete → task remains complete

**User Story 3: Update Task**:
- [ ] Update task title → change is immediately visible
- [ ] Update task description → change persists
- [ ] Update completed task → remains marked as complete
- [ ] Attempt to clear title → system prevents update

**User Story 4: Delete Task**:
- [ ] Delete task → permanently removed from list
- [ ] Refresh after delete → task does not reappear
- [ ] Attempt to delete another user's task → error response
- [ ] Delete completed task → deletion succeeds

**User Story 5: Visual Filtering**:
- [ ] View mixed tasks → complete tasks visually distinguished
- [ ] Empty task list → helpful message displayed
- [ ] View 10 tasks → all displayed in consistent format
- [ ] Page load → task count displayed

---

## Environment Setup

### Backend Environment Variables

Create `backend/.env`:
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT Authentication
JWT_SECRET=your-secret-key-here-minimum-32-characters
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=24

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:3000
```

### Frontend Environment Variables

Create `frontend/.env.local`:
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Better Auth Configuration (if needed)
AUTH_SECRET=your-better-auth-secret
AUTH_URL=http://localhost:3000
```

---

## Development Workflow

### 1. Start Database
```bash
# Ensure Neon PostgreSQL is running and accessible
# Run migrations if needed
cd backend
alembic upgrade head
```

### 2. Start Backend
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

### 3. Start Frontend
```bash
cd frontend
npm run dev
```

### 4. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs (Swagger UI)

---

## Common Issues & Solutions

### Issue: JWT Token Not Being Sent

**Solution**: Verify token is stored and retrieved correctly in API client. Check browser DevTools Network tab for Authorization header.

### Issue: CORS Errors

**Solution**: Add frontend URL to `CORS_ORIGINS` in backend configuration.

### Issue: Foreign Key Constraint Error

**Solution**: Ensure `users` table exists before creating `tasks` table. User with `user_id` must exist.

### Issue: Validation Errors Not Displaying

**Solution**: Check error response format matches frontend expectations. Ensure error details are extracted and displayed.

---

## Next Steps

After completing implementation:

1. Run all backend tests: `pytest backend/tests/`
2. Run manual frontend acceptance tests (checklist above)
3. Generate tasks.md via `/sp.tasks` command
4. Execute tasks via `/sp.implement` command
5. Create commit and PR when feature is complete

---

## Reference Documents

- **Feature Specification**: [spec.md](./spec.md) - What to build
- **Implementation Plan**: [plan.md](./plan.md) - How to build it
- **Architectural Decisions**: [research.md](./research.md) - Why we build it this way
- **Data Model**: [data-model.md](./data-model.md) - Database schema and validation
- **API Contracts**: [contracts/tasks-api.yaml](./contracts/tasks-api.yaml) - REST API specification

For questions or clarifications, refer to the spec.md acceptance criteria and functional requirements.
