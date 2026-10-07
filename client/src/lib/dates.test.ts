import { describe, expect, it } from 'vitest';
import { dueState, endOfDayUtc, formatDueDate, toDateInput } from './dates';

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

  describe('dueState', () => {
    const now = new Date('2026-10-10T12:00:00Z');
    const open = { status: 'PENDING', isOverdue: false };

    it('is "done" for a completed task, even when it is past its date', () => {
      expect(dueState({ dueDate: '2026-01-01T23:59:59Z', status: 'COMPLETED', isOverdue: false }, now)).toBe('done');
    });

    it('is "overdue" when the API says so', () => {
      expect(dueState({ dueDate: '2026-10-01T23:59:59Z', status: 'PENDING', isOverdue: true }, now)).toBe('overdue');
    });

    it('is "soon" within 3 days and "later" after that', () => {
      expect(dueState({ ...open, dueDate: '2026-10-13T12:00:00Z' }, now)).toBe('soon'); // exactly 3 days
      expect(dueState({ ...open, dueDate: '2026-10-13T12:00:01Z' }, now)).toBe('later');
      expect(dueState({ ...open, dueDate: '2026-10-10T23:59:59Z' }, now)).toBe('soon'); // due today
    });
  });
});
