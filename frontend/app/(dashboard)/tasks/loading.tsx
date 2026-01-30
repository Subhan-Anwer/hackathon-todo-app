/**
 * Loading state for tasks page route.
 * Implements T056 from tasks.md
 */

import { TaskListSkeleton } from '@/components/tasks/TaskListSkeleton';

/**
 * Route-level loading UI shown during navigation to tasks page.
 * Uses Next.js App Router's loading.tsx convention.
 */
export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-4 w-64 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 animate-pulse rounded-md"></div>
      </div>

      {/* Task list skeleton */}
      <TaskListSkeleton />
    </div>
  );
}
