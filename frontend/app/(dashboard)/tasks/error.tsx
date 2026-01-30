/**
 * Error state for tasks page route.
 * Implements T057 from tasks.md
 */

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

/**
 * Route-level error UI shown when tasks page encounters an error.
 * Uses Next.js App Router's error.tsx convention.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for debugging
    console.error('Tasks page error:', error);
  }, [error]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        {/* Error icon */}
        <div className="mb-4">
          <svg
            className="mx-auto h-16 w-16 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Error message */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Failed to Load Tasks
        </h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {error.message || 'An error occurred while loading your tasks. Please try again.'}
        </p>

        {/* Action buttons */}
        <div className="flex gap-4 justify-center">
          <Button onClick={reset} variant="primary">
            Try Again
          </Button>
          <Button
            onClick={() => window.location.href = '/tasks'}
            variant="secondary"
          >
            Refresh Page
          </Button>
        </div>

        {/* Technical details (hidden by default) */}
        {error.digest && (
          <details className="mt-6 text-left max-w-md mx-auto">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
              Technical Details
            </summary>
            <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono text-gray-600 break-all">
              Error ID: {error.digest}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
