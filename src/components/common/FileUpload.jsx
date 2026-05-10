/**
 * FileUpload.jsx — Drag-and-drop simulated upload widget
 *
 * PURPOSE:
 *   A friendly file picker with drag-and-drop support that wraps the
 *   `mockUploadFile` utility. Used for project reports, thesis drafts, and
 *   profile pictures.
 *
 * PROPS:
 *   accept       — MIME or extension filter, e.g. ".pdf,.zip"
 *   label        — text shown above the dropzone
 *   onUploaded   — async callback(record) called when upload completes
 *   maxSizeMB    — optional upper bound; rejects oversized files with an error
 *   helperText   — small hint text under the dropzone
 *
 * REACT CONCEPTS USED:
 *   useState()   — Tracks drag-over highlight, upload progress and errors.
 *   useRef()     — Provides a ref to the hidden <input type="file"> so the
 *                  visible button can trigger the native file dialog.
 *   Drag events  — onDragEnter/onDragOver/onDragLeave/onDrop keep the visual
 *                  highlight in sync with whether a file is hovering.
 */

import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { mockUploadFile, formatBytes } from '@/utils/mockUpload';
import { InlineLoader } from '@/components/common/Loader';

export default function FileUpload({
  accept = '.pdf,.zip,.doc,.docx',
  label = 'Upload file',
  onUploaded,
  maxSizeMB = 25,
  helperText,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [last, setLast] = useState(null);

  const handleFiles = async (fileList) => {
    setError('');
    const file = fileList?.[0];
    if (!file) return;
    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large — max ${maxSizeMB} MB allowed.`);
      return;
    }
    setUploading(true);
    try {
      const record = await mockUploadFile(file);
      setLast(record);
      await onUploaded?.(record);
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-300">{label}</label>}

      <div
        onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragOver={(e)  => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={()  => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={[
          'flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-xl cursor-pointer transition-all',
          'border-2 border-dashed',
          dragOver
            ? 'border-brand-500 bg-brand-500/10'
            : 'border-surface-600 hover:border-brand-500/50 hover:bg-brand-500/5',
          uploading ? 'pointer-events-none opacity-70' : '',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <>
            <InlineLoader className="text-brand-400" />
            <p className="text-sm text-slate-300">Uploading…</p>
          </>
        ) : last ? (
          <>
            {last.dataUrl ? (
              /* Image preview thumbnail — proves the right file landed. */
              <img
                src={last.dataUrl}
                alt={last.fileName}
                className="w-16 h-16 rounded-xl object-cover border border-surface-600 shadow-md"
              />
            ) : (
              <CheckCircle size={22} className="text-emerald-400" />
            )}
            <p className="text-sm text-slate-200 font-medium">{last.fileName}</p>
            <p className="text-xs text-slate-500">{formatBytes(last.size)} • Click to upload another</p>
          </>
        ) : (
          <>
            <Upload size={22} className="text-slate-500" />
            <p className="text-sm text-slate-300">
              <span className="font-medium text-brand-400">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500">{helperText || `${accept.replace(/\./g, '').toUpperCase()} • max ${maxSizeMB} MB`}</p>
          </>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}
