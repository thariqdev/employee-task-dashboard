import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setToken } from '../lib/auth';
import { createQueryClient } from '../lib/queryClient';
import DashboardPage from './DashboardPage';

/** Answers every list request with a paging total picked from the query string. */
type OverdueTask = { id: number; title: string; dueDate: string; assignee: { id: number; name: string } | null };

function fakeApi(
  totals: { employees: number; tasks: Record<string, number> },
  fail = false,
  overdueTasks: OverdueTask[] = [],
) {
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
      // The "Needs attention" list asks for 5 rows; the count requests ask for 1.
      const rows = q.get('pageSize') === '5' ? overdueTasks : [];
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: rows, meta: { page: 1, pageSize: 1, total, totalPages: total } }),
      };
    }),
  );
}

function renderPage() {
  render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
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
    expect(await screen.findByText(/Could not load the summary/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Try again' }).length).toBeGreaterThan(0);
  });

  it('lists the overdue tasks with their assignee and due date', async () => {
    fakeApi({ employees: 1, tasks: { ALL: 3, PENDING: 2, IN_PROGRESS: 1, COMPLETED: 0, overdue: 2 } }, false, [
      { id: 1, title: 'Fix the login bug', dueDate: '2026-09-01T23:59:59.000Z', assignee: { id: 4, name: 'Asha Rao' } },
      { id: 2, title: 'Write the report', dueDate: '2026-09-10T23:59:59.000Z', assignee: null },
    ]);
    renderPage();

    expect(await screen.findByText('Fix the login bug')).toBeInTheDocument();
    expect(screen.getByText('Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('Due 1 Sept 2026')).toBeInTheDocument();
    expect(screen.getByText('Write the report')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View all tasks' })).toHaveAttribute('href', '/tasks');

    // The list must ask only for overdue tasks, five at a time.
    const urls = (fetch as unknown as { mock: { calls: string[][] } }).mock.calls.map((call) => call[0]!);
    expect(urls.some((u) => u.includes('pageSize=5') && u.includes('overdue=true'))).toBe(true);
  });

  it('says so when nothing is overdue', async () => {
    fakeApi({ employees: 1, tasks: { ALL: 2, PENDING: 2, IN_PROGRESS: 0, COMPLETED: 0, overdue: 0 } });
    renderPage();
    expect(await screen.findByText('Nothing is overdue.')).toBeInTheDocument();
  });

  it('shows the hovered status in the middle of the donut, and the total again afterwards', async () => {
    fakeApi({ employees: 1, tasks: { ALL: 20, PENDING: 8, IN_PROGRESS: 5, COMPLETED: 7, overdue: 3 } });
    renderPage();
    const center = await screen.findByTestId('donut-center');
    expect(center).toHaveTextContent('20in total');

    await userEvent.hover(screen.getByText('Completed: 7'));
    expect(center).toHaveTextContent('7Completed');

    await userEvent.unhover(screen.getByText('Completed: 7'));
    expect(center).toHaveTextContent('20in total');
  });

  it('describes the charts in words for screen readers', async () => {
    fakeApi({ employees: 1, tasks: { ALL: 20, PENDING: 8, IN_PROGRESS: 5, COMPLETED: 7, overdue: 3 } });
    renderPage();

    expect(
      await screen.findByRole('img', { name: /Tasks by status\. Pending: 8, In progress: 5, Completed: 7/ }),
    ).toBeInTheDocument();
    // 8 pending + 5 in progress = 13 open, 3 of them overdue.
    expect(screen.getByRole('img', { name: 'Open work. On track: 10, past due: 3' })).toBeInTheDocument();
  });
});
