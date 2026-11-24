import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, hint, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-ink mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">{leftIcon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-11 rounded-btn border bg-white px-4 text-sm text-ink placeholder:text-ink-soft/60',
              'transition-all duration-200 ease-smooth',
              'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400',
              error ? 'border-danger-300' : 'border-mist',
              leftIcon && 'pl-10',
              className,
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-danger-600">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-ink-soft">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-ink mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full rounded-btn border bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-soft/60',
            'transition-all duration-200 ease-smooth resize-none',
            'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400',
            error ? 'border-danger-300' : 'border-mist',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-danger-600">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const selectId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-ink mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full h-11 rounded-btn border bg-white px-4 text-sm text-ink',
            'transition-all duration-200 ease-smooth cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400',
            error ? 'border-danger-300' : 'border-mist',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1.5 text-xs text-danger-600">{error}</p>}
      </div>
    );
  },
);
Select.displayName = 'Select';
