/**
 * Instructors.jsx — Search and browse course instructors
 *
 * COVERS:
 *   Faculty req 6 — "Search for course instructors by name or course."
 *   Faculty req 7 — Each result links to the instructor profile, which lists
 *                    all linked courses (handled by ProfilePage).
 *
 * Features:
 *   - Free-text search across instructor name, email, title, department,
 *     research interests, and any course they teach (code or name).
 *   - Department filter.
 *   - Course filter (lists only courses that have at least one instructor
 *     linked, so the dropdown stays meaningful).
 *
 * REACT CONCEPTS USED:
 *   useState() — Search + filter state.
 *   useEffect() — Loads users on mount.
 *   useMemo()  — Derives the filtered list and a per-instructor
 *                "linked courses" lookup map.
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Search, X, GraduationCap, BookOpen, FlaskConical,
  Mail, ArrowRight, MessageCircle,
} from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import Badge       from '@/components/common/Badge';
import Button      from '@/components/common/Button';
import { useDataContext } from '@/context/DataContext';
import { useAuth }        from '@/hooks/useAuth';

export default function Instructors() {
  const { fetchUsers, courses } = useDataContext();
  const { currentUser }         = useAuth();

  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [dept, setDept]         = useState('all');
  const [courseId, setCourseId] = useState('all');

  useEffect(() => {
    let cancelled = false;
    fetchUsers().then((u) => { if (!cancelled) { setUsers(u); setLoading(false); } });
    return () => { cancelled = true; };
  }, [fetchUsers]);

  /* ── Derived data ──────────────────────────────────────── */
  const instructors = useMemo(
    () => users.filter((u) => u.role === 'faculty' && u.isActive !== false),
    [users]
  );

  const departments = useMemo(() => {
    const set = new Set();
    instructors.forEach((u) => u.department && set.add(u.department));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [instructors]);

  // Map of instructorId → array of linked courses (computed once per fetch)
  const linkedCoursesByInstructor = useMemo(() => {
    const map = new Map();
    courses.forEach((c) => {
      (c.instructorIds || []).forEach((id) => {
        if (!map.has(id)) map.set(id, []);
        map.get(id).push(c);
      });
    });
    return map;
  }, [courses]);

  // Only courses that have at least one instructor linked appear in the filter
  const filterableCourses = useMemo(
    () => courses.filter((c) => (c.instructorIds || []).length > 0),
    [courses]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return instructors.filter((u) => {
      if (dept !== 'all' && u.department !== dept) return false;
      if (courseId !== 'all') {
        const linked = (linkedCoursesByInstructor.get(u.id) || []).map((c) => c.id);
        if (!linked.includes(courseId)) return false;
      }
      if (!q) return true;
      const courseStrs = (linkedCoursesByInstructor.get(u.id) || [])
        .flatMap((c) => [c.code, c.name])
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.title || '').toLowerCase().includes(q) ||
        (u.department || '').toLowerCase().includes(q) ||
        (u.researchInterests || []).some((r) => r.toLowerCase().includes(q)) ||
        courseStrs.includes(q)
      );
    });
  }, [instructors, search, dept, courseId, linkedCoursesByInstructor]);

  const hasFilters = search || dept !== 'all' || courseId !== 'all';

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto space-y-6">
        <Breadcrumbs crumbs={[{ label: 'Course Instructors' }]} />

        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <GraduationCap size={22} className="text-brand-400" /> Course Instructors
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {loading ? 'Loading…' : `${filtered.length} of ${instructors.length} instructors`}
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
              placeholder="Search by name, course code, course name, or research area…"
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

          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="input-base w-auto text-sm py-2"
            title="Filter by course they teach"
          >
            <option value="all">All Courses</option>
            {filterableCourses.map((c) => (
              <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setDept('all'); setCourseId('all'); }}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="card p-16 text-center text-slate-500">Loading instructors…</div>
        ) : filtered.length === 0 ? (
          <div className="card p-16 text-center">
            <Users size={36} className="mx-auto text-slate-600 mb-3" />
            <h3 className="text-lg font-semibold text-slate-300 mb-1">No instructors match</h3>
            <p className="text-sm text-slate-500">Adjust your search or clear the filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((u) => {
              const linked = linkedCoursesByInstructor.get(u.id) || [];
              return (
                <article key={u.id} className="card p-5 hover:border-brand-500/40 transition-colors flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <Link to={`/profile/${u.id}`}>
                      <img
                        src={u.profilePic}
                        alt={u.name}
                        className="w-12 h-12 rounded-xl bg-surface-700 hover:ring-2 hover:ring-brand-500 transition shrink-0 object-cover"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/profile/${u.id}`} className="text-sm font-semibold text-slate-100 hover:text-brand-300 transition-colors block truncate">
                        {u.name}
                      </Link>
                      <p className="text-[11px] text-accent-400 truncate">{u.title || 'Lecturer'}</p>
                      <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                        <Mail size={10} /> {u.email}
                      </p>
                    </div>
                  </div>

                  {u.bio && (
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{u.bio}</p>
                  )}

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                      <BookOpen size={10} /> Linked courses
                    </p>
                    {linked.length === 0 ? (
                      <p className="text-[11px] text-slate-600 italic">Not currently linked to any course</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {linked.slice(0, 4).map((c) => (
                          <Badge key={c.id} variant="violet" size="sm">{c.code}</Badge>
                        ))}
                        {linked.length > 4 && (
                          <Badge variant="default" size="sm">+{linked.length - 4}</Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {(u.researchInterests || []).length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                        <FlaskConical size={10} /> Research
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {(u.researchInterests || []).slice(0, 3).map((r) => (
                          <Badge key={r} variant="default" size="sm">{r}</Badge>
                        ))}
                        {u.researchInterests.length > 3 && (
                          <Badge variant="default" size="sm">+{u.researchInterests.length - 3}</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-auto pt-1">
                    <Link to={`/profile/${u.id}`} className="flex-1">
                      <Button variant="secondary" size="sm" fullWidth rightIcon={<ArrowRight size={11} />}>
                        View profile
                      </Button>
                    </Link>
                    {currentUser && currentUser.id !== u.id && (
                      <Link to={`/messages?with=${u.id}`}>
                        <Button variant="ghost" size="sm" leftIcon={<MessageCircle size={13} />} aria-label="Message instructor" />
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
