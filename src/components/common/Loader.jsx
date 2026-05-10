/**
 * Loader.jsx — Full-page and inline loading spinner
 *
 * PURPOSE:
 *   Provides two loading indicators:
 *     1. <Loader />            — a centred full-viewport spinner (used while
 *        the app is initialising or a whole page is loading).
 *     2. <InlineLoader />      — a small inline spinner for button states.
 *
 * REACT CONCEPTS USED:
 *   Named exports — both components are exported from the same file.
 *   SVG animation — `animate-spin` applies a CSS `transform: rotate(360deg)`
 *                   animation defined in Tailwind's keyframes.
 *
 * PROPS (Loader):
 *   message — optional string shown below the spinner.
 *   size    — 'sm' | 'md' | 'lg' controls the spinner diameter.
 */

const spinnerSizes = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
};

export default function Loader({ message = '', size = 'md' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative">
        {/* Outer decorative ring */}
        <div className={`${spinnerSizes[size]} rounded-full border-2 border-surface-700`} />
        {/* Spinning arc */}
        <svg
          className={`${spinnerSizes[size]} animate-spin absolute inset-0`}
          viewBox="0 0 40 40"
          fill="none"
          aria-label="Loading"
        >
          <circle
            cx="20"
            cy="20"
            r="18"
            stroke="url(#spinner-gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="30 80"
          />
          <defs>
            <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#ffcc00" />
              <stop offset="100%" stopColor="#da291c" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {message && <p className="text-sm text-slate-400 animate-pulse">{message}</p>}
    </div>
  );
}

/** Tiny inline spinner for use inside buttons or small spaces */
export function InlineLoader({ className = '' }) {
  return (
    <svg
      className={`animate-spin h-4 w-4 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
