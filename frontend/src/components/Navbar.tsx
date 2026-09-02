'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Stethoscope,
  LogOut,
  Shield,
  CalendarCheck,
  Menu,
  X,
  User,
  ChevronDown,
  LogIn,
} from 'lucide-react';
import Image from 'next/image';
import logoImg from '../../public/logo.png';
import { useAuth } from '@/context/AuthContext';
import { getImageUrl } from '@/lib/imageUrl';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Find Doctors', href: '/doctors' },
  ];

  const isAdmin = user?.role === 'ADMIN';

  // Close profile dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileDropdownOpen(false);
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src={logoImg}
            alt="Mundul Care"
            width={48}
            height={48}
            priority
            className="w-11 h-11 sm:w-12 sm:h-12 object-contain group-hover:scale-105 transition-transform shrink-0"
          />
          <span className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight">
            Mundul <span className="text-[#aa5588]">Care</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-[#aa5588] bg-[#fbf5f8] font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          <Link
            href="/#ai-assistant"
            className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-colors ml-1.5"
          >
            AI Symptom Matcher
          </Link>

          {/* My Appointments Tab */}
          {isAuthenticated && (
            <Link
              href="/my-appointments"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ml-1 ${
                pathname === '/my-appointments'
                  ? 'text-[#aa5588] bg-[#fbf5f8] font-bold border border-[#edd5e3]'
                  : 'text-slate-600 hover:text-[#aa5588] hover:bg-slate-100/70'
              }`}
            >
              My Appointments
            </Link>
          )}
        </nav>

        {/* Desktop User Actions: Clean Profile Menu (No raw logout on nav bar) */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <div ref={profileMenuRef} className="relative">
              {/* Profile Trigger Button */}
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-slate-100/80 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
              >
                <div
                  className={`w-8 h-8 rounded-full border font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 shadow-2xs ${
                    isAdmin
                      ? 'bg-[#f5f3ff] border-[#ddd6fe] text-[#6D28D9]'
                      : 'bg-[#fbf5f8] border-[#edd5e3] text-[#aa5588]'
                  }`}
                >
                  {user.profileImage ? (
                    <img src={getImageUrl(user.profileImage)} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name ? user.name.charAt(0).toUpperCase() : 'U'
                  )}
                </div>

                <div className="flex flex-col text-left">
                  <span className="text-sm font-semibold text-slate-800 leading-tight">
                    {user.name}
                  </span>
                  {isAdmin && (
                    <span className="text-[10px] font-bold text-[#6D28D9] leading-none uppercase">
                      Admin
                    </span>
                  )}
                </div>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    profileDropdownOpen ? 'rotate-180 text-slate-700' : 'rotate-0'
                  }`}
                />
              </button>

              {/* Profile Popover Dropdown (Logout tucked away inside menu) */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-slate-200/90 shadow-xl py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                  {/* User Profile Card Header */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                    {isAdmin && (
                      <span className="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f5f3ff] text-[#6D28D9] border border-[#ddd6fe]">
                        Hospital Administrator
                      </span>
                    )}
                  </div>

                  {/* Nav Links inside dropdown */}
                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-[#fbf5f8] hover:text-[#aa5588] transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Account Settings</span>
                    </Link>

                    <Link
                      href="/my-appointments"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-[#fbf5f8] hover:text-[#aa5588] transition-colors"
                    >
                      <CalendarCheck className="w-4 h-4 text-slate-400" />
                      <span>My Appointments</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-[#6D28D9] hover:bg-[#f5f3ff] transition-colors"
                      >
                        <Shield className="w-4 h-4 text-[#6D28D9]" />
                        <span>Admin Portal</span>
                      </Link>
                    )}
                  </div>

                  {/* Sign Out Button cleanly placed at bottom of menu */}
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
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
          ) : (
            /* Clean, elegant Sign In CTA */
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-[#aa5588] hover:bg-[#fbf5f8] border border-transparent hover:border-[#edd5e3] transition-all"
              >
                <LogIn className="w-4 h-4 text-[#aa5588]" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-[#aa5588] hover:bg-[#924472] rounded-xl shadow-xs transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated && user && (
            <Link
              href="/profile"
              className={`w-8 h-8 rounded-full border text-xs font-bold flex items-center justify-center overflow-hidden ${
                isAdmin
                  ? 'bg-[#f5f3ff] border-[#ddd6fe] text-[#6D28D9]'
                  : 'bg-[#fbf5f8] border-[#edd5e3] text-[#aa5588]'
              }`}
            >
              {user.profileImage ? (
                <img src={getImageUrl(user.profileImage)} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name ? user.name.charAt(0).toUpperCase() : 'U'
              )}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-xl text-sm font-medium ${
                pathname === link.href
                  ? 'text-[#aa5588] bg-[#fbf5f8] font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.name}
            </Link>
          ))}

          <Link
            href="/#ai-assistant"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            AI Symptom Matcher
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                href="/my-appointments"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <CalendarCheck className="w-4 h-4 text-[#aa5588]" />
                <span>My Appointments</span>
              </Link>

              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <User className="w-4 h-4 text-[#aa5588]" />
                <span>Account Settings</span>
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-[#6D28D9] bg-[#f5f3ff] border border-[#ddd6fe]"
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Portal</span>
                </Link>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 truncate max-w-[200px]">{user?.email}</span>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer inline-flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <LogIn className="w-4 h-4 text-[#aa5588]" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-[#aa5588] text-white text-sm font-semibold hover:bg-[#924472]"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
