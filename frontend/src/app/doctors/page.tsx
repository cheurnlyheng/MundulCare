'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Loader2, ArrowUpDown, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import DoctorCard from '@/components/DoctorCard';
import CustomSelect from '@/components/CustomSelect';
import { specialtyApi, doctorApi } from '@/lib/api';
import { Specialty, Doctor } from '@/types/doctor';

const SORT_OPTIONS = [
  { value: 'default', label: 'Default Order' },
  { value: 'fee-asc', label: 'Fee: Low to High' },
  { value: 'fee-desc', label: 'Fee: High to Low' },
  { value: 'exp-desc', label: 'Most Experienced' },
];

function DoctorsList() {
  const searchParams = useSearchParams();
  const initialSpecialtyId = searchParams.get('specialtyId')
    ? Number(searchParams.get('specialtyId'))
    : null;

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<number | null>(initialSpecialtyId);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('default');
  const [loading, setLoading] = useState(true);

  // Fetch Specialties
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const res = await specialtyApi.getAll();
        if (res.success && res.data) {
          setSpecialties(res.data);
        }
      } catch (err) {
        console.error('Error loading specialties', err);
      }
    };
    fetchSpecialties();
  }, []);

  // Fetch Doctors with filters
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const res = await doctorApi.getAll({
          specialtyId: selectedSpecialty || undefined,
          search: search.trim() || undefined,
        });
        if (res.success && res.data) {
          setDoctors(res.data);
        }
      } catch (err) {
        console.error('Error loading doctors', err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchDoctors();
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [selectedSpecialty, search]);

  // Client-side sorting
  const sortedDoctors = [...doctors].sort((a, b) => {
    if (sortBy === 'fee-asc') return a.consultationFee - b.consultationFee;
    if (sortBy === 'fee-desc') return b.consultationFee - a.consultationFee;
    if (sortBy === 'exp-desc') return b.experienceYears - a.experienceYears;
    return 0;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col selection:bg-[#aa5588] selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Our Medical Specialists
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse verified hospital physicians, filter by medical specialty, and book your consultation.
          </p>
        </div>

        {/* Search & Sort Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 mb-6 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search doctor by name, credentials, or symptoms..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#aa5588]/20 focus:border-[#aa5588] transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector with Custom Dropdown & Animated Chevron */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              Sort:
            </span>
            <CustomSelect
              value={sortBy}
              onChange={setSortBy}
              options={SORT_OPTIONS}
              className="w-44"
            />
          </div>
        </div>

        {/* Specialty Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedSpecialty(null)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedSpecialty === null
                ? 'bg-[#aa5588] text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-[#fbf5f8] hover:text-[#aa5588] border border-slate-200'
            }`}
          >
            All Specialties
          </button>

          {specialties.map((spec) => (
            <button
              key={spec.id}
              type="button"
              onClick={() => setSelectedSpecialty(spec.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedSpecialty === spec.id
                  ? 'bg-[#aa5588] text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-[#fbf5f8] hover:text-[#aa5588] border border-slate-200'
              }`}
            >
              {spec.name}
            </button>
          ))}
        </div>

        {/* Doctor Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#aa5588] mb-2" />
            <span className="text-sm font-medium">Loading specialists...</span>
          </div>
        ) : sortedDoctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedDoctors.map((doc) => (
              <DoctorCard key={doc.id} doctor={doc} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/90 p-8">
            <div className="w-12 h-12 rounded-full bg-[#fbf5f8] text-[#aa5588] flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No specialists match your search</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search terms or clearing the specialty filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedSpecialty(null);
                setSearch('');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-[#fbf5f8] text-[#aa5588] font-semibold text-xs border border-[#edd5e3] hover:bg-[#f6e8f1] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-slate-400 text-xs">Loading directory...</div>}>
      <DoctorsList />
    </Suspense>
  );
}
