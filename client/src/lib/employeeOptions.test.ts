import { describe, expect, it } from 'vitest';
import { DEPARTMENTS, OTHER, POSITIONS, findPreset, otherTextError, resolveChoice, splitChoice } from './employeeOptions';

describe('splitChoice', () => {
  it('selects a listed value, ignoring case', () => {
    expect(splitChoice(POSITIONS, 'QA Engineer')).toEqual({ choice: 'QA Engineer', other: '' });
    expect(splitChoice(POSITIONS, 'qa engineer')).toEqual({ choice: 'QA Engineer', other: '' });
  });

  it('turns an unlisted value into "Other" with the text filled in', () => {
    expect(splitChoice(POSITIONS, 'Data Scientist')).toEqual({ choice: OTHER, other: 'Data Scientist' });
  });

  it('starts empty when there is no value', () => {
    expect(splitChoice(DEPARTMENTS, '')).toEqual({ choice: '', other: '' });
    expect(splitChoice(DEPARTMENTS, '   ')).toEqual({ choice: '', other: '' });
  });
});

describe('resolveChoice', () => {
  it('returns the listed choice, or the tidied typed text for "Other"', () => {
    expect(resolveChoice('Finance', 'ignored')).toBe('Finance');
    expect(resolveChoice(OTHER, '  Data   Scientist ')).toBe('Data Scientist');
  });
});

describe('otherTextError', () => {
  const check = (text: string) => otherTextError(text, POSITIONS, 'position');

  it('accepts a sensible custom position', () => {
    expect(check('Data Scientist')).toBeNull();
    expect(check('Sr. Engineer (R&D) - Platform')).toBeNull();
    expect(check('Ingénieur logiciel')).toBeNull();
  });

  it('asks for text when it is empty or blank', () => {
    expect(check('')).toBe('Enter the position');
    expect(check('   ')).toBe('Enter the position');
  });

  it('rejects very short, very long, number-only and odd-character entries', () => {
    expect(check('A')).toBe('The position must be at least 2 characters');
    expect(check('x'.repeat(101))).toBe('The position must be at most 100 characters');
    expect(check('12345')).toBe('The position must include at least one letter');
    expect(check('Dev <script>')).toMatch(/can only use letters/);
    expect(check('-Manager')).toMatch(/can only use letters/);
  });

  it('points to the list when the entry is already in it, ignoring case and spacing', () => {
    expect(check('qa  engineer')).toBe('"QA Engineer" is already in the list. Choose it from the dropdown');
  });

  it('finds presets case-insensitively', () => {
    expect(findPreset(POSITIONS, ' product manager ')).toBe('Product Manager');
    expect(findPreset(POSITIONS, 'nope')).toBeUndefined();
  });
});
