/**
 * ProjectCard.jsx — Project summary card for grid/list views
 *
 * PURPOSE:
 *   Renders a rich, clickable card representing a single project. Used in
 *   ExploreProjects, UserDashboard, MyProjects, and Favorites. Supports an
 *   optional "save to favorites" star (req 65).
 *
 * PROPS:
 *   project           — full project object
 *   users             — full user list for resolving member names/avatars
 *   onLike            — async fn(projectId)
 *   isFavorited       — boolean — controls bookmark icon state
 *   onToggleFavorite  — optional async fn() — clicking the bookmark fires this
 *
 * REACT CONCEPTS USED:
 *   useNavigate()  — Card-level click navigates to /projects/:id
 *   useState()     — Local optimistic state for the like button (instant UI)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye, MessageSquare, Lock } from 'lucide-react';
import Badge from '@/components/common/Badge';
import FavoriteButton from '@/components/common/FavoriteButton';
import { getStatusMeta, truncate } from '@/utils/formatters';

export default function ProjectCard({
  project, users = [], onLike,
  isFavorited = false, onToggleFavorite,
}) {
  const navigate              = useNavigate();
  const [liked, setLiked]     = useState(false);
  const [likeCount, setLikeCount] = useState(project.likes ?? 0);

  const statusMeta  = getStatusMeta(project.status);
  const visibleTags = (project.tags || []).slice(0, 3);
  const extraTags   = (project.tags || []).length - visibleTags.length;
  const isPrivate   = project.visibility === 'private';
  const isFlagged   = project.isFlagged;

  const members = (project.teamMembers ?? [])
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (liked) return;
    setLiked(true);
    setLikeCount((c) => c + 1);
    try { await onLike?.(project.id); } catch { /* silent */ }
  };

  return (
    <article
      onClick={() => navigate(`/projects/${project.id}`)}
      className="card overflow-hidden cursor-pointer group hover:border-brand-500/50 hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="relative h-40 bg-surface-700 overflow-hidden">
        <img
          src={project.thumbnail}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border ${statusMeta.className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {statusMeta.label}
          </span>
          {isPrivate && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Lock size={10} /> Private
            </span>
          )}
          {isFlagged && <Badge variant="red" size="sm">Flagged</Badge>}
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {onToggleFavorite && (
            <div onClick={(e) => e.stopPropagation()}>
              <FavoriteButton isFavorited={isFavorited} onToggle={onToggleFavorite} size="sm" />
            </div>
          )}
          <Badge variant={project.type === 'bachelor' ? 'violet' : 'blue'} size="sm">
            {project.type === 'bachelor' ? 'Bachelor' : 'Course'}
          </Badge>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-slate-100 text-base leading-snug group-hover:text-brand-300 transition-colors mb-1.5 line-clamp-2">
          {project.title}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">
          {truncate(project.description, 110)}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {visibleTags.map((tag) => <Badge key={tag} variant="default" size="sm">{tag}</Badge>)}
          {extraTags > 0 && <Badge variant="default" size="sm">+{extraTags}</Badge>}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-surface-700">
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {members.slice(0, 3).map((member) => (
                <img
                  key={member.id}
                  src={member.profilePic}
                  alt={member.name}
                  title={member.name}
                  className="w-6 h-6 rounded-full border-2 border-surface-800 bg-surface-700 object-cover"
                />
              ))}
            </div>
            {members.length > 0 && (
              <span className="ml-2 text-xs text-slate-500 truncate max-w-[100px]">
                {members[0]?.name?.split(' ')[0]}
                {members.length > 1 ? ` +${members.length - 1}` : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 transition-colors ${liked ? 'text-red-400' : 'hover:text-red-400'}`}
              title="Like project"
            >
              <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
              {likeCount}
            </button>
            <span className="flex items-center gap-1">
              <Eye size={13} />
              {project.views}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare size={13} />
              {project.feedback?.length ?? 0}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
