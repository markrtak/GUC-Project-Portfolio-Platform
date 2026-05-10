/**
 * useProjects.js — Custom hook for project data fetching and filtering
 *
 * PURPOSE:
 *   Encapsulates all project-related data logic: fetching, filtering, searching,
 *   and sorting. Pages like ExploreProjects simply call this hook and receive
 *   ready-to-render data, keeping the page components lean.
 *
 * REACT CONCEPTS USED:
 *   useState()    — Holds loading, error, the full list of projects, and the
 *                   current filter/search criteria applied to them.
 *
 *   useEffect()   — Triggers a re-fetch whenever the filter options change.
 *                   The dependency array `[filters]` ensures the effect only
 *                   runs when filters are updated, not on every render.
 *
 *   useMemo()     — Derives the filtered/sorted `displayedProjects` array from
 *                   the full list and current filters WITHOUT re-running the
 *                   derivation on every render. It only recalculates when
 *                   `allProjects` or `filters` change.
 *
 *   useCallback() — Memoises the `setFilters` wrapper so parent components can
 *                   pass it to children without triggering infinite re-renders.
 *
 * FILTER LOGIC:
 *   Filters are applied client-side (in-memory) after the async fetch returns.
 *   This mirrors what a real API with query parameters would do, but is done
 *   entirely in the browser for the mock.
 *
 * USAGE:
 *   const { projects, loading, error, filters, updateFilters } = useProjects();
 *   const { projects } = useProjects({ type: 'bachelor' }); // pre-seeded filter
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDataContext } from '@/context/DataContext';

const DEFAULT_FILTERS = {
  search:       '',
  type:         'all',  // 'all' | 'bachelor' | 'course'
  status:       'all',  // 'all' | 'in-progress' | 'completed' | 'pending-review'
  courseId:     'all',
  supervisorId: 'all',  // faculty req 18 — filter by course instructor
  dateFrom:     '',     // YYYY-MM-DD lower bound on createdAt
  dateTo:       '',     // YYYY-MM-DD upper bound on createdAt
  tag:          '',
  sortBy:       'newest', // 'newest' | 'oldest' | 'popular' | 'views' | 'rating' | 'title-asc' | 'title-desc'
};

/**
 * @param {Partial<typeof DEFAULT_FILTERS>} initialFilters
 */
export function useProjects(initialFilters = {}) {
  const { fetchProjects } = useDataContext();

  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [filters, setFiltersState]    = useState({ ...DEFAULT_FILTERS, ...initialFilters });

  // ── Fetch all projects once on mount ──────────────────────────────────
  useEffect(() => {
    let cancelled = false; // cleanup flag to avoid state updates on unmounted components

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchProjects();
        if (!cancelled) setAllProjects(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [fetchProjects]);

  // ── Derive filtered + sorted list via useMemo ─────────────────────────
  const displayedProjects = useMemo(() => {
    let result = [...allProjects];

    // Text search — checks title, description, and tags
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Type filter
    if (filters.type !== 'all') {
      result = result.filter((p) => p.type === filters.type);
    }

    // Status filter
    if (filters.status !== 'all') {
      result = result.filter((p) => p.status === filters.status);
    }

    // Course filter
    if (filters.courseId !== 'all') {
      result = result.filter((p) => p.courseId === filters.courseId);
    }

    // Supervisor (course instructor) filter — req 18
    if (filters.supervisorId && filters.supervisorId !== 'all') {
      result = result.filter((p) => p.supervisorId === filters.supervisorId);
    }

    // Creation-date range — req 18
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom).getTime();
      result = result.filter((p) => new Date(p.createdAt).getTime() >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo).getTime() + 24 * 60 * 60 * 1000 - 1; // inclusive end-of-day
      result = result.filter((p) => new Date(p.createdAt).getTime() <= to);
    }

    // Tag filter
    if (filters.tag.trim()) {
      const tagQ = filters.tag.toLowerCase();
      result = result.filter((p) =>
        p.tags.some((t) => t.toLowerCase().includes(tagQ))
      );
    }

    // Sort
    if (filters.sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (filters.sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (filters.sortBy === 'popular') {
      result.sort((a, b) => b.likes - a.likes);
    } else if (filters.sortBy === 'views') {
      result.sort((a, b) => b.views - a.views);
    } else if (filters.sortBy === 'rating') {
      // req 20 — sort by rating (descending; ties broken by likes)
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.likes - a.likes));
    } else if (filters.sortBy === 'title-asc') {
      result.sort((a, b) => (a.title || '').localeCompare((b.title || ''), undefined, { sensitivity: 'base', numeric: true }));
    } else if (filters.sortBy === 'title-desc') {
      result.sort((a, b) => (b.title || '').localeCompare((a.title || ''), undefined, { sensitivity: 'base', numeric: true }));
    }

    return result;
  }, [allProjects, filters]);

  // ── Update filters (merges partial updates) ───────────────────────────
  const updateFilters = useCallback((updates) => {
    setFiltersState((prev) => {
      const next = { ...prev, ...updates };
      const unchanged = Object.keys(next).every((k) => prev[k] === next[k]);
      return unchanged ? prev : next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({ ...DEFAULT_FILTERS, ...initialFilters });
  }, [initialFilters]);

  return {
    projects: displayedProjects,
    allProjects,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    totalCount: allProjects.length,
    filteredCount: displayedProjects.length,
  };
}
