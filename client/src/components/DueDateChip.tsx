import { CalendarCheck, CalendarClock, CalendarDays, TriangleAlert, type LucideIcon } from 'lucide-react';
import { type DueState, dueState, formatDueDate } from '../lib/dates';

const LOOK: Record<DueState, { icon: LucideIcon; classes: string }> = {
  overdue: { icon: TriangleAlert, classes: 'bg-danger-tint text-danger' },
  soon: { icon: CalendarClock, classes: 'bg-warning-tint text-warning' },
  done: { icon: CalendarCheck, classes: 'bg-raised text-muted' },
  later: { icon: CalendarDays, classes: 'bg-raised text-muted' },
};

/** The due date as a small colored chip: red when overdue, amber when due within 3 days. */
export default function DueDateChip({ task }: { task: { dueDate: string; status: string; isOverdue: boolean } }) {
  const state = dueState(task);
  const { icon: Icon, classes } = LOOK[state];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${classes}`}>
      <Icon size={14} aria-hidden="true" />
      <span>{formatDueDate(task.dueDate)}</span>
      {state === 'overdue' && <span>Overdue</span>}
    </span>
  );
}
