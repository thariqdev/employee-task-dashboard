import { z } from 'zod';
import { loginSchema } from '../validators/auth.js';
import {
  createEmployeeSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
} from '../validators/employee.js';
import { createTaskSchema, listTasksQuerySchema, updateTaskSchema } from '../validators/task.js';

type JsonSchema = Record<string, unknown> & {
  properties?: Record<string, unknown>;
  required?: string[];
};

/** Request schemas come straight from the zod validators, so docs and API cannot drift apart. */
function fromZod(schema: z.ZodType): JsonSchema {
  const { $schema: _ignored, ...rest } = z.toJSONSchema(schema, { io: 'input' }) as JsonSchema;
  return rest;
}

function queryParameters(schema: z.ZodType) {
  const { properties = {}, required = [] } = fromZod(schema);
  return Object.entries(properties).map(([name, propSchema]) => ({
    name,
    in: 'query',
    required: required.includes(name),
    schema: propSchema,
  }));
}

const idParameter = (what: string) => ({
  name: 'id',
  in: 'path',
  required: true,
  description: `${what} id`,
  schema: { type: 'integer', minimum: 1 },
});

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const jsonBody = (schema: unknown) => ({ required: true, content: { 'application/json': { schema } } });
const jsonResponse = (description: string, schema: unknown) => ({
  description,
  content: { 'application/json': { schema } },
});
const errorResponse = (description: string) => jsonResponse(description, ref('Error'));
const envelope = (data: unknown) => ({
  type: 'object',
  required: ['data'],
  properties: { data },
});
const paged = (item: unknown) => ({
  type: 'object',
  required: ['data', 'meta'],
  properties: { data: { type: 'array', items: item }, meta: ref('PageMeta') },
});

const secured = [{ bearerAuth: [] }];
const unauthorized = { 401: errorResponse('Missing, invalid or expired token') };
const validationFailed = { 400: errorResponse('Validation failed') };

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'TaskDesk API',
    version: '1.0.0',
    description: [
      'Employee task management API.',
      '',
      '**How to try it:** call `POST /auth/login` with the demo credentials, copy the `token` from the response,',
      'click **Authorize** (top right) and paste it. Every employee and task endpoint then works with **Try it out**.',
      '',
      'Overdue is derived, never stored: a task is overdue when its due date is in the past and its status is not `COMPLETED`.',
    ].join('\n'),
  },
  servers: [{ url: '/api' }],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Employees' },
    { name: 'Tasks' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: jsonResponse(
            'The API is running',
            envelope({ type: 'object', properties: { status: { type: 'string', example: 'ok' } } }),
          ),
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in and get a JWT',
        description: 'Limited to 10 attempts per 15 minutes per IP. Demo: `admin@example.com` / `Admin@12345`.',
        requestBody: jsonBody(fromZod(loginSchema)),
        responses: {
          200: jsonResponse(
            'Logged in',
            envelope({
              type: 'object',
              properties: { token: { type: 'string' }, admin: ref('Admin') },
            }),
          ),
          ...validationFailed,
          401: errorResponse('Invalid email or password'),
          429: errorResponse('Too many login attempts'),
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'The logged-in admin',
        security: secured,
        responses: { 200: jsonResponse('Current admin', envelope(ref('Admin'))), ...unauthorized },
      },
    },
    '/employees': {
      get: {
        tags: ['Employees'],
        summary: 'List employees',
        description: 'Supports search (name or email), department filter and pagination. Each employee includes `taskCount`.',
        security: secured,
        parameters: queryParameters(listEmployeesQuerySchema),
        responses: { 200: jsonResponse('A page of employees', paged(ref('Employee'))), ...validationFailed, ...unauthorized },
      },
      post: {
        tags: ['Employees'],
        summary: 'Create an employee',
        security: secured,
        requestBody: jsonBody(fromZod(createEmployeeSchema)),
        responses: {
          201: jsonResponse('Created', envelope(ref('Employee'))),
          ...validationFailed,
          ...unauthorized,
          409: errorResponse('An employee with this email already exists'),
        },
      },
    },
    '/employees/{id}': {
      patch: {
        tags: ['Employees'],
        summary: 'Update an employee',
        description: 'Send only the fields you want to change.',
        security: secured,
        parameters: [idParameter('Employee')],
        requestBody: jsonBody(fromZod(updateEmployeeSchema)),
        responses: {
          200: jsonResponse('Updated', envelope(ref('Employee'))),
          ...validationFailed,
          ...unauthorized,
          404: errorResponse('Employee not found'),
          409: errorResponse('An employee with this email already exists'),
        },
      },
      delete: {
        tags: ['Employees'],
        summary: 'Delete an employee',
        description: 'Their tasks are kept and become unassigned. The response says how many.',
        security: secured,
        parameters: [idParameter('Employee')],
        responses: {
          200: jsonResponse(
            'Deleted',
            envelope({
              type: 'object',
              properties: { id: { type: 'integer' }, unassignedTasks: { type: 'integer' } },
            }),
          ),
          ...validationFailed,
          ...unauthorized,
          404: errorResponse('Employee not found'),
        },
      },
    },
    '/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'List tasks',
        description:
          'Filters combine. `assigneeId=unassigned` returns tasks nobody owns. `overdue=true` returns only overdue tasks.',
        security: secured,
        parameters: queryParameters(listTasksQuerySchema),
        responses: { 200: jsonResponse('A page of tasks', paged(ref('Task'))), ...validationFailed, ...unauthorized },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create a task',
        security: secured,
        requestBody: jsonBody(fromZod(createTaskSchema)),
        responses: { 201: jsonResponse('Created', envelope(ref('Task'))), ...validationFailed, ...unauthorized },
      },
    },
    '/tasks/{id}': {
      patch: {
        tags: ['Tasks'],
        summary: 'Update a task',
        description: 'Send only the fields you want to change. Use `"assigneeId": null` to unassign.',
        security: secured,
        parameters: [idParameter('Task')],
        requestBody: jsonBody(fromZod(updateTaskSchema)),
        responses: {
          200: jsonResponse('Updated', envelope(ref('Task'))),
          ...validationFailed,
          ...unauthorized,
          404: errorResponse('Task not found'),
        },
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete a task',
        security: secured,
        parameters: [idParameter('Task')],
        responses: {
          200: jsonResponse('Deleted', envelope({ type: 'object', properties: { id: { type: 'integer' } } })),
          ...validationFailed,
          ...unauthorized,
          404: errorResponse('Task not found'),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['message'],
            properties: {
              message: { type: 'string', example: 'Validation failed' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { field: { type: 'string' }, message: { type: 'string' } },
                },
              },
            },
          },
        },
      },
      PageMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          pageSize: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      Admin: {
        type: 'object',
        properties: { id: { type: 'integer' }, name: { type: 'string' }, email: { type: 'string' } },
      },
      Employee: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string' },
          position: { type: 'string' },
          department: { type: 'string' },
          taskCount: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
          status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] },
          dueDate: { type: 'string', format: 'date-time' },
          assigneeId: { type: ['integer', 'null'] },
          assignee: {
            oneOf: [
              { type: 'null' },
              { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } },
            ],
          },
          isOverdue: { type: 'boolean', description: 'Derived: past due date and not COMPLETED' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};
