'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useApi } from '@/lib/useApi';
import type { DocumentListResponse } from '@/types';
import Navbar from '@/components/Navbar';
import DocumentCard from '@/components/DocumentCard';
import ImportFileButton from '@/components/ImportFileButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import { DashboardSkeleton } from '@/components/Skeletons';
import { toast } from 'sonner';

const CACHE_KEY = 'ajaia_cached_docs';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const api = useApi();
  const [docs, setDocs] = useState<DocumentListResponse | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) return JSON.parse(cached);
      } catch {
        // ignore
      }
    }
    return null;
  });
  const [creating, setCreating] = useState(false);
  const creatingRef = useRef(false);
  const lastCreateTimeRef = useRef(0);
  const THROTTLE_MS = 2500;
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDocs = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await api.listDocuments();
      setDocs(data);
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch {
          // ignore
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load documents';
      setLoadError(msg);
    }
  }, [api]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    loadDocs();
  }, [user, loading, router, loadDocs]);

  async function handleCreate() {
    const now = Date.now();
    if (now - lastCreateTimeRef.current < THROTTLE_MS || creatingRef.current || creating) {
      return;
    }
    lastCreateTimeRef.current = now;
    creatingRef.current = true;
    setCreating(true);
    toast.loading('Creating new document…', { id: 'create-doc' });
    try {
      const doc = await api.createDocument('Untitled document');
      toast.success('Document created! Opening…', { id: 'create-doc' });
      router.push(`/documents/${doc.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create document';
      toast.error(msg, { id: 'create-doc' });
      creatingRef.current = false;
      setCreating(false);
    }
  }

  if (loading && !user && !docs) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">Your documents</h1>
          <div className="flex gap-2">
            <ImportFileButton onImported={loadDocs} />
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-75 cursor-pointer disabled:cursor-not-allowed"
            >
              {creating ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Creating…</span>
                </>
              ) : (
                <span>+ New document</span>
              )}
            </button>
          </div>
        </div>

        {loadError && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-medium">Error loading documents</p>
            <p className="mt-1 text-xs text-red-600">{loadError}</p>
            <button
              onClick={loadDocs}
              className="mt-3 rounded border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        )}

        {!docs && !loadError ? (
          <div className="mt-8">
            <section>
              <div className="h-4 w-28 rounded bg-gray-200 animate-pulse mb-3" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="h-28 rounded-xl border border-gray-200/80 bg-white p-5 animate-pulse" />
                <div className="h-28 rounded-xl border border-gray-200/80 bg-white p-5 animate-pulse" />
                <div className="h-28 rounded-xl border border-gray-200/80 bg-white p-5 animate-pulse" />
              </div>
            </section>
          </div>
        ) : docs ? (
          <>
            <section className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                Owned by you ({docs.owned.length})
              </h2>
              {docs.owned.length === 0 ? (
                <div className="mt-4 rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
                  <p className="text-sm text-gray-500">
                    No documents yet — create one or import a markdown file to get started.
                  </p>
                  <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-75 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {creating ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Creating…</span>
                      </>
                    ) : (
                      <span>+ Create your first document</span>
                    )}
                  </button>
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {docs.owned.map((doc) => (
                    <DocumentCard key={doc.id} doc={doc} onChanged={loadDocs} />
                  ))}
                </div>
              )}
            </section>

            <section className="mt-10">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                Shared with you ({docs.shared.length})
              </h2>
              {docs.shared.length === 0 ? (
                <p className="mt-3 text-sm text-gray-400">Nothing has been shared with you yet.</p>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {docs.shared.map((doc) => (
                    <DocumentCard key={doc.id} doc={doc} onChanged={loadDocs} />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
