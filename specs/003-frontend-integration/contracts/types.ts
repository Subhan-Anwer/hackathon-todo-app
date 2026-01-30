/**
 * API Contract Types
 *
 * These TypeScript interfaces define the structure of API requests and responses
 * for the Frontend UI & Full-Stack Integration feature.
 *
 * IMPORTANT: These types must match the backend API exactly. Any mismatch will
 * cause runtime errors. See api-endpoints.md for full contract documentation.
 *
 * Location: This file documents the contract, actual types live in frontend/lib/types/
 */

// ============================================================================
// Authentication Types
// ============================================================================

/**
 * POST /api/auth/signup - Request body
 */
export interface SignUpRequest {
  email: string;
  password: string;
  name?: string;
}

/**
 * POST /api/auth/signup - Response body
 */
export interface SignUpResponse {
  user: {
    user_id: string;
    email: string;
    name?: string;
    created_at: string;
  };
  session: {
    token: string;
    expires_at: string;
  };
}

/**
 * POST /api/auth/signin - Request body
 */
export interface SignInRequest {
  email: string;
  password: string;
}

/**
 * POST /api/auth/signin - Response body
 */
export interface SignInResponse {
  user: {
    user_id: string;
    email: string;
    name?: string;
  };
  session: {
    token: string;
    expires_at: string;
  };
}

/**
 * GET /api/auth/session - Response body
 */
export interface SessionResponse {
  user: {
    user_id: string;
    email: string;
    name?: string;
  };
  session: {
    token: string;
    expires_at: string;
  };
}

/**
 * POST /api/auth/signout - Response body
 */
export interface SignOutResponse {
  message: string;
}

// ============================================================================
// Task Types
// ============================================================================

/**
 * Task entity (from all task endpoints)
 */
export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * POST /api/v1/tasks - Request body
 */
export interface TaskCreateRequest {
  title: string;
  description?: string;
}

/**
 * POST /api/v1/tasks - Response body
 */
export type TaskCreateResponse = Task;

/**
 * GET /api/v1/tasks - Response body
 */
export type TaskListResponse = Task[];

/**
 * GET /api/v1/tasks/{id} - Response body
 */
export type TaskGetResponse = Task;

/**
 * PUT /api/v1/tasks/{id} - Request body
 */
export interface TaskUpdateRequest {
  title?: string;
  description?: string | null;
  completed?: boolean;
}

/**
 * PUT /api/v1/tasks/{id} - Response body
 */
export type TaskUpdateResponse = Task;

/**
 * DELETE /api/v1/tasks/{id} - No response body (204 No Content)
 */
export type TaskDeleteResponse = void;

/**
 * PATCH /api/v1/tasks/{id}/complete - No request body
 * Response body
 */
export type TaskToggleCompleteResponse = Task;

// ============================================================================
// Error Types
// ============================================================================

/**
 * Standard error response structure from backend
 */
export interface ErrorResponse {
  detail: string | ValidationError[];
}

/**
 * Validation error structure (422 Unprocessable Entity)
 */
export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

// ============================================================================
// API Client Types (Internal Frontend Use)
// ============================================================================

/**
 * HTTP methods supported by API client
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Request configuration for API client
 */
export interface RequestConfig {
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  retry?: boolean;
}

/**
 * API client interface
 */
export interface ApiClient {
  get<T>(endpoint: string): Promise<T>;
  post<T>(endpoint: string, data?: any): Promise<T>;
  put<T>(endpoint: string, data?: any): Promise<T>;
  patch<T>(endpoint: string, data?: any): Promise<T>;
  delete<T>(endpoint: string): Promise<T>;
}

// ============================================================================
// Usage Examples (for reference, not exported)
// ============================================================================

/*
// Authentication example
const signInData: SignInRequest = {
  email: "user@example.com",
  password: "password123"
};

const response: SignInResponse = await fetch("/api/auth/signin", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(signInData)
}).then(res => res.json());

// Task creation example
const newTask: TaskCreateRequest = {
  title: "Buy groceries",
  description: "Milk, eggs, bread"
};

const createdTask: TaskCreateResponse = await fetch("/api/v1/tasks", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  },
  body: JSON.stringify(newTask)
}).then(res => res.json());

// Task update example
const updateData: TaskUpdateRequest = {
  completed: true
};

const updatedTask: TaskUpdateResponse = await fetch(`/api/v1/tasks/${taskId}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  },
  body: JSON.stringify(updateData)
}).then(res => res.json());

// Error handling example
try {
  const tasks: TaskListResponse = await fetch("/api/v1/tasks", {
    headers: { "Authorization": `Bearer ${token}` }
  }).then(res => {
    if (!res.ok) {
      const error: ErrorResponse = await res.json();
      throw new Error(error.detail as string);
    }
    return res.json();
  });
} catch (error) {
  console.error("Failed to fetch tasks:", error);
}
*/

// ============================================================================
// Type Guards (for runtime type checking)
// ============================================================================

/**
 * Type guard to check if error response is validation error
 */
export function isValidationError(detail: any): detail is ValidationError[] {
  return Array.isArray(detail) && detail.length > 0 && "loc" in detail[0];
}

/**
 * Type guard to check if error response is string
 */
export function isStringError(detail: any): detail is string {
  return typeof detail === "string";
}

// ============================================================================
// Constants
// ============================================================================

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Error codes (machine-readable)
 */
export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

/**
 * API endpoint paths
 */
export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: "/api/auth/signup",
    SIGNIN: "/api/auth/signin",
    SIGNOUT: "/api/auth/signout",
    SESSION: "/api/auth/session",
  },
  TASKS: {
    LIST: "/api/v1/tasks",
    GET: (id: string) => `/api/v1/tasks/${id}`,
    CREATE: "/api/v1/tasks",
    UPDATE: (id: string) => `/api/v1/tasks/${id}`,
    DELETE: (id: string) => `/api/v1/tasks/${id}`,
    TOGGLE_COMPLETE: (id: string) => `/api/v1/tasks/${id}/complete`,
  },
} as const;
