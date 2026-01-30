/**
 * Skeleton loading state for task list.
 * Implements T042 from tasks.md
 */

/**
 * Task list skeleton component that displays animated placeholders
 * while tasks are loading. Provides visual feedback to users.
 */
export function TaskListSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading tasks">
      {/* Screen reader announcement */}
      <span className="sr-only">Loading your tasks...</span>

      {/* Skeleton cards (3 items) */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-pulse"
        >
          <div className="flex items-start gap-3">
            {/* Checkbox skeleton */}
            <div className="flex-shrink-0 pt-0.5">
              <div className="h-5 w-5 bg-gray-200 rounded"></div>
            </div>

            {/* Content skeleton */}
            <div className="flex-1 space-y-3">
              {/* Title skeleton */}
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              {/* Description skeleton */}
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              {/* Date skeleton */}
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>

            {/* Action buttons skeleton */}
            <div className="flex-shrink-0 flex gap-2">
              <div className="h-9 w-9 bg-gray-200 rounded-md"></div>
              <div className="h-9 w-9 bg-gray-200 rounded-md"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
