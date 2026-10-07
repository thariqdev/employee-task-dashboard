// Shared Tailwind class strings, so buttons, inputs and tables look the same on every page.

const button =
  'inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60';

export const primaryButton = `${button} bg-accent text-white hover:bg-accent-hover`;
export const secondaryButton = `${button} border border-line bg-surface text-ink hover:bg-page disabled:hover:bg-surface`;
/** Solid red: only for the final "Delete" in a confirmation dialog. */
export const dangerButton = `${button} bg-danger text-white hover:bg-red-700`;

const textButton =
  'rounded-md px-2 py-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent';
export const ghostButton = `${textButton} text-muted hover:bg-page hover:text-ink`;
export const ghostDangerButton = `${textButton} text-danger hover:bg-danger-tint`;

const field =
  'rounded-md border border-line bg-surface px-3 text-sm ' +
  'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 aria-[invalid=true]:border-danger';

export const inputClass = `mt-1 block h-9 w-full ${field}`;
/** A textarea has no fixed height. */
export const textareaClass = `mt-1 block w-full py-2 ${field}`;
/** A filter control that sits in a toolbar, with no label above it. */
export const filterClass = `h-9 ${field}`;

export const errorTextClass = 'mt-1 text-sm text-danger';
export const alertClass = 'rounded-md bg-danger-tint px-3 py-2 text-sm text-danger';

export const tableWrapClass = 'overflow-x-auto rounded-lg border border-line bg-surface';
export const tableClass = 'min-w-full text-sm';
export const theadClass = 'bg-page text-left text-xs font-medium text-muted';
export const thClass = 'px-4 py-2.5';
export const tbodyClass = 'divide-y divide-line';
export const trClass = 'hover:bg-page';
export const tdClass = 'px-4 py-2.5';
