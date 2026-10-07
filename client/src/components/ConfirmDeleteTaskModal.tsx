import { useState } from 'react';
import { type Task, useDeleteTask } from '../hooks/useTasks';
import { ApiError } from '../lib/api';
import { alertClass, dangerButton, secondaryButton } from '../lib/ui';
import Modal from './Modal';

type Props = { task: Task; onClose: () => void };

export default function ConfirmDeleteTaskModal({ task, onClose }: Props) {
  const deleteTask = useDeleteTask();
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setError(null);
    try {
      await deleteTask.mutateAsync(task.id);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    }
  }

  return (
    <Modal title="Delete this task?" onClose={onClose}>
      <div className="mt-3 space-y-3 text-sm text-ink">
        {error && (
          <p role="alert" className={alertClass}>
            {error}
          </p>
        )}
        <p>
          <span className="font-medium">{task.title}</span> will be removed. This cannot be undone.
        </p>
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
          disabled={deleteTask.isPending}
          className={dangerButton}
        >
          {deleteTask.isPending ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </Modal>
  );
}
