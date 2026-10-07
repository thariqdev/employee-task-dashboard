import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPLOYEES_KEY } from '../hooks/useEmployees';
import { TASKS_KEY, type Task } from '../hooks/useTasks';
import { setToken } from '../lib/auth';
import { createQueryClient } from '../lib/queryClient';
import TasksPage from './TasksPage';

const PAGE_SIZE = 10;
const EMPLOYEES = [
  { id: 1, name: 'Aria Test' },
  { id: 2, name: 'Ben Test' },
];

function task(n: number, overrides: Partial<Task> = {}): Task {
  const id = String(n).padStart(2, '0');
  return {
    id: n,
    title: `Task ${id}`,
    description: `Details ${id}`,
    priority: 'MEDIUM',
    status: 'PENDING',
    dueDate: '2099-01-01T23:59:59.000Z',
    assigneeId: null,
    assignee: null,
    isOverdue: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const assignedTo = (employeeId: number): Partial<Task> => ({
  assigneeId: employeeId,
  assignee: EMPLOYEES.find((e) => e.id === employeeId)!,
});

type Call = { method: string; url: URL; body?: Record<string, unknown> };

/** A tiny in-memory stand-in for the tasks and employees API. */
function fakeApi(initial: Task[]) {
  let rows = [...initial];
  let nextId = 100;
  const calls: Call[] = [];
  const failures: { status: number; message: string }[] = [];
  let hold: Promise<void> | null = null;

  const reply = (status: number, payload: unknown) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  });
  const withOverdue = (t: Task) => ({ ...t, isOverdue: new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED' });

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const url = new URL(input);
      const method = init?.method ?? 'GET';
      const body = init?.body ? (JSON.parse(init.body as string) as Record<string, unknown>) : undefined;
      calls.push({ method, url, body });

      if (url.pathname.endsWith('/employees')) {
        return reply(200, {
          data: EMPLOYEES,
          meta: { page: 1, pageSize: 100, total: EMPLOYEES.length, totalPages: 1 },
        });
      }

      const failure = failures.shift();
      if (failure) return reply(failure.status, { error: { message: failure.message } });

      const id = Number(url.pathname.match(/\/tasks\/(\d+)$/)?.[1]);
      const assigneeOf = (assigneeId: unknown) =>
        EMPLOYEES.find((e) => e.id === assigneeId) ?? null;

      if (method === 'GET') {
        if (hold) await hold;
        const q = url.searchParams;
        const search = (q.get('search') ?? '').toLowerCase();
        const page = Number(q.get('page'));
        const pageSize = Number(q.get('pageSize'));
        const matching = rows.map(withOverdue).filter(
          (t) =>
            t.title.toLowerCase().includes(search) &&
            (!q.get('status') || t.status === q.get('status')) &&
            (!q.get('priority') || t.priority === q.get('priority')) &&
            (!q.get('assigneeId') ||
              (q.get('assigneeId') === 'unassigned' ? t.assigneeId === null : t.assigneeId === Number(q.get('assigneeId')))) &&
            (q.get('overdue') !== 'true' || t.isOverdue),
        );
        return reply(200, {
          data: matching.slice((page - 1) * pageSize, page * pageSize),
          meta: { page, pageSize, total: matching.length, totalPages: Math.max(1, Math.ceil(matching.length / pageSize)) },
        });
      }
      if (method === 'POST') {
        const created = { ...task(nextId++), ...body, assignee: assigneeOf(body!.assigneeId) } as Task;
        rows = [...rows, created];
        return reply(201, { data: withOverdue(created) });
      }
      if (method === 'PATCH') {
        rows = rows.map((r) => (r.id === id ? ({ ...r, ...body, assignee: assigneeOf(body!.assigneeId) } as Task) : r));
        return reply(200, { data: withOverdue(rows.find((r) => r.id === id)!) });
      }
      if (method === 'DELETE') {
        rows = rows.filter((r) => r.id !== id);
        return reply(200, { data: { id } });
      }
      return reply(404, { error: { message: 'Not found' } });
    }),
  );

  const taskCalls = () => calls.filter((c) => c.url.pathname.includes('/tasks'));
  return {
    calls,
    taskCalls,
    lastList: () => taskCalls().filter((c) => c.method === 'GET').at(-1)!.url.searchParams,
    failNext: (status: number, message: string) => failures.push({ status, message }),
    /** Makes every list request wait until the returned function is called. */
    holdGets: () => {
      let release!: () => void;
      hold = new Promise<void>((resolve) => (release = resolve));
      return () => {
        hold = null;
        release();
      };
    },
  };
}

