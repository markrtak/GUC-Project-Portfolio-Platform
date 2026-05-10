/**
 * Badge.jsx — Inline status / tag label atom
 *
 * PURPOSE:
 *   Small pill-shaped labels used for project types, statuses, skill tags,
 *   and user roles. Keeps the visual language consistent.
 *
 * PROPS:
 *   variant   — 'default' | 'blue' | 'violet' | 'green' | 'amber' | 'red'
 *   size      — 'sm' | 'md'
 *   dot       — boolean; shows a coloured dot before the text.
 *   children  — The badge text content.
 *   className — Additional Tailwind classes for one-off overrides.
 *
 * REACT CONCEPTS USED:
 *   Purely presentational component — no state or effects. Renders the
 *   correct colour variant based on props using a lookup object.
 */

const variantClasses = {
  default: 'bg-surface-700 text-slate-300 border-surface-600',
  blue:    'bg-brand-500/15 text-brand-300 border-brand-500/30',
  violet:  'bg-accent-500/15 text-accent-400 border-accent-500/30',
  green:   'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  amber:   'bg-amber-500/15 text-amber-300 border-amber-500/30',
  red:     'bg-red-500/15 text-red-300 border-red-500/30',
};

const dotClasses = {
  default: 'bg-slate-400',
  blue:    'bg-brand-400',
  violet:  'bg-accent-400',
  green:   'bg-emerald-400',
  amber:   'bg-amber-400',
  red:     'bg-red-400',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export default function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  className = '',
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        variantClasses[variant] ?? variantClasses.default,
        sizeClasses[size] ?? sizeClasses.md,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClasses[variant] ?? dotClasses.default}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
