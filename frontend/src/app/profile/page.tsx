'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Camera,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Shield,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { userApi } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUrl';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading, updateUser } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Independent Password visibility states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Photo upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/profile');
    } else if (isAuthenticated) {
      fetchFullProfile();
    }
  }, [isAuthenticated, authLoading]);

  const fetchFullProfile = async () => {
    try {
      const res = await userApi.getMyProfile();
      if (res.success && res.data) {
        setName(res.data.name || '');
        setPhone(res.data.phone || '');
      }
    } catch (err) {
      console.error('Failed to load user profile', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileMsg(null);

    try {
      const res = await userApi.updateProfile({ name: name.trim(), phone: phone.trim() || undefined });
      if (res.success && res.data) {
        updateUser({
          name: res.data.name,
          profileImage: res.data.profileImage,
        });
        setProfileMsg({ type: 'success', text: 'Profile details updated successfully.' });
      } else {
        setProfileMsg({ type: 'error', text: res.message || 'Failed to update profile' });
      }
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setUpdatingPassword(true);
    setPasswordMsg(null);

    try {
      const res = await userApi.changePassword({ currentPassword, newPassword });
      if (res.success) {
        setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg({ type: 'error', text: res.message || 'Failed to change password' });
      }
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const res = await userApi.uploadProfileImage(file);
      if (res.success && res.data) {
        updateUser({ profileImage: res.data });
        setProfileMsg({ type: 'success', text: 'Profile photo updated.' });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm('Are you sure you want to remove your profile photo?')) return;

    setUploadingPhoto(true);
    try {
      const res = await userApi.deleteProfileImage();
      if (res.success) {
        updateUser({ profileImage: undefined });
        setProfileMsg({ type: 'success', text: 'Profile photo removed.' });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#aa5588] mb-2" />
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col selection:bg-[#aa5588] selection:text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Back to Home Button */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#aa5588] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Account Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personal hospital account, contact phone, and security credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Avatar Card */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs text-center">
              <div className="relative w-28 h-28 mx-auto mb-4">
                <div className="w-28 h-28 rounded-full bg-[#fbf5f8] border-2 border-[#edd5e3] flex items-center justify-center font-bold text-3xl text-[#aa5588] overflow-hidden shadow-xs">
                  {user?.profileImage ? (
                    <img
                      src={getImageUrl(user.profileImage)}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user?.name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>

                {uploadingPhoto && (
                  <div className="absolute inset-0 rounded-full bg-white/75 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#aa5588]" />
                  </div>
                )}
              </div>

              <h2 className="font-bold text-slate-900 text-base">{user?.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{user?.email}</p>

              {/* Show role badge ONLY if ADMIN (hidden for patients) */}
              {isAdmin && (
                <div className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#f5f3ff] text-[#6D28D9] border border-[#ddd6fe]">
                  <Shield className="w-3.5 h-3.5" />
                  ADMIN
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2">
                <label className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#fbf5f8] hover:bg-[#f6e8f1] text-[#aa5588] font-semibold text-xs border border-[#edd5e3] transition-colors cursor-pointer">
                  <Camera className="w-4 h-4" />
                  <span>Upload Photo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>

                {user?.profileImage && (
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    disabled={uploadingPhoto}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold border border-transparent transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Personal Info & Password */}
          <div className="md:col-span-2 space-y-6">
            {/* Personal Details Form */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                Personal Information
              </h2>

              {profileMsg && (
                <div
                  className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
                    profileMsg.type === 'success'
                      ? 'bg-[#fbf5f8] text-[#aa5588] border border-[#edd5e3]'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {profileMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4 text-sm">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-xs">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#aa5588]/20 focus:border-[#aa5588] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-xs">Email Address (Read-only)</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 bg-slate-50 text-sm cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-xs">Contact Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="+855 12 345 678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#aa5588]/20 focus:border-[#aa5588] text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="px-5 py-2.5 rounded-xl bg-[#aa5588] hover:bg-[#924472] text-white font-bold text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {updatingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password Form */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                Security & Password
              </h2>

              {passwordMsg && (
                <div
                  className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
                    passwordMsg.type === 'success'
                      ? 'bg-[#fbf5f8] text-[#aa5588] border border-[#edd5e3]'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {passwordMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 text-sm">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-xs">Current Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#aa5588]/20 focus:border-[#aa5588] text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-xs">New Password (min 8 chars)</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#aa5588]/20 focus:border-[#aa5588] text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-xs">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#aa5588]/20 focus:border-[#aa5588] text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="px-5 py-2.5 rounded-xl bg-[#aa5588] hover:bg-[#924472] text-white font-bold text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {updatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
