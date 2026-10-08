import { z } from 'zod';

const requiredText = (label: string, max = 100) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} must be at most ${max} characters`);

export const createEmployeeSchema = z.object({
  name: requiredText('Name'),
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
  position: requiredText('Position'),
  department: requiredText('Department'),
});

export const updateEmployeeSchema = createEmployeeSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update');

export const employeeIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/** The columns an employee list can be sorted by. "tasks" is the number of tasks they have, "createdAt" is when they were added. */
export const EMPLOYEE_SORT_FIELDS = ['name', 'position', 'department', 'tasks', 'createdAt'] as const;

export const listEmployeesQuerySchema = z.object({
  search: z.string().trim().optional(),
  department: z.string().trim().optional(),
  sort: z.enum(EMPLOYEE_SORT_FIELDS).default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
