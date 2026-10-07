import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { apiFetch } from '../lib/api';
import { getToken, setToken } from '../lib/auth';
import { ME_KEY, createQueryClient } from '../lib/queryClient';

type Reply = { status: number; body: unknown };

const admin = { id: 1, name: 'Demo Admin', email: 'admin@example.com' };
const okMe: Reply = { status: 200, body: { data: admin } };
const unauthorized: Reply = { status: 401, body: { error: { message: 'Invalid or expired token' } } };

const emptyEmployeesPage = {
  data: [],
  meta: { page: 1, pageSize: 10, total: 0, totalPages: 1 },
};

function mockFetch(handler: (url: string) => Reply) {
  const fetchMock = vi.fn(async (url: string) => {
    let { status, body } = handler(url);
    // The real Employees page loads its list once the guard lets it in. Answer that with a valid empty page.
    if (url.includes('/employees') && status === 200) body = emptyEmployeesPage;
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function renderApp(path: string) {
  const client = createQueryClient();
  client.setQueryDefaults(ME_KEY, { retry: false }); // keep the error-state test fast
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return client;
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('RequireAuth', () => {
  it('sends a signed-out visitor to the login page without calling the API', async () => {
    const fetchMock = mockFetch(() => okMe);
    renderApp('/employees');

    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the page once the token is confirmed, and sends it as a Bearer header', async () => {
    setToken('good-token');
    const fetchMock = mockFetch(() => okMe);
    renderApp('/employees');

    expect(await screen.findByRole('heading', { name: 'Employees' })).toBeInTheDocument();
    expect(screen.getByText('Signed in as Demo Admin')).toBeInTheDocument();

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('/auth/me');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer good-token' });
  });

  it('keeps a signed-in user off the login page and shows the dashboard instead', async () => {
    setToken('good-token');
    mockFetch(() => okMe);
    renderApp('/login');

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
  });

  it('shows a loading state while the token is being checked', async () => {
    setToken('good-token');
    mockFetch(() => okMe);
    renderApp('/');

    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('clears an expired token and sends the user to the login page', async () => {
    setToken('expired-token');
    mockFetch(() => unauthorized);
    renderApp('/tasks');

    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(getToken()).toBeNull();
  });

  it('logs the user out when any later request gets a 401', async () => {
    setToken('good-token');
    let expired = false;
    mockFetch(() => (expired ? unauthorized : okMe));
    const client = renderApp('/employees');
    await screen.findByRole('heading', { name: 'Employees' });

    expired = true; // the token expires while the user is on the page
    await client
      .fetchQuery({ queryKey: ['employees'], queryFn: () => apiFetch('/employees'), retry: false })
      .catch(() => undefined);

    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(getToken()).toBeNull();
  });

  it('keeps the token and offers a retry when the server has a problem', async () => {
    setToken('good-token');
    let serverDown = true;
    mockFetch(() => (serverDown ? { status: 500, body: { error: { message: 'Internal server error' } } } : okMe));
    renderApp('/');

    expect(await screen.findByRole('alert')).toHaveTextContent('Internal server error');
    expect(getToken()).toBe('good-token');

    serverDown = false;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('log out clears the token and the cache, and goes to the login page', async () => {
    setToken('good-token');
    mockFetch(() => okMe);
    const client = renderApp('/');
    await screen.findByRole('heading', { name: 'Dashboard' });

    await userEvent.click(screen.getAllByRole('button', { name: 'Log out' })[0]!);

    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(getToken()).toBeNull();
    await waitFor(() => expect(client.getQueryData(ME_KEY)).toBeUndefined());
  });
});

describe('RequireAuth reacts to changes made outside React', () => {
  it('signs out when the token is removed in another tab (storage event)', async () => {
    setToken('good-token');
    mockFetch(() => okMe);
    renderApp('/employees');
    await screen.findByRole('heading', { name: 'Employees' });

    localStorage.removeItem('taskdesk.token');
    window.dispatchEvent(new StorageEvent('storage', { key: 'taskdesk.token' }));

    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('signs out when the browser restores a cached page after logout (pageshow, persisted)', async () => {
    setToken('good-token');
    mockFetch(() => okMe);
    renderApp('/');
    await screen.findByRole('heading', { name: 'Dashboard' });

    localStorage.removeItem('taskdesk.token'); // logged out while this page sat in the back/forward cache
    window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }));

    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('after an explicit log out, the next login lands on the dashboard, not the page left behind', async () => {
    setToken('good-token');
    mockFetch((url) =>
      url.includes('/auth/login')
        ? { status: 200, body: { data: { token: 'new-token', admin } } }
        : okMe,
    );
    renderApp('/employees');
    await screen.findByRole('heading', { name: 'Employees' });

    await userEvent.click(screen.getAllByRole('button', { name: 'Log out' })[0]!);
    await screen.findByRole('button', { name: 'Sign in' });

    await userEvent.type(screen.getByLabelText('Email'), 'admin@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Admin@12345');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });
});
