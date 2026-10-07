/** Compares text the way people expect: ignoring case, and "Task 2" before "Task 10". */
const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
export const compareText = (a: string, b: string) => collator.compare(a, b);

/**
 * Sorts every matching row in memory, then returns the ids of one page.
 * Used when the database cannot sort the way people expect (case-insensitive text, or enums by meaning).
 * Fine for thousands of rows: only a few small fields are loaded, not the whole records.
 */
export function pageOfIds<T extends { id: number }>(rows: T[], compare: (a: T, b: T) => number, skip: number, take: number) {
  return [...rows].sort((a, b) => compare(a, b) || a.id - b.id).slice(skip, skip + take).map((row) => row.id);
}

/** Puts records in the order of `ids` (a database lookup by id returns them in no particular order). */
export function inOrderOf<T extends { id: number }>(ids: number[], records: T[]) {
  const byId = new Map(records.map((record) => [record.id, record]));
  return ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
}
