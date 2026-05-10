/**
 * Favorites.jsx — Saved projects & portfolios (req 65, 66)
 *
 * PURPOSE:
 *   Two parallel lists driven from currentUser.savedProjects and
 *   currentUser.savedPortfolios. Users can remove items inline.
 *
 * REACT CONCEPTS USED:
 *   useState() / useEffect() — Resolved project + user lists.
 *   useMemo() — Derives the two display lists by intersecting saved IDs
 *               with the freshly fetched data.
 */

import { useState, useEffect, useMemo } from 'react';
import { Bookmark, FolderOpen, Users } from 'lucide-react';
import PageWrapper      from '@/components/layout/PageWrapper';
import Breadcrumbs      from '@/components/layout/Breadcrumbs';
import Tabs             from '@/components/common/Tabs';
import Loader           from '@/components/common/Loader';
import ProjectCard      from '@/components/project/ProjectCard';
import PortfolioCard    from '@/components/portfolio/PortfolioCard';
import { useAuth }        from '@/hooks/useAuth';
import { useDataContext } from '@/context/DataContext';
import { useNavigate }  from 'react-router-dom';

export default function Favorites() {
  const { currentUser, updateProfile } = useAuth();
  const { fetchProjects, fetchUsers, toggleFavoriteProject, toggleFavoritePortfolio, toggleLike } = useDataContext();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchProjects(), fetchUsers()]).then(([p, u]) => {
      if (!cancelled) { setProjects(p); setUsers(u); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [fetchProjects, fetchUsers]);

  const savedProjectsList = useMemo(
    () => (currentUser?.savedProjects ?? []).map((id) => projects.find((p) => p.id === id)).filter(Boolean),
    [projects, currentUser]
  );
  const savedPortfoliosList = useMemo(
    () => (currentUser?.savedPortfolios ?? []).map((id) => users.find((u) => u.id === id)).filter(Boolean),
    [users, currentUser]
  );

  const handleUnsaveProject = async (id) => {
    await toggleFavoriteProject(currentUser.id, id);
    updateProfile({ savedProjects: (currentUser.savedProjects || []).filter((x) => x !== id) });
  };

  const handleUnsavePortfolio = async (id) => {
    await toggleFavoritePortfolio(currentUser.id, id);
    updateProfile({ savedPortfolios: (currentUser.savedPortfolios || []).filter((x) => x !== id) });
  };

  if (loading) return <PageWrapper><Loader message="Loading your favorites…" /></PageWrapper>;

  const projectCountFor = (userId) => projects.filter((p) => p.teamMembers?.includes(userId)).length;

  const ProjectsTab = (
    savedProjectsList.length === 0 ? (
      <div className="card p-12 text-center">
        <FolderOpen size={36} className="mx-auto text-slate-600 mb-3" />
        <p className="text-slate-300 font-medium mb-1">No saved projects</p>
        <p className="text-sm text-slate-500">Bookmark projects from the Explore page to view them here later.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {savedProjectsList.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            users={users}
            isFavorited={true}
            onLike={toggleLike}
            onToggleFavorite={() => handleUnsaveProject(p.id)}
          />
        ))}
      </div>
    )
  );

  const PortfoliosTab = (
    savedPortfoliosList.length === 0 ? (
      <div className="card p-12 text-center">
        <Users size={36} className="mx-auto text-slate-600 mb-3" />
        <p className="text-slate-300 font-medium mb-1">No saved portfolios</p>
        <p className="text-sm text-slate-500">Bookmark student portfolios from the Browse page to revisit them later.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {savedPortfoliosList.map((u) => (
          <PortfolioCard
            key={u.id}
            user={u}
            projectCount={projectCountFor(u.id)}
            isFavorited={true}
            onToggleFavorite={() => handleUnsavePortfolio(u.id)}
            onView={() => navigate(`/profile/${u.id}`)}
          />
        ))}
      </div>
    )
  );

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto space-y-6">
        <Breadcrumbs crumbs={[{ label: 'Favourites' }]} />

        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Bookmark size={22} className="text-amber-400" />
            My Favourites
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Your saved projects and portfolios in one place.</p>
        </div>

        <Tabs
          tabs={[
            { id: 'projects',   label: 'Projects',   icon: FolderOpen, count: savedProjectsList.length,   content: ProjectsTab },
            { id: 'portfolios', label: 'Portfolios', icon: Users,      count: savedPortfoliosList.length, content: PortfoliosTab },
          ]}
        />
      </div>
    </PageWrapper>
  );
}