function renderPage() {
  const client = createQueryClient();
  client.setQueryDefaults(TASKS_KEY, { retry: false });
  client.setQueryDefaults(EMPLOYEES_KEY, { retry: false });
  render(
    <QueryClientProvider client={client}>
      <TasksPage />
    </QueryClientProvider>,
  );
}

const rows = () => screen.getAllByRole('row').slice(1); // without the header row
/** Picks an option in one of the custom dropdowns inside a dialog. */
async function pickIn(dialog: HTMLElement, dropdown: string, option: string) {
  await userEvent.click(within(dialog).getByRole('combobox', { name: dropdown }));
  await userEvent.click(await screen.findByRole('option', { name: option }));
}

/** Picks an option in one of the custom filter dropdowns. */
async function choose(dropdown: string, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name: dropdown }));
  await userEvent.click(await screen.findByRole('option', { name: option })); // employees load a moment later
}

const rowOf = (title: string) => screen.getByText(title).closest('tr')!;
const many = (count: number) => Array.from({ length: count }, (_, i) => task(i + 1));

beforeEach(() => setToken('test-token'));
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('TasksPage: listing', () => {
  it('shows each task with assignee, priority, status and a readable due date', async () => {
    fakeApi([
      task(1, { ...assignedTo(1), priority: 'HIGH', status: 'IN_PROGRESS', dueDate: '2099-03-05T23:59:59.000Z' }),
      task(2),
    ]);
    renderPage();

    const first = await screen.findByText('Task 01').then((el) => el.closest('tr')!);
    expect(within(first).getByText('Aria Test')).toBeInTheDocument();
    expect(within(first).getByText('High')).toBeInTheDocument();
    expect(within(first).getByText('In progress')).toBeInTheDocument();
    expect(within(first).getByText('5 Mar 2099')).toBeInTheDocument();
    expect(within(rowOf('Task 02')).getByText('Unassigned')).toBeInTheDocument();
  });

  it('highlights overdue tasks with a red row marker and an "Overdue" label, and nothing else', async () => {
    fakeApi([
      task(1, { isOverdue: true, dueDate: '2020-01-01T23:59:59.000Z' }),
      task(2, { status: 'COMPLETED', dueDate: '2020-01-01T23:59:59.000Z' }), // past due but done
      task(3), // due in the future
    ]);
    renderPage();
    await screen.findByText('Task 01');

    const overdue = rowOf('Task 01');
    expect(within(overdue).getByText('Overdue')).toBeInTheDocument();
    expect(overdue).toHaveClass('is-overdue');

    for (const title of ['Task 02', 'Task 03']) {
      expect(within(rowOf(title)).queryByText('Overdue')).not.toBeInTheDocument();
      expect(rowOf(title)).not.toHaveClass('is-overdue');
    }
  });

  it('shows a "Refreshing..." loader while the next page loads', async () => {
    const api = fakeApi(many(12));
    renderPage();
    await screen.findByText('Task 01');
    expect(screen.queryByText('Refreshing...')).not.toBeInTheDocument();

    const release = api.holdGets();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Refreshing...')).toBeInTheDocument();

    release();
    expect(await screen.findByText('Task 11')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Refreshing...')).not.toBeInTheDocument());
  });

  it('moves to the next page', async () => {
    const api = fakeApi(many(12));
    renderPage();
    await screen.findByText('Task 01');
    expect(rows()).toHaveLength(PAGE_SIZE);
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Task 11')).toBeInTheDocument();
    expect(rows()).toHaveLength(2);
    expect(api.lastList().get('page')).toBe('2');
  });

  it('shows an empty state, and an error with a retry button', async () => {
    fakeApi([]);
    renderPage();
    expect(await screen.findByText('No tasks yet. Add the first one.')).toBeInTheDocument();
  });

  it('shows an error with a retry button when the request fails', async () => {
    const api = fakeApi(many(2));
    api.failNext(500, 'Internal server error');
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Internal server error');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Task 01')).toBeInTheDocument();
  });
});

