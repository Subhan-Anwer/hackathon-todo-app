'use client';

/**
 * TaskForm component - form for creating or editing tasks.
 */

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createTask, updateTask } from '@/lib/api/tasks';
import { Task, TaskCreateInput, TaskUpdateInput } from '@/lib/types';

interface TaskFormProps {
  task?: Task;  // If provided, form is in edit mode
  mode: 'create' | 'edit';
}

export function TaskForm({ task, mode }: TaskFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title cannot be empty or whitespace-only');
      return;
    }

    if (trimmedTitle.length > 500) {
      setError('Title cannot exceed 500 characters');
      return;
    }

    if (description && description.length > 5000) {
      setError('Description cannot exceed 5000 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        const taskData: TaskCreateInput = {
          title: trimmedTitle,
          description: description.trim() || null,
        };
        await createTask(taskData);
        router.push('/tasks');
        router.refresh();
      } else if (mode === 'edit' && task) {
        const taskData: TaskUpdateInput = {
          title: trimmedTitle,
          description: description.trim() || null,
        };
        await updateTask(task.id, taskData);
        router.push('/tasks');
        router.refresh();
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save task. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/tasks');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Title field */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
          required
          maxLength={500}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Enter task title"
        />
        <p className="mt-1 text-xs text-gray-500">
          {title.length}/500 characters
        </p>
      </div>

      {/* Description field */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          rows={4}
          maxLength={5000}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Enter task description (optional)"
        />
        <p className="mt-1 text-xs text-gray-500">
          {description.length}/5000 characters
        </p>
      </div>

      {/* Form actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Update Task'}
        </button>
      </div>
    </form>
  );
}
