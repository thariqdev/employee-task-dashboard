import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { ME_KEY } from '../lib/queryClient';
import { useToken } from './useToken';

export type Admin = { id: number; name: string; email: string };

/** The signed-in admin. Only runs when a token exists. */
export function useMe() {
  const token = useToken();
  return useQuery({
    queryKey: ME_KEY,
    queryFn: () => apiFetch<Admin>('/auth/me'),
    enabled: token !== null,
  });
}
