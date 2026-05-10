/**
 * AdminUsers.jsx — User account management for administrators
 *
 * COVERS:
 *   Req 52 — View list of all users with their full name, email, and role.
 *   Req 53 — Create other admin accounts (username + password).
 *   Req 54 — Activate / deactivate any account.
 *
 * REACT CONCEPTS USED:
 *   useState() — Search query, role filter, modal state, form fields, errors.
 *   useMemo()  — Derives the filtered table on every search/filter change.
 *   useDataContext() — Reads users + calls setUserActive / createAdminAccount.
 *   useAuth() — Prevents an admin from deactivating themselves.
 */

import { useState, useMemo } from 'react';
import {
  Search, ShieldCheck, UserCheck, UserX, Plus, Mail,
  GraduationCap, Building2, UserCog, ShieldAlert,
} from 'lucide-react';
import PageWrapper      from '@/components/layout/PageWrapper';
import Button           from '@/components/common/Button';
import Input            from '@/components/common/Input';
import Modal            from '@/components/common/Modal';
import Badge            from '@/components/common/Badge';
import ConfirmDialog    from '@/components/common/ConfirmDialog';
import { useAuth }       from '@/hooks/useAuth';
import { useDataContext } from '@/context/DataContext';
import { formatDate }    from '@/utils/formatters';

const ROLE_META = {
  student:   { icon: GraduationCap, label: 'Student',   color: 'bg-brand-500/15 text-brand-400 border-brand-500/30' },
  faculty:   { icon: UserCog,       label: 'Faculty',   color: 'bg-accent-500/15 text-accent-400 border-accent-500/30' },
  recruiter: { icon: Building2,     label: 'Employer',  color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  admin:     { icon: ShieldCheck,   label: 'Admin',     color: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

export default function AdminUsers() {
  const { currentUser } = useAuth();
  const { users, setUserActive, createAdminAccount } = useDataContext();

  const [query, setQuery]             = useState('');
  const [roleFilter, setRoleFilter]   = useState('all');
  const [showCreate, setShowCreate]   = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [busyUserId, setBusyUserId]   = useState(null);

  /* ── Filtering ────────────────────────────────────────────── */
  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        (u.name  || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    });
  }, [users, query, roleFilter]);

  /* ── Activate / deactivate ───────────────────────────────── */
  const handleToggleActive = async () => {
    if (!confirmTarget) return;
    setBusyUserId(confirmTarget.id);
    try {
      await setUserActive(confirmTarget.id, !confirmTarget.isActive);
    } finally {
      setBusyUserId(null);
      setConfirmTarget(null);
    }
  };

  /* ── Create admin ────────────────────────────────────────── */
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [formErrors, setFormErrors] = useState({});
  const [creating, setCreating]     = useState(false);

  const resetForm = () => {
    setForm({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!form.firstName.trim()) errors.firstName = 'First name is required';
    if (!form.lastName.trim())  errors.lastName  = 'Last name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email address';
    if (users.some((u) => u.email.toLowerCase() === form.email.trim().toLowerCase()))
      errors.email = 'This email is already in use';
    if (form.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setCreating(true);
    try {
      await createAdminAccount({
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        email:     form.email.trim(),
        password:  form.password,
      });
      setShowCreate(false);
      resetForm();
    } finally {
      setCreating(false);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">User management</h1>
            <p className="text-sm text-slate-400 mt-1">
              {users.length} accounts on the platform — search, filter, deactivate, or create new admin accounts.
            </p>
          </div>
          <Button leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
            Create admin
          </Button>
        </div>

        {/* Filters */}
        <div className="card p-4 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by name or email…"
              leftIcon={<Search size={15} />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all',       label: 'All' },
              { id: 'student',   label: 'Students' },
              { id: 'faculty',   label: 'Faculty' },
              { id: 'recruiter', label: 'Employers' },
              { id: 'admin',     label: 'Admins' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setRoleFilter(opt.id)}
                className={[
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  roleFilter === opt.id
                    ? 'bg-brand-600/20 text-brand-300 border-brand-500/40'
                    : 'bg-surface-800 text-slate-400 border-surface-700 hover:bg-surface-700',
                ].join(' ')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400">
              No users match your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-800/60 border-b border-surface-700">
                  <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-700">
                  {filteredUsers.map((u) => {
                    const meta = ROLE_META[u.role] || ROLE_META.student;
                    const RoleIcon = meta.icon;
                    const isSelf   = u.id === currentUser?.id;
                    const pending  = u.role === 'recruiter' && u.applicationStatus === 'pending';
                    return (
                      <tr key={u.id} className="hover:bg-surface-800/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`}
                              alt={u.name}
                              className="w-9 h-9 rounded-full bg-surface-700"
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-slate-200 truncate">{u.name}</p>
                              <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                                <Mail size={11} /> {u.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold border ${meta.color}`}>
                            <RoleIcon size={12} />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                          {u.createdAt ? formatDate(u.createdAt) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {pending ? (
                            <Badge variant="amber" size="sm" dot>Pending approval</Badge>
                          ) : u.isActive === false ? (
                            <Badge variant="red" size="sm" dot>Deactivated</Badge>
                          ) : (
                            <Badge variant="green" size="sm" dot>Active</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isSelf ? (
                            <span className="text-[11px] text-slate-500 italic">You</span>
                          ) : (
                            <Button
                              variant={u.isActive === false ? 'success' : 'danger'}
                              size="sm"
                              loading={busyUserId === u.id}
                              leftIcon={u.isActive === false ? <UserCheck size={14} /> : <UserX size={14} />}
                              onClick={() => setConfirmTarget(u)}
                            >
                              {u.isActive === false ? 'Activate' : 'Deactivate'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Confirm activate/deactivate */}
      <ConfirmDialog
        isOpen={!!confirmTarget}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleToggleActive}
        loading={busyUserId === confirmTarget?.id}
        title={confirmTarget?.isActive === false ? 'Activate account?' : 'Deactivate account?'}
        message={
          confirmTarget?.isActive === false
            ? `Restore access for ${confirmTarget?.name}? They'll be able to log in again.`
            : `Are you sure you want to deactivate ${confirmTarget?.name}? They will be unable to log in until reactivated.`
        }
        confirmLabel={confirmTarget?.isActive === false ? 'Activate' : 'Deactivate'}
        variant={confirmTarget?.isActive === false ? 'success' : 'danger'}
      />

      {/* Create admin modal (req 53) */}
      <Modal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); resetForm(); }}
        title="Create new admin account"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowCreate(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={creating} leftIcon={<ShieldAlert size={15} />}>
              Create admin
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              error={formErrors.firstName}
              required
            />
            <Input
              label="Last name"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              error={formErrors.lastName}
              required
            />
          </div>
          <Input
            label="Email address"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            leftIcon={<Mail size={15} />}
            error={formErrors.email}
            required
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={formErrors.password}
            helperText="Minimum 6 characters."
            required
          />
          <Input
            label="Confirm password"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            error={formErrors.confirmPassword}
            required
          />
          <div className="text-[11px] text-slate-500 flex items-start gap-2 p-3 bg-surface-900 rounded-lg border border-surface-700">
            <ShieldCheck size={14} className="text-brand-400 shrink-0 mt-0.5" />
            <span>The new admin will have full access to user, course, employer, flag, and statistics tools.</span>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
}
