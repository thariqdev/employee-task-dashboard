import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LogoMark, Wordmark } from './Logo';

describe('Logo', () => {
  it('draws the mark at the requested size and hides it from screen readers', () => {
    const { container } = render(<LogoMark size={40} />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('width', '40');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('spells the product name in the wordmark', () => {
    render(<Wordmark />);
    expect(screen.getByText('Desk')).toBeInTheDocument();
    expect(screen.getByText('Desk').parentElement).toHaveTextContent('TaskDesk');
  });
});
