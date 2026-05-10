/**
 * mockUpload.js — Simulated file upload helpers
 *
 * PURPOSE:
 *   In a real app, files are sent over the network to a backend server which
 *   returns a URL pointing to the stored file. Because MS2 has no backend, we
 *   simulate the entire upload lifecycle: read the file metadata (name, size,
 *   type), wait a random delay to mimic upload time, and return a "stored"
 *   record that subsequent UI can reference.
 *
 *   To allow the user to "download/view" their uploaded files we keep a
 *   simulated blob URL in localStorage. Real PDF/zip bytes are too heavy for
 *   localStorage in a demo so we generate a tiny placeholder PDF text on the
 *   fly when the user requests download — enough to prove the UX works.
 *
 * JAVASCRIPT CONCEPTS USED:
 *   - File API           — reading file metadata from <input type="file">
 *   - Blob + URL.createObjectURL  — generates a temporary in-browser URL
 *   - Promise + setTimeout — wraps the simulated network delay
 *   - localStorage       — persists "uploaded" file metadata across reloads
 */

const STORAGE_KEY = 'guc_portfolio_files';

function readStore() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function writeStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

/**
 * Read a File as a data URL (`data:image/png;base64,…`). Returns `null` if
 * the file is not an image — we keep PDFs / zips out of localStorage to
 * avoid blowing the per-origin quota.
 */
function readImageDataUrl(file) {
  return new Promise((resolve) => {
    if (!file || !file.type?.startsWith('image/')) { resolve(null); return; }
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Simulate uploading a File object. Returns a record with id, fileName,
 * size, type, uploadedAt, and (for images) a `dataUrl` that callers can
 * render directly via <img src={record.dataUrl} />.
 *
 * The dataUrl is intentionally kept OUT of the localStorage record so that
 * uploading a few high-resolution images doesn't blow the storage quota.
 *
 * @param {File} file — File from a <input type="file"> element
 * @param {number} delayMs
 */
export function mockUploadFile(file, delayMs = 800) {
  return new Promise(async (resolve, reject) => {
    if (!file) { reject(new Error('No file provided')); return; }
    const dataUrl = await readImageDataUrl(file);
    setTimeout(() => {
      const record = {
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fileName: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl,
        uploadedAt: new Date().toISOString(),
      };
      // Persist a copy WITHOUT the dataUrl (quota-safe). The in-memory record
      // returned to the caller still includes it so the UI can render it.
      const { dataUrl: _du, ...metadataOnly } = record;
      const store = readStore();
      store[record.id] = metadataOnly;
      writeStore(store);
      resolve(record);
    }, delayMs);
  });
}

/**
 * Generate a downloadable in-browser file matching a stored record. If the
 * record was generated synthetically (without an actual File), we produce a
 * placeholder text/PDF so the download button always works.
 */
export function mockDownloadFile(record) {
  const content =
    `%PDF-1.4 (mock)\n` +
    `%—— GUC Portfolio Platform Mock Document ——\n` +
    `Filename: ${record?.fileName || 'document.pdf'}\n` +
    `Uploaded: ${record?.uploadedAt || 'n/a'}\n` +
    `\nThis is a placeholder file used by the MS2 prototype.\n` +
    `In a production build it would download the real uploaded asset.\n`;

  const blob = new Blob([content], { type: 'application/pdf' });
  const url  = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = record?.fileName || 'document.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Format bytes for display: 2_350_000 → "2.24 MB" */
export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = bytes, u = 0;
  while (v >= 1024 && u < units.length - 1) { v /= 1024; u++; }
  return `${v.toFixed(v < 10 && u > 0 ? 2 : 0)} ${units[u]}`;
}
