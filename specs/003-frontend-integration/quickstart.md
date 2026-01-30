# Quickstart Guide: Frontend UI & Full-Stack Integration

**Feature**: 003-frontend-integration
**Date**: 2026-01-30
**Audience**: Developers implementing the frontend

## Prerequisites

Before starting, ensure you have:

1. **Node.js 18+** installed
   ```bash
   node --version  # Should be 18.x or higher
   ```

2. **Backend API running**
   - FastAPI backend must be running on `http://localhost:8000`
   - Database migrations applied
   - Better Auth configured with JWT secret

3. **Environment variables configured**
   - Copy `.env.local.example` to `.env.local` in `frontend/` directory
   - Set required variables (see Environment Setup section)

4. **Package manager**
   - npm, yarn, or pnpm installed

---

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Create `frontend/.env.local`:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Better Auth Configuration
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# Database (if needed for Better Auth)
DATABASE_URL=postgresql://user:pass@localhost:5432/todo_db
```

### 3. Run Development Server

```bash
npm run dev
```

Frontend will be available at `http://localhost:3000`

### 4. Verify Setup

1. Navigate to `http://localhost:3000`
2. Click "Sign Up" to create an account
3. Sign in with your credentials
4. You should be redirected to `/tasks` page
5. Try creating a new task

---

## Project Structure

```
frontend/
├── app/                     # Next.js App Router pages
│   ├── (auth)/              # Unauthenticated pages
│   │   ├── signin/
│   │   └── signup/
│   ├── (dashboard)/         # Authenticated pages
│   │   └── tasks/
│   ├── api/auth/[...all]/   # Better Auth API route
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
│
├── components/              # React components
│   ├── tasks/               # Task-related components
│   ├── ui/                  # Reusable UI components
│   └── layout/              # Layout components
│
├── lib/                     # Utilities and libraries
│   ├── api/                 # API client layer
│   ├── auth/                # Authentication utilities
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Helper functions
│
├── middleware.ts            # Next.js middleware (route protection)
├── .env.local               # Environment variables (not committed)
└── package.json             # Dependencies
```

---

## Development Workflow

### Creating a New Page

1. **Determine if page is authenticated or public**
   - Public pages go in `app/(auth)/`
   - Protected pages go in `app/(dashboard)/`

2. **Create page file**
   ```typescript
   // app/(dashboard)/profile/page.tsx
   export default function ProfilePage() {
     return <div>Profile Page</div>;
   }
   ```

3. **Fetch data if needed**
   - Server Components: Use `await fetch()` directly
   - Client Components: Use `useApi()` hook

### Creating a New Component

1. **Determine component type**
   - Server Component (default): No interactivity, can fetch data on server
   - Client Component: Needs interactivity (`"use client"` directive)

2. **Create component file**
   ```typescript
   // components/tasks/TaskCard.tsx
   "use client";  // Only if client component

   export function TaskCard({ task }: { task: Task }) {
     return <div>{task.title}</div>;
   }
   ```

3. **Add to index file** (if creating multiple components)
   ```typescript
   // components/tasks/index.ts
   export { TaskCard } from "./TaskCard";
   export { TaskList } from "./TaskList";
   ```

### Adding an API Endpoint

1. **Define TypeScript types** in `lib/types/`
   ```typescript
   // lib/types/task.ts
   export interface Task {
     id: string;
     title: string;
     // ...
   }
   ```

2. **Add API function** in `lib/api/`
   ```typescript
   // lib/api/tasks.ts
   import { apiClient } from "./client";

   export const taskApi = {
     list: () => apiClient.get<Task[]>("/api/v1/tasks"),
     // ...
   };
   ```

3. **Use in components**
   ```typescript
   import { taskApi } from "@/lib/api/tasks";

   const tasks = await taskApi.list();
   ```

### Creating a Custom Hook

