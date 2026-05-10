/**
 * Sidebar.jsx — Application navigation sidebar
 *
 * PURPOSE:
 *   Persistent left-rail navigation for all authenticated pages. Adapts the
 *   visible menu items to the current user's role (student / faculty /
 *   recruiter). Highlights the active route via NavLink.
 *
 * PROPS:
 *   isOpen, onClose — control the mobile drawer behaviour.
 *
 * REACT CONCEPTS USED:
 *   NavLink            — react-router-dom component that auto-applies an
 *                        "active" style when its `to` matches the URL.
 *   useAuth()          — Reads the current user's role for visibility.
 *   useDataContext()   — Used to compute the unread-invitations badge.
 *   useMemo()          — Derives the badge counts only when projects/user change.
 */

import { useMemo } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, Compass, Users,
  PlusCircle, X, GraduationCap, Briefcase, Inbox, Bookmark, Folder,
  ShieldCheck, BookOpen, Building2, Flag, BarChart3,
  MessageCircle, Sparkles, UserSearch, HelpCircle,
} from 'lucide-react';
import { useAuth }        from '@/hooks/useAuth';
import { useDataContext } from '@/context/DataContext';

const ROLE_LABEL = {
  student: 'Student',
  faculty: 'Course instructor',
  recruiter: 'Employer',
  admin: 'Administrator',
};

