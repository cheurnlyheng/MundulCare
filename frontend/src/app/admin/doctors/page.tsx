'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Power,
  Loader2,
  AlertCircle,
  X,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import CustomSelect from '@/components/CustomSelect';
import Pagination from '@/components/Pagination';
import DoctorForm from '@/components/DoctorForm';
import { doctorApi, specialtyApi } from '@/lib/api';
import { Doctor, DoctorRequest, Specialty } from '@/types/doctor';
import { useAuth } from '@/context/AuthContext';
import { getDoctorAvatarUrl } from '@/lib/doctorAvatar';

export default function AdminDoctorsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  // Create Doctor Modal (editing has its own dedicated page - too many fields for a modal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Separate Confirmation Modals
  const [deactivateTarget, setDeactivateTarget] = useState<Doctor | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const [docRes, specRes] = await Promise.all([
        doctorApi.getAllForAdmin(),
        specialtyApi.getAll(),
      ]);

      if (docRes.success && docRes.data) setDoctors(docRes.data);
      if (specRes.success && specRes.data) setSpecialties(specRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.role !== 'ADMIN') {
        router.push('/login?redirect=/admin/doctors');
      } else {
        fetchData();
      }
    }
  }, [isAuthenticated, user, authLoading]);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setDeactivateTarget(null);
        setDeleteTarget(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateDoctor = async (payload: DoctorRequest, photoFile?: File) => {
    setSaving(true);
    try {
      const res = await doctorApi.create(payload);
      if (photoFile && res.data?.id) {
        try {
          await doctorApi.uploadProfileImage(res.data.id, photoFile);
        } catch (err: any) {
          alert(err.response?.data?.message || 'Doctor was created, but the photo failed to upload.');
        }
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save doctor');
    } finally {
      setSaving(false);
    }
  };

  const confirmToggleActive = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    const doc = deactivateTarget;

    try {
      await doctorApi.setActive(doc.id, !doc.isActive);
      setDeactivateTarget(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update doctor status');
    } finally {
      setDeactivating(false);
    }
  };

  const confirmDeleteDoctor = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await doctorApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete doctor');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered Doctors
  const filteredDoctors = doctors.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? d.isActive
        : !d.isActive;

    const matchesSpecialty =
      specialtyFilter === 'ALL'
        ? true
        : d.specialties?.some((s) => s.name === specialtyFilter || s.id.toString() === specialtyFilter);

    return matchesSearch && matchesStatus && matchesSpecialty;
  });

  // Reset to page 1 whenever the filtered result set changes
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, specialtyFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / PAGE_SIZE));
  const paginatedDoctors = filteredDoctors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hospital Doctors Directory
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Add doctor profiles, assign clinical departments, update fees, and manage weekly availability.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#5b21b6] text-white font-bold text-sm shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Physician</span>
          </button>
        </div>

        {/* Filters Bar: Search + Status Filter + Specialty Filter */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 mb-6 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or license..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Specialty Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <CustomSelect
                value={specialtyFilter}
                onChange={setSpecialtyFilter}
                options={[
                  { value: 'ALL', label: 'All Departments' },
                  ...specialties.map((spec) => ({ value: spec.name, label: spec.name })),
                ]}
                className="w-48"
                accentColor="#6D28D9"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer focus:outline-none ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : 'Inactive'}
                </button>
              ))}
            </div>

            <span className="text-sm font-semibold text-slate-500 font-tabular ml-1">
              ({filteredDoctors.length} {filteredDoctors.length === 1 ? 'doctor' : 'doctors'})
            </span>
          </div>
        </div>

        {/* Doctor Table - Text size text-sm (14px) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-slate-400 font-bold border-b border-slate-200 uppercase tracking-wider text-xs">
                <tr>
                  <th className="py-4 px-5">PHYSICIAN</th>
                  <th className="py-4 px-4">SPECIALTIES</th>
                  <th className="py-4 px-4">EXPERIENCE</th>
                  <th className="py-4 px-4">FEE</th>
                  <th className="py-4 px-4">STATUS</th>
                  <th className="py-4 px-5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedDoctors.length > 0 ? (
                  paginatedDoctors.map((doc) => {
                    const avatarUrl = getDoctorAvatarUrl(doc.name, doc.id, doc.profileImage);

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-xs">
                              <img
                                src={avatarUrl}
                                alt={doc.name}
                                className="w-full h-full object-cover object-top"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{doc.name}</div>
                              <div className="text-xs text-slate-400">{doc.email}</div>
                              <div className="text-[11px] text-slate-400 font-medium font-tabular">{doc.licenseNumber}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-xs font-medium text-slate-600">
                          {doc.specialties && doc.specialties.length > 0
                            ? doc.specialties.map((s) => s.name).join(', ')
                            : 'General Medicine'}
                        </td>

                        <td className="py-4 px-4 font-medium text-slate-700 font-tabular text-xs">
                          {doc.experienceYears} Years
                        </td>

                        <td className="py-4 px-4 font-bold text-slate-600 font-tabular text-sm">
                          ${doc.consultationFee.toFixed(2)}
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                            {doc.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Deactivate / Activate button with confirmation modal */}
                            <button
                              onClick={() => setDeactivateTarget(doc)}
                              title={doc.isActive ? 'Deactivate Doctor' : 'Activate Doctor'}
                              className={`p-2 rounded-xl transition-colors cursor-pointer focus:outline-none ${
                                doc.isActive
                                  ? 'text-amber-600 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              <Power className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => router.push(`/admin/doctors/${doc.id}/edit`)}
                              title="Edit Doctor"
                              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setDeleteTarget({ id: doc.id, name: doc.name })}
                              title="Delete Doctor"
                              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer focus:outline-none"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                      No doctors matching the selected filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} accentColor="#6D28D9" />
        </div>
      </main>

      {/* Add Doctor Modal (editing happens on its own dedicated page) */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 sm:p-8 max-h-[88vh] overflow-y-auto animate-in fade-in-50 zoom-in-95"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Register New Physician</h3>
                <p className="text-xs text-slate-500">Create a new physician profile.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <DoctorForm
              specialties={specialties}
              onSubmit={handleCreateDoctor}
              onCancel={() => setIsModalOpen(false)}
              saving={saving}
              submitLabel="Register Physician"
            />
          </div>
        </div>
      )}

      {/* Deactivate / Reactivate Confirmation Modal */}
      {deactivateTarget && (
        <div
          onClick={() => setDeactivateTarget(null)}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in-50 zoom-in-95"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  deactivateTarget.isActive
                    ? 'bg-amber-50 border border-amber-200 text-amber-600'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                }`}
              >
                {deactivateTarget.isActive ? <Power className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {deactivateTarget.isActive ? 'Deactivate Physician?' : 'Activate Physician?'}
              </h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-5">
              {deactivateTarget.isActive ? (
                <>
                  Are you sure you want to deactivate <strong className="text-slate-900">{deactivateTarget.name}</strong>? This doctor will be hidden from new patient appointment bookings.
                </>
              ) : (
                <>
                  Are you sure you want to reactivate <strong className="text-slate-900">{deactivateTarget.name}</strong>? This doctor will once again be visible to patients for scheduling consultations.
                </>
              )}
            </p>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeactivateTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmToggleActive}
                disabled={deactivating}
                className={`px-4 py-2 rounded-xl text-white font-bold text-sm shadow-xs disabled:opacity-50 cursor-pointer ${
                  deactivateTarget.isActive
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {deactivating
                  ? 'Updating...'
                  : deactivateTarget.isActive
                  ? 'Confirm Deactivate'
                  : 'Confirm Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          onClick={() => setDeleteTarget(null)}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 animate-in fade-in-50 zoom-in-95"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete Physician?</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-5">
              This will permanently delete <strong className="text-slate-900">{deleteTarget.name}</strong>, including all assigned schedules and records. This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteDoctor}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
