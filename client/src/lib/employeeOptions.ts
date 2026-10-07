// The choices offered for an employee's position and department, and the rules for a custom ("Other") entry.

export const OTHER = '__other__';

export const POSITIONS = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'QA Engineer',
  'DevOps Engineer',
  'Product Manager',
  'Product Designer',
  'Data Analyst',
  'Financial Analyst',
  'HR Specialist',
  'Marketing Specialist',
  'Sales Executive',
  'Operations Manager',
  'Support Lead',
  'Customer Support Agent',
];

export const DEPARTMENTS = [
  'Engineering',
  'Design',
  'Product',
  'Marketing',
  'Sales',
  'Operations',
  'Customer Support',
  'Finance',
  'Human Resources',
  'IT',
];

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Collapses runs of spaces and trims the ends. */
const tidy = (text: string) => text.trim().replace(/\s+/g, ' ');

/** The list entry that matches `value` (ignoring case and extra spaces), or undefined. */
export function findPreset(list: string[], value: string) {
  return list.find((item) => same(item, tidy(value)));
}

/** Turns a saved value into what the form shows: a listed choice, or "Other" plus the typed text. */
export function splitChoice(list: string[], value: string) {
  if (value.trim() === '') return { choice: '', other: '' };
  const preset = findPreset(list, value);
  return preset ? { choice: preset, other: '' } : { choice: OTHER, other: value };
}

/** What is saved: the chosen entry, or the typed text (tidied) when "Other" is chosen. */
export function resolveChoice(choice: string, other: string) {
  return choice === OTHER ? tidy(other) : choice;
}

const ALLOWED = /^[\p{L}\p{N}][\p{L}\p{N} &.,'/()-]*$/u;

/** The problem with a typed "Other" entry, or null when it is fine. `noun` is "position" or "department". */
export function otherTextError(text: string, list: string[], noun: string): string | null {
  const value = tidy(text);
  if (value === '') return `Enter the ${noun}`;
  if (value.length < 2) return `The ${noun} must be at least 2 characters`;
  if (value.length > 100) return `The ${noun} must be at most 100 characters`;
  if (!/\p{L}/u.test(value)) return `The ${noun} must include at least one letter`;
  if (!ALLOWED.test(value)) return `The ${noun} can only use letters, numbers, spaces and & . , ' / ( ) -`;
  const preset = findPreset(list, value);
  if (preset) return `"${preset}" is already in the list. Choose it from the dropdown`;
  return null;
}
