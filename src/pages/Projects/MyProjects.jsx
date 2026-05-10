/**
 * MyProjects.jsx — "View a list of all my projects" page (req 21, 22)
 *
 * PURPOSE:
 *   Lists every project the current student owns or collaborates on. Provides
 *   a multi-select control to choose WHICH of those projects appear on the
 *   user's public portfolio (req 22). Owners can also toggle visibility,
 *   edit, and delete inline.
 *
 * REACT CONCEPTS USED:
 *   useState(), useEffect()  — Loading + project list state.
 *   useMemo()                — Derives the user's owned vs collaborated lists.
 *   useAuth() / useDataContext() — Reads/writes user + project state.
 *   Optimistic UI            — Toggling portfolio-visible updates immediately
 *                              before the async save resolves.
 */

import { useState, useEffect, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  PlusCircle, Folder, Eye, EyeOff, Edit2, Trash2,
  CheckSquare, Square, Star,
} from 'lucide-react';
import PageWrapper  from '@/components/layout/PageWrapper';
import Breadcrumbs  from '@/components/layout/Breadcrumbs';
import Button       from '@/components/common/Button';
import Badge        from '@/components/common/Badge';
import Loader       from '@/components/common/Loader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useAuth }        from '@/hooks/useAuth';
import { useDataContext } from '@/context/DataContext';
import { formatDate, getStatusMeta, truncate } from '@/utils/formatters';

