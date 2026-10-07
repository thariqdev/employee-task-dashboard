/**
 * Seeds the database with one demo admin, 8 employees and 20 tasks.
 * Safe to re-run: it clears existing employees and tasks first.
 * All names are fictional and all emails use example.com.
 */
import { PrismaClient, TaskPriority, TaskStatus, type Employee } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const employees = [
  { name: 'Aria Whitlock', email: 'aria.whitlock@example.com', position: 'Frontend Developer', department: 'Engineering' },
  { name: 'Ben Castellano', email: 'ben.castellano@example.com', position: 'Backend Developer', department: 'Engineering' },
  { name: 'Chloe Varga', email: 'chloe.varga@example.com', position: 'QA Engineer', department: 'Engineering' },
  { name: 'Dev Ramaswamy', email: 'dev.ramaswamy@example.com', position: 'Product Designer', department: 'Design' },
  { name: 'Elena Moreau', email: 'elena.moreau@example.com', position: 'Marketing Specialist', department: 'Marketing' },
  { name: 'Felix Adeyemi', email: 'felix.adeyemi@example.com', position: 'Operations Manager', department: 'Operations' },
  { name: 'Grace Lindqvist', email: 'grace.lindqvist@example.com', position: 'Support Lead', department: 'Customer Support' },
  { name: 'Hiro Tanabe', email: 'hiro.tanabe@example.com', position: 'Financial Analyst', department: 'Finance' },
];

type SeedTask = {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  /** Days from today; negative means the due date is in the past. */
  dueInDays: number;
  /** Index into `employees`, or null for an unassigned task. */
  assignee: number | null;
};

const { LOW, MEDIUM, HIGH } = TaskPriority;
const { PENDING, IN_PROGRESS, COMPLETED } = TaskStatus;

const tasks: SeedTask[] = [
  { title: 'Build login page UI', description: 'Responsive login form with validation messages.', priority: HIGH, status: COMPLETED, dueInDays: -10, assignee: 0 },
  { title: 'Fix sidebar overflow on mobile', description: 'Sidebar content gets cut off below 360px width.', priority: MEDIUM, status: IN_PROGRESS, dueInDays: 2, assignee: 0 },
  { title: 'Add pagination to reports table', description: 'Reports table becomes slow with many rows.', priority: LOW, status: PENDING, dueInDays: -3, assignee: 0 },
  { title: 'Design REST endpoints for invoices', description: 'Draft request/response shapes and status codes.', priority: HIGH, status: IN_PROGRESS, dueInDays: -2, assignee: 1 },
  { title: 'Add database indexes for search', description: 'Profile slow queries and add the missing indexes.', priority: MEDIUM, status: PENDING, dueInDays: 6, assignee: 1 },
  { title: 'Upgrade Node.js runtime', description: 'Move services to the current LTS release.', priority: LOW, status: COMPLETED, dueInDays: -15, assignee: 1 },
  { title: 'Write regression tests for checkout', description: 'Cover the happy path and the payment failure path.', priority: HIGH, status: PENDING, dueInDays: -5, assignee: 2 },
  { title: 'Verify bug fixes in release 2.4', description: 'Re-test every ticket tagged for the release.', priority: MEDIUM, status: IN_PROGRESS, dueInDays: 1, assignee: 2 },
  { title: 'Create onboarding illustrations', description: 'Three illustrations for the welcome screens.', priority: MEDIUM, status: PENDING, dueInDays: 9, assignee: 3 },
  { title: 'Refresh design system colors', description: 'Check contrast ratios and update tokens.', priority: LOW, status: COMPLETED, dueInDays: -7, assignee: 3 },
  { title: 'Plan Q4 newsletter', description: 'Outline topics and a send schedule.', priority: MEDIUM, status: PENDING, dueInDays: 12, assignee: 4 },
  { title: 'Publish product launch blog post', description: 'Final edit, images and scheduling.', priority: HIGH, status: IN_PROGRESS, dueInDays: -1, assignee: 4 },
  { title: 'Renew office equipment contracts', description: 'Compare three vendor quotes before renewal.', priority: MEDIUM, status: COMPLETED, dueInDays: -20, assignee: 5 },
  { title: 'Organize team offsite logistics', description: 'Venue, travel and agenda for the offsite.', priority: LOW, status: PENDING, dueInDays: 21, assignee: 5 },
  { title: 'Update support macros', description: 'Rewrite canned replies for the new billing flow.', priority: MEDIUM, status: IN_PROGRESS, dueInDays: 4, assignee: 6 },
  { title: 'Triage backlog of open tickets', description: 'Close duplicates and tag priorities.', priority: HIGH, status: PENDING, dueInDays: -4, assignee: 6 },
  { title: 'Prepare monthly expense report', description: 'Reconcile card statements with receipts.', priority: HIGH, status: COMPLETED, dueInDays: -2, assignee: 7 },
  { title: 'Draft next year budget forecast', description: 'First draft for review by department leads.', priority: MEDIUM, status: PENDING, dueInDays: 14, assignee: 7 },
  { title: 'Audit software licenses', description: 'List unused seats that can be cancelled.', priority: LOW, status: PENDING, dueInDays: 8, assignee: null },
  { title: 'Set up error monitoring alerts', description: 'Alert on error-rate spikes in production.', priority: HIGH, status: PENDING, dueInDays: 3, assignee: null },
];

function daysFromToday(days: number): Date {
  const date = new Date();
  date.setHours(17, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set (see server/.env.example).');
  }

  await prisma.task.deleteMany();
  await prisma.employee.deleteMany();

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.admin.upsert({
    where: { email: adminEmail.toLowerCase() },
    update: { passwordHash },
    create: { name: 'Demo Admin', email: adminEmail.toLowerCase(), passwordHash },
  });

  // Created one by one so ids follow the array order used by `tasks`.
  const created: Employee[] = [];
  for (const employee of employees) {
    created.push(await prisma.employee.create({ data: employee }));
  }

  await prisma.task.createMany({
    data: tasks.map(({ dueInDays, assignee, ...task }) => ({
      ...task,
      dueDate: daysFromToday(dueInDays),
      assigneeId: assignee === null ? null : created[assignee]!.id,
    })),
  });

  console.log(`Seeded admin (${adminEmail}), ${created.length} employees and ${tasks.length} tasks.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
