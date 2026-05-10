/**
 * Navbar.jsx — Top navigation bar
 *
 * PURPOSE:
 *   Persistent top bar that is visible on all authenticated pages. It provides:
 *   - The application branding / logo link.
 *   - A global search input (navigates to the Explore page with query pre-filled).
 *   - Notification bell with unread count badge.
 *   - User avatar with a dropdown for profile and logout actions.
 *
 * PROPS:
 *   onMenuToggle — function called when the hamburger button is pressed on
 *                  mobile, telling PageWrapper to open/close the Sidebar.
 *
 * REACT CONCEPTS USED:
 *   useState()        — Tracks search input text, dropdown open/close state,
 *                       and notification panel visibility.
 *
 *   useNavigate()     — react-router-dom hook for programmatic navigation.
 *                       Used to send the user to /explore/projects?q=<query>
 *                       when the search form is submitted.
 *
 *   useRef()          — Holds a reference to the dropdown container so the
 *                       outside-click handler can check if the click was
 *                       inside or outside the menu.
 *
 *   useEffect()       — Attaches a document-level mousedown listener to close
 *                       the dropdown when the user clicks outside it.
 *
 *   useAuth()         — Reads currentUser and the logout function from context.
 */

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, LogOut, User, ChevronDown, BookOpen, HelpCircle } from 'lucide-react';
import { useAuth }        from '@/hooks/useAuth';
import { useDataContext } from '@/context/DataContext';
import { getInitials, timeAgo } from '@/utils/formatters';
import NotificationDropdown from '@/components/project/NotificationDropdown';

export default function Navbar({ onMenuToggle }) {
  const {
    currentUser, logout, markNotificationRead, markNotificationUnread, markAllNotificationsRead, updateProfile,
  } = useAuth();
  const {
    users,
    setNotificationsEnabled,
    markNotificationRead: markDataNotificationRead,
    markNotificationUnread: markDataNotificationUnread,
    markAllNotificationsRead: markDataAllNotificationsRead,
  } = useDataContext();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery]         = useState('');
  const [userMenuOpen, setUserMenuOpen]       = useState(false);
  const [notifPanelOpen, setNotifPanelOpen]   = useState(false);

  const userMenuRef  = useRef(null);
  const notifRef     = useRef(null);

  /** Live row in mock DB — new notifications are pushed here first (DataContext). */
  const liveUser = users.find((u) => u.id === currentUser?.id);
  const notifications = liveUser?.notifications ?? currentUser?.notifications ?? [];
  const notificationsEnabled = liveUser
    ? liveUser.notificationsEnabled !== false
    : currentUser?.notificationsEnabled !== false;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const syncReadToBoth = async (notifId) => {
    if (liveUser) await markDataNotificationRead(currentUser.id, notifId);
    markNotificationRead(notifId);
  };
  const syncUnreadToBoth = async (notifId) => {
    if (liveUser) await markDataNotificationUnread(currentUser.id, notifId);
    markNotificationUnread(notifId);
  };
  const syncMarkAllRead = async () => {
    if (liveUser) await markDataAllNotificationsRead(currentUser.id);
    markAllNotificationsRead();
  };

  // ── Close dropdowns on outside click ──────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Search submit ─────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore/projects?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-surface-900/80 backdrop-blur border-b border-surface-700 flex items-center px-4 gap-3">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-700"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
          <BookOpen size={16} className="text-white" />
        </div>
        <span className="hidden sm:block font-bold text-slate-100 tracking-tight">
          GUC<span className="text-brand-400">Portfolio</span>
        </span>
      </Link>

      {/* Search — grows to fill space */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md mx-auto">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, tags, people…"
            className="w-full bg-surface-800 border border-surface-700 rounded-full pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          />
        </div>
      </form>

      {/* Right actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifPanelOpen((o) => !o); setUserMenuOpen(false); }}
            className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-700 transition-colors"
            aria-label={`Notifications — ${unreadCount} unread`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifPanelOpen && (
            <NotificationDropdown
              notifications={notifications}
              notificationsEnabled={notificationsEnabled}
              onMarkRead={(id) => { void syncReadToBoth(id); }}
              onMarkAllRead={() => { void syncMarkAllRead(); }}
              onMarkUnread={(id) => { void syncUnreadToBoth(id); }}
              onToggleEnabled={async (next) => {
                await setNotificationsEnabled(currentUser.id, next);
                updateProfile({ notificationsEnabled: next });
              }}
              onClose={() => setNotifPanelOpen(false)}
            />
          )}
        </div>

        {/* User menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => { setUserMenuOpen((o) => !o); setNotifPanelOpen(false); }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-surface-700 transition-colors"
          >
            {currentUser?.profilePic ? (
              <img
                src={currentUser.profilePic}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full bg-surface-700 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white">
                {getInitials(currentUser?.name)}
              </div>
            )}
            <span className="hidden md:block text-sm font-medium text-slate-200 max-w-[120px] truncate">
              {currentUser?.name?.split(' ')[0]}
            </span>
            <ChevronDown size={14} className="text-slate-500 hidden md:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-surface-800 border border-surface-700 rounded-xl shadow-card overflow-hidden animate-slide-down z-50">
              <div className="px-4 py-3 border-b border-surface-700">
                <p className="text-sm font-medium text-slate-200 truncate">{currentUser?.name}</p>
                <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
              </div>
              <nav className="py-1">
                <Link
                  to="/help"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-surface-700 hover:text-slate-100 transition-colors"
                >
                  <HelpCircle size={15} />
                  Help & tips
                </Link>
                <Link
                  to={`/profile/${currentUser?.id}`}
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-surface-700 hover:text-slate-100 transition-colors"
                >
                  <User size={15} />
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-surface-700 hover:text-red-300 transition-colors"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
