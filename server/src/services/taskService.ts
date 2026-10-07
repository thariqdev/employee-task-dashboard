import { Prisma, TaskStatus } from '@prisma/client';
import { HttpError } from '../lib/httpError.js';
import { prisma } from '../lib/prisma.js';
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from '../validators/task.js';

const withAssignee = {
  assignee: { select: { id: true, name: true } },
} satisfies Prisma.TaskInclude;
type TaskWithAssignee = Prisma.TaskGetPayload<{ include: typeof withAssignee }>;

/** Overdue is derived, never stored: due date in the past and not completed. */
export function isOverdue(task: { dueDate: Date; status: TaskStatus }, now = new Date()) {
  return task.dueDate < now && task.status !== TaskStatus.COMPLETED;
}

function toDto(task: TaskWithAssignee) {
  return { ...task, isOverdue: isOverdue(task) };
}

function rethrowKnownErrors(err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2003') throw new HttpError(400, 'Assignee does not exist');
    if (err.code === 'P2025') throw new HttpError(404, 'Task not found');
  }
  throw err;
}

export async function listTasks(query: ListTasksQuery) {
  const { search, status, priority, assigneeId, overdue, page, pageSize } = query;
  const now = new Date();

  // Each filter is its own condition, so they combine (for example status + overdue).
  const conditions: Prisma.TaskWhereInput[] = [];
  if (search) conditions.push({ title: { contains: search } });
  if (status) conditions.push({ status });
  if (priority) conditions.push({ priority });
  if (assigneeId === 'unassigned') conditions.push({ assigneeId: null });
  else if (assigneeId) conditions.push({ assigneeId });
  if (overdue === true) {
    conditions.push({ dueDate: { lt: now }, status: { not: TaskStatus.COMPLETED } });
  } else if (overdue === false) {
    conditions.push({ OR: [{ dueDate: { gte: now } }, { status: TaskStatus.COMPLETED }] });
  }
  const where: Prisma.TaskWhereInput = { AND: conditions };

  const [total, tasks] = await prisma.$transaction([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      include: withAssignee,
      orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    tasks: tasks.map(toDto),
    meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
}

export async function createTask(input: CreateTaskInput) {
  try {
    return toDto(await prisma.task.create({ data: input, include: withAssignee }));
  } catch (err) {
    rethrowKnownErrors(err);
  }
}

export async function updateTask(id: number, input: UpdateTaskInput) {
  try {
    return toDto(await prisma.task.update({ where: { id }, data: input, include: withAssignee }));
  } catch (err) {
    rethrowKnownErrors(err);
  }
}

export async function deleteTask(id: number) {
  try {
    await prisma.task.delete({ where: { id } });
  } catch (err) {
    rethrowKnownErrors(err);
  }
  return { id };
}
