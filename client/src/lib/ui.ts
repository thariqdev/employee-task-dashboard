// Shared Tailwind class strings, so buttons, inputs and tables look the same on every page.
// They follow DESIGN.md: pill buttons with uppercase labels, inset-border inputs, heavy shadows.

const button =
  'inline-flex h-9 items-center justify-center rounded-full px-4 text-xs font-bold whitespace-nowrap uppercase tracking-[1px] sm:px-5 sm:text-sm sm:tracking-[1.4px] ' +
  'transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60';

export const primaryButton = `${button} bg-accent text-white hover:bg-accent-hover hover:text-black`;
export const secondaryButton = `${button} bg-raised text-ink hover:bg-edge disabled:hover:bg-raised`;
/** Solid rose: only for the final "Delete" in a confirmation dialog. */
export const dangerButton = `${button} bg-danger text-black hover:brightness-110`;

const textButton =
  'rounded-full px-3 py-1 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-accent';
export const ghostButton = `${textButton} text-muted hover:bg-raised hover:text-ink`;
export const ghostDangerButton = `${textButton} text-danger hover:bg-danger-tint`;

const field =
  'bg-raised text-ink shadow-[inset_0_0_0_1px_var(--color-edge)] ' +
  'focus:outline-none focus:shadow-[inset_0_0_0_2px_var(--color-accent)] ' +
  'aria-[invalid=true]:shadow-[inset_0_0_0_1px_var(--color-danger)]';

export const inputClass = `mt-1 block h-10 w-full rounded px-3 text-base sm:h-9 sm:text-sm ${field}`;
/** A textarea has no fixed height. */
export const textareaClass = `mt-1 block w-full rounded px-3 py-2 text-base sm:text-sm ${field}`;
/** A search box or filter in a toolbar: a pill with no label above it. */
export const filterClass = `h-9 rounded-full px-4 text-sm ${field}`;

export const errorTextClass = 'mt-1 text-sm text-danger';
export const alertClass = 'rounded-lg bg-danger-tint px-3 py-2 text-sm text-danger';

/** The table scrolls inside this box, so its sticky header stays visible. */
export const tableWrapClass = 'overflow-auto rounded-lg bg-surface shadow-card md:max-h-[calc(100dvh-17rem)]';
// border-separate (not the default "collapse") so the sticky header sits flush: with collapse, a 1px gap can
// open above it and let the text of rows that scrolled underneath show through as a bright line.
export const tableClass = 'w-full min-w-[40rem] border-separate border-spacing-0 text-xs sm:text-sm';
export const theadClass = 'text-left text-xs font-bold text-muted';
export const thClass = 'sticky top-0 z-10 bg-surface px-3 py-2.5 shadow-[0_1px_0_var(--color-line)] sm:px-4 sm:py-3';
// Row dividers are drawn on the cells, because rows cannot have borders in a border-separate table.
export const tbodyClass = '[&>tr:last-child>td]:border-b-0 [&>tr>td]:border-b [&>tr>td]:border-line';
export const trClass = 'transition-colors hover:bg-raised';
export const tdClass = 'px-3 py-2 sm:px-4 sm:py-2.5';
