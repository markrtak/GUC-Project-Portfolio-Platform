/**
 * ProjectActionsMenu.jsx — Owner / viewer actions dropdown for a project
 *
 * PURPOSE:
 *   Centralises the context-menu actions on a project detail page so
 *   ProjectDetail itself stays clean. Available actions depend on role:
 *     - Owner: Edit, Delete, Toggle Visibility
 *     - Anyone (not owner): Flag, Save to favourites
 *
 * PROPS:
 *   project          — project object
 *   isOwner          — boolean
 *   isFavorited      — boolean
 *   onEdit           — callback() (navigation)
 *   onDelete         — async callback()
 *   onToggleVisibility — async callback(newVisibility)
 *   onFlag           — callback() (opens FlagModal)
 *   onToggleFavorite — async callback()
 *
 * REACT CONCEPTS USED:
 *   useState()  — Tracks dropdown open state and confirm-delete dialog.
 *   useRef() + useEffect() — Closes the menu on outside click.
 */

import { useState, useRef, useEffect } from 'react';
import {
  MoreHorizontal, Edit2, Trash2, Eye, EyeOff,
  Flag, Bookmark, BookmarkCheck,
} from 'lucide-react';
import ConfirmDialog from '@/components/common/ConfirmDialog';

export default function ProjectActionsMenu({
  project, isOwner, isFavorited,
  onEdit, onDelete, onToggleVisibility, onFlag, onToggleFavorite, canFlag = true,
}) {
  const [open, setOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isPrivate = project.visibility === 'private';

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-700 transition-colors"
          aria-label="Project actions"
        >
          <MoreHorizontal size={18} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-surface-800 border border-surface-700 rounded-xl shadow-card overflow-hidden animate-slide-down z-30">
            <ul className="py-1">
              {isOwner && (
                <>
                  <li>
                    <button onClick={() => { setOpen(false); onEdit(); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-surface-700 transition-colors">
                      <Edit2 size={14} /> Edit Project
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => { setOpen(false); onToggleVisibility(isPrivate ? 'public' : 'private'); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-surface-700 transition-colors"
                    >
                      {isPrivate ? <Eye size={14} /> : <EyeOff size={14} />}
                      Make {isPrivate ? 'Public' : 'Private'}
                    </button>
                  </li>
                  <li className="border-t border-surface-700">
                    <button
                      onClick={() => { setOpen(false); setConfirmDel(true); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-surface-700 transition-colors"
                    >
                      <Trash2 size={14} /> Delete Project
                    </button>
                  </li>
                </>
              )}

              {!isOwner && (
                <>
                  <li>
                    <button onClick={() => { setOpen(false); onToggleFavorite(); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-surface-700 transition-colors">
                      {isFavorited ? <BookmarkCheck size={14} className="text-amber-400" /> : <Bookmark size={14} />}
                      {isFavorited ? 'Remove from Saved' : 'Save to Favourites'}
                    </button>
                  </li>
                  {canFlag && (
                    <li className="border-t border-surface-700">
                      <button
                        onClick={() => { setOpen(false); onFlag(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-400 hover:bg-surface-700 transition-colors"
                      >
                        <Flag size={14} /> Flag this Project
                      </button>
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDel}
        title="Delete project?"
        message={
          <>
            Are you sure you want to permanently delete <strong className="text-slate-200">{project.title}</strong>?
            All associated tasks, thesis drafts, and feedback will also be removed. This cannot be undone.
          </>
        }
        confirmLabel="Yes, delete"
        onCancel={() => setConfirmDel(false)}
        onConfirm={async () => { await onDelete(); setConfirmDel(false); }}
      />
    </>
  );
}
