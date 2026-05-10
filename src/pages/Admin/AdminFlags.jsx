/**
 * AdminFlags.jsx — Flagged-projects & student-appeals queue
 *
 * COVERS:
 *   Req 59 — Admin can flag inappropriate projects (with reason) — re-uses
 *            the shared <FlagModal> component already used by faculty/recruiters.
 *   Req 62 — View list of flagged projects.
 *   Req 63 — View list of appeals sent by students.
 *   Req 64 — Activate / deactivate any project.
 *   Bonus  — Resolve appeals (accept = unflag, reject = keep flag).
 *
 * REACT CONCEPTS USED:
 *   useState() — Tabs, modals, loading state, action target.
 *   useMemo()  — Derives the flagged & appeal buckets from the projects array.
 *   useDataContext() — Reads projects/users + calls unflagProject, resolveAppeal,
 *                      setProjectActive.
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Flag, Inbox, ShieldOff, ShieldCheck, MessageSquareWarning,
  CheckCircle2, XCircle, Power, PowerOff, ExternalLink, Calendar,
  AlertTriangle,
} from 'lucide-react';
import PageWrapper        from '@/components/layout/PageWrapper';
import Button             from '@/components/common/Button';
import Badge              from '@/components/common/Badge';
import Tabs               from '@/components/common/Tabs';
import ConfirmDialog      from '@/components/common/ConfirmDialog';
import { useDataContext } from '@/context/DataContext';
import { formatDate, timeAgo } from '@/utils/formatters';

export default function AdminFlags() {
  const {
    projects, users,
    unflagProject, resolveAppeal, setProjectActive,
  } = useDataContext();

  /* ── Action confirmations ────────────────────────────── */
  const [confirm, setConfirm] = useState(null); // { type, project, ... }
  const [busy, setBusy]       = useState(false);

  /* ── Buckets ─────────────────────────────────────────── */
  const flaggedProjects = useMemo(
    () => projects.filter((p) => p.isFlagged).sort((a, b) => new Date(b.flaggedAt || 0) - new Date(a.flaggedAt || 0)),
    [projects]
  );

  const projectsWithAppeals = useMemo(
    () => projects
      .filter((p) => p.appeal)
      .sort((a, b) => {
        if (a.appeal.status === 'pending' && b.appeal.status !== 'pending') return -1;
        if (a.appeal.status !== 'pending' && b.appeal.status === 'pending') return 1;
        return new Date(b.appeal.sentAt || 0) - new Date(a.appeal.sentAt || 0);
      }),
    [projects]
  );

  const inactiveProjects = useMemo(
    () => projects.filter((p) => p.isActive === false),
    [projects]
  );

  const allProjects = useMemo(
    () => [...projects].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [projects]
  );

  /* ── Action handlers ─────────────────────────────────── */
  const handleConfirm = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.type === 'unflag')        await unflagProject(confirm.project.id);
      if (confirm.type === 'resolveAppeal') await resolveAppeal(confirm.project.id, confirm.accept);
      if (confirm.type === 'toggleActive')  await setProjectActive(confirm.project.id, !confirm.project.isActive);
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  /* ── Render helpers ──────────────────────────────────── */
  const renderProjectRow = (p, extras = null) => {
    const owner    = users.find((u) => u.id === p.ownerId);
    const flagger  = users.find((u) => u.id === p.flaggedBy);
    return (
      <div key={p.id} className="card p-4">
        <div className="flex items-start gap-3">
          <img
            src={p.thumbnail}
            alt=""
            className="w-14 h-14 rounded-lg object-cover bg-surface-700 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/projects/${p.id}`}
                className="font-semibold text-slate-200 hover:text-brand-300 transition-colors truncate"
              >
                {p.title}
              </Link>
              {p.isFlagged && <Badge variant="red"   size="sm" dot>Flagged</Badge>}
              {p.isActive === false && <Badge variant="amber" size="sm" dot>Deactivated</Badge>}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              by <span className="text-slate-400">{owner?.name || 'Unknown'}</span>
              {p.flaggedAt && <> · flagged {timeAgo(p.flaggedAt)}{flagger ? ` by ${flagger.name}` : ''}</>}
            </p>
            {p.flagReason && (
              <p className="text-xs text-red-300/90 mt-2 leading-relaxed bg-red-500/5 border border-red-500/20 px-3 py-2 rounded-lg">
                <strong>Flag reason:</strong> {p.flagReason}
              </p>
            )}
            {extras}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <Link to={`/projects/${p.id}`}>
              <Button variant="ghost" size="sm" leftIcon={<ExternalLink size={13} />}>
                View
              </Button>
            </Link>
            {p.isFlagged && (
              <Button
                variant="success"
                size="sm"
                leftIcon={<ShieldCheck size={13} />}
                onClick={() => setConfirm({ type: 'unflag', project: p })}
              >
                Unflag
              </Button>
            )}
            <Button
              variant={p.isActive === false ? 'success' : 'danger'}
              size="sm"
              leftIcon={p.isActive === false ? <Power size={13} /> : <PowerOff size={13} />}
              onClick={() => setConfirm({ type: 'toggleActive', project: p })}
            >
              {p.isActive === false ? 'Activate' : 'Deactivate'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  /* ── Panels ──────────────────────────────────────────── */
  const flaggedPanel = (
    <div className="space-y-3">
      {flaggedProjects.length === 0 ? (
        <div className="card p-10 text-center">
          <ShieldCheck className="mx-auto mb-3 text-emerald-500/60" size={28} />
          <p className="text-sm text-slate-400">No flagged projects right now.</p>
          <p className="text-xs text-slate-500 mt-1">All clear.</p>
        </div>
      ) : (
        flaggedProjects.map((p) => renderProjectRow(p))
      )}
    </div>
  );

  const appealsPanel = (
    <div className="space-y-3">
      {projectsWithAppeals.length === 0 ? (
        <div className="card p-10 text-center">
          <Inbox className="mx-auto mb-3 text-slate-600" size={28} />
          <p className="text-sm text-slate-400">No appeals have been submitted.</p>
        </div>
      ) : (
        projectsWithAppeals.map((p) => {
          const owner    = users.find((u) => u.id === p.ownerId);
          const status   = p.appeal.status;
          return (
            <div key={p.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                  <MessageSquareWarning size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to={`/projects/${p.id}`}
                      className="font-semibold text-slate-200 hover:text-brand-300 transition-colors truncate"
                    >
                      {p.title}
                    </Link>
                    {status === 'pending'  && <Badge variant="amber" size="sm" dot>Pending</Badge>}
                    {status === 'accepted' && <Badge variant="green" size="sm" dot>Accepted</Badge>}
                    {status === 'rejected' && <Badge variant="red"   size="sm" dot>Rejected</Badge>}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Appeal from <span className="text-slate-400">{owner?.name || 'Unknown'}</span> · sent {timeAgo(p.appeal.sentAt)}
                  </p>
                  {p.flagReason && (
                    <p className="text-[11px] text-slate-400 mt-2">
                      <strong className="text-red-300">Original flag:</strong> {p.flagReason}
                    </p>
                  )}
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed bg-surface-900 border border-surface-700 px-3 py-2 rounded-lg">
                    "{p.appeal.message}"
                  </p>
                </div>

                {status === 'pending' ? (
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button
                      variant="success"
                      size="sm"
                      leftIcon={<CheckCircle2 size={13} />}
                      onClick={() => setConfirm({ type: 'resolveAppeal', project: p, accept: true })}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<XCircle size={13} />}
                      onClick={() => setConfirm({ type: 'resolveAppeal', project: p, accept: false })}
                    >
                      Reject
                    </Button>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 shrink-0">
                    <Calendar size={11} />
                    Resolved {p.appeal.resolvedAt ? formatDate(p.appeal.resolvedAt) : '—'}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const inactivePanel = (
    <div className="space-y-3">
      {inactiveProjects.length === 0 ? (
        <div className="card p-10 text-center">
          <ShieldCheck className="mx-auto mb-3 text-emerald-500/60" size={28} />
          <p className="text-sm text-slate-400">No projects are deactivated.</p>
        </div>
      ) : (
        inactiveProjects.map((p) => renderProjectRow(p))
      )}
    </div>
  );

  const allProjectsPanel = (
    <div className="space-y-3">
      {allProjects.length === 0 ? (
        <div className="card p-10 text-center">
          <Inbox className="mx-auto mb-3 text-slate-600" size={28} />
          <p className="text-sm text-slate-400">No projects found.</p>
        </div>
      ) : (
        allProjects.map((p) => renderProjectRow(p))
      )}
    </div>
  );

  /* ── Confirm copy ────────────────────────────────────── */
  const confirmCopy = (() => {
    if (!confirm) return {};
    if (confirm.type === 'unflag') {
      return {
        title: 'Remove flag?',
        message: <>Remove the flag from <strong className="text-slate-200">{confirm.project.title}</strong>? The project owner will be notified.</>,
        confirmLabel: 'Remove flag',
        variant: 'success',
      };
    }
    if (confirm.type === 'resolveAppeal') {
      return {
        title: confirm.accept ? 'Accept appeal?' : 'Reject appeal?',
        message: confirm.accept
          ? <>Accept the appeal on <strong className="text-slate-200">{confirm.project.title}</strong>? The flag will be removed and the student notified.</>
          : <>Reject the appeal on <strong className="text-slate-200">{confirm.project.title}</strong>? The flag will remain in place and the student will be notified.</>,
        confirmLabel: confirm.accept ? 'Accept appeal' : 'Reject appeal',
        variant: confirm.accept ? 'success' : 'danger',
      };
    }
    if (confirm.type === 'toggleActive') {
      const on = confirm.project.isActive === false;
      return {
        title: on ? 'Activate project?' : 'Deactivate project?',
        message: on
          ? <>Reactivate <strong className="text-slate-200">{confirm.project.title}</strong>? It will become visible in search and discovery again.</>
          : <>Deactivate <strong className="text-slate-200">{confirm.project.title}</strong>? It will be hidden from public discovery and search results.</>,
        confirmLabel: on ? 'Activate' : 'Deactivate',
        variant: on ? 'success' : 'danger',
      };
    }
    return {};
  })();

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Flags & appeals</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review reported projects, decide on student appeals, and toggle project visibility.
          </p>
        </div>

        {/* Helpful banner */}
        <div className="card p-4 flex items-center gap-3 border-amber-500/20 bg-amber-500/5">
          <AlertTriangle size={18} className="text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300/90 leading-relaxed">
            You can also flag a project yourself from its project page using the actions menu (req 59).
            Flagged projects remain visible until you deactivate them — use deactivate for severe violations.
          </p>
        </div>

        <Tabs
          tabs={[
            { id: 'all',      label: `All projects (${allProjects.length})`,                         icon: Inbox,                content: allProjectsPanel },
            { id: 'flagged',  label: `Flagged projects (${flaggedProjects.length})`,                 icon: Flag,                 content: flaggedPanel },
            { id: 'appeals',  label: `Appeals (${projectsWithAppeals.filter((p) => p.appeal.status === 'pending').length})`, icon: MessageSquareWarning, content: appealsPanel },
            { id: 'inactive', label: `Deactivated projects (${inactiveProjects.length})`,            icon: ShieldOff,            content: inactivePanel },
          ]}
        />
      </div>

      <ConfirmDialog
        isOpen={!!confirm}
        onCancel={() => setConfirm(null)}
        onConfirm={handleConfirm}
        loading={busy}
        title={confirmCopy.title}
        message={confirmCopy.message}
        confirmLabel={confirmCopy.confirmLabel}
        variant={confirmCopy.variant}
      />
    </PageWrapper>
  );
}
