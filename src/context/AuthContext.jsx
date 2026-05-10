/**
 * AuthContext.jsx — Global authentication state provider
 *
 * PURPOSE:
 *   Simulates the behaviour of a real authentication service (JWT, sessions)
 *   using only React state and localStorage. Any component in the tree can
 *   read the current user or call login/logout/register without prop-drilling.
 *
 * REACT CONCEPTS USED:
 *   createContext()   — Creates a Context object. The context holds the value
 *                       that will be shared across the component tree.
 *
 *   useContext()      — Allows any child component to read the context value
 *                       without receiving it as a prop.
 *
 *   useState()        — Manages the `currentUser` object (null = logged out).
 *
 *   useEffect()       — Runs once on mount to read localStorage and rehydrate
 *                       the session (so a page refresh does not log the user out).
 *
 *   useCallback()     — Memoises the login/logout/register functions so they
 *                       maintain referential stability and do not cause
 *                       unnecessary re-renders in child components.
 *
 * MOCK LOGIC:
 *   login()     — Searches the static users array + any localStorage-created
 *                 users for a matching email/password pair.
 *   register()  — Adds a new student object to a localStorage array so the
 *                 account persists across refreshes.
 *   logout()    — Clears the stored session key and resets state to null.
 *
 * USAGE:
 *   Wrap the app in <AuthProvider> (see main.jsx).
 *   Consume via the `useAuth` hook in hooks/useAuth.js.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import rawUsers from '@/mockData/users.json';
import { mockApiDelay } from '@/utils/mockApiDelay';

/* ── Context creation ────────────────────────────────────────────────────── */
export const AuthContext = createContext(null);

const SESSION_KEY  = 'guc_portfolio_session'; // localStorage key for persisted session
const EXTRA_USERS_KEY = 'guc_portfolio_extra_users'; // localStorage key for registered users

