/**
 * Login.jsx — Single sign-in for every role; role is resolved from the account record after authentication.
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const { login, isAuthenticated, authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Could not sign you in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface-900 text-slate-100">
      <aside
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12 xl:p-16 border-r border-surface-700/50"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),'
            + 'linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      >
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-500/10  rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0  w-96 h-96 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-md border border-brand-500/60 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-0.5">
              <div className="w-1.5 h-1.5 bg-brand-500"    />
              <div className="w-1.5 h-1.5 bg-surface-500" />
              <div className="w-1.5 h-1.5 bg-surface-500" />
              <div className="w-1.5 h-1.5 bg-brand-500"    />
            </div>
          </div>
          <div className="leading-tight">
            <p className="text-[13px] font-bold tracking-[0.18em] text-slate-100">GUC PORTFOLIO</p>
            <p className="text-[10px] tracking-[0.22em] text-slate-500">STUDENT SHOWCASE PLATFORM</p>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <span className="block w-10 h-px bg-brand-500" />
            <span className="text-[11px] font-semibold tracking-[0.25em] text-brand-500">STUDENT PROJECTS</span>
          </div>

          <h1 className="font-display text-[clamp(2.75rem,5vw,4rem)] leading-[1.05] font-medium text-slate-50 tracking-tight">
            Showcase your <span className="italic text-brand-500">work.</span>
            <br />Discover talent.
          </h1>

        </div>

        <ul className="relative z-10 space-y-2.5 text-sm text-slate-400">
          {[
            'Browse curated student projects by course or type',
            'Faculty feedback and review workflow',
            'Recruiter portfolio discovery',
          ].map((feat) => (
            <li key={feat} className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 sm:px-12">
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-md border border-brand-500/60 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-0.5">
              <div className="w-1 h-1 bg-brand-500"    />
              <div className="w-1 h-1 bg-surface-500" />
              <div className="w-1 h-1 bg-surface-500" />
              <div className="w-1 h-1 bg-brand-500"    />
            </div>
          </div>
          <span className="text-[12px] font-bold tracking-[0.18em] text-slate-100">GUC PORTFOLIO</span>
        </div>

        <div className="w-full max-w-md">
          <h2 className="font-display text-[clamp(2.5rem,4vw,3.25rem)] leading-[1.05] font-medium text-slate-50 tracking-tight">
            Welcome<br />back.
          </h2>
          <p className="mt-4 text-sm text-slate-400">
            New to the platform?{' '}
            <Link to="/register" className="font-semibold text-brand-500 hover:text-brand-400 transition-colors">
              Create an account
            </Link>
          </p>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Use your registered email and password.
          </p>

          {error && (
            <div className="mt-6 px-4 py-3 bg-accent-500/10 border border-accent-500/30 rounded-lg text-sm text-accent-300 flex items-start gap-2">
              <span className="mt-0.5 shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-[11px] font-semibold tracking-[0.18em] text-slate-400 mb-2">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@student.guc.edu.eg or company.com"
                  autoComplete="username"
                  required
                  className="w-full bg-surface-800/60 border border-surface-700 rounded-lg pl-10 pr-4 py-3 text-[15px] text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-[11px] font-semibold tracking-[0.18em] text-slate-400 mb-2">
                PASSWORD
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full bg-surface-800/60 border border-surface-700 rounded-lg pl-10 pr-12 py-3 text-[15px] text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-surface-700 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <Link to="/forgot-password" className="text-xs text-slate-500 hover:text-brand-400 transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={[
                'w-full py-3.5 rounded-lg text-sm font-bold tracking-[0.18em]',
                'bg-brand-500 hover:bg-brand-400 text-surface-900 shadow-md shadow-brand-500/20',
                'transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed',
              ].join(' ')}
            >
              {loading ? 'SIGNING IN…' : 'SIGN IN'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
