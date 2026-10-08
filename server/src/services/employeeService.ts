import { Prisma } from '@prisma/client';
import { HttpError } from '../lib/httpError.js';
import { prisma } from '../lib/prisma.js';
import { compareText, inOrderOf, pageOfIds } from '../lib/sorting.js';
import type {
  CreateEmployeeInput,
  ListEmployeesQuery,
  UpdateEmployeeInput,
} from '../validators/employee.js';

const withTaskCount = { _count: { select: { tasks: true } } } satisfies Prisma.EmployeeInclude;
type EmployeeWithCount = Prisma.EmployeeGetPayload<{ include: typeof withTaskCount }>;

/** Flattens Prisma's _count into a plain taskCount field. */
function toDto({ _count, ...employee }: EmployeeWithCount) {
  return { ...employee, taskCount: _count.tasks };
}

function isPrismaError(err: unknown, code: string) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === code;
}

function rethrowKnownErrors(err: unknown): never {
  if (isPrismaError(err, 'P2002')) throw new HttpError(409, 'An employee with this email already exists');
  if (isPrismaError(err, 'P2025')) throw new HttpError(404, 'Employee not found');
  throw err;
}

export async function listEmployees({ search, department, sort, order, page, pageSize }: ListEmployeesQuery) {
  const where: Prisma.EmployeeWhereInput = {
    ...(department ? { department } : {}),
    ...(search
      ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] }
      : {}),
  };

  const skip = (page - 1) * pageSize;

  // Name, number of tasks and date added are plain database sorts. Position and department are sorted in memory,
  // ignoring case, because people type those in ("legal" must not sort after "Support").
  let total: number;
  let employees: EmployeeWithCount[];
  if (sort === 'position' || sort === 'department') {
    const direction = order === 'desc' ? -1 : 1;
    const rows = await prisma.employee.findMany({ where, select: { id: true, name: true, position: true, department: true } });
    const ids = pageOfIds(
      rows,
      (a, b) => direction * compareText(a[sort], b[sort]) || compareText(a.name, b.name),
      skip,
      pageSize,
    );
    total = rows.length;
    employees = inOrderOf(ids, await prisma.employee.findMany({ where: { id: { in: ids } }, include: withTaskCount }));
  } else {
    [total, employees] = await prisma.$transaction([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        include: withTaskCount,
        orderBy:
          sort === 'createdAt'
            ? [{ createdAt: order }, { id: order }] // same direction, so the newest really is first
            : [sort === 'tasks' ? { tasks: { _count: order } } : { name: order }, { name: 'asc' }, { id: 'asc' }],
        skip,
        take: pageSize,
      }),
    ]);
  }

  return {
    employees: employees.map(toDto),
    meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
}

export async function createEmployee(input: CreateEmployeeInput) {
  try {
    return toDto(await prisma.employee.create({ data: input, include: withTaskCount }));
  } catch (err) {
    rethrowKnownErrors(err);
  }
}

export async function updateEmployee(id: number, input: UpdateEmployeeInput) {
  try {
    return toDto(await prisma.employee.update({ where: { id }, data: input, include: withTaskCount }));
  } catch (err) {
    rethrowKnownErrors(err);
  }
}

/** Deletes the employee. Their tasks stay and become unassigned (onDelete: SetNull). */
export async function deleteEmployee(id: number) {
  const employee = await prisma.employee.findUnique({ where: { id }, include: withTaskCount });
  if (!employee) throw new HttpError(404, 'Employee not found');

  try {
    await prisma.employee.delete({ where: { id } });
  } catch (err) {
    rethrowKnownErrors(err);
  }

  return { id, unassignedTasks: employee._count.tasks };
}
