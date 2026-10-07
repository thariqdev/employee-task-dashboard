import { useQueryClient } from '@tanstack/react-query';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useMe } from '../hooks/useMe';
import { clearToken } from '../lib/auth';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/employees', label: 'Employees', end: false },
  { to: '/tasks', label: 'Tasks', end: false },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  'rounded-md px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent ' +
  (isActive ? 'bg-accent-tint text-accent' : 'text-muted hover:bg-page hover:text-ink');

function Logo() {
  return (
    <span className="flex items-center gap-2 text-base font-semibold">
      <span aria-hidden="true" className="h-5 w-5 rounded-md bg-accent" />
      TaskDesk
    </span>
  );
}

/** The page frame for signed-in screens: side navigation on wide screens, a top bar on narrow ones. */
export default function AppLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: admin } = useMe();

  function logOut() {
    clearToken();
    queryClient.clear(); // drop cached data so the next person to sign in never sees it
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <aside className="border-b border-line bg-surface md:w-56 md:border-r md:border-b-0">
        <div className="flex items-center justify-between px-4 py-3 md:block md:px-6 md:py-5">
          <Logo />
          <button
            type="button"
            onClick={logOut}
            className="text-sm text-muted hover:text-ink md:hidden"
          >
            Log out
          </button>
        </div>
        <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden px-3 py-4 md:block">
          {admin && <p className="truncate px-3 pb-2 text-xs text-muted">Signed in as {admin.name}</p>}
          <button
            type="button"
            onClick={logOut}
            className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-muted hover:bg-page hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-[1100px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
