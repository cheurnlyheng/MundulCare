'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  /** Brand accent color for focus ring & selected option. Defaults to the client pink. */
  accentColor?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  className = '',
  accentColor = '#aa5588',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Tailwind needs full literal class names to generate them, so the two accent
  // variants this app actually uses (client pink / admin purple) are spelled out.
  const isPurple = accentColor === '#6D28D9';
  const ringClass = isPurple ? 'focus:ring-[#6D28D9]/20' : 'focus:ring-[#aa5588]/20';
  const selectedClass = isPurple ? 'bg-[#f5f3ff] text-[#6D28D9]' : 'bg-[#fbf5f8] text-[#aa5588]';
  const checkClass = isPurple ? 'text-[#6D28D9]' : 'text-[#aa5588]';

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-medium hover:border-slate-300 focus:outline-none focus:ring-2 ${ringClass} transition-all cursor-pointer shadow-2xs`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ease-in-out ${
            isOpen ? 'rotate-180 text-slate-700' : 'rotate-0'
          }`}
        />
      </button>

      {/* Dropdown Menu with animation */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[180px] bg-white rounded-xl border border-slate-200/90 shadow-lg py-1 max-h-60 overflow-y-auto animate-in fade-in-50 zoom-in-95 duration-150">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-sm font-medium transition-colors flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? `${selectedClass} font-bold`
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <span className={`${checkClass} text-xs`}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
