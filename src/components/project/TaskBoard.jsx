/**
 * TaskBoard.jsx — Project task list with drag/reorder, status changes, comments
 *
 * PURPOSE:
 *   Implements MS2 student requirements 32, 33, 34, and 40:
 *     - Project owner can create / edit / delete tasks
 *     - Each task has description, assignee, status, deadline
 *     - Tasks can be reordered (up/down arrows — works without an external lib)
 *     - Collaborators can change ONLY the status of their own tasks
 *     - Instructor comments are visible to project members
 *
 * PROPS:
 *   project      — the project object
 *   members      — full user list of team members (with assignee details)
 *   isOwner      — boolean; only owners can create/edit/delete/reorder
 *   currentUser  — the viewing user (used to gate per-row controls)
 *   onCreate     — async callback(taskData)
 *   onUpdate     — async callback(taskId, updates)
 *   onDelete     — async callback(taskId)
 *   onReorder    — async callback(orderedIds)
 *
 * REACT CONCEPTS USED:
 *   useState()   — Manages the new-task form, the task-being-edited id, and
 *                  pending UI state.
 *   Optimistic updates — onMove updates the local order array immediately,
 *                  then calls the async onReorder handler; the persisted
 *                  state arrives shortly after.
 */

import { useState, useMemo } from 'react';
import {
  Plus, Trash2, Edit2, Save, X, ArrowUp, ArrowDown,
  CheckCircle2, Circle, PauseCircle, Calendar, MessageCircle, User as UserIcon,
  Send, Pencil,
} from 'lucide-react';
import Button from '@/components/common/Button';
import Input  from '@/components/common/Input';
import Badge  from '@/components/common/Badge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { formatDate, timeAgo } from '@/utils/formatters';

