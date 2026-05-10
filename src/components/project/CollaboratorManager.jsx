/**
 * CollaboratorManager.jsx — Team & invitations management panel
 *
 * PURPOSE:
 *   Implements MS2 student requirements 25, 26, 27, 31:
 *     - Search collaborators / instructors by first name, last name, or email
 *     - Send / cancel invitations
 *     - View list of all team members and their invitation status
 *     - Owner can remove a collaborator from the project
 *
 * PROPS:
 *   project       — project object
 *   members       — resolved team-member user objects
 *   isOwner       — boolean; only owner can send/cancel/remove
 *   currentUser   — the viewing user
 *   onSearch      — async callback(query, role?) returning user[]
 *   onInvite      — async callback(userId, role)
 *   onCancel      — async callback(inviteId)
 *   onRemove      — async callback(userId)
 *
 * REACT CONCEPTS USED:
 *   useState()    — Search query, debounced search results, role filter for
 *                   the picker (collaborator vs instructor — req 26 says only
 *                   instructors of the project's course can be invited).
 *   useEffect()   — Debounces the search by 300ms so typing doesn't fire
 *                   one search per keystroke.
 */

import { useState, useEffect } from 'react';
import {
  Search, Mail, UserPlus, X, Trash2, CheckCircle, XCircle, Clock, Crown,
} from 'lucide-react';
import Input  from '@/components/common/Input';
import Button from '@/components/common/Button';
import Badge  from '@/components/common/Badge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { timeAgo, getRoleMeta } from '@/utils/formatters';

const STATUS_META = {
  pending:  { label: 'Pending',  icon: Clock,      className: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  accepted: { label: 'Accepted', icon: CheckCircle, className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  rejected: { label: 'Rejected', icon: XCircle,    className: 'bg-red-500/15 text-red-300 border-red-500/30' },
};

export default function CollaboratorManager({ project, members, isOwner, currentUser, onSearch, onInvite, onCancel, onRemove }) {
  const [query, setQuery] = useState('');
  const [role, setRole]   = useState('student');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);

  // Debounced search — req 25
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const found = await onSearch(query, role);
        if (!cancelled) setResults(found);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, role, onSearch]);

  const memberIds   = project.teamMembers || [];
  const inviteIds   = (project.invitations || []).map((inv) => inv.userId);
  const isAlready   = (id) => memberIds.includes(id) || inviteIds.includes(id);

  return (
    <div className="space-y-5">
      {/* ── Current team & invitations ─────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-slate-200 mb-3">
          Team Members ({members.length})
        </h3>
        <ul className="space-y-2">
          {members.map((member) => {
            const isProjectOwner = member.id === project.ownerId;
            return (
              <li key={member.id} className="card p-3 flex items-center gap-3">
                <img src={member.profilePic} alt={member.name} className="w-9 h-9 rounded-full bg-surface-700 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-slate-200 truncate">{member.name}</p>
                    {isProjectOwner && <Badge variant="amber" size="sm" dot>Owner</Badge>}
                    {member.id === currentUser?.id && <span className="text-[11px] text-slate-500">(you)</span>}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{member.email}</p>
                </div>
                <Badge variant="green" size="sm" dot>Accepted</Badge>
                {isOwner && !isProjectOwner && (
                  <button
                    onClick={() => setConfirmRemove(member)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-surface-700 transition-colors"
                    title="Remove collaborator"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Pending / past invitations */}
      {(project.invitations || []).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-200 mb-3">
            Sent Invitations ({(project.invitations || []).length})
          </h3>
          <ul className="space-y-2">
            {(project.invitations || []).map((inv) => {
              const status = STATUS_META[inv.status] ?? STATUS_META.pending;
              const StatusIcon = status.icon;
              const target = members.find((m) => m.id === inv.userId);
              return (
                <li key={inv.id} className="card p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-surface-700 flex items-center justify-center shrink-0 text-slate-500">
                    <Mail size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {target?.name || `User ${inv.userId}`}
                    </p>
                    <p className="text-xs text-slate-500">Invited {timeAgo(inv.invitedAt)}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border ${status.className}`}>
                    <StatusIcon size={11} /> {status.label}
                  </span>
                  {isOwner && inv.status === 'pending' && (
                    <button
                      onClick={() => onCancel(inv.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-surface-700"
                      title="Cancel invitation"
                    >
                      <X size={14} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── Invite picker — owner only ─────────────────────────── */}
      {isOwner && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <UserPlus size={16} className="text-brand-400" /> Invite Collaborators
          </h3>

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setRole('student')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                role === 'student' ? 'bg-brand-600/20 border-brand-500/40 text-brand-300' : 'bg-surface-700 border-surface-600 text-slate-400 hover:text-slate-200'
              }`}
            >
              Student Collaborator
            </button>
            <button
              onClick={() => setRole('faculty')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                role === 'faculty' ? 'bg-accent-500/20 border-accent-500/40 text-accent-300' : 'bg-surface-700 border-surface-600 text-slate-400 hover:text-slate-200'
              }`}
            >
              Course Instructor
            </button>
          </div>

          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by first name, last name, or email…"
            leftIcon={<Search size={15} />}
          />

          {query.trim() && (
            <div className="mt-3">
              {searching ? (
                <p className="text-xs text-slate-500 px-2">Searching…</p>
              ) : results.length === 0 ? (
                <p className="text-xs text-slate-500 px-2">No matches found.</p>
              ) : (
                <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                  {results
                    .filter((u) => u.id !== currentUser?.id)
                    .map((u) => {
                      const already = isAlready(u.id);
                      return (
                        <li key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-700 transition-colors">
                          <img src={u.profilePic} alt={u.name} className="w-8 h-8 rounded-full bg-surface-700 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-200 truncate">{u.name}</p>
                            <p className="text-xs text-slate-500 truncate">{u.email}</p>
                          </div>
                          <Button
                            size="sm"
                            variant={already ? 'ghost' : 'secondary'}
                            disabled={already}
                            onClick={() => onInvite(u.id, role === 'faculty' ? 'instructor' : 'collaborator')}
                          >
                            {already ? 'Already added' : 'Invite'}
                          </Button>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmRemove}
        title="Remove collaborator?"
        message={`Remove ${confirmRemove?.name} from this project? They will lose access to the tasks and project board.`}
        confirmLabel="Remove"
        onCancel={() => setConfirmRemove(null)}
        onConfirm={async () => { await onRemove(confirmRemove.id); setConfirmRemove(null); }}
      />
    </div>
  );
}