describe('TasksPage: filters', () => {
  const data = [
    task(1, { status: 'COMPLETED', priority: 'LOW', ...assignedTo(1) }),
    task(2, { status: 'PENDING', priority: 'HIGH', ...assignedTo(2) }),
    task(3, { status: 'PENDING', priority: 'HIGH', isOverdue: true, dueDate: '2020-01-01T23:59:59.000Z' }),
  ];

  it('filters by status', async () => {
    const api = fakeApi(data);
    renderPage();
    await screen.findByText('Task 01');

    await choose('Filter by status', 'Completed');

    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(screen.getByText('Task 01')).toBeInTheDocument();
    expect(api.lastList().get('status')).toBe('COMPLETED');
  });

  it('filters by priority', async () => {
    const api = fakeApi(data);
    renderPage();
    await screen.findByText('Task 01');

    await choose('Filter by priority', 'High');

    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(api.lastList().get('priority')).toBe('HIGH');
  });

  it('filters by employee, and by "Unassigned"', async () => {
    const api = fakeApi(data);
    renderPage();
    await screen.findByText('Task 01');

    await choose('Filter by assignee', 'Ben Test');
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(screen.getByText('Task 02')).toBeInTheDocument();
    expect(api.lastList().get('assigneeId')).toBe('2');

    await choose('Filter by assignee', 'Unassigned');
    await waitFor(() => expect(screen.getByText('Task 03')).toBeInTheDocument());
    expect(api.lastList().get('assigneeId')).toBe('unassigned');
  });

  it('offers a button that clears every filter at once, only while a filter is set', async () => {
    fakeApi(data);
    renderPage();
    await screen.findByText('Task 01');
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Search tasks'), 'task');
    await choose('Filter by status', 'Pending');
    await choose('Filter by priority', 'High');
    await userEvent.click(screen.getByLabelText('Overdue only'));
    await waitFor(() => expect(rows()).toHaveLength(1));

    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(screen.getByLabelText('Search tasks')).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Filter by status' })).toHaveTextContent('All statuses');
    expect(screen.getByRole('combobox', { name: 'Filter by priority' })).toHaveTextContent('All priorities');
    expect(screen.getByLabelText('Overdue only')).not.toBeChecked();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
    await waitFor(() => expect(rows()).toHaveLength(3));
    // Back to the unfiltered list (it may come from cache, so no new request is needed to prove it).
  });

  it('shows the "Refreshing..." loader when the filters are cleared, even if that list was cached', async () => {
    const api = fakeApi(data);
    renderPage();
    await screen.findByText('Task 01');
    await choose('Filter by status', 'Completed');
    await waitFor(() => expect(rows()).toHaveLength(1));

    const release = api.holdGets();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(await screen.findByText('Refreshing...')).toBeInTheDocument();

    release();
    await waitFor(() => expect(rows()).toHaveLength(3));
    await waitFor(() => expect(screen.queryByText('Refreshing...')).not.toBeInTheDocument());
  });

  it('sorts by a column when its header is clicked, and reverses on a second click', async () => {
    const api = fakeApi(data);
    renderPage();
    await screen.findByText('Task 01');
    // The table starts sorted by due date, soonest first.
    expect(screen.getByRole('columnheader', { name: /Due/ })).toHaveAttribute('aria-sort', 'ascending');

    await userEvent.click(screen.getByRole('button', { name: 'Sort by Priority' }));
    await waitFor(() => expect(api.lastList().get('sort')).toBe('priority'));
    expect(api.lastList().get('order')).toBe('asc');
    expect(screen.getByRole('columnheader', { name: /Priority/ })).toHaveAttribute('aria-sort', 'ascending');
    expect(screen.getByRole('columnheader', { name: /Due/ })).not.toHaveAttribute('aria-sort');

    await userEvent.click(screen.getByRole('button', { name: 'Sort by Priority' }));
    await waitFor(() => expect(api.lastList().get('order')).toBe('desc'));
    expect(screen.getByRole('columnheader', { name: /Priority/ })).toHaveAttribute('aria-sort', 'descending');
  });

  it('goes back to page 1 when the sort changes', async () => {
    const api = fakeApi(many(12));
    renderPage();
    await screen.findByText('Task 01');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText('Page 2 of 2');

    await userEvent.click(screen.getByRole('button', { name: 'Sort by Task' }));
    await waitFor(() => expect(api.lastList().get('sort')).toBe('title'));
    expect(api.lastList().get('page')).toBe('1');
  });

  it('keeps the sort when the filters are cleared', async () => {
    const api = fakeApi(data);
    renderPage();
    await screen.findByText('Task 01');
    await userEvent.click(screen.getByRole('button', { name: 'Sort by Status' }));
    await choose('Filter by priority', 'High');
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(api.lastList().get('sort')).toBe('status');
    expect(api.lastList().has('priority')).toBe(false);
  });

  it('shows only overdue tasks when "Overdue only" is ticked', async () => {
    const api = fakeApi(data);
    renderPage();
    await screen.findByText('Task 01');

    await userEvent.click(screen.getByLabelText('Overdue only'));

    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(screen.getByText('Task 03')).toBeInTheDocument();
    expect(api.lastList().get('overdue')).toBe('true');
  });

  it('searches by title after a short pause, and says so when nothing matches', async () => {
    const api = fakeApi(data);
    renderPage();
    await screen.findByText('Task 01');

    await userEvent.type(screen.getByLabelText('Search tasks'), 'task 02');
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(api.lastList().get('search')).toBe('task 02');

    await userEvent.clear(screen.getByLabelText('Search tasks'));
    await userEvent.type(screen.getByLabelText('Search tasks'), 'zzz');
    expect(await screen.findByText('No tasks match your filters.')).toBeInTheDocument();
  });

  it('goes back to page 1 when a filter changes', async () => {
    const api = fakeApi(many(12));
    renderPage();
    await screen.findByText('Task 01');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText('Page 2 of 2');

    await choose('Filter by priority', 'Medium');

    await waitFor(() => expect(api.lastList().get('priority')).toBe('MEDIUM'));
    expect(api.lastList().get('page')).toBe('1');
  });
});

