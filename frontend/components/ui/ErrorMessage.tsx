/**
 * Error message component with retry button option.
 * Implements T016 from tasks.md
 */

'use client';

import { Button } from './Button';

interface ErrorMessageProps {
  /** Error message to display */
  message?: string;
  /** Error object with message property */
  error?: Error | null;
  /** Retry callback function */
  onRetry?: () => void;
  /** Custom className */
  className?: string;
  /** Show full error details (for debugging) */
  showDetails?: boolean;
}

/**
 * Error message component with optional retry button.
 * User-friendly error display with retry functionality.
 */
export function ErrorMessage({
  message,
  error,
  onRetry,
  className = '',
  showDetails = false,
}: ErrorMessageProps) {
  const displayMessage =
    message || error?.message || 'An unexpected error occurred';

  return (
    <div
      className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{displayMessage}</p>
            {showDetails && error?.stack && (
              <pre className="mt-2 text-xs overflow-auto max-h-40 bg-red-100 p-2 rounded">
                {error.stack}
              </pre>
            )}
          </div>
          {onRetry && (
            <div className="mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={onRetry}
                aria-label="Retry failed operation"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
