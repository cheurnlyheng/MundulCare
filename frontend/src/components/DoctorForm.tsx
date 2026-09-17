'use client';

import React, { useEffect, useState } from 'react';
import {
  Camera,
  ChevronDown,
  Loader2,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { doctorApi } from '@/lib/api';
import { Doctor, DoctorRequest, DoctorSchedule, Specialty } from '@/types/doctor';
import { getDoctorAvatarUrl } from '@/lib/doctorAvatar';

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

interface DoctorFormProps {
  specialties: Specialty[];
  // Present -> editing an existing doctor (shows photo upload). Absent -> creating a new one.
  initialData?: Doctor;
  // photoFile is only ever set in create mode - a staged photo the caller should upload
  // once the new doctor has an ID (there's nothing to attach it to beforehand).
  onSubmit: (payload: DoctorRequest, photoFile?: File) => Promise<void> | void;
  onCancel: () => void;
  saving: boolean;
  submitLabel: string;
}

export default function DoctorForm({ specialties, initialData, onSubmit, onCancel, saving, submitLabel }: DoctorFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [phone, setPhone] = useState(initialData?.phone ?? '+855 12 ');
  const [licenseNumber, setLicenseNumber] = useState(initialData?.licenseNumber ?? 'MD-KH-2026-');
  const [bio, setBio] = useState(initialData?.bio ?? '');
  const [experienceYears, setExperienceYears] = useState(initialData?.experienceYears ?? 5);
  const [consultationFee, setConsultationFee] = useState(initialData?.consultationFee ?? 25);
  const [address, setAddress] = useState(initialData?.address ?? 'Room 101, Building A');
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<number[]>(
    initialData?.specialties?.map((s) => s.id) ?? (specialties.length > 0 ? [specialties[0].id] : [])
  );
  const [schedules, setSchedules] = useState<DoctorSchedule[]>(
    (initialData?.schedules ?? []).map((s) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      isAvailable: s.isAvailable,
    }))
  );

  // Profile photo (edit mode only - a new doctor has no ID to attach an uploaded photo to yet)
  const [profileImage, setProfileImage] = useState<string | undefined>(initialData?.profileImage);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Create mode: the file is only staged here and handed to the parent on submit, since it
  // can't actually be uploaded until the new doctor exists and has an ID.
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [pendingPhotoPreviewUrl, setPendingPhotoPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingPhotoFile) {
      setPendingPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingPhotoFile);
    setPendingPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingPhotoFile]);

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!initialData) {
      setPendingPhotoFile(file);
      e.target.value = '';
      return;
    }

    setUploadingPhoto(true);
    try {
      const res = await doctorApi.uploadProfileImage(initialData.id, file);
      if (res.success && res.data) setProfileImage(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!initialData) {
      setPendingPhotoFile(null);
      return;
    }
    setUploadingPhoto(true);
    try {
      await doctorApi.deleteProfileImage(initialData.id);
      setProfileImage(undefined);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSpecialtyIds.length === 0) {
      alert('Please select at least one specialty');
      return;
    }

    const payload: DoctorRequest = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      licenseNumber: licenseNumber.trim(),
      bio: bio.trim(),
      experienceYears: Number(experienceYears),
      consultationFee: Number(consultationFee),
      address: address.trim() || undefined,
      isActive,
      specialtyIds: selectedSpecialtyIds,
      schedules,
    };

    await onSubmit(payload, pendingPhotoFile ?? undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      {/* Profile Photo Row - edit mode only */}
      {initialData && (
        <div className="flex items-center gap-4 mb-5 pb-4 border-b border-slate-100">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#6D28D9] overflow-hidden shrink-0 shadow-2xs">
              <img
                src={getDoctorAvatarUrl(name || 'Doctor', initialData.id, profileImage)}
                alt="Doctor"
                className="w-full h-full object-cover object-top"
              />
            </div>
            {uploadingPhoto && (
              <div className="absolute inset-0 rounded-2xl bg-white/70 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-[#6D28D9]" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#f5f3ff] text-[#6D28D9] hover:bg-[#ede9fe] text-xs font-bold border border-[#ddd6fe] transition-colors cursor-pointer">
              <Camera className="w-3.5 h-3.5" />
              <span>{profileImage ? 'Change Photo' : 'Upload Custom Photo'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoSelected}
              />
            </label>
            {profileImage && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={uploadingPhoto}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      )}

      {!initialData && (
        <div className="flex items-center gap-4 mb-5 pb-4 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#6D28D9] overflow-hidden shrink-0 shadow-2xs">
            {pendingPhotoPreviewUrl ? (
              <img src={pendingPhotoPreviewUrl} alt="Selected doctor photo" className="w-full h-full object-cover object-top" />
            ) : (
              <UserIcon className="w-7 h-7" />
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#f5f3ff] text-[#6D28D9] hover:bg-[#ede9fe] text-xs font-bold border border-[#ddd6fe] transition-colors cursor-pointer">
              <Camera className="w-3.5 h-3.5" />
              <span>{pendingPhotoFile ? 'Change Photo' : 'Upload Photo'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoSelected}
              />
            </label>
            {pendingPhotoFile && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2-Column Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-slate-700 mb-1 text-sm">Doctor Full Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Dr. Jane Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9]"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1 text-sm">Doctor Email *</label>
          <input
            type="email"
            required
            placeholder="doctor@hospital.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9]"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1 text-sm">License Number *</label>
          <input
            type="text"
            required
            placeholder="MD-KH-2026-001"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9]"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1 text-sm">Contact Phone</label>
          <input
            type="tel"
            placeholder="+855 12 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9]"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1 text-sm">Experience (Years) *</label>
          <input
            type="number"
            required
            min={0}
            value={experienceYears}
            onChange={(e) => setExperienceYears(Number(e.target.value))}
            className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9]"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1 text-sm">Consultation Fee ($ USD) *</label>
          <input
            type="number"
            step="0.01"
            required
            min={0}
            value={consultationFee}
            onChange={(e) => setConsultationFee(Number(e.target.value))}
            className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9]"
          />
        </div>
      </div>

      <div>
        <label className="block font-bold text-slate-700 mb-1 text-sm">Clinic Room / Hospital Suite</label>
        <input
          type="text"
          placeholder="Room 205, Building A"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9]"
        />
      </div>

      {/* Specialties Multi-Select */}
      <div>
        <label className="block font-bold text-slate-700 mb-1.5 text-sm">
          Assigned Specialties (Select one or more) *
        </label>
        <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
          {specialties.map((spec) => {
            const isSelected = selectedSpecialtyIds.includes(spec.id);
            return (
              <button
                key={spec.id}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    setSelectedSpecialtyIds(selectedSpecialtyIds.filter((id) => id !== spec.id));
                  } else {
                    setSelectedSpecialtyIds([...selectedSpecialtyIds, spec.id]);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#6D28D9] text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {spec.name} {isSelected && '✓'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block font-bold text-slate-700 mb-1 text-sm">Doctor Bio & Qualifications</label>
        <textarea
          rows={2}
          placeholder="Describe doctor background, focus area, and clinical qualifications..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9] resize-none"
        />
      </div>

      {/* Weekly Consultation Hours */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block font-bold text-slate-700 text-sm">Weekly Consultation Hours</label>
          <button
            type="button"
            onClick={() =>
              setSchedules([
                ...schedules,
                { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '12:00', isAvailable: true },
              ])
            }
            className="text-xs font-bold text-[#6D28D9] hover:underline cursor-pointer"
          >
            + Add Time Block
          </button>
        </div>
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {schedules.map((sch, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 text-sm"
            >
              <div className="relative flex-1">
                <select
                  value={sch.dayOfWeek}
                  onChange={(e) => {
                    const updated = [...schedules];
                    updated[idx] = { ...updated[idx], dayOfWeek: e.target.value };
                    setSchedules(updated);
                  }}
                  className="w-full appearance-none pr-8 p-2 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9] cursor-pointer"
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <input
                type="time"
                value={sch.startTime}
                onChange={(e) => {
                  const updated = [...schedules];
                  updated[idx] = { ...updated[idx], startTime: e.target.value };
                  setSchedules(updated);
                }}
                className="p-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9]"
              />
              <span className="text-slate-400">-</span>
              <input
                type="time"
                value={sch.endTime}
                onChange={(e) => {
                  const updated = [...schedules];
                  updated[idx] = { ...updated[idx], endTime: e.target.value };
                  setSchedules(updated);
                }}
                className="p-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9]"
              />
              <button
                type="button"
                onClick={() => setSchedules(schedules.filter((_, i) => i !== idx))}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {schedules.length === 0 && (
            <p className="text-xs text-slate-400 py-1">No working hours added yet.</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input
          type="checkbox"
          id="isActiveDoctor"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-4 h-4 accent-[#6D28D9] rounded border-slate-300 cursor-pointer"
        />
        <label htmlFor="isActiveDoctor" className="font-semibold text-slate-700 text-sm">
          Active Physician (Accepting Patient Appointments)
        </label>
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#5b21b6] text-white font-bold text-sm shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
