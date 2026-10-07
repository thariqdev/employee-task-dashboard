import { TaskPriority, TaskStatus } from '@prisma/client';
import { z } from 'zod';

// Accepts "2026-10-20" or a full ISO timestamp, and turns it into a Date.
const dueDate = z
  .union([z.iso.date(), z.iso.datetime({ offset: true })], { error: 'Enter a valid due date' })
  .transform((value) => new Date(value));

const fields = {
  title: z.string().trim().min(1, 'Title is required').max(150, 'Title must be at most 150 characters'),
  description: z.string().trim().max(2000, 'Description must be at most 2000 characters'),
  priority: z.enum(TaskPriority),
  status: z.enum(TaskStatus),
  dueDate,
  assigneeId: z.number().int().positive().nullable(),
};

// Defaults apply only on create. The update schema must not have them: zod's
// partial() still fills defaults in, which would silently reset untouched fields.
export const createTaskSchema = z.object({
  ...fields,
  description: fields.description.default(''),
  priority: fields.priority.default('MEDIUM'),
  status: fields.status.default('PENDING'),
  assigneeId: fields.assigneeId.default(null),
});

export const updateTaskSchema = z
  .object(fields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update');

export const taskIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/** The columns a task list can be sorted by. */
export const TASK_SORT_FIELDS = ['title', 'assignee', 'priority', 'status', 'dueDate'] as const;

export const listTasksQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(TaskStatus).optional(),
  priority: z.enum(TaskPriority).optional(),
  assigneeId: z.union([z.literal('unassigned'), z.coerce.number().int().positive()]).optional(),
  overdue: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  sort: z.enum(TASK_SORT_FIELDS).default('dueDate'),
  order: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
