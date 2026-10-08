import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiFetchPage } from '../lib/api';
import type { TaskPriority, TaskStatus } from '../lib/taskLabels';
import { EMPLOYEES_KEY } from './useEmployees';

export type Task = {
  id: number;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  assigneeId: number | null;
  assignee: { id: number; name: string } | null;
  /** Worked out by the API: past its due date and not completed. */
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
};

/** What the API accepts when creating or updating a task. */
export type TaskInput = {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  assigneeId: number | null;
};

export const TASKS_KEY = ['tasks'] as const;

export type TaskFilters = {
  search: string;
  status: TaskStatus | '';
  priority: TaskPriority | '';
  /** '' = everyone, 'unassigned', or an employee id as text. */
  assignee: string;
  overdueOnly: boolean;
};

export type TaskSortField = 'title' | 'assignee' | 'priority' | 'status' | 'dueDate';

type ListParams = TaskFilters & {
  page: number;
  pageSize: number;
  /** Defaults to the due date, soonest first. */
  sort?: TaskSortField;
  order?: 'asc' | 'desc';
};

export function useTasks(params: ListParams) {
  return useQuery({
    queryKey: [...TASKS_KEY, params],
    queryFn: () => {
      const query = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
      if (params.sort) query.set('sort', params.sort);
      if (params.order) query.set('order', params.order);
      if (params.search) query.set('search', params.search);
      if (params.status) query.set('status', params.status);
      if (params.priority) query.set('priority', params.priority);
      if (params.assignee) query.set('assigneeId', params.assignee);
      if (params.overdueOnly) query.set('overdue', 'true');
      return apiFetchPage<Task>(`/tasks?${query}`);
    },
    placeholderData: keepPreviousData,
  });
}

/** After any change to tasks, refetch the task lists and the employee lists (their task counts change). */
function useRefreshAfterChange() {
  const queryClient = useQueryClient();
  // Not awaited: the dialog closes as soon as the API says yes, and the table shows its own loader while it reloads.
  return () => {
    void queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    void queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY });
  };
}

export function useCreateTask() {
  const refresh = useRefreshAfterChange();
  return useMutation({
    mutationFn: (input: TaskInput) => apiFetch<Task>('/tasks', { method: 'POST', body: input }),
    onSuccess: refresh,
  });
}

export function useUpdateTask() {
  const refresh = useRefreshAfterChange();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: TaskInput }) =>
      apiFetch<Task>(`/tasks/${id}`, { method: 'PATCH', body: input }),
    onSuccess: refresh,
  });
}

export function useDeleteTask() {
  const refresh = useRefreshAfterChange();
  return useMutation({
    mutationFn: (id: number) => apiFetch<{ id: number }>(`/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: refresh,
  });
}
