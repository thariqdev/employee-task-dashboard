import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch, apiFetchPage } from './api';
import { clearToken, setToken } from './auth';

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('api', () => {
  beforeEach(() => clearToken());
  afterEach(() => vi.unstubAllGlobals());

  it('returns the data part of the response', async () => {
    mockFetch(200, { data: { id: 1 } });
    expect(await apiFetch('/x')).toEqual({ id: 1 });
  });

  it('sends the token as a Bearer header, and a JSON body with its content type', async () => {
    setToken('abc');
    const fetchMock = mockFetch(200, { data: null });
    await apiFetch('/x', { method: 'POST', body: { a: 1 } });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/x$/);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' });
    expect(init.body).toBe('{"a":1}');
  });

  it('sends no Authorization or Content-Type header when there is no token or body', async () => {
    const fetchMock = mockFetch(200, { data: null });
    await apiFetch('/x');
    expect(fetchMock.mock.calls[0][1].headers).toEqual({});
  });

  it('throws an ApiError with the status, message and field details of an error response', async () => {
    const details = [{ field: 'email', message: 'Taken' }];
    mockFetch(409, { error: { message: 'Email in use', details } });

    const error = await apiFetch('/x').catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, message: 'Email in use', details });
  });

  it('falls back to a generic message when the error body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => {
          throw new Error('not json');
        },
      }),
    );
    await expect(apiFetch('/x')).rejects.toMatchObject({ status: 502, message: 'Something went wrong' });
  });

  it('reports status 0 when the server cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('failed')));
    await expect(apiFetch('/x')).rejects.toMatchObject({ status: 0 });
  });

  it('returns rows and paging meta for list endpoints', async () => {
    const meta = { page: 1, pageSize: 10, total: 1, totalPages: 1 };
    mockFetch(200, { data: [{ id: 1 }], meta });
    expect(await apiFetchPage('/x')).toEqual({ items: [{ id: 1 }], meta });
  });
});
