/**
 * FeedbackList.jsx — Project feedback / comments section
 *
 * PURPOSE:
 *   Displays all feedback entries for a project and provides a form to
 *   submit new feedback. The original author of any feedback can edit or
 *   remove it (faculty req 15).
 *
 * PROPS:
 *   feedback         — Array of feedback objects already stored on the project.
 *   projectId        — String; used when submitting / editing / removing.
 *   onAddFeedback    — async (projectId, feedbackObj) => void
 *   onEditFeedback   — async (projectId, feedbackId, updates) => void   (req 15)
 *   onRemoveFeedback — async (projectId, feedbackId) => void            (req 15)
 *   users            — Array of all users (for resolving author avatars/titles).
 *
 * REACT CONCEPTS USED:
 *   useState()  — Manages composer fields, per-row "editing" state, and the
 *                 pending state for every async action.
 *   Optimistic flow — Submit/edit/remove disable the form while pending;
 *                     state is rolled back automatically by DataContext.
 */

import { useState } from 'react';
import {
  Star, MessageSquarePlus, Send, Edit2, Trash2, Save, X, Pencil,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { timeAgo } from '@/utils/formatters';
import Button from '@/components/common/Button';
import ConfirmDialog from '@/components/common/ConfirmDialog';

function StarRating({ value, onChange, readonly = false, size = 16 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          className={`transition-colors ${readonly ? 'cursor-default' : 'hover:text-amber-400 cursor-pointer'}`}
          disabled={readonly}
        >
          <Star
            size={size}
            fill={star <= value ? 'currentColor' : 'none'}
            className={star <= value ? 'text-amber-400' : 'text-slate-600'}
          />
        </button>
      ))}
    </div>
  );
}

function FeedbackRow({ fb, author, isMine, onEdit, onRemove }) {
  const [editing, setEditing]       = useState(false);
  const [content, setContent]       = useState(fb.content);
  const [rating, setRating]         = useState(fb.rating);
  const [busy, setBusy]             = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setBusy(true);
    try {
      await onEdit(fb.id, { content: content.trim(), rating });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    try {
      await onRemove(fb.id);
    } finally {
      setBusy(false);
      setConfirmDel(false);
    }
  };

  return (
    <li className="card p-4">
      <div className="flex items-start gap-3">
        <img
          src={author?.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fb.authorName}`}
          alt={fb.authorName}
          className="w-9 h-9 rounded-full bg-surface-700 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
            <div>
              <span className="text-sm font-semibold text-slate-200">{fb.authorName}</span>
              <span className="ml-2 text-xs text-accent-400 capitalize">
                {author?.title || author?.role || 'Reviewer'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <StarRating value={editing ? rating : fb.rating} onChange={setRating} readonly={!editing} />
              <span className="text-xs text-slate-500">
                {timeAgo(fb.createdAt)}
                {fb.editedAt && <span className="italic"> · edited</span>}
              </span>
            </div>
          </div>

          {editing ? (
            <div className="space-y-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="input-base resize-y min-h-[80px] text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" leftIcon={<Save size={13} />} onClick={handleSave} loading={busy} disabled={!content.trim()}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" leftIcon={<X size={13} />} onClick={() => { setEditing(false); setContent(fb.content); setRating(fb.rating); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-300 leading-relaxed">{fb.content}</p>
          )}

          {/* Owner controls — only the original author sees these (req 15) */}
          {isMine && !editing && (
            <div className="flex items-center gap-1 mt-2 -ml-1">
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-surface-700 transition-colors flex items-center gap-1 text-[11px]"
              >
                <Pencil size={11} /> Edit
              </button>
              <button
                onClick={() => setConfirmDel(true)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-surface-700 transition-colors flex items-center gap-1 text-[11px]"
              >
                <Trash2 size={11} /> Remove
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDel}
        title="Remove your feedback?"
        message="This will permanently delete your feedback comment and rating from this project."
        confirmLabel="Yes, remove"
        loading={busy}
        onCancel={() => setConfirmDel(false)}
        onConfirm={handleRemove}
      />
    </li>
  );
}

export default function FeedbackList({
  feedback = [], projectId, users = [],
  onAddFeedback, onEditFeedback, onRemoveFeedback,
}) {
  const { currentUser } = useAuth();
  const [content, setContent]     = useState('');
  const [rating, setRating]       = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await onAddFeedback(projectId, {
        authorId:   currentUser.id,
        authorName: currentUser.name,
        content:    content.trim(),
        rating,
      });
      setContent('');
      setRating(5);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
        <MessageSquarePlus size={20} className="text-brand-400" />
        Feedback
        <span className="ml-1 text-sm font-normal text-slate-500">({feedback.length})</span>
      </h2>

      {/* Existing feedback */}
      {feedback.length === 0 ? (
        <div className="card p-8 text-center text-slate-500 mb-6">
          <MessageSquarePlus size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No feedback yet. Be the first to review this project.</p>
        </div>
      ) : (
        <ul className="space-y-4 mb-6">
          {feedback.map((fb) => (
            <FeedbackRow
              key={fb.id}
              fb={fb}
              author={users.find((u) => u.id === fb.authorId)}
              isMine={currentUser?.id === fb.authorId}
              onEdit={onEditFeedback ? (id, updates) => onEditFeedback(projectId, id, updates) : undefined}
              onRemove={onRemoveFeedback ? (id) => onRemoveFeedback(projectId, id) : undefined}
            />
          ))}
        </ul>
      )}

      {/* Submit form — shown to any authenticated user */}
      {currentUser && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Send size={14} />
            Leave Feedback
          </h3>
          {submitted ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm py-2">
              <Star size={16} fill="currentColor" />
              Feedback submitted successfully!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">Rating:</span>
                <StarRating value={rating} onChange={setRating} />
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts on this project — what works well and what could be improved…"
                className="input-base resize-y min-h-[90px] text-sm"
                required
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={submitting}
                  disabled={!content.trim()}
                  size="sm"
                  leftIcon={<Send size={14} />}
                >
                  Submit Feedback
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
