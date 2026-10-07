import { useEffect, useState } from 'react';
import ConfirmDeleteEmployeeModal from '../components/ConfirmDeleteEmployeeModal';
import EmployeeFormModal from '../components/EmployeeFormModal';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { type Employee, useEmployees } from '../hooks/useEmployees';
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

export default function EmployeesPage() {
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  // `null` = no dialog, `'new'` = the add form, an employee = the edit form.
  const [editing, setEditing] = useState<Employee | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);

  const search = useDebouncedValue(searchInput.trim(), 300);
  const { data, error, isPending, isError, isPlaceholderData, refetch } = useEmployees({
    search,
    page,
    pageSize: PAGE_SIZE,
  });

  // After deleting the last row of the last page, step back to a page that still exists.
  const totalPages = data?.meta.totalPages;
  useEffect(() => {
    if (totalPages !== undefined && page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const employees = data?.items ?? [];
  const meta = data?.meta;

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Employees</h1>
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

      <div className="mt-4">
        {isPending ? (
          <p role="status" className="py-8 text-center text-muted motion-safe:animate-pulse">
            Loading employees...
          </p>
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
          <p className="rounded-lg border border-dashed border-line py-10 text-center text-muted">
            {search ? `No employees match "${search}".` : 'No employees yet. Add the first one.'}
          </p>
        ) : (
          <div
            className={`${tableWrapClass} ${isPlaceholderData ? 'opacity-60' : ''}`}
          >
            <table className={tableClass}>
              <thead className={theadClass}>
                <tr>
                  <th scope="col" className={thClass}>Name</th>
                  <th scope="col" className={thClass}>Position</th>
                  <th scope="col" className={thClass}>Department</th>
                  <th scope="col" className={thClass}>Tasks</th>
                  <th scope="col" className={`${thClass} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className={tbodyClass}>
                {employees.map((employee) => (
                  <tr key={employee.id} className={trClass}>
                    <td className={tdClass}>
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-muted">{employee.email}</div>
                    </td>
                    <td className={tdClass}>{employee.position}</td>
                    <td className={tdClass}>{employee.department}</td>
                    <td className={tdClass}>{employee.taskCount}</td>
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

      {editing && (
        <EmployeeFormModal employee={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
      {deleting && <ConfirmDeleteEmployeeModal employee={deleting} onClose={() => setDeleting(null)} />}
    </section>
  );
}
