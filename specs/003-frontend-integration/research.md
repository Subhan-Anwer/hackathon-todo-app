# Research & Discovery: Frontend UI & Full-Stack Integration

**Feature**: 003-frontend-integration
**Date**: 2026-01-30
**Phase**: Phase 0 - Research

## 1. Better Auth JWT Integration Pattern

### Decision

Use Better Auth's built-in session management with server-side cookies for token storage, combined with middleware-based route protection in Next.js App Router.

### Rationale

- **Security**: Cookies with `httpOnly`, `secure`, and `sameSite` flags prevent XSS attacks on tokens
- **Server Components Support**: Better Auth sessions work seamlessly with Next.js Server Components
- **Automatic Token Refresh**: Better Auth handles token refresh transparently
- **Next.js Integration**: Better Auth provides native Next.js App Router integration via API routes

### Alternatives Considered

1. **localStorage with Client Components**
   - ❌ Rejected: Vulnerable to XSS attacks (violates FR-034 and security constraints)
   - Would require all pages to be Client Components
   - No server-side rendering benefits

2. **Custom JWT handling with fetch interceptors**
   - ❌ Rejected: Reinventing the wheel, no token refresh logic
   - More complex to implement and maintain
   - Better Auth already provides this functionality

3. **Session storage**
   - ❌ Rejected: Data lost on tab close, poor UX
   - Not suitable for persistent auth state

### Implementation Notes

**Better Auth Setup Pattern**:
```typescript
// frontend/app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth/config";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
```

**Session Access in Server Components**:
```typescript
// frontend/lib/auth/session.ts
import { auth } from "@/lib/auth/config";
import { headers } from "next/headers";

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  return session;
}
```

**Client-Side Auth Hook**:
```typescript
// frontend/lib/hooks/useAuth.ts
import { useSession } from "@/lib/auth/client";

export function useAuth() {
  const { data: session, isPending } = useSession();

  return {
    user: session?.user,
    isAuthenticated: !!session?.user,
    isLoading: isPending
  };
}
```

**Key Considerations**:
- Session cookies are automatically sent with fetch requests from Server Components
- Client Components need to use the `useSession` hook from Better Auth
- Middleware intercepts requests to check session validity before rendering protected routes
- Sign-out clears the session cookie automatically

---

## 2. Next.js App Router Data Fetching Patterns

### Decision

Use **Server Components for initial data fetching** with cookies for authentication, and **Client Components with SWR/hooks for interactive updates** with JWT from session.

### Rationale

- **Performance**: Server Components reduce JavaScript bundle size and leverage server-side rendering
- **SEO**: Server-side data fetching improves SEO for task list pages
- **Type Safety**: Server Components can directly access TypeScript-typed API responses
- **Progressive Enhancement**: Works even if JavaScript fails on client
- **Optimal UX**: Initial render is fast (server-fetched), subsequent updates are reactive (client-side)

### Alternatives Considered

1. **All Client Components with useEffect**
   - ❌ Rejected: Larger JavaScript bundles, slower initial render
   - Waterfall loading (wait for JS, then fetch data)
   - No SEO benefits

2. **All Server Components with no interactivity**
   - ❌ Rejected: Poor UX for real-time updates (task completion toggle)
   - Page would need to reload for every interaction
   - No optimistic UI updates

3. **getServerSideProps (Pages Router pattern)**
   - ❌ Rejected: Not compatible with App Router
   - Old pattern, deprecated in Next.js 14+

### Implementation Notes

**Server Component Pattern** (initial page load):
```typescript
// app/(dashboard)/tasks/page.tsx
import { getSession } from "@/lib/auth/session";
import { fetchTasksServer } from "@/lib/api/tasks-server";

export default async function TasksPage() {
  const session = await getSession();

  if (!session) {
    redirect("/signin");
  }

  // Fetch tasks on server with session cookies
  const tasks = await fetchTasksServer();

  return <TaskListClient initialTasks={tasks} />;
}
```

**Client Component Pattern** (interactive updates):
```typescript
// components/tasks/TaskList.tsx
"use client";

import { useTasks } from "@/lib/hooks/useTasks";

export function TaskListClient({ initialTasks }) {
  const { tasks, toggleComplete, deleteTask, isLoading } = useTasks(initialTasks);

  // Interactive updates use client-side fetch with JWT from session
}
```

