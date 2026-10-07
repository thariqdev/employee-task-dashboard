import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from './api';
import { getToken, setToken } from './auth';
import { ME_KEY, createQueryClient } from './queryClient';

function retryFn() {
  const retry = createQueryClient().getDefaultOptions().queries?.retry;
  if (typeof retry !== 'function') throw new Error('retry should be a function');
  return retry;
}

function failWith(status: number) {
  return async () => {
    throw new ApiError(status, 'failed');
  };
}

describe('createQueryClient', () => {
  beforeEach(() => localStorage.clear());

  it('does not retry 4xx errors', () => {
    expect(retryFn()(0, new ApiError(404, 'Not found'))).toBe(false);
  });

  it('retries network and 5xx errors, but only twice', () => {
    const retry = retryFn();
    expect(retry(0, new ApiError(0, 'offline'))).toBe(true);
    expect(retry(1, new ApiError(500, 'boom'))).toBe(true);
    expect(retry(2, new ApiError(500, 'boom'))).toBe(false);
  });

  it('forgets the token and re-checks "me" when any other query gets a 401', async () => {
    setToken('expired');
    const client = createQueryClient();
    await client.fetchQuery({ queryKey: ME_KEY, queryFn: async () => ({ id: 1 }) });
    expect(client.getQueryState(ME_KEY)?.isInvalidated).toBe(false);

    await client.fetchQuery({ queryKey: ['tasks'], queryFn: failWith(401), retry: false }).catch(() => undefined);

    expect(getToken()).toBeNull();
    expect(client.getQueryState(ME_KEY)?.isInvalidated).toBe(true);
  });

  it('keeps the token when the "me" query itself gets a 401 (no endless loop)', async () => {
    setToken('expired');
    const client = createQueryClient();
    await client.fetchQuery({ queryKey: ME_KEY, queryFn: failWith(401), retry: false }).catch(() => undefined);
    expect(getToken()).toBe('expired');
  });

  it('keeps the token when another query fails with a non-401 error', async () => {
    setToken('valid');
    const client = createQueryClient();
    await client.fetchQuery({ queryKey: ['tasks'], queryFn: failWith(500), retry: false }).catch(() => undefined);
    expect(getToken()).toBe('valid');
  });
});
