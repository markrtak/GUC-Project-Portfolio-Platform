/**
 * DocViewer.jsx — Inline document preview & download widget
 *
 * PURPOSE:
 *   Solves student req: "I can't download or view uploaded docs". Renders a
 *   styled card for any file record (project report, thesis draft) showing
 *   the icon, filename, size, and providing two actions: View (opens an
 *   in-modal PDF/text preview) and Download (creates a real Blob download).
 *
 * PROPS:
 *   file         — { id, fileName, size, uploadedAt }
 *   onRemove     — optional; if provided, shows a delete (×) button
 *   actionsRight — additional React node rendered to the right of the
 *                  default action buttons
 *
 * REACT CONCEPTS USED:
 *   useState()   — Toggles preview modal visibility.
 *   Reuses Modal — Composition: the preview is rendered inside the existing
 *                  Modal component for visual consistency.
 *   Blob API     — `mockDownloadFile` builds a Blob and triggers a real
 *                  browser download so the user can save the placeholder file.
 */

import { useState } from 'react';
import { FileText, Download, Eye, Trash2 } from 'lucide-react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { mockDownloadFile, formatBytes } from '@/utils/mockUpload';
import { formatDate } from '@/utils/formatters';

export default function DocViewer({ file, onRemove, actionsRight }) {
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!file) return null;

  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-surface-700/50 border border-surface-600 rounded-xl">
        <div className="w-10 h-10 rounded-lg bg-red-500/15 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
          <FileText size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate">{file.fileName}</p>
          <p className="text-xs text-slate-500">
            {formatBytes(file.size)}
            {file.uploadedAt ? ` • Uploaded ${formatDate(file.uploadedAt)}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {actionsRight}
          <button
            onClick={() => setPreviewOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-surface-600 transition-colors"
            title="View"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => mockDownloadFile(file)}
            className="p-2 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-surface-600 transition-colors"
            title="Download"
          >
            <Download size={15} />
          </button>
          {onRemove && (
            <button
              onClick={onRemove}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-surface-600 transition-colors"
              title="Remove"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={file.fileName}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPreviewOpen(false)}>Close</Button>
            <Button leftIcon={<Download size={14} />} onClick={() => mockDownloadFile(file)}>
              Download
            </Button>
          </>
        }
      >
        {/* Mock document preview — looks like a paper page */}
        <div className="bg-white rounded-lg p-8 shadow-inner min-h-[400px] text-slate-800 font-mono text-sm leading-relaxed">
          <h1 className="text-2xl font-bold mb-1 font-sans">{file.fileName}</h1>
          <p className="text-xs text-slate-500 mb-6">
            {formatBytes(file.size)} • Uploaded {file.uploadedAt ? formatDate(file.uploadedAt) : '—'}
          </p>
          <hr className="border-slate-300 mb-6" />
          <div className="space-y-3 font-sans text-slate-700">
            <p className="font-semibold">Document Preview</p>
            <p>
              This is a simulated preview of <span className="font-semibold">{file.fileName}</span>. In a production
              build the actual PDF/document bytes would be rendered here using a viewer such as react-pdf, Mozilla
              PDF.js, or an embed via &lt;iframe&gt;.
            </p>
            <p>
              For the MS2 prototype, clicking <em>Download</em> will save a placeholder file to your computer so you
              can verify that the download flow works end-to-end. All file metadata (name, size, upload date) is
              real and persisted in localStorage.
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Document title is stored at upload time</li>
              <li>File size is read from the original File object</li>
              <li>Mock download generates a working Blob via URL.createObjectURL</li>
            </ul>
            <p className="pt-4 text-xs text-slate-500 italic">— End of preview —</p>
          </div>
        </div>
      </Modal>
    </>
  );
}
