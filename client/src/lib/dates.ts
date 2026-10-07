// Due dates are handled as calendar days in UTC, so a day never shifts when the browser's time zone changes.

/** "2026-10-20T23:59:59.000Z" -> "2026-10-20" (the value a date input expects). */
export function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

/**
 * A date input only gives a day. The API stores a moment in time and calls a task overdue once that moment
 * has passed, so a bare day (midnight) would make a task due today overdue all day long. Use the end of the day.
 */
export function endOfDayUtc(date: string) {
  return `${date}T23:59:59Z`;
}

/** "2026-10-20T..." -> "20 Oct 2026" */
export function formatDueDate(iso: string) {
  return new Date(`${toDateInput(iso)}T00:00:00Z`).toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export type DueState = 'overdue' | 'soon' | 'done' | 'later';

const SOON_MS = 3 * 24 * 60 * 60 * 1000;

/** How urgent a task's due date is: finished, overdue, due within 3 days, or not yet. */
export function dueState(task: { dueDate: string; status: string; isOverdue: boolean }, now = new Date()): DueState {
  if (task.status === 'COMPLETED') return 'done';
  if (task.isOverdue) return 'overdue';
  return new Date(task.dueDate).getTime() - now.getTime() <= SOON_MS ? 'soon' : 'later';
}