/* ── Provider component ──────────────────────────────────────────────────── */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // true until session is rehydrated

  // ── On mount: rehydrate session from localStorage ──────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // ── Helper: get all users (static + localStorage-registered, with
  //          OTP-set password overrides applied) ─────────────────────────
  const getAllUsers = useCallback(() => {
    try {
      const extra      = JSON.parse(localStorage.getItem(EXTRA_USERS_KEY) || '[]');
      const overrides  = JSON.parse(localStorage.getItem('guc_portfolio_password_overrides') || '{}');
      return [...rawUsers, ...extra].map((u) => {
        const ov = overrides[u.email?.toLowerCase()];
        return ov ? { ...u, password: ov } : u;
      });
    } catch {
      return rawUsers;
    }
  }, []);

  // ── login ──────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setAuthLoading(true);
    try {
      // Simulate network delay — callers must handle async
      await mockApiDelay(null, 800);

      const allUsers = getAllUsers();
      const user = allUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!user) {
        throw new Error('Invalid email or password. Please try again.');
      }

      // Block deactivated accounts (admin can deactivate any account — req 54).
      if (user.isActive === false) {
        throw new Error('This account has been deactivated. Please contact the administrator.');
      }

      // Block unapproved employer applications until an admin accepts them (req 18).
      if (user.role === 'recruiter' && user.applicationStatus && user.applicationStatus !== 'accepted') {
        if (user.applicationStatus === 'pending') {
          throw new Error('Your company application is still under review. You will be notified once it is approved.');
        }
        if (user.applicationStatus === 'rejected') {
          throw new Error('Your company application has been rejected. Please contact the administrator.');
        }
      }

      // Strip password before storing in state/localStorage (security practice)
      const { password: _pw, ...safeUser } = user;
      setCurrentUser(safeUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      return { success: true, user: safeUser };
    } finally {
      setAuthLoading(false);
    }
  }, [getAllUsers]);

  // ── register ───────────────────────────────────────────────────────────
  /**
   * Multi-role register. `formData.role` controls which fields are persisted.
   *   - 'student'   → profile fields (department, major, year, gucId)
   *   - 'faculty'   → first/last name, department, title, bio, research interests
   *   - 'recruiter' → company info + uploaded docs (status: 'pending', no auto-login)
   * Faculty requirement #2 is satisfied by allowing the role selector on the
   * Register page to set role='faculty' here.
   */
  const register = useCallback(async (formData) => {
    setAuthLoading(true);
    try {
      await mockApiDelay(null, 1000);

      const allUsers = getAllUsers();
      const exists = allUsers.some(
        (u) => u.email.toLowerCase() === formData.email.toLowerCase()
      );
      if (exists) {
        throw new Error('An account with this email already exists.');
      }

      const id      = `user-${Date.now()}`;
      const role    = formData.role || 'student';
      const fullName = formData.name || `${formData.firstName || ''} ${formData.lastName || ''}`.trim();
      const seed    = encodeURIComponent(fullName || id);

      let newUser;
      if (role === 'faculty') {
        newUser = {
          id, role,
          name:               fullName,
          firstName:          formData.firstName || '',
          lastName:           formData.lastName  || '',
          email:              formData.email,
          password:           formData.password,
          department:         formData.department || '',
          title:              formData.title      || 'Lecturer',
          bio:                formData.bio        || '',
          researchInterests:  [],
          educationBackground: [],
          profilePic:         `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
          supervisedProjects: [],
          createdAt:          new Date().toISOString(),
          isActive:           true,
          notificationsEnabled: true,
          savedProjects:      [],
          savedPortfolios:    [],
          notifications:      [],
        };
      } else if (role === 'recruiter') {
        newUser = {
          id, role,
          name:           fullName,
          firstName:      formData.firstName || '',
          lastName:       formData.lastName  || '',
          email:          formData.email,
          password:       formData.password,
          company:        formData.company     || '',
          companyAddress: formData.companyAddress || '',
          companyPhone:   formData.companyPhone   || '',
          companyBio:     formData.companyBio     || '',
          jobTitle:       formData.jobTitle       || 'Recruiter',
          bio:            formData.bio            || '',
          profilePic:     `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
          applicationStatus: 'pending',
          companyDocs:    formData.companyDocs || [],
          isActive:       true,
          notificationsEnabled: true,
          savedProjects:  [],
          savedPortfolios:[],
          createdAt:      new Date().toISOString(),
          notifications: [],
        };
      } else {
        newUser = {
          id, role: 'student',
          name:        fullName,
          firstName:   formData.firstName || fullName.split(' ')[0] || '',
          lastName:    formData.lastName  || fullName.split(' ').slice(1).join(' ') || '',
          email:       formData.email,
          password:    formData.password,
          gucId:       formData.gucId || '',
          department:  formData.department || '',
          major:       formData.major || '',
          year:        Number(formData.year) || 1,
          bio:         '',
          skills:      [],
          github:      '',
          linkedin:    '',
          profilePic:  `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
          thesisTitle: null,
          createdAt:   new Date().toISOString(),
          isActive:    true,
          notificationsEnabled: true,
          savedProjects: [],
          savedPortfolios: [],
          portfolioVisibleProjectIds: [],
          completedInternships: [],
          notifications: [],
        };
      }

      const extra = JSON.parse(localStorage.getItem(EXTRA_USERS_KEY) || '[]');
      extra.push(newUser);
      localStorage.setItem(EXTRA_USERS_KEY, JSON.stringify(extra));

      const { password: _pw, ...safeUser } = newUser;

      // Recruiters cannot sign in until an admin approves their application,
      // so we do NOT auto-login them. We return the user so the form can
      // display a "pending review" confirmation screen.
      if (role === 'recruiter') {
        return { success: true, user: safeUser, requiresApproval: true };
      }

      setCurrentUser(safeUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      return { success: true, user: safeUser };
    } finally {
      setAuthLoading(false);
    }
  }, [getAllUsers]);

  /**
   * Forgot-password OTP flow (req 3).
   * `requestOtp` looks up the email and stores a 6-digit OTP in localStorage
   * (a real backend would send it by email). `resetPasswordWithOtp` validates
   * the OTP and updates the persisted password.
   */
  const OTP_KEY = 'guc_portfolio_otps';
  const requestOtp = useCallback(async (email) => {
    await mockApiDelay(null, 600);
    const allUsers = getAllUsers();
    const user = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error('No account is registered with that email address.');
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const store = JSON.parse(localStorage.getItem(OTP_KEY) || '{}');
    store[email.toLowerCase()] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 };
    localStorage.setItem(OTP_KEY, JSON.stringify(store));
    return { otp }; // The OTP is returned in the prototype so the demo can show it.
  }, [getAllUsers]);

  const resetPasswordWithOtp = useCallback(async (email, otp, newPassword) => {
    await mockApiDelay(null, 700);
    const store = JSON.parse(localStorage.getItem(OTP_KEY) || '{}');
    const entry = store[email.toLowerCase()];
    if (!entry) throw new Error('No OTP has been requested for this email.');
    if (entry.expiresAt < Date.now()) throw new Error('This OTP has expired. Please request a new one.');
    if (entry.otp !== otp) throw new Error('The OTP you entered is incorrect.');

    // Update the persisted user record (only for localStorage-registered users)
    const extra = JSON.parse(localStorage.getItem(EXTRA_USERS_KEY) || '[]');
    const idx = extra.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (idx >= 0) {
      extra[idx].password = newPassword;
      localStorage.setItem(EXTRA_USERS_KEY, JSON.stringify(extra));
    } else {
      // For seed users we keep an override map so the new password "wins".
      const overrides = JSON.parse(localStorage.getItem('guc_portfolio_password_overrides') || '{}');
      overrides[email.toLowerCase()] = newPassword;
      localStorage.setItem('guc_portfolio_password_overrides', JSON.stringify(overrides));
    }
    delete store[email.toLowerCase()];
    localStorage.setItem(OTP_KEY, JSON.stringify(store));
  }, []);

  // ── logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
  }, []);

  // ── updateProfile ──────────────────────────────────────────────────────
  const updateProfile = useCallback((updates) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ── markNotificationRead / markNotificationUnread ───────────────────────
  const markNotificationRead = useCallback((notifId) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const list = prev.notifications || [];
      const updated = {
        ...prev,
        notifications: list.map((n) =>
          n.id === notifId ? { ...n, read: true } : n
        ),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markNotificationUnread = useCallback((notifId) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const list = prev.notifications || [];
      const updated = {
        ...prev,
        notifications: list.map((n) =>
          n.id === notifId ? { ...n, read: false } : n
        ),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const list = prev.notifications || [];
      const updated = {
        ...prev,
        notifications: list.map((n) => ({ ...n, read: true })),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  /* ── Context value ─────────────────────────────────────────────────── */
  const value = {
    currentUser,
    authLoading,
    login,
    logout,
    register,
    updateProfile,
    markNotificationRead,
    markNotificationUnread,
    markAllNotificationsRead,
    requestOtp,
    resetPasswordWithOtp,
    isAuthenticated: !!currentUser,
    isStudent:   currentUser?.role === 'student',
    isFaculty:   currentUser?.role === 'faculty',
    isRecruiter: currentUser?.role === 'recruiter',
    isAdmin:     currentUser?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Named export for direct use without the hook wrapper
export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>');
  return ctx;
};
