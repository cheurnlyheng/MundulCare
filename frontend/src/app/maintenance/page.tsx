'use client';

import React, { useEffect, useState } from 'react';
import MaintenanceScreen from '@/components/MaintenanceScreen';
import { settingsApi } from '@/lib/api';

export default function MaintenancePage() {
  const [message, setMessage] = useState<string | undefined>(undefined);

  useEffect(() => {
    settingsApi
      .getMaintenanceStatus()
      .then((res) => {
        if (res.success && res.data?.message) setMessage(res.data.message);
      })
      .catch(() => {});
  }, []);

  return <MaintenanceScreen message={message} />;
}
