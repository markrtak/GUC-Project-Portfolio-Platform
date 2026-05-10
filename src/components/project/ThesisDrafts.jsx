/**
 * ThesisDrafts.jsx — Bachelor-thesis draft manager
 *
 * PURPOSE:
 *   Implements MS2 student requirements 23 & 24:
 *     - Owner can upload multiple thesis drafts
 *     - Owner can mark exactly ONE draft as the Final Draft
 *     - Once a final draft is set, all other drafts become "private"
 *       (visually flagged + filtered out of public views)
 *     - Each draft can be viewed and downloaded via DocViewer
 *
 *   Only rendered when project.type === 'bachelor'.
 *
 * PROPS:
 *   project    — project object
 *   isOwner    — boolean; only owner can upload, remove, or set final
 *   onUpload   — async callback(fileRecord)
 *   onRemove   — async callback(draftId)
 *   onSetFinal — async callback(draftId)
 *
 * REACT CONCEPTS USED:
 *   useState() — Tracks the confirm-dialog state for "set as final" (a
 *                destructive action because it auto-privates all others).
 *   Conditional rendering — public viewers only see the final draft.
 */

import { useState } from 'react';
import { Award, Lock, Star } from 'lucide-react';
import FileUpload from '@/components/common/FileUpload';
import DocViewer  from '@/components/common/DocViewer';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Button from '@/components/common/Button';
import Badge  from '@/components/common/Badge';

export default function ThesisDrafts({ project, isOwner, onUpload, onRemove, onSetFinal }) {
  const drafts = project.thesisDrafts || [];
  const finalDraft = drafts.find((d) => d.isFinal);
  const otherDrafts = drafts.filter((d) => !d.isFinal);

  const [confirmFinalId, setConfirmFinalId] = useState(null);

  // For non-owners: only show the final draft (others are private)
  const visible = isOwner ? drafts : (finalDraft ? [finalDraft] : []);

  return (
    <div className="space-y-5">
      {/* Final draft banner */}
      {finalDraft && (
        <div className="card p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-2">
            <Award size={16} className="text-amber-400" />
            <span className="text-sm font-semibold text-amber-300">Final Thesis Draft</span>
            <Badge variant="amber" size="sm">Public</Badge>
          </div>
          <DocViewer file={finalDraft} />
        </div>
      )}

      {/* Other drafts — owner only */}
      {isOwner && otherDrafts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-slate-300">Other Drafts</span>
            {finalDraft && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Lock size={11} /> Auto-private since a final draft is set
              </span>
            )}
          </div>
          <ul className="space-y-2.5">
            {otherDrafts.map((draft) => (
              <li key={draft.id}>
                <DocViewer
                  file={draft}
                  onRemove={async () => onRemove(draft.id)}
                  actionsRight={
                    !finalDraft && isOwner && (
                      <button
                        onClick={() => setConfirmFinalId(draft.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-surface-600 transition-colors"
                        title="Set as final draft"
                      >
                        <Star size={15} />
                      </button>
                    )
                  }
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload widget — owner only */}
      {isOwner && (
        <FileUpload
          label={drafts.length === 0 ? 'Upload your first thesis draft' : 'Upload another draft'}
          accept=".pdf,.doc,.docx"
          helperText="PDF, DOC, DOCX — max 25 MB"
          onUploaded={onUpload}
        />
      )}

      {/* Empty for public */}
      {!isOwner && visible.length === 0 && (
        <div className="card p-10 text-center text-slate-500">
          <Award size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No final thesis draft published yet.</p>
        </div>
      )}

      {/* Confirm "set as final" — destructive because it privates all others */}
      <ConfirmDialog
        isOpen={!!confirmFinalId}
        title="Mark as Final Draft?"
        message={
          <>
            This will mark the selected document as your <strong className="text-amber-300">Final Draft</strong>.
            All other thesis drafts will automatically become private and visible only to you.
            <br /><br />
            You can change the final draft later, but only one can be marked as final at a time.
          </>
        }
        confirmLabel="Yes, set as Final"
        variant="primary"
        onCancel={() => setConfirmFinalId(null)}
        onConfirm={async () => { await onSetFinal(confirmFinalId); setConfirmFinalId(null); }}
      />
    </div>
  );
}
