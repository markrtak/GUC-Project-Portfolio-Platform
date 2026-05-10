/**
 * ProjectDetail.jsx — Full project view with tabs and all student actions
 *
 * PURPOSE:
 *   The hub page of the application. Implements MS2 student requirements:
 *     - Req 19 (delete via menu, edit via /edit)
 *     - Req 20 (visibility toggle)
 *     - Req 22 (visible-on-portfolio shortcut)
 *     - Req 23, 24 (thesis drafts tab — bachelor projects only)
 *     - Req 25–31 (collaborators tab)
 *     - Req 32–34, 40 (tasks tab — reorderable, instructor comments)
 *     - Req 38, 39 (overall feedback + ratings tab)
 *     - Req 59–61 (flag + appeal flow)
 *     - Req 65 (favorite)
 *     - Read-only project report download (req 17 from public side)
 *
 * REACT CONCEPTS USED:
 *   useParams()  — Reads :id from URL
 *   useState()   — Tracks loading, project, all related data, and modal state
 *   useEffect()  — Single fetch of project + courses + users on mount
 *   useMemo()    — Derives team-member objects from teamMembers + users
 *   useCallback  — Memoises callback handlers passed to child components
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import {
  Github, ExternalLink, Calendar, Users, Tag, Eye, EyeOff,
  Heart, BookOpen, Play, ArrowLeft, Code2, ListChecks,
  GraduationCap, MessageSquare, Award, FileText, Star, Lock,
} from 'lucide-react';
import PageWrapper       from '@/components/layout/PageWrapper';
import Breadcrumbs       from '@/components/layout/Breadcrumbs';
import Loader            from '@/components/common/Loader';
import Badge             from '@/components/common/Badge';
import Button            from '@/components/common/Button';
import Tabs              from '@/components/common/Tabs';
import DocViewer         from '@/components/common/DocViewer';
import FavoriteButton    from '@/components/common/FavoriteButton';
import FeedbackList      from '@/components/project/FeedbackList';
import TaskBoard         from '@/components/project/TaskBoard';
import ThesisDrafts      from '@/components/project/ThesisDrafts';
import CollaboratorManager from '@/components/project/CollaboratorManager';
import ProjectActionsMenu from '@/components/project/ProjectActionsMenu';
import FlagModal         from '@/components/project/FlagModal';
import AppealForm        from '@/components/project/AppealForm';
import ProjectRating     from '@/components/project/ProjectRating';
import { useDataContext } from '@/context/DataContext';
import { useAuth }       from '@/hooks/useAuth';
import { formatDate, getStatusMeta } from '@/utils/formatters';

export default function ProjectDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, updateProfile } = useAuth();

  const {
    fetchProjectById, fetchUsers, fetchCourses,
    addFeedback, editFeedback, removeFeedback, rateProject,
    addTaskComment, editTaskComment, removeTaskComment,
    toggleLike, incrementView,
    deleteProject, setVisibility,
    uploadThesisDraft, removeThesisDraft, setFinalThesisDraft,
    sendInvitation, cancelInvitation, removeCollaborator, searchUsers,
    createTask, updateTask, deleteTask, reorderTasks,
    flagProject, sendAppeal,
    toggleFavoriteProject,
  } = useDataContext();

  const [project, setProject]   = useState(null);
  const [users, setUsers]       = useState([]);
  const [courses, setCourses]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [liked, setLiked]         = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [flagOpen, setFlagOpen]   = useState(false);

  /* ── Initial load ──────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchProjectById(id), fetchUsers(), fetchCourses()])
      .then(([p, u, c]) => {
        if (cancelled) return;
        if (!p) { setNotFound(true); return; }
        setProject(p); setUsers(u); setCourses(c); setLikeCount(p.likes);
        incrementView(id);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, fetchProjectById, fetchUsers, fetchCourses, incrementView]);

  /* ── Refresh helper after mutations ─────────────────────────────── */
  const refresh = useCallback(async () => {
    const fresh = await fetchProjectById(id);
    setProject(fresh);
  }, [id, fetchProjectById]);

  /* ── Derived values ────────────────────────────────────────────── */
  const isOwner    = project?.ownerId === currentUser?.id;
  const isMember   = project?.teamMembers?.includes(currentUser?.id);
  const isEmployer = currentUser?.role === 'recruiter';
  const supervisor = users.find((u) => u.id === project?.supervisorId);
  const course     = courses.find((c) => c.id === project?.courseId);
  const members    = useMemo(
    () => (project?.teamMembers ?? []).map((uid) => users.find((u) => u.id === uid)).filter(Boolean),
    [project, users]
  );
  const isFavorited = (currentUser?.savedProjects || []).includes(id);

  /* ── Action handlers ───────────────────────────────────────────── */
  const handleLike = async () => {
    if (liked) return;
    setLiked(true); setLikeCount((c) => c + 1);
    await toggleLike(id);
  };

  const handleAddFeedback    = async (projectId, fb)              => { await addFeedback(projectId, fb);              await refresh(); };
  const handleEditFeedback   = async (projectId, fbId, updates)   => { await editFeedback(projectId, fbId, updates); await refresh(); };
  const handleRemoveFeedback = async (projectId, fbId)            => { await removeFeedback(projectId, fbId);        await refresh(); };

  const handleRate = async (value) => { await rateProject(id, value, currentUser.id); await refresh(); };

  const handleAddTaskComment    = async (taskId, content)            => { await addTaskComment(id, taskId, { authorId: currentUser.id, content }); await refresh(); };
  const handleEditTaskComment   = async (taskId, commentId, content) => { await editTaskComment(id, taskId, commentId, content);                    await refresh(); };
  const handleRemoveTaskComment = async (taskId, commentId)          => { await removeTaskComment(id, taskId, commentId);                            await refresh(); };

  const handleDelete = async () => {
    await deleteProject(id);
    navigate('/projects');
  };

  const handleToggleVisibility = async (next) => {
    await setVisibility(id, next);
    setProject((p) => ({ ...p, visibility: next }));
  };

  const handleFlag = async (reason) => {
    await flagProject(id, reason, currentUser.id);
    await refresh();
  };

  const handleAppeal = async (message) => {
    await sendAppeal(id, message);
    await refresh();
  };

  const handleFavorite = async () => {
    await toggleFavoriteProject(currentUser.id, id);
    const next = isFavorited
      ? (currentUser.savedProjects || []).filter((x) => x !== id)
      : [...(currentUser.savedProjects || []), id];
    updateProfile({ savedProjects: next });
  };

  const handleUploadDraft  = async (rec) => { await uploadThesisDraft(id, rec); await refresh(); };
  const handleRemoveDraft  = async (did) => { await removeThesisDraft(id, did); await refresh(); };
  const handleSetFinal     = async (did) => { await setFinalThesisDraft(id, did); await refresh(); };

  const handleInvite       = async (uid, role) => { await sendInvitation(id, uid, role); await refresh(); };
  const handleCancelInvite = async (invId) => { await cancelInvitation(id, invId); await refresh(); };
  const handleRemoveCollab = async (uid) => { await removeCollaborator(id, uid); await refresh(); };

  const handleCreateTask  = async (data) => { await createTask(id, data); await refresh(); };
  const handleUpdateTask  = async (tid, upd) => { await updateTask(id, tid, upd); await refresh(); };
  const handleDeleteTask  = async (tid) => { await deleteTask(id, tid); await refresh(); };
  const handleReorderTasks = async (orderedIds) => { await reorderTasks(id, orderedIds); await refresh(); };

  /* ── Loading / 404 / private guard ─────────────────────────────── */
  if (loading)  return <PageWrapper><Loader message="Loading project…" /></PageWrapper>;
  if (notFound) {
    return (
      <PageWrapper>
        <div className="max-w-md mx-auto text-center py-20">
          <p className="text-6xl mb-4">🔍</p>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Project Not Found</h1>
          <p className="text-slate-400 mb-6">The project you're looking for doesn't exist or has been removed.</p>
          <Link to="/explore/projects"><Button leftIcon={<ArrowLeft size={15} />} variant="secondary">Browse projects</Button></Link>
        </div>
      </PageWrapper>
    );
  }

  if (project.visibility === 'private' && !isMember) {
    return (
      <PageWrapper>
        <div className="max-w-md mx-auto text-center py-20">
          <Lock size={36} className="mx-auto text-slate-600 mb-4" />
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Private Project</h1>
          <p className="text-slate-400 mb-6">This project's owner has set it to private.</p>
          <Link to="/explore/projects"><Button variant="secondary">Browse public projects</Button></Link>
        </div>
      </PageWrapper>
    );
  }

  if (!project.isActive) {
    return (
      <PageWrapper>
        <div className="max-w-md mx-auto text-center py-20">
          <BookOpen size={36} className="mx-auto text-red-500/60 mb-4" />
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Project Deactivated</h1>
          <p className="text-slate-400 mb-6">This project has been deactivated by an administrator.</p>
          <Link to="/explore/projects"><Button variant="secondary">Browse other projects</Button></Link>
        </div>
      </PageWrapper>
    );
  }

  const statusMeta = getStatusMeta(project.status);
  const isPrivate  = project.visibility === 'private';

  /* ── Tab content ───────────────────────────────────────────────── */
  const OverviewTab = (
    <div className="space-y-6">
      {/* Description */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <BookOpen size={15} className="text-brand-400" /> About this Project
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{project.description}</p>
      </div>

      {/* Demo video */}
      {project.demoVideo && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-surface-700">
            <Play size={15} className="text-brand-400" />
            <h2 className="text-sm font-semibold text-slate-200">Demo Video</h2>
          </div>
          <div className="relative pt-[56.25%] bg-black">
            <iframe src={project.demoVideo} title={`${project.title} Demo`} className="absolute inset-0 w-full h-full" allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          </div>
        </div>
      )}

      {/* Project report — req 17, 19 (download) */}
      {project.projectReport && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <FileText size={15} className="text-brand-400" /> Project Report
          </h2>
          <DocViewer file={project.projectReport} />
        </div>
      )}

      {/* Programming languages */}
      {project.programmingLanguages?.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Code2 size={15} className="text-brand-400" /> Programming Languages
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {project.programmingLanguages.map((l) => <Badge key={l} variant="violet" size="md">{l}</Badge>)}
          </div>
        </div>
      )}
    </div>
  );

  const TasksTab = (
    <TaskBoard
      project={project}
      members={members}
      isOwner={isOwner}
      currentUser={currentUser}
      onCreate={handleCreateTask}
      onUpdate={handleUpdateTask}
      onDelete={handleDeleteTask}
      onReorder={handleReorderTasks}
      onAddComment={handleAddTaskComment}
      onEditComment={handleEditTaskComment}
      onRemoveComment={handleRemoveTaskComment}
    />
  );

  const ThesisTab = (
    <ThesisDrafts
      project={project}
      isOwner={isOwner}
      onUpload={handleUploadDraft}
      onRemove={handleRemoveDraft}
      onSetFinal={handleSetFinal}
    />
  );

  const CollaboratorsTab = (
    <CollaboratorManager
      project={project}
      members={members}
      isOwner={isOwner}
      currentUser={currentUser}
      onSearch={searchUsers}
      onInvite={handleInvite}
      onCancel={handleCancelInvite}
      onRemove={handleRemoveCollab}
    />
  );

  // Faculty req 16 — only faculty (and admins, who use moderation tools) can rate
  const canRate = isAuthenticated && (currentUser?.role === 'faculty');

  const FeedbackTab = (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Star size={14} className="text-amber-400" /> Project rating
        </h2>
        <ProjectRating project={project} canRate={canRate} onRate={handleRate} />
        {!canRate && (
          <p className="text-[11px] text-slate-500 italic mt-2">
            Only course instructors can rate the entire project.
          </p>
        )}
      </section>

      <FeedbackList
        feedback={project.feedback}
        projectId={project.id}
        users={users}
        onAddFeedback={handleAddFeedback}
        onEditFeedback={handleEditFeedback}
        onRemoveFeedback={handleRemoveFeedback}
      />
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview',     icon: BookOpen,         content: OverviewTab },
    { id: 'tasks',    label: 'Tasks',        icon: ListChecks,       count: project.tasks?.length || 0,        content: TasksTab },
    ...(project.type === 'bachelor'
      ? [{ id: 'thesis', label: 'Thesis Drafts', icon: Award,         count: project.thesisDrafts?.length || 0, content: ThesisTab }]
      : []),
    { id: 'collab',   label: 'Collaborators', icon: Users,           count: members.length,                    content: CollaboratorsTab },
    { id: 'feedback', label: 'Feedback',      icon: MessageSquare,   count: project.feedback?.length || 0,     content: FeedbackTab },
  ];

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto space-y-6">
        <Breadcrumbs crumbs={[
          { label: 'Explore Projects', to: '/explore/projects' },
          { label: project.title },
        ]} />

        {/* Hero */}
        <div className="card overflow-hidden">
          <div className="relative h-56 sm:h-72 bg-surface-700">
            <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-900/85 via-surface-900/30 to-transparent" />

            <div className="absolute top-4 right-4 flex items-center gap-2">
              <FavoriteButton
                isFavorited={isFavorited}
                onToggle={handleFavorite}
                variant="pill"
                label="Save"
              />
              <ProjectActionsMenu
                project={project}
                isOwner={isOwner}
                isFavorited={isFavorited}
                canFlag={!isEmployer}
                onEdit={() => navigate(`/projects/${id}/edit`)}
                onDelete={handleDelete}
                onToggleVisibility={handleToggleVisibility}
                onFlag={() => setFlagOpen(true)}
                onToggleFavorite={handleFavorite}
              />
            </div>

            <div className="absolute bottom-4 left-5 right-5">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border ${statusMeta.className}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" /> {statusMeta.label}
                </span>
                <Badge variant={project.type === 'bachelor' ? 'violet' : 'blue'} size="sm">
                  {project.type === 'bachelor' ? 'Bachelor Thesis' : 'Course Project'}
                </Badge>
                {course      && <Badge variant="default" size="sm">{course.code}</Badge>}
                {isPrivate   && <Badge variant="amber"   size="sm" dot>Private</Badge>}
                {project.isFlagged && <Badge variant="red" size="sm">Flagged</Badge>}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-md leading-tight">{project.title}</h1>
              <div className="flex items-center gap-3 mt-3 text-sm text-white/80">
                <button onClick={handleLike} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 border border-white/10 backdrop-blur-sm transition-colors ${liked ? 'text-red-400' : 'hover:text-red-400'}`}>
                  <Heart size={14} fill={liked ? 'currentColor' : 'none'} /> {likeCount}
                </button>
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/30 border border-white/10 backdrop-blur-sm">
                  <Eye size={14} /> {project.views}
                </span>
                {project.rating > 0 && (
                  <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/30 border border-white/10 backdrop-blur-sm">
                    <Star size={14} fill="currentColor" className="text-amber-400" /> {project.rating}/5
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Flag/appeal banner — visible to owner if flagged */}
        {project.isFlagged && isOwner && (
          <AppealForm project={project} onSubmit={handleAppeal} />
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — tabs */}
          <div className="lg:col-span-2">
            <Tabs tabs={tabs} />
          </div>

          {/* Right sidebar */}
          <div className="space-y-3 order-first lg:order-last">
            {/* Team summary */}
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
                <Users size={15} className="text-brand-400" /> Team Members ({members.length})
              </h3>
              <ul className="space-y-2">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-2.5">
                    <Link to={`/profile/${m.id}`}>
                      <img src={m.profilePic} alt={m.name} className="w-8 h-8 rounded-full bg-surface-700 hover:ring-2 hover:ring-brand-500 transition" />
                    </Link>
                    <div className="min-w-0">
                      <Link to={`/profile/${m.id}`} className="text-sm font-medium text-slate-200 truncate hover:text-brand-300 transition-colors block">
                        {m.name}{m.id === project.ownerId && <span className="ml-1 text-amber-400 text-xs">★</span>}
                      </Link>
                      <p className="text-[11px] text-slate-500 truncate">{m.major || m.department}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Supervisor */}
            {supervisor && (
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <GraduationCap size={15} className="text-accent-400" /> Supervisor
                </h3>
                <Link to={`/profile/${supervisor.id}`} className="flex items-center gap-2.5 hover:bg-surface-700 -m-2 p-2 rounded-lg transition-colors">
                  <img src={supervisor.profilePic} alt={supervisor.name} className="w-9 h-9 rounded-full bg-surface-700" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">{supervisor.name}</p>
                    <p className="text-[11px] text-accent-400">{supervisor.title}</p>
                  </div>
                </Link>
              </div>
            )}

            {/* Quick links */}
            <div className="card p-4 space-y-2">
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Links</h3>
              {project.github ? (
                <a href={project.github} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
                  <Github size={15} /> GitHub Repository
                  <ExternalLink size={11} className="ml-auto text-slate-600" />
                </a>
              ) : (
                <p className="text-xs text-slate-600 italic">No GitHub link provided</p>
              )}
            </div>

            {/* Tags */}
            {project.tags?.length > 0 && (
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
                  <Tag size={14} className="text-brand-400" /> Tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map((t) => <Badge key={t} variant="default" size="sm">{t}</Badge>)}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
                <Calendar size={14} className="text-brand-400" /> Timeline
              </h3>
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between"><span>Created</span><span className="text-slate-300">{formatDate(project.createdAt)}</span></div>
                <div className="flex justify-between"><span>Last updated</span><span className="text-slate-300">{formatDate(project.updatedAt)}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Flag modal */}
        {!isEmployer && (
          <FlagModal
            isOpen={flagOpen}
            projectTitle={project.title}
            onSubmit={handleFlag}
            onClose={() => setFlagOpen(false)}
          />
        )}
      </div>
    </PageWrapper>
  );
}
