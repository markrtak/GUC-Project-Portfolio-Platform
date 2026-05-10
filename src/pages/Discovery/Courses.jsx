/**
 * Courses.jsx — Public catalogue of all university courses
 *
 * COVERS:
 *   Faculty req 27 — "View a list of all courses included the course name
 *                     and course code."
 *
 * Each row links to the projects associated with that course (filtered
 * `/explore/projects?course=…`) and surfaces the linked instructor(s) so
 * students can quickly see who teaches each course.
 *
 * REACT CONCEPTS USED:
 *   useState() — Search query + department filter.
 *   useEffect() — Fetch users (for instructor names) on mount.
 *   useMemo()  — Derive filtered list reactively.
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Search, X, Users, ArrowRight, GraduationCap,
} from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import Badge       from '@/components/common/Badge';
import { useDataContext } from '@/context/DataContext';

export default function Courses() {
  const { courses, fetchUsers } = useDataContext();
  const [users, setUsers]       = useState([]);
  const [search, setSearch]     = useState('');
  const [dept, setDept]         = useState('all');

  useEffect(() => {
    let cancelled = false;
    fetchUsers().then((u) => { if (!cancelled) setUsers(u); });
    return () => { cancelled = true; };
  }, [fetchUsers]);

  const departments = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => c.department && set.add(c.department));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [courses]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      if (dept !== 'all' && c.department !== dept) return false;
      if (!q) return true;
      return (
        (c.code || '').toLowerCase().includes(q) ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q)
      );
    });
  }, [courses, search, dept]);

  const findInstructors = (course) =>
    (course.instructorIds || [])
      .map((id) => users.find((u) => u.id === id))
      .filter(Boolean);

  const hasFilters = search || dept !== 'all';

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto space-y-6">
        <Breadcrumbs crumbs={[{ label: 'Courses' }]} />

        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BookOpen size={22} className="text-brand-400" /> Course Catalogue
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {filtered.length} of {courses.length} courses
          </p>
        </div>

        {/* Toolbar */}
        <div className="card p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by course code, name or description…"
              className="input-base pl-9 py-2 text-sm"
            />
          </div>

          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="input-base w-auto text-sm py-2"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>

          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setDept('all'); }}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="card p-16 text-center">
            <BookOpen size={36} className="mx-auto text-slate-600 mb-3" />
            <h3 className="text-lg font-semibold text-slate-300 mb-1">No courses match</h3>
            <p className="text-sm text-slate-500">Try a different keyword or department.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((c) => {
              const instructors = findInstructors(c);
              return (
                <article key={c.id} className="card p-5 flex flex-col gap-3 hover:border-brand-500/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-brand-300">{c.code}</p>
                      <h2 className="text-base font-semibold text-slate-100 mt-0.5">{c.name}</h2>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <GraduationCap size={11} /> {c.department || 'Department TBD'}
                        {c.semester && c.year && <span> · {c.semester} · Year {c.year}</span>}
                      </p>
                    </div>
                    <Badge variant="default" size="sm">{c.code?.split(' ')[0] || 'GUC'}</Badge>
                  </div>

                  {c.description && (
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{c.description}</p>
                  )}

                  <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                    <Users size={11} />
                    {instructors.length === 0 ? (
                      <span className="italic text-slate-600">No instructors linked</span>
                    ) : (
                      instructors.map((i, idx) => (
                        <span key={i.id}>
                          <Link to={`/profile/${i.id}`} className="text-slate-300 hover:text-brand-300 transition-colors">
                            {i.name}
                          </Link>
                          {idx < instructors.length - 1 ? ',' : ''}
                        </span>
                      ))
                    )}
                  </div>

                  <Link
                    to={`/explore/projects?course=${c.id}`}
                    className="text-xs font-medium text-brand-400 hover:text-brand-300 inline-flex items-center gap-1 transition-colors mt-auto pt-1"
                  >
                    View projects in this course <ArrowRight size={11} />
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
