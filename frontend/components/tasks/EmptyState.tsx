/**
 * Empty state component for when user has no tasks.
 * Implements T025 from tasks.md
 */

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  /** Custom message to display */
  message?: string;
  /** Show create task button */
  showCreateButton?: boolean;
}

/**
 * Empty state display with prompt to create first task.
 * User-friendly and encouraging.
 */
export function EmptyState({
  message = "You don't have any tasks yet",
  showCreateButton = true,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4">
        <svg
          className="h-16 w-16 text-gray-400 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {message}
      </h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        Get started by creating your first task. Stay organized and track what needs to be done.
      </p>
      {showCreateButton && (
        <Link href="/tasks/new">
          <Button variant="primary" size="md">
            Create Your First Task
          </Button>
        </Link>
      )}
    </div>
  );
}
