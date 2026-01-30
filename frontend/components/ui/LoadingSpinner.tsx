/**
 * Loading spinner component for async operations.
 * Implements T015 from tasks.md
 */

'use client';

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
  /** Loading message to display */
  message?: string;
}

/**
 * Loading spinner with optional message.
 * Accessible with proper ARIA attributes.
 */
export function LoadingSpinner({
  size = 'md',
  className = '',
  message,
}: LoadingSpinnerProps) {
  // Size styles
  const sizeStyles = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const spinnerSize = sizeStyles[size];

  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <svg
        className={`animate-spin text-blue-600 ${spinnerSize}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {message && (
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
