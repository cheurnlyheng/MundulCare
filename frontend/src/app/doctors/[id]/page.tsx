'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Award,
  MapPin,
  Mail,
  Phone,
  Clock,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar as CalendarIcon,
  Zap,
  Check,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { doctorApi, appointmentApi } from '@/lib/api';
import { Doctor } from '@/types/doctor';
import { BookAppointmentRequest } from '@/types/appointment';
import { useAuth } from '@/context/AuthContext';
import { getDoctorAvatarUrl } from '@/lib/doctorAvatar';

// Standard daytime 30-min slots starting strictly at 09:00
const STANDARD_TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
];

// Off-hours / emergency slots for early mornings and evenings
const EMERGENCY_TIME_SLOTS = [
  '07:30', '08:00', '08:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00',
];

function add30Minutes(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return '09:30';
  const totalMinutes = hours * 60 + minutes + 30;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
}

export default function DoctorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Form State
  const [appointmentDate, setAppointmentDate] = useState('');
  const [slotType, setSlotType] = useState<'standard' | 'emergency' | 'custom'>('standard');
  const [selectedSlot, setSelectedSlot] = useState<string>('09:00');
  const [customTime, setCustomTime] = useState<string>('18:00');
  const [reason, setReason] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    // Set default tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setAppointmentDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await doctorApi.getById(Number(resolvedParams.id));
        if (res.success && res.data) {
          setDoctor(res.data);
        } else {
          setError('Doctor profile not found');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error loading physician profile');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [resolvedParams.id]);

  const activeSlot = slotType === 'custom' ? customTime : selectedSlot;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/login?redirect=/doctors/${resolvedParams.id}`);
      return;
    }
    if (!doctor) return;

    setSubmitting(true);
    setError(null);

    const startTime = activeSlot;
    const endTime = add30Minutes(activeSlot);

    const payload: BookAppointmentRequest = {
      doctorId: doctor.id,
      appointmentDate,
      startTime,
      endTime,
      reason: reason.trim(),
      patientPhone: patientPhone.trim() || undefined,
    };

    try {
      const response = await appointmentApi.book(payload);
      if (response.success) {
        setBookingSuccess(true);
      } else {
        setError(response.message || 'Booking submission failed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit appointment.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Quick preset dates
  const setQuickDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setAppointmentDate(d.toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#aa5588] mb-2" />
        </div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col">
        <Navbar />
        <div className="max-w-2xl mx-auto py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Physician Unavailable</h2>
          <p className="text-sm text-slate-500 mb-6">{error || 'This doctor profile is currently unavailable.'}</p>
          <Link
            href="/doctors"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#aa5588] text-white font-semibold text-sm shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Directory</span>
          </Link>
        </div>
      </div>
    );
  }

  const avatarUrl = getDoctorAvatarUrl(doctor.name, doctor.id, doctor.profileImage);

  // Format readable selected date
  const readableDate = appointmentDate
    ? new Date(appointmentDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col selection:bg-[#aa5588] selection:text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/doctors"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#aa5588] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Doctors Directory</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Doctor Profile Card */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
              {/* Doctor Header */}
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <div className="w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-xs">
                  <img
                    src={avatarUrl}
                    alt={doctor.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {doctor.name}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#fbf5f8] text-[#aa5588] border border-[#edd5e3]">
                      License: {doctor.licenseNumber}
                    </span>
                  </div>

                  {/* Specialties: Clean without background, styled in emerald-700 */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2 text-sm font-semibold text-emerald-700">
                    {doctor.specialties?.map((spec, idx) => (
                      <React.Fragment key={spec.id}>
                        {idx > 0 && <span className="text-slate-300 font-normal">•</span>}
                        <span>{spec.name}</span>
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-xs text-slate-400 font-medium">Standard Consultation Fee:</span>
                    <span className="text-xl font-extrabold text-[#aa5588] font-tabular">
                      ${doctor.consultationFee.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats & Contact Grid: Clean colored icons without background boxes, grey location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 mt-5 border-t border-slate-100 text-sm">
                {/* Column 1: Experience & Doctor's Contact */}
                <div className="space-y-3">
                  <div>
                    <span className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                      <Award className="w-4 h-4 text-amber-500 shrink-0" />
                      Clinical Experience
                    </span>
                    <div className="font-bold text-slate-800 text-sm mt-0.5 font-tabular pl-6">
                      {doctor.experienceYears} Years
                    </div>
                  </div>

                  <div>
                    <span className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                      <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                      Doctor&apos;s Contact
                    </span>
                    <div className="font-semibold text-slate-700 text-sm mt-0.5 break-all pl-6">
                      {doctor.email}
                    </div>
                  </div>
                </div>

                {/* Column 2: Clinic Room & Phone */}
                <div className="space-y-3">
                  <div>
                    <span className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      Clinic Room
                    </span>
                    <div className="font-bold text-slate-800 text-sm mt-0.5 pl-6">
                      {doctor.address || 'Consultation Suite, Building A'}
                    </div>
                  </div>

                  {doctor.phone && (
                    <div>
                      <span className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                        <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                        Phone Extension
                      </span>
                      <div className="font-semibold text-slate-700 text-sm mt-0.5 font-tabular pl-6">
                        {doctor.phone}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio & Qualifications */}
              {doctor.bio && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Professional Background & Clinical Scope
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {doctor.bio}
                  </p>
                </div>
              )}

              {/* Weekly Consultation Schedules */}
              {doctor.schedules && doctor.schedules.length > 0 && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                    Weekly Consultation Hours
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {doctor.schedules.map((sch) => (
                      <div
                        key={sch.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
                      >
                        <span className="font-bold text-slate-800 block text-xs">
                          {sch.dayOfWeek}
                        </span>
                        <span className="text-slate-600 text-xs font-tabular mt-0.5 block">
                          {sch.startTime} - {sch.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Appointment Booking Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs sticky top-24">
              <div className="border-b border-slate-100 pb-4 mb-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fbf5f8] border border-[#edd5e3] text-[#aa5588] text-xs font-semibold mb-2">
                  <Clock className="w-3.5 h-3.5 text-[#aa5588]" />
                  <span>30-Minute Consultation</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Schedule an Appointment
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select your preferred consultation date and available time slot.
                </p>
              </div>

              {bookingSuccess ? (
                <div className="py-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Appointment Requested!
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Your consultation request for <strong>{readableDate}</strong> at{' '}
                    <strong>{activeSlot}</strong> has been submitted. Our hospital administration will review and confirm your slot promptly.
                  </p>
                  <div className="pt-2 flex flex-col gap-2">
                    <Link
                      href="/my-appointments"
                      className="w-full py-2.5 rounded-xl bg-[#aa5588] hover:bg-[#924472] text-white font-semibold text-sm transition-colors block text-center"
                    >
                      View My Appointments
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setBookingSuccess(false);
                        setReason('');
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Book another consultation
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4 text-sm">
                  {/* Styled Consultation Date Calendar Picker */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                      Consultation Date *
                    </label>

                    {/* Quick Date Presets */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <button
                        type="button"
                        onClick={() => setQuickDate(0)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#fbf5f8] hover:text-[#aa5588] text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickDate(1)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#fbf5f8] hover:text-[#aa5588] text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Tomorrow
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickDate(2)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#fbf5f8] hover:text-[#aa5588] text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        In 2 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickDate(3)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#fbf5f8] hover:text-[#aa5588] text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        In 3 Days
                      </button>
                    </div>

                    {/* Styled Calendar Input */}
                    <div className="relative">
                      <CalendarIcon className="w-4 h-4 text-[#aa5588] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#aa5588]/20 focus:border-[#aa5588] transition-all cursor-pointer shadow-2xs"
                      />
                    </div>
                    {readableDate && (
                      <span className="block text-xs font-medium text-slate-500 mt-1">
                        Scheduled for: <strong className="text-slate-800">{readableDate}</strong>
                      </span>
                    )}
                  </div>

                  {/* Slot Selection Tabs: Standard vs Off-Hours/Emergency */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block font-bold text-slate-700 text-xs">
                        Select Consultation Slot *
                      </label>
                      <div className="flex gap-1 p-0.5 rounded-lg bg-slate-100 text-xs">
                        <button
                          type="button"
                          onClick={() => setSlotType('standard')}
                          className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                            slotType === 'standard'
                              ? 'bg-white text-[#aa5588] shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Daytime (09:00+)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSlotType('emergency')}
                          className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                            slotType === 'emergency'
                              ? 'bg-amber-50 text-amber-700 shadow-2xs border border-amber-200'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <Zap className="w-3 h-3 text-amber-600" />
                          <span>Off-Hours / Emergency</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSlotType('custom')}
                          className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                            slotType === 'custom'
                              ? 'bg-white text-[#aa5588] shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Custom
                        </button>
                      </div>
                    </div>

                    {/* Standard Slots (Starts strictly at 09:00 AM) */}
                    {slotType === 'standard' && (
                      <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                        {STANDARD_TIME_SLOTS.map((slot) => {
                          const isSelected = selectedSlot === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`py-1.5 px-2 rounded-lg text-xs font-semibold font-tabular transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#aa5588] text-white shadow-2xs'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-[#fbf5f8] hover:text-[#aa5588]'
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Emergency / Off-Hours Slots */}
                    {slotType === 'emergency' && (
                      <div className="space-y-2">
                        <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                          <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span>
                            Off-hours & emergency slots are reviewed directly by the hospital on-call administrator.
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                          {EMERGENCY_TIME_SLOTS.map((slot) => {
                            const isSelected = selectedSlot === slot;
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setSelectedSlot(slot)}
                                className={`py-1.5 px-2 rounded-lg text-xs font-semibold font-tabular transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-600 text-white shadow-2xs'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-50 hover:text-amber-800'
                                }`}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Custom Time Option */}
                    {slotType === 'custom' && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <label className="block text-xs font-medium text-slate-600">
                          Enter Specific Consultation Start Time:
                        </label>
                        <input
                          type="time"
                          value={customTime}
                          onChange={(e) => setCustomTime(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white font-tabular font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#aa5588]/20 focus:border-[#aa5588]"
                        />
                      </div>
                    )}

                    <span className="block text-xs text-slate-400 mt-1.5">
                      Consultation window: <strong className="text-slate-800 font-tabular">{activeSlot} - {add30Minutes(activeSlot)}</strong>
                    </span>
                  </div>

                  {/* Contact Phone */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                      Patient Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        placeholder="+855 12 345 678"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#aa5588]/20 focus:border-[#aa5588]"
                      />
                    </div>
                  </div>

                  {/* Reason for Visit */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                      Reason for Consultation / Symptoms *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Briefly describe your symptoms or medical concern..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#aa5588]/20 focus:border-[#aa5588] resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 rounded-xl bg-[#aa5588] hover:bg-[#924472] text-white font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      `Request Consultation ($${doctor.consultationFee.toFixed(2)})`
                    )}
                  </button>

                  <p className="text-xs text-slate-400 text-center leading-relaxed">
                    By submitting, you agree to MundulCare&apos;s clinical consultation policies. No payment is required until confirmation.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
