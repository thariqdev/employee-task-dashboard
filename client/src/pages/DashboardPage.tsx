import { CheckCircle2, CircleDashed, ClipboardList, Loader, TriangleAlert, Users, type LucideIcon } from 'lucide-react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { useEmployeeCount, useTaskSummary, type TaskSummary } from '../hooks/useDashboardSummary';
import { useTasks } from '../hooks/useTasks';
import { formatDueDate } from '../lib/dates';
import { PoppedSlice, RestingSlice } from '../components/PoppedSlice';
import { Skeleton } from '../components/Skeleton';
import { ghostButton } from '../lib/ui';

// Same colors as the status tokens in index.css. SVG charts need plain values.
const COLORS = { pending: '#38bdf8', progress: '#fbbf24', done: '#34d399', danger: '#fb7185', accent: '#6366f1' };

const panelClass = 'rounded-lg bg-surface p-4 shadow-card sm:p-5';
const tooltipStyle = {
  background: '#222222',
  border: 'none',
  borderRadius: 8,
  color: '#ffffff',
  fontSize: 12,
};

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
  alert = false,
}: {
  label: string;
  value: number | undefined;
  icon: LucideIcon;
  color: string;
  alert?: boolean;
}) {
  return (
    <div className="rounded-lg bg-surface p-4 shadow-card transition-colors hover:bg-raised">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-raised"
        style={{ color }}
      >
        <Icon size={18} />
      </span>
      <dt className="mt-3 text-sm text-muted">{label}</dt>
      <dd className={`mt-1 text-2xl leading-9 font-bold sm:text-[28px] ${alert ? 'text-danger' : ''}`}>{value ?? '–'}</dd>
    </div>
  );
}

function StatusChart({ summary }: { summary: TaskSummary }) {
  const slices = [
    { name: 'Pending', value: summary.pending, color: COLORS.pending },
    { name: 'In progress', value: summary.inProgress, color: COLORS.progress },
    { name: 'Completed', value: summary.completed, color: COLORS.done },
  ];
  const description = slices.map((s) => `${s.name}: ${s.value}`).join(', ');

  return (
    <div className={panelClass}>
      <h2 className="text-lg font-semibold">Tasks by status</h2>
      {summary.total === 0 ? (
        <p className="py-10 text-center text-sm text-muted">No tasks yet.</p>
      ) : (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-6">
          <div role="img" aria-label={`Tasks by status. ${description}`} className="relative h-48 w-48">
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 192, height: 192 }}>
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={2}
                  stroke="none"
                  activeShape={PoppedSlice}
                  inactiveShape={RestingSlice}
                >
                  {slices.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#ffffff' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold sm:text-2xl">{summary.total}</span>
              <span className="text-xs text-muted">in total</span>
            </div>
          </div>
          <ul className="space-y-2 text-sm">
            {slices.map((s) => (
              <li key={s.name} className="flex items-center gap-2">
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                {`${s.name}: ${s.value}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function OpenWorkChart({ summary }: { summary: TaskSummary }) {
  const open = summary.pending + summary.inProgress;
  const data = [
    { name: 'On track', value: Math.max(open - summary.overdue, 0), color: COLORS.accent },
    { name: 'Past due', value: summary.overdue, color: COLORS.danger },
  ];

  return (
    <div className={panelClass}>
      <h2 className="text-lg font-semibold">Open work</h2>
      {open === 0 ? (
        <p className="py-10 text-center text-sm text-muted">Nothing is open right now.</p>
      ) : (
        <div
          role="img"
          aria-label={`Open work. On track: ${data[0]!.value}, past due: ${data[1]!.value}`}
          className="mt-4 h-44"
        >
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 176 }}>
            <BarChart data={data} barSize={44} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#a3a3a3', fontSize: 12 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#a3a3a3', fontSize: 12 }} />
              <Tooltip cursor={{ fill: '#222222' }} contentStyle={tooltipStyle} itemStyle={{ color: '#ffffff' }} />
              <Bar dataKey="value" name="Tasks" radius={[6, 6, 0, 0]}>
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/** The five overdue tasks that have waited longest. The API sorts by due date, oldest first. */
function NeedsAttention() {
  const { data, isPending, isError, refetch } = useTasks({
    search: '',
    status: '',
    priority: '',
    assignee: '',
    overdueOnly: true,
    page: 1,
    pageSize: 5,
  });
  const tasks = data?.items ?? [];

  return (
    <div className={panelClass}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Needs attention</h2>
        <Link to="/tasks" className={ghostButton}>
          View all tasks
        </Link>
      </div>

      {isPending ? (
        <div role="status" className="mt-3 space-y-3">
          <span className="sr-only">Loading tasks...</span>
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : isError ? (
        <p role="alert" className="mt-3 rounded-lg bg-danger-tint p-3 text-sm text-danger">
          Could not load tasks.{' '}
          <button type="button" className="underline" onClick={() => void refetch()}>
            Try again
          </button>
        </p>
      ) : tasks.length === 0 ? (
        <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted">
          <CheckCircle2 size={18} aria-hidden="true" className="text-done" />
          Nothing is overdue.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {tasks.map((task) => (
            <li key={task.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{task.title}</p>
                <p className="text-xs text-muted">{task.assignee ? task.assignee.name : 'Unassigned'}</p>
              </div>
              <span className="rounded-full bg-danger-tint px-2.5 py-0.5 text-xs font-bold text-danger">
                Due {formatDueDate(task.dueDate)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const tasks = useTaskSummary();
  const employees = useEmployeeCount();

  return (
    <section>
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {(tasks.isError || employees.isError) && (
        <p role="alert" className="mt-4 rounded-lg bg-danger-tint p-3 text-sm text-danger">
          Could not load the summary.{' '}
          <button
            type="button"
            className="underline"
            onClick={() => {
              void tasks.refetch();
              void employees.refetch();
            }}
          >
            Try again
          </button>
        </p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <SummaryCard label="Employees" value={employees.data} icon={Users} color={COLORS.accent} />
        <SummaryCard label="Total tasks" value={tasks.data?.total} icon={ClipboardList} color="#ffffff" />
        <SummaryCard label="Pending" value={tasks.data?.pending} icon={CircleDashed} color={COLORS.pending} />
        <SummaryCard label="In progress" value={tasks.data?.inProgress} icon={Loader} color={COLORS.progress} />
        <SummaryCard label="Completed" value={tasks.data?.completed} icon={CheckCircle2} color={COLORS.done} />
        <SummaryCard
          label="Overdue"
          value={tasks.data?.overdue}
          icon={TriangleAlert}
          color={COLORS.danger}
          alert={Boolean(tasks.data?.overdue)}
        />
      </dl>

      {tasks.data ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <StatusChart summary={tasks.data} />
          <OpenWorkChart summary={tasks.data} />
        </div>
      ) : (
        tasks.isPending && (
          <div aria-hidden="true" className="mt-4 grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        )
      )}

      <div className="mt-4">
        <NeedsAttention />
      </div>
    </section>
  );
}
