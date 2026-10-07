import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useMe } from '../hooks/useMe';
import { ApiError } from '../lib/api';
import { useToken } from '../hooks/useToken';
import { clearToken } from '../lib/auth';
import { primaryButton } from '../lib/ui';

/**
 * Route guard. Signed-out visitors are sent to /login, and come back to the page they wanted after signing in.
 * A token that is present is checked with the server (GET /auth/me), because a token can be expired or revoked.
 */
export default function RequireAuth() {
  const location = useLocation();
  const token = useToken();
  const me = useMe();

  const redirectToLogin = (
    <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  );

  if (!token) return redirectToLogin;

  if (me.isPending) {
    return (
      <div role="status" className="flex min-h-full items-center justify-center p-6 text-muted">
        Loading...
      </div>
    );
  }

  if (me.isError) {
    if (me.error instanceof ApiError && me.error.status === 401) {
      clearToken();
      return redirectToLogin;
    }
    return (
      <div role="alert" className="flex min-h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-ink">{me.error.message}</p>
        <button
          type="button"
          onClick={() => void me.refetch()}
          className={primaryButton}
        >
          Try again
        </button>
      </div>
    );
  }

  return <Outlet />;
}
