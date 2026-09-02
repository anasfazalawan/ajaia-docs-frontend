import Link from 'next/link';
import { useState } from 'react';
import type { DocumentSummary } from '@/types';
import { useApi } from '@/lib/useApi';
import { toast } from 'sonner';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DocumentCard({
  doc,
  onChanged,
}: {
  doc: DocumentSummary;
  onChanged: () => void;
}) {
  const api = useApi();
  const [busy, setBusy] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${doc.title}"? This can't be undone.`)) return;
    setBusy(true);
    try {
      await api.deleteDocument(doc.id);
      toast.success(`Deleted "${doc.title}"`);
      onChanged();
    } catch {
      toast.error('Failed to delete document.');
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Leave "${doc.title}"? You'll lose access unless it's shared with you again.`)) return;
    setBusy(true);
    try {
      await api.leaveDocument(doc.id);
      toast.success(`Left "${doc.title}"`);
      onChanged();
    } catch {
      toast.error('Failed to leave document.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Link
      href={`/documents/${doc.id}`}
      className="group relative block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-accent hover:shadow-sm"
    >
      <div className="flex items-start justify-between">
        <h3 className="font-medium text-ink line-clamp-1 pr-6">{doc.title}</h3>
        <span
          className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            doc.access === 'owner' ? 'bg-indigo-50 text-accent' : 'bg-amber-50 text-amber-700'
          }`}
        >
          {doc.access === 'owner' ? 'Owned' : 'Shared'}
        </span>
      </div>
      <p className="mt-2 text-xs text-gray-400">
        {doc.access === 'shared' ? `by ${doc.owner.name} · ` : ''}
        Updated {formatDate(doc.updatedAt)}
      </p>

      <button
        onClick={doc.access === 'owner' ? handleDelete : handleLeave}
        disabled={busy}
        aria-label={doc.access === 'owner' ? 'Delete document' : 'Leave document'}
        title={doc.access === 'owner' ? 'Delete' : 'Leave'}
        className="absolute right-3 top-3 hidden rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 group-hover:block"
      >
        ✕
      </button>
    </Link>
  );
}
