import React from 'react';
import Link from 'next/link';
import { Stethoscope } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FDF9FB] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#aa5588] selection:text-white">
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
