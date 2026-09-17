import Link from 'next/link';
import { Compass, Home, Stethoscope } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col selection:bg-[#aa5588] selection:text-white">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-[#fbf5f8] border-2 border-[#edd5e3] flex items-center justify-center text-[#aa5588] shadow-xs">
            <Compass className="w-9 h-9" />
          </div>

          <p className="text-6xl sm:text-7xl font-extrabold text-slate-900 tracking-tight">404</p>
          <h1 className="mt-3 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Page Not Found
          </h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or may have been moved. Let&apos;s get you back on
            track.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#aa5588] hover:bg-[#924472] text-white font-semibold text-sm shadow-xs transition-colors"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
            <Link
              href="/doctors"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 transition-colors"
            >
              <Stethoscope className="w-4 h-4 text-[#aa5588]" />
              Browse Doctors
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
