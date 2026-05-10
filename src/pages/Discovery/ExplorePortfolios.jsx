/**
 * ExplorePortfolios.jsx — Student portfolio discovery page
 *
 * PURPOSE:
 *   Allows recruiters and faculty to search and filter the catalogue of
 *   student profiles. Each PortfolioCard links to the student's full profile.
 *   This page directly addresses the MS2 recruiter use-case requirement.
 *
 * REACT CONCEPTS USED:
 *   useState()    — Manages search query, department filter, and the resolved
 *                   user + project data from DataContext.
 *
 *   useEffect()   — Fetches users and projects once on mount.
 *
 *   useMemo()     — Derives the filtered student list from the full users array
 *                   without re-running the filter on every keystroke render.
 *                   Only recalculates when `users`, `search`, or `department`
 *                   change.
 *
 *   useNavigate() — Used by PortfolioCard's "View" button to navigate to the
 *                   student's profile page (/profile/:userId).
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate }  from 'react-router-dom';
import { Search, X, Users } from 'lucide-react';
import PageWrapper        from '@/components/layout/PageWrapper';
import Breadcrumbs        from '@/components/layout/Breadcrumbs';
import PortfolioCard      from '@/components/portfolio/PortfolioCard';
import { SkeletonPortfolio } from '@/components/common/SkeletonCard';
import { useDataContext } from '@/context/DataContext';
import { useAuth }        from '@/hooks/useAuth';

const ALL_DEPARTMENTS = [
  'Computer Science & Engineering',
  'Media Engineering & Technology',
  'Engineering — Electronics',
  'Engineering — Mechatronics',
  'Management Technology',
  'Architecture',
];

export default function ExplorePortfolios() {
  const { fetchUsers, fetchProjects, toggleFavoritePortfolio } = useDataContext();
  const { currentUser, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers]       = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [department, setDept]   = useState('all');
  const [yearFilter, setYear]   = useState('all');
  const [skill, setSkill]       = useState('all');     // req 23 — filter portfolios by skill
  const [sortBy, setSortBy]     = useState('default'); // 'default' | 'projects-desc' | 'projects-asc' | 'name-asc' | 'name-desc'

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchUsers(), fetchProjects()]).then(([u, p]) => {
      if (!cancelled) { setUsers(u); setProjects(p); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [fetchUsers, fetchProjects]);

  // Only show students on this page
  const students = useMemo(() => users.filter((u) => u.role === 'student'), [users]);

  const getProjectCount = (userId) =>
    projects.filter((p) => p.teamMembers?.includes(userId)).length;

  // All distinct skills across the catalogue, sorted alphabetically — req 23
  const allSkills = useMemo(() => {
    const set = new Set();
    students.forEach((u) => (u.skills || []).forEach((s) => set.add(s)));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [students]);

  const filtered = useMemo(() => {
    let result = [...students];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||  // faculty req 22 — search by name OR email
          u.bio?.toLowerCase().includes(q) ||
          u.skills?.some((s) => s.toLowerCase().includes(q)) ||
          u.major?.toLowerCase().includes(q)
      );
    }

    if (department !== 'all') {
      result = result.filter((u) => u.department === department);
    }

    if (yearFilter !== 'all') {
      result = result.filter((u) => String(u.year) === yearFilter);
    }

    if (skill !== 'all') {
      result = result.filter((u) =>
        (u.skills || []).some((s) => s.toLowerCase() === skill.toLowerCase())
      );
    }

    // Faculty req 25 — sort by number of projects on each portfolio
    if (sortBy === 'projects-desc') {
      result.sort((a, b) => getProjectCount(b.id) - getProjectCount(a.id));
    } else if (sortBy === 'projects-asc') {
      result.sort((a, b) => getProjectCount(a.id) - getProjectCount(b.id));
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) => (a.name || '').localeCompare((b.name || ''), undefined, { sensitivity: 'base', numeric: true }));
    } else if (sortBy === 'name-desc') {
      result.sort((a, b) => (b.name || '').localeCompare((a.name || ''), undefined, { sensitivity: 'base', numeric: true }));
    }

    return result;
  }, [students, search, department, yearFilter, skill, sortBy, projects]);

  const hasFilters = search || department !== 'all' || yearFilter !== 'all' || skill !== 'all' || sortBy !== 'default';

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6">
        <Breadcrumbs crumbs={[{ label: 'Browse Portfolios' }]} />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Browse Student Portfolios</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {loading ? 'Loading…' : `${filtered.length} student${filtered.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* Filter toolbar */}
        <div className="card p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, skill, major…"
              className="input-base pl-9 py-2 text-sm"
            />
          </div>

          <select
            value={department}
            onChange={(e) => setDept(e.target.value)}
            className="input-base w-auto text-sm py-2"
          >
            <option value="all">All Departments</option>
            {ALL_DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYear(e.target.value)}
            className="input-base w-auto text-sm py-2"
          >
            <option value="all">All Years</option>
            {[1, 2, 3, 4, 5].map((y) => (
              <option key={y} value={String(y)}>Year {y}</option>
            ))}
          </select>

          {/* Skills filter — req 23 */}
          <select
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            className="input-base w-auto text-sm py-2"
            title="Filter by skill"
          >
            <option value="all">All Skills</option>
            {allSkills.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Sort — req 25 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-base w-auto text-sm py-2"
            title="Sort portfolios"
          >
            <option value="default">Sort: default</option>
            <option value="projects-desc">Most projects first</option>
            <option value="projects-asc">Fewest projects first</option>
            <option value="name-asc">Name (A → Z)</option>
            <option value="name-desc">Name (Z → A)</option>
          </select>

          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setDept('all'); setYear('all'); setSkill('all'); setSortBy('default'); }}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {/* Portfolio grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonPortfolio key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-16 text-center">
            <Users size={36} className="mx-auto text-slate-600 mb-3" />
            <h3 className="text-lg font-semibold text-slate-300 mb-1">No portfolios found</h3>
            <p className="text-sm text-slate-500 mb-5">
              No students match your search. Try adjusting your filters.
            </p>
            <button
              onClick={() => { setSearch(''); setDept('all'); setYear('all'); setSkill('all'); setSortBy('default'); }}
              className="text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((student) => {
              const isFav = (currentUser?.savedPortfolios || []).includes(student.id);
              return (
                <PortfolioCard
                  key={student.id}
                  user={student}
                  projectCount={getProjectCount(student.id)}
                  onView={() => navigate(`/profile/${student.id}`)}
                  isFavorited={isFav}
                  onToggleFavorite={async () => {
                    await toggleFavoritePortfolio(currentUser.id, student.id);
                    const next = isFav
                      ? (currentUser.savedPortfolios || []).filter((x) => x !== student.id)
                      : [...(currentUser.savedPortfolios || []), student.id];
                    updateProfile({ savedPortfolios: next });
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
