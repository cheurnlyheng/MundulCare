'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, User, ArrowLeft, ChevronDown, Shield } from 'lucide-react';
import logoImg from '../../public/logo.png';
import { useAuth } from '@/context/AuthContext';
import { getImageUrl } from '@/lib/imageUrl';

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
      {/* Left: Brand Logo & Title */}
      <Link href="/admin" className="flex items-center gap-3 group">
        <Image
          src={logoImg}
          alt="Mundul Care Logo"
          width={40}
          height={40}
          priority
          className="w-10 h-10 object-contain group-hover:scale-105 transition-transform"
        />
        <span className="text-xl font-extrabold text-slate-900 tracking-tight">
          Mundul <span className="text-[#aa5588]">Care</span>
        </span>
      </Link>

      {/* Right: Admin Profile (as seen in Figma: "Admin [Name]" + Avatar Circle) */}
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-[#f5f3ff] border border-[#ddd6fe] text-[#6D28D9] font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
            {user?.profileImage ? (
              <img src={getImageUrl(user.profileImage)} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name ? user.name.charAt(0).toUpperCase() : 'A'
            )}
          </div>

          <div className="flex flex-col text-left">
            <span className="text-sm font-semibold text-slate-800 leading-tight">
              {user?.name || 'Admin'}
            </span>
            <span className="text-[10px] font-bold text-[#6D28D9] leading-none uppercase">
              Admin
            </span>
          </div>

          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              dropdownOpen ? 'rotate-180 text-slate-700' : 'rotate-0'
            }`}
          />
        </button>

        {/* Dropdown Popover */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-4 py-2.5 border-b border-slate-100">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email}</p>
              <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f5f3ff] text-[#6D28D9] border border-[#ddd6fe]">
                <Shield className="w-3 h-3" /> Hospital Admin
              </span>
            </div>

            <div className="py-1">
              <Link
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>Account Settings</span>
              </Link>
              <Link
                href="/"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-slate-400" />
                <span>Exit to Public Site</span>
              </Link>
            </div>

            <div className="pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
