'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Mail, Loader2, AlertCircle, CheckCircle2, RotateCcw, Clock } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const OTP_EXPIRY_SECONDS = 5 * 60;
const RESEND_COOLDOWN_SECONDS = 60;

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const { setAuth } = useAuth();

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  const expiryKey = (addr: string) => `otp_expiry_${addr}`;
  const cooldownKey = (addr: string) => `otp_resend_cooldown_${addr}`;

  useEffect(() => {
    if (!email) return;
    const now = Date.now();

    const savedExpiry = localStorage.getItem(expiryKey(email));
    if (savedExpiry) {
      setExpiresIn(Math.max(0, Math.ceil((Number(savedExpiry) - now) / 1000)));
    } else {
      const newExpiry = now + OTP_EXPIRY_SECONDS * 1000;
      localStorage.setItem(expiryKey(email), newExpiry.toString());
      setExpiresIn(OTP_EXPIRY_SECONDS);
    }

    const savedCooldown = localStorage.getItem(cooldownKey(email));
    if (savedCooldown) {
      setResendCooldown(Math.max(0, Math.ceil((Number(savedCooldown) - now) / 1000)));
    } else {
      const newCooldown = now + RESEND_COOLDOWN_SECONDS * 1000;
      localStorage.setItem(cooldownKey(email), newCooldown.toString());
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    }
  }, [email]);

  useEffect(() => {
    if (!email) return;

    const intervalId = setInterval(() => {
      const now = Date.now();

      const savedExpiry = localStorage.getItem(expiryKey(email));
      if (savedExpiry) {
        setExpiresIn(Math.max(0, Math.ceil((Number(savedExpiry) - now) / 1000)));
      }

      const savedCooldown = localStorage.getItem(cooldownKey(email));
      if (savedCooldown) {
        setResendCooldown(Math.max(0, Math.ceil((Number(savedCooldown) - now) / 1000)));
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await authApi.verifyEmail({
        email,
        otp: otp.trim(),
        type: 'EMAIL_VERIFICATION',
      });

      if (response.success && response.data) {
        localStorage.removeItem(expiryKey(email));
        localStorage.removeItem(cooldownKey(email));
        setAuth(response.data);
        setSuccess('Account verified successfully! Redirecting...');
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        setError(response.message || 'Verification failed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid or expired verification code.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending || !email) return;

    setError(null);
    setSuccess(null);
    setResending(true);

    try {
      const response = await authApi.resendOtp({
        email,
        type: 'EMAIL_VERIFICATION',
      });

      if (response.success) {
        setSuccess('A new 6-digit code has been sent to your email inbox.');
        setOtp('');
        const now = Date.now();
        const newExpiry = now + OTP_EXPIRY_SECONDS * 1000;
        const newCooldown = now + RESEND_COOLDOWN_SECONDS * 1000;
        localStorage.setItem(expiryKey(email), newExpiry.toString());
        localStorage.setItem(cooldownKey(email), newCooldown.toString());
        setExpiresIn(OTP_EXPIRY_SECONDS);
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        setError(response.message || 'Failed to resend code');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to resend verification code.';
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-[#fbf5f8] text-[#aa5588] flex items-center justify-center mb-3">
          <KeyRound className="w-5 h-5" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Verify Your Email</h1>
        <p className="text-xs text-slate-500 mt-1">
          Enter the 6-digit code sent to your email inbox
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-5 p-3.5 rounded-xl bg-[#fbf5f8] border border-[#edd5e3] flex items-start gap-2.5 text-xs text-[#aa5588]">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-[#aa5588]/20 focus:border-[#aa5588] transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              6-Digit Code
            </label>

            <div className="flex items-center gap-1.5 text-xs">
              {expiresIn > 0 ? (
                <span className="inline-flex items-center gap-1 text-slate-500 font-tabular font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#aa5588]" />
                  Expires in <strong className="text-[#aa5588] font-tabular">{formatTime(expiresIn)}</strong>
                </span>
              ) : (
                <span className="text-amber-600 font-semibold inline-flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Code Expired
                </span>
              )}
            </div>
          </div>

          <input
            type="text"
            required
            maxLength={6}
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full text-center tracking-[0.4em] font-tabular font-bold text-xl py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#aa5588]/20 focus:border-[#aa5588] transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6 || expiresIn === 0}
          className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#aa5588] hover:bg-[#924472] text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying code...</span>
            </>
          ) : (
            'Verify & Sign In'
          )}
        </button>
      </form>

      {/* Resend Code Section */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500">Didn&apos;t receive code?</span>
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={resendCooldown > 0 || resending}
          className="font-semibold text-[#aa5588] hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1.5 cursor-pointer"
        >
          {resending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Sending...</span>
            </>
          ) : resendCooldown > 0 ? (
            <>
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="font-tabular">Resend in {resendCooldown}s</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resend Code</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-4 text-center text-xs text-slate-400">
        Already verified?{' '}
        <Link href="/login" className="font-semibold text-[#aa5588] hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-slate-400 text-xs">Loading verification form...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
