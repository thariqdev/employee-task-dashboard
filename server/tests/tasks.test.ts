import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

// Integration tests: a real throwaway SQLite database, built from the real migrations.
process.env.DATABASE_URL = 'file:./tasks-test.db';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123';

const { createApp } = await import('../src/app.js');
const { prisma } = await import('../src/lib/prisma.js');
const { isOverdue } = await import('../src/services/taskService.js');

const app = createApp();
const auth = { Authorization: `Bearer ${jwt.sign({ sub: '1' }, process.env.JWT_SECRET)}` };

const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

let employeeId: number;

beforeAll(() => {
  execSync('npx prisma migrate deploy', { stdio: 'pipe' });
}, 60_000);

beforeEach(async () => {
  await prisma.task.deleteMany();
  await prisma.employee.deleteMany();
  const employee = await prisma.employee.create({
    data: { name: 'Aria Test', email: 'aria@example.com', position: 'Dev', department: 'Engineering' },
  });
  employeeId = employee.id;
});

afterAll(async () => {
  await prisma.$disconnect();
  for (const file of ['tasks-test.db', 'tasks-test.db-journal']) {
    rmSync(`prisma/${file}`, { force: true });
  }
});

const createTask = (body: object) => request(app).post('/api/tasks').set(auth).send(body);

describe('isOverdue', () => {
  const now = new Date('2026-10-10T12:00:00Z');
  const past = new Date('2026-10-09T12:00:00Z');
  const future = new Date('2026-10-11T12:00:00Z');

  it('is overdue only when past due and not completed', () => {
    expect(isOverdue({ dueDate: past, status: 'PENDING' }, now)).toBe(true);
    expect(isOverdue({ dueDate: past, status: 'IN_PROGRESS' }, now)).toBe(true);
    expect(isOverdue({ dueDate: past, status: 'COMPLETED' }, now)).toBe(false);
    expect(isOverdue({ dueDate: future, status: 'PENDING' }, now)).toBe(false);
  });
});

