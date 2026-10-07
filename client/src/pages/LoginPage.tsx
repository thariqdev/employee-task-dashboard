import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useToken } from '../hooks/useToken';
import { ApiError, apiFetch } from '../lib/api';
import { setToken } from '../lib/auth';
import AuthLayout from '../components/AuthLayout';

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

type LoginResult = { token: string; admin: { id: number; name: string; email: string } };

const inputClass =
  'mt-1 block h-11 w-full rounded bg-raised text-sm text-ink shadow-[inset_0_0_0_1px_var(--color-edge)] ' +
  'focus:outline-none focus:shadow-[inset_0_0_0_2px_var(--color-accent)] ' +
  'aria-[invalid=true]:shadow-[inset_0_0_0_1px_var(--color-danger)]';


export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const token = useToken();
  // The route guard remembers the page the user wanted. Only same-site paths are accepted.
  const from = (location.state as { from?: unknown } | null)?.from;
  const redirectTo = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/';
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
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
    <AuthLayout>
          <p className="mt-6 text-xl font-bold">Welcome back</p>
          <p className="mt-1 text-sm text-muted">Sign in to manage employees and tasks.</p>

          <form onSubmit={submitForm} noValidate className="mt-6 space-y-4">
            {serverError && (
              <p role="alert" className="rounded-lg bg-danger-tint px-3 py-2 text-sm text-danger">
                {serverError}
              </p>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail size={18} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  className={`${inputClass} pl-10`}
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-danger">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock size={18} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  className={`${inputClass} px-10`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((shown) => !shown)}
                  aria-label={showPassword ? 'Hide characters' : 'Show characters'}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 text-muted hover:bg-edge hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-danger">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full rounded-full bg-accent px-4 text-sm font-bold tracking-[1.4px] text-white uppercase transition hover:bg-accent-hover hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
    </AuthLayout>
  );
}
