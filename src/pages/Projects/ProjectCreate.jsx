/**
 * ProjectCreate.jsx — New project creation page
 *
 * PURPOSE:
 *   Renders the ProjectForm inside the authenticated page shell.
 *   Calls DataContext.createProject() on submit, then redirects
 *   the user to the new project's detail page.
 *
 * REACT CONCEPTS USED:
 *   useState()      — Tracks the form's submission loading state.
 *   useNavigate()   — Redirects to the new project's detail page on success.
 *   useEffect()     — Fetches the list of courses and users to pass to
 *                     ProjectForm (for the course selector and collaborator picker).
 *   useAuth()       — Guards: only students can access this page.
 *   useDataContext  — Calls createProject(), fetchCourses(), fetchUsers().
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate, Navigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import PageWrapper  from '@/components/layout/PageWrapper';
import Breadcrumbs  from '@/components/layout/Breadcrumbs';
import ProjectForm  from '@/components/project/ProjectForm';
import { useAuth }        from '@/hooks/useAuth';
import { useDataContext } from '@/context/DataContext';

export default function ProjectCreate() {
  const { currentUser, isStudent } = useAuth();
  const { createProject, fetchCourses, fetchUsers } = useDataContext();
  const navigate = useNavigate();

  const [courses, setCourses]   = useState([]);
  const [users, setUsers]       = useState([]);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess]   = useState(false);

  // Only students can create projects
  if (!isStudent) return <Navigate to="/dashboard" replace />;

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchCourses(), fetchUsers()]).then(([c, u]) => {
      if (!cancelled) { setCourses(c); setUsers(u); }
    });
    return () => { cancelled = true; };
  }, [fetchCourses, fetchUsers]);

  const handleSubmit = async (formData) => {
    setCreating(true);
    try {
      const newProject = await createProject(formData, currentUser.id);
      setSuccess(true);
      toast.success('Project created — opening it now…');
      setTimeout(() => navigate(`/projects/${newProject.id}`), 1000);
    } finally {
      setCreating(false);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto">
        <Breadcrumbs
          crumbs={[
            { label: 'Dashboard', to: '/dashboard' },
            { label: 'Create Project' },
          ]}
        />

        <div className="mt-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center">
              <PlusCircle size={18} className="text-brand-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100">New Project</h1>
          </div>
          <p className="text-sm text-slate-400">
            Fill in the details below to add your project to the portfolio platform.
          </p>
        </div>

        {success ? (
          <div className="card p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <PlusCircle size={24} className="text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-100 mb-1">Project Created!</h2>
            <p className="text-sm text-slate-400">Redirecting you to your new project…</p>
          </div>
        ) : (
          <div className="card p-6">
            <ProjectForm
              onSubmit={handleSubmit}
              courses={courses}
              users={users}
              loading={creating}
            />
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