export default function MyProjects() {
  const { currentUser, isStudent, updateProfile } = useAuth();
  const {
    fetchProjects, deleteProject, setVisibility,
    setPortfolioVisibleProjects,
  } = useDataContext();

  if (!isStudent) return <Navigate to="/dashboard" replace />;

  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [confirmDel, setConfirmDel] = useState(null);
  const [portfolioIds, setPortfolioIds] = useState(currentUser?.portfolioVisibleProjectIds || []);

  useEffect(() => {
    let cancelled = false;
    fetchProjects().then((p) => {
      if (!cancelled) { setProjects(p); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [fetchProjects]);

  const myProjects = useMemo(
    () => projects.filter((p) => p.teamMembers?.includes(currentUser.id)),
    [projects, currentUser]
  );

  const ownedProjects   = myProjects.filter((p) => p.ownerId === currentUser.id);
  const collabProjects  = myProjects.filter((p) => p.ownerId !== currentUser.id);

  const togglePortfolio = async (projectId) => {
    const next = portfolioIds.includes(projectId)
      ? portfolioIds.filter((id) => id !== projectId)
      : [...portfolioIds, projectId];
    setPortfolioIds(next);
    await setPortfolioVisibleProjects(currentUser.id, next);
    updateProfile({ portfolioVisibleProjectIds: next });
  };

  const handleDelete = async (projectId) => {
    await deleteProject(projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setConfirmDel(null);
  };

  const handleToggleVisibility = async (project) => {
    const next = project.visibility === 'public' ? 'private' : 'public';
    await setVisibility(project.id, next);
    setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, visibility: next } : p));
  };

  if (loading) return <PageWrapper><Loader message="Loading your projects…" /></PageWrapper>;

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto space-y-6">
        <Breadcrumbs crumbs={[{ label: 'My Projects' }]} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">My Projects</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {myProjects.length} total • {ownedProjects.length} owned • {collabProjects.length} collaborating
            </p>
          </div>
          <Link to="/projects/create">
            <Button leftIcon={<PlusCircle size={15} />}>New Project</Button>
          </Link>
        </div>

        {/* Portfolio selector hint */}
        {ownedProjects.length > 0 && (
          <div className="card p-4 bg-brand-500/5 border-brand-500/20">
            <div className="flex items-start gap-3">
              <Star size={18} className="text-brand-400 shrink-0 mt-0.5" />
              <div className="text-sm text-slate-300 flex-1">
                <p className="font-medium text-brand-300 mb-1">Portfolio visibility</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click the star next to any project to control whether it appears on your public portfolio.
                  Currently <strong className="text-slate-200">{portfolioIds.length}</strong> project{portfolioIds.length !== 1 ? 's' : ''} on your portfolio.
                </p>
              </div>
            </div>
          </div>
        )}

        {myProjects.length === 0 ? (
          <div className="card p-12 text-center">
            <Folder size={36} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-300 font-medium mb-1">No projects yet</p>
            <p className="text-sm text-slate-500 mb-3 max-w-md mx-auto leading-relaxed">
              Create your first project to start building your portfolio. Public projects can appear in Explore; private ones stay on this list only.
            </p>
            <p className="text-xs text-slate-600 mb-5">
              <Link to="/help" className="text-brand-400 hover:text-brand-300">Help & tips</Link>
              {' '}explains the star icon and portfolio visibility.
            </p>
            <Link to="/projects/create"><Button leftIcon={<PlusCircle size={14} />}>Create Project</Button></Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {myProjects.map((project) => {
              const isOwner       = project.ownerId === currentUser.id;
              const isOnPortfolio = portfolioIds.includes(project.id);
              const statusMeta    = getStatusMeta(project.status);
              const isPrivate     = project.visibility === 'private';

              return (
                <li key={project.id} className="card p-4">
                  <div className="flex gap-4">
                    <Link to={`/projects/${project.id}`} className="shrink-0">
                      <img
                        src={project.thumbnail}
                        alt={project.title}
                        className="w-24 h-24 rounded-lg bg-surface-700 object-cover hover:opacity-80 transition-opacity"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Link to={`/projects/${project.id}`} className="font-semibold text-slate-100 hover:text-brand-300 transition-colors truncate">
                              {project.title}
                            </Link>
                            <Badge variant={project.type === 'bachelor' ? 'violet' : 'blue'} size="sm">
                              {project.type === 'bachelor' ? 'Bachelor' : 'Course'}
                            </Badge>
                            <Badge variant="default" size="sm" dot>{statusMeta.label}</Badge>
                            {isPrivate && <Badge variant="amber" size="sm">Private</Badge>}
                            {isOwner   && <Badge variant="green" size="sm">Owner</Badge>}
                            {project.isFlagged && <Badge variant="red" size="sm">Flagged</Badge>}
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{truncate(project.description, 180)}</p>
                          <p className="text-[11px] text-slate-500 mt-1.5">
                            Updated {formatDate(project.updatedAt)} • {project.likes} likes • {project.views} views
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => togglePortfolio(project.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              isOnPortfolio ? 'text-amber-400 hover:bg-amber-500/10' : 'text-slate-500 hover:text-amber-400 hover:bg-surface-700'
                            }`}
                            title={isOnPortfolio ? 'Remove from portfolio' : 'Show on portfolio'}
                          >
                            {isOnPortfolio ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>

                          {isOwner && (
                            <>
                              <button
                                onClick={() => handleToggleVisibility(project)}
                                className="p-2 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-surface-700 transition-colors"
                                title={isPrivate ? 'Make public' : 'Make private'}
                              >
                                {isPrivate ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                              <Link
                                to={`/projects/${project.id}/edit`}
                                className="p-2 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-surface-700 transition-colors"
                                title="Edit project"
                              >
                                <Edit2 size={16} />
                              </Link>
                              <button
                                onClick={() => setConfirmDel(project)}
                                className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-surface-700 transition-colors"
                                title="Delete project"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <ConfirmDialog
          isOpen={!!confirmDel}
          title="Delete project?"
          message={
            <>
              Are you sure you want to permanently delete <strong className="text-slate-200">{confirmDel?.title}</strong>?
              All associated tasks, drafts and feedback will be removed. This cannot be undone.
            </>
          }
          confirmLabel="Yes, delete"
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => handleDelete(confirmDel.id)}
        />
      </div>
    </PageWrapper>
  );
}
