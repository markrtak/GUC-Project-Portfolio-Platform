/**
 * formatters.js — Pure utility functions for display formatting
 *
 * PURPOSE:
 *   Keeps all string/date transformation logic in one place so that components
 *   remain clean and do not repeat ad-hoc formatting inline.
 *
 * JAVASCRIPT CONCEPTS USED:
 *   - Intl.DateTimeFormat / Intl.RelativeTimeFormat  — the built-in
 *     Internationalisation API for locale-aware date & number formatting.
 *     No external library (like date-fns) is needed.
 *   - Array.prototype.reduce  — used in `truncate` and `initials` helpers.
 *   - Template literals       — concise string interpolation.
 *   - Guard clauses           — early returns prevent crashes on null/undefined.
 */

/**
 * Formats an ISO date string into a human-readable date.
 * Example: "2025-04-28T10:30:00Z" → "Apr 28, 2025"
 * @param {string} isoString
 * @returns {string}
 */
export function formatDate(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Returns a relative time string like "3 days ago" or "just now".
 * Uses the built-in Intl.RelativeTimeFormat API.
 * @param {string} isoString
 * @returns {string}
 */
export function timeAgo(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffSeconds = Math.round((date - now) / 1000);

  const thresholds = [
    { unit: 'year',   seconds: 31536000 },
    { unit: 'month',  seconds: 2592000  },
    { unit: 'week',   seconds: 604800   },
    { unit: 'day',    seconds: 86400    },
    { unit: 'hour',   seconds: 3600     },
    { unit: 'minute', seconds: 60       },
    { unit: 'second', seconds: 1        },
  ];

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  for (const { unit, seconds } of thresholds) {
    const value = Math.round(diffSeconds / seconds);
    if (Math.abs(value) >= 1 || unit === 'second') {
      return rtf.format(value, unit);
    }
  }
  return 'just now';
}

/**
 * Truncates a string to `maxLength` characters, appending "…" if cut.
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(str, maxLength = 120) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + '…';
}

/**
 * Returns the initials of a full name (up to 2 characters).
 * Example: "Youssef El-Masry" → "YE"
 * @param {string} name
 * @returns {string}
 */
export function getInitials(name) {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * Maps a project status string to a display-friendly label and colour class.
 * @param {'in-progress'|'completed'|'pending-review'} status
 * @returns {{ label: string, className: string }}
 */
export function getStatusMeta(status) {
  const map = {
    'in-progress':    { label: 'In Progress',    className: 'bg-brand-500/20 text-brand-300 border-brand-500/40'  },
    'completed':      { label: 'Completed',      className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    'pending-review': { label: 'Pending Review', className: 'bg-amber-500/20 text-amber-300 border-amber-500/40'  },
  };
  return map[status] ?? { label: status, className: 'bg-surface-700 text-slate-400' };
}

/**
 * Maps a user role to a badge label and colour.
 * @param {'student'|'faculty'|'recruiter'} role
 * @returns {{ label: string, className: string }}
 */
export function getRoleMeta(role) {
  const map = {
    student:   { label: 'Student',   className: 'bg-brand-500/20 text-brand-300'   },
    faculty:   { label: 'Faculty',   className: 'bg-accent-500/20 text-accent-400' },
    recruiter: { label: 'Recruiter', className: 'bg-emerald-500/20 text-emerald-300' },
  };
  return map[role] ?? { label: role, className: 'bg-surface-700 text-slate-400' };
}

/**
 * Capitalises the first letter of each word in a string.
 * Example: "computer science" → "Computer Science"
 * @param {string} str
 * @returns {string}
 */
export function titleCase(str) {
  if (!str) return '';
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}
