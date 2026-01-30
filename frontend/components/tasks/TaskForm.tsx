/**
 * Reusable form component for creating and editing tasks.
 * Implements T034 from tasks.md
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useForm } from '@/lib/hooks/useForm';
import { required, maxLength, composeValidators } from '@/lib/utils/validation';

interface TaskFormProps {
  /** Initial values for the form (for edit mode) */
  initialValues?: {
    title: string;
    description: string;
  };
  /** Form submission handler */
  onSubmit: (data: { title: string; description: string }) => Promise<void>;
  /** Submit button label */
  submitLabel?: string;
  /** Form mode: create or edit */
  mode: 'create' | 'edit';
}

/**
 * TaskForm component for creating and editing tasks.
 * Includes validation, loading states, and mobile-friendly UI.
 */
export function TaskForm({
  initialValues = { title: '', description: '' },
  onSubmit,
  submitLabel = 'Save Task',
  mode,
}: TaskFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { formState, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues,
    validationRules: {
      title: [
        composeValidators(
          required('Title is required'),
          maxLength(200, 'Title must be less than 200 characters')
        ),
      ],
      description: [maxLength(1000, 'Description must be less than 1000 characters')],
    },
    onSubmit: async (values) => {
      setError(null);

      try {
        await onSubmit(values);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save task');
        throw err; // Re-throw to keep form in submitting state if needed
      }
    },
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <Input
          id="title"
          name="title"
          type="text"
          value={formState.values.title}
          onChange={handleChange('title')}
          onBlur={handleBlur('title')}
          error={formState.touched.title ? formState.errors.title : undefined}
          placeholder="Enter task title"
          disabled={formState.isSubmitting}
          autoFocus={mode === 'create'}
          required
          fullWidth
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formState.values.description}
          onChange={(e) => handleChange('description')(e)}
          onBlur={handleBlur('description')}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] ${
            formState.touched.description && formState.errors.description
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300'
          }`}
          placeholder="Enter task description (optional)"
          disabled={formState.isSubmitting}
        />
        {formState.touched.description && formState.errors.description && (
          <p className="mt-1 text-sm text-red-600">{formState.errors.description}</p>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          loading={formState.isSubmitting}
          disabled={formState.isSubmitting}
          className="flex-1 sm:flex-none"
        >
          {submitLabel}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={formState.isSubmitting}
          className="flex-1 sm:flex-none"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
