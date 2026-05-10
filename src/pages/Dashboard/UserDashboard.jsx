/**
 * UserDashboard.jsx — Main authenticated landing page
 *
 * PURPOSE:
 *   The first page a user sees after login. It adapts its content to the
 *   user's role:
 *   - Students see their own projects, stats, and a "Create Project" CTA.
 *   - Faculty see projects they supervise.
 *   - Recruiters see recently active projects and a link to browse portfolios.
 *
 * REACT CONCEPTS USED:
 *   useState()    — Loading and error states.
 *
 *   useEffect()   — Triggers the async fetch of projects when the component
 *                   mounts. The dependency array `[]` ensures it runs once.
 *
 *   useMemo()     — Derives role-specific filtered lists from the full
 *                   projects array without re-computing on every render.
 *
 *   useAuth()     — Reads currentUser role for adaptive rendering.
 *   useDataContext() — Calls fetchProjects() and fetchUsers().
 */

import { useState, useEffect, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  PlusCircle, Folder, Eye, Heart, MessageSquare,
  TrendingUp, Users, BookOpen, ArrowRight, Inbox, Briefcase, Bookmark,
  GraduationCap, Sparkles, MessageCircle,
  HelpCircle, CheckCircle2, X,
} from 'lucide-react';
import PageWrapper  from '@/components/layout/PageWrapper';
import Loader       from '@/components/common/Loader';
import SkeletonCard from '@/components/common/SkeletonCard';
import ProjectCard  from '@/components/project/ProjectCard';
import Button       from '@/components/common/Button';
import Badge        from '@/components/common/Badge';
import { useAuth }        from '@/hooks/useAuth';
import { useDataContext } from '@/context/DataContext';
import { formatDate }     from '@/utils/formatters';

const LEARN_STORAGE = {
  student: 'guc_learn_strip_student_v1',
  faculty: 'guc_learn_strip_faculty_v1',
  recruiter: 'guc_learn_strip_recruiter_v1',
};

