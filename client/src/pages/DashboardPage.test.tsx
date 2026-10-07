import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setToken } from '../lib/auth';
import { createQueryClient } from '../lib/queryClient';
import DashboardPage from './DashboardPage';

/** Answers every list request with a paging total picked from the query string. */
function fakeApi(totals: { employees: number; tasks: Record<string, number> }, fail = false) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string) => {
      if (fail) return { ok: false, status: 403, json: async () => ({ error: { message: 'nope' } }) };
      const url = new URL(input);
      const q = url.searchParams;
      let total: number;
      if (url.pathname.endsWith('/employees')) total = totals.employees;
      else if (q.get('overdue') === 'true') total = totals.tasks.overdue;
      else total = totals.tasks[q.get('status') ?? 'ALL'];
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: [], meta: { page: 1, pageSize: 1, total, totalPages: total } }),
      };
    }),
  );
}

function renderPage() {
  render(
    <QueryClientProvider client={createQueryClient()}>
      <DashboardPage />
    </QueryClientProvider>,
  );
}

const valueOf = (label: string) => screen.getByText(label).nextElementSibling;

describe('DashboardPage', () => {
  beforeEach(() => setToken('t'));
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('shows each count from the API in its own card', async () => {
    fakeApi({ employees: 7, tasks: { ALL: 20, PENDING: 8, IN_PROGRESS: 5, COMPLETED: 7, overdue: 3 } });
    renderPage();

    await waitFor(() => expect(valueOf('Employees')).toHaveTextContent('7'));
    expect(valueOf('Total tasks')).toHaveTextContent('20');
    expect(valueOf('Pending')).toHaveTextContent('8');
    expect(valueOf('In progress')).toHaveTextContent('5');
    expect(valueOf('Completed')).toHaveTextContent('7');
    expect(valueOf('Overdue')).toHaveTextContent('3');
  });

  it('highlights Overdue only when there is something overdue', async () => {
    fakeApi({ employees: 1, tasks: { ALL: 2, PENDING: 2, IN_PROGRESS: 0, COMPLETED: 0, overdue: 2 } });
    renderPage();
    await waitFor(() => expect(valueOf('Overdue')).toHaveTextContent('2'));
    expect(valueOf('Overdue')).toHaveClass('text-danger');
  });

  it('does not highlight Overdue when it is zero', async () => {
    fakeApi({ employees: 1, tasks: { ALL: 2, PENDING: 2, IN_PROGRESS: 0, COMPLETED: 0, overdue: 0 } });
    renderPage();
    await waitFor(() => expect(valueOf('Overdue')).toHaveTextContent('0'));
    expect(valueOf('Overdue')).not.toHaveClass('text-danger');
  });

  it('shows an error with a retry button when the API fails', async () => {
    fakeApi({ employees: 0, tasks: {} }, true);
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the summary');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
