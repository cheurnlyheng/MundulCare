'use client';

import React, { useEffect, useRef } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

declare global {
  interface Window {
    google?: any;
  }
}

// Renders Google's own "Sign in with Google" button (Google Identity Services).
// Silently renders nothing if NEXT_PUBLIC_GOOGLE_CLIENT_ID isn't configured yet.
export default function GoogleSignInButton() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { setAuth } = useAuth();
  const router = useRouter();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const renderButton = () => {
    if (!clientId || !window.google?.accounts?.id || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: { credential: string }) => {
        try {
          const res = await authApi.googleLogin({ idToken: response.credential });
          if (res.success && res.data) {
            setAuth(res.data);
            router.push(res.data.role === 'ADMIN' ? '/admin' : '/');
          }
        } catch (err) {
          console.error('Google sign-in failed', err);
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      width: 370,
      text: 'continue_with',
    });
  };

  // Covers client-side navigation between /login and /register where the script
  // was already loaded once and next/script's onLoad won't fire again
  useEffect(() => {
    if (window.google?.accounts?.id) {
      renderButton();
    }
  }, []);

  if (!clientId) return null;

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={renderButton} />
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>
      <div className="flex justify-center">
        <div ref={buttonRef} />
      </div>
    </>
  );
}
