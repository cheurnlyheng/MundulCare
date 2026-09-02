'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import MaintenanceScreen from '@/components/MaintenanceScreen';
import { settingsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const RECHECK_INTERVAL_MS = 60000;

// Login/account-recovery routes must stay reachable during maintenance -
// otherwise an admin has no way to sign in and turn maintenance mode back off.
const ALWAYS_ALLOWED_PATHS = ['/login', '/forgot-password', '/reset-password', '/verify-email'];

export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const [status, setStatus] = useState<{ enabled: boolean; message: string } | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = () => {
      settingsApi
        .getMaintenanceStatus()
        .then((res) => {
          if (!cancelled && res.success && res.data) setStatus(res.data);
        })
        .catch(() => {
          // If the status check itself fails, don't block the app - fail open
        })
        .finally(() => {
          if (!cancelled) setChecked(true);
        });
    };

    check();
    const interval = setInterval(check, RECHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const isAdmin = user?.role === 'ADMIN';
  const isAlwaysAllowedRoute = ALWAYS_ALLOWED_PATHS.some((path) => pathname?.startsWith(path));

  if (authLoading || isAdmin || isAlwaysAllowedRoute) {
    return <>{children}</>;
  }

  // Wait for the first status check before rendering anything else, so pages
  // don't fire doomed API calls (and log 503s) before we know maintenance is on.
  if (!checked) {
    return null;
  }

  if (status?.enabled) {
    return <MaintenanceScreen message={status.message} />;
  }

  return <>{children}</>;
}