/** Dismissible onboarding strip + profile checklist (learnability). */
function LearnabilityStrip({ variant, user, onDismiss }) {
  if (variant === 'student') {
    const hasSkills = (user?.skills?.length ?? 0) > 0;
    const hasBio = (user?.bio || '').trim().length > 12;
    const hasLi = (user?.linkedin || '').trim().length > 0;
    const hasGh = (user?.github || '').trim().length > 0;
    const Row = ({ ok, label }) => (
      <span className={`inline-flex items-center gap-1 ${ok ? 'text-emerald-400' : 'text-slate-500'}`}>
        <CheckCircle2 size={13} className={ok ? '' : 'opacity-40'} />
        {label}
      </span>
    );
    return (
      <div className="card p-5 border-brand-500/25 bg-gradient-to-br from-brand-500/[0.07] to-transparent relative">
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-surface-700 transition-colors"
          aria-label="Hide getting started tips"
        >
          <X size={16} />
        </button>
        <h2 className="text-sm font-semibold text-brand-300 flex items-center gap-2 pr-10">
          <HelpCircle size={16} className="shrink-0" />
          Getting started — do these once
        </h2>
        <ol className="mt-3 space-y-2 text-sm text-slate-300 list-decimal list-inside leading-relaxed">
          <li>
            <Link to={`/profile/${user?.id}`} className="text-brand-400 hover:text-brand-300 underline-offset-2 hover:underline">
              Complete your profile
            </Link>
            {' '}(skills, GitHub, LinkedIn — used as your CV link).
          </li>
          <li>
            <Link to="/projects/create" className="text-brand-400 hover:text-brand-300 underline-offset-2 hover:underline">
              Create a project
            </Link>
            {' '}for a course or bachelor work, then add description & links.
          </li>
          <li>
            <Link to="/projects" className="text-brand-400 hover:text-brand-300 underline-offset-2 hover:underline">
              My Projects
            </Link>
            {' '}— use the star so the right pieces appear on your public portfolio.
          </li>
          <li>
            <Link to="/explore/projects" className="text-brand-400 hover:text-brand-300 underline-offset-2 hover:underline">
              Explore peers’ projects
            </Link>
            {' '}and save favourites for inspiration.
          </li>
        </ol>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs border-t border-surface-700/80 pt-4">
          <Row ok={hasSkills} label="Skills added" />
          <Row ok={hasBio} label="Bio written" />
          <Row ok={hasLi} label="LinkedIn link" />
          <Row ok={hasGh} label="GitHub link" />
        </div>
        <Link
          to="/help"
          className="inline-flex items-center gap-1.5 mt-4 text-xs font-medium text-brand-400 hover:text-brand-300"
        >
          Searchable help for every role <ArrowRight size={12} />
        </Link>
      </div>
    );
  }

  if (variant === 'faculty') {
    return (
      <div className="card p-5 border-accent-500/25 bg-accent-500/[0.06] relative">
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-surface-700 transition-colors"
          aria-label="Hide teaching tips"
        >
          <X size={16} />
        </button>
        <h2 className="text-sm font-semibold text-accent-300 flex items-center gap-2 pr-10">
          <HelpCircle size={16} />
          Teaching workflow — where to look
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-300 list-disc list-inside">
          <li><strong className="text-slate-200">Invitations</strong> — students may add you to projects; accept or decline here.</li>
          <li><strong className="text-slate-200">Explore Projects</strong> — filter by your courses or name, then open a project to leave feedback.</li>
          <li><strong className="text-slate-200">Messages</strong> — follow up with students or employers in one thread.</li>
        </ul>
        <Link to="/help" className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-accent-400 hover:text-accent-300">
          Faculty topics in Help <ArrowRight size={12} />
        </Link>
      </div>
    );
  }

  /* recruiter */
  return (
    <div className="card p-5 border-emerald-500/25 bg-emerald-500/[0.06] relative">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-surface-700 transition-colors"
        aria-label="Hide employer tips"
      >
        <X size={16} />
      </button>
      <h2 className="text-sm font-semibold text-emerald-300 flex items-center gap-2 pr-10">
        <HelpCircle size={16} />
        Finding talent — suggested order
      </h2>
      <ul className="mt-3 space-y-2 text-sm text-slate-300 list-disc list-inside">
        <li>Start under <strong className="text-slate-200">Portfolios</strong> to scan student profiles and skills.</li>
        <li>Use <strong className="text-slate-200">Explore Projects</strong> for deeper technical context (demos, GitHub).</li>
        <li><strong className="text-slate-200">Messages</strong> — contact a student from their profile link when you are ready.</li>
      </ul>
      <Link to="/help" className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-emerald-400 hover:text-emerald-300">
        Employer topics in Help <ArrowRight size={12} />
      </Link>
    </div>
  );
}

