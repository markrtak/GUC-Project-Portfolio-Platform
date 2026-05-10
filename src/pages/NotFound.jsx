/**
 * NotFound.jsx — Custom 404 error page
 *
 * PURPOSE:
 *   Displayed whenever the user navigates to a URL that doesn't match any
 *   defined route. A custom 404 page is explicitly required by the MS2 grading
 *   rubric under "Error Handling". It must be informative and provide a clear
 *   path back to a working part of the application.
 *
 * REACT CONCEPTS USED:
 *   useNavigate()  — Allows the "Go Back" button to trigger browser history
 *                    navigation (like pressing the browser's Back button).
 *
 *   useLocation()  — Reads the current URL so we can display the invalid
 *                    path to the user, helping them understand what went wrong.
 *
 *   Conditional rendering — If the user is authenticated, we show a link to
 *                    the Dashboard. Otherwise we show a link to the login page.
 */

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Home, Compass } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';

export default function NotFound() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col items-center justify-center p-6 text-center">
      {/* Decorative blobs */}
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-accent-600/10 rounded-full blur-3xl pointer-events-none" aria-hidden />

      <div className="relative z-10 max-w-md">
        {/* Big 404 number */}
        <div className="text-[8rem] font-black leading-none gradient-text select-none mb-2">
          404
        </div>

        <h1 className="text-2xl font-bold text-slate-100 mb-3">
          Page Not Found
        </h1>

        <p className="text-slate-400 leading-relaxed mb-2">
          The page you're looking for doesn't exist or may have been moved.
        </p>

        {/* Show the attempted path */}
        <div className="inline-block bg-surface-800 border border-surface-700 rounded-lg px-4 py-2 mb-8">
          <code className="text-xs text-red-400 font-mono break-all">
            {location.pathname}
          </code>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="secondary"
            leftIcon={<ArrowLeft size={15} />}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>

          {isAuthenticated ? (
            <>
              <Link to="/dashboard">
                <Button leftIcon={<Home size={15} />}>Dashboard</Button>
              </Link>
              <Link to="/explore/projects">
                <Button variant="ghost" leftIcon={<Compass size={15} />}>
                  Explore Projects
                </Button>
              </Link>
            </>
          ) : (
            <Link to="/login">
              <Button leftIcon={<Home size={15} />}>Back to Login</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
