import { getToken } from './auth';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

type FieldError = { field: string; message: string };

/** An error response from the API, or status 0 when the server could not be reached. */
export class ApiError extends Error {
  readonly status: number;
  readonly details?: FieldError[];

  constructor(status: number, message: string, details?: FieldError[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export type PageMeta = { page: number; pageSize: number; total: number; totalPages: number };

type RequestOptions = { method?: string; body?: unknown };

/** Sends the request and returns the parsed JSON body, or throws an ApiError. */
async function request(path: string, { method = 'GET', body }: RequestOptions = {}) {
  const token = getToken();

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is it running?');
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, json?.error?.message ?? 'Something went wrong', json?.error?.details);
  }
  return json;
}

/** Calls the API and returns the `data` part of the response. */
export async function apiFetch<T>(path: string, options?: RequestOptions): Promise<T> {
  return (await request(path, options)).data as T;
}

/** For list endpoints, which answer with `data` (the rows) and `meta` (paging information). */
export async function apiFetchPage<T>(path: string): Promise<{ items: T[]; meta: PageMeta }> {
  const json = await request(path);
  return { items: json.data as T[], meta: json.meta as PageMeta };
}
