/**
 * Messages.jsx — Private messaging inbox with conversation thread
 *
 * COVERS:
 *   Faculty req 30 — "View a list of all my messages with students,
 *                     employers and course instructors."
 *   Faculty req 31 — "Send and receive private messages."
 *   Faculty req 32 — "Receive a notification whenever I receive a private
 *                     message" (handled by DataContext.sendMessage which
 *                     calls pushNotification on the recipient).
 *
 * Layout (two-pane):
 *   Left  — Conversation list grouped by peer with unread counters.
 *   Right — Selected thread with chronological bubbles + composer.
 *
 * The page deep-links via `?with=<userId>` so links from a profile / project
 * card can pre-select a peer and start composing immediately.
 *
 * REACT CONCEPTS USED:
 *   useState() — Selected peer + composer + busy flags.
 *   useEffect() — Loads users + messages on mount; marks the active
 *                 conversation as read when it changes.
 *   useMemo()  — Derives conversations and the active thread reactively.
 *   useSearchParams — Reads / writes the `?with=` query param.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MessageCircle, Send, Search, Inbox, ArrowLeft,
} from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import Button      from '@/components/common/Button';
import Loader      from '@/components/common/Loader';
import { useAuth }        from '@/hooks/useAuth';
import { useDataContext } from '@/context/DataContext';
import { timeAgo }        from '@/utils/formatters';

export default function Messages() {
  const { currentUser, isAuthenticated } = useAuth();
  const {
    fetchUsers, fetchMessagesForUser, sendMessage, markConversationRead,
  } = useDataContext();
  const [params, setParams] = useSearchParams();

  const [users, setUsers]       = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [draft, setDraft]       = useState('');
  const [sending, setSending]   = useState(false);
  const threadRef = useRef(null);

  const peerId = params.get('with') || null;

  /* ── Load users + messages on mount ─────────────────────── */
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    Promise.all([fetchUsers(), fetchMessagesForUser(currentUser.id)])
      .then(([u, m]) => {
        if (cancelled) return;
        setUsers(u);
        setMessages(m);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [currentUser, fetchUsers, fetchMessagesForUser]);

  /* ── Mark active conversation as read whenever it changes ─ */
  useEffect(() => {
    if (!currentUser || !peerId) return;
    markConversationRead(currentUser.id, peerId).then(() => {
      // Optimistic local update avoids an extra fetch + delay per conversation switch.
      setMessages((prev) => prev.map((m) =>
        m.toId === currentUser.id && m.fromId === peerId && !m.read ? { ...m, read: true } : m
      ));
    });
  }, [peerId, currentUser, fetchMessagesForUser, markConversationRead]);

  /* ── Group messages by peer to build the conversation list ─ */
  const conversations = useMemo(() => {
    if (!currentUser) return [];
    const map = new Map();
    messages.forEach((m) => {
      const otherId = m.fromId === currentUser.id ? m.toId : m.fromId;
      if (!map.has(otherId)) map.set(otherId, []);
      map.get(otherId).push(m);
    });
    return [...map.entries()]
      .map(([otherId, msgs]) => {
        const sorted = [...msgs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const last = sorted[sorted.length - 1];
        const unread = sorted.filter((m) => m.toId === currentUser.id && !m.read).length;
        return { peerId: otherId, lastMessage: last, unread, messageCount: sorted.length };
      })
      .sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));
  }, [messages, currentUser]);

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => {
      const u = users.find((x) => x.id === c.peerId);
      return (
        u?.name?.toLowerCase().includes(q) ||
        u?.email?.toLowerCase().includes(q) ||
        c.lastMessage.content.toLowerCase().includes(q)
      );
    });
  }, [conversations, users, search]);

  const activeThread = useMemo(() => {
    if (!peerId || !currentUser) return [];
    return messages
      .filter((m) =>
        (m.fromId === currentUser.id && m.toId === peerId) ||
        (m.fromId === peerId && m.toId === currentUser.id)
      )
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [messages, peerId, currentUser]);

  const peer = useMemo(() => users.find((u) => u.id === peerId), [users, peerId]);

  /* ── Auto-scroll thread to bottom when it grows ─────────── */
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [activeThread.length]);

  if (!isAuthenticated) {
    return (
      <PageWrapper>
        <div className="max-w-md mx-auto text-center py-20">
          <h1 className="text-xl font-bold text-slate-100 mb-2">Sign in to use Messages</h1>
          <Link to="/login"><Button>Sign in</Button></Link>
        </div>
      </PageWrapper>
    );
  }

  if (loading) {
    return <PageWrapper><Loader message="Loading messages…" /></PageWrapper>;
  }

  /* ── Send handler ──────────────────────────────────────── */
  const handleSend = async (e) => {
    e?.preventDefault?.();
    if (!peerId || !draft.trim() || sending) return;
    setSending(true);
    try {
      const created = await sendMessage(currentUser.id, peerId, draft.trim());
      // Append immediately instead of refetching the whole thread.
      setMessages((prev) => [...prev, created]);
      setDraft('');
      toast.success('Message sent');
    } finally {
      setSending(false);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto space-y-4">
        <Breadcrumbs crumbs={[{ label: 'Messages' }]} />

        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Inbox size={20} className="text-brand-400" /> Messages
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[70vh]">
          {/* ── Conversation list ─────────────────────────── */}
          <aside className={`card p-0 overflow-hidden flex flex-col ${peerId ? 'hidden md:flex' : ''}`}>
            <div className="p-3 border-b border-surface-700">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations…"
                  className="input-base pl-8 py-1.5 text-xs"
                />
              </div>
            </div>

            <ul className="flex-1 overflow-y-auto divide-y divide-surface-700/50">
              {filteredConversations.length === 0 ? (
                <li className="p-8 text-center text-xs text-slate-500">
                  <MessageCircle size={24} className="mx-auto mb-2 opacity-30" />
                  No conversations yet.<br />
                  Visit a profile and click "Message" to start one.
                </li>
              ) : filteredConversations.map((c) => {
                const u = users.find((x) => x.id === c.peerId);
                const isActive = c.peerId === peerId;
                return (
                  <li key={c.peerId}>
                    <button
                      onClick={() => setParams({ with: c.peerId })}
                      className={`w-full text-left p-3 flex items-start gap-2.5 transition-colors ${
                        isActive ? 'bg-brand-500/10' : 'hover:bg-surface-700/50'
                      }`}
                    >
                      <img
                        src={u?.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.peerId}`}
                        alt=""
                        className="w-9 h-9 rounded-full bg-surface-700 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-slate-200 truncate">
                            {u?.name || 'Unknown user'}
                          </p>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {timeAgo(c.lastMessage.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {c.lastMessage.fromId === currentUser.id ? 'You: ' : ''}
                          {c.lastMessage.content}
                        </p>
                      </div>
                      {c.unread > 0 && (
                        <span className="bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 mt-1">
                          {c.unread}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* ── Active thread ──────────────────────────────── */}
          <section className={`card p-0 md:col-span-2 flex flex-col overflow-hidden ${!peerId ? 'hidden md:flex' : ''}`}>
            {!peerId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 px-6">
                <MessageCircle size={42} className="mb-3 opacity-30" />
                <p className="text-sm font-medium text-slate-400">Select a conversation</p>
                <p className="text-xs mt-1">Pick someone from the list, or open a profile and tap "Message".</p>
              </div>
            ) : (
              <>
                <header className="px-4 py-3 border-b border-surface-700 flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setParams({})}
                    className="md:hidden p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-surface-700"
                    aria-label="Back"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <Link to={peer ? `/profile/${peer.id}` : '#'} className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
                    <img
                      src={peer?.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${peerId}`}
                      alt=""
                      className="w-9 h-9 rounded-full bg-surface-700"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">{peer?.name || 'Unknown user'}</p>
                      <p className="text-[11px] text-slate-500 capitalize">{peer?.title || peer?.role || 'user'}</p>
                    </div>
                  </Link>
                </header>

                <div ref={threadRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-surface-900/40">
                  {activeThread.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-8">No messages yet — say hi.</p>
                  ) : activeThread.map((m) => {
                    const mine = m.fromId === currentUser.id;
                    return (
                      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={[
                          'max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed',
                          mine
                            ? 'bg-brand-600/30 border border-brand-500/30 text-slate-100 rounded-br-sm'
                            : 'bg-surface-700/70 border border-surface-600 text-slate-200 rounded-bl-sm',
                        ].join(' ')}>
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          <p className={`text-[10px] mt-1 ${mine ? 'text-brand-200/70' : 'text-slate-500'}`}>
                            {timeAgo(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleSend} className="p-3 border-t border-surface-700 flex gap-2 shrink-0">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Write a message…"
                    className="input-base resize-none text-sm min-h-[42px] max-h-[120px] flex-1"
                    rows={1}
                  />
                  <Button
                    type="submit"
                    leftIcon={<Send size={14} />}
                    loading={sending}
                    disabled={!draft.trim()}
                  >
                    Send
                  </Button>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </PageWrapper>
  );
}