**API Fetching on Server**:
```typescript
// lib/api/tasks-server.ts (Server-side only)
import { headers } from "next/headers";

export async function fetchTasksServer() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tasks`, {
    headers: await headers(), // Includes session cookies
    cache: "no-store" // Always fetch fresh data
  });

  if (!response.ok) throw new Error("Failed to fetch tasks");
  return response.json();
}
```

**API Fetching on Client**:
```typescript
// lib/api/tasks.ts (Client-side)
import { apiClient } from "./client";

export async function fetchTasks() {
  // apiClient automatically adds JWT from session
  return apiClient.get<Task[]>("/api/v1/tasks");
}
```

**Key Considerations**:
- Server Components can't use React hooks (useState, useEffect)
- Client Components must have `"use client"` directive at the top
- Server-fetched data can be passed as props to Client Components
- Use `cache: "no-store"` for server fetches to ensure fresh data
- Client-side fetches benefit from SWR/React Query for caching and revalidation

---

## 3. API Client Architecture

### Decision

Create a **type-safe API client using native fetch API** with TypeScript generics, automatic JWT injection from Better Auth session, centralized error handling, and retry logic for network failures.

### Rationale

- **Native**: No external HTTP library dependency (fetch is built-in)
- **Type Safety**: TypeScript generics ensure compile-time type checking
- **Lightweight**: Minimal bundle size impact
- **Modern**: fetch is the standard web API, well-supported in all modern browsers and Node.js 18+
- **Better Auth Integration**: Easy to access session and extract JWT token

### Alternatives Considered

1. **Axios library**
   - ❌ Rejected: Adds ~13KB to bundle, unnecessary for simple CRUD operations
   - fetch API provides equivalent functionality for our use case
   - Interceptors can be implemented with wrapper functions

2. **No abstraction (raw fetch everywhere)**
   - ❌ Rejected: Code duplication, inconsistent error handling
   - Auth token logic repeated in every API call
   - Hard to maintain and test

3. **GraphQL client (Apollo/URQL)**
   - ❌ Rejected: Backend uses REST API, not GraphQL
   - Overkill for simple CRUD operations

### Implementation Notes

**Base API Client**:
```typescript
// lib/api/client.ts
import { auth } from "@/lib/auth/config";

class ApiClient {
  private baseURL: string;
  private maxRetries = 3;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Get session to extract JWT token
    const session = await auth.api.getSession();
    const token = session?.session?.token;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add JWT token if available
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await this.fetchWithRetry(url, {
        ...options,
        headers,
      });

      // Handle HTTP errors
      if (!response.ok) {
        await this.handleError(response);
      }

      // Parse JSON response
      const data = await response.json();
      return data as T;

    } catch (error) {
      if (error instanceof NetworkError) {
        // Re-throw network errors (will be caught by UI)
        throw error;
      }
      throw new ApiError("An unexpected error occurred", 500);
    }
  }

  async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries = this.maxRetries
  ): Promise<Response> {
    try {
      return await fetch(url, options);
    } catch (error) {
      // Retry on network errors (not on HTTP errors)
      if (retries > 0 && error instanceof TypeError) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw new NetworkError("Network request failed");
    }
  }

  async handleError(response: Response): Promise<never> {
    const contentType = response.headers.get("content-type");

    // Try to extract error message from JSON response
    if (contentType?.includes("application/json")) {
      const errorData = await response.json();
      throw new ApiError(
        errorData.error?.message || errorData.detail || "Request failed",
        response.status
      );
    }

    // Fallback to status text
    throw new ApiError(response.statusText, response.status);
  }

  // Convenience methods
  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "GET" });
  }

  post<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  put<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  patch<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();

// Custom error classes
export class ApiError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "ApiError";
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}
```

**Usage in Task API**:
```typescript
// lib/api/tasks.ts
import { apiClient } from "./client";
import type { Task, TaskCreate, TaskUpdate } from "@/lib/types/task";

