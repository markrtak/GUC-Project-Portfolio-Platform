/**
 * ProjectEdit.jsx — Edit existing project (req 19)
 *
 * PURPOSE:
 *   Loads an existing project, pre-fills a form identical in shape to the
 *   creation form, and submits updates via DataContext.updateProject().
 *   Allows editing title, description, type, course, GitHub link, demo
 *   video, programming languages, tags, and re-uploading the project report.
 *
 * REACT CONCEPTS USED:
 *   useParams()  — Reads :id from the URL
 *   useEffect()  — Fetches the project, course list, and user list
 *   useState()   — Manages the form, loading, and error states
 *   Navigate     — Redirects non-owners away
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import { Edit2, Save, X, Plus } from 'lucide-react';
import PageWrapper  from '@/components/layout/PageWrapper';
import Breadcrumbs  from '@/components/layout/Breadcrumbs';
import Loader       from '@/components/common/Loader';
import Input        from '@/components/common/Input';
import Button       from '@/components/common/Button';
import Badge        from '@/components/common/Badge';
import FileUpload   from '@/components/common/FileUpload';
import DocViewer    from '@/components/common/DocViewer';
import { useAuth }        from '@/hooks/useAuth';
import { useDataContext } from '@/context/DataContext';

export default function ProjectEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { fetchProjectById, fetchCourses, fetchUsers, updateProject } = useDataContext();

  const [project, setProject]  = useState(null);
  const [courses, setCourses]  = useState([]);
  const [faculty, setFaculty]  = useState([]);
  const [loading, setLoading]  = useState(true);
  const [saving, setSaving]    = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', type: 'course', courseId: '', supervisorId: '',
    github: '', demoVideo: '', tags: [], programmingLanguages: [],
    tagInput: '', langInput: '',
    projectReport: null,
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchProjectById(id), fetchCourses(), fetchUsers()]).then(([p, c, u]) => {
      if (cancelled) return;
      if (!p) { setNotFound(true); setLoading(false); return; }
      setProject(p);
      setCourses(c);
      setFaculty(u.filter((x) => x.role === 'faculty'));
      setForm({
        title: p.title,
        description: p.description,
        type: p.type,
        courseId: p.courseId || '',
        supervisorId: p.supervisorId || '',
        github: p.github || '',
        demoVideo: p.demoVideo || '',
        tags: [...(p.tags || [])],
        programmingLanguages: [...(p.programmingLanguages || [])],
        tagInput: '', langInput: '',
        projectReport: p.projectReport,
      });
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id, fetchProjectById, fetchCourses, fetchUsers]);

  if (loading)  return <PageWrapper><Loader message="Loading project…" /></PageWrapper>;
  if (notFound) return <Navigate to="/projects" replace />;
  if (project.ownerId !== currentUser?.id) return <Navigate to={`/projects/${id}`} replace />;

  const handle = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const addToList = (listKey, inputKey) => {
    const v = form[inputKey].trim();
    if (v && !form[listKey].includes(v)) {
      setForm((f) => ({ ...f, [listKey]: [...f[listKey], v], [inputKey]: '' }));
    }
  };

  const removeFromList = (listKey, value) => {
    setForm((f) => ({ ...f, [listKey]: f[listKey].filter((x) => x !== value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProject(id, {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        courseId: form.type === 'course' ? form.courseId : null,
        supervisorId: form.supervisorId || null,
        github: form.github.trim(),
        demoVideo: form.demoVideo.trim(),
        tags: form.tags,
        programmingLanguages: form.programmingLanguages,
        projectReport: form.projectReport,
      });
      navigate(`/projects/${id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto">
        <Breadcrumbs crumbs={[
          { label: 'My Projects',  to: '/projects' },
          { label: project.title,  to: `/projects/${id}` },
          { label: 'Edit' },
        ]} />

        <div className="mt-6 mb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center">
            <Edit2 size={18} className="text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Edit Project</h1>
            <p className="text-sm text-slate-400">Update your project's details below.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          <Input
            label="Project Title"
            value={form.title}
            onChange={(e) => handle('title', e.target.value)}
            required
          />

          <Input
            as="textarea"
            label="Description"
            value={form.description}
            onChange={(e) => handle('description', e.target.value)}
            rows={5}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Project Type</label>
              <select value={form.type} onChange={(e) => handle('type', e.target.value)} className="input-base">
                <option value="course">Course Project</option>
                <option value="bachelor">Bachelor Thesis</option>
              </select>
            </div>
            {form.type === 'course' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Course</label>
                <select value={form.courseId} onChange={(e) => handle('courseId', e.target.value)} className="input-base">
                  <option value="">— Select course —</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.code} – {c.name}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="GitHub Repository URL" value={form.github} onChange={(e) => handle('github', e.target.value)} type="url" />
            <Input label="Demo Video URL"        value={form.demoVideo} onChange={(e) => handle('demoVideo', e.target.value)} type="url" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Supervisor</label>
            <select value={form.supervisorId} onChange={(e) => handle('supervisorId', e.target.value)} className="input-base">
              <option value="">— None —</option>
              {faculty.map((f) => <option key={f.id} value={f.id}>{f.name} — {f.department}</option>)}
            </select>
          </div>

          {/* Programming languages */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Programming Languages</label>
            <div className="flex gap-2">
              <input
                value={form.langInput}
                onChange={(e) => handle('langInput', e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addToList('programmingLanguages', 'langInput'); } }}
                placeholder="e.g. Python, JavaScript"
                className="input-base flex-1"
              />
              <Button type="button" variant="secondary" leftIcon={<Plus size={14} />} onClick={() => addToList('programmingLanguages', 'langInput')}>Add</Button>
            </div>
            {form.programmingLanguages.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {form.programmingLanguages.map((l) => (
                  <button key={l} type="button" onClick={() => removeFromList('programmingLanguages', l)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent-500/15 text-accent-300 border border-accent-500/30 text-xs rounded-full hover:bg-red-500/20 hover:text-red-300 transition-colors">
                    {l} <X size={11} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Tags</label>
            <div className="flex gap-2">
              <input
                value={form.tagInput}
                onChange={(e) => handle('tagInput', e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addToList('tags', 'tagInput'); } }}
                placeholder="e.g. React, Machine Learning"
                className="input-base flex-1"
              />
              <Button type="button" variant="secondary" leftIcon={<Plus size={14} />} onClick={() => addToList('tags', 'tagInput')}>Add</Button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {form.tags.map((t) => (
                  <button key={t} type="button" onClick={() => removeFromList('tags', t)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-500/15 text-brand-300 border border-brand-500/30 text-xs rounded-full hover:bg-red-500/20 hover:text-red-300 transition-colors">
                    {t} <X size={11} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Project report */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Project Report</label>
            {form.projectReport ? (
              <DocViewer
                file={form.projectReport}
                onRemove={async () => handle('projectReport', null)}
              />
            ) : (
              <FileUpload
                label=""
                accept=".pdf,.zip,.doc,.docx"
                helperText="PDF, DOC, DOCX, ZIP — max 25 MB"
                onUploaded={(rec) => handle('projectReport', rec)}
              />
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2 border-t border-surface-700">
            <Link to={`/projects/${id}`}>
              <Button type="button" variant="ghost">Cancel</Button>
            </Link>
            <Button type="submit" loading={saving} leftIcon={<Save size={14} />}>Save Changes</Button>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
}
