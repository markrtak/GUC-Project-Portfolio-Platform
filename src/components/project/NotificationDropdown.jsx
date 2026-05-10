/**
 * NotificationDropdown.jsx — Notification panel dropdown
 *
 * COVERS:
 *   Faculty req 12 — view list of all notifications
 *   Faculty req 13 — mark notifications as read / unread
 *   Faculty req 33 — turn off all notifications (global mute toggle)
 *
 * PROPS:
 *   notifications        — Array of notification objects from the user's profile.
 *   notificationsEnabled — boolean, current global mute state.
 *   onMarkRead           — function(notifId)
 *   onMarkAllRead        — optional function() — single batch action (preferred over many onMarkRead)
 *   onMarkUnread         — function(notifId)
 *   onToggleEnabled      — async function(nextValue: boolean)
 *   onClose              — function() to close the panel.
 *
 * REACT CONCEPTS USED:
 *   useState() — Toggle pending state for the global mute switch.
 *   Conditional rendering — Empty state, "muted" state, and the regular list.
 */

import { useState } from 'react';
import {
  Bell, BellOff, CheckCheck, RotateCcw, MessageSquare, Users, Star,
  Flag, Building2, BookOpen, Briefcase, Inbox, ShieldCheck,
} from 'lucide-react';
import { timeAgo } from '@/utils/formatters';

const typeIconMap = {
  feedback:              MessageSquare,
  invitation:            Users,
  collab:                Users,
  review:                Star,
  flag:                  Flag,
  appeal:                Flag,
  message:               MessageSquare,
  'employer-application': Building2,
  'link-request':        BookOpen,
  internship:            Briefcase,
  project:               ShieldCheck,
};

const typeColorMap = {
  feedback:              'bg-brand-500/20 text-brand-400',
  invitation:            'bg-accent-500/20 text-accent-400',
  collab:                'bg-accent-500/20 text-accent-400',
  review:                'bg-amber-500/20 text-amber-400',
  flag:                  'bg-red-500/20 text-red-400',
  appeal:                'bg-amber-500/20 text-amber-400',
  message:               'bg-brand-500/20 text-brand-400',
  'employer-application': 'bg-emerald-500/20 text-emerald-400',
  'link-request':        'bg-accent-500/20 text-accent-400',
  internship:            'bg-emerald-500/20 text-emerald-400',
  project:               'bg-brand-500/20 text-brand-400',
};

export default function NotificationDropdown({
  notifications = [],
  notificationsEnabled = true,
  onMarkRead,
  onMarkAllRead,
  onMarkUnread,
  onToggleEnabled,
}) {
  const [muting, setMuting] = useState(false);

  const sorted = [...notifications].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleToggleMute = async () => {
    if (!onToggleEnabled || muting) return;
    setMuting(true);
    try { await onToggleEnabled(!notificationsEnabled); }
    finally { setMuting(false); }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-surface-800 border border-surface-700 rounded-xl shadow-card overflow-hidden animate-slide-down z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700">
        <div className="flex items-center gap-2">
          {notificationsEnabled
            ? <Bell    size={15} className="text-slate-400" />
            : <BellOff size={15} className="text-amber-400" />}
          <h3 className="text-sm font-semibold text-slate-200">Notifications</h3>
          {unreadCount > 0 && notificationsEnabled && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (onMarkAllRead || onMarkRead) && (
          <button
            type="button"
            onClick={() => {
              if (onMarkAllRead) onMarkAllRead();
              else notifications.filter((n) => !n.read).forEach((n) => onMarkRead(n.id));
            }}
            className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
          >
            <CheckCheck size={13} /> Mark all read
          </button>
        )}
      </div>

      {/* Mute banner — only when muted (req 33) */}
      {!notificationsEnabled && (
        <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300/90 flex items-center gap-2">
          <BellOff size={14} className="shrink-0" />
          <p className="flex-1">All notifications are muted. New events won't appear here.</p>
        </div>
      )}

      {/* List */}
      <ul className="max-h-80 overflow-y-auto divide-y divide-surface-700/50">
        {sorted.length === 0 ? (
          <li className="flex flex-col items-center gap-2 py-10 text-slate-500">
            <Bell size={28} className="opacity-30" />
            <p className="text-sm">All caught up!</p>
          </li>
        ) : (
          sorted.map((notif) => {
            const Icon = typeIconMap[notif.type] ?? Bell;
            const colorClass = typeColorMap[notif.type] ?? 'bg-surface-700 text-slate-400';
            return (
              <li
                key={notif.id}
                className={`flex gap-3 px-4 py-3 transition-colors ${
                  notif.read ? 'opacity-60' : 'bg-brand-500/5 hover:bg-surface-700/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 leading-relaxed">{notif.message}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{timeAgo(notif.createdAt)}</p>
                </div>
                <div className="shrink-0 flex items-center -mr-1">
                  {notif.read && onMarkUnread && (
                    <button
                      onClick={() => onMarkUnread(notif.id)}
                      className="p-1 rounded text-slate-500 hover:text-brand-400 hover:bg-surface-700 transition-colors"
                      title="Mark as unread"
                    >
                      <RotateCcw size={13} />
                    </button>
                  )}
                  {!notif.read && onMarkRead && (
                    <button
                      onClick={() => onMarkRead(notif.id)}
                      className="p-1 rounded text-slate-500 hover:text-brand-400 hover:bg-surface-700 transition-colors"
                      title="Mark as read"
                    >
                      <CheckCheck size={14} />
                    </button>
                  )}
                </div>
              </li>
            );
          })
        )}
      </ul>

      {/* Settings footer — global mute (req 33) */}
      {onToggleEnabled && (
        <div className="px-4 py-3 border-t border-surface-700 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Inbox size={12} /> {notificationsEnabled ? 'Receiving notifications' : 'Notifications muted'}
          </span>
          <button
            onClick={handleToggleMute}
            disabled={muting}
            className={[
              'text-[11px] font-medium px-2 py-1 rounded-md border transition-colors',
              notificationsEnabled
                ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10',
              muting ? 'opacity-60 cursor-wait' : '',
            ].join(' ')}
          >
            {notificationsEnabled ? 'Turn off all' : 'Turn back on'}
          </button>
        </div>
      )}
    </div>
  );
}
