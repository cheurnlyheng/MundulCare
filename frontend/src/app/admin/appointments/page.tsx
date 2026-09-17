'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  Download,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Search,
  Filter,
  X,
  User,
  Phone,
  Mail,
  RotateCcw,
  UserX,
  Lock,
  Unlock,
  Clock,
} from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import Pagination from '@/components/Pagination';
import { appointmentApi, adminUserApi } from '@/lib/api';
import { AppointmentResponse } from '@/types/appointment';
import { useAuth } from '@/context/AuthContext';

export default function AdminAppointmentsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  // Rejection modal
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // No-show confirmation modal
  const [noShowTarget, setNoShowTarget] = useState<AppointmentResponse | null>(null);
  const [unlockingId, setUnlockingId] = useState<number | null>(null);

  // Check auth
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.role !== 'ADMIN') {
        router.push('/login?redirect=/admin/appointments');
      } else {
        fetchAppointments();
      }
    }
  }, [isAuthenticated, user, authLoading]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedAppointment) {
          setSelectedAppointment(null);
          setRejectReason('');
        }
        if (noShowTarget) setNoShowTarget(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAppointment, noShowTarget]);

  const fetchAppointments = async () => {
    try {
      const res = await appointmentApi.getAll();
      if (res.success && res.data) {
        setAppointments(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    id: number,
    status: 'CONFIRMED' | 'REJECTED' | 'COMPLETED' | 'NO_SHOW',
    rejectionReason?: string
  ) => {
    setSubmittingAction(true);
    try {
      const res = await appointmentApi.updateStatus(id, { status, rejectionReason });
      if (res.success) {
        setSelectedAppointment(null);
        setRejectReason('');
        setNoShowTarget(null);
        fetchAppointments();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update appointment status');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleUnlockBooking = async (patientUserId: number) => {
    setUnlockingId(patientUserId);
    try {
      const res = await adminUserApi.unlockBooking(patientUserId);
      if (res.success) {
        fetchAppointments();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to unlock booking access');
    } finally {
      setUnlockingId(null);
    }
  };

  const handleExportCsv = async () => {
    try {
      await appointmentApi.exportCsv();
    } catch (err) {
      alert('Failed to export CSV. Please check system permissions.');
    }
  };

  // Uniform grey pill badges - color is reserved for interactive elements
  const getStatusBadge = (status: string) => {
    const labels: Record<string, string> = {
      CONFIRMED: 'Confirmed',
      COMPLETED: 'Completed',
      REJECTED: 'Declined',
      CANCELLED: 'Cancelled',
      PENDING: 'Pending Review',
      NO_SHOW: 'No-Show',
    };
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
        {labels[status] || status}
      </span>
    );
  };

  // Filter by search, status, specific date, and month
  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter;
    const matchesSearch =
      apt.doctorName.toLowerCase().includes(search.toLowerCase()) ||
      apt.patientName.toLowerCase().includes(search.toLowerCase()) ||
      apt.patientEmail.toLowerCase().includes(search.toLowerCase()) ||
      (apt.patientPhone && apt.patientPhone.includes(search)) ||
      (apt.reason && apt.reason.toLowerCase().includes(search.toLowerCase()));

    const matchesDate = !selectedDate || apt.appointmentDate === selectedDate;
    const matchesMonth = !selectedMonth || apt.appointmentDate.startsWith(selectedMonth);

    return matchesStatus && matchesSearch && matchesDate && matchesMonth;
  });

  const countByStatus = (st: string) => {
    if (st === 'ALL') return appointments.length;
    return appointments.filter((a) => a.status === st).length;
  };

  // Flags appointments whose date has already passed but were never resolved - these are
  // the ones an admin needs to mark Completed/No-Show, otherwise the patient's one-active-
  // appointment limit leaves them stuck and the slot sits dead-locked indefinitely.
  const todayStr = new Date().toISOString().slice(0, 10);
  const isOverdue = (apt: AppointmentResponse) =>
    (apt.status === 'PENDING' || apt.status === 'CONFIRMED') && apt.appointmentDate < todayStr;

  // Reset to page 1 whenever the filtered result set changes
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, selectedDate, selectedMonth]);

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE));
  const paginatedAppointments = filteredAppointments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Consultation Appointments
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Review patient bookings, confirm time slots, and export appointment registries.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs self-start sm:self-auto cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#6D28D9]" />
            <span>Export CSV Report</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Controls: Search + Date Pickers + Status Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 mb-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            {/* Search Input - grows to fill remaining space, pushing the rest to the edge */}
            <div className="relative w-full md:flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient, doctor, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 h-11 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9] transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Date Filter */}
            <div className="w-full md:w-56 shrink-0">
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3.5 h-11 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9] cursor-pointer"
                />
                {selectedDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    title="Clear date"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Reset Filter Button */}
            {(selectedDate || selectedMonth || search || statusFilter !== 'ALL') && (
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate('');
                    setSelectedMonth('');
                    setSearch('');
                    setStatusFilter('ALL');
                  }}
                  title="Reset all filters"
                  className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Segmented Status Tabs with Counts */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {[
              { label: 'All', value: 'ALL' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Confirmed', value: 'CONFIRMED' },
              { label: 'Completed', value: 'COMPLETED' },
              { label: 'Declined', value: 'REJECTED' },
              { label: 'Cancelled', value: 'CANCELLED' },
              { label: 'No-Show', value: 'NO_SHOW' },
            ].map((tab) => {
              const isActive = statusFilter === tab.value;
              const count = countByStatus(tab.value);
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 focus:outline-none ${
                    isActive
                      ? 'bg-[#6D28D9] text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-xs font-bold font-tabular ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Appointments Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {filteredAppointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4">Patient</th>
                    <th className="px-5 py-4">Doctor</th>
                    <th className="px-5 py-4">Date & Time</th>
                    <th className="px-5 py-4">Reason</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedAppointments.map((apt) => (
                    <tr
                      key={apt.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isOverdue(apt) ? 'bg-amber-50/60' : ''
                      }`}
                    >
                      {/* Patient Details */}
                      <td className="px-5 py-4">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className="font-bold text-slate-900 text-sm">{apt.patientName}</span>
                          {isOverdue(apt) && (
                            <span
                              title="Appointment date has passed and is still unresolved"
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-300"
                            >
                              <Clock className="w-2.5 h-2.5" />
                              OVERDUE
                            </span>
                          )}
                          {apt.patientBookingLocked && (
                            <span
                              title="Booking access is currently restricted for this patient"
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-300"
                            >
                              <Lock className="w-2.5 h-2.5" />
                              
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span>{apt.patientEmail}</span>
                        </div>
                        {apt.patientPhone && (
                          <div className="text-xs text-slate-500 font-tabular mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{apt.patientPhone}</span>
                          </div>
                        )}
                        {(apt.patientBookingLocked || apt.patientNoShowCount > 0 || apt.patientCancelCount > 0) && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {apt.patientBookingLocked && (
                              <button
                                type="button"
                                onClick={() => handleUnlockBooking(apt.patientUserId)}
                                disabled={unlockingId === apt.patientUserId}
                                title="Clear strikes and restore booking access"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#6D28D9] text-white border border-[#ddd6fe] hover:opacity-80 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <Unlock className="w-2.5 h-2.5" />
                                {unlockingId === apt.patientUserId ? 'UNLOCKING...' : 'UNLOCK'}
                              </button>
                            )}
                            {apt.patientNoShowCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-300">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                {apt.patientNoShowCount} NO-SHOW{apt.patientNoShowCount > 1 ? 'S' : ''}
                              </span>
                            )}
                            {apt.patientCancelCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-300">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                {apt.patientCancelCount} CANCEL{apt.patientCancelCount > 1 ? 'S' : ''}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Doctor Details */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-sm">{apt.doctorName}</div>
                        <div className="text-xs text-slate-500 font-bold font-tabular mt-0.5">
                          Fee: ${apt.consultationFee?.toFixed(2)}
                        </div>
                      </td>

                      {/* Date & Time Window */}
                      <td className="px-5 py-4">
                        <div className="text-slate-800 font-tabular font-bold text-sm">
                          <span>{apt.appointmentDate}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-tabular mt-0.5">
                          <span>{apt.startTime} - {apt.endTime}</span>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="px-5 py-4 max-w-xs">
                        <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">
                          {apt.reason || 'General medical consultation'}
                        </p>
                        {apt.rejectionReason && (
                          <p className="text-xs text-rose-600 mt-1 font-medium bg-rose-50 p-2 rounded-lg border border-rose-200/80">
                            Decline reason: {apt.rejectionReason}
                          </p>
                        )}
                      </td>

                      {/* Status Pill */}
                      <td className="px-5 py-4">{getStatusBadge(apt.status)}</td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {apt.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(apt.id, 'CONFIRMED')}
                              disabled={submittingAction}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirm</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedAppointment(apt)}
                              disabled={submittingAction}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                          </div>
                        ) : apt.status === 'CONFIRMED' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                              disabled={submittingAction}
                              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark Completed</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setNoShowTarget(apt)}
                              disabled={submittingAction}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>No-Show</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No action required</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-400">
              <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No appointments found</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting the date, month, or status filter.</p>
            </div>
          )}
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} accentColor="#6D28D9" />
        </div>

        {/* Reject Modal with Backdrop Click Dismissal & ESC Key */}
        {selectedAppointment && (
          <div
            onClick={() => {
              setSelectedAppointment(null);
              setRejectReason('');
            }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in-50 zoom-in-95 duration-150"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Decline Appointment
                  </h3>
                  <p className="text-xs text-slate-400">
                    Patient: {selectedAppointment.patientName}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                Please provide a clinical or scheduling reason so the patient is informed promptly.
              </p>

              <textarea
                rows={3}
                required
                placeholder="e.g. Doctor is called for emergency surgery; please reschedule for another slot."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9] mb-5 resize-none text-slate-900"
              />

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAppointment(null);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel (Esc)
                </button>
                <button
                  type="button"
                  disabled={submittingAction || !rejectReason.trim()}
                  onClick={() => handleUpdateStatus(selectedAppointment.id, 'REJECTED', rejectReason)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submittingAction ? 'Processing...' : 'Confirm Decline'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No-Show Confirmation Modal */}
        {noShowTarget && (
          <div
            onClick={() => setNoShowTarget(null)}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in-50 zoom-in-95 duration-150"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Mark as No-Show?</h3>
                  <p className="text-xs text-slate-400">
                    Patient: {noShowTarget.patientName}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-5 leading-relaxed">
                This records a strike against the patient&apos;s account. They currently have{' '}
                <strong className="text-slate-900">{noShowTarget.patientNoShowCount}</strong> no-show
                {noShowTarget.patientNoShowCount === 1 ? '' : 's'} on record.{' '}
                {noShowTarget.patientNoShowCount + 1 >= 2 ? (
                  <strong className="text-rose-600">
                    This will be their 2nd strike - their account will be automatically locked from booking new appointments.
                  </strong>
                ) : (
                  'One more after this will automatically lock their account from booking new appointments.'
                )}
              </p>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setNoShowTarget(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel (Esc)
                </button>
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={() => handleUpdateStatus(noShowTarget.id, 'NO_SHOW')}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submittingAction ? 'Processing...' : 'Confirm No-Show'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
