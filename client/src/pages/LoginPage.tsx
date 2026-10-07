import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useToken } from '../hooks/useToken';
import { ApiError, apiFetch } from '../lib/api';
import { setToken } from '../lib/auth';

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

type LoginResult = { token: string; admin: { id: number; name: string; email: string } };

const inputClass =
  'mt-1 block h-9 w-full rounded-md border border-line bg-surface px-3 text-sm ' +
  'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 aria-[invalid=true]:border-danger';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const token = useToken();
  // The route guard remembers the page the user wanted. Only same-site paths are accepted.
  const from = (location.state as { from?: unknown } | null)?.from;
  const redirectTo = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/';
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  // Autofill and the browser's back/forward form restore can change what the fields show without
  // firing an input event, so react-hook-form would still hold the old (empty) values and show a
  // stale error. Copy what is really in the fields before validating.
  function submitForm(event: FormEvent<HTMLFormElement>) {
    const fields = new FormData(event.currentTarget);
    setValue('email', String(fields.get('email') ?? ''));
    setValue('password', String(fields.get('password') ?? ''));
    return handleSubmit(onSubmit)(event);
  }

  async function onSubmit(values: LoginForm) {
    setServerError(null);
    try {
      const { token } = await apiFetch<LoginResult>('/auth/login', { method: 'POST', body: values });
      setToken(token);
      queryClient.clear(); // never reuse cached data from a previous session
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Something went wrong');
    }
  }

  // Already signed in (for example the user pressed Back to get here): there is nothing to do on this page.
  if (token) return <Navigate to={redirectTo} replace />;

  return (
    <main className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-8">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="h-6 w-6 rounded-md bg-accent" />
          <h1 className="text-2xl font-semibold">TaskDesk</h1>
        </div>
        <p className="mt-2 text-sm text-muted">Sign in to manage employees and tasks.</p>

        <form onSubmit={submitForm} noValidate className="mt-6 space-y-4">
          {serverError && (
            <p role="alert" className="rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">
              {serverError}
            </p>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              aria-invalid={errors.email ? 'true' : 'false'}
              className={inputClass}
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-sm text-danger">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={errors.password ? 'true' : 'false'}
              className={inputClass}
              {...register('password')}
            />
            {errors.password && <p className="mt-1 text-sm text-danger">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-9 w-full rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
