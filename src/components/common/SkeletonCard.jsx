/**
 * SkeletonCard.jsx — Animated placeholder for content loading states
 *
 * PURPOSE:
 *   Renders a shimmering placeholder that mirrors the shape of a ProjectCard
 *   while real data is being fetched. This is far superior to a blank screen
 *   or a spinner because the user can see the page layout instantly and
 *   understands that content is coming.
 *
 *   The `animate-pulse-slow` Tailwind animation repeatedly fades the
 *   placeholder in and out, giving the "shimmer" effect.
 *
 * EXPORTS:
 *   SkeletonCard      — Mimics the ProjectCard layout.
 *   SkeletonPortfolio — Mimics the PortfolioCard layout.
 *   SkeletonText      — Generic inline text placeholder.
 *
 * REACT CONCEPTS USED:
 *   Multiple named exports from a single file, keeping related skeleton
 *   variants together without creating many small files.
 */

/** Base shimmer block */
function Shimmer({ className = '' }) {
  return (
    <div className={`bg-surface-700 animate-pulse-slow rounded ${className}`} />
  );
}

/** Project card skeleton */
export default function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      {/* Thumbnail placeholder */}
      <Shimmer className="h-44 w-full rounded-none" />
      <div className="p-4 space-y-3">
        {/* Title */}
        <Shimmer className="h-5 w-3/4" />
        {/* Description lines */}
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-5/6" />
        {/* Tags row */}
        <div className="flex gap-2 pt-1">
          <Shimmer className="h-5 w-16 rounded-full" />
          <Shimmer className="h-5 w-12 rounded-full" />
          <Shimmer className="h-5 w-20 rounded-full" />
        </div>
        {/* Footer row */}
        <div className="flex items-center justify-between pt-2 border-t border-surface-700">
          <div className="flex items-center gap-2">
            <Shimmer className="h-7 w-7 rounded-full" />
            <Shimmer className="h-3 w-20" />
          </div>
          <Shimmer className="h-3 w-14" />
        </div>
      </div>
    </div>
  );
}

/** Portfolio card skeleton */
export function SkeletonPortfolio() {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start gap-4">
        <Shimmer className="h-14 w-14 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-4 w-1/2" />
          <Shimmer className="h-3 w-2/3" />
          <Shimmer className="h-5 w-16 rounded-full" />
        </div>
      </div>
      <Shimmer className="h-3 w-full" />
      <Shimmer className="h-3 w-4/5" />
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3].map((i) => (
          <Shimmer key={i} className="h-5 w-14 rounded-full" />
        ))}
      </div>
    </div>
  );
}

/** Generic single-line text placeholder */
export function SkeletonText({ width = 'w-full', height = 'h-4' }) {
  return <Shimmer className={`${width} ${height}`} />;
}
