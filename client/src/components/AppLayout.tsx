import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { LayoutDashboard, ListChecks, LogOut, Menu, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMe } from '../hooks/useMe';
import { clearToken } from '../lib/auth';
import { Wordmark } from './Logo';

const links = [
  { to: '/', label: 'Dashboard', end: true, icon: LayoutDashboard },
  { to: '/employees', label: 'Employees', end: false, icon: Users },
  { to: '/tasks', label: 'Tasks', end: false, icon: ListChecks },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  'group flex items-center gap-3 rounded-full px-4 py-2.5 text-sm transition duration-200 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' +
  (isActive
    ? 'bg-raised font-bold text-ink'
    : 'font-normal text-muted hover:translate-x-1 hover:bg-raised hover:text-ink');

/** The page frame for signed-in screens: a fixed sidebar (a drawer on phones) and one scrolling main area. */
export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: admin } = useMe();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the drawer after navigating, and on Escape.
  useEffect(() => setDrawerOpen(false), [location.pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  function logOut() {
    clearToken();
    queryClient.clear(); // drop cached data so the next person to sign in never sees it
    navigate('/login', { replace: true });
  }

  const pageTitle = links.find((l) => (l.end ? location.pathname === l.to : location.pathname.startsWith(l.to)))?.label;

  return (
    <div className="flex h-dvh overflow-hidden">
      {drawerOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-30 animate-[fade-in_300ms_ease-out] bg-black/70 md:hidden"
        />
      )}

      <aside
        className={
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-surface ' +
          'transition-[translate,visibility] duration-300 ease-out md:static md:w-64 md:translate-x-0 md:shrink-0 ' +
          (drawerOpen ? 'translate-x-0 shadow-pop' : '-translate-x-full max-md:invisible')
        }
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-5">
          <Wordmark />
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="cursor-pointer rounded-full p-1.5 text-muted hover:bg-raised hover:text-ink md:hidden"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {links.map(({ to, label, end, icon: Icon }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              {({ isActive }) => (
                <>
                  <Icon size={18} aria-hidden="true" className={isActive ? 'text-accent' : ''} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-lg bg-raised p-3">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white"
            >
              {admin?.name.charAt(0).toUpperCase() ?? '?'}
            </span>
            {admin && <p className="min-w-0 truncate text-sm font-medium">Signed in as {admin.name}</p>}
          </div>
          <button
            type="button"
            onClick={logOut}
            className="mt-2 flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-bold text-muted transition hover:bg-danger-tint hover:text-danger focus-visible:outline-2 focus-visible:outline-accent"
          >
            <LogOut size={18} aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-page/80 px-4 backdrop-blur md:px-6">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="cursor-pointer rounded-full p-2 text-muted hover:bg-raised hover:text-ink md:hidden"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <span className="md:hidden">
            <Wordmark size={28} />
          </span>
          {pageTitle && <p className="hidden text-sm font-semibold text-muted md:block">{pageTitle}</p>}
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mx-auto max-w-[1100px]"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
