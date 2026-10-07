import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiFetchPage } from '../lib/api';

export type Employee = {
  id: number;
  name: string;
  email: string;
  position: string;
  department: string;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeInput = Pick<Employee, 'name' | 'email' | 'position' | 'department'>;

export const EMPLOYEES_KEY = ['employees'] as const;

export type EmployeeSortField = 'name' | 'position' | 'department' | 'tasks';

type ListParams = {
  search: string;
  page: number;
  pageSize: number;
  /** Defaults to the name, A to Z. */
  sort?: EmployeeSortField;
  order?: 'asc' | 'desc';
};

export function useEmployees({ search, page, pageSize, sort, order }: ListParams) {
  return useQuery({
    queryKey: [...EMPLOYEES_KEY, { search, page, pageSize, sort, order }],
    queryFn: () => {
      const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) query.set('search', search);
      if (sort) query.set('sort', sort);
      if (order) query.set('order', order);
      return apiFetchPage<Employee>(`/employees?${query}`);
    },
    placeholderData: keepPreviousData, // keep showing the old rows while the next page loads
  });
}

/** Everyone, as {id, name} pairs, for "assign to" dropdowns. (The API allows at most 100 per request.) */
export function useEmployeeOptions() {
  return useQuery({
    queryKey: [...EMPLOYEES_KEY, 'options'],
    queryFn: async () => {
      const { items } = await apiFetchPage<Employee>('/employees?page=1&pageSize=100');
      return items.map(({ id, name }) => ({ id, name }));
    },
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EmployeeInput) => apiFetch<Employee>('/employees', { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: EmployeeInput }) =>
      apiFetch<Employee>(`/employees/${id}`, { method: 'PATCH', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<{ id: number; unassignedTasks: number }>(`/employees/${id}`, { method: 'DELETE' }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }), // their tasks just became unassigned
      ]),
  });
}
