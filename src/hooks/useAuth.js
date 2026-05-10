/**
 * useAuth.js — Convenience hook for consuming AuthContext
 *
 * PURPOSE:
 *   Provides a single, clean import path for all authentication state and
 *   actions. Instead of importing both `useContext` and `AuthContext` in
 *   every component, they import only `useAuth`.
 *
 * REACT CONCEPTS USED:
 *   Custom hook — A regular JavaScript function whose name starts with "use"
 *   and that calls other React hooks internally. Custom hooks allow logic
 *   reuse without changing the component hierarchy.
 *
 *   The hook simply re-exports the value from AuthContext, but having it in
 *   one place means we could add extra logic here (e.g., redirect on logout)
 *   without touching every consumer.
 *
 * USAGE:
 *   import { useAuth } from '@/hooks/useAuth';
 *   const { currentUser, login, logout, isAuthenticated } = useAuth();
 */

import { useAuthContext } from '@/context/AuthContext';

export function useAuth() {
  return useAuthContext();
}
