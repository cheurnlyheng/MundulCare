'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  Brain,
  Baby,
  Smile,
  Eye,
  ArrowRight,
  Activity,
  PhoneCall,
  Stethoscope,
  Mail,
  Phone,
  Globe,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import AiSymptomAssistant from '@/components/AiSymptomAssistant';
import DoctorCard from '@/components/DoctorCard';
import { specialtyApi, doctorApi } from '@/lib/api';
import { Specialty, Doctor } from '@/types/doctor';
import { HOSPITAL_IMAGES } from '@/lib/doctorAvatar';

// Dynamic icon mapper for specialties
function getSpecialtyIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('cardio') || lower.includes('heart')) return Heart;
  if (lower.includes('neuro') || lower.includes('brain')) return Brain;
  if (lower.includes('pediatric') || lower.includes('child') || lower.includes('baby')) return Baby;
  if (lower.includes('dental') || lower.includes('tooth') || lower.includes('teeth')) return Smile;
  if (lower.includes('eye') || lower.includes('ophthalm')) return Eye;
  if (lower.includes('ortho') || lower.includes('bone') || lower.includes('joint')) return Activity;
  return Stethoscope;
}

// Placeholder team roster - swap names, roles, and images once real staff photos are ready
const TEAM_MEMBERS = [
  { name: 'Mr. Cheurn Lyheng', role: 'Backend Dev', image: '/team-image/me2.png' },
  { name: 'Mr. Chhan Philip', role: 'Frontend Dev', image: '/team-image/3.png' },
  { name: 'Mr. Hong Mengyu', role: 'Software Tester', image: '/team-image/2.png' },
];

