/**
 * ExploreProjects.jsx — Project discovery / feed page
 *
 * PURPOSE:
 *   The main exploration page where all users can browse, search, and filter
 *   the full project catalogue. This is a key MS2 grading page — it must
 *   demonstrate working filters, empty states, and skeleton loading.
 *
 * REACT CONCEPTS USED:
 *   useProjects()    — Custom hook that provides the filtered project list,
 *                      loading state, and the `updateFilters` function.
 *
 *   useSearchParams() — react-router-dom hook that reads and writes URL
 *                       query parameters. This allows the search query from
 *                       the Navbar to pre-populate the search field when the
 *                       user lands here from a search.
 *
 *   useEffect()       — Syncs the `?q=` URL parameter into the hook's
 *                       filter state when the page mounts.
 *
 *   useState()        — Tracks the list of all users (for ProjectCard avatars)
 *                       and the list of courses (for the course filter dropdown).
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import PageWrapper  from '@/components/layout/PageWrapper';
import Breadcrumbs  from '@/components/layout/Breadcrumbs';
import ProjectCard  from '@/components/project/ProjectCard';
import SkeletonCard from '@/components/common/SkeletonCard';
import Button       from '@/components/common/Button';
import Input        from '@/components/common/Input';
import { useProjects }    from '@/hooks/useProjects';
import { useDataContext }  from '@/context/DataContext';
import { useAuth }         from '@/hooks/useAuth';

const PAGE_SIZE = 12;

/** Read explore filters from URL (shareable / reversible without browser back). */
function filtersFromSearchParams(sp) {
  return {
    search: sp.get('q') || '',
    type: sp.get('type') || 'all',
    status: sp.get('status') || 'all',
    courseId: sp.get('course') || 'all',
    supervisorId: sp.get('sup') || 'all',
    sortBy: sp.get('sort') || 'newest',
    dateFrom: sp.get('from') || '',
    dateTo: sp.get('to') || '',
    tag: sp.get('tag') || '',
  };
}

function searchParamsFromFilters(f) {
  const p = new URLSearchParams();
  if (f.search?.trim()) p.set('q', f.search.trim());
  if (f.type && f.type !== 'all') p.set('type', f.type);
  if (f.status && f.status !== 'all') p.set('status', f.status);
  if (f.courseId && f.courseId !== 'all') p.set('course', f.courseId);
  if (f.supervisorId && f.supervisorId !== 'all') p.set('sup', f.supervisorId);
  if (f.sortBy && f.sortBy !== 'newest') p.set('sort', f.sortBy);
  if (f.dateFrom) p.set('from', f.dateFrom);
  if (f.dateTo) p.set('to', f.dateTo);
  if (f.tag?.trim()) p.set('tag', f.tag.trim());
  return p;
}

