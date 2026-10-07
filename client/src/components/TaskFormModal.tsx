import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useEmployeeOptions } from '../hooks/useEmployees';
import { type Task, type TaskInput, useCreateTask, useUpdateTask } from '../hooks/useTasks';
import { ApiError } from '../lib/api';
import { parseIso } from '../lib/calendar';
import { endOfDayUtc, toDateInput } from '../lib/dates';
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from '../lib/taskLabels';
import {
  alertClass,
  errorTextClass,
  inputClass,
  primaryButton,
  secondaryButton,
  textareaClass,
} from '../lib/ui';
import DatePicker from './DatePicker';
import Modal from './Modal';
import Select from './Select';
import { PriorityBars, StatusDot } from './TaskBadges';

const taskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(150, 'Title must be at most 150 characters'),
  description: z.string().trim().max(2000, 'Description must be at most 2000 characters'),
  priority: z.enum(PRIORITIES),
  status: z.enum(STATUSES),
  // "yyyy-mm-dd", typed or picked from the calendar
  dueDate: z.string().superRefine((value, ctx) => {
    if (value.trim() === '') ctx.addIssue({ code: 'custom', message: 'Due date is required' });
    else if (!parseIso(value.trim())) ctx.addIssue({ code: 'custom', message: 'Enter a real date as yyyy-mm-dd' });
  }),
  assigneeId: z.number().int().positive().nullable(),
});
type TaskForm = z.infer<typeof taskSchema>;
type Field = keyof TaskForm;

const FIELD_NAMES: readonly string[] = ['title', 'description', 'priority', 'status', 'dueDate', 'assigneeId'];

type Props = {
  /** The task being edited, or null to add a new one. */
  task: Task | null;
  onClose: () => void;
};

export default function TaskFormModal({ task, onClose }: Props) {
  const create = useCreateTask();
  const update = useUpdateTask();
  const { data: employees = [] } = useEmployeeOptions();
  const [formError, setFormError] = useState<string | null>(null);

  // The task's current assignee is always an option, even before the full list has loaded,
  // so opening the form can never silently switch the task to "Unassigned".
  const assigneeOptions = [...employees];
  if (task?.assignee && !assigneeOptions.some((e) => e.id === task.assignee!.id)) {
    assigneeOptions.unshift(task.assignee);
  }

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      priority: task?.priority ?? 'MEDIUM',
      status: task?.status ?? 'PENDING',
      dueDate: task ? toDateInput(task.dueDate) : '',
      assigneeId: task?.assigneeId ?? null,
    },
  });

  async function onSubmit(values: TaskForm) {
    setFormError(null);
    const input: TaskInput = {
      ...values,
      // Keep the stored moment when the day was not changed; otherwise use the end of the chosen day.
      dueDate: task && toDateInput(task.dueDate) === values.dueDate ? task.dueDate : endOfDayUtc(values.dueDate),
    };

    try {
      if (task) await update.mutateAsync({ id: task.id, input });
      else await create.mutateAsync(input);
      onClose();
    } catch (err) {
      if (!(err instanceof ApiError)) return setFormError('Something went wrong');

      const fieldErrors = (err.details ?? []).filter((d) => FIELD_NAMES.includes(d.field));
      if (fieldErrors.length === 0) return setFormError(err.message);
      for (const { field, message } of fieldErrors) setError(field as Field, { message });
    }
  }

  return (
    <Modal title={task ? 'Edit task' : 'Add task'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-4">
        {formError && (
          <p role="alert" className={alertClass}>
            {formError}
          </p>
        )}

        <div>
          <label htmlFor="task-title" className="block text-sm font-medium">Title</label>
          <input
            id="task-title"
            type="text"
            autoFocus
            aria-invalid={errors.title ? 'true' : 'false'}
            className={inputClass}
            {...register('title')}
          />
          {errors.title && <p className={errorTextClass}>{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="task-description" className="block text-sm font-medium">Description</label>
          <textarea
            id="task-description"
            rows={3}
            aria-invalid={errors.description ? 'true' : 'false'}
            className={textareaClass}
            {...register('description')}
          />
          {errors.description && <p className={errorTextClass}>{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="task-priority" className="block text-sm font-medium">Priority</label>
            <Controller
              control={control}
              name="priority"
              render={({ field }) => (
                <Select
                  id="task-priority"
                  label="Priority"
                  variant="field"
                  value={field.value}
                  onChange={field.onChange}
                  options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p], icon: <PriorityBars priority={p} /> }))}
                />
              )}
            />
          </div>
          <div>
            <label htmlFor="task-status" className="block text-sm font-medium">Status</label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  id="task-status"
                  label="Status"
                  variant="field"
                  value={field.value}
                  onChange={field.onChange}
                  options={STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s], icon: <StatusDot status={s} /> }))}
                />
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="task-due" className="block text-sm font-medium">Due date</label>
            <Controller
              control={control}
              name="dueDate"
              render={({ field }) => (
                <DatePicker
                  id="task-due"
                  value={field.value}
                  onChange={field.onChange}
                  invalid={Boolean(errors.dueDate)}
                />
              )}
            />
            {errors.dueDate && <p className={errorTextClass}>{errors.dueDate.message}</p>}
          </div>
          <div>
            <label htmlFor="task-assignee" className="block text-sm font-medium">Assigned to</label>
            <Controller
              control={control}
              name="assigneeId"
              render={({ field }) => (
                <Select
                  id="task-assignee"
                  label="Assigned to"
                  variant="field"
                  value={field.value === null ? '' : String(field.value)}
                  onChange={(value) => field.onChange(value === '' ? null : Number(value))}
                  options={[
                    { value: '', label: 'Unassigned' },
                    ...assigneeOptions.map((e) => ({ value: String(e.id), label: e.name })),
                  ]}
                />
              )}
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className={secondaryButton}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={primaryButton}
          >
            {isSubmitting ? 'Saving...' : task ? 'Save changes' : 'Add task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
