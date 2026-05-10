/**
 * FlagModal.jsx — Report-inappropriate-project dialog
 *
 * PURPOSE:
 *   Implements MS2 requirement 59: any logged-in user can flag a project for
 *   plagiarism, inappropriate content, etc., and a reason MUST be included.
 *   The owner of the flagged project receives a notification (req 60) and
 *   can submit an appeal (req 61) which is shown via AppealForm.
 *
 * PROPS:
 *   isOpen     — boolean
 *   projectTitle — string for context in the modal heading
 *   onSubmit   — async callback(reason)
 *   onClose    — close callback
 *
 * REACT CONCEPTS USED:
 *   useState() — Tracks the selected category, free-text reason, and submit
 *                loading state.
 *   Composition — Wraps the existing Modal. Uses radio-style category buttons
 *                 plus a textarea for the explanation.
 */

import { useState } from 'react';
import { Flag } from 'lucide-react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

const CATEGORIES = [
  { id: 'plagiarism',   label: 'Plagiarism / academic dishonesty' },
  { id: 'inappropriate', label: 'Inappropriate or offensive content' },
  { id: 'spam',         label: 'Spam or misleading information' },
  { id: 'copyright',    label: 'Copyright / IP violation' },
  { id: 'other',        label: 'Other' },
];

export default function FlagModal({ isOpen, projectTitle, onSubmit, onClose }) {
  const [category, setCategory] = useState('plagiarism');
  const [reason, setReason]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) { setError('Please describe the issue (min. 10 characters).'); return; }
    if (reason.trim().length < 10) { setError('Please provide more detail (min. 10 characters).'); return; }
    setLoading(true);
    try {
      const fullReason = `[${CATEGORIES.find((c) => c.id === category).label}] ${reason.trim()}`;
      await onSubmit(fullReason);
      setCategory('plagiarism');
      setReason('');
      setError('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Flag this Project"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="danger" leftIcon={<Flag size={14} />} loading={loading} onClick={handleSubmit}>
            Submit Flag
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <Flag size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/90 leading-relaxed">
            You're reporting <span className="font-semibold">{projectTitle}</span> as inappropriate.
            Flagging will notify the project owner and queue the project for administrator review.
            Please provide a clear, factual reason — false reports may be flagged themselves.
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300 block mb-2">Category</label>
          <div className="space-y-1.5">
            {CATEGORIES.map((c) => (
              <label
                key={c.id}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer border transition-colors ${
                  category === c.id
                    ? 'bg-red-500/10 border-red-500/40 text-red-200'
                    : 'bg-surface-700 border-surface-600 text-slate-300 hover:border-surface-500'
                }`}
              >
                <input
                  type="radio"
                  name="flag-category"
                  value={c.id}
                  checked={category === c.id}
                  onChange={(e) => setCategory(e.target.value)}
                  className="accent-red-500"
                />
                <span className="text-sm">{c.label}</span>
              </label>
            ))}
          </div>
        </div>

        <Input
          as="textarea"
          label="Reason for flagging"
          value={reason}
          onChange={(e) => { setReason(e.target.value); setError(''); }}
          placeholder="Describe the issue with specific details so administrators can investigate…"
          error={error}
          rows={4}
          required
        />
      </div>
    </Modal>
  );
}
