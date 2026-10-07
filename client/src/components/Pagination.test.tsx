import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Pagination from './Pagination';

const meta = (page: number) => ({ page, pageSize: 10, total: 345, totalPages: 35 });

describe('Pagination', () => {
  it('says which rows are shown and which page this is', () => {
    render(<Pagination meta={meta(2)} onPage={() => {}} />);
    expect(screen.getByText('Showing 11-20 of 345')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 35')).toBeInTheDocument();
  });

  it('jumps to the first and last page, and steps one page at a time', async () => {
    const onPage = vi.fn();
    const user = userEvent.setup();
    render(<Pagination meta={meta(5)} onPage={onPage} />);

    await user.click(screen.getByRole('button', { name: 'First page' }));
    await user.click(screen.getByRole('button', { name: 'Last page' }));
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPage.mock.calls.map((c) => c[0])).toEqual([1, 35, 4, 6]);
  });

  it('disables going back on the first page and going forward on the last', () => {
    const { rerender } = render(<Pagination meta={meta(1)} onPage={() => {}} />);
    expect(screen.getByRole('button', { name: 'First page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();

    rerender(<Pagination meta={meta(35)} onPage={() => {}} />);
    expect(screen.getByRole('button', { name: 'Last page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();
  });
});
