import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPLOYEES_KEY, type Employee } from '../hooks/useEmployees';
import { setToken } from '../lib/auth';
import { createQueryClient } from '../lib/queryClient';
import EmployeesPage from './EmployeesPage';

const PAGE_SIZE = 10;

function person(n: number, taskCount = 0): Employee {
  const id = String(n).padStart(2, '0');
  return {
    id: n,
    name: `Person ${id}`,
    email: `person${id}@example.com`,
    position: 'Developer',
    department: 'Engineering',
    taskCount,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

type Call = { method: string; url: URL; body?: Record<string, string> };

/** A tiny in-memory stand-in for the employees API, so the page runs against realistic answers. */
function fakeApi(initial: Employee[]) {
  let rows = [...initial];
  let nextId = 100;
  const calls: Call[] = [];
  const failures: { status: number; message: string }[] = [];

  const reply = (status: number, payload: unknown) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  });

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const url = new URL(input);
      const method = init?.method ?? 'GET';
      const body = init?.body ? (JSON.parse(init.body as string) as Record<string, string>) : undefined;
      calls.push({ method, url, body });

      const failure = failures.shift();
      if (failure) return reply(failure.status, { error: { message: failure.message } });

      const id = Number(url.pathname.match(/\/employees\/(\d+)$/)?.[1]);

      if (method === 'GET') {
        const search = (url.searchParams.get('search') ?? '').toLowerCase();
        const page = Number(url.searchParams.get('page'));
        const pageSize = Number(url.searchParams.get('pageSize'));
        const matching = rows.filter(
          (r) => r.name.toLowerCase().includes(search) || r.email.toLowerCase().includes(search),
        );
        return reply(200, {
          data: matching.slice((page - 1) * pageSize, page * pageSize),
          meta: { page, pageSize, total: matching.length, totalPages: Math.max(1, Math.ceil(matching.length / pageSize)) },
        });
      }
      if (method === 'POST') {
        if (rows.some((r) => r.email === body!.email)) {
          return reply(409, { error: { message: 'An employee with this email already exists' } });
        }
        const created = { ...person(nextId++), ...body } as Employee;
        rows = [...rows, created];
        return reply(201, { data: created });
      }
      if (method === 'PATCH') {
        rows = rows.map((r) => (r.id === id ? { ...r, ...body } : r));
        return reply(200, { data: rows.find((r) => r.id === id) });
      }
      if (method === 'DELETE') {
        const removed = rows.find((r) => r.id === id)!;
        rows = rows.filter((r) => r.id !== id);
        return reply(200, { data: { id, unassignedTasks: removed.taskCount } });
      }
      return reply(404, { error: { message: 'Not found' } });
    }),
  );

  return { calls, failNext: (status: number, message: string) => failures.push({ status, message }) };
}

function renderPage() {
  const client = createQueryClient();
  client.setQueryDefaults(EMPLOYEES_KEY, { retry: false });
  render(
    <QueryClientProvider client={client}>
      <EmployeesPage />
    </QueryClientProvider>,
  );
}

const rows = () => screen.getAllByRole('row').slice(1); // without the header row
const many = (count: number) => Array.from({ length: count }, (_, i) => person(i + 1));

