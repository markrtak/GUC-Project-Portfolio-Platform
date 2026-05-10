/**
 * ProjectRating.jsx — 5-star rating control for the entire project
 *
 * COVERS:
 *   Faculty req 16 — "Rate the entire project."
 *
 * BEHAVIOUR:
 *   - Read-only by default; shows the project's average rating, the number of
 *     ratings, and the user's own rating if they've already rated.
 *   - Faculty (or any user we choose to allow) can click a star to submit /
 *     update their own rating; the average and count are recalculated by
 *     `rateProject` in DataContext.
 *
 * PROPS:
 *   project  — full project object (uses .ratings + .rating)
 *   canRate  — boolean; controls whether the stars are interactive
 *   onRate   — async (value) => void; called when the user clicks a star
 *   compact  — boolean; renders a smaller inline variant (used in cards)
 *
 * REACT CONCEPTS USED:
 *   useState() — Hover state (for the visual hover-fill effect) and pending
 *                state while the API call resolves.
 *   useMemo()  — Derives the user's existing rating only when project/userId change.
 */

import { useState, useMemo } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function ProjectRating({ project, canRate = false, onRate, compact = false }) {
  const { currentUser } = useAuth();
  const [hover, setHover]     = useState(0);
  const [pending, setPending] = useState(false);

  const myRating = useMemo(() => {
    if (!currentUser) return 0;
    const entry = (project.ratings || []).find((r) => r.userId === currentUser.id);
    return entry?.value || 0;
  }, [project.ratings, currentUser]);

  const avg   = project.rating || 0;
  const count = (project.ratings || []).length;

  const display = hover || myRating || Math.round(avg);

  const handleClick = async (value) => {
    if (!canRate || !onRate || pending) return;
    setPending(true);
    try {
      await onRate(value);
    } finally {
      setPending(false);
    }
  };

  const starSize = compact ? 14 : 22;

  return (
    <div className={[
      'flex items-center gap-3',
      compact ? '' : 'card p-4',
    ].join(' ')}>
      <div className={`flex ${compact ? 'gap-0.5' : 'gap-1'}`}>
        {[1, 2, 3, 4, 5].map((v) => {
          const filled = v <= display;
          return (
            <button
              key={v}
              type="button"
              disabled={!canRate || pending}
              onMouseEnter={() => canRate && setHover(v)}
              onMouseLeave={() => canRate && setHover(0)}
              onClick={() => handleClick(v)}
              aria-label={`Rate ${v} out of 5`}
              className={[
                'transition-all',
                canRate ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default',
                pending ? 'opacity-60' : '',
              ].join(' ')}
            >
              <Star
                size={starSize}
                fill={filled ? 'currentColor' : 'none'}
                className={filled ? 'text-amber-400' : 'text-slate-600'}
              />
            </button>
          );
        })}
      </div>

      {!compact && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-200">
            {avg ? avg.toFixed(1) : '—'} <span className="text-xs text-slate-500 font-normal">out of 5</span>
          </p>
          <p className="text-[11px] text-slate-500">
            {count} {count === 1 ? 'rating' : 'ratings'}
            {myRating > 0 && <> · you rated {myRating}/5</>}
          </p>
        </div>
      )}

      {!compact && canRate && (
        <p className="text-xs text-slate-500 italic">
          {myRating > 0 ? 'Click a star to update your rating' : 'Click a star to rate this project'}
        </p>
      )}

      {compact && count > 0 && (
        <span className="text-xs text-slate-400">
          {avg.toFixed(1)} <span className="text-slate-600">({count})</span>
        </span>
      )}
    </div>
  );
}
