import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('shows the message as plain text and hides the decorative icon', () => {
    const { container } = render(<EmptyState icon={Users}>No employees yet. Add the first one.</EmptyState>);
    expect(screen.getByText('No employees yet. Add the first one.')).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
