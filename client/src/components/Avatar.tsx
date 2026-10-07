/** "Asha Rao" -> "AR", "madonna" -> "M", "  " -> "?" */
export function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0]!.charAt(0);
  const last = words.length > 1 ? words[words.length - 1]!.charAt(0) : '';
  return (first + last).toUpperCase();
}

/** A round badge with a person's initials. Decorative: the name is always written next to it. */
export default function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-accent-tint text-xs font-bold text-accent"
    >
      {initialsOf(name)}
    </span>
  );
}
