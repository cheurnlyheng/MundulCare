'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, Loader2, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import { settingsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function AdminSettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showEnableConfirm, setShowEnableConfirm] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await settingsApi.getMaintenanceStatus();
      if (res.success && res.data) {
        setEnabled(res.data.enabled);
        setMessage(res.data.message);
      }
    } catch (err) {
      console.error('Failed to load maintenance status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.role !== 'ADMIN') {
        router.push('/login?redirect=/admin/settings');
      } else {
        fetchStatus();
      }
    }
  }, [isAuthenticated, user, authLoading]);

  // Turning maintenance mode ON blocks every patient/visitor from using the site, so it
  // gets a confirmation step. Turning it back OFF is the "restore service" action and
  // doesn't need one.
  const handleToggleClick = () => {
    if (!enabled) {
      setShowEnableConfirm(true);
    } else {
      handleSave(false);
    }
  };

  const confirmEnable = () => {
    setShowEnableConfirm(false);
    handleSave(true);
  };

  const handleSave = async (nextEnabled: boolean) => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await settingsApi.updateMaintenanceMode(nextEnabled, message);
      if (res.success && res.data) {
        setEnabled(res.data.enabled);
        setSaveMessage({
          type: 'success',
          text: nextEnabled ? 'Hospital maintenance mode is now ACTIVE.' : 'Hospital maintenance mode is now DEACTIVATED.',
        });
      }
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update maintenance mode.' });
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
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Hospital-wide operational controls and maintenance mode.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs max-w-2xl">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                <Wrench className="w-6 h-6 text-[#6D28D9]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Hospital Maintenance Mode</h2>
                <p className="text-sm text-slate-500 mt-0.5 max-w-md leading-relaxed">
                  When enabled, visitors and patients see a clean maintenance screen instead of booking pages. Hospital administrators retain full access to manage records.
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={handleToggleClick}
              disabled={saving}
              className={`relative shrink-0 w-12 h-7 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                enabled ? 'bg-amber-500' : 'bg-slate-200'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {saveMessage && (
            <div
              className={`mb-4 p-3 rounded-xl text-sm flex items-start gap-2 ${
                saveMessage.type === 'success'
                  ? 'bg-purple-50 border border-purple-200/80 text-[#6D28D9]'
                  : 'bg-rose-50 border border-rose-200/80 text-rose-700'
              }`}
            >
              {saveMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{saveMessage.text}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1.5 text-sm">Public Notice Message</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="We are currently performing scheduled maintenance to improve our clinical systems. Please check back shortly."
              className="w-full p-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9] resize-none"
            />
            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={() => handleSave(enabled)}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#5b21b6] text-white font-bold text-sm shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Notice'}
              </button>
            </div>
          </div>
        </div>
      </main>
      </div>

      {/* Confirmation modal - enabling maintenance mode blocks every patient/visitor site-wide */}
      {showEnableConfirm && (
        <div
          onClick={() => setShowEnableConfirm(false)}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in-50 zoom-in-95"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Enable Maintenance Mode?</h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-5">
              This will immediately block all patients and visitors from booking or viewing appointment pages, showing them a maintenance screen instead. Only hospital administrators will retain access. You can turn it back off at any time.
            </p>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowEnableConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmEnable}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Enabling...' : 'Confirm Enable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
