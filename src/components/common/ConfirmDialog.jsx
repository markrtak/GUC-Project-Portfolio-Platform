/**
 * ConfirmDialog.jsx — Reusable confirmation modal
 *
 * PURPOSE:
 *   Standardised yes/no/destructive confirmation prompt used everywhere a
 *   destructive action (delete project, remove collaborator, reject invite,
 *   etc.) needs explicit user confirmation. Centralising it ensures the UX
 *   is consistent across the entire app.
 *
 * PROPS:
 *   isOpen          — boolean, controls visibility
 *   title           — modal heading
 *   message         — main body text (string or React node)
 *   confirmLabel    — text for the confirm button
 *   cancelLabel     — text for the cancel button
 *   variant         — 'danger' | 'primary' | 'success' (colour of confirm button)
 *   loading         — boolean — spinner on confirm button
 *   onConfirm       — async callback when user clicks Confirm
 *   onCancel        — callback when user clicks Cancel / backdrop / Esc
 *
 * REACT CONCEPTS USED:
 *   Composition — Wraps the existing Modal component, pre-fills its footer
 *                 with two buttons. This is "composition over configuration".
 */

import { AlertTriangle } from 'lucide-react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';

export default function ConfirmDialog({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          variant === 'danger'  ? 'bg-red-500/15 text-red-400' :
          variant === 'success' ? 'bg-emerald-500/15 text-emerald-400' :
                                   'bg-brand-500/15 text-brand-400'
        }`}>
          <AlertTriangle size={20} />
        </div>
        <div className="text-sm text-slate-300 leading-relaxed pt-1.5">{message}</div>
      </div>
    </Modal>
  );
}
