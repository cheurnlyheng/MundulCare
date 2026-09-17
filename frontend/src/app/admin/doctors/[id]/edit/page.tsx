'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import DoctorForm from '@/components/DoctorForm';
import { doctorApi, specialtyApi } from '@/lib/api';
import { Doctor, DoctorRequest, Specialty } from '@/types/doctor';
import { useAuth } from '@/context/AuthContext';

export default function EditDoctorPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const doctorId = Number(params.id);

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.role !== 'ADMIN') {
        router.push(`/login?redirect=/admin/doctors/${doctorId}/edit`);
        return;
      }

      const fetchData = async () => {
        try {
          const [docRes, specRes] = await Promise.all([
            doctorApi.getById(doctorId),
            specialtyApi.getAll(),
          ]);
          if (docRes.success && docRes.data) setDoctor(docRes.data);
          if (specRes.success && specRes.data) setSpecialties(specRes.data);
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to load doctor.');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isAuthenticated, user, authLoading, doctorId]);

  const handleSubmit = async (payload: DoctorRequest) => {
    setSaving(true);
    try {
      await doctorApi.update(doctorId, payload);
      router.push('/admin/doctors');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save doctor');
    } finally {
      setSaving(false);
    }
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
          <button
            type="button"
            onClick={() => router.push('/admin/doctors')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Doctors Directory</span>
          </button>

          {error || !doctor ? (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error || 'Doctor not found.'}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
              <div className="pb-4 border-b border-slate-100 mb-5">
                <h1 className="text-lg font-bold text-slate-900">Edit Physician Profile</h1>
                <p className="text-xs text-slate-500">
                  Update doctor credentials, department, and consultation hours.
                </p>
              </div>

              <DoctorForm
                specialties={specialties}
                initialData={doctor}
                onSubmit={handleSubmit}
                onCancel={() => router.push('/admin/doctors')}
                saving={saving}
                submitLabel="Save Changes"
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
