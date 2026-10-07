import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SortHeader, { nextSort } from './SortHeader';

const renderHeader = (sort: 'title' | 'status', order: 'asc' | 'desc', onSort = vi.fn()) => {
  render(
    <table>
      <thead>
        <tr>
          <SortHeader label="Task" field="title" sort={sort} order={order} onSort={onSort} />
          <SortHeader label="Status" field="status" sort={sort} order={order} onSort={onSort} />
        </tr>
      </thead>
    </table>,
  );
  return onSort;
};

describe('nextSort', () => {
  it('starts a new column A to Z', () => {
    expect(nextSort({ sort: 'title', order: 'desc' }, 'status')).toEqual({ sort: 'status', order: 'asc' });
  });

  it('flips the direction when the same column is clicked again, and back', () => {
    expect(nextSort({ sort: 'title', order: 'asc' }, 'title')).toEqual({ sort: 'title', order: 'desc' });
    expect(nextSort({ sort: 'title', order: 'desc' }, 'title')).toEqual({ sort: 'title', order: 'asc' });
  });
});

describe('SortHeader', () => {
  it('tells screen readers which column is sorted and which way', () => {
    renderHeader('title', 'desc');
    expect(screen.getByRole('columnheader', { name: /Task/ })).toHaveAttribute('aria-sort', 'descending');
    expect(screen.getByRole('columnheader', { name: /Status/ })).not.toHaveAttribute('aria-sort');
  });

  it('says "ascending" for A to Z', () => {
    renderHeader('status', 'asc');
    expect(screen.getByRole('columnheader', { name: /Status/ })).toHaveAttribute('aria-sort', 'ascending');
  });

  it('reports which column was clicked', async () => {
    const onSort = renderHeader('title', 'asc');
    await userEvent.click(screen.getByRole('button', { name: 'Sort by Status' }));
    expect(onSort).toHaveBeenCalledWith('status');
  });
});
