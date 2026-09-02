'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  Stethoscope,
  Heart,
  Brain,
  Baby,
  Smile,
  Eye,
  Activity,
} from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import { specialtyApi } from '@/lib/api';
import { Specialty, SpecialtyRequest } from '@/types/doctor';
import { useAuth } from '@/context/AuthContext';

function getDepartmentIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('cardio') || lower.includes('heart')) return Heart;
  if (lower.includes('neuro') || lower.includes('brain')) return Brain;
  if (lower.includes('pediatric') || lower.includes('child') || lower.includes('baby')) return Baby;
  if (lower.includes('dental') || lower.includes('tooth')) return Smile;
  if (lower.includes('eye') || lower.includes('ophthalm')) return Eye;
  if (lower.includes('ortho') || lower.includes('bone')) return Activity;
  return Stethoscope;
}

export default function AdminSpecialtiesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSpecialties = async () => {
    try {
      const res = await specialtyApi.getAll();
      if (res.success && res.data) setSpecialties(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load specialties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.role !== 'ADMIN') {
        router.push('/login?redirect=/admin/specialties');
      } else {
        fetchSpecialties();
      }
    }
  }, [isAuthenticated, user, authLoading]);

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (spec: Specialty) => {
    setEditingId(spec.id);
    setName(spec.name);
    setDescription(spec.description || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: SpecialtyRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
    };

    try {
      if (editingId) {
        await specialtyApi.update(editingId, payload);
      } else {
        await specialtyApi.create(payload);
      }
      setIsModalOpen(false);
      fetchSpecialties();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save specialty');
    } finally {
      setSaving(false);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDeleteSpecialty = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await specialtyApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchSpecialties();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete specialty');
    } finally {
      setDeleting(false);
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hospital Medical Specialties
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Configure hospital departments, descriptions, and clinical triage criteria for AI matching.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#5b21b6] text-white font-bold text-sm shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Departments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {specialties.map((spec) => {
            const Icon = getDepartmentIcon(spec.name);
            return (
              <div
                key={spec.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:border-[#6D28D9]/40 transition-colors flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-200/60 flex items-center justify-center text-[#6D28D9] group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(spec)}
                        className="p-2 rounded-xl text-[#6D28D9] hover:bg-purple-50 transition-colors cursor-pointer focus:outline-none"
                        title="Edit Department"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ id: spec.id, name: spec.name })}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer focus:outline-none"
                        title="Delete Department"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-1">{spec.name}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                    {spec.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-tabular font-medium">Department ID: #{spec.id}</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                    Active
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingId ? 'Edit Department' : 'Add New Department'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-sm">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ophthalmology"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-sm">Clinical Scope & Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe what conditions and medical areas this specialty addresses (used by AI)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9] resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#5b21b6] text-white font-bold text-sm shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
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
              <h3 className="text-base font-bold text-slate-900">Delete Department?</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-5">
              This will permanently delete <strong className="text-slate-900">{deleteTarget.name}</strong> and remove it from any assigned physicians.
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
                onClick={confirmDeleteSpecialty}
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
