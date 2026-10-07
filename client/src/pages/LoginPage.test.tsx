import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getToken, setToken } from '../lib/auth';
import { createQueryClient } from '../lib/queryClient';
import LoginPage from './LoginPage';

function renderLogin(entry: string | { pathname: string; state: unknown } = '/login') {
  render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<p>Home page</p>} />
          <Route path="/tasks" element={<p>Tasks page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function mockApi(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByLabelText('Email'), email);
  if (password) await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('LoginPage', () => {
  it('shows validation messages and does not call the API when the form is empty', async () => {
    const fetchMock = mockApi(200, {});
    renderLogin();
    await fillAndSubmit('', '');

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('logs in, stores the token and goes to the home page', async () => {
    const fetchMock = mockApi(200, { data: { token: 'abc.def.ghi', admin: { id: 1, name: 'A', email: 'a@b.co' } } });
    renderLogin();
    await fillAndSubmit('admin@example.com', 'Admin@12345');

    expect(await screen.findByText('Home page')).toBeInTheDocument();
    expect(getToken()).toBe('abc.def.ghi');

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain('/auth/login');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ email: 'admin@example.com', password: 'Admin@12345' });
  });

  it('returns the user to the page they originally wanted', async () => {
    mockApi(200, { data: { token: 'abc', admin: { id: 1, name: 'A', email: 'a@b.co' } } });
    renderLogin({ pathname: '/login', state: { from: '/tasks' } });
    await fillAndSubmit('admin@example.com', 'Admin@12345');

    expect(await screen.findByText('Tasks page')).toBeInTheDocument();
  });

  it('ignores a redirect target that points off-site', async () => {
    mockApi(200, { data: { token: 'abc', admin: { id: 1, name: 'A', email: 'a@b.co' } } });
    renderLogin({ pathname: '/login', state: { from: '//evil.example.com' } });
    await fillAndSubmit('admin@example.com', 'Admin@12345');

    expect(await screen.findByText('Home page')).toBeInTheDocument();
  });

  it('sends an already signed-in user away from the login page (Back button case)', async () => {
    setToken('existing-token');
    renderLogin();

    expect(await screen.findByText('Home page')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
  });

  it('shows the server message and stays on the page when the password is wrong', async () => {
    mockApi(401, { error: { message: 'Invalid email or password' } });
    renderLogin();
    await fillAndSubmit('admin@example.com', 'wrong');

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(getToken()).toBeNull();
    expect(screen.queryByText('Home page')).not.toBeInTheDocument();
  });

  it('tells the user when the server cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    renderLogin();
    await fillAndSubmit('admin@example.com', 'Admin@12345');

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Cannot reach the server'));
  });
});

describe('LoginPage with browser autofill / restored form values', () => {
  it('uses what is actually in the fields, even if no input event fired (autofill, back/forward restore)', async () => {
    mockApi(200, { data: { token: 'abc', admin: { id: 1, name: 'A', email: 'a@b.co' } } });
    renderLogin();
    const user = userEvent.setup();

    // 1. The user submits the empty form, so error messages appear.
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();

    // 2. The browser fills the fields without firing any event, as autofill and form restore can.
    (screen.getByLabelText('Email') as HTMLInputElement).value = 'admin@example.com';
    (screen.getByLabelText('Password') as HTMLInputElement).value = 'Admin@12345';

    // 3. The user clicks Sign in again. What they can see in the fields is what must be used.
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Home page')).toBeInTheDocument();
    expect(screen.queryByText('Enter a valid email address')).not.toBeInTheDocument();
  });
});
