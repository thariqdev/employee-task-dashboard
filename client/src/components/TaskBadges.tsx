import {
  PRIORITY_BARS,
  PRIORITY_LABELS,
  STATUS_DOT,
  STATUS_LABELS,
  type TaskPriority,
  type TaskStatus,
} from '../lib/taskLabels';

/** A small colored dot followed by the status in plain text. */
export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}

/** Three bars (1 to 3 filled) followed by the priority in plain text. */
export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const { filled, color } = PRIORITY_BARS[priority];
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className="flex items-end gap-0.5">
        {[1, 2, 3].map((bar) => (
          <span
            key={bar}
            className={`w-1 rounded-sm ${bar === 1 ? 'h-1.5' : bar === 2 ? 'h-2.5' : 'h-3.5'} ${bar <= filled ? color : 'bg-line'}`}
          />
        ))}
      </span>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
