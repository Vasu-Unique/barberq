import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none',
  {
    variants: {
      variant: {
        primary: 'bg-coral-500 text-white hover:bg-coral-600 shadow-sm hover:shadow-md',
        secondary: 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm hover:shadow-md',
        outline: 'border border-mist bg-white text-ink hover:bg-mist-light hover:border-primary-300',
        ghost: 'text-ink-soft hover:bg-mist-light hover:text-ink',
        danger: 'bg-danger-500 text-white hover:bg-danger-600 shadow-sm hover:shadow-md',
        gold: 'bg-gold-500 text-white hover:bg-gold-600 shadow-sm hover:shadow-md',
        subtle: 'bg-mint text-primary-700 hover:bg-primary-100',
      },
      size: {
        sm: 'h-9 px-4 text-sm rounded-btn',
        md: 'h-11 px-5 text-sm rounded-btn',
        lg: 'h-13 px-7 text-base rounded-btn',
        icon: 'h-10 w-10 rounded-btn',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  leftIcon,
  rightIcon,
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
