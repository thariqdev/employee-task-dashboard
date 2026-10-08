import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { type Employee, useCreateEmployee, useUpdateEmployee } from '../hooks/useEmployees';
import { ApiError } from '../lib/api';
import {
  DEPARTMENTS,
  OTHER,
  POSITIONS,
  otherTextError,
  resolveChoice,
  splitChoice,
} from '../lib/employeeOptions';
import { alertClass, errorTextClass, inputClass, primaryButton, secondaryButton } from '../lib/ui';
import Modal from './Modal';
import Select from './Select';

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} is required`).max(100, `${label} must be at most 100 characters`);

// Position and department are each a choice from a list. "Other" reveals a text box, which is checked too.
const employeeSchema = z
  .object({
    name: requiredText('Name'),
    email: z.string().trim().pipe(z.email('Enter a valid email address')),
    position: z.string().min(1, 'Choose a position'),
    positionOther: z.string(),
    department: z.string().min(1, 'Choose a department'),
    departmentOther: z.string(),
  })
  .superRefine((values, ctx) => {
    const checks = [
      { choice: values.position, other: values.positionOther, field: 'positionOther', list: POSITIONS, noun: 'position' },
      {
        choice: values.department,
        other: values.departmentOther,
        field: 'departmentOther',
        list: DEPARTMENTS,
        noun: 'department',
      },
    ] as const;
    for (const { choice, other, field, list, noun } of checks) {
      if (choice !== OTHER) continue;
      const message = otherTextError(other, [...list], noun);
      if (message) ctx.addIssue({ code: 'custom', path: [field], message });
    }
  });
type EmployeeForm = z.infer<typeof employeeSchema>;

type ServerField = 'name' | 'email' | 'position' | 'department';
const SERVER_FIELDS: readonly string[] = ['name', 'email', 'position', 'department'];

type Props = {
  /** The employee being edited, or null to add a new one. */
  employee: Employee | null;
  onClose: () => void;
  /** Called once a new employee has been saved (not after an edit). */
  onCreated?: () => void;
};

const labelClass = 'block text-sm font-medium';

export default function EmployeeFormModal({ employee, onClose, onCreated }: Props) {
  const create = useCreateEmployee();
  const update = useUpdateEmployee();
  const [formError, setFormError] = useState<string | null>(null);

  const startPosition = splitChoice(POSITIONS, employee?.position ?? '');
  const startDepartment = splitChoice(DEPARTMENTS, employee?.department ?? '');
  const {
    register,
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: employee?.name ?? '',
      email: employee?.email ?? '',
      position: startPosition.choice,
      positionOther: startPosition.other,
      department: startDepartment.choice,
      departmentOther: startDepartment.other,
    },
  });
  const position = watch('position');
  const department = watch('department');

  async function onSubmit(values: EmployeeForm) {
    setFormError(null);
    const input = {
      name: values.name,
      email: values.email,
      position: resolveChoice(values.position, values.positionOther),
      department: resolveChoice(values.department, values.departmentOther),
    };
    try {
      if (employee) await update.mutateAsync({ id: employee.id, input });
      else {
        await create.mutateAsync(input);
        onCreated?.();
      }
      onClose();
    } catch (err) {
      if (!(err instanceof ApiError)) return setFormError('Something went wrong');

      // Put the server's message next to the field it is about, when it names one.
      if (err.status === 409) return setError('email', { message: err.message });
      const fieldErrors = (err.details ?? []).filter((d): d is { field: ServerField; message: string } =>
        SERVER_FIELDS.includes(d.field),
      );
      if (fieldErrors.length === 0) return setFormError(err.message);
      for (const { field, message } of fieldErrors) {
        // A typed "Other" value is what the server checked, so show its message under that box.
        if (field === 'position' && values.position === OTHER) setError('positionOther', { message });
        else if (field === 'department' && values.department === OTHER) setError('departmentOther', { message });
        else setError(field, { message });
      }
    }
  }

  return (
    <Modal title={employee ? 'Edit employee' : 'Add employee'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-4">
        {formError && (
          <p role="alert" className={alertClass}>
            {formError}
          </p>
        )}

        <div>
          <label htmlFor="employee-name" className={labelClass}>
            Name
          </label>
          <input
            id="employee-name"
            type="text"
            autoFocus
            aria-invalid={errors.name ? 'true' : 'false'}
            className={inputClass}
            {...register('name')}
          />
          {errors.name && <p className={errorTextClass}>{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="employee-email" className={labelClass}>
            Email
          </label>
          <input
            id="employee-email"
            type="email"
            aria-invalid={errors.email ? 'true' : 'false'}
            className={inputClass}
            {...register('email')}
          />
          {errors.email && <p className={errorTextClass}>{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="employee-position" className={labelClass}>
            Position
          </label>
          <Controller
            control={control}
            name="position"
            render={({ field }) => (
              <Select
                id="employee-position"
                label="Position"
                variant="field"
                placeholder="Select a position"
                value={field.value}
                onChange={field.onChange}
                invalid={Boolean(errors.position)}
                options={[...POSITIONS.map((p) => ({ value: p, label: p })), { value: OTHER, label: 'Other...' }]}
              />
            )}
          />
          {errors.position && <p className={errorTextClass}>{errors.position.message}</p>}
          {position === OTHER && (
            <div className="mt-3">
              <label htmlFor="employee-position-other" className={labelClass}>
                Other position
              </label>
              <input
                id="employee-position-other"
                type="text"
                autoFocus
                placeholder="For example, Data Scientist"
                aria-invalid={errors.positionOther ? 'true' : 'false'}
                className={inputClass}
                {...register('positionOther')}
              />
              {errors.positionOther && <p className={errorTextClass}>{errors.positionOther.message}</p>}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="employee-department" className={labelClass}>
            Department
          </label>
          <Controller
            control={control}
            name="department"
            render={({ field }) => (
              <Select
                id="employee-department"
                label="Department"
                variant="field"
                placeholder="Select a department"
                value={field.value}
                onChange={field.onChange}
                invalid={Boolean(errors.department)}
                options={[...DEPARTMENTS.map((d) => ({ value: d, label: d })), { value: OTHER, label: 'Other...' }]}
              />
            )}
          />
          {errors.department && <p className={errorTextClass}>{errors.department.message}</p>}
          {department === OTHER && (
            <div className="mt-3">
              <label htmlFor="employee-department-other" className={labelClass}>
                Other department
              </label>
              <input
                id="employee-department-other"
                type="text"
                autoFocus
                placeholder="For example, Legal"
                aria-invalid={errors.departmentOther ? 'true' : 'false'}
                className={inputClass}
                {...register('departmentOther')}
              />
              {errors.departmentOther && <p className={errorTextClass}>{errors.departmentOther.message}</p>}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className={primaryButton}>
            {isSubmitting ? 'Saving...' : employee ? 'Save changes' : 'Add employee'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
