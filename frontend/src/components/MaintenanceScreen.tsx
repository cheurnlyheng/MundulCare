'use client';

import React from 'react';
import { Stethoscope, Wrench, RefreshCcw } from 'lucide-react';

export default function MaintenanceScreen({ message }: { message?: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 selection:bg-[#aa5588] selection:text-white">
      <div className="max-w-md w-full text-center bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="mx-auto w-16 h-16 flex items-center justify-center mb-5">
          <img
            src="/logo.png"
            alt="Mundul Care"
            className="w-16 h-16 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo 1 [Vectorized].png';
            }}
          />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-700 text-xs font-bold uppercase tracking-wider mb-4">
          <Wrench className="w-3.5 h-3.5" />
          Scheduled Maintenance
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
          MundulCare is Briefly Offline
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          {message || "We are currently performing scheduled maintenance to enhance our hospital management systems. Please check back shortly."}
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#aa5588] hover:bg-[#924472] text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Refresh Status</span>
        </button>

        <p className="text-xs text-slate-400 mt-6 pt-4 border-t border-slate-100">
          For urgent medical emergencies, please dial your local emergency services directly.
        </p>
      </div>
    </div>
  );
}