const STATUS_META = {
  pending:    { label: 'Pending',    icon: Circle,        className: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
  postponed:  { label: 'Post-poned', icon: PauseCircle,   className: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  completed:  { label: 'Completed',  icon: CheckCircle2,  className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
};

function StatusPicker({ status, onChange, disabled }) {
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
    >
      {Object.entries(STATUS_META).map(([k, m]) => (
        <option key={k} value={k}>{m.label}</option>
      ))}
    </select>
  );
}

function TaskComment({ comment, author, isMine, onEdit, onRemove }) {
  const [editing, setEditing]       = useState(false);
  const [content, setContent]       = useState(comment.content);
  const [busy, setBusy]             = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setBusy(true);
    try { await onEdit(comment.id, content.trim()); setEditing(false); }
    finally { setBusy(false); }
  };

  return (
    <div className="bg-surface-700/50 rounded-lg p-2.5">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={author?.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorId || 'user'}`}
            alt=""
            className="w-5 h-5 rounded-full bg-surface-700 shrink-0"
          />
          <span className="text-xs font-medium text-slate-200 truncate">
            {author?.name || 'Unknown'}
          </span>
          <span className="text-[10px] text-slate-500">
            {timeAgo(comment.createdAt)}
            {comment.editedAt && <span className="italic"> · edited</span>}
          </span>
        </div>
        {isMine && !editing && (
          <div className="flex items-center -mr-1">
            <button onClick={() => setEditing(true)} className="p-1 rounded text-slate-500 hover:text-brand-400 hover:bg-surface-600 transition-colors" title="Edit comment"><Pencil size={11} /></button>
            <button onClick={() => setConfirmDel(true)} className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-surface-600 transition-colors" title="Remove comment"><Trash2 size={11} /></button>
          </div>
        )}
      </div>
      {editing ? (
        <div className="space-y-1.5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input-base resize-y min-h-[50px] text-xs"
          />
          <div className="flex gap-1.5">
            <Button size="sm" leftIcon={<Save size={11} />} onClick={handleSave} loading={busy} disabled={!content.trim()}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setContent(comment.content); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-300 leading-relaxed">{comment.content}</p>
      )}

      <ConfirmDialog
        isOpen={confirmDel}
        title="Remove comment?"
        message="This will permanently delete this comment from the task."
        confirmLabel="Remove"
        loading={busy}
        onCancel={() => setConfirmDel(false)}
        onConfirm={async () => { await onRemove(comment.id); setConfirmDel(false); }}
      />
    </div>
  );
}

function TaskRow({
  task, members, isOwner, isAssignee, currentUser,
  onUpdate, onDelete, onMoveUp, onMoveDown, canMoveUp, canMoveDown,
  onAddComment, onEditComment, onRemoveComment,
}) {
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({
    description: task.description,
    assigneeId:  task.assigneeId,
    deadline:    task.deadline ? task.deadline.slice(0, 10) : '',
  });
  const [confirmDel, setConfirmDel] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const assignee = members.find((m) => m.id === task.assigneeId);
  const meta = STATUS_META[task.status] ?? STATUS_META.pending;
  const StatusIcon = meta.icon;
  const comments = task.instructorComments || [];

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      await onAddComment(task.id, newComment.trim());
      setNewComment('');
    } finally {
      setPostingComment(false);
    }
  };

  const handleSave = async () => {
    await onUpdate(task.id, {
      description: edit.description,
      assigneeId:  edit.assigneeId,
      deadline:    edit.deadline ? new Date(edit.deadline).toISOString() : null,
    });
    setEditing(false);
  };

  return (
    <li className="card p-4">
      {editing ? (
        <div className="space-y-3">
          <Input value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} placeholder="Task description" />
          <div className="grid grid-cols-2 gap-3">
            <select value={edit.assigneeId} onChange={(e) => setEdit({ ...edit, assigneeId: e.target.value })} className="input-base text-sm py-2">
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <Input type="date" value={edit.deadline} onChange={(e) => setEdit({ ...edit, deadline: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" leftIcon={<Save size={13} />} onClick={handleSave}>Save</Button>
            <Button size="sm" variant="ghost" leftIcon={<X size={13} />} onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          {/* Reorder controls — owner only */}
          {isOwner && (
            <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
              <button onClick={onMoveUp}   disabled={!canMoveUp}   className="p-0.5 rounded text-slate-500 hover:text-brand-400 disabled:opacity-30 disabled:cursor-not-allowed" title="Move up">  <ArrowUp size={13} /></button>
              <button onClick={onMoveDown} disabled={!canMoveDown} className="p-0.5 rounded text-slate-500 hover:text-brand-400 disabled:opacity-30 disabled:cursor-not-allowed" title="Move down"><ArrowDown size={13} /></button>
            </div>
          )}

          {/* Status icon */}
          <StatusIcon size={18} className={`mt-0.5 shrink-0 ${task.status === 'completed' ? 'text-emerald-400' : task.status === 'postponed' ? 'text-amber-400' : 'text-slate-500'}`} />

          {/* Body */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm leading-snug ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
              {task.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
              {assignee && (
                <span className="inline-flex items-center gap-1">
                  <UserIcon size={11} /> {assignee.name}
                </span>
              )}
              {task.deadline && (
                <span className="inline-flex items-center gap-1">
                  <Calendar size={11} /> Due {formatDate(task.deadline)}
                </span>
              )}
              <button
                onClick={() => setShowComments((s) => !s)}
                className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 transition-colors"
              >
                <MessageCircle size={11} />
                {comments.length === 0
                  ? 'Add comment'
                  : `${comments.length} comment${comments.length !== 1 ? 's' : ''}`}
              </button>
            </div>

            {showComments && (
              <div className="mt-3 space-y-2 pl-3 border-l-2 border-brand-500/40">
                {comments.map((c) => (
                  <TaskComment
                    key={c.id}
                    comment={c}
                    author={members.find((m) => m.id === c.authorId) || { id: c.authorId, name: 'Reviewer' }}
                    isMine={currentUser?.id === c.authorId}
                    onEdit={(commentId, content) => onEditComment(task.id, commentId, content)}
                    onRemove={(commentId) => onRemoveComment(task.id, commentId)}
                  />
                ))}
                {/* Composer — any authenticated user can leave a task comment */}
                {currentUser && onAddComment && (
                  <div className="flex gap-2 pt-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Leave a comment on this task…"
                      className="input-base resize-y min-h-[40px] text-xs flex-1"
                    />
                    <Button
                      size="sm"
                      leftIcon={<Send size={12} />}
                      onClick={handlePostComment}
                      loading={postingComment}
                      disabled={!newComment.trim()}
                    >
                      Post
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status change — owner OR assignee */}
          {(isOwner || isAssignee) && (
            <StatusPicker status={task.status} onChange={(s) => onUpdate(task.id, { status: s })} />
          )}

          {/* Owner-only edit / delete */}
          {isOwner && (
            <div className="flex items-center shrink-0">
              <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-surface-700" title="Edit task"><Edit2 size={14} /></button>
              <button onClick={() => setConfirmDel(true)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-surface-700" title="Delete task"><Trash2 size={14} /></button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDel}
        title="Delete task?"
        message={`Delete the task "${task.description}"? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setConfirmDel(false)}
        onConfirm={async () => { await onDelete(task.id); setConfirmDel(false); }}
      />
    </li>
  );
}