export const taskApi = {
  list: () => apiClient.get<Task[]>("/api/v1/tasks"),

  get: (id: string) => apiClient.get<Task>(`/api/v1/tasks/${id}`),

  create: (data: TaskCreate) => apiClient.post<Task>("/api/v1/tasks", data),

  update: (id: string, data: TaskUpdate) =>
    apiClient.put<Task>(`/api/v1/tasks/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`/api/v1/tasks/${id}`),

  toggleComplete: (id: string) =>
    apiClient.patch<Task>(`/api/v1/tasks/${id}/complete`),
};
```

**Key Considerations**:
- Retry only on network errors (TypeError), not on HTTP 4xx/5xx responses
- 401 Unauthorized should trigger redirect to sign-in (handled in UI layer)
- Token is fetched from Better Auth session on each request (could add caching)
- All methods are async and return Promises
- Type safety enforced through TypeScript generics

---

## 4. Form State Management

### Decision

Use **React's built-in useState and useReducer** for form state, with custom `useForm` hook for reusable form logic and validation.

### Rationale

- **No Dependencies**: Avoids adding external form libraries (React Hook Form, Formik)
- **Lightweight**: Minimal JavaScript bundle impact
- **Flexibility**: Custom hook tailored to our specific needs
- **Type Safety**: Full TypeScript support with generics
- **Simple Use Case**: Task forms are straightforward (2-3 fields), don't need complex validation library

### Alternatives Considered

1. **React Hook Form**
   - ❌ Rejected: Overkill for simple forms (adds ~40KB)
   - Complex API for our use case
   - More than we need for 2-field forms

2. **Formik**
   - ❌ Rejected: Adds ~44KB, not optimized for React 18+
   - Older library, React Hook Form is more modern

3. **Controlled components without abstraction**
   - ❌ Rejected: Code duplication across multiple forms
   - Inconsistent validation and error handling

### Implementation Notes

**Custom useForm Hook**:
```typescript
// lib/hooks/useForm.ts
import { useState, useCallback } from "react";

interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit: (values: T) => Promise<void>;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);

    // Clear error for this field when user types
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Run validation
    const validationErrors = validate?.(values) || {};

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Submit form
    setIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit(values);
      // Reset form on success
      setValues(initialValues);
      setIsDirty(false);
    } catch (error) {
      // Set general error
      setErrors({
        submit: error instanceof Error ? error.message : "Submission failed"
      } as any);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit, initialValues]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsDirty(false);
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    isSubmitting,
    isDirty,
    handleChange,
    handleSubmit,
    reset,
  };
}
```

**Validation Utilities**:
```typescript
// lib/utils/validation.ts
export const validators = {
  required: (value: any) => {
    if (!value || (typeof value === "string" && !value.trim())) {
      return "This field is required";
    }
    return null;
  },

  minLength: (min: number) => (value: string) => {
    if (value && value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (max: number) => (value: string) => {
    if (value && value.length > max) {
      return `Must be at most ${max} characters`;
    }
    return null;
  },

  email: (value: string) => {
    if (value && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
      return "Invalid email address";
    }
    return null;
  },
};

// Compose multiple validators
export function composeValidators(...validators: Array<(value: any) => string | null>) {
  return (value: any) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return null;
  };
}
```

**Usage in Task Form**:
```typescript
// components/tasks/TaskForm.tsx
"use client";

import { useForm } from "@/lib/hooks/useForm";
import { validators } from "@/lib/utils/validation";
import type { TaskCreate } from "@/lib/types/task";

export function TaskForm({ onSubmit }: { onSubmit: (data: TaskCreate) => Promise<void> }) {
  const form = useForm<TaskCreate>({
    initialValues: { title: "", description: "" },
    validate: (values) => {
      const errors: any = {};

      const titleError = validators.required(values.title);
      if (titleError) errors.title = titleError;

      return errors;
    },
    onSubmit,
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <div>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          value={form.values.title}
          onChange={(e) => form.handleChange("title", e.target.value)}
          disabled={form.isSubmitting}
        />
        {form.errors.title && <span>{form.errors.title}</span>}
      </div>

      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={form.values.description}
          onChange={(e) => form.handleChange("description", e.target.value)}
          disabled={form.isSubmitting}
        />
      </div>

      <button type="submit" disabled={form.isSubmitting || !form.isDirty}>
        {form.isSubmitting ? "Submitting..." : "Save"}
      </button>
    </form>
  );
}
```

**Key Considerations**:
- Form state is local to each component (not global state)
- Validation runs on submit, individual fields clear errors on change
- isSubmitting prevents double-submission
- isDirty tracks if form has been modified
- reset() method for clearing form after success
- Generic type ensures type safety for form values and errors

---

## 5. Loading and Error States

### Decision

Use **React Suspense for loading states** in Server Components and **custom useApi hook with loading/error state** for Client Components. Implement **error boundaries** for catching unexpected errors and providing fallback UI.

### Rationale

- **Consistent UX**: Unified loading and error patterns across the app
- **Progressive Enhancement**: Server Components show loading states before JavaScript loads
- **Error Recovery**: Error boundaries prevent entire app crash, provide retry options
- **Best Practices**: Follows React 18+ patterns with Suspense and error boundaries

### Alternatives Considered

1. **Loading states with useState in every component**
   - ❌ Rejected: Code duplication, inconsistent UX
   - Hard to maintain unified loading indicators

2. **Global loading state in context**
   - ❌ Rejected: Overcomplicates simple component-level loading
   - Context not needed for isolated loading states

3. **No error boundaries (let errors crash)**
   - ❌ Rejected: Poor UX, entire app breaks on single error
   - No recovery mechanism for users

### Implementation Notes

**Server Component Loading** (with Suspense):
```typescript
// app/(dashboard)/tasks/page.tsx
import { Suspense } from "react";
import { TaskListSkeleton } from "@/components/tasks/TaskListSkeleton";
import { TaskListServer } from "@/components/tasks/TaskListServer";

export default function TasksPage() {
  return (
    <Suspense fallback={<TaskListSkeleton />}>
      <TaskListServer />
    </Suspense>
  );
}
```

**Loading Skeleton Component**:
```typescript
// components/tasks/TaskListSkeleton.tsx
export function TaskListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-24" />
      ))}
    </div>
  );
}
```

**Client Component with useApi Hook**:
```typescript
// lib/hooks/useApi.ts
import { useState, useEffect } from "react";

interface UseApiState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setState({ data: null, error: null, isLoading: true });

      try {
        const result = await apiCall();
        if (!cancelled) {
          setState({ data: result, error: null, isLoading: false });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            data: null,
            error: error instanceof Error ? error : new Error("Unknown error"),
            isLoading: false,
          });
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, dependencies);

  const retry = () => {
    setState({ data: null, error: null, isLoading: true });
    // Dependencies change will trigger useEffect
  };

  return { ...state, retry };
}
```

**Error Boundary Component**:
```typescript
// components/ui/ErrorBoundary.tsx
"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.retry);
      }

      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold mb-2">Something went wrong</h2>
          <p className="text-red-600 mb-4">{this.state.error.message}</p>
          <button
            onClick={this.retry}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Error Message Component**:
```typescript
// components/ui/ErrorMessage.tsx
interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold">Error</p>
          <p className="text-sm">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-4 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
```

**Usage Example**:
```typescript
// components/tasks/TaskList.tsx
"use client";

import { useApi } from "@/lib/hooks/useApi";
import { taskApi } from "@/lib/api/tasks";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function TaskList() {
  const { data: tasks, error, isLoading, retry } = useApi(() => taskApi.list());

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} onRetry={retry} />;
  if (!tasks || tasks.length === 0) return <EmptyState />;

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
```

**Key Considerations**:
- Suspense only works with Server Components or async components
- Error boundaries catch errors in component tree, not in event handlers
- useApi hook handles loading/error states for client-side data fetching
- Retry functionality re-triggers the API call
- Loading skeletons match the layout of actual content for smooth transitions

---

## 6. Responsive Design Implementation

### Decision

Use **Tailwind CSS mobile-first approach** with breakpoint prefixes (sm:, md:, lg:) and responsive utilities for layout, typography, and spacing.

### Rationale

- **Mobile-First**: Ensures mobile experience is prioritized (matches FR-049 requirement)
- **Utility-Based**: Tailwind's responsive utilities are concise and maintainable
- **Breakpoint System**: Matches common device sizes (320px, 768px, 1024px from FR-049-051)
- **No Media Query Boilerplate**: Tailwind handles breakpoints internally
- **Design System**: Tailwind enforces consistent spacing and sizing

### Alternatives Considered

1. **Custom CSS media queries**
   - ❌ Rejected: More verbose, harder to maintain
   - Requires separate CSS files and class management

2. **CSS-in-JS (styled-components, emotion)**
   - ❌ Rejected: Adds runtime overhead, larger bundles
   - Tailwind is already in the project

3. **CSS Grid/Flexbox without framework**
   - ❌ Rejected: Reinventing the wheel, less consistent
   - Tailwind provides these utilities out of the box

### Implementation Notes

**Tailwind Configuration**:
```javascript
// tailwind.config.ts
export default {
  theme: {
    screens: {
      sm: "640px",  // Tablet
      md: "768px",  // Small laptop
      lg: "1024px", // Desktop
      xl: "1280px", // Large desktop
    },
    extend: {
      // Custom spacing for touch targets (min 44px for accessibility)
      spacing: {
        "touch": "44px",
      },
    },
  },
};
```

**Responsive Layout Pattern** (Task List):
```tsx
// components/tasks/TaskList.tsx
export function TaskList({ tasks }) {
  return (
    <div className="
      px-4 sm:px-6 lg:px-8          /* Padding increases with screen size */
      max-w-7xl mx-auto             /* Center content on large screens */
    ">
      <div className="
        grid                        /* Mobile: 1 column */
        sm:grid-cols-2              /* Tablet: 2 columns */
        lg:grid-cols-3              /* Desktop: 3 columns */
        gap-4                       /* Consistent gap between items */
      ">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
```

**Responsive Typography**:
```tsx
<h1 className="
  text-2xl sm:text-3xl lg:text-4xl  /* Scale heading size */
  font-bold
  mb-4 sm:mb-6                      /* Increase margin on larger screens */
">
  My Tasks
</h1>
```

**Touch-Friendly Controls** (Mobile):
```tsx
// components/ui/Button.tsx
export function Button({ children, ...props }) {
  return (
    <button
      className="
        h-touch                     /* 44px height for touch targets */
        px-4 sm:px-6                /* More padding on desktop */
        text-base sm:text-lg        /* Larger text on desktop */
        rounded-lg
        transition-colors
        touch-manipulation          /* Optimize for touch devices */
      "
      {...props}
    >
      {children}
    </button>
  );
}
```

**Mobile Navigation Pattern**:
```tsx
// components/layout/Header.tsx
export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm">
      <nav className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div>Todo App</div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/tasks">Tasks</Link>
            <SignOutButton />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden h-touch w-touch"
          >
            <MenuIcon />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 border-t pt-4">
            <Link href="/tasks">Tasks</Link>
            <SignOutButton />
          </div>
        )}
      </nav>
    </header>
  );
}
```

**Responsive Tables/Lists**:
```tsx
// Mobile: Card layout, Desktop: Table layout
<div className="
  space-y-4                       /* Mobile: Stack cards */
  lg:space-y-0                    /* Desktop: Remove stacking */
