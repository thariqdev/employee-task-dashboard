import { describe, expect, it } from 'vitest';
import { endOfDayUtc, formatDueDate, toDateInput } from './dates';

describe('dates', () => {
  it('turns a timestamp into the value a date input expects', () => {
    expect(toDateInput('2026-10-20T23:59:59.000Z')).toBe('2026-10-20');
  });

  it('uses the end of the day, so a task due today is not overdue until the day is over', () => {
    expect(endOfDayUtc('2026-10-20')).toBe('2026-10-20T23:59:59Z');
  });

  it('formats the UTC day, whatever the time zone of the computer', () => {
    expect(formatDueDate('2026-10-20T00:00:00.000Z')).toBe('20 Oct 2026');
    expect(formatDueDate('2026-10-20T23:59:59.000Z')).toBe('20 Oct 2026');
  });
});
