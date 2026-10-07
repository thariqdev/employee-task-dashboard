// Small calendar helpers for the date picker. Dates are plain calendar days ("2026-10-07"), never moments in time.

export type Day = { year: number; month: number; day: number }; // month is 0-11, like JavaScript's Date

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

/** { 2026, 9, 7 } -> "2026-10-07" */
export function toIso({ year, month, day }: Day) {
  return `${pad(year, 4)}-${pad(month + 1)}-${pad(day)}`;
}

/** "2026-10-07" -> { 2026, 9, 7 }, or null when it is not a real calendar day (such as "2026-02-30"). */
export function parseIso(text: string): Day | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]) - 1, Number(match[3])] as const;
  const check = new Date(year, month, day);
  const real = check.getFullYear() === year && check.getMonth() === month && check.getDate() === day;
  return real ? { year, month, day } : null;
}

export function today(now = new Date()): Day {
  return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
}

/** Moves a day forward or back by whole days. */
export function addDays({ year, month, day }: Day, days: number): Day {
  const moved = new Date(year, month, day + days);
  return { year: moved.getFullYear(), month: moved.getMonth(), day: moved.getDate() };
}

/** Moves to the same day in another month, clamped to that month's length (31 Jan + 1 month = 28 Feb). */
export function addMonths({ year, month, day }: Day, months: number): Day {
  const target = new Date(year, month + months, 1);
  const length = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return { year: target.getFullYear(), month: target.getMonth(), day: Math.min(day, length) };
}

/** The weeks of a month, Monday first. Each cell is a day number, or null for a blank before or after. */
export function monthGrid(year: number, month: number): (number | null)[][] {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7; // 0 = Monday
  const length = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array<null>(offset).fill(null), ...Array.from({ length }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7));
}

export const sameDay = (a: Day, b: Day) => a.year === b.year && a.month === b.month && a.day === b.day;
