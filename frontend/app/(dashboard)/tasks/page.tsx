/**
 * Task list page - displays user's tasks with responsive layout.
 * Implements T029, T043 from tasks.md
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskListSkeleton } from '@/components/tasks/TaskListSkeleton';
import { Button } from '@/components/ui/Button';

export default function TasksPage() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header with New Task button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            My Tasks
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your tasks and stay organized
          </p>
        </div>
        <Link href="/tasks/new">
          <Button variant="primary" size="md">
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Task
          </Button>
        </Link>
      </div>

      {/* Task list component with Suspense boundary */}
      <Suspense fallback={<TaskListSkeleton />}>
        <TaskList />
      </Suspense>
    </div>
  );
}