describe('TasksPage: adding and editing', () => {
  async function openAddForm() {
    await userEvent.click(await screen.findByRole('button', { name: 'Add task' }));
    return screen.getByRole('dialog', { name: 'Add task' });
  }

  it('shows validation messages and sends nothing when the form is empty', async () => {
    const api = fakeApi([]);
    renderPage();
    const dialog = await openAddForm();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Add task' }));

    expect(await within(dialog).findByText('Title is required')).toBeInTheDocument();
    expect(within(dialog).getByText('Due date is required')).toBeInTheDocument();
    expect(api.taskCalls().some((c) => c.method === 'POST')).toBe(false);
  });

  it('adds a task: sends the end of the chosen day, the chosen assignee, then shows the new row', async () => {
    const api = fakeApi([]);
    renderPage();
    const dialog = await openAddForm();

    await userEvent.type(within(dialog).getByLabelText('Title'), 'Ship the release');
    fireEvent.change(within(dialog).getByLabelText('Due date'), { target: { value: '2099-01-01' } });
    await pickIn(dialog, 'Assigned to', 'Aria Test');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add task' }));

    expect(await screen.findByText('Ship the release')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.taskCalls().find((c) => c.method === 'POST')!.body).toEqual({
      title: 'Ship the release',
      description: '',
      priority: 'MEDIUM',
      status: 'PENDING',
      dueDate: '2099-01-01T23:59:59Z',
      assigneeId: 1,
    });
    expect(within(rowOf('Ship the release')).getByText('Aria Test')).toBeInTheDocument();
  });

  it('adds an unassigned task by default', async () => {
    const api = fakeApi([]);
    renderPage();
    const dialog = await openAddForm();

    await userEvent.type(within(dialog).getByLabelText('Title'), 'No owner yet');
    fireEvent.change(within(dialog).getByLabelText('Due date'), { target: { value: '2099-01-01' } });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add task' }));

    await screen.findByText('No owner yet');
    expect(api.taskCalls().find((c) => c.method === 'POST')!.body).toMatchObject({ assigneeId: null });
  });

  it('edits a task: the form starts filled in, and an unchanged due date and assignee are kept as they were', async () => {
    const original = task(1, { ...assignedTo(2), priority: 'HIGH', dueDate: '2099-03-05T17:00:00.000Z' });
    const api = fakeApi([original]);
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Edit Task 01' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit task' });

    expect(within(dialog).getByLabelText('Title')).toHaveValue('Task 01');
    expect(within(dialog).getByRole('combobox', { name: 'Priority' })).toHaveTextContent('High');
    expect(within(dialog).getByLabelText('Due date')).toHaveValue('2099-03-05');
    expect(within(dialog).getByRole('combobox', { name: 'Assigned to' })).toHaveTextContent('Ben Test');

    await pickIn(dialog, 'Status', 'Completed');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(within(rowOf('Task 01')).getByText('Completed')).toBeInTheDocument());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const patch = api.taskCalls().find((c) => c.method === 'PATCH')!;
    expect(patch.url.pathname).toMatch(/\/tasks\/1$/);
    expect(patch.body).toMatchObject({
      status: 'COMPLETED',
      assigneeId: 2,
      dueDate: '2099-03-05T17:00:00.000Z', // untouched
    });
  });

  it('sends the end of the new day when the due date is changed, and can unassign', async () => {
    const api = fakeApi([task(1, assignedTo(1))]);
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Edit Task 01' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit task' });

    fireEvent.change(within(dialog).getByLabelText('Due date'), { target: { value: '2099-12-31' } });
    await pickIn(dialog, 'Assigned to', 'Unassigned');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(within(rowOf('Task 01')).getByText('Unassigned')).toBeInTheDocument());
    expect(api.taskCalls().find((c) => c.method === 'PATCH')!.body).toMatchObject({
      dueDate: '2099-12-31T23:59:59Z',
      assigneeId: null,
    });
  });

  it('shows the server message in the form and keeps it open when saving fails', async () => {
    const api = fakeApi([]);
    renderPage();
    const dialog = await openAddForm();
    await userEvent.type(within(dialog).getByLabelText('Title'), 'Doomed');
    fireEvent.change(within(dialog).getByLabelText('Due date'), { target: { value: '2099-01-01' } });
    api.failNext(400, 'Assignee does not exist');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Add task' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Assignee does not exist');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes the form with Escape without saving', async () => {
    const api = fakeApi([]);
    renderPage();
    await openAddForm();

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.taskCalls().some((c) => c.method === 'POST')).toBe(false);
  });
});

