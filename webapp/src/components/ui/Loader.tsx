import { cn } from '@/utils/cn';

export function Loader({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-10 w-10 border-3',
  };
  return (
    <span
      className={cn(
        'inline-block animate-spin rounded-full border-primary-500 border-t-transparent',
        sizeMap[size],
        className,
      )}
    />
  );
}

export function FullPageLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader size="lg" />
      {label && <p className="text-sm text-ink-soft">{label}</p>}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-card border border-mist p-5 animate-pulse">
      <div className="h-4 w-1/3 bg-mist rounded mb-3" />
      <div className="h-3 w-1/2 bg-mist rounded mb-2" />
      <div className="h-3 w-2/3 bg-mist rounded" />
    </div>
  );
}
