export const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const;
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

export type TaskStatus = (typeof STATUSES)[number];
export type TaskPriority = (typeof PRIORITIES)[number];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

/** Color of the small dot shown before the status text. */
export const STATUS_DOT: Record<TaskStatus, string> = {
  PENDING: 'bg-pending',
  IN_PROGRESS: 'bg-progress',
  COMPLETED: 'bg-done',
};

/** How many of the 3 priority bars are filled, and in which color. */
export const PRIORITY_BARS: Record<TaskPriority, { filled: number; color: string }> = {
  LOW: { filled: 1, color: 'bg-muted' },
  MEDIUM: { filled: 2, color: 'bg-progress' },
  HIGH: { filled: 3, color: 'bg-danger' },
};