1. **Create hook file** in `lib/hooks/`
   ```typescript
   // lib/hooks/useTasks.ts
   "use client";

   import { useState, useEffect } from "react";
   import { taskApi } from "@/lib/api/tasks";

   export function useTasks() {
     const [tasks, setTasks] = useState<Task[]>([]);
     const [isLoading, setIsLoading] = useState(true);

     useEffect(() => {
       taskApi.list().then(setTasks).finally(() => setIsLoading(false));
     }, []);

     return { tasks, isLoading };
   }
   ```

2. **Use in Client Components**
   ```typescript
   "use client";

   import { useTasks } from "@/lib/hooks/useTasks";

   export function TaskList() {
     const { tasks, isLoading } = useTasks();

     if (isLoading) return <div>Loading...</div>;
     return <div>{tasks.map(task => ...)}</div>;
   }
   ```

---

## Common Patterns

### 1. Authenticated Data Fetching (Server Component)

```typescript
// app/(dashboard)/tasks/page.tsx
import { requireAuth } from "@/lib/auth/session";
import { fetchTasksServer } from "@/lib/api/tasks-server";

export default async function TasksPage() {
  // Redirect to signin if not authenticated
  const session = await requireAuth();

  // Fetch data on server with session cookies
  const tasks = await fetchTasksServer();

  return <TaskListClient initialTasks={tasks} />;
}
```

### 2. Interactive Data Fetching (Client Component)

```typescript
// components/tasks/TaskList.tsx
"use client";

import { useApi } from "@/lib/hooks/useApi";
import { taskApi } from "@/lib/api/tasks";

export function TaskList() {
  const { data: tasks, error, isLoading, retry } = useApi(() => taskApi.list());

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} onRetry={retry} />;
  if (!tasks || tasks.length === 0) return <EmptyState />;

  return (
    <div className="space-y-4">
      {tasks.map(task => <TaskCard key={task.id} task={task} />)}
    </div>
  );
}
```

### 3. Form Handling

```typescript
// components/tasks/TaskForm.tsx
"use client";

import { useForm } from "@/lib/hooks/useForm";
import { taskApi } from "@/lib/api/tasks";

export function TaskForm({ onSuccess }: { onSuccess: () => void }) {
  const form = useForm<TaskCreate>({
    initialValues: { title: "", description: "" },
    validate: (values) => {
      const errors: any = {};
      if (!values.title.trim()) {
        errors.title = "Title is required";
      }
      return errors;
    },
    onSubmit: async (values) => {
      await taskApi.create(values);
      onSuccess();
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <input
        type="text"
        value={form.values.title}
        onChange={(e) => form.handleChange("title", e.target.value)}
        disabled={form.isSubmitting}
      />
      {form.errors.title && <span>{form.errors.title}</span>}

      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? "Creating..." : "Create Task"}
      </button>
    </form>
  );
}
```

### 4. Protected Routes (Middleware)

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  const isProtected = request.nextUrl.pathname.startsWith("/tasks");

  if (isProtected && !session) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}
```

### 5. Error Boundaries

```typescript
// app/(dashboard)/tasks/error.tsx
"use client";

export default function TasksError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### 6. Loading States (Suspense)

```typescript
// app/(dashboard)/tasks/loading.tsx
export default function TasksLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-24" />
      ))}
    </div>
  );
}
```

---

## Testing Strategy

### Component Tests (Jest + React Testing Library)

```typescript
// components/tasks/TaskCard.test.tsx
import { render, screen } from "@testing-library/react";
import { TaskCard } from "./TaskCard";

describe("TaskCard", () => {
  it("renders task title", () => {
    const task = { id: "1", title: "Test Task", completed: false };
    render(<TaskCard task={task} />);

    expect(screen.getByText("Test Task")).toBeInTheDocument();
  });

  it("shows completed state", () => {
    const task = { id: "1", title: "Test Task", completed: true };
    render(<TaskCard task={task} />);

    expect(screen.getByRole("checkbox")).toBeChecked();
  });
});
```

### Integration Tests