function NavItem({ to, icon: Icon, label, badge, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 border',
          isActive
            ? 'bg-brand-600/20 text-brand-300 border-brand-500/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-surface-700 border-transparent',
        ].join(' ')
      }
    >
      <Icon size={18} className="shrink-0" />
      <span className="flex-1">{label}</span>
      {typeof badge === 'number' && badge > 0 && (
        <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] font-semibold rounded-full bg-red-500 text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </NavLink>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const { projects, users, linkRequests, messages } = useDataContext();
  const role = currentUser?.role ?? '';

  // Pending invitations addressed to me — badge in sidebar
  const pendingInvites = useMemo(() => {
    if (!currentUser) return 0;
    let count = 0;
    for (const p of projects) {
      for (const inv of (p.invitations || [])) {
        if (inv.userId === currentUser.id && inv.status === 'pending') count++;
      }
    }
    return count;
  }, [projects, currentUser]);

  // Unread inbound messages — req 32
  const unreadMessages = useMemo(() => {
    if (!currentUser) return 0;
    return (messages || []).filter((m) => m.toId === currentUser.id && !m.read).length;
  }, [messages, currentUser]);

  // Admin badges (req 14, 57, 62, 63) — counted live so they always reflect state
  const pendingEmployers     = useMemo(() => users.filter((u) => u.role === 'recruiter' && u.applicationStatus === 'pending').length, [users]);
  const pendingLinkRequests  = useMemo(() => (linkRequests || []).filter((r) => r.status === 'pending').length,                          [linkRequests]);
  const flaggedOrAppealCount = useMemo(() => projects.filter((p) => p.isFlagged || (p.appeal && p.appeal.status === 'pending')).length, [projects]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'fixed top-0 left-0 z-40 h-full w-64 bg-surface-900 border-r border-surface-700',
          'flex flex-col pt-16 transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-700"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {/* ── Main ───────────────────────────────────── */}
          <div>
            <p className="px-3 mb-2 text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Main</p>
            <ul className="space-y-1">
              <li><NavItem to="/dashboard"   icon={LayoutDashboard} label="Dashboard"  end /></li>
              {(role === 'student' || role === 'faculty') && (
                <li><NavItem to="/invitations" icon={Inbox} label="Invitations" badge={pendingInvites} /></li>
              )}
              {(role === 'student' || role === 'faculty' || role === 'recruiter') && (
                <li><NavItem to="/messages" icon={MessageCircle} label="Messages" badge={unreadMessages} /></li>
              )}
              {role === 'student' && (
                <li><NavItem to="/favourites"  icon={Bookmark} label="Favourites" /></li>
              )}
              {role === 'recruiter' && (
                <li><NavItem to="/favourites" icon={Bookmark} label="Saved" /></li>
              )}
              {role !== 'admin' && (
                <li><NavItem to="/recommended" icon={Sparkles} label="Recommended" /></li>
              )}
              <li><NavItem to="/help" icon={HelpCircle} label="Help & tips" /></li>
            </ul>
          </div>

          {/* ── Faculty-specific quick links (req 5, 6, 27) ─ */}
          {role === 'faculty' && (
            <div>
              <p className="px-3 mb-2 text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Teaching</p>
              <ul className="space-y-1">
                <li><NavItem to={`/profile/${currentUser?.id}`} icon={GraduationCap} label="My Profile" /></li>
                <li><NavItem to="/courses"     icon={BookOpen}    label="All Courses" /></li>
                <li><NavItem to="/instructors" icon={UserSearch}  label="Instructors" /></li>
              </ul>
            </div>
          )}

          {/* ── Admin section (req 14, 52–58, 62–64, 73) ─ */}
          {role === 'admin' && (
            <div>
              <p className="px-3 mb-2 text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Administration</p>
              <ul className="space-y-1">
                <li><NavItem to="/admin"           icon={BarChart3}    label="Overview" end /></li>
                <li><NavItem to="/admin/users"     icon={ShieldCheck}  label="Users" /></li>
                <li><NavItem to="/admin/employers" icon={Building2}    label="Employers" badge={pendingEmployers} /></li>
                <li><NavItem to="/admin/courses"   icon={BookOpen}     label="Courses" badge={pendingLinkRequests} /></li>
                <li><NavItem to="/admin/flags"     icon={Flag}         label="Flags & Appeals" badge={flaggedOrAppealCount} /></li>
              </ul>
            </div>
          )}

          {/* ── Projects (hidden for admin — they have a dedicated panel) ── */}
          {role !== 'admin' && (
            <div>
              <p className="px-3 mb-2 text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Projects</p>
              <ul className="space-y-1">
                {role === 'student' && (
                  <>
                    <li><NavItem to="/projects"        icon={Folder}      label="My Projects" /></li>
                    <li><NavItem to="/projects/create" icon={PlusCircle}  label="New Project" /></li>
                  </>
                )}
                <li><NavItem to="/explore/projects" icon={Compass} label="Explore Projects" /></li>
              </ul>
            </div>
          )}

          {/* ── People & Catalogue ────────────────────── */}
          {role !== 'admin' && (
            <div>
              <p className="px-3 mb-2 text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Discover</p>
              <ul className="space-y-1">
                <li><NavItem to="/explore/portfolios" icon={Users}      label="Portfolios" /></li>
                {role !== 'faculty' && (
                  <>
                    <li><NavItem to="/instructors" icon={UserSearch} label="Instructors" /></li>
                    <li><NavItem to="/courses"     icon={BookOpen}   label="Courses" /></li>
                  </>
                )}
              </ul>
            </div>
          )}

          {/* ── Internships ──────────────────────────── */}
          {role !== 'admin' && (
            <div>
              <p className="px-3 mb-2 text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Internships</p>
              <ul className="space-y-1">
                <li><NavItem to="/internships" icon={Briefcase} label="Internships" /></li>
              </ul>
            </div>
          )}
        </nav>

        {/* User card */}
        {currentUser && (
          <Link
            to={`/profile/${currentUser.id}`}
            className="shrink-0 mx-3 mb-4 p-3 bg-surface-800 border border-surface-700 rounded-xl hover:border-brand-500/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <img
                src={currentUser.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full bg-surface-700"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <GraduationCap size={11} /> {ROLE_LABEL[currentUser.role] || currentUser.role}
                </p>
              </div>
            </div>
          </Link>
        )}
      </aside>
    </>
  );
}
