import { ChangeEvent, useRef, useState } from 'react';
import { ApiError } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { toast } from 'sonner';

export default function ImportFileButton({ onImported }: { onImported: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const importingRef = useRef(false);
  const api = useApi();

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || importingRef.current) return;
    importingRef.current = true;
    setImporting(true);
    try {
      await api.importDocument(file);
      toast.success(`Successfully imported "${file.name}"!`);
      onImported();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to import file';
      toast.error(msg);
    } finally {
      importingRef.current = false;
      setImporting(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={importing}
        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 shadow-xs"
      >
        {importing ? 'Importing…' : 'Import .txt / .md'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,text/plain,text/markdown"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
