import { useEmployeeCount, useTaskSummary } from '../hooks/useDashboardSummary';

function SummaryCard({ label, value, alert = false }: { label: string; value: number | undefined; alert?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={`mt-1 text-[28px] leading-9 font-semibold ${alert ? 'text-danger' : ''}`}>{value ?? '–'}</dd>
    </div>
  );
}

export default function DashboardPage() {
  const tasks = useTaskSummary();
  const employees = useEmployeeCount();

  return (
    <section>
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {(tasks.isError || employees.isError) && (
        <p role="alert" className="mt-4 rounded-md bg-danger-tint p-3 text-sm text-danger">
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
        <SummaryCard label="Employees" value={employees.data} />
        <SummaryCard label="Total tasks" value={tasks.data?.total} />
        <SummaryCard label="Pending" value={tasks.data?.pending} />
        <SummaryCard label="In progress" value={tasks.data?.inProgress} />
        <SummaryCard label="Completed" value={tasks.data?.completed} />
        <SummaryCard
          label="Overdue"
          value={tasks.data?.overdue}
          alert={Boolean(tasks.data?.overdue)}
        />
      </dl>
    </section>
  );
}