export default function HomePage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [specRes, docRes] = await Promise.all([
          specialtyApi.getAll(),
          doctorApi.getAll(),
        ]);
        if (specRes.success && specRes.data) {
          setSpecialties(specRes.data);
        }
        if (docRes.success && docRes.data) {
          setDoctors(docRes.data);
        }
      } catch (err) {
        console.error('Failed to load home data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col selection:bg-[#aa5588] selection:text-white">
      <Navbar />

      {/* 1. Hero Section - Tall full-bleed banner. The text block below is sticky, so it stays
          in view (pinned under the navbar) while the photo scrolls behind it. Don't add
          overflow-hidden to this section: it would stop the sticky text from pinning. */}
      <section className="relative w-full h-[160svh] sm:h-[175svh]">
        <img
          src="/banner/photo_2026-09-02_21-04-07.jpg"
          alt="MundulCare Hospital Building"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-[80%_top] md:object-[75%_top] lg:object-[85%_top]"
        />
        {/* Scrim so the overlaid text stays readable regardless of what's behind it */}
        <div className="absolute inset-0 bg-linear-to-r from-slate-950/55 via-slate-950/30 to-slate-950/5" />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/30 via-transparent to-transparent" />

        {/* Pinned just below the 4rem sticky navbar. On very short screens (phones held
            sideways) it falls back to normal flow so the text can't get stuck cut off. */}
        <div className="sticky top-16 z-10 h-[calc(100svh-4rem)] min-h-130 [@media(max-height:36.5rem)]:static max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <div className="max-w-xl space-y-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              Modern Medical Care, <br />
              <span className="text-[#e9a9c8]">Specialists Matched Instantly.</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-200 max-w-xl leading-relaxed">
              Connect directly with verified hospital physicians, view transparent consultation fees, and schedule visits seamlessly. Powered by smart AI clinical triaging.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/doctors"
                className="px-5 py-3 rounded-xl bg-[#aa5588] hover:bg-[#924472] text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Find a Specialist</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#ai-assistant"
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm font-semibold text-xs sm:text-sm transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <span>AI Symptom Matcher</span>
              </a>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20">
              <div>
                <div className="text-xl font-bold text-white font-tabular">50+</div>
                <div className="text-xs text-slate-300 mt-0.5">Hospital Specialists</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white font-tabular">24/7</div>
                <div className="text-xs text-slate-300 mt-0.5">Emergency Triage</div>
              </div>
              <div>
                <div className="text-xl font-bold text-[#e9a9c8] font-tabular">99.4%</div>
                <div className="text-xs text-slate-300 mt-0.5">Patient Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Smart Clinical Triaging (AI Symptom Matcher) */}
      <AiSymptomAssistant />

      {/* 3. Verified Specialists (Featured Doctors) */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full border-t border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <span className="text-xs font-bold text-[#aa5588] uppercase tracking-wider">
              Verified Specialists
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Featured Hospital Physicians
            </h2>
          </div>
          <Link
            href="/doctors"
            className="text-xs sm:text-sm font-semibold text-[#aa5588] hover:text-[#924472] hover:underline inline-flex items-center gap-1 transition-colors"
          >
            <span>Browse All Doctors</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-white border border-slate-200/70 animate-pulse"
              />
            ))}
          </div>
        ) : doctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.slice(0, 6).map((doc) => (
              <DoctorCard key={doc.id} doctor={doc} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
            No doctors found. Please ensure backend is running.
          </div>
        )}
      </section>

      {/* 4. Departments (Explore by Medical Specialty) */}
      <section className="py-14 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
            <div>
              <span className="text-xs font-bold text-[#aa5588] uppercase tracking-wider">
                Departments
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Explore by Medical Specialty
              </h2>
            </div>
            <Link
              href="/doctors"
              className="text-xs sm:text-sm font-semibold text-[#aa5588] hover:text-[#924472] hover:underline inline-flex items-center gap-1 transition-colors"
            >
              <span>View All Specialists</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {specialties.map((spec) => {
              const IconComponent = getSpecialtyIcon(spec.name);
              const doctorCount = doctors.filter((d) =>
                d.specialties?.some((s) => s.id === spec.id)
              ).length;

              return (
                <Link
                  key={spec.id}
                  href={`/doctors?specialtyId=${spec.id}`}
                  className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-[#aa5588]/40 hover:bg-[#fbf5f8]/50 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-[#aa5588] flex items-center justify-center mb-3 shadow-2xs group-hover:scale-105 transition-transform">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#aa5588] transition-colors">
                      {spec.name}
                    </h3>
                    {spec.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {spec.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{doctorCount} {doctorCount === 1 ? 'specialist' : 'specialists'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#aa5588] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Clinical Standards (Hospital Facilities) */}
      <section className="py-14 bg-slate-50/60 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-[#aa5588] uppercase tracking-wider">
              Clinical Standards
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              State-of-the-Art Hospital Facilities
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Designed to provide high-standard clinical care, privacy, and seamless consultation workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ">
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs group">
              <img
                src={HOSPITAL_IMAGES.heroLobby}
                alt="Reception & Check-In"
                className="w-full h-48 object-cover group-hover:scale-102 transition-transform duration-200"
              />
              <div className="p-5">
                <h3 className="font-bold text-slate-900 text-sm">Welcoming Reception & Check-In</h3>
                <p className="text-md text-slate-500 mt-1 leading-relaxed">
                  A dedicated front-desk team greets every patient, verifies appointment details, and guides you to the right department with minimal wait time.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs group">
              <img
                src={HOSPITAL_IMAGES.diagnosticsLab}
                alt="Diagnostic Labs"
                className="w-full h-48 object-cover group-hover:scale-102 transition-transform duration-200"
              />
              <div className="p-5">
                <h3 className="font-bold text-slate-900 text-sm">Rapid Diagnostics Lab</h3>
                <p className="text-md text-slate-500 mt-1 leading-relaxed">
                  On-site clinical diagnostics ensuring timely evaluations and treatment decisions.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs group ">
              <img
                src={HOSPITAL_IMAGES.medicalCareCenter}
                alt="Continuous Care"
                className="w-full h-48 object-cover group-hover:scale-102 transition-transform duration-200"
              />
              <div className="p-5">
                <h3 className="font-bold text-slate-900 text-sm">24/7 Coordinated Care</h3>
                <p className="text-md text-slate-500 mt-1 leading-relaxed">
                  Seamless appointment scheduling, email confirmation receipts, and continuous specialist access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Meet The Team */}
      <section className="py-14 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <span className="text-xs font-bold text-[#aa5588] uppercase tracking-wider">Our People</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Meet The Team
                <br />
                Developers
              </h2>
            </div>
            
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.name}>
                <div className="rounded-2xl overflow-hidden bg-slate-100 aspect-square">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="mt-4 font-extrabold text-slate-900 text-sm uppercase tracking-wide">
                  {member.name}
                </h3>
                <p className="text-[#aa5588] text-xs font-semibold mt-0.5">{member.role}</p>
                <div className="flex items-center gap-3 mt-2.5 text-slate-400">
                  <Mail className="w-4 h-4 hover:text-[#aa5588] transition-colors cursor-pointer" />
                  <Phone className="w-4 h-4 hover:text-[#aa5588] transition-colors cursor-pointer" />
                  <Globe className="w-4 h-4 hover:text-[#aa5588] transition-colors cursor-pointer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Minimalist Footer */}
      <footer className="bg-white pt-10 pb-8 mt-auto border-t border-slate-200/80">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-md text-slate-500">
      
      {/* Left */}
      <div className="flex items-center gap-2.5">
        <img
          src="/logo.png"
          alt="Mundul Care Logo"
          className="w-5 h-5 object-contain"
        />
        <span className="font-bold text-slate-900">Mundul Care</span>
        <span>•</span>
        <span>Appointment & Specialist Management</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 text-[#aa5588] font-semibold">
        <PhoneCall className="w-4 h-4" />
        <span>Emergency Hotline: +855 12 999 888</span>
      </div>

    </div>
  </div>
</footer>
    </div>
  );
}
