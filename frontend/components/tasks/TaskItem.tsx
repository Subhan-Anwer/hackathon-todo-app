'use client';

/**
 * TaskItem component - renders a single task with checkbox and actions.
 */

import { Task } from '@/lib/types';
import { toggleTaskCompletion, deleteTask } from '@/lib/api/tasks';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleComplete = async () => {
    setIsLoading(true);
    try {
      await toggleTaskCompletion(task.id);
      router.refresh();  // Refresh Server Component data
    } catch (error) {
      console.error('Failed to toggle task:', error);
      alert('Failed to update task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteTask(task.id);
      router.refresh();  // Refresh Server Component data
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/tasks/${task.id}/edit`);
  };

  return (
    <div
      className={`border rounded-lg p-4 ${
        task.completed ? 'bg-gray-50' : 'bg-white'
      } ${isLoading ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Completion checkbox */}
        <input
          type="checkbox"
          checked={task.completed}
          onChange={handleToggleComplete}
          disabled={isLoading}
          className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <h3
            className={`font-medium text-gray-900 ${
              task.completed ? 'line-through text-gray-500' : ''
            }`}
          >
            {task.title}
          </h3>

          {task.description && (
            <p
              className={`mt-1 text-sm text-gray-600 ${
                task.completed ? 'line-through text-gray-400' : ''
              }`}
            >
              {task.description}
            </p>
          )}

          <div className="mt-2 text-xs text-gray-400">
            Created: {new Date(task.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            disabled={isLoading}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="text-sm text-red-600 hover:text-red-800 disabled:text-gray-400"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
