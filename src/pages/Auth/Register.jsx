/**
 * Register.jsx — Authentication: new account registration page
 *
 * COVERS:
 *   Faculty req 2 — "Register (sign up) using my first name, last name,
 *                   email and password" — by exposing a role selector.
 *   Admin  req 14 — Employer applications start here when role=recruiter:
 *                   the new account gets `applicationStatus='pending'` and
 *                   the user is shown a "review pending" confirmation
 *                   instead of being auto-logged-in.
 *
 * REACT CONCEPTS USED:
 *   useState()  — Single state object for all form fields + errors + role.
 *   Controlled form — All inputs feed `form` via a shared handleChange.
 *   useEffect() — Redirect away if already signed in.
 *   FileUpload  — Recruiters can attach company documents during signup.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Lock, Hash, BookOpen, GraduationCap,
  Building2, MapPin, Phone, FileText, ShieldCheck, CheckCircle2,
  Eye, EyeOff,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Button     from '@/components/common/Button';
import Input      from '@/components/common/Input';
import FileUpload from '@/components/common/FileUpload';

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Media Engineering & Technology',
  'Engineering — Electronics',
  'Engineering — Mechatronics',
  'Management Technology',
  'Architecture',
  'Pharmacy & Biotechnology',
];

const ROLES = [
  { id: 'student',   label: 'Student',          desc: 'Showcase projects, get feedback, apply to internships.', icon: GraduationCap, color: 'blue' },
  { id: 'faculty',   label: 'Course Instructor', desc: 'Supervise theses, give feedback, manage your courses.',  icon: BookOpen,      color: 'violet' },
  { id: 'recruiter', label: 'Employer',         desc: 'Discover talent and post internships once approved.',    icon: Building2,     color: 'green' },
];

export default function Register() {
  const { register, isAuthenticated, authLoading } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '',
    name: '', email: '', password: '', confirmPassword: '',
    gucId: '', department: '', major: '', year: '',     // student
    title: '', bio: '',                                  // faculty
    company: '', companyAddress: '', companyPhone: '',   // recruiter
    companyBio: '', jobTitle: '', companyDocs: [],
  });
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);
  const [pendingMsg, setPendingMsg] = useState(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required.';
    if (!form.lastName.trim())  errs.lastName  = 'Last name is required.';
    if (!form.email.trim())                                  errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Please enter a valid email address.';
    if (!form.password)                       errs.password = 'Password is required.';
    else if (form.password.length < 8)        errs.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';

    if (role === 'student') {
      if (!form.department) errs.department = 'Please select your department.';
      if (form.year && (Number(form.year) < 1 || Number(form.year) > 5))
        errs.year = 'Year must be between 1 and 5.';
    } else if (role === 'faculty') {
      if (!form.department) errs.department = 'Please select your department.';
    } else if (role === 'recruiter') {
      if (!form.company.trim()) errs.company = 'Company name is required.';
      if ((form.companyDocs || []).length === 0) errs.companyDocs = 'Please attach at least one verifying document (e.g. tax certificate).';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const fullName = `${form.firstName} ${form.lastName}`.trim();
    setLoading(true);
    try {
      const result = await register({ ...form, name: fullName, role });
      if (result?.requiresApproval) {
        setPendingMsg(`Thanks ${form.firstName}! Your application for ${form.company} has been submitted and is now awaiting administrator review. You'll receive a confirmation email once approved.`);
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Pending-approval confirmation screen for recruiters ─────────── */
  if (pendingMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface-900">
        <div className="w-full max-w-md card p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 mx-auto flex items-center justify-center mb-4">
            <CheckCircle2 size={26} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">Application submitted</h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">{pendingMsg}</p>
          <Link to="/login">
            <Button fullWidth>Back to sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-900">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/login" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">GUC<span className="text-brand-400">Portfolio</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-100 mb-1">Create your account</h1>
          <p className="text-sm text-slate-400">Choose how you'll be using the platform.</p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const active = r.id === role;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={[
                  'card p-4 text-left transition-all',
                  active ? 'border-brand-500/60 bg-brand-500/5 ring-1 ring-brand-500/40'
                         : 'hover:border-surface-600',
                ].join(' ')}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                  r.color === 'blue'   ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30' :
                  r.color === 'violet' ? 'bg-accent-500/15 text-accent-400 border border-accent-500/30' :
                                          'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                }`}>
                  <Icon size={18} />
                </div>
                <p className="text-sm font-semibold text-slate-200">{r.label}</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{r.desc}</p>
              </button>
            );
          })}
        </div>

        <div className="card p-6">
          {apiError && (
            <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
              ⚠ {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Common: name + email + password */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                leftIcon={<User size={15} />}
                error={errors.firstName}
                required
              />
              <Input
                label="Last name"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                error={errors.lastName}
                required
              />
            </div>

            <Input
              label={role === 'recruiter' ? 'Work email' : 'Email'}
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder={role === 'recruiter' ? 'you@company.com' : 'you@student.guc.edu.eg'}
              leftIcon={<Mail size={15} />}
              error={errors.email}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                leftIcon={<Lock size={15} />}
                rightIcon={(
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="rounded-md p-1 text-slate-500 hover:bg-surface-700 hover:text-slate-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
                error={errors.password}
                required
                helperText="Min. 8 characters"
              />
              <Input
                label="Confirm password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                leftIcon={<Lock size={15} />}
                rightIcon={(
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="rounded-md p-1 text-slate-500 hover:bg-surface-700 hover:text-slate-200"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showConfirmPassword}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
                error={errors.confirmPassword}
                required
              />
            </div>

            {/* Role-specific fields */}
            {role === 'student' && (
              <>
                <Input
                  label="GUC student ID"
                  name="gucId"
                  value={form.gucId}
                  onChange={handleChange}
                  placeholder="e.g. 46-12345"
                  leftIcon={<Hash size={15} />}
                  helperText="Optional — displays on your portfolio"
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300">
                    Department <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    className={`input-base ${errors.department ? 'border-red-500' : ''}`}
                  >
                    <option value="">— Select your department —</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.department && <p className="text-xs text-red-400">{errors.department}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Major / specialisation"
                    name="major"
                    value={form.major}
                    onChange={handleChange}
                    placeholder="e.g. Computer Science"
                    leftIcon={<GraduationCap size={15} />}
                  />
                  <Input
                    label="Academic year"
                    name="year"
                    type="number"
                    value={form.year}
                    onChange={handleChange}
                    placeholder="1–5"
                    error={errors.year}
                    min="1" max="5"
                  />
                </div>
              </>
            )}

            {role === 'faculty' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300">
                    Department <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    className={`input-base ${errors.department ? 'border-red-500' : ''}`}
                  >
                    <option value="">— Select your department —</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.department && <p className="text-xs text-red-400">{errors.department}</p>}
                </div>
                <Input
                  label="Title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Assistant Professor"
                  helperText="Optional — defaults to 'Lecturer'"
                />
                <Input
                  as="textarea"
                  rows={3}
                  label="Short bio"
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Tell students a bit about yourself, your courses, and your research."
                />
                <div className="text-[11px] text-slate-500 flex items-start gap-2 p-3 bg-surface-900 border border-surface-700 rounded-lg">
                  <ShieldCheck size={14} className="text-brand-400 shrink-0 mt-0.5" />
                  <span>You'll be able to link/unlink to courses you teach from your profile after signing in.</span>
                </div>
              </>
            )}

            {role === 'recruiter' && (
              <>
                <Input
                  label="Company name"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  leftIcon={<Building2 size={15} />}
                  error={errors.company}
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Address"
                    name="companyAddress"
                    value={form.companyAddress}
                    onChange={handleChange}
                    leftIcon={<MapPin size={15} />}
                    placeholder="Smart Village, Egypt"
                  />
                  <Input
                    label="Phone"
                    name="companyPhone"
                    value={form.companyPhone}
                    onChange={handleChange}
                    leftIcon={<Phone size={15} />}
                    placeholder="+20 2 …"
                  />
                </div>
                <Input
                  label="Your role"
                  name="jobTitle"
                  value={form.jobTitle}
                  onChange={handleChange}
                  placeholder="e.g. Talent Acquisition Lead"
                />
                <Input
                  as="textarea"
                  rows={3}
                  label="Company description"
                  name="companyBio"
                  value={form.companyBio}
                  onChange={handleChange}
                  placeholder="What does your company do? What kind of talent are you looking for?"
                />
                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-1.5">
                    Verifying documents <span className="text-red-400">*</span>
                  </label>
                  <FileUpload
                    accept=".pdf,application/pdf"
                    label=""
                    helperText="Tax certificate, commercial registration, or trade licence (PDF). Upload one at a time."
                    onUploaded={(rec) => setForm((f) => ({ ...f, companyDocs: [...(f.companyDocs || []), rec] }))}
                  />
                  {(form.companyDocs || []).length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {form.companyDocs.map((doc) => (
                        <li key={doc.id} className="flex items-center gap-2 px-3 py-2 bg-surface-900 border border-surface-700 rounded-lg text-xs text-slate-300">
                          <FileText size={13} className="text-red-400 shrink-0" />
                          <span className="truncate flex-1">{doc.fileName}</span>
                          <button
                            type="button"
                            className="text-slate-500 hover:text-red-400"
                            onClick={() => setForm((f) => ({ ...f, companyDocs: (f.companyDocs || []).filter((d) => d.id !== doc.id) }))}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {errors.companyDocs && <p className="text-xs text-red-400 mt-1.5">{errors.companyDocs}</p>}
                </div>
                <div className="text-[11px] text-amber-300/90 flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                  <ShieldCheck size={14} className="shrink-0 mt-0.5" />
                  <span>Employer accounts are created in <strong>pending</strong> status. An administrator will review your documents before granting access.</span>
                </div>
              </>
            )}

            <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
              {role === 'recruiter' ? 'Submit application' : 'Create account'}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
