/**
 * PageWrapper.jsx — Authenticated page shell
 *
 * PURPOSE:
 *   Composes the persistent Navbar and Sidebar with the page content area.
 *   All authenticated pages render inside this wrapper so that layout code
 *   is never duplicated across individual page components.
 *
 *   It also manages the sidebar open/closed state on mobile, keeping that
 *   UI logic out of every page.
 *
 * PROPS:
 *   children — The page-specific content to render in the main area.
 *
 * REACT CONCEPTS USED:
 *   useState()    — Tracks whether the mobile sidebar drawer is open.
 *
 *   CSS grid/flex layout  — The shell uses a fixed sidebar column on the left
 *   (hidden on mobile, visible on lg+) and a flex-col main column on the
 *   right that fills the remaining width.
 */

import { useState } from 'react';
import Navbar  from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer  from '@/components/layout/Footer';

export default function PageWrapper({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-surface-900">
      {/* Top bar — full width, sticks above everything */}
      <Navbar onMenuToggle={() => setSidebarOpen((o) => !o)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content — offset by sidebar width on desktop */}
        <main className="flex-1 flex flex-col min-w-0 lg:ml-64 overflow-y-auto">
          <div className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
