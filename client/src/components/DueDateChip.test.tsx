import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DueDateChip from './DueDateChip';

const chipOf = (task: { dueDate: string; status: string; isOverdue: boolean }) => {
  render(<DueDateChip task={task} />);
  return screen.getByText(/\d{4}$/).parentElement!;
};

describe('DueDateChip', () => {
  it('is red and says "Overdue" for an overdue task', () => {
    const chip = chipOf({ dueDate: '2020-01-01T23:59:59.000Z', status: 'PENDING', isOverdue: true });
    expect(chip).toHaveClass('text-danger');
    expect(chip).toHaveTextContent('1 Jan 2020');
    expect(chip).toHaveTextContent('Overdue');
  });

  it('is amber, without an "Overdue" label, when due within 3 days', () => {
    const soon = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const chip = chipOf({ dueDate: soon, status: 'IN_PROGRESS', isOverdue: false });
    expect(chip).toHaveClass('text-warning');
    expect(chip).not.toHaveTextContent('Overdue');
  });

  it('is plain grey for a task due later, and for a finished task even if its date has passed', () => {
    const later = chipOf({ dueDate: '2099-01-01T23:59:59.000Z', status: 'PENDING', isOverdue: false });
    expect(later).toHaveClass('text-muted');
    expect(later).not.toHaveClass('text-warning');
  });

  it('does not flag a completed task as overdue', () => {
    const chip = chipOf({ dueDate: '2020-01-01T23:59:59.000Z', status: 'COMPLETED', isOverdue: false });
    expect(chip).toHaveClass('text-muted');
    expect(chip).not.toHaveTextContent('Overdue');
  });
});
