/**
 * DataContext.jsx — Global simulated database provider
 *
 * PURPOSE:
 *   Acts as the application's mock backend. It owns the in-memory state for
 *   projects, users, courses, internships, and course-instructor link
 *   requests, and exposes async CRUD operations covering EVERY MS2
 *   requirement across student, faculty, recruiter and admin roles.
 *
 * REACT CONCEPTS USED:
 *   createContext / useContext — Shares data globally without prop drilling.
 *   useState()                 — Holds mutable copies of the JSON sources.
 *   useCallback()              — Memoises every exposed function so child
 *                                components re-render only when data changes.
 *
 * SECTIONS:
 *   1. Projects: fetch, create, update, delete, visibility, flag, appeal,
 *                like, view, feedback, isActive (admin)
 *   2. Thesis drafts: upload, remove, set final
 *   3. Invitations: send, cancel, accept, reject, remove collaborator
 *   4. Tasks: create, update, delete, reorder, comment
 *   5. Users: fetch, search collaborators, set portfolio-visible projects,
 *             toggle favorites, set active (admin), create admin account
 *   6. Internships: fetch, apply
 *   7. Courses: list, create, update, delete (admin)
 *   8. Course-instructor link requests: submit, accept/reject (admin)
 *   9. Employer applications (recruiter onboarding): accept/reject (admin)
 *  10. Stats: aggregated counts for admin dashboard (req 73)
 *
 * EVERY mutating function calls mockApiDelay() before mutating state, so
 * loading states render correctly throughout the UI.
 */

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import rawProjects     from '@/mockData/projects.json';
import rawUsers        from '@/mockData/users.json';
import rawCourses      from '@/mockData/courses.json';
import rawInternships  from '@/mockData/internships.json';
import rawLinkRequests from '@/mockData/courseLinkRequests.json';
import rawMessages     from '@/mockData/messages.json';
import { mockApiDelay } from '@/utils/mockApiDelay';

export const DataContext = createContext(null);

/** Backfill optional fields on projects so faculty features (per-user ratings,
 *  task comments) work even when the raw JSON pre-dates them. */
const hydrateProjects = (raw) => raw.map((p) => ({
  ...p,
  ratings: Array.isArray(p.ratings) ? p.ratings : [],
  tasks: (p.tasks || []).map((t) => ({
    ...t,
    instructorComments: t.instructorComments || [],
  })),
}));

