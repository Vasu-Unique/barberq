import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import type { TokenStatus } from '@/data/types';
import { STATUS_META } from '@/data/store';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full',
  {
    variants: {
      variant: {
        neutral: 'bg-mist text-ink-soft',
        primary: 'bg-primary-100 text-primary-700',
        coral: 'bg-coral-100 text-coral-700',
        gold: 'bg-gold-100 text-gold-700',
        danger: 'bg-danger-100 text-danger-700',
        success: 'bg-primary-100 text-primary-700',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', 'bg-current opacity-70')} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: TokenStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full',
        meta.bg,
        meta.color,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}