">
  {/* Mobile Card View */}
  <div className="lg:hidden">
    {tasks.map(task => <TaskCard key={task.id} task={task} />)}
  </div>

  {/* Desktop Table View */}
  <table className="hidden lg:table w-full">
    <thead>
      <tr>
        <th>Title</th>
        <th>Status</th>
        <th>Created</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {tasks.map(task => <TaskRow key={task.id} task={task} />)}
    </tbody>
  </table>
</div>
```

**Key Considerations**:
- Mobile-first means base styles target mobile, breakpoints add desktop styles
- Touch targets minimum 44px height (accessibility requirement)
- Use `hidden md:block` and `md:hidden` to show/hide elements by screen size
- Grid layout with responsive columns (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- Consistent spacing scale (4px increments: p-4, p-6, p-8)
- Test on real devices, not just browser DevTools

---

## 7. Protected Route Implementation

### Decision

Use **Next.js middleware** to intercept requests to protected routes, validate Better Auth session, and redirect unauthenticated users to sign-in page. Preserve original URL for post-authentication redirect.

### Rationale

- **Centralized Protection**: Single middleware file handles all route protection
- **Server-Side**: Protection happens before page renders (no client-side flash)
- **Better Auth Integration**: Middleware can access session cookies directly
- **UX**: Preserves intended destination URL for redirect after sign-in
- **Performance**: Middleware runs on Edge runtime, very fast

### Alternatives Considered

1. **Client-side redirect in useEffect**
   - ❌ Rejected: Flash of protected content before redirect
   - Slower (waits for JavaScript to load)
   - Not SEO-friendly

2. **Server Component with getSession check**
   - ❌ Rejected: Must check in every protected page
   - Code duplication, easy to forget
   - No centralized enforcement

3. **Higher-Order Component (HOC) wrapper**
   - ❌ Rejected: Old pattern, not Next.js App Router best practice
   - Middleware is the recommended approach

### Implementation Notes

**Middleware Configuration**:
```typescript
// middleware.ts (root of frontend)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";

