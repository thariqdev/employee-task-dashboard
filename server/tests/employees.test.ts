import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

// Integration tests: a real throwaway SQLite database, built from the real migrations.
process.env.DATABASE_URL = 'file:./employees-test.db';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123';

const { createApp } = await import('../src/app.js');
const { prisma } = await import('../src/lib/prisma.js');

const app = createApp();
const auth = { Authorization: `Bearer ${jwt.sign({ sub: '1' }, process.env.JWT_SECRET)}` };

const aria = { name: 'Aria Test', email: 'aria@example.com', position: 'Dev', department: 'Engineering' };
const ben = { name: 'Ben Test', email: 'ben@example.com', position: 'Designer', department: 'Design' };

beforeAll(() => {
  execSync('npx prisma migrate deploy', { stdio: 'pipe' });
}, 60_000);

beforeEach(async () => {
  await prisma.task.deleteMany();
  await prisma.employee.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
  for (const file of ['employees-test.db', 'employees-test.db-journal']) {
    rmSync(`prisma/${file}`, { force: true });
  }
});

describe('employees API', () => {
  it('requires authentication', async () => {
    expect((await request(app).get('/api/employees')).status).toBe(401);
    expect((await request(app).post('/api/employees').send(aria)).status).toBe(401);
  });

  it('creates an employee and normalises the email', async () => {
    const res = await request(app)
      .post('/api/employees')
      .set(auth)
      .send({ ...aria, email: '  ARIA@Example.com ' });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ name: 'Aria Test', email: 'aria@example.com', taskCount: 0 });
  });

  it('rejects invalid input with field details', async () => {
    const res = await request(app).post('/api/employees').set(auth).send({ name: '', email: 'nope' });
    expect(res.status).toBe(400);
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'position', 'department']));
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/employees').set(auth).send(aria);
    const res = await request(app).post('/api/employees').set(auth).send(aria);
    expect(res.status).toBe(409);
  });

  it('lists with search, department filter and pagination', async () => {
    await request(app).post('/api/employees').set(auth).send(aria);
    await request(app).post('/api/employees').set(auth).send(ben);

    const all = await request(app).get('/api/employees').set(auth);
    expect(all.body.data.map((e: { name: string }) => e.name)).toEqual(['Aria Test', 'Ben Test']);
    expect(all.body.meta).toEqual({ page: 1, pageSize: 10, total: 2, totalPages: 1 });

    const search = await request(app).get('/api/employees?search=ben').set(auth);
    expect(search.body.data).toHaveLength(1);

    const dept = await request(app).get('/api/employees?department=Engineering').set(auth);
    expect(dept.body.data[0].name).toBe('Aria Test');

    const page2 = await request(app).get('/api/employees?pageSize=1&page=2').set(auth);
    expect(page2.body.data[0].name).toBe('Ben Test');
    expect(page2.body.meta.totalPages).toBe(2);

    expect((await request(app).get('/api/employees?page=0').set(auth)).status).toBe(400);
  });

  it('updates some fields, and 404s for a missing employee', async () => {
    const { body } = await request(app).post('/api/employees').set(auth).send(aria);
    const res = await request(app).patch(`/api/employees/${body.data.id}`).set(auth).send({ position: 'Lead' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ position: 'Lead', name: 'Aria Test' });

    expect((await request(app).patch(`/api/employees/${body.data.id}`).set(auth).send({})).status).toBe(400);
    expect((await request(app).patch('/api/employees/9999').set(auth).send({ position: 'x' })).status).toBe(404);
    expect((await request(app).patch('/api/employees/abc').set(auth).send({ position: 'x' })).status).toBe(400);
  });

  it('rejects changing an email to one that is already taken', async () => {
    await request(app).post('/api/employees').set(auth).send(aria);
    const { body } = await request(app).post('/api/employees').set(auth).send(ben);
    const res = await request(app).patch(`/api/employees/${body.data.id}`).set(auth).send({ email: aria.email });
    expect(res.status).toBe(409);
  });

  it('delete keeps the tasks and unassigns them', async () => {
    const { body } = await request(app).post('/api/employees').set(auth).send(aria);
    const id = body.data.id as number;
    await prisma.task.create({ data: { title: 'Keep me', dueDate: new Date(), assigneeId: id } });

    const res = await request(app).delete(`/api/employees/${id}`).set(auth);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ id, unassignedTasks: 1 });

    const task = await prisma.task.findFirstOrThrow({ where: { title: 'Keep me' } });
    expect(task.assigneeId).toBeNull();
    expect((await request(app).delete(`/api/employees/${id}`).set(auth)).status).toBe(404);
  });
});

