import { Check, ChevronDown } from 'lucide-react';
import { type KeyboardEvent, type ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const GAP = 8; // space between the control and the list, and to the screen edge
const MAX_LIST_HEIGHT = 256; // 16rem

export type SelectOption = {
  value: string;
  label: string;
  /** Shown before the label, in the list and on the closed control. Hidden from screen readers. */
  icon?: ReactNode;
};

type SelectProps = {
  /** The accessible name, for example "Filter by status". It is not shown on screen. */
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  /** Colors the control when a real choice is made, so active filters stand out. */
  highlightWhenChosen?: boolean;
  /** Text shown while nothing is chosen. Without it, the first option shows. */
  placeholder?: string;
  /** "filter" is a small pill for toolbars. "field" fills the width like a form input. */
  variant?: 'filter' | 'field';
  /** Lets a <label htmlFor> point at the control. */
  id?: string;
  invalid?: boolean;
};

/** A dropdown that matches the rest of the UI. A listbox with the usual keyboard support, not a native <select>. */
export default function Select({
  label,
  value,
  options,
  onChange,
  highlightWhenChosen = true,
  placeholder,
  variant = 'filter',
  id: buttonId,
  invalid = false,
}: SelectProps) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [place, setPlace] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);
  const [open, setOpen] = useState(false);
  const foundIndex = options.findIndex((o) => o.value === value);
  // With a placeholder, "nothing chosen" is a real state (-1). Without one, the first option stands in.
  const selectedIndex = foundIndex >= 0 || placeholder === undefined ? Math.max(0, foundIndex) : -1;
  const [highlighted, setHighlighted] = useState(Math.max(0, selectedIndex));
  const field = variant === 'field';
  const chosen = !field && highlightWhenChosen && value !== '';

  // Close when the user clicks anywhere else.
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!root.current?.contains(target) && !list.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const position = () => {
      const box = root.current?.getBoundingClientRect();
      if (!box) return;
      const wanted = Math.min(list.current?.scrollHeight ?? MAX_LIST_HEIGHT, MAX_LIST_HEIGHT);
      const roomBelow = window.innerHeight - box.bottom - GAP * 2;
      const roomAbove = box.top - GAP * 2;
      const above = wanted > roomBelow && roomAbove > roomBelow;
      const maxHeight = Math.max(96, Math.min(MAX_LIST_HEIGHT, above ? roomAbove : roomBelow));
      const height = Math.min(wanted, maxHeight);
      setPlace({
        top: above ? box.top - GAP - height : box.bottom + GAP,
        left: Math.min(Math.max(GAP, box.left), Math.max(GAP, window.innerWidth - box.width - GAP)),
        width: box.width,
        maxHeight,
      });
    };
    position();
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true); // also when the dialog scrolls
    return () => {
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
    };
  }, [open, options.length]);

  function openList() {
    setHighlighted(Math.max(0, selectedIndex));
    setOpen(true);
  }

  function choose(index: number) {
    onChange(options[index]!.value);
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const last = options.length - 1;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!open) return openList();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setHighlighted((current) => Math.min(last, Math.max(0, current + step)));
        break;
      }
      case 'Home':
        if (open) {
          event.preventDefault();
          setHighlighted(0);
        }
        break;
      case 'End':
        if (open) {
          event.preventDefault();
          setHighlighted(last);
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (open) choose(highlighted);
        else openList();
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
        }
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={root} className="relative">
      <button
        id={buttonId}
        type="button"
        role="combobox"
        aria-label={label}
        aria-invalid={invalid ? 'true' : undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-option-${highlighted}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={
          'flex items-center gap-2 bg-raised transition focus-visible:outline-none ' +
          'focus-visible:shadow-[inset_0_0_0_2px_var(--color-accent)] ' +
          (field
            ? 'mt-1 h-10 w-full justify-between rounded px-3 text-left text-base sm:h-9 sm:text-sm '
            : 'h-9 rounded-full pr-3 pl-4 text-sm ') +
          (invalid
            ? 'text-ink shadow-[inset_0_0_0_1px_var(--color-danger)]'
            : chosen
              ? 'font-bold text-accent shadow-[inset_0_0_0_1px_var(--color-accent)]'
              : 'text-ink shadow-[inset_0_0_0_1px_var(--color-edge)] hover:bg-edge')
        }
      >
        <span className={`flex min-w-0 items-center gap-2 ${selectedIndex < 0 ? 'text-muted' : ''}`}>
          {selectedIndex >= 0 && options[selectedIndex]!.icon && (
            <span aria-hidden="true" className="flex shrink-0 items-center">
              {options[selectedIndex]!.icon}
            </span>
          )}
          <span className="truncate">{selectedIndex >= 0 ? options[selectedIndex]!.label : placeholder}</span>
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${chosen ? '' : 'text-muted'}`}
        />
      </button>

      {open &&
        createPortal(
        <ul
          ref={list}
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          style={{
            position: 'fixed',
            top: place?.top ?? 0,
            left: place?.left ?? 0,
            minWidth: place?.width,
            maxHeight: place?.maxHeight ?? MAX_LIST_HEIGHT,
            visibility: place ? 'visible' : 'hidden',
          }}
          className="z-[60] overflow-auto rounded-lg bg-surface p-1 shadow-pop ring-1 ring-line"
        >
          {options.map((option, index) => {
            const selected = index === selectedIndex;
            return (
              <li
                key={option.value}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setHighlighted(index)}
                onClick={() => choose(index)}
                className={
                  'flex cursor-pointer items-center justify-between gap-6 rounded-md px-3 py-2 text-sm whitespace-nowrap ' +
                  (index === highlighted ? 'bg-raised ' : '') +
                  (selected ? 'font-bold text-accent' : 'text-ink')
                }
              >
                <span className="flex items-center gap-2">
                  {option.icon && (
                    <span aria-hidden="true" className="flex shrink-0 items-center">
                      {option.icon}
                    </span>
                  )}
                  {option.label}
                </span>
                {selected && <Check size={16} aria-hidden="true" />}
              </li>
            );
          })}
        </ul>,
        document.body,
      )}
    </div>
  );
}