export function DataProvider({ children }) {
  const [projects, setProjects]               = useState(() => hydrateProjects(JSON.parse(JSON.stringify(rawProjects))));
  const [users, setUsers]                     = useState(() => JSON.parse(JSON.stringify(rawUsers)));
  const [courses, setCourses]                 = useState(() => JSON.parse(JSON.stringify(rawCourses)));
  const [internships, setInternships]         = useState(() => JSON.parse(JSON.stringify(rawInternships)));
  const [linkRequests, setLinkRequests]       = useState(() => JSON.parse(JSON.stringify(rawLinkRequests)));
  const [messages, setMessages]               = useState(() => JSON.parse(JSON.stringify(rawMessages)));

  /* ──────────────────────────────────────────────────────────────────
   * Internal helper — push a notification to a specific user.
   * Respects the user's `notificationsEnabled` flag (req 33). When the
   * user has muted notifications globally we skip the push entirely.
   * ────────────────────────────────────────────────────────────────── */
  const pushNotification = useCallback((userId, payload) => {
    setUsers((prev) => prev.map((u) => {
      if (u.id !== userId) return u;
      if (u.notificationsEnabled === false) return u;
      return {
        ...u,
        notifications: [
          { id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, read: false, createdAt: new Date().toISOString(), ...payload },
          ...(u.notifications || []),
        ],
      };
    }));
  }, []);

  /** Push the same notification to every admin (link requests, employer apps). */
  const notifyAllAdmins = useCallback((payload) => {
    setUsers((prev) => prev.map((u) => {
      if (u.role !== 'admin' || u.notificationsEnabled === false) return u;
      return {
        ...u,
        notifications: [
          { id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, read: false, createdAt: new Date().toISOString(), ...payload },
          ...(u.notifications || []),
        ],
      };
    }));
  }, []);

  /* ──────────────────────────────────────────────────────────────────
   * 1. PROJECTS — basic CRUD
   * ────────────────────────────────────────────────────────────────── */

  const fetchProjects     = useCallback(async ()  => mockApiDelay(projects, 600), [projects]);
  const fetchProjectById  = useCallback(async (id) => mockApiDelay(projects.find((p) => p.id === id) ?? null, 400), [projects]);

  const createProject = useCallback(async (data, authorId) => {
    await mockApiDelay(null, 800);
    const newProject = {
      id:           `proj-${Date.now()}`,
      title:        data.title,
      description:  data.description,
      type:         data.type,
      courseId:     data.courseId || null,
      status:       'in-progress',
      visibility:   'public',
      isActive:     true,
      ownerId:      authorId,
      supervisorId: data.supervisorId || null,
      teamMembers:  [authorId, ...(data.teamMembers || [])],
      tags:         data.tags || [],
      programmingLanguages: data.programmingLanguages || [],
      github:       data.github || '',
      demoVideo:    data.demoVideo || '',
      thumbnail:    data.thumbnail || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
      projectReport: data.projectReport || null,
      thesisDrafts: [],
      invitations:  [],
      tasks:        [],
      createdAt:    new Date().toISOString(),
      updatedAt:    new Date().toISOString(),
      likes:        0,
      views:        0,
      rating:       0,
      isFlagged:    false,
      flagReason:   null,
      flaggedBy:    null,
      appeal:       null,
      feedback:     [],
    };
    setProjects((prev) => [newProject, ...prev]);
    return newProject;
  }, []);

  const updateProject = useCallback(async (id, updates) => {
    await mockApiDelay(null, 600);
    setProjects((prev) =>
      prev.map((p) => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)
    );
  }, []);

  const deleteProject = useCallback(async (id) => {
    await mockApiDelay(null, 400);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setUsers((prev) => prev.map((u) => ({
      ...u,
      portfolioVisibleProjectIds: (u.portfolioVisibleProjectIds || []).filter((pid) => pid !== id),
      savedProjects:              (u.savedProjects || []).filter((pid) => pid !== id),
    })));
  }, []);

  const setVisibility = useCallback(async (id, visibility) => {
    await mockApiDelay(null, 300);
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, visibility } : p));
  }, []);

  /** Admin only — activate / deactivate a project (req 64). */
  const setProjectActive = useCallback(async (id, isActive) => {
    await mockApiDelay(null, 300);
    let ownerId = null;
    setProjects((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      ownerId = p.ownerId;
      return { ...p, isActive };
    }));
    if (ownerId) {
      pushNotification(ownerId, {
        type: 'project',
        message: `Your project has been ${isActive ? 'reactivated' : 'deactivated'} by an administrator.`,
        link: `/projects/${id}`,
      });
    }
  }, [pushNotification]);

  const toggleLike = useCallback(async (id) => {
    await mockApiDelay(null, 200);
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, likes: p.likes + 1 } : p));
  }, []);

  const incrementView = useCallback((id) => {
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, views: p.views + 1 } : p));
  }, []);

  const addFeedback = useCallback(async (projectId, feedback) => {
    await mockApiDelay(null, 400);
    setProjects((prev) => prev.map((p) => p.id === projectId ? {
      ...p,
      feedback: [
        ...p.feedback,
        { id: `fb-${Date.now()}`, ...feedback, createdAt: new Date().toISOString() },
      ],
    } : p));
  }, []);

  /** Edit existing feedback (only the original author should call this). req 15 */
  const editFeedback = useCallback(async (projectId, feedbackId, updates) => {
    await mockApiDelay(null, 400);
    setProjects((prev) => prev.map((p) => p.id === projectId ? {
      ...p,
      feedback: (p.feedback || []).map((f) => f.id === feedbackId ? { ...f, ...updates, editedAt: new Date().toISOString() } : f),
    } : p));
  }, []);

  /** Remove existing feedback (only the original author should call this). req 15 */
  const removeFeedback = useCallback(async (projectId, feedbackId) => {
    await mockApiDelay(null, 300);
    setProjects((prev) => prev.map((p) => p.id === projectId ? {
      ...p,
      feedback: (p.feedback || []).filter((f) => f.id !== feedbackId),
    } : p));
  }, []);

  /**
   * Rate the entire project (req 16).
   * Stores one rating per (project, user) — re-rating overwrites the previous
   * value. The aggregate `rating` field is recomputed as the average.
   */
  const rateProject = useCallback(async (projectId, value, raterId) => {
    await mockApiDelay(null, 300);
    setProjects((prev) => prev.map((p) => {
      if (p.id !== projectId) return p;
      const others = (p.ratings || []).filter((r) => r.userId !== raterId);
      const next = [...others, { userId: raterId, value, ratedAt: new Date().toISOString() }];
      const avg = next.reduce((s, r) => s + r.value, 0) / next.length;
      return { ...p, ratings: next, rating: Math.round(avg * 10) / 10 };
    }));
  }, []);

  /* ── Per-task comments (req 14) ─────────────────────── */

  const addTaskComment = useCallback(async (projectId, taskId, comment) => {
    await mockApiDelay(null, 300);
    setProjects((prev) => prev.map((p) => p.id === projectId ? {
      ...p,
      tasks: (p.tasks || []).map((t) => t.id === taskId ? {
        ...t,
        instructorComments: [
          ...(t.instructorComments || []),
          { id: `ic-${Date.now()}`, authorId: comment.authorId, content: comment.content, createdAt: new Date().toISOString() },
        ],
      } : t),
    } : p));
  }, []);

  const editTaskComment = useCallback(async (projectId, taskId, commentId, content) => {
    await mockApiDelay(null, 300);
    setProjects((prev) => prev.map((p) => p.id === projectId ? {
      ...p,
      tasks: (p.tasks || []).map((t) => t.id === taskId ? {
        ...t,
        instructorComments: (t.instructorComments || []).map((c) => c.id === commentId ? { ...c, content, editedAt: new Date().toISOString() } : c),
      } : t),
    } : p));
  }, []);

  const removeTaskComment = useCallback(async (projectId, taskId, commentId) => {
    await mockApiDelay(null, 250);
    setProjects((prev) => prev.map((p) => p.id === projectId ? {
      ...p,
      tasks: (p.tasks || []).map((t) => t.id === taskId ? {
        ...t,
        instructorComments: (t.instructorComments || []).filter((c) => c.id !== commentId),
      } : t),
    } : p));
  }, []);

  /* ──────────────────────────────────────────────────────────────────
   * 2. THESIS DRAFTS  (req 23, 24)
   * ────────────────────────────────────────────────────────────────── */

  const uploadThesisDraft = useCallback(async (projectId, fileRecord) => {
    await mockApiDelay(null, 500);
    setProjects((prev) => prev.map((p) => p.id === projectId ? {
      ...p,
      thesisDrafts: [
        ...(p.thesisDrafts || []),
        { id: fileRecord.id, fileName: fileRecord.fileName, size: fileRecord.size, uploadedAt: fileRecord.uploadedAt, isFinal: false },
      ],
    } : p));
  }, []);

  const removeThesisDraft = useCallback(async (projectId, draftId) => {
    await mockApiDelay(null, 300);
    setProjects((prev) => prev.map((p) => p.id === projectId ? {
      ...p,
      thesisDrafts: (p.thesisDrafts || []).filter((d) => d.id !== draftId),
    } : p));
  }, []);

  const setFinalThesisDraft = useCallback(async (projectId, draftId) => {
    await mockApiDelay(null, 400);
    setProjects((prev) => prev.map((p) => p.id === projectId ? {
      ...p,
      thesisDrafts: (p.thesisDrafts || []).map((d) => ({ ...d, isFinal: d.id === draftId })),
    } : p));
  }, []);

  /* ──────────────────────────────────────────────────────────────────
   * 3. INVITATIONS / COLLABORATORS  (req 25–31)
   * ────────────────────────────────────────────────────────────────── */

  const sendInvitation = useCallback(async (projectId, targetUserId, role = 'collaborator') => {
    await mockApiDelay(null, 500);
    const inviteId = `inv-${Date.now()}`;
    setProjects((prev) => prev.map((p) => p.id === projectId ? {
      ...p,
      invitations: [
        ...(p.invitations || []).filter((inv) => inv.userId !== targetUserId),
        { id: inviteId, userId: targetUserId, invitedAt: new Date().toISOString(), status: 'pending', role },
      ],
    } : p));
    pushNotification(targetUserId, {
      type: 'invitation',
      message: `You've been invited to collaborate on a project.`,
      link: '/invitations',
    });
    return inviteId;
  }, [pushNotification]);

  const cancelInvitation = useCallback(async (projectId, inviteId) => {
    await mockApiDelay(null, 300);
    setProjects((prev) => prev.map((p) => p.id === projectId ? {
      ...p,
      invitations: (p.invitations || []).filter((inv) => inv.id !== inviteId),
    } : p));
  }, []);

  const respondToInvitation = useCallback(async (projectId, inviteId, accept) => {
    await mockApiDelay(null, 400);
    setProjects((prev) => prev.map((p) => {
      if (p.id !== projectId) return p;
      const invite = (p.invitations || []).find((i) => i.id === inviteId);
      if (!invite) return p;
      return {
        ...p,
        invitations: p.invitations.map((i) => i.id === inviteId ? { ...i, status: accept ? 'accepted' : 'rejected' } : i),
        teamMembers: accept && !p.teamMembers.includes(invite.userId)
          ? [...p.teamMembers, invite.userId]
          : p.teamMembers,
      };
    }));
  }, []);

  const removeCollaborator = useCallback(async (projectId, userId) => {
    await mockApiDelay(null, 400);
    setProjects((prev) => prev.map((p) => p.id === projectId ? {
      ...p,
      teamMembers: p.teamMembers.filter((id) => id !== userId),
      invitations: (p.invitations || []).filter((inv) => inv.userId !== userId),
    } : p));
  }, []);

  /* ──────────────────────────────────────────────────────────────────
   * 4. TASKS  (req 32–34, 40)
   * ────────────────────────────────────────────────────────────────── */

  const createTask = useCallback(async (projectId, taskData) => {
    await mockApiDelay(null, 400);
    setProjects((prev) => prev.map((p) => p.id === projectId ? {
      ...p,
      tasks: [
        ...(p.tasks || []),
        {
          id: `task-${Date.now()}`,
          order: p.tasks?.length || 0,
          description: taskData.description,
          assigneeId: taskData.assigneeId || p.ownerId,
          status: taskData.status || 'pending',
          deadline: taskData.deadline || null,
          instructorComments: [],
        },
      ],
    } : p));
  }, []);

  const updateTask = useCallback(async (projectId, taskId, updates) => {
    await mockApiDelay(null, 300);
    setProjects((prev) => prev.map((p) => p.id === projectId ? {
      ...p,
      tasks: (p.tasks || []).map((t) => t.id === taskId ? { ...t, ...updates } : t),
    } : p));
  }, []);

  const deleteTask = useCallback(async (projectId, taskId) => {
    await mockApiDelay(null, 300);
    setProjects((prev) => prev.map((p) => p.id === projectId ? {
      ...p,
      tasks: (p.tasks || []).filter((t) => t.id !== taskId),
    } : p));
  }, []);

  const reorderTasks = useCallback(async (projectId, orderedIds) => {
    await mockApiDelay(null, 200);
    setProjects((prev) => prev.map((p) => p.id === projectId ? {
      ...p,
      tasks: orderedIds.map((id, idx) => ({
        ...(p.tasks.find((t) => t.id === id)),
        order: idx,
      })),
    } : p));
  }, []);

  /* ──────────────────────────────────────────────────────────────────
   * 5. FLAG / APPEAL  (req 59–61, 62, 63)
   * ────────────────────────────────────────────────────────────────── */

  const flagProject = useCallback(async (projectId, reason, flaggerId) => {
    await mockApiDelay(null, 500);
    let ownerId = null;
    setProjects((prev) => prev.map((p) => {
      if (p.id !== projectId) return p;
      ownerId = p.ownerId;
      return { ...p, isFlagged: true, flagReason: reason, flaggedBy: flaggerId, flaggedAt: new Date().toISOString(), appeal: null };
    }));
    if (ownerId) {
      pushNotification(ownerId, {
        type: 'flag',
        message: `Your project has been flagged: ${reason}`,
        link: `/projects/${projectId}`,
      });
    }
    notifyAllAdmins({
      type: 'flag',
      message: `A project has been flagged for review.`,
      link: '/admin/flags',
    });
  }, [pushNotification, notifyAllAdmins]);

  /** Admin only — clear a flag from a project. */
  const unflagProject = useCallback(async (projectId) => {
    await mockApiDelay(null, 400);
    let ownerId = null;
    setProjects((prev) => prev.map((p) => {
      if (p.id !== projectId) return p;
      ownerId = p.ownerId;
      return { ...p, isFlagged: false, flagReason: null, flaggedBy: null, flaggedAt: null, appeal: null };
    }));
    if (ownerId) {
      pushNotification(ownerId, {
        type: 'flag',
        message: `The flag on your project has been removed.`,
        link: `/projects/${projectId}`,
      });
    }
  }, [pushNotification]);

  const sendAppeal = useCallback(async (projectId, message, studentId) => {
    await mockApiDelay(null, 500);
    setProjects((prev) => prev.map((p) => p.id === projectId ? {
      ...p,
      appeal: { message, sentAt: new Date().toISOString(), status: 'pending', sentBy: studentId || p.ownerId },
    } : p));
    notifyAllAdmins({
      type: 'appeal',
      message: `A new appeal has been submitted against a flagged project.`,
      link: '/admin/flags',
    });
  }, [notifyAllAdmins]);

  /** Admin only — approve or reject a student's appeal (req 63). */
  const resolveAppeal = useCallback(async (projectId, accept) => {
    await mockApiDelay(null, 500);
    let ownerId = null;
    setProjects((prev) => prev.map((p) => {
      if (p.id !== projectId) return p;
      ownerId = p.ownerId;
      if (accept) {
        // Appeal accepted → clear flag entirely
        return { ...p, isFlagged: false, flagReason: null, flaggedBy: null, flaggedAt: null, appeal: { ...(p.appeal || {}), status: 'accepted', resolvedAt: new Date().toISOString() } };
      }
      // Appeal rejected → keep flag, mark appeal rejected
      return { ...p, appeal: { ...(p.appeal || {}), status: 'rejected', resolvedAt: new Date().toISOString() } };
    }));
    if (ownerId) {
      pushNotification(ownerId, {
        type: 'appeal',
        message: accept
          ? 'Your appeal was accepted — the flag on your project has been removed.'
          : 'Your appeal was reviewed and rejected. The flag remains in place.',
        link: `/projects/${projectId}`,
      });
    }
  }, [pushNotification]);

  /* ──────────────────────────────────────────────────────────────────
   * 6. USERS  (req 5, 12, 22, 25, 47–54, 65–66)
   * ────────────────────────────────────────────────────────────────── */

  const fetchUsers     = useCallback(async ()  => mockApiDelay(users, 400), [users]);
  const fetchUserById  = useCallback(async (id) => mockApiDelay(users.find((u) => u.id === id) ?? null, 300), [users]);

  const updateUser = useCallback(async (id, updates) => {
    await mockApiDelay(null, 400);
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, ...updates } : u));
  }, []);

  /** Search users by first name, last name, email, or full name (req 8, 25, 47). */
  const searchUsers = useCallback(async (query, role) => {
    await mockApiDelay(null, 250);
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return users.filter((u) => {
      if (role && u.role !== role) return false;
      return (
        u.firstName?.toLowerCase().includes(q) ||
        u.lastName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.name?.toLowerCase().includes(q)
      );
    });
  }, [users]);

  const setPortfolioVisibleProjects = useCallback(async (userId, projectIds) => {
    await mockApiDelay(null, 300);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, portfolioVisibleProjectIds: projectIds } : u));
  }, []);

  const toggleFavoriteProject = useCallback(async (userId, projectId) => {
    await mockApiDelay(null, 200);
    setUsers((prev) => prev.map((u) => {
      if (u.id !== userId) return u;
      const has = (u.savedProjects || []).includes(projectId);
      return { ...u, savedProjects: has ? u.savedProjects.filter((id) => id !== projectId) : [...(u.savedProjects || []), projectId] };
    }));
  }, []);

  const toggleFavoritePortfolio = useCallback(async (userId, targetId) => {
    await mockApiDelay(null, 200);
    setUsers((prev) => prev.map((u) => {
      if (u.id !== userId) return u;
      const has = (u.savedPortfolios || []).includes(targetId);
      return { ...u, savedPortfolios: has ? u.savedPortfolios.filter((id) => id !== targetId) : [...(u.savedPortfolios || []), targetId] };
    }));
  }, []);

  /** Admin only — activate / deactivate any account (req 54). */
  const setUserActive = useCallback(async (userId, isActive) => {
    await mockApiDelay(null, 300);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isActive } : u));
  }, []);

  /** Admin only — create another admin account (req 53). */
  const createAdminAccount = useCallback(async (data) => {
    await mockApiDelay(null, 600);
    const id = `user-${Date.now()}`;
    const newAdmin = {
      id,
      role: 'admin',
      name: `${data.firstName} ${data.lastName}`,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      title: data.title || 'Platform Administrator',
      bio: data.bio || '',
      profilePic: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.firstName)}-${id}`,
      createdAt: new Date().toISOString(),
      isActive: true,
      isInitialAdmin: false,
      notifications: [],
    };
    setUsers((prev) => [...prev, newAdmin]);
    return newAdmin;
  }, []);

  /* ──────────────────────────────────────────────────────────────────
   * 7. INTERNSHIPS  (req 79–84, 90)
   * ────────────────────────────────────────────────────────────────── */

  const fetchInternships    = useCallback(async ()  => mockApiDelay(internships, 500),                                                   [internships]);
  const fetchInternshipById = useCallback(async (id) => mockApiDelay(internships.find((i) => i.id === id) ?? null, 350),               [internships]);

  const applyForInternship = useCallback(async (internshipId, studentId, coverLetter) => {
    await mockApiDelay(null, 800);
    setInternships((prev) => prev.map((i) => i.id === internshipId ? {
      ...i,
      applicants: [
        ...(i.applicants || []).filter((a) => a.studentId !== studentId),
        { id: `app-${Date.now()}`, studentId, coverLetter, status: 'submitted', appliedAt: new Date().toISOString() },
      ],
    } : i));
  }, []);

  /* ──────────────────────────────────────────────────────────────────
   * 8. COURSES  (req 55, 56)
   * ────────────────────────────────────────────────────────────────── */

  const fetchCourses = useCallback(async () => mockApiDelay(courses, 300), [courses]);

  const createCourse = useCallback(async (data) => {
    await mockApiDelay(null, 500);
    const newCourse = {
      id: `course-${Date.now()}`,
      code: data.code,
      name: data.name,
      department: data.department || '',
      semester: data.semester || '',
      year: Number(data.year) || null,
      description: data.description || '',
      instructorIds: data.instructorIds || [],
      createdAt: new Date().toISOString(),
    };
    setCourses((prev) => [...prev, newCourse]);
    return newCourse;
  }, []);

  const updateCourse = useCallback(async (id, updates) => {
    await mockApiDelay(null, 400);
    setCourses((prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteCourse = useCallback(async (id) => {
    await mockApiDelay(null, 400);
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setLinkRequests((prev) => prev.filter((r) => r.courseId !== id));
  }, []);

  /* ──────────────────────────────────────────────────────────────────
   * 9. COURSE-INSTRUCTOR LINK REQUESTS  (req 57, 58)
   * ────────────────────────────────────────────────────────────────── */

  const fetchLinkRequests = useCallback(async () => mockApiDelay(linkRequests, 300), [linkRequests]);

  /** Faculty submits a link/unlink request → admin gets notified. */
  const submitLinkRequest = useCallback(async (instructorId, courseId, type, reason) => {
    await mockApiDelay(null, 500);
    const newRequest = {
      id: `clr-${Date.now()}`,
      type,
      instructorId,
      courseId,
      reason: reason || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setLinkRequests((prev) => [newRequest, ...prev]);
    notifyAllAdmins({
      type: 'link-request',
      message: `A new ${type} request has been submitted by an instructor.`,
      link: '/admin/courses',
    });
    return newRequest;
  }, [notifyAllAdmins]);

  /** Admin accepts/rejects a link/unlink request (req 57). */
  const respondToLinkRequest = useCallback(async (requestId, accept) => {
    await mockApiDelay(null, 500);
    let request = null;
    setLinkRequests((prev) => prev.map((r) => {
      if (r.id !== requestId) return r;
      request = r;
      return { ...r, status: accept ? 'accepted' : 'rejected', resolvedAt: new Date().toISOString() };
    }));
    if (accept && request) {
      setCourses((prev) => prev.map((c) => {
        if (c.id !== request.courseId) return c;
        const ids = c.instructorIds || [];
        if (request.type === 'link') {
          return ids.includes(request.instructorId) ? c : { ...c, instructorIds: [...ids, request.instructorId] };
        }
        return { ...c, instructorIds: ids.filter((id) => id !== request.instructorId) };
      }));
    }
    if (request) {
      pushNotification(request.instructorId, {
        type: 'link-request',
        message: accept
          ? `Your ${request.type} request was approved.`
          : `Your ${request.type} request was rejected.`,
        link: '/dashboard',
      });
    }
  }, [pushNotification]);

  /* ──────────────────────────────────────────────────────────────────
   * 10. EMPLOYER APPLICATIONS  (req 14–18)
   * ────────────────────────────────────────────────────────────────── */

  /** Admin lists all employer (recruiter) applications. */
  const fetchEmployerApplications = useCallback(async () => {
    return mockApiDelay(users.filter((u) => u.role === 'recruiter'), 300);
  }, [users]);

  /** Admin accepts/rejects an employer application (req 18). */
  const respondToEmployerApplication = useCallback(async (employerId, accept) => {
    await mockApiDelay(null, 500);
    setUsers((prev) => prev.map((u) => u.id === employerId ? {
      ...u,
      applicationStatus: accept ? 'accepted' : 'rejected',
      isActive: accept ? u.isActive : false,
    } : u));
    pushNotification(employerId, {
      type: 'employer-application',
      message: accept
        ? 'Your application to join the platform has been approved. Welcome aboard!'
        : 'Your application to join the platform has been rejected.',
      link: '/dashboard',
    });
  }, [pushNotification]);

  /* ──────────────────────────────────────────────────────────────────
   * 11. MESSAGES — private messaging  (req 30, 31, 32)
   * ────────────────────────────────────────────────────────────────── */

  /** All messages involving a user, regardless of direction. */
  const fetchMessagesForUser = useCallback(async (userId) => {
    return mockApiDelay(messages.filter((m) => m.fromId === userId || m.toId === userId), 80);
  }, [messages]);

  /** Send a private message and notify the recipient. */
  const sendMessage = useCallback(async (fromId, toId, content) => {
    await mockApiDelay(null, 120);
    const newMsg = {
      id: `msg-${Date.now()}`,
      fromId, toId,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, newMsg]);
    pushNotification(toId, {
      type: 'message',
      message: 'You have a new private message.',
      link: `/messages?with=${fromId}`,
    });
    return newMsg;
  }, [pushNotification]);

  /** Mark every message in a conversation (with `peerId`) as read. */
  const markConversationRead = useCallback(async (userId, peerId) => {
    await mockApiDelay(null, 30);
    setMessages((prev) => prev.map((m) =>
      m.toId === userId && m.fromId === peerId && !m.read ? { ...m, read: true } : m
    ));
  }, []);

  /* ──────────────────────────────────────────────────────────────────
   * 12. NOTIFICATION SETTINGS — req 13, 33
   * ────────────────────────────────────────────────────────────────── */

  const setNotificationsEnabled = useCallback(async (userId, enabled) => {
    await mockApiDelay(null, 200);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, notificationsEnabled: enabled } : u));
  }, []);

  const markNotificationUnread = useCallback(async (userId, notifId) => {
    await mockApiDelay(null, 100);
    setUsers((prev) => prev.map((u) => u.id === userId ? {
      ...u,
      notifications: (u.notifications || []).map((n) => n.id === notifId ? { ...n, read: false } : n),
    } : u));
  }, []);

  /** Mark one in-app notification as read (keeps DataContext in sync with Navbar session). */
  const markNotificationRead = useCallback(async (userId, notifId) => {
    await mockApiDelay(null, 80);
    setUsers((prev) => prev.map((u) => u.id === userId ? {
      ...u,
      notifications: (u.notifications || []).map((n) => n.id === notifId ? { ...n, read: true } : n),
    } : u));
  }, []);

  const markAllNotificationsRead = useCallback(async (userId) => {
    await mockApiDelay(null, 100);
    setUsers((prev) => prev.map((u) => u.id === userId ? {
      ...u,
      notifications: (u.notifications || []).map((n) => ({ ...n, read: true })),
    } : u));
  }, []);

  /* ──────────────────────────────────────────────────────────────────
   * 13. RECOMMENDED PROJECTS — req 29
   * ──────────────────────────────────────────────────────────────────
   * Heuristic: surface projects that match the viewer's role/affiliations.
   *   - Faculty: projects in courses they teach, projects they supervise,
   *              projects whose tags overlap with their researchInterests.
   *   - Student: projects whose tags / programmingLanguages overlap with
   *              their skills, or whose tags match their major.
   *   - Recruiter / admin: most-recent + highest-rated public projects.
   */
  const fetchRecommendedProjects = useCallback(async (user) => {
    await mockApiDelay(null, 350);
    const candidates = projects.filter((p) => p.visibility === 'public' && p.isActive !== false && !p.isFlagged);
    if (!user) return candidates.slice(0, 6);

    const score = (p) => {
      let s = 0;
      if (user.role === 'faculty') {
        const linkedCourseIds = courses.filter((c) => (c.instructorIds || []).includes(user.id)).map((c) => c.id);
        if (linkedCourseIds.includes(p.courseId)) s += 10;
        if (p.supervisorId === user.id)            s += 8;
        const interests = (user.researchInterests || []).map((x) => x.toLowerCase());
        const tags      = (p.tags || []).map((x) => x.toLowerCase());
        s += tags.filter((t) => interests.some((i) => t.includes(i) || i.includes(t))).length * 2;
      } else if (user.role === 'student') {
        const skills = (user.skills || []).map((x) => x.toLowerCase());
        const tags   = [...(p.tags || []), ...(p.programmingLanguages || [])].map((x) => x.toLowerCase());
        s += tags.filter((t) => skills.some((sk) => t.includes(sk) || sk.includes(t))).length * 2;
        if (p.teamMembers?.includes(user.id)) s -= 100;
      }
      s += (p.likes || 0) / 10;
      s += (p.rating || 0);
      return s;
    };
    return [...candidates]
      .map((p) => ({ p, s: score(p) }))
      .sort((a, b) => b.s - a.s)
      .filter(({ s }) => s > -50)
      .slice(0, 12)
      .map(({ p }) => p);
  }, [projects, courses]);

  /* ──────────────────────────────────────────────────────────────────
   * 14. STATS — admin dashboard aggregates  (req 73)
   * ────────────────────────────────────────────────────────────────── */

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const totalStudents   = users.filter((u) => u.role === 'student').length;
    const totalFaculty    = users.filter((u) => u.role === 'faculty').length;
    const totalRecruiters = users.filter((u) => u.role === 'recruiter' && u.applicationStatus === 'accepted').length;
    const totalAdmins     = users.filter((u) => u.role === 'admin').length;
    const pendingEmployers = users.filter((u) => u.role === 'recruiter' && u.applicationStatus === 'pending').length;
    const inactiveUsers    = users.filter((u) => u.isActive === false).length;
    const totalProjects    = projects.length;
    const activeProjects   = projects.filter((p) => p.isActive !== false).length;
    const flaggedProjects  = projects.filter((p) => p.isFlagged).length;
    const pendingAppeals   = projects.filter((p) => p.appeal && p.appeal.status === 'pending').length;
    const totalCourses     = courses.length;
    const pendingLinkRequests = linkRequests.filter((r) => r.status === 'pending').length;
    const totalInternships = internships.length;
    return {
      totalUsers, totalStudents, totalFaculty, totalRecruiters, totalAdmins,
      pendingEmployers, inactiveUsers,
      totalProjects, activeProjects, flaggedProjects, pendingAppeals,
      totalCourses, pendingLinkRequests, totalInternships,
    };
  }, [users, projects, courses, linkRequests, internships]);

  /* ── Context value ────────────────────────────────────────────────── */
  const value = {
    // Raw state for synchronous reads
    projects, users, courses, internships, linkRequests, messages, stats,

    // Projects
    fetchProjects, fetchProjectById, createProject, updateProject, deleteProject,
    setVisibility, setProjectActive, toggleLike, incrementView,
    addFeedback, editFeedback, removeFeedback, rateProject,

    // Per-task comments
    addTaskComment, editTaskComment, removeTaskComment,

    // Thesis
    uploadThesisDraft, removeThesisDraft, setFinalThesisDraft,

    // Invitations
    sendInvitation, cancelInvitation, respondToInvitation, removeCollaborator,

    // Tasks
    createTask, updateTask, deleteTask, reorderTasks,

    // Flag / appeal
    flagProject, unflagProject, sendAppeal, resolveAppeal,

    // Users
    fetchUsers, fetchUserById, updateUser, searchUsers,
    setPortfolioVisibleProjects, toggleFavoriteProject, toggleFavoritePortfolio,
    setUserActive, createAdminAccount,

    // Internships
    fetchInternships, fetchInternshipById, applyForInternship,

    // Courses
    fetchCourses, createCourse, updateCourse, deleteCourse,

    // Course-instructor link requests
    fetchLinkRequests, submitLinkRequest, respondToLinkRequest,

    // Employer applications
    fetchEmployerApplications, respondToEmployerApplication,

    // Messaging (req 30, 31, 32)
    fetchMessagesForUser, sendMessage, markConversationRead,

    // Notification settings (req 13, 33)
    setNotificationsEnabled, markNotificationUnread, markNotificationRead, markAllNotificationsRead,

    // Recommendations (req 29)
    fetchRecommendedProjects,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useDataContext = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useDataContext must be used inside <DataProvider>');
  return ctx;
};
