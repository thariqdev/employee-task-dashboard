import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { thClass } from '../lib/ui';

export type SortOrder = 'asc' | 'desc';

type Props<Field extends string> = {
  label: string;
  field: Field;
  /** The column the table is sorted by now, and in which direction. */
  sort: Field;
  order: SortOrder;
  onSort: (field: Field) => void;
};

/** A column header you can click to sort by that column. A second click reverses the order. */
export default function SortHeader<Field extends string>({ label, field, sort, order, onSort }: Props<Field>) {
  const active = sort === field;
  const Icon = !active ? ChevronsUpDown : order === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th scope="col" aria-sort={active ? (order === 'asc' ? 'ascending' : 'descending') : undefined} className={thClass}>
      <button
        type="button"
        onClick={() => onSort(field)}
        aria-label={`Sort by ${label}`}
        className={
          'group -mx-2 inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-left font-bold transition ' +
          'hover:bg-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-accent ' +
          (active ? 'text-ink' : 'text-muted')
        }
      >
        {label}
        <Icon size={14} aria-hidden="true" className={active ? 'text-accent' : 'opacity-50 group-hover:opacity-100'} />
      </button>
    </th>
  );
}

/** What a click on a column header does: a new column starts A to Z, the same column flips its direction. */
export function nextSort<Field extends string>(current: { sort: Field; order: SortOrder }, field: Field) {
  if (current.sort !== field) return { sort: field, order: 'asc' as SortOrder };
  return { sort: field, order: (current.order === 'asc' ? 'desc' : 'asc') as SortOrder };
}
