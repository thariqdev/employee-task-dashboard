import { useQuery } from '@tanstack/react-query';
import { apiFetchPage } from '../lib/api';
import { EMPLOYEES_KEY } from './useEmployees';
import { TASKS_KEY } from './useTasks';

/** Asks a list endpoint for one row and reads the total from its paging info. */
async function countOf(path: string) {
  const { meta } = await apiFetchPage<unknown>(`${path}${path.includes('?') ? '&' : '?'}page=1&pageSize=1`);
  return meta.total;
}

export type TaskSummary = {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
};

export function useTaskSummary() {
  return useQuery({
    queryKey: [...TASKS_KEY, 'summary'],
    queryFn: async (): Promise<TaskSummary> => {
      const [total, pending, inProgress, completed, overdue] = await Promise.all([
        countOf('/tasks'),
        countOf('/tasks?status=PENDING'),
        countOf('/tasks?status=IN_PROGRESS'),
        countOf('/tasks?status=COMPLETED'),
        countOf('/tasks?overdue=true'),
      ]);
      return { total, pending, inProgress, completed, overdue };
    },
  });
}

export function useEmployeeCount() {
  return useQuery({
    queryKey: [...EMPLOYEES_KEY, 'count'],
    queryFn: () => countOf('/employees'),
  });
}
