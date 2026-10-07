import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setToken } from '../lib/auth';
import { createQueryClient } from '../lib/queryClient';
import AppLayout from './AppLayout';

function renderLayout(path = '/') {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ data: { id: 1, name: 'Demo Admin', email: 'admin@example.com' } }),
    })),
  );
  render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<p>Home page</p>} />
            <Route path="/tasks" element={<p>Tasks page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => setToken('t'));
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('AppLayout', () => {
  it('keeps the shell fixed and lets only the main area scroll', async () => {
    renderLayout();
    const main = await screen.findByRole('main');
    expect(main).toHaveClass('overflow-y-auto');
    expect(main.closest('.h-dvh')).toHaveClass('overflow-hidden');
  });

  it('puts an icon on every nav link and highlights the current page', async () => {
    renderLayout('/tasks');
    const nav = await screen.findByRole('navigation', { name: 'Main' });
    for (const link of nav.querySelectorAll('a')) expect(link.querySelector('svg')).not.toBeNull();

    expect(screen.getByRole('link', { name: 'Tasks' })).toHaveClass('bg-raised');
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveClass('bg-raised');
    expect(screen.getByRole('link', { name: 'Tasks' }).querySelector('svg')).toHaveClass('text-accent');
    expect(screen.getByRole('link', { name: 'Dashboard' }).querySelector('svg')).not.toHaveClass('text-accent');
  });

  it('opens the menu drawer with the menu button and closes it with Escape', async () => {
    const user = userEvent.setup();
    renderLayout();
    await screen.findByRole('main');
    // Closed: only the button inside the drawer header exists, there is no backdrop.
    expect(screen.getAllByRole('button', { name: 'Close menu' })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getAllByRole('button', { name: 'Close menu' })).toHaveLength(2); // + backdrop

    await user.keyboard('{Escape}');
    expect(screen.getAllByRole('button', { name: 'Close menu' })).toHaveLength(1);
  });

  it('closes the drawer when the backdrop is clicked and after choosing a page', async () => {
    const user = userEvent.setup();
    renderLayout();
    await screen.findByRole('main');

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(screen.getAllByRole('button', { name: 'Close menu' })[0]!); // the backdrop comes first
    expect(screen.getAllByRole('button', { name: 'Close menu' })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(screen.getByRole('link', { name: 'Tasks' }));
    expect(await screen.findByText('Tasks page')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Close menu' })).toHaveLength(1);
  });
});