describe('tasks API', () => {
  it('requires authentication', async () => {
    expect((await request(app).get('/api/tasks')).status).toBe(401);
  });

  it('creates a task with defaults and an assignee', async () => {
    const res = await createTask({ title: ' Write docs ', dueDate: '2099-01-01', assigneeId: employeeId });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      title: 'Write docs',
      description: '',
      priority: 'MEDIUM',
      status: 'PENDING',
      isOverdue: false,
      assignee: { id: employeeId, name: 'Aria Test' },
    });
  });

  it('creates an unassigned task', async () => {
    const res = await createTask({ title: 'No owner', dueDate: '2099-01-01' });
    expect(res.status).toBe(201);
    expect(res.body.data.assignee).toBeNull();
  });

  it('rejects invalid input and an unknown assignee', async () => {
    const bad = await createTask({ title: '', dueDate: 'tomorrow', priority: 'URGENT' });
    expect(bad.status).toBe(400);
    const fields = bad.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['title', 'dueDate', 'priority']));

    const ghost = await createTask({ title: 'Ghost owner', dueDate: '2099-01-01', assigneeId: 9999 });
    expect(ghost.status).toBe(400);
    expect(ghost.body.error.message).toBe('Assignee does not exist');
  });

  it('marks overdue tasks and filters by overdue, status, assignee and search', async () => {
    await createTask({ title: 'Late open', dueDate: daysFromNow(-3), assigneeId: employeeId });
    await createTask({ title: 'Late done', dueDate: daysFromNow(-3), status: 'COMPLETED' });
    await createTask({ title: 'Future work', dueDate: daysFromNow(5) });

    const all = await request(app).get('/api/tasks').set(auth);
    expect(all.body.meta.total).toBe(3);
    const byTitle = Object.fromEntries(all.body.data.map((t: { title: string; isOverdue: boolean }) => [t.title, t.isOverdue]));
    expect(byTitle).toEqual({ 'Late open': true, 'Late done': false, 'Future work': false });

    const overdue = await request(app).get('/api/tasks?overdue=true').set(auth);
    expect(overdue.body.data.map((t: { title: string }) => t.title)).toEqual(['Late open']);

    const notOverdue = await request(app).get('/api/tasks?overdue=false').set(auth);
    expect(notOverdue.body.meta.total).toBe(2);

    const done = await request(app).get('/api/tasks?status=COMPLETED').set(auth);
    expect(done.body.data.map((t: { title: string }) => t.title)).toEqual(['Late done']);

    const mine = await request(app).get(`/api/tasks?assigneeId=${employeeId}`).set(auth);
    expect(mine.body.data.map((t: { title: string }) => t.title)).toEqual(['Late open']);

    const unassigned = await request(app).get('/api/tasks?assigneeId=unassigned').set(auth);
    expect(unassigned.body.meta.total).toBe(2);

    const search = await request(app).get('/api/tasks?search=future').set(auth);
    expect(search.body.data).toHaveLength(1);

    expect((await request(app).get('/api/tasks?status=NOPE').set(auth)).status).toBe(400);
  });

  it('updates a task: completing it clears overdue, and the assignee can be removed', async () => {
    const { body } = await createTask({ title: 'Late open', dueDate: daysFromNow(-3), assigneeId: employeeId });
    expect(body.data.isOverdue).toBe(true);

    const res = await request(app)
      .patch(`/api/tasks/${body.data.id}`)
      .set(auth)
      .send({ status: 'COMPLETED', assigneeId: null });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'COMPLETED', isOverdue: false, assignee: null });

    expect((await request(app).patch(`/api/tasks/${body.data.id}`).set(auth).send({})).status).toBe(400);
    expect((await request(app).patch('/api/tasks/9999').set(auth).send({ title: 'x' })).status).toBe(404);
  });

  it('a partial update leaves every other field untouched', async () => {
    const { body } = await createTask({
      title: 'Original',
      description: 'Keep this',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: '2099-01-01',
      assigneeId: employeeId,
    });

    const res = await request(app).patch(`/api/tasks/${body.data.id}`).set(auth).send({ title: 'Renamed' });
    expect(res.body.data).toMatchObject({
      title: 'Renamed',
      description: 'Keep this',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      assignee: { id: employeeId },
    });
  });

  it('paginates, ordered by due date', async () => {
    await createTask({ title: 'Third', dueDate: daysFromNow(9) });
    await createTask({ title: 'First', dueDate: daysFromNow(1) });
    await createTask({ title: 'Second', dueDate: daysFromNow(5) });

    const page1 = await request(app).get('/api/tasks?pageSize=2').set(auth);
    expect(page1.body.data.map((t: { title: string }) => t.title)).toEqual(['First', 'Second']);
    expect(page1.body.meta).toEqual({ page: 1, pageSize: 2, total: 3, totalPages: 2 });

    const page2 = await request(app).get('/api/tasks?pageSize=2&page=2').set(auth);
    expect(page2.body.data.map((t: { title: string }) => t.title)).toEqual(['Third']);
  });

  it('rejects an update with an unknown assignee, a bad date or a bad id', async () => {
    const { body } = await createTask({ title: 'Temp', dueDate: '2099-01-01' });
    const url = `/api/tasks/${body.data.id}`;

    const ghost = await request(app).patch(url).set(auth).send({ assigneeId: 9999 });
    expect(ghost.status).toBe(400);
    expect(ghost.body.error.message).toBe('Assignee does not exist');

    expect((await request(app).patch(url).set(auth).send({ dueDate: 'soon' })).status).toBe(400);
    expect((await request(app).patch('/api/tasks/abc').set(auth).send({ title: 'x' })).status).toBe(400);
    expect((await request(app).delete('/api/tasks/abc').set(auth)).status).toBe(400);
  });

  it('deletes a task, then 404s', async () => {
    const { body } = await createTask({ title: 'Temp', dueDate: '2099-01-01' });
    const res = await request(app).delete(`/api/tasks/${body.data.id}`).set(auth);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ id: body.data.id });
    expect((await request(app).delete(`/api/tasks/${body.data.id}`).set(auth)).status).toBe(404);
  });
});

