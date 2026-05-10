/**
 * AdminCourses.jsx — Course catalogue & instructor link-request management
 *
 * COVERS:
 *   Req 55 — Create / view / edit / delete a course (name + code + metadata).
 *   Req 56 — View list of all courses with their code and name.
 *   Req 57 — Accept / reject link / unlink requests from course instructors.
 *   Req 58 — Notification of any link / unlink request (handled in DataContext
 *            via notifyAllAdmins → admin's notification feed).
 *
 * REACT CONCEPTS USED:
 *   useState() — Tab state, modal state, form state, busy indicators.
 *   useMemo()  — Filtered course list and active link-request count.
 *   Tabs       — Reuses the shared <Tabs> primitive for "Courses" / "Link Requests".
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Plus, Pencil, Trash2, Search, Inbox,
  CheckCircle2, XCircle, Link2, Link2Off, Calendar,
} from 'lucide-react';
import PageWrapper        from '@/components/layout/PageWrapper';
import Button             from '@/components/common/Button';
import Input              from '@/components/common/Input';
import Modal              from '@/components/common/Modal';
import Badge              from '@/components/common/Badge';
import Tabs               from '@/components/common/Tabs';
import ConfirmDialog      from '@/components/common/ConfirmDialog';
import { useDataContext } from '@/context/DataContext';
import { formatDate }     from '@/utils/formatters';

const EMPTY_COURSE = {
  code: '', name: '', department: '', semester: '', year: '', description: '',
};

export default function AdminCourses() {
  const {
    courses, users, linkRequests,
    createCourse, updateCourse, deleteCourse,
    respondToLinkRequest,
  } = useDataContext();

  /* ── Course list state ─────────────────────────────────── */
  const [query, setQuery]           = useState('');
  const [editing, setEditing]       = useState(null);    // null | EMPTY_COURSE | existing course
  const [confirmDel, setConfirmDel] = useState(null);
  const [busy, setBusy]             = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const filteredCourses = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) =>
      (c.code  || '').toLowerCase().includes(q) ||
      (c.name  || '').toLowerCase().includes(q) ||
      (c.department || '').toLowerCase().includes(q)
    );
  }, [courses, query]);

  const validate = (form) => {
    const errors = {};
    if (!form.code.trim()) errors.code = 'Course code is required';
    if (!form.name.trim()) errors.name = 'Course name is required';
    const dup = courses.some(
      (c) => c.code.toLowerCase() === form.code.trim().toLowerCase() && c.id !== editing?.id
    );
    if (dup) errors.code = 'A course with this code already exists';
    return errors;
  };

  const handleSaveCourse = async () => {
    const errors = validate(editing);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setBusy(true);
    try {
      if (editing.id) {
        await updateCourse(editing.id, {
          code: editing.code.trim(), name: editing.name.trim(),
          department: editing.department, semester: editing.semester,
          year: Number(editing.year) || null, description: editing.description,
        });
      } else {
        await createCourse({
          code: editing.code.trim(), name: editing.name.trim(),
          department: editing.department, semester: editing.semester,
          year: Number(editing.year) || null, description: editing.description,
        });
      }
      setEditing(null);
      setFormErrors({});
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    setBusy(true);
    try {
      await deleteCourse(confirmDel.id);
    } finally {
      setBusy(false);
      setConfirmDel(null);
    }
  };

  /* ── Link-request panel ───────────────────────────────── */
  const [requestBusyId, setRequestBusyId] = useState(null);
  const handleRespond = async (request, accept) => {
    setRequestBusyId(request.id);
    try {
      await respondToLinkRequest(request.id, accept);
    } finally {
      setRequestBusyId(null);
    }
  };

  const sortedRequests = useMemo(
    () => [...(linkRequests || [])].sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    }),
    [linkRequests]
  );

  /* ── Tabs ─────────────────────────────────────────────── */
  const pendingRequestCount = useMemo(
    () => (linkRequests || []).filter((r) => r.status === 'pending').length,
    [linkRequests]
  );

  /* ───── Courses panel JSX ───── */
  const coursesPanel = (
    <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by code, name or department…"
                      leftIcon={<Search size={15} />}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <Button
                    leftIcon={<Plus size={15} />}
                    onClick={() => { setEditing({ ...EMPTY_COURSE }); setFormErrors({}); }}
                  >
                    New course
                  </Button>
                </div>

                {filteredCourses.length === 0 ? (
                  <div className="card p-10 text-center">
                    <BookOpen className="mx-auto mb-3 text-slate-600" size={28} />
                    <p className="text-sm text-slate-400">No courses match your search.</p>
                  </div>
                ) : (
                  <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-surface-800/60 border-b border-surface-700">
                          <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                            <th className="px-4 py-3 font-semibold">Code</th>
                            <th className="px-4 py-3 font-semibold">Name</th>
                            <th className="px-4 py-3 font-semibold">Department</th>
                            <th className="px-4 py-3 font-semibold">Instructors</th>
                            <th className="px-4 py-3 font-semibold">Created</th>
                            <th className="px-4 py-3 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-700">
                          {filteredCourses.map((c) => {
                            const instructors = (c.instructorIds || [])
                              .map((id) => users.find((u) => u.id === id))
                              .filter(Boolean);
                            return (
                              <tr key={c.id} className="hover:bg-surface-800/40 transition-colors">
                                <td className="px-4 py-3 font-mono text-brand-300">{c.code}</td>
                                <td className="px-4 py-3 text-slate-200 font-medium">{c.name}</td>
                                <td className="px-4 py-3 text-slate-400 text-xs">{c.department || '—'}</td>
                                <td className="px-4 py-3">
                                  {instructors.length === 0 ? (
                                    <span className="text-xs text-slate-500 italic">Unassigned</span>
                                  ) : (
                                    <div className="flex -space-x-2">
                                      {instructors.slice(0, 3).map((i) => (
                                        <Link key={i.id} to={`/profile/${i.id}`} title={`View ${i.name}`}>
                                          <img
                                            src={i.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${i.id}`}
                                            alt={i.name}
                                            className="w-7 h-7 rounded-full border-2 border-surface-800 bg-surface-700 hover:ring-2 hover:ring-brand-500 transition"
                                          />
                                        </Link>
                                      ))}
                                      {instructors.length > 3 && (
                                        <span className="w-7 h-7 rounded-full border-2 border-surface-800 bg-surface-700 text-[10px] flex items-center justify-center text-slate-400">
                                          +{instructors.length - 3}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                  {c.createdAt ? formatDate(c.createdAt) : '—'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      onClick={() => { setEditing({ ...c }); setFormErrors({}); }}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-surface-700 transition-colors"
                                      title="Edit"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button
                                      onClick={() => setConfirmDel(c)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-surface-700 transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
    </div>
  );

  /* ───── Link-request panel JSX ───── */
  const requestsPanel = (
    <div className="space-y-4">
                {sortedRequests.length === 0 ? (
                  <div className="card p-10 text-center">
                    <Inbox className="mx-auto mb-3 text-slate-600" size={28} />
                    <p className="text-sm text-slate-400">No instructor link or unlink requests yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedRequests.map((r) => {
                      const instructor = users.find((u) => u.id === r.instructorId);
                      const course     = courses.find((c) => c.id === r.courseId);
                      const isLink     = r.type === 'link';
                      return (
                        <div key={r.id} className="card p-4">
                          <div className="flex items-start gap-3">
                            <div className={[
                              'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0',
                              isLink
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                            ].join(' ')}>
                              {isLink ? <Link2 size={18} /> : <Link2Off size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {instructor ? (
                                  <Link to={`/profile/${instructor.id}`} className="text-sm font-semibold text-slate-200 hover:text-brand-300 transition-colors">
                                    {instructor.name}
                                  </Link>
                                ) : (
                                  <p className="text-sm font-semibold text-slate-200">Unknown instructor</p>
                                )}
                                <span className="text-xs text-slate-500">requested to</span>
                                <Badge variant={isLink ? 'green' : 'amber'} size="sm">
                                  {isLink ? 'link' : 'unlink'}
                                </Badge>
                                <span className="text-xs text-slate-500">
                                  {course ? <><span className="font-mono text-brand-300">{course.code}</span> · {course.name}</> : 'a deleted course'}
                                </span>
                              </div>
                              {r.reason && (
                                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">"{r.reason}"</p>
                              )}
                              <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                                <Calendar size={11} /> Submitted {formatDate(r.createdAt)}
                              </p>
                            </div>

                            {r.status === 'pending' ? (
                              <div className="flex gap-1.5 shrink-0">
                                <Button
                                  variant="danger"
                                  size="sm"
                                  loading={requestBusyId === r.id}
                                  leftIcon={<XCircle size={14} />}
                                  onClick={() => handleRespond(r, false)}
                                >
                                  Reject
                                </Button>
                                <Button
                                  variant="success"
                                  size="sm"
                                  loading={requestBusyId === r.id}
                                  leftIcon={<CheckCircle2 size={14} />}
                                  onClick={() => handleRespond(r, true)}
                                >
                                  Accept
                                </Button>
                              </div>
                            ) : (
                              <Badge
                                variant={r.status === 'accepted' ? 'green' : 'red'}
                                size="sm"
                                dot
                              >
                                {r.status === 'accepted' ? 'Accepted' : 'Rejected'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
    </div>
  );

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Courses & instructor links</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage the platform's course catalogue and process instructor link/unlink requests.
          </p>
        </div>

        <Tabs
          tabs={[
            { id: 'courses',  label: `Courses (${courses.length})`,        content: coursesPanel  },
            { id: 'requests', label: `Link requests (${pendingRequestCount})`, content: requestsPanel },
          ]}
        />
      </div>

      {/* Course create/edit modal */}
      <Modal
        isOpen={!!editing}
        onClose={() => { setEditing(null); setFormErrors({}); }}
        title={editing?.id ? 'Edit course' : 'Create new course'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setEditing(null); setFormErrors({}); }}>Cancel</Button>
            <Button onClick={handleSaveCourse} loading={busy} leftIcon={editing?.id ? <Pencil size={15} /> : <Plus size={15} />}>
              {editing?.id ? 'Save changes' : 'Create course'}
            </Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Course code"
                placeholder="e.g. CSEN 401"
                value={editing.code}
                onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                error={formErrors.code}
                required
              />
              <Input
                label="Year"
                type="number"
                placeholder="e.g. 3"
                min="1" max="6"
                value={editing.year}
                onChange={(e) => setEditing({ ...editing, year: e.target.value })}
              />
            </div>
            <Input
              label="Course name"
              placeholder="e.g. Computer Programming Lab"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              error={formErrors.name}
              required
            />
            <Input
              label="Department"
              placeholder="e.g. Computer Science & Engineering"
              value={editing.department}
              onChange={(e) => setEditing({ ...editing, department: e.target.value })}
            />
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Semester</label>
              <select
                className="input-base"
                value={editing.semester}
                onChange={(e) => setEditing({ ...editing, semester: e.target.value })}
              >
                <option value="">Select…</option>
                <option value="Fall">Fall</option>
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
              </select>
            </div>
            <Input
              as="textarea"
              rows={3}
              label="Description"
              placeholder="Short description of the course content."
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            />
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!confirmDel}
        onCancel={() => setConfirmDel(null)}
        onConfirm={handleDelete}
        loading={busy}
        title="Delete course?"
        message={
          <>
            Are you sure you want to delete <strong className="text-slate-200">{confirmDel?.code} — {confirmDel?.name}</strong>?
            All projects already linked to this course will keep their data, but the course will no longer appear in
            search filters or new project forms.
          </>
        }
        confirmLabel="Delete course"
        variant="danger"
      />
    </PageWrapper>
  );
}
