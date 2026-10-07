import { useState } from 'react';
import { type Employee, useDeleteEmployee } from '../hooks/useEmployees';
import { ApiError } from '../lib/api';
import { alertClass, dangerButton, secondaryButton } from '../lib/ui';
import Modal from './Modal';

type Props = { employee: Employee; onClose: () => void };

/** Asks before deleting, and says what will happen to the employee's tasks. */
export default function ConfirmDeleteEmployeeModal({ employee, onClose }: Props) {
  const deleteEmployee = useDeleteEmployee();
  const [error, setError] = useState<string | null>(null);
  const n = employee.taskCount;

  async function confirm() {
    setError(null);
    try {
      await deleteEmployee.mutateAsync(employee.id);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    }
  }

  return (
    <Modal title={`Delete ${employee.name}?`} onClose={onClose}>
      <div className="mt-3 space-y-3 text-sm text-ink">
        {error && (
          <p role="alert" className={alertClass}>
            {error}
          </p>
        )}
        <p>
          {n === 0
            ? 'This employee has no tasks.'
            : `${n} ${n === 1 ? 'task' : 'tasks'} assigned to them will be kept and become unassigned.`}
        </p>
        <p>This cannot be undone.</p>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          autoFocus
          onClick={onClose}
          className={secondaryButton}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void confirm()}
          disabled={deleteEmployee.isPending}
          className={dangerButton}
        >
          {deleteEmployee.isPending ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </Modal>
  );
}
