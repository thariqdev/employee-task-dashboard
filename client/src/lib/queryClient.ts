import { QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';
import { clearToken } from './auth';

/** Query key of the "who am I" request. The route guard watches it. */
export const ME_KEY = ['me'] as const;

/** A factory (not a singleton) so tests can build a fresh client each time. */
export function createQueryClient() {
  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // A 401 on any request means the token expired or was revoked mid-session:
        // forget it and re-check "me", which makes the route guard send the user to /login.
        // The "me" query is skipped here, otherwise its own 401 would trigger itself forever.
        if (error instanceof ApiError && error.status === 401 && query.queryKey[0] !== ME_KEY[0]) {
          clearToken();
          void client.invalidateQueries({ queryKey: ME_KEY });
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Retrying a 4xx is pointless (the request itself is wrong). Network and 5xx errors get 2 retries.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2,
      },
    },
  });
  return client;
}
