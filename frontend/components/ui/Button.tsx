/**
 * Reusable Button component with loading state and variants.
 * Implements T013 from tasks.md
 */

'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { ButtonVariant, ButtonSize } from '@/lib/types';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant for styling */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Show loading spinner and disable button */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Icon to display before text */
  icon?: React.ReactNode;
}

/**
 * Button component with variants, loading states, and touch-friendly sizing.
 * Minimum touch target: 44x44px on mobile.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      icon,
      className = '',
      ...props
    },
    ref
  ) => {
    // Base styles (mobile-first, touch-friendly)
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    // Variant styles
    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800',
      secondary:
        'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 active:bg-gray-400',
      danger:
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
      ghost:
        'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200',
    };

    // Size styles (touch-friendly, minimum 44px height on mobile)
    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'text-sm px-3 py-2 min-h-[40px]',
      md: 'text-base px-4 py-2.5 min-h-[44px]',
      lg: 'text-lg px-6 py-3 min-h-[48px]',
    };

    // Full width style
    const widthStyle = fullWidth ? 'w-full' : '';

    // Combined styles
    const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`;

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={combinedStyles}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-5 w-5"
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
        )}
        {!loading && icon && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
