import { Prisma } from '@prisma/client';
import { HttpError } from '../lib/httpError.js';
import { prisma } from '../lib/prisma.js';
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

export async function listEmployees({ search, department, page, pageSize }: ListEmployeesQuery) {
  const where: Prisma.EmployeeWhereInput = {
    ...(department ? { department } : {}),
    ...(search
      ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] }
      : {}),
  };

  const [total, employees] = await prisma.$transaction([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      include: withTaskCount,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

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
