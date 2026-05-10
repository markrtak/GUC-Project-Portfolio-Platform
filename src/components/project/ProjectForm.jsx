/**
 * ProjectForm.jsx — Project creation / editing form
 *
 * PURPOSE:
 *   A multi-field form for creating a new project. Handles text inputs,
 *   a select for project type, a simulated file upload, a tag input
 *   (comma-separated), and a collaborator selection.
 *
 * PROPS:
 *   onSubmit    — async function(formData) called with validated form data.
 *   courses     — Array of course objects for the course selector.
 *   users       — Array of all student users for the collaborators selector.
 *   loading     — boolean; disables and shows spinner on the submit button.
 *
 * REACT CONCEPTS USED:
 *   useState()       — One state object holds all form field values so a
 *                      single `handleChange` function updates any field.
 *
 *   Controlled form  — Every <input>, <select>, and <textarea> has its
 *                      `value` bound to the state object. This gives React
 *                      full control over the form and enables real-time
 *                      validation.
 *
 *   Form validation  — A `validate()` function runs on submit, builds an
 *                      errors object, and updates the `errors` state. Each
 *                      field checks for its corresponding error key to
 *                      display an inline error message.
 *
 *   Simulated file upload — The file input fires onChange, and we store
 *                      the filename as a string. No actual upload occurs;
 *                      we use a placeholder Unsplash URL as the thumbnail.
 */

import { useState } from 'react';
import { Upload, X, Plus } from 'lucide-react';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';

const INITIAL_FORM = {
  title:        '',
  description:  '',
  type:         'course',
  courseId:     '',
  github:       '',
  demoVideo:    '',
  tags:         [],       // array of strings
  teamMembers:  [],       // array of user IDs
  supervisorId: '',
  tagInput:     '',       // temporary value for the tag text field
};

export default function ProjectForm({ onSubmit, courses = [], users = [], loading = false }) {
  const [form, setForm]     = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [fileName, setFileName] = useState('');

  const students = users.filter((u) => u.role === 'student');
  const faculty  = users.filter((u) => u.role === 'faculty');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // ── Tag management ─────────────────────────────────────────────────────
  const addTag = () => {
    const tag = form.tagInput.trim();
    if (tag && !form.tags.includes(tag) && form.tags.length < 8) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag], tagInput: '' }));
    }
  };

  const removeTag = (tag) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  // ── Collaborator toggle ────────────────────────────────────────────────
  const toggleMember = (userId) => {
    setForm((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.includes(userId)
        ? prev.teamMembers.filter((id) => id !== userId)
        : [...prev.teamMembers, userId],
    }));
  };

  // ── Simulated file upload ──────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  // ── Validation ─────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.title.trim())        errs.title       = 'Project title is required.';
    if (!form.description.trim())  errs.description = 'Description is required.';
    if (form.description.trim().length < 50)
                                   errs.description = 'Description must be at least 50 characters.';
    if (form.type === 'course' && !form.courseId)
                                   errs.courseId    = 'Please select the associated course.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    await onSubmit({
      ...form,
      thumbnail: `https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80`,
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Title */}
      <Input
        label="Project Title"
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="e.g. AI-Assisted Code Review System"
        error={errors.title}
        required
      />

      {/* Description */}
      <Input
        as="textarea"
        label="Description"
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Describe your project: the problem it solves, your approach, and key achievements (min. 50 characters)..."
        error={errors.description}
        rows={5}
        required
      />

      {/* Type + Course row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Project Type <span className="text-red-400">*</span></label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="input-base"
          >
            <option value="course">Course Project</option>
            <option value="bachelor">Bachelor Thesis</option>
          </select>
        </div>

        {form.type === 'course' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Course <span className="text-red-400">*</span></label>
            <select
              name="courseId"
              value={form.courseId}
              onChange={handleChange}
              className={`input-base ${errors.courseId ? 'border-red-500' : ''}`}
            >
              <option value="">— Select course —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} – {c.name}
                </option>
              ))}
            </select>
            {errors.courseId && <p className="text-xs text-red-400">{errors.courseId}</p>}
          </div>
        )}
      </div>

      {/* Links row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="GitHub Repository URL"
          name="github"
          value={form.github}
          onChange={handleChange}
          placeholder="https://github.com/user/repo"
          type="url"
        />
        <Input
          label="Demo Video URL (YouTube embed)"
          name="demoVideo"
          value={form.demoVideo}
          onChange={handleChange}
          placeholder="https://www.youtube.com/embed/..."
          type="url"
        />
      </div>

      {/* Supervisor */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Supervisor (optional)</label>
        <select name="supervisorId" value={form.supervisorId} onChange={handleChange} className="input-base">
          <option value="">— None —</option>
          {faculty.map((f) => (
            <option key={f.id} value={f.id}>{f.name} — {f.department}</option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">
          Tags
          <span className="ml-1 text-xs text-slate-500 font-normal">(max 8 — press Enter or comma to add)</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            name="tagInput"
            value={form.tagInput}
            onChange={handleChange}
            onKeyDown={handleTagKeyDown}
            placeholder="e.g. React, Machine Learning, API"
            className="input-base flex-1"
          />
          <Button type="button" variant="secondary" size="md" onClick={addTag} leftIcon={<Plus size={15} />}>
            Add
          </Button>
        </div>
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {form.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => removeTag(tag)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-500/15 text-brand-300 border border-brand-500/30 text-xs rounded-full hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 transition-colors"
              >
                {tag}
                <X size={11} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Collaborators */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-300">
          Add Collaborators
          <span className="ml-1 text-xs text-slate-500 font-normal">(optional)</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
          {students.map((student) => {
            const selected = form.teamMembers.includes(student.id);
            return (
              <button
                key={student.id}
                type="button"
                onClick={() => toggleMember(student.id)}
                className={[
                  'flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all',
                  selected
                    ? 'bg-brand-600/20 border-brand-500/50 text-brand-300'
                    : 'bg-surface-700 border-surface-600 text-slate-300 hover:border-surface-500',
                ].join(' ')}
              >
                <img src={student.profilePic} alt={student.name} className="w-7 h-7 rounded-full bg-surface-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{student.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{student.major}</p>
                </div>
                {selected && <span className="ml-auto text-brand-400 text-xs font-medium shrink-0">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulated file upload */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">
          Project Files / Report
          <span className="ml-1 text-xs text-slate-500 font-normal">(simulated — PDF, ZIP)</span>
        </label>
        <label className="flex items-center justify-center gap-3 h-24 border-2 border-dashed border-surface-600 rounded-xl cursor-pointer hover:border-brand-500/50 hover:bg-brand-500/5 transition-colors">
          <input type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.zip,.doc,.docx" />
          <Upload size={20} className="text-slate-500" />
          <span className="text-sm text-slate-400">
            {fileName || 'Click to upload or drag & drop'}
          </span>
        </label>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={loading} size="lg">
          Create Project
        </Button>
      </div>
    </form>
  );
}
