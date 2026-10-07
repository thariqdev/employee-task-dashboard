import { useEffect, useState } from 'react';
import { SearchX, Users } from 'lucide-react';
import Avatar from '../components/Avatar';
import ConfirmDeleteEmployeeModal from '../components/ConfirmDeleteEmployeeModal';
import EmployeeFormModal from '../components/EmployeeFormModal';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { FetchingOverlay, TableSkeleton } from '../components/Skeleton';
import SortHeader, { type SortOrder, nextSort } from '../components/SortHeader';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { type Employee, type EmployeeSortField, useEmployees } from '../hooks/useEmployees';
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

export default function EmployeesPage() {
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<{ sort: EmployeeSortField; order: SortOrder }>({ sort: 'name', order: 'asc' });
  // `null` = no dialog, `'new'` = the add form, an employee = the edit form.
  const [editing, setEditing] = useState<Employee | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);

  const search = useDebouncedValue(searchInput.trim(), 300);
  const { data, error, isPending, isError, isFetching, refetch } = useEmployees({
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

  function sortBy(field: EmployeeSortField) {
    setSorting((current) => nextSort(current, field));
    setPage(1);
  }

  const employees = data?.items ?? [];
  const meta = data?.meta;

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold sm:text-2xl">Employees</h1>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className={primaryButton}
        >
          Add employee
        </button>
      </div>

      <div className="mt-4">
        <label htmlFor="employee-search" className="sr-only">
          Search employees
        </label>
        <input
          id="employee-search"
          type="search"
          placeholder="Search by name or email"
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value);
            setPage(1);
          }}
          className={`${filterClass} block w-full max-w-sm`}
        />
      </div>

      <div className="relative mt-4">
        {isPending ? (
          <TableSkeleton label="Loading employees..." />
        ) : isError ? (
          <div role="alert" className={`${alertClass} p-4`}>
            <p>{error.message}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-2 font-medium underline"
            >
              Try again
            </button>
          </div>
        ) : employees.length === 0 ? (
          <EmptyState icon={search ? SearchX : Users}>
            {search ? `No employees match "${search}".` : 'No employees yet. Add the first one.'}
          </EmptyState>
        ) : (
          <div
            className={`${tableWrapClass} ${isFetching ? 'opacity-60' : ''}`}
          >
            <table className={tableClass}>
              <thead className={theadClass}>
                <tr>
                  <SortHeader label="Name" field="name" {...sorting} onSort={sortBy} />
                  <SortHeader label="Position" field="position" {...sorting} onSort={sortBy} />
                  <SortHeader label="Department" field="department" {...sorting} onSort={sortBy} />
                  <SortHeader label="Tasks" field="tasks" {...sorting} onSort={sortBy} />
                  <th scope="col" className={`${thClass} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className={tbodyClass}>
                {employees.map((employee) => (
                  <tr key={employee.id} className={trClass}>
                    <td className={tdClass}>
                      <div className="flex items-center gap-3">
                        <Avatar name={employee.name} />
                        <div className="min-w-0">
                          <div className="font-bold">{employee.name}</div>
                          <div className="text-muted">{employee.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className={tdClass}>{employee.position}</td>
                    <td className={tdClass}>{employee.department}</td>
                    <td className={tdClass}>
                      <span className="inline-block min-w-7 rounded-full bg-raised px-2 py-0.5 text-center text-xs font-bold">
                        {employee.taskCount}
                      </span>
                    </td>
                    <td className={`${tdClass} text-right whitespace-nowrap`}>
                      <button
                        type="button"
                        className={ghostButton}
                        aria-label={`Edit ${employee.name}`}
                        onClick={() => setEditing(employee)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={ghostDangerButton}
                        aria-label={`Delete ${employee.name}`}
                        onClick={() => setDeleting(employee)}
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

      {editing && (
        <EmployeeFormModal employee={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
      {deleting && <ConfirmDeleteEmployeeModal employee={deleting} onClose={() => setDeleting(null)} />}
    </section>
  );
}
