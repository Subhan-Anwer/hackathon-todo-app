/**
 * Task card component displaying single task with actions.
 * Implements T026, T037, T039, T040, T051, T053 from tasks.md
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Task } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface TaskCardProps {
  /** Task data to display */
  task: Task;
  /** Callback when completion is toggled */
  onToggleComplete?: (id: string) => Promise<Task | void>;
  /** Callback when task is deleted */
  onDelete?: (id: string) => Promise<void>;
}

/**
 * Task card component with completion toggle, edit, and delete actions.
 * Responsive and touch-friendly (44px minimum touch targets).
 */
export function TaskCard({ task, onToggleComplete, onDelete }: TaskCardProps) {
  const [isTogglingComplete, setIsTogglingComplete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /**
   * Handle completion toggle.
   */
  const handleToggleComplete = async () => {
    if (!onToggleComplete || isTogglingComplete) return;

    setIsTogglingComplete(true);
    try {
      await onToggleComplete(task.id);
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
    } finally {
      setIsTogglingComplete(false);
    }
  };

  /**
   * Handle task deletion with confirmation.
   */
  const handleDelete = async () => {
    if (!onDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      await onDelete(task.id);
    } catch (error) {
      console.error('Failed to delete task:', error);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Format date for display.
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  /**
   * Handle keyboard shortcuts for task operations.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Enter or Space: Toggle completion
    if (e.key === 'Enter' || e.key === ' ') {
      // Only if the target is the card itself, not a button
      if (e.target === e.currentTarget) {
        e.preventDefault();
        handleToggleComplete();
      }
    }
    // Delete key: Open delete confirmation
    else if (e.key === 'Delete') {
      e.preventDefault();
      setShowDeleteConfirm(true);
    }
  };

  return (
    <div
      role="article"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label={`Task: ${task.title}`}
    >
      <div className="flex items-start gap-3">
        {/* Completion checkbox */}
        <div className="flex-shrink-0 pt-0.5">
          <button
            type="button"
            onClick={handleToggleComplete}
            disabled={isTogglingComplete}
            className="h-5 w-5 rounded border-2 border-gray-300 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 transition-colors flex items-center justify-center"
            aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
            aria-pressed={task.completed}
          >
            {task.completed && (
              <svg
                className="h-4 w-4 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <h3
            className={`text-base sm:text-lg font-medium mb-1 ${
              task.completed
                ? 'line-through text-gray-500'
                : 'text-gray-900'
            }`}
          >
            {task.title}
          </h3>
          {task.description && (
            <p
              className={`text-sm sm:text-base mb-2 ${
                task.completed ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {task.description}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Created {formatDate(task.created_at)}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 flex gap-2">
          <Link href={`/tasks/${task.id}/edit`}>
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`Edit task: ${task.title}`}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          </Link>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            aria-label={`Delete task: ${task.title}`}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => !isDeleting && setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