export default function TaskBoard({
  project, members, isOwner, currentUser,
  onCreate, onUpdate, onDelete, onReorder,
  onAddComment, onEditComment, onRemoveComment,
}) {
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTask, setNewTask] = useState({ description: '', assigneeId: project.ownerId, deadline: '' });

  const sorted = useMemo(
    () => [...(project.tasks || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [project.tasks]
  );

  const handleCreate = async () => {
    if (!newTask.description.trim()) return;
    setCreating(true);
    try {
      await onCreate({
        description: newTask.description.trim(),
        assigneeId:  newTask.assigneeId,
        deadline:    newTask.deadline ? new Date(newTask.deadline).toISOString() : null,
      });
      setNewTask({ description: '', assigneeId: project.ownerId, deadline: '' });
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  };

  const handleMove = async (idx, direction) => {
    const next = [...sorted];
    const target = idx + direction;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    await onReorder(next.map((t) => t.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {sorted.length} task{sorted.length !== 1 ? 's' : ''}
          {isOwner && sorted.length > 1 && <span className="ml-2 text-slate-600">• Use arrows to reorder</span>}
        </p>
        {isOwner && !showForm && (
          <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowForm(true)}>Add Task</Button>
        )}
      </div>

      {/* New-task form */}
      {showForm && isOwner && (
        <div className="card p-4 space-y-3">
          <Input
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            placeholder="Task description (one line)"
            label="Description"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Assignee</label>
              <select
                value={newTask.assigneeId}
                onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
                className="input-base text-sm py-2"
              >
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <Input
              label="Deadline"
              type="date"
              value={newTask.deadline}
              onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" loading={creating} onClick={handleCreate} disabled={!newTask.description.trim()}>Create Task</Button>
          </div>
        </div>
      )}

      {/* List */}
      {sorted.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          <CheckCircle2 size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No tasks yet.</p>
          {isOwner && <p className="text-xs mt-1">Add tasks to track project progress.</p>}
        </div>
      ) : (
        <ul className="space-y-2.5">
          {sorted.map((task, idx) => (
            <TaskRow
              key={task.id}
              task={task}
              members={members}
              isOwner={isOwner}
              isAssignee={task.assigneeId === currentUser?.id}
              currentUser={currentUser}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onMoveUp={()   => handleMove(idx, -1)}
              onMoveDown={() => handleMove(idx, +1)}
              canMoveUp={idx > 0}
              canMoveDown={idx < sorted.length - 1}
              onAddComment={onAddComment ? (taskId, content) => onAddComment(taskId, content) : undefined}
              onEditComment={onEditComment ? (taskId, commentId, content) => onEditComment(taskId, commentId, content) : undefined}
              onRemoveComment={onRemoveComment ? (taskId, commentId) => onRemoveComment(taskId, commentId) : undefined}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
