'use client';

import { useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from './supabase/client';
import { createApi } from './api';

export function useApi() {
  const { session } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  return useMemo(
    () =>
      createApi(async () => {
        if (session?.access_token) return session.access_token;
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token ?? null;
      }),
    [session?.access_token, supabase],
  );
}
