/**
 * AdminDashboard.jsx — Platform overview for administrators
 *
 * COVERS:
 *   Req 73 — View statistics about platform usage (totals by role, projects,
 *            courses, internships, pending approvals).
 *   Req 71 — Internship totals across the platform.
 *   Quick-link cards for every admin task (req 14, 52–58, 62–64).
 *
 * REACT CONCEPTS USED:
 *   useDataContext()  — Reads the live `stats` object derived in DataContext.
 *   useAuth()         — Greets the administrator by name.
 */

import { Link } from 'react-router-dom';
import {
  Users, GraduationCap, Briefcase, Building2, ShieldCheck,
  BookOpen, Folder, Flag, AlertTriangle, BarChart3, ArrowRight, UserCog,
} from 'lucide-react';
import PageWrapper       from '@/components/layout/PageWrapper';
import { useAuth }       from '@/hooks/useAuth';
import { useDataContext } from '@/context/DataContext';

function StatCard({ icon: Icon, label, value, color = 'blue', sub }) {
  const colorMap = {
    blue:   'bg-brand-500/15 text-brand-400 border-brand-500/20',
    violet: 'bg-accent-500/15 text-accent-400 border-accent-500/20',
    green:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    amber:  'bg-amber-500/15 text-amber-400 border-amber-500/20',
    red:    'bg-red-500/15 text-red-400 border-red-500/20',
  };
  return (
    <div className="card p-4">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${colorMap[color]}`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function QuickLink({ to, title, description, icon: Icon, badge, color = 'blue' }) {
  const colorMap = {
    blue:   'bg-brand-500/15 text-brand-400 border-brand-500/20',
    violet: 'bg-accent-500/15 text-accent-400 border-accent-500/20',
    green:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    amber:  'bg-amber-500/15 text-amber-400 border-amber-500/20',
    red:    'bg-red-500/15 text-red-400 border-red-500/20',
  };
  return (
    <Link to={to} className="card p-4 flex items-center gap-3 hover:border-brand-500/50 transition-all group">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-200 group-hover:text-brand-300 transition-colors">{title}</p>
          {typeof badge === 'number' && badge > 0 && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-semibold rounded-full bg-red-500 text-white">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 truncate">{description}</p>
      </div>
      <ArrowRight size={16} className="text-slate-500 group-hover:text-brand-400 transition-colors shrink-0" />
    </Link>
  );
}

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const { stats }       = useDataContext();

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Admin overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            Welcome back, {currentUser?.firstName || 'Admin'}. Here is a snapshot of platform activity.
          </p>
          <p className="text-xs text-slate-500 mt-2 max-w-2xl leading-relaxed">
            New to this prototype? Open{' '}
            <Link to="/help" className="text-brand-400 hover:text-brand-300 font-medium">Help & tips</Link>
            {' '}for a searchable guide to moderation queues, employers, and flags.
          </p>
        </div>

        {/* ── Platform usage statistics (req 73) ─────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={16} className="text-brand-400" />
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Platform statistics</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatCard icon={Users}        label="Total users"       value={stats.totalUsers}      color="blue"   sub={`${stats.inactiveUsers} deactivated`} />
            <StatCard icon={GraduationCap} label="Students"         value={stats.totalStudents}    color="violet" />
            <StatCard icon={UserCog}      label="Faculty"           value={stats.totalFaculty}     color="green" />
            <StatCard icon={Building2}    label="Approved employers" value={stats.totalRecruiters}  color="amber"  sub={`${stats.pendingEmployers} pending`} />
            <StatCard icon={Folder}       label="Projects"          value={stats.totalProjects}    color="blue"   sub={`${stats.activeProjects} active`} />
            <StatCard icon={BookOpen}     label="Courses"           value={stats.totalCourses}     color="violet" />
            <StatCard icon={Briefcase}    label="Internships"       value={stats.totalInternships} color="green" />
            <StatCard icon={ShieldCheck}  label="Admins"            value={stats.totalAdmins}      color="red" />
          </div>
        </section>

        {/* ── Action queues ──────────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3">Action queues</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickLink
              to="/admin/employers"
              icon={Building2}
              color="amber"
              title="Employer applications"
              description="Review pending companies, view their documents and accept or reject."
              badge={stats.pendingEmployers}
            />
            <QuickLink
              to="/admin/courses"
              icon={BookOpen}
              color="violet"
              title="Instructor link requests"
              description="Approve or reject course-link requests submitted by faculty."
              badge={stats.pendingLinkRequests}
            />
            <QuickLink
              to="/admin/flags"
              icon={Flag}
              color="red"
              title="Flagged projects"
              description="Review reported projects and student appeals."
              badge={stats.flaggedProjects + stats.pendingAppeals}
            />
            <QuickLink
              to="/admin/users"
              icon={ShieldCheck}
              color="blue"
              title="Manage users"
              description="View all accounts, deactivate offenders, and create new admins."
            />
          </div>
        </section>

        {/* ── Quick links to discovery (admin can also browse) ────── */}
        <section>
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3">Browse the platform</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickLink to="/explore/projects"   icon={Folder} color="blue"   title="All projects"  description="Search & filter every project (req 42–46)." />
            <QuickLink to="/explore/portfolios" icon={Users}  color="violet" title="All portfolios" description="Browse student portfolios (req 47–51)." />
            <QuickLink to="/internships"        icon={Briefcase} color="green" title="All internships" description="See every internship listed on the platform." />
          </div>
        </section>

        {/* Helpful footer note */}
        <div className="card p-4 flex items-center gap-3 border-amber-500/20 bg-amber-500/5">
          <AlertTriangle size={18} className="text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300/90 leading-relaxed">
            Tip — newly registered employers cannot sign in until you review and approve their company documents
            in the <Link to="/admin/employers" className="font-semibold underline">Employer applications</Link> queue.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
