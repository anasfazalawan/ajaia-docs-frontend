'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function LandingPage() {
  const { user, loading } = useAuth();

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#fbfbfa] text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Minimalist Top Nav */}
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6 sm:py-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">Ajaia Docs</span>
        </div>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-20 rounded-md bg-slate-200 animate-pulse" />
          ) : user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700"
            >
              <span>Open Docs</span>
              <span>&rarr;</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* Centered Minimalist Hero */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
          Where ideas come together.
        </h1>

        <p className="mt-4 max-w-lg text-base text-slate-500 sm:text-lg">
          Fast, real-time collaborative documents with conflict-free editing, instant sharing, and seamless file import.
        </p>

        {/* Call to Action */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href={user ? '/dashboard' : '/login'}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-100 transition hover:bg-indigo-700 hover:shadow-lg"
          >
            <span>{user ? 'Go to your documents' : 'Start writing'}</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {/* Google Docs-Style Minimalist Document Canvas Preview */}
        <div className="mt-12 w-full max-w-2xl rounded-2xl border border-slate-200/80 bg-white p-8 sm:p-12 shadow-lg shadow-slate-100 text-left transition hover:shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-400">Untitled document</span>
            </div>
            <div className="flex items-center -space-x-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white border-2 border-white">
                M
              </div>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white border-2 border-white">
                S
              </div>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white border-2 border-white">
                A
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="h-6 w-1/2 rounded-md bg-slate-800/10 font-bold" />
            <div className="space-y-2 pt-2">
              <div className="h-3.5 w-full rounded bg-slate-100" />
              <div className="h-3.5 w-5/6 rounded bg-slate-100" />
              <div className="h-3.5 w-3/4 rounded bg-slate-100" />
            </div>
          </div>
        </div>
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="mx-auto w-full max-w-5xl px-6 py-6 text-center text-xs text-slate-400">
        <p>Ajaia Docs • Muhammad Anas Fazal (anasfazalawan@gmail.com)</p>
      </footer>
    </div>
  );
}
