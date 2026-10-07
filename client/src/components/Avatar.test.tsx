import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Avatar, { initialsOf } from './Avatar';

describe('initialsOf', () => {
  it('uses the first letter of the first and last word', () => {
    expect(initialsOf('Asha Rao')).toBe('AR');
    expect(initialsOf('Mary Jane Watson')).toBe('MW');
  });

  it('uses one letter for a single word, in capitals', () => {
    expect(initialsOf('madonna')).toBe('M');
  });

  it('ignores extra spaces and falls back to a question mark for an empty name', () => {
    expect(initialsOf('  asha   rao  ')).toBe('AR');
    expect(initialsOf('   ')).toBe('?');
  });
});

describe('Avatar', () => {
  it('shows the initials, hidden from screen readers, at the requested size', () => {
    const { container } = render(<Avatar name="Asha Rao" size={40} />);
    const badge = container.firstElementChild as HTMLElement;
    expect(badge).toHaveTextContent('AR');
    expect(badge).toHaveAttribute('aria-hidden', 'true');
    expect(badge).toHaveStyle({ width: '40px', height: '40px' });
  });
});
