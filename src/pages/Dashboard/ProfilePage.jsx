/**
 * ProfilePage.jsx — Public profile / portfolio view (students + faculty)
 *
 * COVERS:
 *   Student req 22 — Only portfolio-visible + public + active projects when
 *                    viewed by someone other than the owner.
 *   Student req 90 — Completed internships shown when present.
 *   Faculty req 4  — Faculty can add/view/update/remove bio, research interests,
 *                    education background.
 *   Faculty req 5  — Faculty can link/unlink themselves to courses (via
 *                    submitLinkRequest → admin approves).
 *   Faculty req 7  — Faculty profile shows linked courses + supervised projects
 *                    when viewed by anyone.
 *   Faculty req 8  — Profile-picture upload (works for any role).
 *
 * The page renders different sections based on the profile owner's role.
 *
 * REACT CONCEPTS USED:
 *   useState() — Edit-mode toggles, controlled form fields, async busy state.
 *   useEffect() — Fetches user, projects, courses, and link requests on mount.
 *   useMemo()  — Derives visible projects and linked-courses lists reactively.
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Github, Linkedin, Edit2, Save, X, BookOpen, MapPin, GraduationCap,
  Briefcase, Camera, Plus, Trash2, FlaskConical, Building2, MessageCircle,
  Link2, Link2Off, Send,
} from 'lucide-react';
import PageWrapper   from '@/components/layout/PageWrapper';
import Breadcrumbs   from '@/components/layout/Breadcrumbs';
import ProjectCard   from '@/components/project/ProjectCard';
import SkillBadge    from '@/components/portfolio/SkillBadge';
import Badge         from '@/components/common/Badge';
import Button        from '@/components/common/Button';
import Input         from '@/components/common/Input';
import Modal         from '@/components/common/Modal';
import Loader        from '@/components/common/Loader';
import FileUpload    from '@/components/common/FileUpload';
import FavoriteButton from '@/components/common/FavoriteButton';
import { useAuth }        from '@/hooks/useAuth';
import { useDataContext } from '@/context/DataContext';
import { getRoleMeta, formatDate } from '@/utils/formatters';

export default function ProfilePage() {
  const { userId } = useParams();
  const { currentUser, updateProfile } = useAuth();
  const {
    fetchUserById, fetchProjects, toggleLike,
    updateUser, toggleFavoritePortfolio, toggleFavoriteProject,
    courses, linkRequests, submitLinkRequest,
  } = useDataContext();

  const [user, setUser]         = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing]   = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);

  /* Common (shared) form fields */
  const [editForm, setEditForm] = useState({
    bio: '', github: '', linkedin: '', skillInput: '', skills: [], profilePic: '',
    title: '', researchInterests: [], researchInput: '',
    educationBackground: [], eduDraft: { degree: '', institution: '', year: '' },
  });

  const isOwner     = currentUser?.id === userId;
  const isFavorited = (currentUser?.savedPortfolios || []).includes(userId);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [u, p] = await Promise.all([fetchUserById(userId), fetchProjects()]);
        if (cancelled) return;
        if (!u) { setNotFound(true); return; }
        setUser(u);
        setProjects(p);
        setEditForm({
          bio:                 u.bio || '',
          github:              u.github || '',
          linkedin:            u.linkedin || '',
          skillInput:          '',
          skills:              u.skills || [],
          profilePic:          u.profilePic || '',
          title:               u.title || '',
          researchInterests:   u.researchInterests || [],
          researchInput:       '',
          educationBackground: u.educationBackground || [],
          eduDraft:            { degree: '', institution: '', year: '' },
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [userId, fetchUserById, fetchProjects]);

  /* ── Derived lists ─────────────────────────────────────── */

  // Student req 22 — non-owners only see portfolio-visible, public, active projects
  const visibleProjects = useMemo(() => {
    const all = projects.filter((p) => p.teamMembers?.includes(userId));
    if (isOwner) return all;
    if (user?.role === 'faculty') {
      // Faculty profile shows projects they SUPERVISE, not project-team membership
      return projects.filter((p) =>
        p.supervisorId === userId && p.visibility === 'public' && p.isActive !== false
      );
    }
    const allowed = new Set(user?.portfolioVisibleProjectIds || []);
    return all.filter((p) =>
      allowed.has(p.id) && p.visibility === 'public' && p.isActive !== false
    );
  }, [projects, userId, isOwner, user]);

  const supervisedProjects = useMemo(
    () => projects.filter((p) => p.supervisorId === userId),
    [projects, userId]
  );

  // Faculty req 7 — courses this instructor is currently linked to
  const linkedCourses = useMemo(
    () => (courses || []).filter((c) => (c.instructorIds || []).includes(userId)),
    [courses, userId]
  );

  // Outstanding link/unlink requests submitted by this faculty (so we can
  // show a "pending" state in the UI without spamming the admin queue).
  const myPendingRequests = useMemo(
    () => (linkRequests || []).filter((r) => r.instructorId === userId && r.status === 'pending'),
    [linkRequests, userId]
  );

  /* ── Save profile edits (faculty req 4) ───────────────── */
  const handleSave = async () => {
    const updates = user?.role === 'faculty'
      ? {
          bio:                 editForm.bio,
          title:               editForm.title,
          profilePic:          editForm.profilePic,
          researchInterests:   editForm.researchInterests,
          educationBackground: editForm.educationBackground,
        }
      : {
          bio:        editForm.bio,
          github:     editForm.github,
          linkedin:   editForm.linkedin,
          skills:     editForm.skills,
          profilePic: editForm.profilePic,
        };
    if (isOwner) updateProfile(updates);
    await updateUser(userId, updates);
    setUser((prev) => ({ ...prev, ...updates }));
    setEditing(false);
  };

  const handleToggleFavorite = async () => {
    await toggleFavoritePortfolio(currentUser.id, userId);
    const next = isFavorited
      ? (currentUser.savedPortfolios || []).filter((x) => x !== userId)
      : [...(currentUser.savedPortfolios || []), userId];
    updateProfile({ savedPortfolios: next });
  };

  /* ── Tag editors (skills + research interests) ────────── */
  const addSkill = () => {
    const s = editForm.skillInput.trim();
    if (s && !editForm.skills.includes(s)) {
      setEditForm((f) => ({ ...f, skills: [...f.skills, s], skillInput: '' }));
    }
  };
  const addInterest = () => {
    const s = editForm.researchInput.trim();
    if (s && !editForm.researchInterests.includes(s)) {
      setEditForm((f) => ({ ...f, researchInterests: [...f.researchInterests, s], researchInput: '' }));
    }
  };
  const addEducation = () => {
    const d = editForm.eduDraft;
    if (!d.degree.trim() || !d.institution.trim()) return;
    setEditForm((f) => ({
      ...f,
      educationBackground: [
        ...f.educationBackground,
        { id: `edu-${Date.now()}`, degree: d.degree.trim(), institution: d.institution.trim(), year: Number(d.year) || null },
      ],
      eduDraft: { degree: '', institution: '', year: '' },
    }));
  };
  const removeEducation = (id) => setEditForm((f) => ({
    ...f, educationBackground: f.educationBackground.filter((e) => e.id !== id),
  }));

  if (loading) return <PageWrapper><Loader message="Loading profile…" /></PageWrapper>;

  if (notFound) {
    return (
      <PageWrapper>
        <div className="max-w-md mx-auto text-center py-20">
          <p className="text-6xl mb-4">👤</p>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Profile Not Found</h1>
          <p className="text-slate-400 mb-6">This user profile does not exist.</p>
          <Link to="/explore/portfolios"><Button variant="secondary">Browse Portfolios</Button></Link>
        </div>
      </PageWrapper>
    );
  }

  const roleMeta  = getRoleMeta(user.role);
  const isFaculty = user.role === 'faculty';

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto space-y-8">
        <Breadcrumbs
          crumbs={[
            { label: isFaculty ? 'Course Instructors' : 'Browse Portfolios',
              to:    isFaculty ? '/instructors'        : '/explore/portfolios' },
            { label: user.name },
          ]}
        />

        {/* ── Header card ─────────────────────────────────── */}
        <div className="card p-6 flex flex-col sm:flex-row gap-5 items-start">
          <div className="relative shrink-0">
            <img
              src={editing ? editForm.profilePic : user.profilePic}
              alt={user.name}
              className="w-20 h-20 rounded-2xl bg-surface-700 border-2 border-surface-600 object-cover"
            />
            {editing && (
              <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-500 border-2 border-surface-800 flex items-center justify-center text-white">
                <Camera size={13} />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-100">{user.name}</h1>
                <div className="flex items-center gap-2 flex-wrap mt-1.5">
                  <Badge variant={user.role === 'student' ? 'blue' : isFaculty ? 'violet' : 'green'} size="sm">
                    {roleMeta.label}
                  </Badge>
                  {isFaculty && (editing ? null : user.title) && <span className="text-xs text-slate-500">{user.title}</span>}
                  {user.gucId && <span className="text-xs text-slate-500">{user.gucId}</span>}
                  {user.year  && <span className="flex items-center gap-1 text-xs text-slate-500"><GraduationCap size={11} /> Year {user.year}</span>}
                </div>
                <p className="text-sm text-slate-400 mt-1 flex items-center gap-1">
                  <MapPin size={12} /> {user.department}{user.major ? ` — ${user.major}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!isOwner && currentUser && (
                  <>
                    <Link to={`/messages?with=${userId}`}>
                      <Button variant="secondary" size="sm" leftIcon={<MessageCircle size={13} />}>
                        Message
                      </Button>
                    </Link>
                    <FavoriteButton
                      isFavorited={isFavorited}
                      onToggle={handleToggleFavorite}
                      variant="pill"
                      label={isFaculty ? 'Save Profile' : 'Save Portfolio'}
                    />
                  </>
                )}
                {isOwner && !editing && (
                  <Button variant="secondary" size="sm" leftIcon={<Edit2 size={13} />} onClick={() => setEditing(true)}>
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>

            {editing ? (
              <div className="mt-4 space-y-3">
                <FileUpload
                  label="Profile picture"
                  accept="image/*"
                  helperText="JPG, PNG — max 5 MB (req 8)"
                  maxSizeMB={5}
                  onUploaded={(rec) => {
                    // Use the real uploaded image (data URL embedded by
                    // mockUploadFile). Fall back to a generated avatar only
                    // when the file wasn't an image we could read.
                    const url = rec.dataUrl
                      || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(rec.fileName)}`;
                    setEditForm((f) => ({ ...f, profilePic: url }));
                  }}
                />
                {isFaculty && (
                  <Input
                    label="Title"
                    value={editForm.title}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Associate Professor"
                  />
                )}
                <Input
                  as="textarea"
                  label="Bio"
                  value={editForm.bio}
                  onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  placeholder={isFaculty ? 'Short biography for students and visitors.' : 'Tell people about yourself…'}
                />

                {!isFaculty && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="GitHub URL"   value={editForm.github}   onChange={(e) => setEditForm((f) => ({ ...f, github: e.target.value }))}   placeholder="https://github.com/…" />
                    <Input label="LinkedIn URL" value={editForm.linkedin} onChange={(e) => setEditForm((f) => ({ ...f, linkedin: e.target.value }))} placeholder="https://linkedin.com/in/…" />
                  </div>
                )}

                {!isFaculty && (
                  <div>
                    <label className="text-sm font-medium text-slate-300 block mb-1.5">Skills</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        value={editForm.skillInput}
                        onChange={(e) => setEditForm((f) => ({ ...f, skillInput: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                        placeholder="Add a skill…"
                        className="input-base flex-1 text-sm py-2"
                      />
                      <Button type="button" variant="secondary" size="sm" onClick={addSkill}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {editForm.skills.map((s) => (
                        <SkillBadge
                          key={s}
                          skill={s}
                          onRemove={() => setEditForm((f) => ({ ...f, skills: f.skills.filter((sk) => sk !== s) }))}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Faculty-only: research interests + education background (req 4) */}
                {isFaculty && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-slate-300 block mb-1.5 flex items-center gap-1.5">
                        <FlaskConical size={13} /> Research interests
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          value={editForm.researchInput}
                          onChange={(e) => setEditForm((f) => ({ ...f, researchInput: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addInterest(); } }}
                          placeholder="e.g. Distributed Systems"
                          className="input-base flex-1 text-sm py-2"
                        />
                        <Button type="button" variant="secondary" size="sm" onClick={addInterest}>Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {editForm.researchInterests.map((s) => (
                          <SkillBadge
                            key={s}
                            skill={s}
                            onRemove={() => setEditForm((f) => ({ ...f, researchInterests: f.researchInterests.filter((sk) => sk !== s) }))}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-300 block mb-1.5 flex items-center gap-1.5">
                        <GraduationCap size={13} /> Education background
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                        <Input
                          placeholder="Degree (e.g. Ph.D. in CS)"
                          value={editForm.eduDraft.degree}
                          onChange={(e) => setEditForm((f) => ({ ...f, eduDraft: { ...f.eduDraft, degree: e.target.value } }))}
                        />
                        <Input
                          placeholder="Institution"
                          value={editForm.eduDraft.institution}
                          onChange={(e) => setEditForm((f) => ({ ...f, eduDraft: { ...f.eduDraft, institution: e.target.value } }))}
                        />
                        <div className="flex gap-2">
                          <Input
                            placeholder="Year"
                            type="number"
                            value={editForm.eduDraft.year}
                            onChange={(e) => setEditForm((f) => ({ ...f, eduDraft: { ...f.eduDraft, year: e.target.value } }))}
                          />
                          <Button type="button" size="sm" leftIcon={<Plus size={13} />} onClick={addEducation}>Add</Button>
                        </div>
                      </div>
                      <ul className="space-y-1.5">
                        {editForm.educationBackground.map((e) => (
                          <li key={e.id} className="flex items-center gap-2 px-3 py-2 bg-surface-900 border border-surface-700 rounded-lg text-xs text-slate-300">
                            <span className="flex-1 truncate">
                              <strong className="text-slate-200">{e.degree}</strong>
                              {e.institution ? `, ${e.institution}` : ''}{e.year ? ` (${e.year})` : ''}
                            </span>
                            <button type="button" onClick={() => removeEducation(e.id)} className="text-slate-500 hover:text-red-400">
                              <Trash2 size={12} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-1">
                  <Button size="sm" leftIcon={<Save size={13} />} onClick={handleSave}>Save Changes</Button>
                  <Button size="sm" variant="ghost" leftIcon={<X size={13} />} onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-slate-300 leading-relaxed">
                  {user.bio || <span className="italic text-slate-600">No bio yet.</span>}
                </p>

                {user.thesisTitle && (
                  <div className="bg-accent-500/10 border border-accent-500/20 rounded-lg px-3 py-2">
                    <p className="text-[11px] text-accent-400 font-medium mb-0.5 flex items-center gap-1"><BookOpen size={11} /> Bachelor Thesis</p>
                    <p className="text-sm text-slate-300">{user.thesisTitle}</p>
                  </div>
                )}

                {!isFaculty && (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {(user.skills || []).map((s) => <SkillBadge key={s} skill={s} />)}
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      {user.github   && <a href={user.github}   target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"><Github size={14} /> GitHub</a>}
                      {user.linkedin && <a href={user.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-400 transition-colors"><Linkedin size={14} /> LinkedIn</a>}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Faculty: research interests + education background (req 4, 7) ── */}
        {isFaculty && !editing && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <section className="card p-5">
              <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FlaskConical size={14} className="text-brand-400" /> Research interests
              </h2>
              {(user.researchInterests || []).length === 0 ? (
                <p className="text-xs text-slate-500 italic">No research interests listed yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(user.researchInterests || []).map((r) => <SkillBadge key={r} skill={r} />)}
                </div>
              )}
            </section>

            <section className="card p-5">
              <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                <GraduationCap size={14} className="text-brand-400" /> Education background
              </h2>
              {(user.educationBackground || []).length === 0 ? (
                <p className="text-xs text-slate-500 italic">No education entries yet.</p>
              ) : (
                <ul className="space-y-2">
                  {(user.educationBackground || []).map((e) => (
                    <li key={e.id} className="text-sm text-slate-300">
                      <p className="font-medium text-slate-200">{e.degree}</p>
                      <p className="text-xs text-slate-500">{e.institution}{e.year ? ` · ${e.year}` : ''}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        {/* ── Faculty: linked courses (req 5, 7) ───────────── */}
        {isFaculty && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <BookOpen size={18} className="text-brand-400" />
                Linked Courses ({linkedCourses.length})
              </h2>
              {isOwner && (
                <Button size="sm" variant="secondary" leftIcon={<Link2 size={13} />} onClick={() => setShowCourseModal(true)}>
                  Manage courses
                </Button>
              )}
            </div>
            {linkedCourses.length === 0 ? (
              <div className="card p-8 text-center text-slate-500 text-sm">
                <BookOpen size={28} className="mx-auto mb-2 opacity-30" />
                {isOwner
                  ? "You aren't linked to any courses yet. Click 'Manage courses' to send a link request to admin."
                  : 'This instructor is not currently linked to any courses.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {linkedCourses.map((c) => (
                  <div key={c.id} className="card p-4">
                    <p className="text-xs text-brand-400 font-mono">{c.code}</p>
                    <p className="text-sm font-semibold text-slate-200 mt-0.5">{c.name}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{c.department || '—'}</p>
                  </div>
                ))}
              </div>
            )}
            {isOwner && myPendingRequests.length > 0 && (
              <p className="mt-3 text-xs text-amber-300/80 flex items-center gap-1.5">
                <Send size={11} />
                You have {myPendingRequests.length} pending link request{myPendingRequests.length !== 1 ? 's' : ''} awaiting admin approval.
              </p>
            )}
          </section>
        )}

        {/* Completed internships — req 90 (students only) */}
        {(user.completedInternships?.length ?? 0) > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
              <Briefcase size={18} className="text-brand-400" /> Completed Internships
            </h2>
            <ul className="space-y-2">
              {user.completedInternships.map((ci) => (
                <li key={ci.id} className="card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-500/15 border border-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
                    <Briefcase size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{ci.title}</p>
                    <p className="text-xs text-slate-500">{ci.companyName} • {formatDate(ci.startDate)} – {formatDate(ci.endDate)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Projects */}
        <section>
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            {isFaculty ? `Supervised Projects (${supervisedProjects.length})` : `Projects (${visibleProjects.length})`}
            {isOwner && !isFaculty && (
              <Link to="/projects" className="ml-3 text-sm font-normal text-brand-400 hover:text-brand-300 transition-colors">
                Manage portfolio →
              </Link>
            )}
          </h2>
          {visibleProjects.length === 0 ? (
            <div className="card p-10 text-center text-slate-500">
              <BookOpen size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">
                {isFaculty ? 'No supervised projects yet.' : (isOwner ? "You haven't added any projects to your portfolio yet." : 'No public projects on this portfolio yet.')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleProjects.map((p) => (
                <ProjectCard key={p.id} project={p} users={[user]} onLike={toggleLike} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Faculty: manage-courses modal (req 5) ──────────────── */}
      {isFaculty && isOwner && (
        <ManageCoursesModal
          isOpen={showCourseModal}
          onClose={() => setShowCourseModal(false)}
          courses={courses}
          linkedCourseIds={linkedCourses.map((c) => c.id)}
          pendingRequests={myPendingRequests}
          onSubmit={async (courseId, type, reason) => {
            await submitLinkRequest(userId, courseId, type, reason);
          }}
        />
      )}
    </PageWrapper>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Manage-courses modal — used by faculty to submit link/unlink requests.
 * Each request is sent to /admin/courses for admin approval.
 * ────────────────────────────────────────────────────────────────────────── */
function ManageCoursesModal({ isOpen, onClose, courses, linkedCourseIds, pendingRequests, onSubmit }) {
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('');
  const [pendingId, setPendingId] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (courses || []).filter((c) =>
      !q ||
      (c.code || '').toLowerCase().includes(q) ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.department || '').toLowerCase().includes(q)
    );
  }, [courses, search]);

  const hasPending = (courseId) => pendingRequests.some((r) => r.courseId === courseId);

  const handleClick = async (course) => {
    if (hasPending(course.id)) return;
    const isLinked = linkedCourseIds.includes(course.id);
    setPendingId(course.id);
    try {
      await onSubmit(course.id, isLinked ? 'unlink' : 'link', reason);
      setReason('');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage your linked courses"
      size="lg"
      footer={<Button variant="ghost" onClick={onClose}>Done</Button>}
    >
      <p className="text-xs text-slate-400 mb-3 leading-relaxed">
        Submitting a link or unlink request notifies the platform administrators. Once approved, the course
        will appear on your profile and be associated with you in project filters.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <Input
          placeholder="Search courses by code, name, department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Input
          placeholder="Optional reason for the request"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      <div className="max-h-[420px] overflow-y-auto pr-1 space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No courses match your search.</p>
        ) : filtered.map((c) => {
          const linked  = linkedCourseIds.includes(c.id);
          const pending = hasPending(c.id);
          return (
            <div key={c.id} className="card p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-brand-300">{c.code}</p>
                <p className="text-sm font-medium text-slate-200">{c.name}</p>
                <p className="text-[11px] text-slate-500">{c.department || '—'}</p>
              </div>
              {pending ? (
                <Badge variant="amber" size="sm" dot>Pending</Badge>
              ) : (
                <Button
                  size="sm"
                  variant={linked ? 'danger' : 'success'}
                  leftIcon={linked ? <Link2Off size={13} /> : <Link2 size={13} />}
                  onClick={() => handleClick(c)}
                  loading={pendingId === c.id}
                >
                  {linked ? 'Request unlink' : 'Request link'}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
