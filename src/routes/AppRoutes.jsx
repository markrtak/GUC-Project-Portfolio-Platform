/**
 * AppRoutes.jsx — Lazy-loaded route tree (keeps App.jsx orchestration-only).
 */

import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Loader from '@/components/common/Loader';

const Login = lazy(() => import('@/pages/Auth/Login'));
const Register = lazy(() => import('@/pages/Auth/Register'));
const ForgotPassword = lazy(() => import('@/pages/Auth/ForgotPassword'));
const UserDashboard = lazy(() => import('@/pages/Dashboard/UserDashboard'));
const ProfilePage = lazy(() => import('@/pages/Dashboard/ProfilePage'));
const Invitations = lazy(() => import('@/pages/Dashboard/Invitations'));
const Favorites = lazy(() => import('@/pages/Dashboard/Favorites'));
const Recommended = lazy(() => import('@/pages/Dashboard/Recommended'));
const MyProjects = lazy(() => import('@/pages/Projects/MyProjects'));
const ProjectCreate = lazy(() => import('@/pages/Projects/ProjectCreate'));
const ProjectEdit = lazy(() => import('@/pages/Projects/ProjectEdit'));
const ProjectDetail = lazy(() => import('@/pages/Projects/ProjectDetail'));
const ExploreProjects = lazy(() => import('@/pages/Discovery/ExploreProjects'));
const ExplorePortfolios = lazy(() => import('@/pages/Discovery/ExplorePortfolios'));
const Courses = lazy(() => import('@/pages/Discovery/Courses'));
const Instructors = lazy(() => import('@/pages/Discovery/Instructors'));
const Internships = lazy(() => import('@/pages/Internships/Internships'));
const InternshipDetail = lazy(() => import('@/pages/Internships/InternshipDetail'));
const Messages = lazy(() => import('@/pages/Messages/Messages'));
const HelpPage = lazy(() => import('@/pages/Help/HelpPage'));
const AdminDashboard = lazy(() => import('@/pages/Admin/AdminDashboard'));
const AdminUsers = lazy(() => import('@/pages/Admin/AdminUsers'));
const AdminEmployers = lazy(() => import('@/pages/Admin/AdminEmployers'));
const AdminCourses = lazy(() => import('@/pages/Admin/AdminCourses'));
const AdminFlags = lazy(() => import('@/pages/Admin/AdminFlags'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function ProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useAuth();
  if (authLoading) return <Loader message="Checking session…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, authLoading } = useAuth();
  if (authLoading) return <Loader message="Checking session…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
      <Route path="/profile/:userId" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/invitations" element={<ProtectedRoute><Invitations /></ProtectedRoute>} />
      <Route path="/favourites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
      <Route path="/recommended" element={<ProtectedRoute><Recommended /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />

      <Route path="/projects" element={<ProtectedRoute><MyProjects /></ProtectedRoute>} />
      <Route path="/projects/create" element={<ProtectedRoute><ProjectCreate /></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
      <Route path="/projects/:id/edit" element={<ProtectedRoute><ProjectEdit /></ProtectedRoute>} />

      <Route path="/explore/projects" element={<ProtectedRoute><ExploreProjects /></ProtectedRoute>} />
      <Route path="/explore/portfolios" element={<ProtectedRoute><ExplorePortfolios /></ProtectedRoute>} />
      <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
      <Route path="/instructors" element={<ProtectedRoute><Instructors /></ProtectedRoute>} />

      <Route path="/internships" element={<ProtectedRoute><Internships /></ProtectedRoute>} />
      <Route path="/internships/:id" element={<ProtectedRoute><InternshipDetail /></ProtectedRoute>} />

      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/employers" element={<AdminRoute><AdminEmployers /></AdminRoute>} />
      <Route path="/admin/courses" element={<AdminRoute><AdminCourses /></AdminRoute>} />
      <Route path="/admin/flags" element={<AdminRoute><AdminFlags /></AdminRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
