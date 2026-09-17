'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Loader2,
  AlertCircle,
  User as UserIcon,
  Search,
  Lock,
  Unlock,
  Trash2,
  Shield,
} from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import { adminUserApi } from '@/lib/api';
import { AdminUser } from '@/types/appointment';
import { useAuth } from '@/context/AuthContext';

type RoleFilter = 'ALL' | 'PATIENT' | 'ADMIN';
type ConfirmAction = { type: 'lock' | 'unlock' | 'delete'; target: AdminUser };

export default function AdminUsersPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await adminUserApi.getAll();
      if (res.success && res.data) setUsers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.role !== 'ADMIN') {
        router.push('/login?redirect=/admin/users');
      } else {
        fetchUsers();
      }
    }
  }, [isAuthenticated, user, authLoading]);

  const handleConfirm = async () => {
    if (!confirmAction) return;
    const { type, target } = confirmAction;
    setProcessingId(target.id);
    try {
      if (type === 'lock') {
        await adminUserApi.lockBooking(target.id);
        setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, bookingLocked: true } : u)));
      } else if (type === 'unlock') {
        await adminUserApi.unlockBooking(target.id);
        setUsers((prev) =>
          prev.map((u) => (u.id === target.id ? { ...u, bookingLocked: false, noShowCount: 0, cancelCount: 0 } : u))
        );
      } else {
        await adminUserApi.delete(target.id);
        setUsers((prev) => prev.filter((u) => u.id !== target.id));
      }
      setConfirmAction(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' ? true : u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#6D28D9] mb-2" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col selection:bg-[#6D28D9] selection:text-white">
      <AdminHeader />

      <div className="flex-1 flex min-h-0">
        <AdminSidebar />

        <main className="flex-1 min-w-0 p-6 sm:p-8 lg:p-10 overflow-y-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
              <p className="text-sm text-slate-500 mt-1">
                Every registered account. Lock restricts booking (same as the auto-lock after 2 no-shows or 3
                self-cancellations); delete permanently removes the account and its appointment history.
              </p>
            </div>
            <span className="text-sm text-slate-500 font-semibold font-tabular">
              Total of {users.length} accounts
            </span>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 mb-6 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9]"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto bg-slate-100 p-1 rounded-2xl">
              {(['ALL', 'PATIENT', 'ADMIN'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setRoleFilter(filter)}
                  className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer focus:outline-none ${
                    roleFilter === filter
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter === 'ALL' ? 'All Roles' : filter.charAt(0) + filter.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="py-3.5 px-4">Account</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Provider</th>
                    <th className="py-3.5 px-4">Strikes</th>
                    <th className="py-3.5 px-4">Booking Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                                u.role === 'ADMIN'
                                  ? 'bg-[#f5f3ff] border-[#ddd6fe] text-[#6D28D9]'
                                  : 'bg-[#fbf5f8] border-[#edd5e3] text-[#aa5588]'
                              }`}
                            >
                              <UserIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                              <div className="text-xs text-slate-400">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                              u.role === 'ADMIN'
                                ? 'bg-[#f5f3ff] text-[#6D28D9] border-[#ddd6fe]'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {u.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">{u.authProvider}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {u.noShowCount > 0 && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-amber-50 text-amber-700 border-amber-200">
                                {u.noShowCount} no-show{u.noShowCount === 1 ? '' : 's'}
                              </span>
                            )}
                            {u.cancelCount > 0 && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-orange-50 text-orange-700 border-orange-200">
                                {u.cancelCount} cancellation{u.cancelCount === 1 ? '' : 's'}
                              </span>
                            )}
                            {u.noShowCount === 0 && u.cancelCount === 0 && (
                              <span className="text-xs text-slate-400">&mdash;</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {u.bookingLocked ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border bg-rose-50 text-rose-700 border-rose-200">
                              <Lock className="w-3 h-3" />
                              Locked
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                              Not Locked
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-end gap-2">
                            {u.role === 'ADMIN' ? (
                              <span className="text-xs text-slate-400">&mdash;</span>
                            ) : (
                              <>
                                {u.bookingLocked ? (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmAction({ type: 'unlock', target: u })}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                                  >
                                    <Unlock className="w-3.5 h-3.5" />
                                    Unlock
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmAction({ type: 'lock', target: u })}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                                  >
                                    <Lock className="w-3.5 h-3.5" />
                                    Lock
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setConfirmAction({ type: 'delete', target: u })}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                        <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        No accounts match your filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Lock / Unlock / Delete confirmation modal */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setConfirmAction(null)}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  confirmAction.type === 'delete'
                    ? 'bg-rose-50 text-rose-500'
                    : confirmAction.type === 'lock'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {confirmAction.type === 'delete' ? (
                  <Trash2 className="w-5 h-5" />
                ) : confirmAction.type === 'lock' ? (
                  <Lock className="w-5 h-5" />
                ) : (
                  <Unlock className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">
                  {confirmAction.type === 'delete'
                    ? 'Delete this account?'
                    : confirmAction.type === 'lock'
                      ? 'Lock this account from booking?'
                      : 'Restore booking access?'}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">{confirmAction.target.name}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              {confirmAction.type === 'delete'
                ? 'This permanently deletes the account and all of their appointment history. This cannot be undone.'
                : confirmAction.type === 'lock'
                  ? 'They will immediately be unable to book new appointments, the same restriction applied automatically after 2 no-shows or 3 self-cancellations.'
                  : 'Their strikes will be cleared and they will be able to book new appointments again.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={processingId === confirmAction.target.id}
                className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 cursor-pointer ${
                  confirmAction.type === 'delete'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : confirmAction.type === 'lock'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {processingId === confirmAction.target.id
                  ? 'Processing...'
                  : confirmAction.type === 'delete'
                    ? 'Delete'
                    : confirmAction.type === 'lock'
                      ? 'Lock'
                      : 'Unlock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