/* ── Stat card ──────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color = 'blue' }) {
  const colorMap = {
    blue:   'bg-brand-500/15 text-brand-400 border-brand-500/20',
    violet: 'bg-accent-500/15 text-accent-400 border-accent-500/20',
    green:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    amber:  'bg-amber-500/15 text-amber-400 border-amber-500/20',
  };
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-100">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const { currentUser, isStudent, isFaculty, isRecruiter, isAdmin } = useAuth();
  const {
    fetchProjects, fetchUsers, toggleLike, courses,
  } = useDataContext();

  const [projects, setProjects] = useState([]);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);

  const learnVariant = isStudent ? 'student' : isFaculty ? 'faculty' : isRecruiter ? 'recruiter' : null;
  const learnKey = learnVariant ? LEARN_STORAGE[learnVariant] : null;
  const [learnDismissed, setLearnDismissed] = useState(() => {
    if (!learnKey) return true;
    try {
      return localStorage.getItem(learnKey) === '1';
    } catch {
      return false;
    }
  });
  const dismissLearn = () => {
    if (!learnKey) return;
    localStorage.setItem(learnKey, '1');
    setLearnDismissed(true);
  };

  useEffect(() => {
    if (isAdmin) { setLoading(false); return; }
    let cancelled = false;
    const load = async () => {
      try {
        const [p, u] = await Promise.all([fetchProjects(), fetchUsers()]);
        if (!cancelled) { setProjects(p); setUsers(u); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [fetchProjects, fetchUsers, isAdmin]);

  // Faculty: courses I'm linked to
  const linkedCourses = useMemo(
    () => (courses || []).filter((c) => (c.instructorIds || []).includes(currentUser?.id)),
    [courses, currentUser]
  );

  // Role-based project lists
  const myProjects = useMemo(
    () => projects.filter((p) => p.teamMembers?.includes(currentUser?.id)),
    [projects, currentUser]
  );

  // Pending invitations addressed to me
  const pendingInvites = useMemo(() => {
    if (!currentUser) return 0;
    let n = 0;
    for (const p of projects)
      for (const inv of (p.invitations || []))
        if (inv.userId === currentUser.id && inv.status === 'pending') n++;
    return n;
  }, [projects, currentUser]);

  const supervisedProjects = useMemo(
    () => projects.filter((p) => p.supervisorId === currentUser?.id),
    [projects, currentUser]
  );

  const recentProjects = useMemo(
    () => [...projects].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6),
    [projects]
  );

  // Admins use a dedicated dashboard at /admin (req 14, 52–58, 62–64, 73).
  // The redirect is rendered AFTER all hooks so hook order stays stable.
  if (isAdmin) return <Navigate to="/admin" replace />;

  // Stats
  const totalLikes = myProjects.reduce((sum, p) => sum + p.likes, 0);
  const totalViews = myProjects.reduce((sum, p) => sum + p.views, 0);
  const totalFeedback = myProjects.reduce((sum, p) => sum + p.feedback.length, 0);

  const displayProjects = isStudent ? myProjects : isFaculty ? supervisedProjects : recentProjects;
  const skeletonCount   = isStudent ? 3 : 6;

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ── Welcome header ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              Good day, {currentUser?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {isStudent   && 'Track your projects and see how your work is being received.'}
              {isFaculty   && 'Review and provide feedback on the projects you supervise.'}
              {isRecruiter && 'Discover talented GUC students and their best projects.'}
            </p>
          </div>
          {isStudent && (
            <Link to="/projects/create">
              <Button leftIcon={<PlusCircle size={16} />} size="md">New Project</Button>
            </Link>
          )}
        </div>

        {learnVariant && !learnDismissed && (
          <LearnabilityStrip variant={learnVariant} user={currentUser} onDismiss={dismissLearn} />
        )}

        {/* ── Stats row (student only) ────────────────────────────── */}
        {isStudent && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Folder}        label="My Projects"       value={myProjects.length}   color="blue"   />
            <StatCard icon={Heart}         label="Total Likes"        value={totalLikes}           color="amber"  />
            <StatCard icon={Eye}           label="Total Views"        value={totalViews}           color="green"  />
            <StatCard icon={MessageSquare} label="Feedback Received"  value={totalFeedback}        color="violet" />
          </div>
        )}

        {/* ── Student quick actions ──────────────────────────────── */}
        {isStudent && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/invitations" className="card p-4 flex items-center gap-3 hover:border-brand-500/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
                <Inbox size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200 group-hover:text-brand-300 transition-colors">Invitations</p>
                <p className="text-xs text-slate-400">{pendingInvites} pending</p>
              </div>
              {pendingInvites > 0 && (
                <span className="bg-red-500 text-white text-[11px] font-bold px-1.5 rounded-full">{pendingInvites}</span>
              )}
            </Link>
            <Link to="/internships" className="card p-4 flex items-center gap-3 hover:border-brand-500/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Briefcase size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">Internships</p>
                <p className="text-xs text-slate-400">Browse open positions</p>
              </div>
              <ArrowRight size={14} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
            </Link>
            <Link to="/favourites" className="card p-4 flex items-center gap-3 hover:border-brand-500/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Bookmark size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200 group-hover:text-amber-300 transition-colors">Favourites</p>
                <p className="text-xs text-slate-400">{(currentUser?.savedProjects?.length ?? 0) + (currentUser?.savedPortfolios?.length ?? 0)} saved items</p>
              </div>
              <ArrowRight size={14} className="text-slate-600 group-hover:text-amber-400 transition-colors" />
            </Link>
          </div>
        )}

        {/* ── Faculty stats + quick actions ──────────────────────── */}
        {isFaculty && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Folder}        label="Supervised projects" value={supervisedProjects.length} color="violet" />
              <StatCard icon={BookOpen}      label="Linked courses"      value={linkedCourses.length}       color="blue"   />
              <StatCard icon={Inbox}         label="Pending invitations" value={pendingInvites}             color="amber"  />
              <StatCard icon={MessageSquare} label="Feedback given"      value={supervisedProjects.reduce((s, p) => s + (p.feedback?.filter((f) => f.authorId === currentUser?.id).length || 0), 0)} color="green" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to={`/profile/${currentUser?.id}`} className="card p-4 flex items-center gap-3 hover:border-brand-500/50 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-accent-400 shrink-0">
                  <GraduationCap size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 group-hover:text-accent-400 transition-colors">My profile</p>
                  <p className="text-xs text-slate-400">Bio, research, courses</p>
                </div>
              </Link>
              <Link to="/courses" className="card p-4 flex items-center gap-3 hover:border-brand-500/50 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
                  <BookOpen size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 group-hover:text-brand-300 transition-colors">All courses</p>
                  <p className="text-xs text-slate-400">{courses.length} courses in catalogue</p>
                </div>
              </Link>
              <Link to="/recommended" className="card p-4 flex items-center gap-3 hover:border-amber-500/50 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Sparkles size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 group-hover:text-amber-300 transition-colors">Recommended</p>
                  <p className="text-xs text-slate-400">Projects matching your work</p>
                </div>
              </Link>
              <Link to="/messages" className="card p-4 flex items-center gap-3 hover:border-emerald-500/50 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <MessageCircle size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">Messages</p>
                  <p className="text-xs text-slate-400">Talk with students & employers</p>
                </div>
              </Link>
            </div>
          </>
        )}

        {/* ── Recruiter quick links ───────────────────────────────── */}
        {isRecruiter && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/explore/portfolios"
              className="card p-5 flex items-center gap-4 hover:border-brand-500/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center shrink-0">
                <Users size={22} className="text-brand-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-200 group-hover:text-brand-300 transition-colors">Browse Portfolios</p>
                <p className="text-xs text-slate-400">Search {users.filter((u) => u.role === 'student').length} student profiles</p>
              </div>
              <ArrowRight size={16} className="ml-auto text-slate-600 group-hover:text-brand-400 transition-colors" />
            </Link>
            <Link
              to="/explore/projects"
              className="card p-5 flex items-center gap-4 hover:border-accent-500/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-accent-500/15 border border-accent-500/20 flex items-center justify-center shrink-0">
                <BookOpen size={22} className="text-accent-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-200 group-hover:text-accent-400 transition-colors">Explore Projects</p>
                <p className="text-xs text-slate-400">View {projects.length} student projects</p>
              </div>
              <ArrowRight size={16} className="ml-auto text-slate-600 group-hover:text-accent-400 transition-colors" />
            </Link>
          </div>
        )}

        {/* ── Projects section ────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-400" />
              {isStudent   && 'My Projects'}
              {isFaculty   && 'Supervised Projects'}
              {isRecruiter && 'Recent Projects'}
            </h2>
            <Link
              to="/explore/projects"
              className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: skeletonCount }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : displayProjects.length === 0 ? (
            /* Empty state */
            <div className="card p-12 text-center">
              <Folder size={40} className="mx-auto text-slate-600 mb-3" />
              <p className="text-slate-300 font-medium mb-1">No projects yet</p>
              <p className="text-sm text-slate-500 mb-5">
                {isStudent && "You have not created any projects yet. Use New Project above, or open Help & tips in the sidebar for a full walkthrough."}
                {isFaculty && 'No supervised projects in the mock data yet. Open Explore Projects and filter by your name or course to find student work to review.'}
                {isRecruiter && 'No recent listings here — open Explore Projects or Portfolios from the cards above to browse the catalogue.'}
              </p>
              {isStudent && (
                <Link to="/projects/create">
                  <Button leftIcon={<PlusCircle size={15} />}>Create your first project</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  users={users}
                  onLike={toggleLike}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </PageWrapper>
  );
}
