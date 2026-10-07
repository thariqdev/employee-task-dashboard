import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-muted">That address does not exist.</p>
      <Link to="/" className="mt-4 text-sm font-medium text-accent hover:text-accent-hover">
        Go to the dashboard
      </Link>
    </main>
  );
}
