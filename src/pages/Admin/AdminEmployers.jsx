/**
 * AdminEmployers.jsx — Employer (recruiter) application management
 *
 * COVERS:
 *   Req 14 — View list of employers applying to use the platform.
 *   Req 15 — View company details + uploaded documents.
 *   Req 16 — View any uploaded documents inline.
 *   Req 17 — Download any uploaded documents.
 *   Req 18 — Accept / reject companies applying to join.
 *
 * REACT CONCEPTS USED:
 *   useState() — Tabs, selected employer, busy state.
 *   useMemo()  — Splits the recruiters list into pending/accepted/rejected
 *                buckets without re-iterating on every render.
 *   useDataContext() — Reads users + calls respondToEmployerApplication.
 *
 * UI FLOW:
 *   1. Tabs at the top show Pending (default), Accepted, Rejected counts.
 *   2. Each row shows company snapshot + "Review" → opens detail panel.
 *   3. Detail panel embeds DocViewer for each uploaded document so the
 *      admin can preview and download (req 16, 17) without leaving the page.
 *   4. Accept / reject buttons only appear for pending applications.
 */

import { useState, useMemo } from 'react';
import {
  Building2, MapPin, Phone, Mail, Calendar, FileText, CheckCircle2,
  XCircle, ArrowLeft, ShieldCheck, Inbox,
} from 'lucide-react';
import PageWrapper      from '@/components/layout/PageWrapper';
import Button           from '@/components/common/Button';
import Badge            from '@/components/common/Badge';
import DocViewer        from '@/components/common/DocViewer';
import ConfirmDialog    from '@/components/common/ConfirmDialog';
import { useDataContext } from '@/context/DataContext';
import { formatDate }    from '@/utils/formatters';

const TABS = [
  { id: 'pending',  label: 'Pending review' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'rejected', label: 'Rejected' },
];

