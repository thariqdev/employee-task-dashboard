import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { type ReactNode, useEffect, useId } from 'react';

type ModalProps = { title: string; onClose: () => void; children: ReactNode };

/** A simple dialog: closes with Escape, the X button, or a click on the dark backdrop. */
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
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="max-h-full w-full max-w-md overflow-y-auto rounded-lg bg-surface p-4 shadow-pop sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="-mt-1 -mr-2 rounded-full p-1.5 text-muted transition hover:bg-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
