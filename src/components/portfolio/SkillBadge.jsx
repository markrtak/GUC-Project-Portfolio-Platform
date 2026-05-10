/**
 * SkillBadge.jsx — Individual skill tag pill
 *
 * PURPOSE:
 *   A styled pill that displays a single skill name on a user's profile or
 *   portfolio card. Optionally shows a remove button in editable mode
 *   (used in the profile editor).
 *
 * PROPS:
 *   skill      — string; the skill name to display.
 *   onRemove   — optional function(); if provided, renders an × button to
 *                remove this skill (used in profile editing forms).
 *   size       — 'sm' | 'md'.
 *   highlight  — boolean; applies a brighter variant for skills that match
 *                a search query.
 *
 * REACT CONCEPTS USED:
 *   Purely presentational — no state or effects.
 *   Conditional rendering — `onRemove` prop controls whether the × button
 *                           appears, making this component dual-purpose.
 */

import { X } from 'lucide-react';

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-3 py-1   text-xs',
};

export default function SkillBadge({ skill, onRemove, size = 'md', highlight = false }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 font-medium rounded-full border transition-colors',
        highlight
          ? 'bg-brand-500/25 text-brand-200 border-brand-400/50'
          : 'bg-surface-700 text-slate-300 border-surface-600 hover:border-surface-500',
        sizeClasses[size],
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {skill}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 text-slate-500 hover:text-red-400 transition-colors rounded-full"
          aria-label={`Remove ${skill}`}
        >
          <X size={11} />
        </button>
      )}
    </span>
  );
}
