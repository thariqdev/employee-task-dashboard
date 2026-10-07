import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

type Meta = { page: number; pageSize: number; total: number; totalPages: number };

const base =
  'inline-flex h-9 items-center justify-center gap-1 rounded-full bg-raised text-xs font-bold transition ' +
  'hover:bg-edge focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50 disabled:hover:bg-raised sm:text-sm';
const labelled = `${base} px-3 sm:px-4 sm:uppercase sm:tracking-[1.4px]`;
const iconOnly = `${base} w-9`;

/** "Showing 11-20 of 345", with buttons for first, previous, next and last page. */
export default function Pagination({ meta, onPage }: { meta: Meta; onPage: (page: number) => void }) {
  const first = meta.page <= 1;
  const last = meta.page >= meta.totalPages;

  return (
    <div className="mt-4 flex flex-col gap-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:text-sm">
      <p>
        Showing {(meta.page - 1) * meta.pageSize + 1}-{Math.min(meta.page * meta.pageSize, meta.total)} of {meta.total}
      </p>
      <div className="flex items-center justify-between gap-1.5 sm:justify-end sm:gap-2">
        <button type="button" aria-label="First page" onClick={() => onPage(1)} disabled={first} className={iconOnly}>
          <ChevronsLeft size={16} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => onPage(meta.page - 1)} disabled={first} className={labelled}>
          <ChevronLeft size={16} aria-hidden="true" className="sm:hidden" />
          <span className="max-sm:sr-only">Previous</span>
        </button>
        <span className="px-1 whitespace-nowrap">
          Page {meta.page} of {meta.totalPages}
        </span>
        <button type="button" onClick={() => onPage(meta.page + 1)} disabled={last} className={labelled}>
          <span className="max-sm:sr-only">Next</span>
          <ChevronRight size={16} aria-hidden="true" className="sm:hidden" />
        </button>
        <button
          type="button"
          aria-label="Last page"
          onClick={() => onPage(meta.totalPages)}
          disabled={last}
          className={iconOnly}
        >
          <ChevronsRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
