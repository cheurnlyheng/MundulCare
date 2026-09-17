'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldOff, Loader2, AlertCircle, User, Search, Lock, Unlock, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import { adminUserApi } from '@/lib/api';
import { PatientStrike } from '@/types/appointment';
import { useAuth } from '@/context/AuthContext';

type StatusFilter = 'ALL' | 'LOCKED' | 'AT_RISK';

export default function AdminBlacklistPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [patients, setPatients] = useState<PatientStrike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [unlockingId, setUnlockingId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<'strikes' | 'locked'>('locked');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: 'strikes' | 'locked') => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const fetchList = async () => {
    try {
      const res = await adminUserApi.getNoShowList();
      if (res.success && res.data) setPatients(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load the blacklist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.role !== 'ADMIN') {
        router.push('/login?redirect=/admin/blacklist');
      } else {
        fetchList();
      }
    }
  }, [isAuthenticated, user, authLoading]);

  const handleUnlock = async (patient: PatientStrike) => {
    setUnlockingId(patient.id);
    try {
      await adminUserApi.unlockBooking(patient.id);
      setPatients((prev) => prev.filter((p) => p.id !== patient.id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to restore booking access.');
    } finally {
      setUnlockingId(null);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ? true : statusFilter === 'LOCKED' ? p.bookingLocked : !p.bookingLocked;
    return matchesSearch && matchesStatus;
  });

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    const cmp =
      sortKey === 'strikes'
        ? a.noShowCount + a.cancelCount - (b.noShowCount + b.cancelCount)
        : Number(a.bookingLocked) - Number(b.bookingLocked);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const lockedCount = patients.filter((p) => p.bookingLocked).length;

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
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Blacklist</h1>
              <p className="text-sm text-slate-500 mt-1">
                Patients with recorded strikes. Accounts are auto-restricted from booking after 2 no-shows or 3
                self-cancellations.
              </p>
            </div>
            <span className="text-sm text-slate-500 font-semibold font-tabular">
              {lockedCount} locked &middot;
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
                placeholder="Search by patient name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9]"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto bg-slate-100 p-1 rounded-2xl">
              {(['ALL', 'LOCKED', 'AT_RISK'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  title={filter === 'AT_RISK' ? "Has strikes recorded but hasn't hit the auto-lock threshold yet" : undefined}
                  className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer focus:outline-none ${
                    statusFilter === filter
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter === 'ALL' ? 'All' : filter === 'LOCKED' ? 'Locked' : 'At Risk'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="py-3.5 px-4">Patient</th>
                    <th className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleSort('strikes')}
                        className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors cursor-pointer"
                      >
                        Strikes
                        {sortKey === 'strikes' ? (
                          sortDir === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleSort('locked')}
                        className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors cursor-pointer"
                      >
                        Status
                        {sortKey === 'locked' ? (
                          sortDir === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedPatients.length > 0 ? (
                    sortedPatients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 shrink-0">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{patient.name}</div>
                              <div className="text-xs text-slate-400">{patient.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {patient.noShowCount > 0 && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-amber-50 text-amber-700 border-amber-200">
                                {patient.noShowCount} no-show{patient.noShowCount === 1 ? '' : 's'}
                              </span>
                            )}
                            {patient.cancelCount > 0 && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-orange-50 text-orange-700 border-orange-200">
                                {patient.cancelCount} cancellation{patient.cancelCount === 1 ? '' : 's'}
                              </span>
                            )}
                            {patient.noShowCount === 0 && patient.cancelCount === 0 && (
                              <span className="text-xs text-slate-400">&mdash;</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {patient.bookingLocked ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border bg-rose-50 text-rose-700 border-rose-200">
                              <Lock className="w-3 h-3" />
                              Booking Locked
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-slate-100 text-slate-600 border-slate-200">
                              Not Locked
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {patient.bookingLocked ? (
                            <button
                              type="button"
                              onClick={() => handleUnlock(patient)}
                              disabled={unlockingId === patient.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              {unlockingId === patient.id ? 'Unlocking...' : 'Unlock'}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">&mdash;</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-400 text-sm">
                        <ShieldOff className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        No patients match this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
