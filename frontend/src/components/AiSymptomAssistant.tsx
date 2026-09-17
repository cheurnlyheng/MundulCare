'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, Stethoscope, CheckCircle2 } from 'lucide-react';
import { aiApi } from '@/lib/api';
import { SymptomMatchResponse } from '@/types/doctor';
import DoctorCard from '@/components/DoctorCard';

const SAMPLE_PROMPTS = [
  'Chest tightness and irregular heart palpitations',
  'Red itchy skin rash with swelling after eating seafood',
  'Severe throbbing migraine and light sensitivity',
  'Toddler high fever with persistent dry cough',
  'Sharp lower back pain and stiff knee joints',
  'Severe toothache and bleeding gums',
];

export default function AiSymptomAssistant() {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SymptomMatchResponse | null>(null);

  const handleMatch = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const query = customPrompt || symptoms;
    if (!query.trim()) return;

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const response = await aiApi.matchSymptoms({ symptoms: query.trim() });
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.message || 'Could not analyze symptoms. Please try again.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'AI assistant is momentarily unavailable.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (prompt: string) => {
    setSymptoms(prompt);
    handleMatch(undefined, prompt);
  };

  return (
    <section id="ai-assistant" className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Title & Subtitle */}
      <div className="text-center mb-8">
        <div className="relative overflow-hidden inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fbf5f8] border border-[#edd5e3] text-[#aa5588] text-xs font-semibold mb-3 shadow-2xs">
          <span className="ai-shimmer absolute inset-0" aria-hidden="true" />
          <Sparkles className="relative w-3.5 h-3.5 text-[#aa5588]" />
          <span className="relative">Smart Clinical Triaging</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Not Sure Which Doctor to See?
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto mt-2 leading-relaxed">
          Describe your symptoms in your own words. Our medical AI will analyze your description and match you with the appropriate hospital specialist.
        </p>
      </div>

      {/* Main Search Box - floating with a soft glow halo and a breathing contact shadow */}
      <div className="relative">
        <div className="ai-card-glow absolute -inset-4 rounded-4xl pointer-events-none" aria-hidden="true" />
        <div className="ai-card-shadow absolute -bottom-4 left-1/2 w-4/5 h-6 bg-slate-900/30 rounded-full blur-xl pointer-events-none" aria-hidden="true" />

        <div className="ai-card-float relative bg-white rounded-2xl border border-slate-200/90 shadow-lg p-5 sm:p-7">
        <form onSubmit={(e) => handleMatch(e)} className="space-y-4">
          <div>
            <textarea
              rows={3}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g., I have had a sharp pain in my chest when taking deep breaths and dizziness for the past 2 days..."
              className="w-full p-4 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#aa5588]/20  transition-all resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <span className="text-xs text-slate-500">
              Include when symptoms started and any related discomfort.
            </span>

            <button
              type="submit"
              disabled={loading || !symptoms.trim()}
              className="px-6 py-2.5 rounded-xl bg-[#aa5588] hover:bg-[#924472] text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing Symptoms...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Find Matching Specialists</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Common Inquiries:
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleChipClick(prompt)}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-slate-50/70 hover:bg-[#fbf5f8] hover:text-[#aa5588] border border-slate-200 hover:border-[#edd5e3] text-slate-600 text-xs font-medium transition-colors text-left cursor-pointer"
              >
                &ldquo;{prompt}&rdquo;
              </button>
            ))}
          </div>
        </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs sm:text-sm text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* AI Results Section */}
      {result && (
        <div className="mt-8 bg-white rounded-2xl border border-[#edd5e3] p-6 sm:p-8 shadow-xs">
          {/* Analysis Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#fbf5f8] border border-[#edd5e3] text-[#aa5588] flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Recommended Department
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  {result.detectedSpecialty}
                </h3>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-[#fbf5f8] text-[#aa5588] font-semibold text-xs border border-[#edd5e3] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Specialist Match Found
            </span>
          </div>

          {/* Clinical Explanation */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              <strong className="text-slate-900 font-semibold">Clinical Note: </strong>
              {result.clinicalExplanation}
            </p>
          </div>

          {/* Matching Doctors Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Available Specialists for {result.detectedSpecialty}
              </h4>
              <span className="text-xs text-slate-500">
                {result.matchingDoctors.length} {result.matchingDoctors.length === 1 ? 'doctor' : 'doctors'} available
              </span>
            </div>

            {result.matchingDoctors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.matchingDoctors.map((doc) => (
                  <DoctorCard key={doc.id} doctor={doc} />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                No active doctors are currently assigned to this department.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
