/**
 * HelpPage.jsx — In-app learnability: searchable tips (no backend).
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, Lightbulb } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

const FAQ = [
  {
    id: 'start',
    title: 'What is this platform for?',
    body: 'GUC Portfolio is a front-end prototype where students showcase course and bachelor projects, faculty supervise and comment, employers browse talent, and admins manage users and moderation — all through the UI (mock data only).',
    kw: 'overview start intro',
  },
  {
    id: 'profile',
    title: 'How do I build my student profile?',
    body: 'Open My Profile from the sidebar or your avatar. Add your major, skills, GitHub, and LinkedIn (used here as your CV link). A complete profile helps others understand you in Explore → Portfolios.',
    kw: 'profile skills linkedin cv portfolio student',
  },
  {
    id: 'create-project',
    title: 'How do I create a project?',
    body: 'Students: Sidebar → New Project (or Dashboard → New Project). Choose course or Bachelor project, add description, links, and optional report/demo. After saving, you can set visibility and invite collaborators from the project page.',
    kw: 'create project student new',
  },
  {
    id: 'portfolio-star',
    title: 'What does the star on “My Projects” mean?',
    body: 'The star toggles whether a project appears on your public portfolio. Private visibility hides it from the explore feed; the star controls the curated list visitors see on your profile.',
    kw: 'portfolio star visibility my projects',
  },
  {
    id: 'invite',
    title: 'Project invitations — what should I do?',
    body: 'Check Invitations in the sidebar. Accept to join the team (you will appear as a collaborator) or reject if you cannot participate. Owners manage collaborators from the project detail page.',
    kw: 'invitation collaborate team',
  },
  {
    id: 'explore',
    title: 'How do I find projects or students?',
    body: 'Use Explore Projects for filters (course, instructor, dates, sort). Use Explore Portfolios to search students by name or email and filter by major or skills. Your filter choices can be shared via the URL.',
    kw: 'search filter discover explore',
  },
  {
    id: 'messages',
    title: 'How does messaging work?',
    body: 'Open Messages. Pick a conversation or start one from a profile link (?with=userId). Sending a message notifies the recipient. Unread counts appear in the sidebar.',
    kw: 'message chat recruiter faculty',
  },
  {
    id: 'faculty-feedback',
    title: 'I am course faculty — where do I review work?',
    body: 'Open projects you supervise or that belong to your courses from Explore or your dashboard. Leave task comments and project feedback; students receive notifications. Use Recommended to discover relevant projects.',
    kw: 'faculty instructor feedback review',
  },
  {
    id: 'employer',
    title: 'I am an employer — how do I get started?',
    body: 'Browse Portfolios and Explore Projects. Save favourites for later. Use Messages to contact students. Until an admin approves your company registration, sign-in may be blocked — that is intentional in the demo.',
    kw: 'employer recruiter company approval',
  },
  {
    id: 'admin',
    title: 'I am an admin — where are the queues?',
    body: 'Administration → Overview shows statistics. Employers, Courses (link requests), and Flags & Appeals each have their own pages with badges when work is pending.',
    kw: 'admin moderation flags employers',
  },
  {
    id: 'notifications',
    title: 'Notifications and muting',
    body: 'The bell shows your latest events. Mark items read or unread, or use “Turn off all” to mute new notifications (demo behaviour).',
    kw: 'notifications bell mute',
  },
  {
    id: 'demo-accounts',
    title: 'Demo accounts for testing',
    body: 'There is one login form for everyone; your role comes from the account you sign into. Test emails and passwords are distributed separately by your team (they are not shown in the app).',
    kw: 'login demo test password',
  },
];

export default function HelpPage() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ;
    return FAQ.filter((item) => {
      const blob = `${item.title} ${item.body} ${item.kw}`.toLowerCase();
      return q.split(/\s+/).every((word) => blob.includes(word));
    });
  }, [query]);

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto space-y-6">
        <Breadcrumbs crumbs={[{ label: 'Help & tips' }]} />

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center shrink-0">
            <Lightbulb size={20} className="text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Help & tips</h1>
            <p className="text-sm text-slate-400 mt-1">
              Short answers to common tasks. Use the search box — try <span className="text-slate-300">portfolio</span>,{' '}
              <span className="text-slate-300">invite</span>, or <span className="text-slate-300">admin</span>.
            </p>
          </div>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help…"
            className="input-base w-full pl-10 py-2.5 text-sm"
            aria-label="Search help articles"
          />
        </div>

        <p className="text-xs text-slate-500">
          Showing <strong className="text-slate-400">{filtered.length}</strong> of {FAQ.length} topics
          {query.trim() ? ` for “${query.trim()}”` : ''}.
        </p>

        <ul className="space-y-3">
          {filtered.map((item) => (
            <li key={item.id} className="card p-4 border-surface-700">
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <BookOpen size={14} className="text-brand-400 shrink-0" />
                {item.title}
              </h2>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">{item.body}</p>
            </li>
          ))}
        </ul>

        {filtered.length === 0 && (
          <div className="card p-8 text-center text-sm text-slate-500">
            No topics match that search. Try a shorter word, or{' '}
            <button type="button" className="text-brand-400 hover:underline" onClick={() => setQuery('')}>
              clear search
            </button>
            .
          </div>
        )}

        <div className="card p-4 border-surface-700 text-sm text-slate-400">
          <p>
            Return to the{' '}
            <Link to="/dashboard" className="text-brand-400 hover:text-brand-300">dashboard</Link>
            {' '}or open{' '}
            <Link to="/explore/projects" className="text-brand-400 hover:text-brand-300">Explore Projects</Link>.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