export default function AdminEmployers() {
  const { users, respondToEmployerApplication } = useDataContext();

  const [tab, setTab]               = useState('pending');
  const [selected, setSelected]     = useState(null);
  const [confirm, setConfirm]       = useState(null); // { employer, accept }
  const [busy, setBusy]             = useState(false);

  /* ── Derived buckets ─────────────────────────────────────── */
  const buckets = useMemo(() => {
    const recruiters = users.filter((u) => u.role === 'recruiter');
    return {
      pending:  recruiters.filter((u) => (u.applicationStatus || 'pending') === 'pending'),
      accepted: recruiters.filter((u) => u.applicationStatus === 'accepted'),
      rejected: recruiters.filter((u) => u.applicationStatus === 'rejected'),
    };
  }, [users]);

  const visible = buckets[tab];

  /* ── Actions ─────────────────────────────────────────────── */
  const handleConfirm = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await respondToEmployerApplication(confirm.employer.id, confirm.accept);
      setSelected(null);
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  /* ── Detail view for a single employer ───────────────────── */
  if (selected) {
    const e = users.find((u) => u.id === selected.id) || selected;
    return (
      <PageWrapper>
        <div className="max-w-4xl mx-auto space-y-6">
          <button
            onClick={() => setSelected(null)}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft size={14} /> Back to applications
          </button>

          {/* Company header */}
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500/30 to-accent-500/30 border border-brand-500/40 flex items-center justify-center shrink-0">
                <Building2 size={26} className="text-brand-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-100">{e.company}</h1>
                  {e.applicationStatus === 'pending'  && <Badge variant="amber" size="sm" dot>Pending</Badge>}
                  {e.applicationStatus === 'accepted' && <Badge variant="green" size="sm" dot>Accepted</Badge>}
                  {e.applicationStatus === 'rejected' && <Badge variant="red"   size="sm" dot>Rejected</Badge>}
                </div>
                <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{e.companyBio}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-xs">
                  {e.companyAddress && (
                    <span className="flex items-center gap-2 text-slate-400">
                      <MapPin size={12} className="text-slate-500" /> {e.companyAddress}
                    </span>
                  )}
                  {e.companyPhone && (
                    <span className="flex items-center gap-2 text-slate-400">
                      <Phone size={12} className="text-slate-500" /> {e.companyPhone}
                    </span>
                  )}
                  <span className="flex items-center gap-2 text-slate-400">
                    <Calendar size={12} className="text-slate-500" /> Applied {formatDate(e.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact person */}
          <div className="card p-5">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-3">Primary contact</p>
            <div className="flex items-center gap-3">
              <img
                src={e.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${e.id}`}
                alt={e.name}
                className="w-11 h-11 rounded-full bg-surface-700"
              />
              <div className="min-w-0">
                <p className="font-medium text-slate-200">{e.name}</p>
                <p className="text-xs text-slate-500">{e.jobTitle || 'Recruiter'}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Mail size={11} /> {e.email}
                </p>
              </div>
            </div>
          </div>

          {/* Documents — req 15, 16, 17 */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Submitted documents</p>
              <span className="text-xs text-slate-500">{(e.companyDocs || []).length} file(s)</span>
            </div>
            {(e.companyDocs || []).length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">
                <FileText className="mx-auto mb-2 text-slate-600" size={28} />
                No documents uploaded by this company.
              </div>
            ) : (
              <div className="space-y-2">
                {(e.companyDocs || []).map((doc) => (
                  <DocViewer key={doc.id} file={doc} />
                ))}
              </div>
            )}
          </div>

          {/* Action buttons (only when pending) */}
          {(e.applicationStatus || 'pending') === 'pending' && (
            <div className="card p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-brand-400" />
                  Once accepted, this employer can post internships and contact students immediately.
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    leftIcon={<XCircle size={15} />}
                    onClick={() => setConfirm({ employer: e, accept: false })}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="success"
                    leftIcon={<CheckCircle2 size={15} />}
                    onClick={() => setConfirm({ employer: e, accept: true })}
                  >
                    Accept
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <ConfirmDialog
          isOpen={!!confirm}
          onCancel={() => setConfirm(null)}
          onConfirm={handleConfirm}
          loading={busy}
          title={confirm?.accept ? 'Accept application?' : 'Reject application?'}
          message={
            confirm?.accept
              ? `Approve ${confirm.employer.company}'s application? They'll be notified and can sign in immediately.`
              : `Reject ${confirm?.employer.company}'s application? They'll be notified that their application has been rejected.`
          }
          confirmLabel={confirm?.accept ? 'Accept' : 'Reject'}
          variant={confirm?.accept ? 'success' : 'danger'}
        />
      </PageWrapper>
    );
  }

  /* ── List view ────────────────────────────────────────────── */
  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Employer applications</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review companies applying to use the platform, view their documents, and approve or reject each.
          </p>
        </div>

        {/* Tabs */}
        <div className="card p-1 flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                tab === t.id
                  ? 'bg-brand-600/20 text-brand-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-700',
              ].join(' ')}
            >
              {t.label}
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] rounded-full bg-surface-900 text-slate-300">
                {buckets[t.id].length}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        {visible.length === 0 ? (
          <div className="card p-10 text-center">
            <Inbox className="mx-auto mb-3 text-slate-600" size={32} />
            <p className="text-sm text-slate-400">
              {tab === 'pending'  && 'There are no employer applications waiting for review.'}
              {tab === 'accepted' && 'No employers have been accepted yet.'}
              {tab === 'rejected' && 'No employers have been rejected.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visible.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelected(e)}
                className="card p-5 text-left hover:border-brand-500/50 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500/30 to-accent-500/30 border border-brand-500/40 flex items-center justify-center shrink-0">
                    <Building2 size={20} className="text-brand-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-200 group-hover:text-brand-300 transition-colors truncate">{e.company}</h3>
                    <p className="text-xs text-slate-500 truncate">{e.companyAddress || '—'}</p>
                    <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1"><FileText size={11} /> {(e.companyDocs || []).length} document(s)</span>
                      <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(e.createdAt)}</span>
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-surface-700 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Contact: {e.name}</span>
                  <span className="text-xs text-brand-400 font-medium group-hover:underline">Review →</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
