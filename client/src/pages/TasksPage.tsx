import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import ConfirmDeleteTaskModal from '../components/ConfirmDeleteTaskModal';
import { ListChecks, SearchX, X } from 'lucide-react';
import DueDateChip from '../components/DueDateChip';
import EmptyState from '../components/EmptyState';
import Select from '../components/Select';
import SortHeader, { type SortOrder, nextSort } from '../components/SortHeader';
import Pagination from '../components/Pagination';
import { FetchingOverlay, TableSkeleton } from '../components/Skeleton';
import { PriorityBadge, StatusBadge } from '../components/TaskBadges';
import TaskFormModal from '../components/TaskFormModal';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useEmployeeOptions } from '../hooks/useEmployees';
import { TASKS_KEY, type Task, type TaskFilters, type TaskSortField, useTasks } from '../hooks/useTasks';
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from '../lib/taskLabels';
import {
  alertClass,
  filterClass,
  ghostButton,
  ghostDangerButton,
  primaryButton,
  tableClass,
  tableWrapClass,
  tbodyClass,
  tdClass,
  theadClass,
  thClass,
  trClass,
} from '../lib/ui';

const PAGE_SIZE = 10;

const NO_FILTERS = { status: '', priority: '', assignee: '', overdueOnly: false } as const;

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<Omit<TaskFilters, 'search'>>({ ...NO_FILTERS });
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<{ sort: TaskSortField; order: SortOrder }>({ sort: 'dueDate', order: 'asc' });
  // `null` = no dialog, `'new'` = the add form, a task = the edit form.
  const [editing, setEditing] = useState<Task | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);

  const search = useDebouncedValue(searchInput.trim(), 300);
  const { data: employees = [] } = useEmployeeOptions();
  const { data, error, isPending, isError, isFetching, refetch } = useTasks({
    ...filters,
    search,
    page,
    pageSize: PAGE_SIZE,
    ...sorting,
  });

  // After deleting the last row of the last page, step back to a page that still exists.
  const totalPages = data?.meta.totalPages;
  useEffect(() => {
    if (totalPages !== undefined && page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function sortBy(field: TaskSortField) {
    setSorting((current) => nextSort(current, field));
    setPage(1);
  }

  function changeFilter(change: Partial<typeof filters>) {
    setFilters((current) => ({ ...current, ...change }));
    setPage(1);
  }

  const tasks = data?.items ?? [];
  const meta = data?.meta;
  const filtering =
    search !== '' || filters.status !== '' || filters.priority !== '' || filters.assignee !== '' || filters.overdueOnly;
  // Uses what is in the search box right now (not the delayed value), so the button appears and goes at once.
  const anyFilterSet =
    searchInput.trim() !== '' ||
    filters.status !== '' ||
    filters.priority !== '' ||
    filters.assignee !== '' ||
    filters.overdueOnly;

  function clearFilters() {
    // Reload even if the unfiltered list is cached, so the "Refreshing..." loader shows and the data is current.
    void queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    setSearchInput('');
    setFilters({ ...NO_FILTERS });
    setPage(1);
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold sm:text-2xl">Tasks</h1>
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
            className={`${filterClass} w-full sm:w-56`}
          />
        </div>
        <Select
          label="Filter by status"
          value={filters.status}
          onChange={(status) => changeFilter({ status: status as TaskFilters['status'] })}
          options={[{ value: '', label: 'All statuses' }, ...STATUSES.map((v) => ({ value: v, label: STATUS_LABELS[v] }))]}
        />
        <Select
          label="Filter by priority"
          value={filters.priority}
          onChange={(priority) => changeFilter({ priority: priority as TaskFilters['priority'] })}
          options={[{ value: '', label: 'All priorities' }, ...PRIORITIES.map((v) => ({ value: v, label: PRIORITY_LABELS[v] }))]}
        />
        <Select
          label="Filter by assignee"
          value={filters.assignee}
          onChange={(assignee) => changeFilter({ assignee })}
          options={[
            { value: '', label: 'Everyone' },
            { value: 'unassigned', label: 'Unassigned' },
            ...employees.map((e) => ({ value: String(e.id), label: e.name })),
          ]}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.overdueOnly}
            onChange={(event) => changeFilter({ overdueOnly: event.target.checked })}
            className="h-4 w-4 rounded accent-accent"
          />
          Overdue only
        </label>
        {anyFilterSet && (
          <button type="button" onClick={clearFilters} className={`${ghostButton} inline-flex items-center gap-1.5`}>
            <X size={14} aria-hidden="true" />
            Clear filters
          </button>
        )}
      </div>

      <div className="relative mt-4">
        {isPending ? (
          <TableSkeleton label="Loading tasks..." />
        ) : isError ? (
          <div role="alert" className={`${alertClass} p-4`}>
            <p>{error.message}</p>
            <button type="button" onClick={() => void refetch()} className="mt-2 font-medium underline">
              Try again
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState icon={filtering ? SearchX : ListChecks}>
            {filtering ? 'No tasks match your filters.' : 'No tasks yet. Add the first one.'}
          </EmptyState>
        ) : (
          <div
            className={`${tableWrapClass} ${isFetching ? 'opacity-60' : ''}`}
          >
            <table className={tableClass}>
              <thead className={theadClass}>
                <tr>
                  <SortHeader label="Task" field="title" {...sorting} onSort={sortBy} />
                  <SortHeader label="Assigned to" field="assignee" {...sorting} onSort={sortBy} />
                  <SortHeader label="Priority" field="priority" {...sorting} onSort={sortBy} />
                  <SortHeader label="Status" field="status" {...sorting} onSort={sortBy} />
                  <SortHeader label="Due" field="dueDate" {...sorting} onSort={sortBy} />
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
                      <DueDateChip task={task} />
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
        {isFetching && !isPending && <FetchingOverlay />}
      </div>

      {meta && meta.total > 0 && <Pagination meta={meta} onPage={setPage} />}

      {editing && <TaskFormModal task={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {deleting && <ConfirmDeleteTaskModal task={deleting} onClose={() => setDeleting(null)} />}
    </section>
  );
}