// Define protected route patterns
const protectedRoutes = ["/tasks", "/profile", "/settings"];
const authRoutes = ["/signin", "/signup"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  const isAuthRoute = authRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Get session
  const session = await auth.api.getSession({
    headers: request.headers
  });

  // Redirect unauthenticated users from protected routes to signin
  if (isProtectedRoute && !session) {
    const signInUrl = new URL("/signin", request.url);
    // Preserve intended destination
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect authenticated users from auth routes to tasks
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/tasks", request.url));
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    // Match all routes except static files and API routes
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

**Sign-In Page with Callback**:
```typescript
// app/(auth)/signin/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "@/lib/auth/client";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/tasks";

  const handleSubmit = async (email: string, password: string) => {
    await signIn.email({ email, password });

    // Redirect to intended destination after successful sign-in
    router.push(callbackUrl);
  };

  return <SignInForm onSubmit={handleSubmit} />;
}
```

**Better Auth Session Helpers**:
```typescript
// lib/auth/session.ts
import { auth } from "@/lib/auth/config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Server-side: Get session and redirect if not authenticated
export async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/signin");
  }

  return session;
}

// Server-side: Get optional session
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  return session;
}
```

**Usage in Server Component**:
```typescript
// app/(dashboard)/tasks/page.tsx
import { requireAuth } from "@/lib/auth/session";

export default async function TasksPage() {
  // This will redirect to /signin if not authenticated
  const session = await requireAuth();

  // User is authenticated, render page
  return <TaskList userId={session.user.id} />;
}
```

**Key Considerations**:
- Middleware runs on every request matching the config
- Session validation happens server-side before page renders
- callbackUrl preserves user's intended destination
- Middleware should be lightweight (fast execution)
- Authenticated users redirected away from /signin and /signup
- Route groups `(auth)` and `(dashboard)` organize pages without affecting URLs

---

## 8. Accessibility Best Practices

### Decision

Follow **WCAG 2.1 Level A compliance** with semantic HTML, ARIA attributes where necessary, keyboard navigation support, and focus management. Use automated testing tools (Lighthouse, axe DevTools) during development.

### Rationale

- **Legal Requirement**: WCAG 2.1 Level A is minimum for accessibility (FR-UX-006)
- **Inclusive Design**: Makes app usable for users with disabilities
- **Better UX**: Keyboard navigation and semantic HTML benefit all users
- **SEO**: Semantic HTML improves search engine indexing
- **Testing**: Automated tools catch 30-40% of accessibility issues early

### Alternatives Considered

1. **No accessibility considerations**
   - ❌ Rejected: Violates constitutional requirements and legal standards
   - Excludes users with disabilities

2. **WCAG AAA compliance**
   - ❌ Rejected: Overkill for MVP, Level A is sufficient
   - Requires significant additional effort

3. **Manual testing only**
   - ❌ Rejected: Misses many issues, slow feedback
   - Automated tools catch common issues instantly

### Implementation Notes

**Semantic HTML Structure**:
```tsx
// Use semantic elements instead of divs
<main>
  <h1>My Tasks</h1>

  <section aria-labelledby="active-tasks">
    <h2 id="active-tasks">Active Tasks</h2>
    <ul>
      <li>
        <article>
          <h3>Task Title</h3>
          <p>Task description</p>
        </article>
      </li>
    </ul>
  </section>
</main>
```

**ARIA Attributes for Interactive Elements**:
```tsx
// Button with aria-label for screen readers
<button
  onClick={handleDelete}
  aria-label="Delete task: Buy groceries"
  className="text-red-600 hover:text-red-800"
>
  <TrashIcon className="w-5 h-5" />
</button>

// Checkbox with proper labeling
<input
  type="checkbox"
  id={`task-${task.id}`}
  checked={task.completed}
  onChange={handleToggle}
  aria-describedby={`task-description-${task.id}`}
/>
<label htmlFor={`task-${task.id}`}>
  {task.title}
</label>
```

**Keyboard Navigation**:
```tsx
// Task card with keyboard support
export function TaskCard({ task }) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggleComplete();
    }
    if (e.key === "Delete") {
      handleDelete();
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="focus:ring-2 focus:ring-blue-500 focus:outline-none"
      role="article"
    >
      {/* Task content */}
    </div>
  );
}
```

**Focus Management** (Modal/Dialog):
```tsx
// Trap focus inside modal
import { useEffect, useRef } from "react";

export function ConfirmDialog({ isOpen, onClose }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus first interactive element in dialog
      const firstInput = dialogRef.current?.querySelector("button, input");
      (firstInput as HTMLElement)?.focus();
    } else {
      // Restore focus when dialog closes
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div className="bg-white p-6 rounded-lg">
        <h2 id="dialog-title">Confirm Deletion</h2>
        <p>Are you sure you want to delete this task?</p>
        <button onClick={onClose}>Cancel</button>
        <button onClick={handleConfirm}>Delete</button>
      </div>
    </div>
  );
}
```

**Form Labels and Error Messages**:
```tsx
<div>
  <label htmlFor="task-title" className="block mb-2">
    Task Title
    <span className="text-red-500" aria-label="required">*</span>
  </label>
  <input
    id="task-title"
    type="text"
    aria-required="true"
    aria-invalid={!!errors.title}
    aria-describedby={errors.title ? "title-error" : undefined}
  />
  {errors.title && (
    <p id="title-error" role="alert" className="text-red-600 text-sm">
      {errors.title}
    </p>
  )}
</div>
```

**Color Contrast** (WCAG AA minimum):
```tsx
// Use sufficient contrast ratios
<button className="
  bg-blue-600       /* Background */
  text-white        /* Text - contrast ratio 4.5:1+ */
  hover:bg-blue-700
  focus:ring-2
  focus:ring-blue-500
  focus:ring-offset-2
">
  Save Task
</button>
```

**Skip Links** (for keyboard users):
```tsx
// layout.tsx
<a
  href="#main-content"
  className="
    sr-only               /* Hidden by default */
    focus:not-sr-only     /* Visible when focused */
    focus:absolute
    focus:top-4
    focus:left-4
    focus:z-50
    focus:px-4
    focus:py-2
    focus:bg-blue-600
    focus:text-white
  "
>
  Skip to main content
</a>

<main id="main-content">
  {/* Page content */}
</main>
```

**Accessibility Testing Checklist**:

1. **Automated Testing**:
   - Run Lighthouse audit (Accessibility score > 90)
   - Use axe DevTools browser extension
   - Add jest-axe to component tests

2. **Manual Testing**:
   - Tab through all interactive elements
   - Test with screen reader (NVDA, JAWS, VoiceOver)
   - Test keyboard-only navigation (no mouse)
   - Verify focus indicators are visible
   - Check color contrast with tools

3. **Component Requirements**:
   - All images have alt text
   - All form inputs have labels
   - All buttons have accessible names
   - Focus trapped in modals
   - Error messages announced to screen readers
   - Loading states announced to screen readers

**Key Considerations**:
- Semantic HTML is the foundation (use `<button>`, not `<div onClick>`)
- ARIA attributes supplement semantics, don't replace them
- Keyboard navigation should match visual tab order
- Focus indicators must be visible (don't use `outline: none` without alternative)
- Screen reader testing catches issues automated tools miss
- Test with real assistive technologies, not just automated tools

---

## Summary

All research areas have been explored with clear decisions, rationale, and implementation guidance. Key takeaways:

1. **Better Auth** handles JWT securely via httpOnly cookies
2. **Server Components** for initial render, **Client Components** for interactivity
3. **Native fetch API** with TypeScript generics for type-safe API client
4. **Custom useForm hook** for lightweight form state management
5. **Suspense + useApi** for consistent loading/error states
6. **Tailwind mobile-first** for responsive design
7. **Next.js middleware** for centralized route protection
8. **WCAG 2.1 Level A** compliance with semantic HTML and ARIA

These patterns will be applied consistently across all components and pages during implementation.
