/**
 * Recommended.jsx — "Recommended for you" project list
 *
 * COVERS:
 *   Faculty req 29 — "View a list of recommended projects."
 *   (Also useful for students; the recommender adapts to role.)
 *
 * The DataContext.fetchRecommendedProjects helper scores projects against
 * the current user's role, linked courses, supervised projects, research
 * interests (faculty) or skills (students). The page just renders the
 * resulting list as a normal grid.
 *
 * REACT CONCEPTS USED:
 *   useState() — Loading + result state.
 *   useEffect() — Computes recommendations on mount and whenever the user
 *                 changes (e.g. after editing research interests).
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, BookOpen } from 'lucide-react';
import PageWrapper  from '@/components/layout/PageWrapper';
import Breadcrumbs  from '@/components/layout/Breadcrumbs';
import ProjectCard  from '@/components/project/ProjectCard';
import SkeletonCard from '@/components/common/SkeletonCard';
import Button       from '@/components/common/Button';
import { useAuth }        from '@/hooks/useAuth';
import { useDataContext } from '@/context/DataContext';

export default function Recommended() {
  const { currentUser, updateProfile } = useAuth();
  const { fetchRecommendedProjects, fetchUsers, toggleLike, toggleFavoriteProject } = useDataContext();

  const [list, setList]       = useState([]);
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchRecommendedProjects(currentUser), fetchUsers()])
      .then(([rec, u]) => {
        if (cancelled) return;
        setList(rec);
        setUsers(u);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [currentUser, fetchRecommendedProjects, fetchUsers]);

  const reasonText = currentUser?.role === 'faculty'
    ? 'Selected from courses you teach, projects you supervise, and topics matching your research interests.'
    : currentUser?.role === 'student'
      ? 'Selected from projects whose tags and languages overlap with your skills.'
      : 'Top public projects on the platform by rating and engagement.';

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6">
        <Breadcrumbs crumbs={[{ label: 'Recommended for you' }]} />

        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles size={20} className="text-amber-400" /> Recommended for you
          </h1>
          <p className="text-sm text-slate-400 mt-0.5 max-w-2xl">{reasonText}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : list.length === 0 ? (
          <div className="card p-16 text-center">
            <BookOpen size={36} className="mx-auto text-slate-600 mb-3" />
            <h3 className="text-lg font-semibold text-slate-300 mb-1">No recommendations yet</h3>
            <p className="text-sm text-slate-500 mb-4">
              Add research interests to your profile (or skills, if you're a student) so we can suggest projects that match your work.
            </p>
            <Link to={`/profile/${currentUser?.id}`}>
              <Button variant="secondary">Update my profile</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {list.map((project) => {
              const isFav = (currentUser?.savedProjects || []).includes(project.id);
              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  users={users}
                  onLike={toggleLike}
                  isFavorited={isFav}
                  onToggleFavorite={async () => {
                    await toggleFavoriteProject(currentUser.id, project.id);
                    const next = isFav
                      ? (currentUser.savedProjects || []).filter((x) => x !== project.id)
                      : [...(currentUser.savedProjects || []), project.id];
                    updateProfile({ savedProjects: next });
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
