import { useEffect, useState } from 'react';
import ConfirmDeleteTaskModal from '../components/ConfirmDeleteTaskModal';
import { PriorityBadge, StatusBadge } from '../components/TaskBadges';
import TaskFormModal from '../components/TaskFormModal';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useEmployeeOptions } from '../hooks/useEmployees';
import { type Task, type TaskFilters, useTasks } from '../hooks/useTasks';
import { formatDueDate } from '../lib/dates';
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from '../lib/taskLabels';
import {
  alertClass,
  filterClass,
  ghostButton,
  ghostDangerButton,
  primaryButton,
  secondaryButton,
  tableClass,
  tableWrapClass,
  tbodyClass,
  tdClass,
  theadClass,
  thClass,
  trClass,
} from '../lib/ui';

const PAGE_SIZE = 10;

const selectClass = filterClass;

export default function TasksPage() {
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<Omit<TaskFilters, 'search'>>({
    status: '',
    priority: '',
    assignee: '',
    overdueOnly: false,
  });
  const [page, setPage] = useState(1);
  // `null` = no dialog, `'new'` = the add form, a task = the edit form.
  const [editing, setEditing] = useState<Task | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);

  const search = useDebouncedValue(searchInput.trim(), 300);
  const { data: employees = [] } = useEmployeeOptions();
  const { data, error, isPending, isError, isPlaceholderData, refetch } = useTasks({
    ...filters,
    search,
    page,
    pageSize: PAGE_SIZE,
  });

  // After deleting the last row of the last page, step back to a page that still exists.
  const totalPages = data?.meta.totalPages;
  useEffect(() => {
    if (totalPages !== undefined && page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function changeFilter(change: Partial<typeof filters>) {
    setFilters((current) => ({ ...current, ...change }));
    setPage(1);
  }

  const tasks = data?.items ?? [];
  const meta = data?.meta;
  const filtering =
    search !== '' || filters.status !== '' || filters.priority !== '' || filters.assignee !== '' || filters.overdueOnly;

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className={primaryButton}
        >
          Add task
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div>
          <label htmlFor="task-search" className="sr-only">Search tasks</label>
          <input
            id="task-search"
            type="search"
            placeholder="Search by title"
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              setPage(1);
            }}
            className={`${selectClass} w-full sm:w-56`}
          />
        </div>
        <div>
          <label htmlFor="filter-status" className="sr-only">Filter by status</label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={(event) => changeFilter({ status: event.target.value as TaskFilters['status'] })}
            className={selectClass}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-priority" className="sr-only">Filter by priority</label>
          <select
            id="filter-priority"
            value={filters.priority}
            onChange={(event) => changeFilter({ priority: event.target.value as TaskFilters['priority'] })}
            className={selectClass}
          >
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-assignee" className="sr-only">Filter by assignee</label>
          <select
            id="filter-assignee"
            value={filters.assignee}
            onChange={(event) => changeFilter({ assignee: event.target.value })}
            className={selectClass}
          >
            <option value="">Everyone</option>
            <option value="unassigned">Unassigned</option>
            {employees.map((e) => (
              <option key={e.id} value={String(e.id)}>{e.name}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.overdueOnly}
            onChange={(event) => changeFilter({ overdueOnly: event.target.checked })}
            className="h-4 w-4 rounded border-line accent-accent"
          />
          Overdue only
        </label>
      </div>

      <div className="mt-4">
        {isPending ? (
          <p role="status" className="py-8 text-center text-muted motion-safe:animate-pulse">Loading tasks...</p>
        ) : isError ? (
          <div role="alert" className={`${alertClass} p-4`}>
            <p>{error.message}</p>
            <button type="button" onClick={() => void refetch()} className="mt-2 font-medium underline">
              Try again
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line py-10 text-center text-muted">
            {filtering ? 'No tasks match your filters.' : 'No tasks yet. Add the first one.'}
          </p>
        ) : (
          <div
            className={`${tableWrapClass} ${isPlaceholderData ? 'opacity-60' : ''}`}
          >
            <table className={tableClass}>
              <thead className={theadClass}>
                <tr>
                  <th scope="col" className={thClass}>Task</th>
                  <th scope="col" className={thClass}>Assigned to</th>
                  <th scope="col" className={thClass}>Priority</th>
                  <th scope="col" className={thClass}>Status</th>
                  <th scope="col" className={thClass}>Due</th>
                  <th scope="col" className={`${thClass} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className={tbodyClass}>
                {tasks.map((task) => (
                  <tr key={task.id} className={`${trClass} ${task.isOverdue ? 'is-overdue' : ''}`}>
                    <td className={`${tdClass} max-w-xs`}>
                      <div className="font-medium">{task.title}</div>
                      {task.description && <div className="truncate text-muted">{task.description}</div>}
                    </td>
                    <td className={tdClass}>
                      {task.assignee ? task.assignee.name : <span className="text-muted">Unassigned</span>}
                    </td>
                    <td className={tdClass}>
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className={tdClass}>
                      <StatusBadge status={task.status} />
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}>
                      <span className={task.isOverdue ? 'font-medium text-danger' : undefined}>
                        {formatDueDate(task.dueDate)}
                      </span>
                      {task.isOverdue && (
                        <span className="ml-2 rounded-md bg-danger-tint px-1.5 py-0.5 text-xs font-medium text-danger">Overdue</span>
                      )}
                    </td>
                    <td className={`${tdClass} text-right whitespace-nowrap`}>
                      <button
                        type="button"
                        className={ghostButton}
                        aria-label={`Edit ${task.title}`}
                        onClick={() => setEditing(task)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={ghostDangerButton}
                        aria-label={`Delete ${task.title}`}
                        onClick={() => setDeleting(task)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {meta && meta.total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <p>
            Showing {(meta.page - 1) * meta.pageSize + 1}-
            {Math.min(meta.page * meta.pageSize, meta.total)} of {meta.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => current - 1)}
              disabled={meta.page <= 1}
              className={secondaryButton}
            >
              Previous
            </button>
            <span>
              Page {meta.page} of {meta.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={meta.page >= meta.totalPages}
              className={secondaryButton}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {editing && <TaskFormModal task={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {deleting && <ConfirmDeleteTaskModal task={deleting} onClose={() => setDeleting(null)} />}
    </section>
  );
}