describe('employees API: sorting', () => {
  const namesOf = async (query: string) => {
    const res = await request(app).get(`/api/employees?${query}`).set(auth);
    expect(res.status).toBe(200);
    return res.body.data.map((e: { name: string }) => e.name);
  };

  beforeEach(async () => {
    const make = (name: string, position: string, department: string) =>
      prisma.employee.create({ data: { name, email: `${name.toLowerCase()}@example.com`, position, department } });
    const cara = await make('Cara', 'support Lead', 'Support');
    await make('Abe', 'Designer', 'design');
    const dan = await make('Dan', 'Developer', 'Engineering');
    await make('Eve', 'analyst', 'Finance');

    const due = new Date(Date.now() + 86_400_000);
    const task = (assigneeId: number) => prisma.task.create({ data: { title: 't', dueDate: due, assigneeId } });
    await task(cara.id);
    await task(cara.id);
    await task(cara.id);
    await task(dan.id);
  });

  it('sorts by name, A to Z by default, and reverses it', async () => {
    expect(await namesOf('')).toEqual(['Abe', 'Cara', 'Dan', 'Eve']);
    expect(await namesOf('sort=name&order=desc')).toEqual(['Eve', 'Dan', 'Cara', 'Abe']);
  });

  it('sorts by number of tasks, with equal counts in name order', async () => {
    expect(await namesOf('sort=tasks&order=desc')).toEqual(['Cara', 'Dan', 'Abe', 'Eve']); // 3, 1, 0, 0
    expect(await namesOf('sort=tasks')).toEqual(['Abe', 'Eve', 'Dan', 'Cara']); // 0, 0, 1, 3
  });

  it('sorts position and department ignoring case', async () => {
    // Positions: analyst (Eve), Designer (Abe), Developer (Dan), support Lead (Cara).
    expect(await namesOf('sort=position')).toEqual(['Eve', 'Abe', 'Dan', 'Cara']);
    expect(await namesOf('sort=position&order=desc')).toEqual(['Cara', 'Dan', 'Abe', 'Eve']);
    // Departments: design (Abe), Engineering (Dan), Finance (Eve), Support (Cara).
    expect(await namesOf('sort=department')).toEqual(['Abe', 'Dan', 'Eve', 'Cara']);
  });

  it('sorts by when they were added, newest first or oldest first', async () => {
    // Created in this order in beforeEach: Cara, Abe, Dan, Eve.
    expect(await namesOf('sort=createdAt&order=desc')).toEqual(['Eve', 'Dan', 'Abe', 'Cara']);
    expect(await namesOf('sort=createdAt&order=asc')).toEqual(['Cara', 'Abe', 'Dan', 'Eve']);
  });

  it('keeps pages consistent when sorted', async () => {
    const first = await namesOf('sort=department&pageSize=3&page=1');
    const second = await namesOf('sort=department&pageSize=3&page=2');
    expect([...first, ...second]).toEqual(await namesOf('sort=department&pageSize=100'));
  });

  it('rejects a column that cannot be sorted', async () => {
    expect((await request(app).get('/api/employees?sort=email').set(auth)).status).toBe(400);
  });
});
