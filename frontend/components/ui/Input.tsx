/**
 * Reusable Input component with error display and validation state.
 * Implements T014 from tasks.md
 */

'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { InputVariant } from '@/lib/types';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Label text */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text to display below input */
  helperText?: string;
  /** Input variant for styling */
  variant?: InputVariant;
  /** Full width input */
  fullWidth?: boolean;
}

/**
 * Input component with label, error display, and validation states.
 * Accessible with proper ARIA attributes.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      variant = 'default',
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    // Generate unique ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const hasError = Boolean(error);
    const effectiveVariant = hasError ? 'error' : variant;

    // Base styles (mobile-first, touch-friendly)
    const baseStyles =
      'block px-3 py-2.5 min-h-[44px] text-base border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100';

    // Variant styles
    const variantStyles: Record<InputVariant, string> = {
      default:
        'border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900',
      error:
        'border-red-500 focus:border-red-500 focus:ring-red-500 bg-white text-gray-900',
    };

    // Width style
    const widthStyle = fullWidth ? 'w-full' : '';

    // Combined styles
    const combinedStyles = `${baseStyles} ${variantStyles[effectiveVariant]} ${widthStyle} ${className}`;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={combinedStyles}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? errorId : helperText ? helperId : undefined
          }
          {...props}
        />
        {hasError && (
          <p
            id={errorId}
            className="mt-1.5 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
        {!hasError && helperText && (
          <p id={helperId} className="mt-1.5 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
