import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FetchingOverlay, Skeleton, TableSkeleton } from './Skeleton';

describe('Skeleton', () => {
  it('is hidden from screen readers', () => {
    const { container } = render(<Skeleton className="h-4" />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('only pulses when the user has not asked for less motion', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild).toHaveClass('motion-safe:animate-pulse');
  });
});

describe('TableSkeleton', () => {
  it('tells screen readers what is loading, with a status role', () => {
    render(<TableSkeleton label="Loading tasks..." />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading tasks...');
  });

  it('draws the requested number of placeholder rows', () => {
    const { container } = render(<TableSkeleton label="Loading" rows={4} />);
    expect(container.querySelectorAll('.space-y-3 > div')).toHaveLength(4);
  });
});

describe('FetchingOverlay', () => {
  it('announces that the list is refreshing', () => {
    render(<FetchingOverlay />);
    expect(screen.getByRole('status')).toHaveTextContent('Refreshing...');
  });
});