```typescript
// tests/integration/tasks.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskList } from "@/components/tasks/TaskList";

describe("Task List Integration", () => {
  it("displays tasks from API", async () => {
    // Mock API response
    jest.spyOn(taskApi, "list").mockResolvedValue([
      { id: "1", title: "Task 1", completed: false },
    ]);

    render(<TaskList />);

    await waitFor(() => {
      expect(screen.getByText("Task 1")).toBeInTheDocument();
    });
  });
});
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/tasks.spec.ts
import { test, expect } from "@playwright/test";

test("user can create a task", async ({ page }) => {
  // Sign in
  await page.goto("/signin");
  await page.fill('input[type="email"]', "test@example.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');

  // Navigate to tasks
  await expect(page).toHaveURL("/tasks");

  // Create task
  await page.click("text=New Task");
  await page.fill('input[name="title"]', "Buy groceries");
  await page.click("text=Save");

  // Verify task appears
  await expect(page.locator("text=Buy groceries")).toBeVisible();
});
```

---

## Troubleshooting

### Issue: "Unauthorized" errors on API requests

**Cause**: JWT token not being sent or invalid

**Solution**:
1. Check Better Auth session exists: `await auth.api.getSession()`
2. Verify `Authorization` header is added in API client
3. Check backend JWT secret matches frontend configuration

### Issue: CORS errors when calling backend

**Cause**: Backend not configured to allow frontend origin

**Solution**:
1. Add frontend URL to backend CORS configuration
2. Ensure `allow_credentials=True` in backend CORS middleware
3. Check that requests include credentials: `credentials: "include"`

### Issue: "Module not found" errors

**Cause**: Path aliases not configured correctly

**Solution**:
1. Check `tsconfig.json` has path mappings:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./*"]
       }
     }
   }
   ```
2. Restart dev server after changing `tsconfig.json`

### Issue: Page not redirecting after sign-in

**Cause**: Middleware not running or session not set

**Solution**:
1. Check `middleware.ts` is in the frontend root directory
2. Verify `matcher` config in middleware includes protected routes
3. Ensure Better Auth session is created after sign-in

### Issue: Tasks from other users are visible

**Cause**: Backend not filtering by user_id

**Solution**:
1. Verify backend extracts `user_id` from JWT token (not request body)
2. Check backend queries include `WHERE user_id = current_user.user_id`
3. Never trust `user_id` from frontend requests

### Issue: Form validation not working

**Cause**: Validation function not set or incorrect

**Solution**:
1. Ensure `useForm` hook receives `validate` function
2. Check validation function returns errors object
3. Verify error keys match form field names

---

## Best Practices

### 1. Type Safety
- Always define TypeScript types for API responses
- Use generics in API client methods
- Enable strict mode in `tsconfig.json`

### 2. Error Handling
- Wrap async operations in try-catch blocks
- Display user-friendly error messages
- Log errors to console for debugging
- Provide retry buttons for failed requests

### 3. Performance
- Use Server Components for static content
- Use Client Components only for interactivity
- Implement loading states for async operations
- Use Suspense boundaries for server-side loading

### 4. Security
- Never store JWT in localStorage (use httpOnly cookies)
- Validate all user input on client and server
- Never trust user_id from client (backend extracts from JWT)
- Sanitize user-generated content before rendering

### 5. Accessibility
- Use semantic HTML (`<button>`, not `<div onClick>`)
- Include ARIA labels for icon-only buttons
- Ensure keyboard navigation works
- Test with screen readers

### 6. Code Organization
- Keep components small and focused (single responsibility)
- Extract reusable logic into custom hooks
- Use barrel exports (`index.ts`) for cleaner imports
- Separate Server Components from Client Components

---

## Next Steps

After completing this quickstart:

1. Review `/sp.plan` output for architecture decisions
2. Read `research.md` for implementation patterns
3. Review `data-model.md` for type definitions
4. Check `contracts/api-endpoints.md` for API documentation
5. Run `/sp.tasks` to generate implementation tasks
6. Run `/sp.implement` to execute tasks via Claude Code

---

## Additional Resources

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Better Auth Documentation](https://better-auth.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright E2E Testing](https://playwright.dev)

---

**Questions or Issues?**

- Check backend logs for API errors
- Review browser DevTools Network tab for failed requests
- Check browser console for JavaScript errors
- Verify environment variables are set correctly
