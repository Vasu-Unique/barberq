import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
  className?: string;
  compact?: boolean;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  onLimitChange,
  limitOptions = [5, 10, 20, 50],
  className,
  compact = false,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);

  // Calculate items range
  const startItem = totalItems ? Math.min((safePage - 1) * limit + 1, totalItems) : (safePage - 1) * limit + 1;
  const endItem = totalItems ? Math.min(safePage * limit, totalItems) : safePage * limit;

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (safeTotalPages <= 7) {
      for (let i = 1; i <= safeTotalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (safePage > 3) pages.push('...');

    const start = Math.max(2, safePage - 1);
    const end = Math.min(safeTotalPages - 1, safePage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (safePage < safeTotalPages - 2) pages.push('...');
    pages.push(safeTotalPages);

    return pages;
  };

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-mist text-xs sm:text-sm text-ink-soft',
        className
      )}
    >
      {/* Information text */}
      <div className="flex items-center gap-3">
        {totalItems !== undefined ? (
          <span>
            Showing <strong className="text-ink font-semibold">{totalItems === 0 ? 0 : startItem}</strong> to{' '}
            <strong className="text-ink font-semibold">{endItem}</strong> of{' '}
            <strong className="text-ink font-semibold">{totalItems}</strong> results
          </span>
        ) : (
          <span>
            Page <strong className="text-ink font-semibold">{safePage}</strong> of{' '}
            <strong className="text-ink font-semibold">{safeTotalPages}</strong>
          </span>
        )}

        {/* Page size selector */}
        {onLimitChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-ink-muted">Per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="bg-white border border-mist rounded-lg px-2 py-1 text-xs text-ink font-medium focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
            >
              {limitOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page navigation controls */}
      <div className="flex items-center gap-1">
        {!compact && (
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={safePage <= 1}
            title="First Page"
            aria-label="First page"
            className="p-1.5 rounded-lg border border-mist bg-white text-ink hover:bg-mist-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        )}

        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          title="Previous Page"
          aria-label="Previous page"
          className="p-1.5 rounded-lg border border-mist bg-white text-ink hover:bg-mist-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {!compact &&
          getPageNumbers().map((p, idx) =>
            typeof p === 'string' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-ink-muted select-none">
                ...
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={cn(
                  'min-w-8 h-8 px-2 text-xs font-semibold rounded-lg transition-colors',
                  p === safePage
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-white border border-mist text-ink hover:bg-mist-light'
                )}
              >
                {p}
              </button>
            )
          )}

        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= safeTotalPages}
          title="Next Page"
          aria-label="Next page"
          className="p-1.5 rounded-lg border border-mist bg-white text-ink hover:bg-mist-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {!compact && (
          <button
            type="button"
            onClick={() => onPageChange(safeTotalPages)}
            disabled={safePage >= safeTotalPages}
            title="Last Page"
            aria-label="Last page"
            className="p-1.5 rounded-lg border border-mist bg-white text-ink hover:bg-mist-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
