/**
 * FavoriteButton.jsx — Bookmark / save toggle button
 *
 * PURPOSE:
 *   Renders the "save to favorites" star/bookmark used on project and
 *   portfolio cards (req 65). Clicking it toggles the user's saved list
 *   in DataContext and updates instantly via optimistic state.
 *
 * PROPS:
 *   isFavorited — boolean; whether the item is already in the user's list.
 *   onToggle    — async callback(); should call DataContext to flip the state.
 *   size        — 'sm' | 'md' — controls the icon size.
 *   variant     — 'icon' | 'pill' — pill shows a coloured background label.
 *   label       — text shown when variant='pill'
 *
 * REACT CONCEPTS USED:
 *   useState() — Local optimistic state mirrors the prop so the button feels
 *                instantly responsive while the async toggle is pending.
 *   useEffect() — Keeps local state in sync if the parent prop changes
 *                 (e.g. after a refetch).
 */

import { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';

const sizeMap = { sm: 14, md: 16 };

export default function FavoriteButton({
  isFavorited = false,
  onToggle,
  size = 'md',
  variant = 'icon',
  label = 'Save',
}) {
  const [saved, setSaved] = useState(isFavorited);

  useEffect(() => setSaved(isFavorited), [isFavorited]);

  const handleClick = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    setSaved((s) => !s);
    try { await onToggle?.(); } catch { setSaved(saved); }
  };

  if (variant === 'pill') {
    return (
      <button
        onClick={handleClick}
        className={[
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors',
          saved
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
            : 'bg-surface-700 border-surface-600 text-slate-400 hover:border-amber-500/30 hover:text-amber-300',
        ].join(' ')}
      >
        {saved ? <BookmarkCheck size={sizeMap[size]} /> : <Bookmark size={sizeMap[size]} />}
        {saved ? 'Saved' : label}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={[
        'p-1.5 rounded-lg transition-colors',
        saved ? 'text-amber-400 hover:bg-amber-500/10' : 'text-slate-500 hover:text-amber-400 hover:bg-surface-700',
      ].join(' ')}
      title={saved ? 'Remove from favorites' : 'Save to favorites'}
      aria-pressed={saved}
    >
      {saved ? (
        <BookmarkCheck size={sizeMap[size]} fill="currentColor" />
      ) : (
        <Bookmark size={sizeMap[size]} />
      )}
    </button>
  );
}
