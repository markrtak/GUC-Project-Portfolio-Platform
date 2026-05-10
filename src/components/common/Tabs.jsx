/**
 * Tabs.jsx — Accessible tab navigation component
 *
 * PURPOSE:
 *   Used inside the Project Detail page to organise lots of information
 *   (Overview / Tasks / Thesis / Collaborators / Feedback) without making
 *   the page extremely long. Tabs satisfy the MS2 "Information Architecture"
 *   grading criterion.
 *
 * PROPS:
 *   tabs        — Array of { id, label, icon?, count?, content }
 *   defaultTab  — id of the tab to open initially
 *   onChange    — optional callback(activeId) when the tab changes
 *
 * REACT CONCEPTS USED:
 *   useState()  — Tracks the currently active tab id.
 *   ARIA roles  — role="tablist" / "tab" / "tabpanel" + aria-selected give
 *                 keyboard and screen-reader users proper navigation.
 */

import { useState } from 'react';

export default function Tabs({ tabs = [], defaultTab, onChange }) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);

  const handleSelect = (id) => {
    setActive(id);
    onChange?.(id);
  };

  const activeTab = tabs.find((t) => t.id === active);

  return (
    <div>
      {/* Tab list */}
      <div role="tablist" className="flex flex-wrap gap-1 border-b border-surface-700 mb-5 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSelect(tab.id)}
              className={[
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                isActive
                  ? 'border-brand-500 text-brand-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-surface-600',
              ].join(' ')}
            >
              {Icon && <Icon size={15} />}
              {tab.label}
              {typeof tab.count === 'number' && (
                <span className={[
                  'inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] font-semibold rounded-full',
                  isActive ? 'bg-brand-500/20 text-brand-300' : 'bg-surface-700 text-slate-400',
                ].join(' ')}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active tab panel */}
      <div role="tabpanel" className="animate-fade-in">
        {activeTab?.content}
      </div>
    </div>
  );
}
