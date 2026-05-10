/**
 * Button.jsx — Reusable button atom
 *
 * PURPOSE:
 *   Provides a single, consistent button component for every interactive
 *   call-to-action in the app. Centralising button styles here means a single
 *   edit updates the look everywhere.
 *
 * PROPS:
 *   variant   — 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success'
 *   size      — 'sm' | 'md' | 'lg'
 *   loading   — boolean; when true, shows a spinner and disables the button.
 *   disabled  — boolean; standard HTML disabled.
 *   fullWidth — boolean; makes the button stretch to its container's width.
 *   leftIcon  — React node rendered before the label.
 *   rightIcon — React node rendered after the label.
 *   children  — The button label content.
 *   ...props  — All other standard <button> attributes (onClick, type, etc.).
 *
 * REACT CONCEPTS USED:
 *   Spread operator (`...props`) — forwards any additional HTML button
 *   attributes (e.g. type="submit") without having to explicitly list them.
 *
 *   Conditional class composition — variant and size strings are mapped to
 *   Tailwind classes via a lookup object, keeping the JSX clean.
 */

/**
 * Variant → Tailwind utility class map.
 *
 * Primary CTAs use the engineering yellow (#FFCC00) with charcoal text
 * (#121212) — the canonical high-contrast combination shown in the German
 * Engineering palette swatches. Other variants keep their semantic colours.
 */
const variantClasses = {
  primary:   'bg-brand-500 hover:bg-brand-400 text-surface-900 shadow-sm font-semibold',
  secondary: 'bg-surface-700 hover:bg-surface-600 text-slate-100 border border-surface-600',
  danger:    'bg-accent-500 hover:bg-accent-400 text-white',
  success:   'bg-emerald-600 hover:bg-emerald-500 text-white',
  ghost:     'bg-transparent hover:bg-surface-700 text-slate-200',
  outline:   'bg-transparent border border-brand-500 text-brand-400 hover:bg-brand-500/10',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-lg gap-2',
  lg: 'px-6 py-3   text-base rounded-xl gap-2.5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-medium transition-all duration-200',
        'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900',
        variantClasses[variant] ?? variantClasses.primary,
        sizeClasses[size] ?? sizeClasses.md,
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.97]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading ? (
        /* Spinner shown during loading state */
        <svg
          className="animate-spin h-4 w-4 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}
