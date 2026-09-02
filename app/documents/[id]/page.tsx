'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useApi } from '@/lib/useApi';
import { ApiError } from '@/lib/api';
import { useCollaborationProvider, type CollaboratorPresence } from '@/lib/useCollaborationProvider';
import { colorForUserId } from '@/lib/userColor';
import type { DocumentDetail } from '@/types';
import Navbar from '@/components/Navbar';
import RichTextEditor from '@/components/RichTextEditor';
import ShareModal from '@/components/ShareModal';
import VersionHistory from '@/components/VersionHistory';
import LoadingSpinner from '@/components/LoadingSpinner';
import { DocumentEditorSkeleton } from '@/components/Skeletons';
import { toast } from 'sonner';

const TITLE_SAVE_DELAY_MS = 800;

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const api = useApi();

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [title, setTitle] = useState('');
  const [titleStatus, setTitleStatus] = useState<SaveStatus>('idle');
  const [contentSaveStatus, setContentSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [error, setError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const titleSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { provider, ydoc, status: connectionStatus, collaborators } = useCollaborationProvider(id);

  // Listen to live collaborative Yjs document updates to reflect real-time auto-saving
  useEffect(() => {
    if (!ydoc || !provider) return;

    const handleUpdate = () => {
      setContentSaveStatus('saving');
      if (contentSaveTimer.current) clearTimeout(contentSaveTimer.current);
      contentSaveTimer.current = setTimeout(() => {
        setContentSaveStatus('saved');
      }, 700);
    };

    const handleSynced = () => {
      setContentSaveStatus('saved');
    };

    ydoc.on('update', handleUpdate);
    provider.on('synced', handleSynced);

    return () => {
      ydoc.off('update', handleUpdate);
      provider.off('synced', handleSynced);
      if (contentSaveTimer.current) clearTimeout(contentSaveTimer.current);
    };
  }, [ydoc, provider]);

  function handleCopyLink() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Document link copied to clipboard!');
    }
  }

  function handleExport(format: 'md' | 'txt' | 'html' | 'print') {
    if (format === 'print') {
      window.print();
      setExportOpen(false);
      return;
    }

    const editorEl = document.querySelector('.ProseMirror');
    const rawHtml = editorEl ? editorEl.innerHTML : '';
    const plainText = editorEl ? (editorEl as HTMLElement).innerText : '';
    const docTitle = title.trim() || 'Untitled document';

    let contentToSave = '';
    let mimeType = 'text/plain';
    let extension = 'txt';

    if (format === 'html') {
      contentToSave = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${docTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; }
    h1 { font-size: 2.2em; color: #0f172a; margin-top: 1.5em; }
    h2 { font-size: 1.6em; color: #1e293b; margin-top: 1.3em; }
    h3 { font-size: 1.3em; color: #334155; }
    blockquote { border-left: 4px solid #6366f1; margin: 1.5em 0; padding: 0.5em 1em; background: #f8fafc; }
    code { background: #f1f5f9; padding: 0.2em 0.4em; border-radius: 4px; font-family: monospace; }
    pre { background: #0f172a; color: #f8fafc; padding: 1em; border-radius: 8px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>${docTitle}</h1>
  ${rawHtml}
</body>
</html>`;
      mimeType = 'text/html';
      extension = 'html';
    } else if (format === 'md') {
      const md = rawHtml
        .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
        .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
        .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b>(.*?)<\/b>/gi, '**$1**')
        .replace(/<em>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i>(.*?)<\/i>/gi, '*$1*')
        .replace(/<u>(.*?)<\/u>/gi, '$1')
        .replace(/<s>(.*?)<\/s>/gi, '~~$1~~')
        .replace(/<code>(.*?)<\/code>/gi, '`$1`')
        .replace(/<blockquote><p>(.*?)<\/p><\/blockquote>/gi, '> $1\n\n')
        .replace(/<li><p>(.*?)<\/p><\/li>/gi, '- $1\n')
        .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<hr\s*\/?>/gi, '\n---\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

      contentToSave = `# ${docTitle}\n\n` + md.trim();
      mimeType = 'text/markdown';
      extension = 'md';
    } else {
      contentToSave = `${docTitle}\n\n${plainText}`;
      mimeType = 'text/plain';
      extension = 'txt';
    }

    const blob = new Blob([contentToSave], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docTitle.replace(/[/\\?%*:|"<>]/g, '-')}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported document as .${extension}!`);
    setExportOpen(false);
  }

  const loadDoc = useCallback(async () => {
    try {
      const data = await api.getDocument(id);
      setDoc(data);
      setTitle(data.title);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load document');
    }
  }, [api, id]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }
    if (user) loadDoc();
  }, [user, authLoading, router, loadDoc]);

  function handleTitleChange(value: string) {
    setTitle(value);
    setTitleStatus('saving');
    if (titleSaveTimer.current) clearTimeout(titleSaveTimer.current);
    titleSaveTimer.current = setTimeout(async () => {
      try {
        await api.updateDocument(id, { title: value });
        setTitleStatus('saved');
      } catch {
        setTitleStatus('error');
      }
    }, TITLE_SAVE_DELAY_MS);
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
        <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm max-w-md">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Unable to access document</h2>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            &larr; Back to your documents
          </Link>
        </div>
      </main>
    );
  }

  if (authLoading || !doc || !provider || !ydoc) {
    return <DocumentEditorSkeleton />;
  }

  const isOwner = doc.access === 'owner';
  const isReadOnly = doc.role === 'viewer';
  const userInfo = {
    name: user?.user_metadata?.full_name ?? user?.email ?? 'Anonymous',
    color: colorForUserId(user?.id ?? 'anon'),
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Document Subheader / Action Bar */}
      <div className="border-b border-gray-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Left: Back & Title */}
          <div className="flex flex-1 items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 shadow-2xs shrink-0"
              title="Back to documents"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={title}
                  disabled={doc.access === 'shared' && doc.role !== 'owner'}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Untitled document"
                  className="font-bold text-gray-900 text-base sm:text-lg bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-600 focus:outline-none transition px-1 py-0.5 rounded-xs truncate max-w-md disabled:cursor-not-allowed"
                />
                <CloudSaveBadge
                  titleStatus={titleStatus}
                  contentStatus={contentSaveStatus}
                  connectionStatus={connectionStatus}
                />
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live Presence Badges */}
            <ConnectionStatusBadge status={connectionStatus} />
            <CollaboratorAvatarStack collaborators={collaborators} currentUserId={user?.id} />

            {/* Version History Button */}
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              title="Version history"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
            >
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden md:inline">History</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative z-50">
              <button
                type="button"
                onClick={() => setExportOpen((prev) => !prev)}
                title="Export or Print"
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
              >
                <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="hidden sm:inline">Export</span>
              </button>

              {exportOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
                  <div className="absolute right-0 mt-1.5 z-50 w-52 rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl">
                    <button
                      type="button"
                      onClick={() => handleExport('md')}
                      className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-mono text-[10px] text-indigo-700">.md</span>
                      Markdown file
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport('txt')}
                      className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">.txt</span>
                      Plain text file
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport('html')}
                      className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 font-mono text-[10px] text-amber-700">.html</span>
                      HTML webpage
                    </button>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      type="button"
                      onClick={() => handleExport('print')}
                      className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <svg className="h-3.5 w-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print / Save as PDF
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Copy Link Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy link to document"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
            >
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>Copy Link</span>
            </button>

            {/* Version History Button */}
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              title="Version History"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
            >
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">History</span>
            </button>

            {/* Shortcuts Help Button */}
            <button
              type="button"
              onClick={() => setShortcutsOpen(true)}
              title="Keyboard Shortcuts"
              className="flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
            >
              ?
            </button>

            {/* Share Button (Owner Only) */}
            {isOwner && (
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>Share</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <RichTextEditor
          ydoc={ydoc}
          provider={provider}
          editable={!isReadOnly}
          userInfo={userInfo}
        />
      </main>

      {/* Modals */}
      {shareOpen && <ShareModal documentId={doc.id} onClose={() => setShareOpen(false)} />}
      {historyOpen && (
        <VersionHistory
          documentId={doc.id}
          onClose={() => setHistoryOpen(false)}
          onRestored={() => {
            loadDoc();
          }}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      {shortcutsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs px-4"
          onClick={() => setShortcutsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700">
                  ⌨️
                </span>
                <h2 className="text-base font-bold text-gray-900">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={() => setShortcutsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <p className="font-semibold text-gray-400 uppercase tracking-wider text-[10px]">Formatting</p>
                <div className="flex justify-between items-center"><span className="text-gray-600">Bold</span><kbd className="px-1.5 py-0.5 bg-gray-100 border rounded font-mono text-[11px]">Ctrl+B</kbd></div>
                <div className="flex justify-between items-center"><span className="text-gray-600">Italic</span><kbd className="px-1.5 py-0.5 bg-gray-100 border rounded font-mono text-[11px]">Ctrl+I</kbd></div>
                <div className="flex justify-between items-center"><span className="text-gray-600">Underline</span><kbd className="px-1.5 py-0.5 bg-gray-100 border rounded font-mono text-[11px]">Ctrl+U</kbd></div>
                <div className="flex justify-between items-center"><span className="text-gray-600">Code</span><kbd className="px-1.5 py-0.5 bg-gray-100 border rounded font-mono text-[11px]">Ctrl+E</kbd></div>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-gray-400 uppercase tracking-wider text-[10px]">Headings & Lists</p>
                <div className="flex justify-between items-center"><span className="text-gray-600">Heading 1</span><kbd className="px-1.5 py-0.5 bg-gray-100 border rounded font-mono text-[11px]"># + Space</kbd></div>
                <div className="flex justify-between items-center"><span className="text-gray-600">Heading 2</span><kbd className="px-1.5 py-0.5 bg-gray-100 border rounded font-mono text-[11px]">## + Space</kbd></div>
                <div className="flex justify-between items-center"><span className="text-gray-600">Bullet list</span><kbd className="px-1.5 py-0.5 bg-gray-100 border rounded font-mono text-[11px]">- + Space</kbd></div>
                <div className="flex justify-between items-center"><span className="text-gray-600">Task list</span><kbd className="px-1.5 py-0.5 bg-gray-100 border rounded font-mono text-[11px]">[ ] + Space</kbd></div>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
              <span>Undo: <kbd className="px-1 bg-gray-100 rounded font-mono">Ctrl+Z</kbd></span>
              <span>Redo: <kbd className="px-1 bg-gray-100 rounded font-mono">Ctrl+Y</kbd></span>
              <span>Print/PDF: <kbd className="px-1 bg-gray-100 rounded font-mono">Ctrl+P</kbd></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConnectionStatusBadge({ status }: { status: 'connecting' | 'connected' | 'disconnected' }) {
  if (status === 'connected') {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="hidden md:inline">Live Sync</span>
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        <span>Connecting…</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 border border-rose-200">
      <span className="h-2 w-2 rounded-full bg-rose-500" />
      <span>Offline</span>
    </div>
  );
}

function CollaboratorAvatarStack({
  collaborators,
}: {
  collaborators: CollaboratorPresence[];
  currentUserId?: string;
}) {
  if (!collaborators || collaborators.length === 0) return null;

  return (
    <div className="flex items-center -space-x-1.5 overflow-hidden">
      {collaborators.slice(0, 4).map((c, i) => {
        const name = c.user?.name || 'User';
        const color = c.user?.color || '#6366f1';
        const initial = name.charAt(0).toUpperCase();

        return (
          <div
            key={`${c.clientId}-${i}`}
            title={`${name} (Active in document)`}
            style={{ backgroundColor: color }}
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-white shadow-sm select-none"
          >
            {initial}
          </div>
        );
      })}
      {collaborators.length > 4 && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-700 ring-2 ring-white shadow-sm">
          +{collaborators.length - 4}
        </div>
      )}
    </div>
  );
}

function CloudSaveBadge({
  titleStatus,
  contentStatus,
  connectionStatus,
}: {
  titleStatus: SaveStatus;
  contentStatus: 'saving' | 'saved';
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}) {
  const isSaving = titleStatus === 'saving' || contentStatus === 'saving';
  const isTitleError = titleStatus === 'error';

  if (connectionStatus === 'disconnected') {
    return (
      <div className="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200" title="Changes will sync when reconnected">
        <svg className="h-3.5 w-3.5 text-amber-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>Offline</span>
      </div>
    );
  }

  if (isTitleError) {
    return (
      <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
        <span>Save failed</span>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs text-gray-500 font-medium bg-gray-50 border border-gray-200/60" title="Saving changes to cloud">
        <svg className="h-3.5 w-3.5 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-[11px]">Saving…</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition cursor-default select-none" title="All changes automatically saved to cloud">
      <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 13l2 2 4-4" />
      </svg>
      <span className="hidden sm:inline text-[11px] text-gray-500">Saved to cloud</span>
    </div>
  );
}
