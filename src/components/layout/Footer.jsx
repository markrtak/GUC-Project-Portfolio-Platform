/**
 * Footer.jsx — Application footer bar
 *
 * PURPOSE:
 *   Renders a minimal footer at the bottom of every page. Keeps branding
 *   consistent and provides quick links to key pages.
 *
 * REACT CONCEPTS USED:
 *   Purely static presentational component — no props, no state, no effects.
 *   Uses react-router-dom <Link> for internal navigation so navigation is
 *   handled without full page reloads.
 */

import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-surface-700 bg-surface-900 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <BookOpen size={12} className="text-white" />
          </div>
          <span className="text-sm font-semibold">GUCPortfolio</span>
        </Link>

        {/* Quick links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
          <Link to="/explore/projects"   className="hover:text-slate-300 transition-colors">Explore Projects</Link>
          <Link to="/explore/portfolios" className="hover:text-slate-300 transition-colors">Browse Portfolios</Link>
          <Link to="/dashboard"          className="hover:text-slate-300 transition-colors">Dashboard</Link>
          <Link to="/help"               className="hover:text-brand-400 transition-colors">Help & tips</Link>
        </nav>

        {/* Copyright */}
        <p className="text-xs text-slate-600">
          © {year} GUC Portfolio Platform. MS2 Prototype.
        </p>
      </div>
    </footer>
  );
}
