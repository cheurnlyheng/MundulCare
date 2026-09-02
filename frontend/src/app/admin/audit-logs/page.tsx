'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { History, Loader2, AlertCircle, User, Search, Filter } from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import Pagination from '@/components/Pagination';
import { auditLogApi } from '@/lib/api';
import { AuditLogEntry } from '@/types/auth';
import { useAuth } from '@/context/AuthContext';

export default function AdminAuditLogsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'CREATED' | 'UPDATED' | 'DELETED'>('ALL');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const fetchLogs = async () => {
    try {
      const res = await auditLogApi.getAll();
      if (res.success && res.data) setLogs(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load audit log.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.role !== 'ADMIN') {
        router.push('/login?redirect=/admin/audit-logs');
      } else {
        fetchLogs();
      }
    }
  }, [isAuthenticated, user, authLoading]);

  const actionBadgeColor = () => 'bg-slate-100 text-slate-700 border-slate-200/80';

  const filteredLogs = logs.filter((entry) => {
    const matchesSearch =
      entry.adminName.toLowerCase().includes(search.toLowerCase()) ||
      entry.adminEmail.toLowerCase().includes(search.toLowerCase()) ||
      (entry.details || '').toLowerCase().includes(search.toLowerCase()) ||
      entry.action.toLowerCase().includes(search.toLowerCase());

    const matchesAction =
      actionFilter === 'ALL'
        ? true
        : entry.action.startsWith(actionFilter);

    return matchesSearch && matchesAction;
  });

  // Reset to page 1 whenever the filtered result set changes
  useEffect(() => {
    setPage(1);
  }, [search, actionFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const paginatedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Admin Audit Log</h1>
            <p className="text-sm text-slate-500 mt-1">
              A chronological audit record of administrative operations and changes across the hospital.
            </p>
          </div>
          <span className="text-sm text-slate-500 font-semibold font-tabular">
            {filteredLogs.length} of {logs.length} Total Records
          </span>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 mb-6 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by admin name, email, or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9]"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto bg-slate-100 p-1 rounded-2xl">
            {(['ALL', 'CREATED', 'UPDATED', 'DELETED'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActionFilter(filter)}
                className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer focus:outline-none ${
                  actionFilter === filter
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {filter === 'ALL' ? 'All Operations' : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Table with 14px (text-sm) font */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-xs">
                <tr>
                  <th className="py-3.5 px-4">Administrator</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Details</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-[#6D28D9] shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{entry.adminName}</div>
                            <div className="text-xs text-slate-400">{entry.adminEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border ${actionBadgeColor()}`}
                        >
                          {entry.action.replaceAll('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-md">
                        <p className="text-slate-800 text-sm leading-relaxed">{entry.details}</p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-400 font-tabular">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-slate-400 text-sm">
                      <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      No audit records matching your filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} accentColor="#6D28D9" />
        </div>
      </main>
      </div>
    </div>
  );
}