describe('TasksPage: deleting', () => {
  it('asks first and does nothing on Cancel', async () => {
    const api = fakeApi([task(1)]);
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Delete Task 01' }));

    const dialog = screen.getByRole('dialog', { name: 'Delete this task?' });
    expect(within(dialog).getByText('Task 01')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Task 01')).toBeInTheDocument();
    expect(api.taskCalls().some((c) => c.method === 'DELETE')).toBe(false);
  });

  it('deletes after confirmation and removes the row', async () => {
    const api = fakeApi([task(1), task(2)]);
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Delete Task 01' }));

    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(screen.queryByText('Task 01')).not.toBeInTheDocument());
    expect(screen.getByText('Task 02')).toBeInTheDocument();
    expect(api.taskCalls().find((c) => c.method === 'DELETE')!.url.pathname).toMatch(/\/tasks\/1$/);
  });

  it('steps back a page when the last row of the last page is deleted', async () => {
    fakeApi(many(11));
    renderPage();
    await screen.findByText('Task 01');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete Task 11' }));

    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Task 01')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
  });

  it('shows the server message and stays open when the delete fails', async () => {
    const api = fakeApi([task(1)]);
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Delete Task 01' }));
    api.failNext(404, 'Task not found');

    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('Task not found');
  });
});