describe('tasks API: sorting', () => {
  const titlesOf = async (query: string) => {
    const res = await request(app).get(`/api/tasks?${query}`).set(auth);
    expect(res.status).toBe(200);
    return res.body.data.map((t: { title: string }) => t.title);
  };

  beforeEach(async () => {
    const ben = await prisma.employee.create({
      data: { name: 'ben Test', email: 'ben@example.com', position: 'Dev', department: 'Engineering' },
    });
    const task = (title: string, priority: 'LOW' | 'MEDIUM' | 'HIGH', status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED', due: number, assigneeId: number | null) =>
      prisma.task.create({ data: { title, priority, status, dueDate: new Date(daysFromNow(due)), assigneeId } });
    await task('delta', 'LOW', 'COMPLETED', 4, employeeId);
    await task('Alpha', 'HIGH', 'PENDING', 2, ben.id);
    await task('charlie', 'MEDIUM', 'IN_PROGRESS', 3, null);
    await task('Bravo 10', 'HIGH', 'IN_PROGRESS', 1, employeeId);
    await task('Bravo 2', 'LOW', 'PENDING', 5, null);
  });

  it('sorts by due date, soonest first, and reverses it', async () => {
    expect(await titlesOf('sort=dueDate')).toEqual(['Bravo 10', 'Alpha', 'charlie', 'delta', 'Bravo 2']);
    expect(await titlesOf('sort=dueDate&order=desc')).toEqual(['Bravo 2', 'delta', 'charlie', 'Alpha', 'Bravo 10']);
  });

  it('keeps due date, soonest first, as the default', async () => {
    expect(await titlesOf('')).toEqual(await titlesOf('sort=dueDate&order=asc'));
  });

  it('sorts titles ignoring case, with numbers in numeric order', async () => {
    expect(await titlesOf('sort=title')).toEqual(['Alpha', 'Bravo 2', 'Bravo 10', 'charlie', 'delta']);
    expect(await titlesOf('sort=title&order=desc')).toEqual(['delta', 'charlie', 'Bravo 10', 'Bravo 2', 'Alpha']);
  });

  it('sorts priority by meaning (low, medium, high), not alphabetically', async () => {
    const asc = await titlesOf('sort=priority');
    expect(asc.slice(0, 2).sort()).toEqual(['Bravo 2', 'delta']); // the two LOW ones
    expect(asc[2]).toBe('charlie'); // MEDIUM
    expect(asc.slice(3).sort()).toEqual(['Alpha', 'Bravo 10']); // the two HIGH ones
    expect((await titlesOf('sort=priority&order=desc'))[0]).toMatch(/Alpha|Bravo 10/);
  });

  it('sorts status by progress (to do, in progress, done)', async () => {
    const asc = await titlesOf('sort=status');
    expect(asc.slice(0, 2).sort()).toEqual(['Alpha', 'Bravo 2']); // PENDING
    expect(asc.slice(2, 4).sort()).toEqual(['Bravo 10', 'charlie']); // IN_PROGRESS
    expect(asc[4]).toBe('delta'); // COMPLETED
    expect((await titlesOf('sort=status&order=desc'))[0]).toBe('delta');
  });

  it('ties are broken by due date, soonest first', async () => {
    // Alpha (due in 2 days) and Bravo 10 (due in 1 day) are both HIGH: the sooner one comes first.
    const high = (await titlesOf('sort=priority&order=desc')).slice(0, 2);
    expect(high).toEqual(['Bravo 10', 'Alpha']);
  });

  it('sorts by assignee name ignoring case, with unassigned tasks last in either direction', async () => {
    // "Aria Test" has Bravo 10 and delta, "ben Test" has Alpha, and charlie and Bravo 2 have no assignee.
    expect(await titlesOf('sort=assignee')).toEqual(['Bravo 10', 'delta', 'Alpha', 'charlie', 'Bravo 2']);
    expect(await titlesOf('sort=assignee&order=desc')).toEqual(['Alpha', 'Bravo 10', 'delta', 'charlie', 'Bravo 2']);
  });

  it('keeps pages consistent when sorted: page 2 continues where page 1 stopped', async () => {
    const all = await titlesOf('sort=title&pageSize=100');
    const first = await titlesOf('sort=title&pageSize=2&page=1');
    const second = await titlesOf('sort=title&pageSize=2&page=2');
    const third = await titlesOf('sort=title&pageSize=2&page=3');
    expect([...first, ...second, ...third]).toEqual(all);
  });

  it('sorts only the tasks that match the filters, and counts them correctly', async () => {
    const res = await request(app).get('/api/tasks?sort=title&status=PENDING').set(auth);
    expect(res.body.data.map((t: { title: string }) => t.title)).toEqual(['Alpha', 'Bravo 2']);
    expect(res.body.meta.total).toBe(2);
  });

  it('rejects a column that cannot be sorted', async () => {
    expect((await request(app).get('/api/tasks?sort=description').set(auth)).status).toBe(400);
    expect((await request(app).get('/api/tasks?order=sideways').set(auth)).status).toBe(400);
  });
});
