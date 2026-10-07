import { Prisma, TaskStatus } from '@prisma/client';
import { HttpError } from '../lib/httpError.js';
import { prisma } from '../lib/prisma.js';
import { compareText, inOrderOf, pageOfIds } from '../lib/sorting.js';
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

// Priority and status are sorted by meaning (low to high, to-do to done), not alphabetically.
const PRIORITY_RANK = { LOW: 0, MEDIUM: 1, HIGH: 2 } as const;
const STATUS_RANK = { PENDING: 0, IN_PROGRESS: 1, COMPLETED: 2 } as const;

export async function listTasks(query: ListTasksQuery) {
  const { search, status, priority, assigneeId, overdue, sort, order, page, pageSize } = query;
  const direction = order === 'desc' ? -1 : 1;
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

  const skip = (page - 1) * pageSize;

  // Due date is a plain database sort. The other columns are sorted in memory (see lib/sorting.ts).
  let total: number;
  let tasks: TaskWithAssignee[];
  if (sort === 'dueDate') {
    [total, tasks] = await prisma.$transaction([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        include: withAssignee,
        orderBy: [{ dueDate: order }, { id: 'asc' }],
        skip,
        take: pageSize,
      }),
    ]);
  } else {
    const rows = await prisma.task.findMany({
      where,
      select: { id: true, title: true, priority: true, status: true, dueDate: true, assignee: { select: { name: true } } },
    });
    const compare = (a: (typeof rows)[number], b: (typeof rows)[number]) => {
      if (sort === 'assignee') {
        if (!a.assignee || !b.assignee) return Number(!a.assignee) - Number(!b.assignee); // unassigned last, either way
        return direction * compareText(a.assignee.name, b.assignee.name) || a.dueDate.getTime() - b.dueDate.getTime();
      }
      const primary =
        sort === 'title'
          ? compareText(a.title, b.title)
          : sort === 'priority'
            ? PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
            : STATUS_RANK[a.status] - STATUS_RANK[b.status];
      return direction * primary || a.dueDate.getTime() - b.dueDate.getTime();
    };
    const ids = pageOfIds(rows, compare, skip, pageSize);
    total = rows.length;
    tasks = inOrderOf(ids, await prisma.task.findMany({ where: { id: { in: ids } }, include: withAssignee }));
  }

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
