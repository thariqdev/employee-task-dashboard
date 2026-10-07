import {
  PRIORITY_BARS,
  PRIORITY_LABELS,
  STATUS_DOT,
  STATUS_LABELS,
  type TaskPriority,
  type TaskStatus,
} from '../lib/taskLabels';

/** The small colored dot that stands for a status. */
export function StatusDot({ status }: { status: TaskStatus }) {
  return <span aria-hidden="true" className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />;
}

/** The three little bars (1 to 3 filled) that stand for a priority. */
export function PriorityBars({ priority }: { priority: TaskPriority }) {
  const { filled, color } = PRIORITY_BARS[priority];
  return (
    <span aria-hidden="true" className="flex items-end gap-0.5">
      {[1, 2, 3].map((bar) => (
        <span
          key={bar}
          className={`w-1 rounded-sm ${bar === 1 ? 'h-1.5' : bar === 2 ? 'h-2.5' : 'h-3.5'} ${bar <= filled ? color : 'bg-edge'}`}
        />
      ))}
    </span>
  );
}

/** A small colored dot followed by the status in plain text. */
export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className="inline-flex items-center gap-2">
      <StatusDot status={status} />
      {STATUS_LABELS[status]}
    </span>
  );
}

/** Three bars (1 to 3 filled) followed by the priority in plain text. */
export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className="inline-flex items-center gap-2">
      <PriorityBars priority={priority} />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