export default function ExploreProjects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { fetchUsers, fetchCourses, toggleLike, toggleFavoriteProject } = useDataContext();
  const { currentUser, updateProfile } = useAuth();
  const {
    projects, loading, error, filters, updateFilters, resetFilters, filteredCount, totalCount,
  } = useProjects();

  const [users, setUsers]     = useState([]);
  const [courses, setCourses] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [page, setPage] = useState(1);

  const skipNextUrlWrite = useRef(false);
  const urlKey = searchParams.toString();
  const filtersHydrated = useRef(false);

  // Apply URL → filters when URL changes (deep link, navbar search, browser forward/back).
  useEffect(() => {
    const fromUrl = filtersFromSearchParams(searchParams);
    skipNextUrlWrite.current = true;
    updateFilters(fromUrl);
    filtersHydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync full URL snapshot into hook
  }, [urlKey]);

  // Filters → URL (replaceState to avoid history spam while typing).
  useEffect(() => {
    if (skipNextUrlWrite.current) {
      skipNextUrlWrite.current = false;
      return;
    }
    setSearchParams((prev) => {
      const next = searchParamsFromFilters(filters);
      return prev.toString() === next.toString() ? prev : next;
    }, { replace: true });
  }, [filters, setSearchParams]);

  // New filter criteria → back to first results page (client pagination).
  useEffect(() => {
    if (!filtersHydrated.current) return;
    setPage(1);
  }, [
    filters.search, filters.type, filters.status, filters.courseId, filters.supervisorId,
    filters.sortBy, filters.dateFrom, filters.dateTo, filters.tag,
  ]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchUsers(), fetchCourses()]).then(([u, c]) => {
      if (!cancelled) { setUsers(u); setCourses(c); }
    });
    return () => { cancelled = true; };
  }, [fetchUsers, fetchCourses]);

  const instructors = useMemo(
    () => users.filter((u) => u.role === 'faculty'),
    [users]
  );

  const hasActiveFilters =
    filters.search || filters.type !== 'all' || filters.status !== 'all' ||
    filters.courseId !== 'all' || (filters.supervisorId && filters.supervisorId !== 'all') ||
    filters.dateFrom || filters.dateTo || (filters.tag && filters.tag.trim());

  const clearAll = () => {
    resetFilters();
    setPage(1);
  };

  const visibleProjects = useMemo(
    () => projects.filter((p) => p.visibility !== 'private' && p.isActive !== false),
    [projects]
  );
  const totalVisible = visibleProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalVisible / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedProjects = useMemo(
    () => visibleProjects.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [visibleProjects, safePage]
  );

  const courseLabel = (id) => courses.find((c) => c.id === id)?.code || id;
  const instructorLabel = (id) => (instructors.find((u) => u.id === id)?.name || '').replace(/^Dr\.?\s*/, '') || id;

  const filterChips = useMemo(() => {
    const chips = [];
    if (filters.search?.trim()) chips.push({ key: 'search', label: `Search: “${filters.search.trim()}”`, clear: () => updateFilters({ search: '' }) });
    if (filters.type !== 'all') chips.push({ key: 'type', label: filters.type === 'bachelor' ? 'Type: Bachelor thesis' : 'Type: Course project', clear: () => updateFilters({ type: 'all' }) });
    if (filters.status !== 'all') chips.push({ key: 'status', label: `Status: ${filters.status}`, clear: () => updateFilters({ status: 'all' }) });
    if (filters.courseId !== 'all') chips.push({ key: 'course', label: `Course: ${courseLabel(filters.courseId)}`, clear: () => updateFilters({ courseId: 'all' }) });
    if (filters.supervisorId && filters.supervisorId !== 'all') chips.push({ key: 'sup', label: `Instructor: ${instructorLabel(filters.supervisorId)}`, clear: () => updateFilters({ supervisorId: 'all' }) });
    if (filters.sortBy !== 'newest') chips.push({ key: 'sort', label: `Sort: ${filters.sortBy}`, clear: () => updateFilters({ sortBy: 'newest' }) });
    if (filters.dateFrom) chips.push({ key: 'from', label: `From: ${filters.dateFrom}`, clear: () => updateFilters({ dateFrom: '' }) });
    if (filters.dateTo) chips.push({ key: 'to', label: `Until: ${filters.dateTo}`, clear: () => updateFilters({ dateTo: '' }) });
    if (filters.tag?.trim()) chips.push({ key: 'tag', label: `Tag: ${filters.tag.trim()}`, clear: () => updateFilters({ tag: '' }) });
    return chips;
  }, [filters, courses, instructors, updateFilters]);

  const rangeStart = totalVisible === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, totalVisible);

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6">
        <Breadcrumbs crumbs={[{ label: 'Explore Projects' }]} />

        {error && (
          <div className="card p-4 border-red-500/30 bg-red-500/10 text-sm text-red-200" role="alert">
            <p className="font-medium">Something went wrong loading projects.</p>
            <p className="text-red-300/90 mt-1">{error}</p>
            <p className="text-xs text-slate-400 mt-2">Try refreshing the page. If the problem continues, sign out and sign in again.</p>
          </div>
        )}

        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Explore Projects</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {loading
                ? 'Loading…'
                : totalVisible === 0
                  ? `${filteredCount} of ${totalCount} match filters (none public to show here)`
                  : `Showing ${rangeStart}–${rangeEnd} of ${totalVisible} public projects (${filteredCount} of ${totalCount} match filters)`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg border transition-colors ${viewMode === 'grid' ? 'bg-brand-600/20 border-brand-500/40 text-brand-300' : 'bg-surface-800 border-surface-700 text-slate-400 hover:text-slate-200'}`}
            ><LayoutGrid size={16} /></button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg border transition-colors ${viewMode === 'list' ? 'bg-brand-600/20 border-brand-500/40 text-brand-300' : 'bg-surface-800 border-surface-700 text-slate-400 hover:text-slate-200'}`}
            ><List size={16} /></button>
          </div>
        </div>

        {/* ── Filter toolbar ───────────────────────────────────────── */}
        <div className="card p-4 flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="search"
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              placeholder="Search by title, tag, description…"
              className="input-base pl-9 py-2 text-sm"
            />
          </div>

          {/* Type */}
          <select
            value={filters.type}
            onChange={(e) => updateFilters({ type: e.target.value })}
            className="input-base w-auto text-sm py-2"
          >
            <option value="all">All Types</option>
            <option value="bachelor">Bachelor Thesis</option>
            <option value="course">Course Project</option>
          </select>

          {/* Status */}
          <select
            value={filters.status}
            onChange={(e) => updateFilters({ status: e.target.value })}
            className="input-base w-auto text-sm py-2"
          >
            <option value="all">All Statuses</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="pending-review">Pending Review</option>
          </select>

          {/* Course */}
          <select
            value={filters.courseId}
            onChange={(e) => updateFilters({ courseId: e.target.value })}
            className="input-base w-auto text-sm py-2"
            title="Filter by course"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.code}</option>
            ))}
          </select>

          {/* Course instructor / supervisor — req 18 */}
          <select
            value={filters.supervisorId || 'all'}
            onChange={(e) => updateFilters({ supervisorId: e.target.value })}
            className="input-base w-auto text-sm py-2"
            title="Filter by course instructor"
          >
            <option value="all">All Instructors</option>
            {instructors.map((u) => (
              <option key={u.id} value={u.id}>{(u.name || '').replace(/^Dr\.?\s*/, '')}</option>
            ))}
          </select>

          {/* Sort — req 20 (rating + creation date) */}
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilters({ sortBy: e.target.value })}
            className="input-base w-auto text-sm py-2"
            title="Sort projects"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title-asc">Title (A → Z)</option>
            <option value="title-desc">Title (Z → A)</option>
            <option value="rating">Highest Rated</option>
            <option value="popular">Most Liked</option>
            <option value="views">Most Viewed</option>
          </select>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<X size={13} />}
              onClick={clearAll}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Date-range filter — req 18 */}
        <div className="card p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <Input
            label="Created from"
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => updateFilters({ dateFrom: e.target.value })}
          />
          <Input
            label="Created until"
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => updateFilters({ dateTo: e.target.value })}
          />
          <p className="text-xs text-slate-500 leading-relaxed">
            Restrict results to projects whose creation date falls within the chosen range.
            Leave both empty to disable the date filter.
          </p>
        </div>

        {filterChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active filters</span>
            {filterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.clear}
                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium bg-brand-500/15 text-brand-200 border border-brand-500/25 hover:bg-brand-500/25 transition-colors"
              >
                {chip.label}
                <X size={12} className="opacity-70" aria-hidden />
              </button>
            ))}
          </div>
        )}

        {/* ── Project grid / list ───────────────────────────────── */}
        {loading ? (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'
            : 'grid grid-cols-1 gap-4'}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : totalVisible === 0 ? (
          /* Empty state */
          <div className="card p-16 text-center">
            <SlidersHorizontal size={36} className="mx-auto text-slate-600 mb-3" />
            <h3 className="text-lg font-semibold text-slate-300 mb-1">No projects found</h3>
            <p className="text-sm text-slate-500 mb-5">
              No projects match your current filters. Try adjusting your search or clearing the filters.
            </p>
            <Button
              variant="secondary"
              leftIcon={<X size={14} />}
              onClick={clearAll}
            >
              Clear all filters
            </Button>
          </div>
        ) : (
          <>
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'
              : 'grid grid-cols-1 gap-4'}>
              {pagedProjects.map((project) => {
                const isFav = (currentUser?.savedProjects || []).includes(project.id);
                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    users={users}
                    onLike={toggleLike}
                    isFavorited={isFav}
                    onToggleFavorite={async () => {
                      await toggleFavoriteProject(currentUser.id, project.id);
                      const next = isFav
                        ? (currentUser.savedProjects || []).filter((x) => x !== project.id)
                        : [...(currentUser.savedProjects || []), project.id];
                      updateProfile({ savedProjects: next });
                    }}
                  />
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={safePage <= 1}
                  leftIcon={<ChevronLeft size={14} />}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-400 px-2">
                  Page {safePage} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={safePage >= totalPages}
                  rightIcon={<ChevronRight size={14} />}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
}
