import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/** What a list shows when there is nothing to list: an icon and one sentence saying why and what to do. */
export default function EmptyState({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg bg-surface px-4 py-10 text-center shadow-card sm:px-6 sm:py-12">
      <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-raised text-muted">
        <Icon size={22} />
      </span>
      <p className="max-w-full text-sm break-words text-muted [overflow-wrap:anywhere] sm:text-base">{children}</p>
    </div>
  );
}