beforeEach(() => setToken('test-token'));
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('EmployeesPage: listing', () => {
  it('shows the first page of employees with paging information', async () => {
    fakeApi(many(12));
    renderPage();

    expect(await screen.findByText('Person 01')).toBeInTheDocument();
    expect(rows()).toHaveLength(PAGE_SIZE);
    expect(screen.getByText('Showing 1-10 of 12')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  });

  it('shows the task count for each employee', async () => {
    fakeApi([person(1, 4)]);
    renderPage();

    const row = (await screen.findByText('Person 01')).closest('tr')!;
    expect(within(row).getByText('4')).toBeInTheDocument();
  });

  it('moves to the next page', async () => {
    const api = fakeApi(many(12));
    renderPage();
    await screen.findByText('Person 01');

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Person 11')).toBeInTheDocument();
    expect(rows()).toHaveLength(2);
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(api.calls.at(-1)!.url.searchParams.get('page')).toBe('2');
  });

  it('searches by name or email, and says so when nothing matches', async () => {
    const api = fakeApi(many(12));
    renderPage();
    await screen.findByText('Person 01');

    await userEvent.type(screen.getByLabelText('Search employees'), 'person 03');
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(screen.getByText('Person 03')).toBeInTheDocument();
    expect(api.calls.at(-1)!.url.searchParams.get('search')).toBe('person 03');

    await userEvent.clear(screen.getByLabelText('Search employees'));
    await userEvent.type(screen.getByLabelText('Search employees'), 'zzz');
    expect(await screen.findByText('No employees match "zzz".')).toBeInTheDocument();
  });

  it('shows an empty state when there are no employees', async () => {
    fakeApi([]);
    renderPage();
    expect(await screen.findByText('No employees yet. Add the first one.')).toBeInTheDocument();
  });

  it('shows an error with a retry button when the request fails', async () => {
    const api = fakeApi(many(2));
    api.failNext(500, 'Internal server error');
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Internal server error');

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Person 01')).toBeInTheDocument();
  });
});

describe('EmployeesPage: adding and editing', () => {
  async function openAddForm() {
    await userEvent.click(await screen.findByRole('button', { name: 'Add employee' }));
    return screen.getByRole('dialog', { name: 'Add employee' });
  }

  async function fillForm(dialog: HTMLElement, values: Record<string, string>) {
    for (const [label, value] of Object.entries(values)) {
      const field = within(dialog).getByLabelText(label);
      await userEvent.clear(field);
      await userEvent.type(field, value);
    }
  }

  it('shows validation messages and sends nothing when the form is empty', async () => {
    const api = fakeApi([]);
    renderPage();
    const dialog = await openAddForm();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Add employee' }));

    expect(await within(dialog).findByText('Name is required')).toBeInTheDocument();
    expect(within(dialog).getByText('Enter a valid email address')).toBeInTheDocument();
    expect(within(dialog).getByText('Position is required')).toBeInTheDocument();
    expect(within(dialog).getByText('Department is required')).toBeInTheDocument();
    expect(api.calls.some((c) => c.method === 'POST')).toBe(false);
  });

  it('adds an employee: sends the form, closes the dialog and shows the new row', async () => {
    const api = fakeApi([]);
    renderPage();
    const dialog = await openAddForm();

    await fillForm(dialog, {
      Name: 'Nia Park',
      Email: 'nia@example.com',
      Position: 'Designer',
      Department: 'Design',
    });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add employee' }));

    expect(await screen.findByText('Nia Park')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.calls.find((c) => c.method === 'POST')!.body).toEqual({
      name: 'Nia Park',
      email: 'nia@example.com',
      position: 'Designer',
      department: 'Design',
    });
  });

  it('puts the "email already exists" message next to the email field and keeps the dialog open', async () => {
    fakeApi([person(1)]);
    renderPage();
    await screen.findByText('Person 01');
    const dialog = await openAddForm();

    await fillForm(dialog, {
      Name: 'Copy Cat',
      Email: 'person01@example.com',
      Position: 'Dev',
      Department: 'Eng',
    });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add employee' }));

    expect(await within(dialog).findByText('An employee with this email already exists')).toBeInTheDocument();
    // The message belongs to the email field (marked invalid), not to a general banner at the top.
    expect(within(dialog).getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText('Copy Cat')).not.toBeInTheDocument();
  });

  it('edits an employee: the form starts filled in, and saving updates the row', async () => {
    const api = fakeApi([person(1)]);
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Edit Person 01' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit employee' });

    expect(within(dialog).getByLabelText('Name')).toHaveValue('Person 01');
    expect(within(dialog).getByLabelText('Position')).toHaveValue('Developer');

    await fillForm(dialog, { Position: 'Team Lead' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Team Lead')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const patch = api.calls.find((c) => c.method === 'PATCH')!;
    expect(patch.url.pathname).toMatch(/\/employees\/1$/);
    expect(patch.body).toMatchObject({ position: 'Team Lead', name: 'Person 01' });
  });

  it('closes the form with Escape without saving', async () => {
    const api = fakeApi([]);
    renderPage();
    await openAddForm();

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.calls.some((c) => c.method === 'POST')).toBe(false);
  });
});

describe('EmployeesPage: deleting', () => {
  it('asks first, says how many tasks become unassigned, and does nothing on Cancel', async () => {
    const api = fakeApi([person(1, 3)]);
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Delete Person 01' }));

    const dialog = screen.getByRole('dialog', { name: 'Delete Person 01?' });
    expect(within(dialog).getByText(/3 tasks assigned to them will be kept and become unassigned/)).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Person 01')).toBeInTheDocument();
    expect(api.calls.some((c) => c.method === 'DELETE')).toBe(false);
  });

  it('uses the singular for one task and a different message for none', async () => {
    fakeApi([person(1, 1), person(2, 0)]);
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Delete Person 01' }));
    expect(screen.getByText(/1 task assigned to them will be kept/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await userEvent.click(screen.getByRole('button', { name: 'Delete Person 02' }));
    expect(screen.getByText('This employee has no tasks.')).toBeInTheDocument();
  });

  it('deletes after confirmation and removes the row', async () => {
    const api = fakeApi([person(1, 2), person(2)]);
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Delete Person 01' }));

    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(screen.queryByText('Person 01')).not.toBeInTheDocument());
    expect(screen.getByText('Person 02')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.calls.find((c) => c.method === 'DELETE')!.url.pathname).toMatch(/\/employees\/1$/);
  });

  it('steps back a page when the last row of the last page is deleted', async () => {
    fakeApi(many(11));
    renderPage();
    await screen.findByText('Person 01');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete Person 11' }));

    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Person 01')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
  });

  it('shows the server message and stays open when the delete fails', async () => {
    const api = fakeApi([person(1)]);
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Delete Person 01' }));
    api.failNext(404, 'Employee not found');

    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('Employee not found');
  });
});
