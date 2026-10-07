import { CalendarDays, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { type KeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { type Day, addDays, addMonths, monthGrid, parseIso, sameDay, toIso, today } from '../lib/calendar';
import { inputClass } from '../lib/ui';

type Props = {
  id: string;
  /** "yyyy-mm-dd", or whatever is typed so far. */
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
};

const POPOVER_WIDTH = 288; // w-72
const GAP = 8; // space between the text box and the calendar, and to the screen edge

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const monthTitle = (year: number, month: number) =>
  new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

const navButton =
  'flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-raised hover:text-ink ' +
  'focus-visible:outline-2 focus-visible:outline-accent';

/** A text box for "yyyy-mm-dd" with a calendar popover beside it. Typing and picking both work. */
export default function DatePicker({ id, value, onChange, invalid = false }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const popover = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const focusCell = useRef(false); // true when the keyboard moved the cursor, so the cell must take focus
  const selected = parseIso(value);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState<Day>(selected ?? today()); // the day the keyboard is on
  const [view, setView] = useState({ year: cursor.year, month: cursor.month }); // the month on screen

  // Close when the user clicks anywhere else.
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!root.current?.contains(target) && !popover.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  // After a key press moves the cursor, put focus on its cell.
  useEffect(() => {
    if (!open || !focusCell.current) return;
    focusCell.current = false;
    popover.current?.querySelector<HTMLButtonElement>(`[data-day="${toIso(cursor)}"]`)?.focus();
  }, [open, cursor, view]);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const box = root.current?.getBoundingClientRect();
      const height = popover.current?.offsetHeight ?? 0;
      if (!box) return;
      const roomBelow = window.innerHeight - box.bottom - GAP * 2;
      const roomAbove = box.top - GAP * 2;
      const above = height > roomBelow && roomAbove > roomBelow;
      const width = Math.min(POPOVER_WIDTH, window.innerWidth - GAP * 3);
      setPosition({
        top: above ? Math.max(GAP, box.top - GAP - height) : box.bottom + GAP,
        left: Math.min(Math.max(GAP, box.right - width), window.innerWidth - width - GAP),
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true); // also when the dialog scrolls
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, view]);

  function openCalendar() {
    const start = selected ?? today();
    setCursor(start);
    setView({ year: start.year, month: start.month });
    setOpen(true);
  }

  function pick(day: Day) {
    onChange(toIso(day));
    setOpen(false);
    toggle.current?.focus();
  }

  function moveView(months: number) {
    const moved = addMonths({ ...view, day: 1 }, months);
    setView({ year: moved.year, month: moved.month });
  }

  function moveCursor(next: Day) {
    focusCell.current = true;
    setCursor(next);
    setView({ year: next.year, month: next.month });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step: Record<string, () => Day> = {
      ArrowLeft: () => addDays(cursor, -1),
      ArrowRight: () => addDays(cursor, 1),
      ArrowUp: () => addDays(cursor, -7),
      ArrowDown: () => addDays(cursor, 7),
      PageUp: () => addMonths(cursor, -1),
      PageDown: () => addMonths(cursor, 1),
    };
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation(); // closes the calendar only, not the dialog around it
      setOpen(false);
      toggle.current?.focus();
    } else if (step[event.key] && (event.target as HTMLElement).dataset.day) {
      event.preventDefault();
      moveCursor(step[event.key]!());
    }
  }

  const now = today();
  const weeks = monthGrid(view.year, view.month);
  // Only one day is a tab stop; arrow keys move between days.
  const tabDay = cursor.year === view.year && cursor.month === view.month ? cursor.day : 1;

  return (
    <div ref={root} className="relative">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="yyyy-mm-dd"
        value={value}
        onChange={(event) => onChange(event.target.value.trim())}
        aria-invalid={invalid ? 'true' : 'false'}
        className={`${inputClass} pr-11`}
      />
      <button
        ref={toggle}
        type="button"
        aria-label="Open calendar"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openCalendar())}
        className="absolute top-1/2 right-1.5 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted transition hover:bg-edge hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
      >
        <CalendarDays size={18} aria-hidden="true" />
      </button>

      {open &&
        createPortal(
        <div
          ref={popover}
          role="group"
          aria-label="Calendar"
          onKeyDown={onKeyDown}
          style={{ position: 'fixed', top: position?.top ?? 0, left: position?.left ?? 0, visibility: position ? 'visible' : 'hidden' }}
          className="z-[60] w-72 max-w-[calc(100vw-1.5rem)] rounded-lg bg-surface p-3 shadow-pop ring-1 ring-line"
        >
          <div className="flex items-center justify-between gap-1">
            <button type="button" aria-label="Previous year" onClick={() => moveView(-12)} className={navButton}>
              <ChevronsLeft size={16} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Previous month" onClick={() => moveView(-1)} className={navButton}>
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <p aria-live="polite" className="flex-1 text-center text-sm font-bold">
              {monthTitle(view.year, view.month)}
            </p>
            <button type="button" aria-label="Next month" onClick={() => moveView(1)} className={navButton}>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Next year" onClick={() => moveView(12)} className={navButton}>
              <ChevronsRight size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-2 grid grid-cols-7 text-center text-xs text-muted">
            {WEEKDAYS.map((name) => (
              <span key={name} className="py-1">
                {name}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5">
            {weeks.flat().map((day, index) => {
              if (day === null) return <span key={`blank-${index}`} />;
              const date: Day = { year: view.year, month: view.month, day };
              const isSelected = selected !== null && sameDay(date, selected);
              const isToday = sameDay(date, now);
              return (
                <button
                  key={day}
                  type="button"
                  data-day={toIso(date)}
                  tabIndex={day === tabDay ? 0 : -1}
                  aria-pressed={isSelected}
                  aria-current={isToday ? 'date' : undefined}
                  aria-label={`${day} ${monthTitle(view.year, view.month)}`}
                  onClick={() => pick(date)}
                  className={
                    'mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition focus-visible:outline-2 focus-visible:outline-accent ' +
                    (isSelected
                      ? 'bg-accent font-bold text-white'
                      : isToday
                        ? 'font-bold text-accent shadow-[inset_0_0_0_1px_var(--color-accent)] hover:bg-raised'
                        : 'hover:bg-raised')
                  }
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex justify-end border-t border-line pt-2">
            <button
              type="button"
              onClick={() => pick(now)}
              className="rounded-full px-3 py-1 text-sm font-bold text-accent transition hover:bg-accent-tint focus-visible:outline-2 focus-visible:outline-accent"
            >
              Today
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
