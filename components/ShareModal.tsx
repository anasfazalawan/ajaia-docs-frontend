import { FormEvent, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import type { DocumentShare } from '@/types';
import { toast } from 'sonner';

export default function ShareModal({ documentId, onClose }: { documentId: string; onClose: () => void }) {
  const api = useApi();
  const [shares, setShares] = useState<DocumentShare[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('editor');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const data = await api.listShares(documentId);
    setShares(data);
  }

  useEffect(() => {
    refresh().catch(() => setError('Could not load current shares'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  async function handleShare(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.shareDocument(documentId, email.trim(), role);
      toast.success(`Shared document with ${email.trim()} as ${role}!`);
      setEmail('');
      await refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to share document';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(shareId: string) {
    try {
      await api.revokeShare(documentId, shareId);
      toast.success('Access revoked successfully.');
      await refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to revoke share';
      toast.error(msg);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Share document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleShare} className="mt-4 flex gap-2">
          <input
            type="email"
            required
            placeholder="person@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'viewer' | 'editor')}
            className="rounded-md border border-gray-300 px-2 py-2 text-sm"
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            Share
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <p className="mt-1 text-xs text-gray-400">
          The person must have signed in to Ajaia Docs at least once before you can share with them.
          Viewers can watch live edits but cannot type.
        </p>

        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Shared with</p>
          {shares.length === 0 ? (
            <p className="mt-2 text-sm text-gray-400">Not shared with anyone yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {shares.map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span>
                    {s.user.name}{' '}
                    <span className="text-gray-400">
                      ({s.user.email}) · {s.role}
                    </span>
                  </span>
                  <button onClick={() => handleRevoke(s.id)} className="text-xs text-red-500 hover:underline">
                    Remove
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
