import { describe, expect, it } from 'vitest';
import { addDays, addMonths, monthGrid, parseIso, sameDay, toIso, today } from './calendar';

describe('toIso and parseIso', () => {
  it('turn a day into "yyyy-mm-dd" and back', () => {
    expect(toIso({ year: 2026, month: 9, day: 7 })).toBe('2026-10-07');
    expect(parseIso('2026-10-07')).toEqual({ year: 2026, month: 9, day: 7 });
  });

  it('rejects text that is not a real day', () => {
    for (const bad of ['', '2026-1-7', '07-10-2026', '2026-02-30', '2026-13-01', '2026-00-10', 'tomorrow']) {
      expect(parseIso(bad)).toBeNull();
    }
  });

  it('accepts 29 February only in a leap year', () => {
    expect(parseIso('2028-02-29')).not.toBeNull();
    expect(parseIso('2027-02-29')).toBeNull();
  });
});

describe('addDays and addMonths', () => {
  it('moves across month and year ends', () => {
    expect(addDays({ year: 2026, month: 11, day: 31 }, 1)).toEqual({ year: 2027, month: 0, day: 1 });
    expect(addDays({ year: 2026, month: 2, day: 1 }, -1)).toEqual({ year: 2026, month: 1, day: 28 });
    expect(addDays({ year: 2026, month: 9, day: 7 }, 7)).toEqual({ year: 2026, month: 9, day: 14 });
  });

  it('keeps the day when it fits and clamps it when it does not', () => {
    expect(addMonths({ year: 2026, month: 9, day: 7 }, 1)).toEqual({ year: 2026, month: 10, day: 7 });
    expect(addMonths({ year: 2026, month: 0, day: 31 }, 1)).toEqual({ year: 2026, month: 1, day: 28 });
    expect(addMonths({ year: 2026, month: 11, day: 15 }, 1)).toEqual({ year: 2027, month: 0, day: 15 });
    expect(addMonths({ year: 2026, month: 0, day: 15 }, -1)).toEqual({ year: 2025, month: 11, day: 15 });
  });
});

describe('monthGrid', () => {
  it('starts weeks on Monday: October 2026 begins on a Thursday', () => {
    const weeks = monthGrid(2026, 9);
    expect(weeks[0]).toEqual([null, null, null, 1, 2, 3, 4]);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });

  it('holds every day of the month exactly once', () => {
    const days = monthGrid(2026, 1).flat().filter((d) => d !== null);
    expect(days).toHaveLength(28);
    expect(days[0]).toBe(1);
    expect(days.at(-1)).toBe(28);
  });

  it('uses four weeks for a February that starts on Monday', () => {
    expect(monthGrid(2027, 1)).toHaveLength(4); // 1 Feb 2027 is a Monday, 28 days
  });
});

describe('today and sameDay', () => {
  it('reads the given moment', () => {
    expect(today(new Date(2026, 9, 7, 15, 30))).toEqual({ year: 2026, month: 9, day: 7 });
    expect(sameDay({ year: 2026, month: 9, day: 7 }, { year: 2026, month: 9, day: 7 })).toBe(true);
    expect(sameDay({ year: 2026, month: 9, day: 7 }, { year: 2026, month: 9, day: 8 })).toBe(false);
  });
});
