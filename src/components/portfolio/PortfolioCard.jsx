/**
 * PortfolioCard.jsx — Student portfolio summary card
 *
 * PURPOSE:
 *   Displays a student's profile snapshot on the ExplorePortfolios grid.
 *   Optional bookmark button supports req 65.
 *
 * PROPS:
 *   user             — User object
 *   projectCount     — number; how many projects this student has on portfolio
 *   onView           — function(); navigates to /profile/:id
 *   isFavorited      — boolean
 *   onToggleFavorite — async fn() — clicking the bookmark fires this
 */

import { Github, Linkedin, ExternalLink, FolderOpen } from 'lucide-react';
import SkillBadge       from '@/components/portfolio/SkillBadge';
import Badge            from '@/components/common/Badge';
import Button           from '@/components/common/Button';
import FavoriteButton   from '@/components/common/FavoriteButton';
import { getRoleMeta, truncate } from '@/utils/formatters';

export default function PortfolioCard({
  user, projectCount = 0, onView,
  isFavorited = false, onToggleFavorite,
}) {
  const roleMeta      = getRoleMeta(user.role);
  const visibleSkills = (user.skills ?? []).slice(0, 4);
  const extraSkills   = (user.skills ?? []).length - visibleSkills.length;

  return (
    <article className="card p-5 flex flex-col gap-4 hover:border-accent-500/40 transition-all duration-200">
      <div className="flex items-start gap-3">
        <img
          src={user.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
          alt={user.name}
          className="w-14 h-14 rounded-full bg-surface-700 shrink-0 object-cover border-2 border-surface-600"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-100 text-base truncate">{user.name}</h3>
          <p className="text-xs text-slate-400 truncate">{user.department}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant={user.role === 'student' ? 'blue' : 'violet'} size="sm">{roleMeta.label}</Badge>
            {user.year && <span className="text-[11px] text-slate-500">Year {user.year}</span>}
          </div>
        </div>
        {onToggleFavorite && (
          <div className="-mr-1 -mt-1">
            <FavoriteButton isFavorited={isFavorited} onToggle={onToggleFavorite} size="sm" />
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 flex-1">
        {truncate(user.bio || 'No bio provided yet.', 130)}
      </p>

      {user.thesisTitle && (
        <div className="bg-accent-500/10 border border-accent-500/20 rounded-lg px-3 py-2">
          <p className="text-[11px] text-accent-400 font-medium mb-0.5">Bachelor Thesis</p>
          <p className="text-xs text-slate-300 line-clamp-2">{user.thesisTitle}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {visibleSkills.map((skill) => <SkillBadge key={skill} skill={skill} size="sm" />)}
        {extraSkills > 0 && <SkillBadge skill={`+${extraSkills} more`} size="sm" />}
        {!visibleSkills.length && <span className="text-xs text-slate-600 italic">No skills listed</span>}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-surface-700 gap-2">
        <div className="flex items-center gap-2">
          {user.github && (
            <a href={user.github} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-surface-700 transition-colors" title="GitHub">
              <Github size={15} />
            </a>
          )}
          {user.linkedin && (
            <a href={user.linkedin} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-surface-700 transition-colors" title="LinkedIn">
              <Linkedin size={15} />
            </a>
          )}
          <span className="flex items-center gap-1 text-xs text-slate-500 ml-1">
            <FolderOpen size={13} /> {projectCount} project{projectCount !== 1 ? 's' : ''}
          </span>
        </div>
        <Button variant="outline" size="sm" rightIcon={<ExternalLink size={12} />} onClick={onView}>
          View
        </Button>
      </div>
    </article>
  );
}
