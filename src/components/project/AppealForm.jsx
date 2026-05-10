/**
 * AppealForm.jsx — Inline appeal-against-flag form
 *
 * PURPOSE:
 *   Implements MS2 requirement 61: a flagged project's owner can submit a
 *   short appeal explaining their point of view. Once submitted, the appeal
 *   is shown back to the owner (read-only) with a "pending review" badge.
 *
 * PROPS:
 *   project    — project object (must have flagReason and possibly appeal)
 *   onSubmit   — async callback(message)
 *
 * REACT CONCEPTS USED:
 *   useState()  — Manages the textarea value, submit loading state, and
 *                 success indicator.
 *   Conditional rendering — If an appeal already exists, the form is replaced
 *                 with a read-only summary showing the message and timestamp.
 */

import { useState } from 'react';
import { ShieldAlert, Send, CheckCircle2 } from 'lucide-react';
import Input  from '@/components/common/Input';
import Button from '@/components/common/Button';
import Badge  from '@/components/common/Badge';
import { formatDate } from '@/utils/formatters';

export default function AppealForm({ project, onSubmit }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async () => {
    if (!message.trim() || message.trim().length < 20) {
      setError('Please provide a clear explanation (min. 20 characters).');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(message.trim());
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5 border-red-500/40 bg-red-500/5">
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert size={18} className="text-red-400" />
        <h3 className="text-sm font-semibold text-red-300">Project Flagged</h3>
      </div>

      <div className="bg-surface-900/60 rounded-lg p-3 mb-4">
        <p className="text-xs text-slate-500 mb-1">Reason given:</p>
        <p className="text-sm text-slate-200">{project.flagReason || '—'}</p>
      </div>

      {project.appeal ? (
        /* ── Existing appeal: read-only ─────────────────────────── */
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span className="text-sm font-medium text-emerald-300">Appeal Submitted</span>
            <Badge variant="amber" size="sm">Pending Review</Badge>
          </div>
          <div className="bg-surface-700/50 rounded-lg p-3">
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{project.appeal.message}</p>
            <p className="text-xs text-slate-500 mt-2">Submitted {formatDate(project.appeal.sentAt)}</p>
          </div>
          <p className="text-xs text-slate-500">
            An administrator will review your appeal. If approved, your project will be reactivated automatically.
          </p>
        </div>
      ) : (
        /* ── New appeal form ─────────────────────────────────────── */
        <div className="space-y-3">
          <p className="text-xs text-slate-400 leading-relaxed">
            If you believe this flag is incorrect, you can submit an appeal explaining your side. Be specific —
            an administrator will review your project and the reason for flagging alongside your appeal.
          </p>
          <Input
            as="textarea"
            value={message}
            onChange={(e) => { setMessage(e.target.value); setError(''); }}
            placeholder="Explain why this flag should be reconsidered…"
            error={error}
            rows={4}
            label="Your appeal"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              leftIcon={<Send size={14} />}
              loading={loading}
              onClick={handleSubmit}
              disabled={!message.trim()}
            >
              Submit Appeal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
