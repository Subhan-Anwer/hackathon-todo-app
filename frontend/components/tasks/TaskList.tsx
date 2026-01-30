/**
 * Task list component with integrated state management.
 * Implements T028, T049, T051 from tasks.md
 */

'use client';

import { TaskCard } from './TaskCard';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useTasks } from '@/lib/hooks/useTasks';

/**
 * Task list component that fetches and displays all user tasks.
 * Handles loading, error, and empty states.
 * Responsive grid layout for different screen sizes.
 */
export function TaskList() {
  const { tasks, loading, error, toggleComplete, deleteTask, refetch } = useTasks();

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" message="Loading your tasks..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <ErrorMessage
          error={error}
          message="Failed to load tasks. Please try again."
          onRetry={refetch}
        />
      </div>
    );
  }

  // Empty state
  if (tasks.length === 0) {
    return <EmptyState />;
  }

  // Task list display
  return (
    <div className="space-y-4">
      {/* Task count header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
          Your Tasks
          <span className="ml-2 text-sm sm:text-base font-normal text-gray-500">
            ({tasks.length})
          </span>
        </h2>
      </div>

      {/* Responsive task grid/list */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onToggleComplete={toggleComplete}
            onDelete={deleteTask}
          />
        ))}
      </div>
    </div>
  );
}
