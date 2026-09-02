'use client';

import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { useApi } from './useApi';

const COLLAB_URL = process.env.NEXT_PUBLIC_COLLAB_URL || '';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface CollaboratorPresence {
  clientId: number;
  user?: {
    name?: string;
    color?: string;
    avatarUrl?: string;
  };
}

/**
 * Opens (and cleans up) a real-time connection for one document. The
 * Y.Doc + HocuspocusProvider pair is the live, shared editing session —
 * every connected client's Tiptap editor renders the same Y.Doc, and
 * Hocuspocus persists it to Postgres on the backend.
 */
export function useCollaborationProvider(documentId: string) {
  const api = useApi();
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([]);
  const ydocRef = useRef<Y.Doc>();

  useEffect(() => {
    if (!ydocRef.current) ydocRef.current = new Y.Doc();
    const ydoc = ydocRef.current;

    const hocuspocusProvider = new HocuspocusProvider({
      url: COLLAB_URL,
      name: documentId,
      document: ydoc,
      // Called on connect and on token expiry — always returns a fresh
      // Supabase access token rather than a value captured once.
      token: async () => {
        let t: string | null = null;
        try {
          t = await api.getToken();
        } catch {
          // fall back
        }
        if (!t && typeof window !== 'undefined') {
          const { createClient } = await import('./supabase/client');
          const supabase = createClient();
          const { data } = await supabase.auth.getSession();
          t = data.session?.access_token ?? null;
        }
        return t ?? '';
      },
      onStatus: ({ status: s }) => setStatus(s as ConnectionStatus),
      onAwarenessUpdate: ({ states }) => {
        const list: CollaboratorPresence[] = [];
        states.forEach((state: Record<string, unknown>, clientId: number) => {
          if (state.user) {
            list.push({
              clientId,
              user: state.user as CollaboratorPresence['user'],
            });
          }
        });
        setCollaborators(list);
      },
      onAuthenticationFailed: ({ reason }) => {
        // eslint-disable-next-line no-console
        console.error('Collaboration auth failed:', reason);
      },
    });

    setProvider(hocuspocusProvider);

    return () => {
      hocuspocusProvider.destroy();
      setProvider(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  return { provider, ydoc: ydocRef.current, status, collaborators };
}
