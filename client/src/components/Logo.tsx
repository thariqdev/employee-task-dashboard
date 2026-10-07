/** The TaskDesk mark: a rounded accent tile with a 2x2 grid of squares, one of them checked. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill="#6366F1" />
      {/* The grid: three plain squares and one that holds the check. */}
      <rect x="6.5" y="6.5" width="8" height="8" rx="2.2" fill="white" fillOpacity="0.45" />
      <rect x="17.5" y="6.5" width="8" height="8" rx="2.2" fill="white" fillOpacity="0.45" />
      <rect x="6.5" y="17.5" width="8" height="8" rx="2.2" fill="white" fillOpacity="0.45" />
      <rect x="17.5" y="17.5" width="8" height="8" rx="2.2" fill="white" />
      <path
        d="M19.8 21.7l1.7 1.7 3-3.3"
        stroke="#6366F1"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The mark followed by the "TaskDesk" wordmark, with "Desk" in the accent color. */
export function Wordmark({ size = 32 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="text-lg font-extrabold tracking-tight">
        Task<span className="text-accent">Desk</span>
      </span>
    </span>
  );
}
