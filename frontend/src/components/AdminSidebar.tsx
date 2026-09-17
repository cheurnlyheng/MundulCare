'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck,
  UserCheck,
  Users,
  Layers,
  History,
  Settings,
  ShieldOff,
  ArrowLeft,
  Menu,
  X,
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Appointments', href: '/admin/appointments', icon: CalendarCheck },
    { name: 'Doctors & Schedules', href: '/admin/doctors', icon: UserCheck },
    { name: 'Departments', href: '/admin/specialties', icon: Layers },
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'Blacklist', href: '/admin/blacklist', icon: ShieldOff },
    { name: 'Audit Log', href: '/admin/audit-logs', icon: History },
    { name: 'System Settings', href: '/admin/settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white py-4">
      {/* Nav Links */}
      <nav className="px-3 space-y-1.5">
        {navItems.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-[#f5f3ff] text-[#6D28D9] border border-[#ddd6fe] font-bold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Minimal Footer: Exit to Public Site (Admin Profile removed as it is now in Top Bar) */}
      <div className="px-3 pt-4 border-t border-slate-100">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Public Site</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-12 h-12 rounded-full bg-[#6D28D9] text-white flex items-center justify-center shadow-lg cursor-pointer"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop Sidebar - sticky so it stays in view on pages taller than the viewport */}
      <aside className="hidden lg:flex w-64 bg-white h-[calc(100vh-4rem)] sticky top-16 self-start flex-col border-r border-slate-200 shrink-0 select-none overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex">
          <div className="w-64 bg-white h-full border-r border-slate-200 flex flex-col animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
}
