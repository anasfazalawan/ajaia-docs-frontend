'use client';

import { useEffect } from 'react';

let hasPingedBackend = false;

export default function BackendWarmup() {
  useEffect(() => {
    if (typeof window === 'undefined' || hasPingedBackend) return;

    try {
      const alreadyWarmed = sessionStorage.getItem('ajaia_backend_warmed');
      if (alreadyWarmed) {
        hasPingedBackend = true;
        return;
      }
    } catch {
      // ignore
    }

    hasPingedBackend = true;
    try {
      sessionStorage.setItem('ajaia_backend_warmed', 'true');
    } catch {
      // ignore
    }

    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!rawApiUrl) return;

    const baseUrl = rawApiUrl.replace(/\/api\/?$/, '');
    // Single-shot silent wake-up ping for free cloud hosts (Render/Railway)
    fetch(`${baseUrl}/api/health`, { cache: 'no-store' }).catch(() => {
      // Silently ignore ping errors so user experience is unaffected
    });
  }, []);

  return null;
}
