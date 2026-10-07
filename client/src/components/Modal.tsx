import { type ReactNode, useEffect, useId } from 'react';

type ModalProps = { title: string; onClose: () => void; children: ReactNode };

/** A simple dialog: closes with Escape or a click on the dark backdrop. */
export default function Modal({ title, onClose, children }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-ink/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-full w-full max-w-md overflow-y-auto rounded-lg bg-surface p-6 shadow-lg"
      >
        <h2 id={titleId} className="text-base font-semibold">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
