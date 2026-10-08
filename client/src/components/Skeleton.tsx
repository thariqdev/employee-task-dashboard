import { LoaderCircle } from 'lucide-react';

/** A grey placeholder block that pulses while real content loads (still when the user prefers less motion). */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`rounded-md bg-raised motion-safe:animate-pulse ${className}`} />;
}

/** Placeholder rows for a table that is loading. Screen readers hear `label` instead of the grey blocks. */
export function TableSkeleton({ label, rows = 6 }: { label: string; rows?: number }) {
  return (
    <div role="status" className="rounded-lg bg-surface p-4 shadow-card">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-4 w-1/3" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-4 w-1/4 sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Covers a table while its data is being refreshed (after a page change, a delete, or any other change). */
export function FetchingOverlay() {
  return (
    <div
      role="status"
      className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-page/60"
    >
      <span className="flex items-center gap-2 rounded-full bg-raised px-4 py-2 text-sm font-bold shadow-pop">
        <LoaderCircle size={18} aria-hidden="true" className="text-accent motion-safe:animate-spin" />
        Refreshing...
      </span>
    </div>
  );
}
