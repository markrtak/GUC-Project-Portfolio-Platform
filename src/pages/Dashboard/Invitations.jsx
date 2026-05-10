/**
 * Invitations.jsx — Inbox of pending project invitations (req 29, 30)
 *
 * PURPOSE:
 *   The "received invitations" inbox where any logged-in user (student or
 *   faculty) sees all the projects they've been invited to collaborate on or
 *   supervise. Each invitation has Accept / Reject buttons that fire
 *   `respondToInvitation` from DataContext.
 *
 * REACT CONCEPTS USED:
 *   useEffect()  — Loads projects + users on mount.
 *   useMemo()    — Derives the list of pending invitations addressed to the
 *                  current user from the global projects array. Recomputes
 *                  only when projects or currentUser change.
 *   useState()   — Tracks per-invitation loading state (so two pending
 *                  responses don't accidentally share a loading flag).
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail, Check, X, Clock, Inbox, ArrowRight, Calendar, Users,
} from 'lucide-react';
import PageWrapper  from '@/components/layout/PageWrapper';
import Breadcrumbs  from '@/components/layout/Breadcrumbs';
import Button       from '@/components/common/Button';
import Badge        from '@/components/common/Badge';
import Loader       from '@/components/common/Loader';
import { useAuth }        from '@/hooks/useAuth';
import { useDataContext } from '@/context/DataContext';
import { timeAgo, formatDate } from '@/utils/formatters';

export default function Invitations() {
  const { currentUser } = useAuth();
  const { fetchProjects, fetchUsers, respondToInvitation } = useDataContext();

  const [projects, setProjects] = useState([]);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [pending, setPending]   = useState({}); // { invId: 'accepting' | 'rejecting' }
  const [filter, setFilter]     = useState('pending');  // 'pending' | 'all'

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchProjects(), fetchUsers()]).then(([p, u]) => {
      if (!cancelled) { setProjects(p); setUsers(u); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [fetchProjects, fetchUsers]);

  const myInvites = useMemo(() => {
    const list = [];
    for (const project of projects) {
      for (const inv of (project.invitations || [])) {
        if (inv.userId === currentUser?.id) {
          list.push({ ...inv, project });
        }
      }
    }
    return list.sort((a, b) => new Date(b.invitedAt) - new Date(a.invitedAt));
  }, [projects, currentUser]);

  const filtered = filter === 'pending'
    ? myInvites.filter((i) => i.status === 'pending')
    : myInvites;

  const handleRespond = async (project, inv, accept) => {
    setPending((p) => ({ ...p, [inv.id]: accept ? 'accepting' : 'rejecting' }));
    try {
      await respondToInvitation(project.id, inv.id, accept);
      setProjects((prev) => prev.map((p) => p.id === project.id ? {
        ...p,
        invitations: p.invitations.map((i) => i.id === inv.id ? { ...i, status: accept ? 'accepted' : 'rejected' } : i),
        teamMembers: accept && !p.teamMembers.includes(inv.userId) ? [...p.teamMembers, inv.userId] : p.teamMembers,
      } : p));
    } finally {
      setPending((p) => { const next = { ...p }; delete next[inv.id]; return next; });
    }
  };

  if (loading) return <PageWrapper><Loader message="Loading your invitations…" /></PageWrapper>;

  const pendingCount = myInvites.filter((i) => i.status === 'pending').length;

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto space-y-6">
        <Breadcrumbs crumbs={[{ label: 'Invitations' }]} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <Inbox size={22} className="text-brand-400" />
              Project Invitations
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {pendingCount === 0 ? 'You have no pending invitations.' :
                `You have ${pendingCount} pending invitation${pendingCount !== 1 ? 's' : ''}.`}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-surface-800 border border-surface-700 rounded-lg p-1">
            {['pending', 'all'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                  filter === f ? 'bg-brand-600/20 text-brand-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card p-16 text-center">
            <Inbox size={36} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-300 font-medium mb-1">No invitations</p>
            <p className="text-sm text-slate-500">
              {filter === 'pending' ? "You're all caught up!" : "You haven't received any invitations yet."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((inv) => {
              const owner = users.find((u) => u.id === inv.project.ownerId);
              const isPending = pending[inv.id];
              const memberCount = (inv.project.teamMembers || []).length;
              return (
                <li key={inv.id} className="card p-4">
                  <div className="flex gap-4">
                    <Link to={`/projects/${inv.project.id}`} className="shrink-0">
                      <img src={inv.project.thumbnail} alt={inv.project.title} className="w-20 h-20 rounded-lg bg-surface-700 object-cover" />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to={`/projects/${inv.project.id}`} className="font-semibold text-slate-100 hover:text-brand-300 transition-colors truncate">
                          {inv.project.title}
                        </Link>
                        <Badge variant={inv.role === 'instructor' ? 'violet' : 'blue'} size="sm">
                          {inv.role === 'instructor' ? 'As Instructor' : 'As Collaborator'}
                        </Badge>
                        {inv.status === 'pending'  && <Badge variant="amber" size="sm" dot>Pending</Badge>}
                        {inv.status === 'accepted' && <Badge variant="green" size="sm" dot>Accepted</Badge>}
                        {inv.status === 'rejected' && <Badge variant="red"   size="sm" dot>Rejected</Badge>}
                      </div>

                      <p className="text-xs text-slate-400 mt-1">
                        Invited by <span className="text-slate-300 font-medium">{owner?.name || 'Unknown'}</span>
                        <span className="text-slate-600"> • {timeAgo(inv.invitedAt)}</span>
                      </p>

                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1"><Users size={11} /> {memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                        <span className="inline-flex items-center gap-1"><Calendar size={11} /> Created {formatDate(inv.project.createdAt)}</span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">{inv.project.description}</p>

                      {/* Actions */}
                      {inv.status === 'pending' && (
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            size="sm"
                            leftIcon={<Check size={13} />}
                            loading={isPending === 'accepting'}
                            disabled={!!isPending}
                            onClick={() => handleRespond(inv.project, inv, true)}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            leftIcon={<X size={13} />}
                            loading={isPending === 'rejecting'}
                            disabled={!!isPending}
                            onClick={() => handleRespond(inv.project, inv, false)}
                          >
                            Reject
                          </Button>
                          <Link to={`/projects/${inv.project.id}`} className="ml-auto text-xs text-slate-400 hover:text-brand-400 inline-flex items-center gap-1 transition-colors">
                            View project <ArrowRight size={11} />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PageWrapper>
  );
}
