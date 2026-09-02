'use client';

import { useEffect, useState } from 'react';
import { useApi } from '@/lib/useApi';
import type { DocumentVersion } from '@/types';
import { toast } from 'sonner';

function formatDateTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function timeAgo(iso: string) {
  const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export default function VersionHistory({
  documentId,
  onClose,
  onRestored,
}: {
  documentId: string;
  onClose: () => void;
  onRestored: () => void;
}) {
  const api = useApi();
  const [versions, setVersions] = useState<DocumentVersion[] | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadVersions() {
    try {
      const data = await api.listVersions(documentId);
      setVersions(data);
    } catch {
      toast.error('Failed to load version history');
    }
  }

  useEffect(() => {
    loadVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  async function handleSaveCheckpoint() {
    if (saving) return;
    setSaving(true);
    try {
      await api.createVersion(documentId);
      toast.success('Saved new version checkpoint!');
      await loadVersions();
    } catch {
      toast.error('Failed to save version checkpoint');
    } finally {
      setSaving(false);
    }
  }

  async function handleRestore(versionId: string) {
    setRestoring(versionId);
    try {
      await api.restoreVersion(documentId, versionId);
      toast.success('Document version restored successfully!');
      onRestored();
      onClose();
    } catch {
      toast.error('Failed to restore document version');
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Version History</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Auto-saved every 5 mins or saved manually on-demand
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Action Banner: Manual Save Checkpoint */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-indigo-50/70 border border-indigo-100 p-3.5">
          <div className="text-xs text-indigo-950 font-medium">
            Want to bookmark the current state?
          </div>
          <button
            type="button"
            onClick={handleSaveCheckpoint}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-60 transition shrink-0"
          >
            {saving ? (
              <span>Saving…</span>
            ) : (
              <>
                <span>+ Save Checkpoint</span>
              </>
            )}
          </button>
        </div>

        {/* Versions List */}
        <div className="mt-4 overflow-y-auto flex-1 pr-1 space-y-2.5">
          {!versions ? (
            <div className="py-8 text-center text-xs text-gray-400">Loading versions…</div>
          ) : versions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
              <p className="text-xs text-gray-500">
                No checkpoints saved yet. Click <strong>Save Checkpoint</strong> above or continue editing to generate automatic snapshots.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {versions.map((v, index) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 p-3.5 hover:bg-gray-50 transition"
                >
                  <div className="flex flex-col min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-gray-800">
                        {index === 0 ? 'Current / Latest Snapshot' : `Version ${versions.length - index}`}
                      </span>
                      <span className="rounded bg-gray-200/70 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                        {timeAgo(v.createdAt)}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500 mt-0.5 font-mono">
                      {formatDateTime(v.createdAt)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRestore(v.id)}
                    disabled={restoring !== null}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 shadow-2xs hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50 transition shrink-0"
                  >
                    {restoring === v.id ? 'Restoring…' : 'Restore'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
