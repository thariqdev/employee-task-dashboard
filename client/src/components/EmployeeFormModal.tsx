import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  type Employee,
  type EmployeeInput,
  useCreateEmployee,
  useUpdateEmployee,
} from '../hooks/useEmployees';
import { ApiError } from '../lib/api';
import { alertClass, errorTextClass, inputClass, primaryButton, secondaryButton } from '../lib/ui';
import Modal from './Modal';

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} is required`).max(100, `${label} must be at most 100 characters`);

const employeeSchema = z.object({
  name: requiredText('Name'),
  email: z.string().trim().pipe(z.email('Enter a valid email address')),
  position: requiredText('Position'),
  department: requiredText('Department'),
});

const FIELDS = ['name', 'email', 'position', 'department'] as const;
type Field = (typeof FIELDS)[number];

const LABELS: Record<Field, string> = {
  name: 'Name',
  email: 'Email',
  position: 'Position',
  department: 'Department',
};

type Props = {
  /** The employee being edited, or null to add a new one. */
  employee: Employee | null;
  onClose: () => void;
};

export default function EmployeeFormModal({ employee, onClose }: Props) {
  const create = useCreateEmployee();
  const update = useUpdateEmployee();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeInput>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: employee?.name ?? '',
      email: employee?.email ?? '',
      position: employee?.position ?? '',
      department: employee?.department ?? '',
    },
  });

  async function onSubmit(values: EmployeeInput) {
    setFormError(null);
    try {
      if (employee) await update.mutateAsync({ id: employee.id, input: values });
      else await create.mutateAsync(values);
      onClose();
    } catch (err) {
      if (!(err instanceof ApiError)) return setFormError('Something went wrong');

      // Put the server's message next to the field it is about, when it names one.
      if (err.status === 409) return setError('email', { message: err.message });
      const fieldErrors = (err.details ?? []).filter((d): d is { field: Field; message: string } =>
        (FIELDS as readonly string[]).includes(d.field),
      );
      if (fieldErrors.length === 0) return setFormError(err.message);
      for (const { field, message } of fieldErrors) setError(field, { message });
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

        {FIELDS.map((field, index) => (
          <div key={field}>
            <label htmlFor={`employee-${field}`} className="block text-sm font-medium">
              {LABELS[field]}
            </label>
            <input
              id={`employee-${field}`}
              type={field === 'email' ? 'email' : 'text'}
              autoFocus={index === 0}
              aria-invalid={errors[field] ? 'true' : 'false'}
              className={inputClass}
              {...register(field)}
            />
            {errors[field] && <p className={errorTextClass}>{errors[field]?.message}</p>}
          </div>
        ))}

        <div className="flex justify-end gap-2 pt-2">
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
            {isSubmitting ? 'Saving...' : employee ? 'Save changes' : 'Add employee'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
