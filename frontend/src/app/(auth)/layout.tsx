'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

// Where the top-left back arrow points, per auth route. Pages not listed here get none.
const BACK_LINKS: Record<string, { href: string; label: string }> = {
  '/login': { href: '/', label: 'Back to Home' },
  '/register': { href: '/login', label: 'Back to Sign In' },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const backLink = BACK_LINKS[pathname];

  return (
    <div className="min-h-screen bg-[#FDF9FB] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#aa5588] selection:text-white">
      {backLink && (
        <Link
          href={backLink.href}
           className="fixed top-8 left-8 sm:top-10 sm:left-10 z-10 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#aa5588] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{backLink.label}</span>
        </Link>
      )}

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <img
            src="/logo.png"
            alt="Mundul Care"
            className="w-12 h-12 object-contain group-hover:scale-105 transition-transform shrink-0"
          />
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            Mundul <span className="text-[#aa5588]">Care</span>
          </span>
        </Link>
      </div>

      {/* Main Form Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xs rounded-2xl border border-slate-200/90">
          {children}
        </div>
      </div>

      {/* Footer copyright */}
      <div className="mt-8 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} MundulCare Hospital. All rights reserved.
      </div>
    </div>
  );
}
