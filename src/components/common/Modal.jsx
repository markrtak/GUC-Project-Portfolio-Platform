/**
 * Modal.jsx — Accessible overlay dialog component
 *
 * PURPOSE:
 *   Renders content in a centred overlay that blocks interaction with the
 *   page underneath. Used for confirmations, detail views, and forms that
 *   shouldn't break the user's current navigation context.
 *
 * PROPS:
 *   isOpen    — boolean; controls visibility.
 *   onClose   — function; called when the user clicks the backdrop or
 *               presses Escape.
 *   title     — string; displayed in the modal header.
 *   size      — 'sm' | 'md' | 'lg' | 'xl'; controls max-width.
 *   children  — The modal body content.
 *   footer    — Optional React node rendered in the footer area.
 *
 * REACT CONCEPTS USED:
 *   useEffect() — Attaches a keydown listener for the Escape key and
 *                 toggles `overflow-hidden` on <body> to prevent scrolling
 *                 while the modal is open. Cleanup function removes the
 *                 listener when the modal closes or the component unmounts.
 *
 *   React Portals (createPortal) — Renders the modal DOM node directly
 *                 inside document.body instead of inside the component's
 *                 parent. This avoids z-index and overflow clipping issues
 *                 caused by parent containers.
 *
 *   AnimatePresence pattern — CSS classes provide fade-in / scale animation
 *                 without a third-party library.
 */

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ isOpen, onClose, title, size = 'md', children, footer }) {
  // ── Keyboard & body-scroll management ─────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={[
          'relative w-full bg-surface-800 border border-surface-700',
          'rounded-2xl shadow-card flex flex-col max-h-[90vh]',
          'animate-slide-down',
          sizeClasses[size] ?? sizeClasses.md,
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-700 shrink-0">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-700 transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto p-5 flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 p-4 border-t border-surface-700 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
