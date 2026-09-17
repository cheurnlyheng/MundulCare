'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarCheck,
  UserCheck,
  Layers,
  Clock,
  Plus,
  ArrowRight,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import Pagination from '@/components/Pagination';
import { appointmentApi, doctorApi, specialtyApi } from '@/lib/api';
import { AppointmentResponse } from '@/types/appointment';
import { Doctor, Specialty } from '@/types/doctor';
import { useAuth } from '@/context/AuthContext';

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.role !== 'ADMIN') {
        router.push('/login?redirect=/admin');
      } else {
        fetchDashboardData();
      }
    }
  }, [isAuthenticated, user, authLoading]);

  const fetchDashboardData = async () => {
    try {
      const [aptRes, docRes, specRes] = await Promise.all([
        appointmentApi.getAll(),
        doctorApi.getAll(),
        specialtyApi.getAll(),
      ]);

      if (aptRes.success && aptRes.data) setAppointments(aptRes.data);
      if (docRes.success && docRes.data) setDoctors(docRes.data);
      if (specRes.success && specRes.data) setSpecialties(specRes.data);
    } catch (err) {
      console.error('Failed to load admin metrics', err);
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = appointments.filter((a) => a.status === 'PENDING').length;
  const confirmedCount = appointments.filter((a) => a.status === 'CONFIRMED').length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;

  const getStatusBadge = (status: string) => {
    const label = status.charAt(0) + status.slice(1).toLowerCase();
    const displayLabel = status === 'REJECTED' ? 'Declined' : label;
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
        {displayLabel}
      </span>
    );
  };

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
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hospital Operations Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Welcome back, <strong className="text-slate-800">{user?.name}</strong>. Real-time overview of appointments, departments, and medical staff.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/doctors"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#5b21b6] text-white font-bold text-sm shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Doctor</span>
            </Link>
          </div>
        </div>

        {/* 4 Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Total Appointments */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Bookings
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block font-tabular">
                {appointments.length}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </div>

          {/* Doctors on Staff */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Doctors
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block font-tabular">
                {doctors.length}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>

          {/* Specialties / Departments */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Departments
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block font-tabular">
                {specialties.length}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-[#6D28D9]">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          {/* Confirmed / Completed Visits */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Completed
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block font-tabular">
                {confirmedCount + completedCount}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Pending Action Banner */}
        {pendingCount > 0 && (
          <div className="bg-white border border-amber-200/90 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 shadow-2xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {pendingCount} Patient Appointment Requests Awaiting Review
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  Confirm or reschedule consultations so doctors and patients receive notifications promptly.
                </p>
              </div>
            </div>

            <Link
              href="/admin/appointments"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#5b21b6] text-white text-xs font-bold shadow-xs transition-colors shrink-0"
            >
              <span>Review Bookings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Recent Appointments Registry Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Appointments</h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest consultation requests and bookings across all departments</p>
            </div>

            <Link
              href="/admin/appointments"
              className="text-xs font-bold text-[#6D28D9] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Patient</th>
                  <th className="px-5 py-3.5">Doctor</th>
                  <th className="px-5 py-3.5">Date & Window</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {appointments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      <div>{apt.patientName}</div>
                      <div className="text-xs text-slate-400 font-normal">{apt.patientEmail}</div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{apt.doctorName}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-tabular text-sm">
                      <div className="font-bold text-slate-800">
                        <span>{apt.appointmentDate}</span>
                      </div>
                      <div className="text-xs text-slate-400 font-normal mt-0.5">
                        {apt.startTime} - {apt.endTime}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">{getStatusBadge(apt.status)}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-600 font-tabular text-sm">
                      ${apt.consultationFee?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={page}
            totalPages={Math.max(1, Math.ceil(appointments.length / PAGE_SIZE))}
            onPageChange={setPage}
            accentColor="#6D28D9"
          />
        </div>
      </main>
      </div>
    </div>
  );
}
