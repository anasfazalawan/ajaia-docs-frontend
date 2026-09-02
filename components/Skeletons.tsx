'use client';

export function DocumentCardSkeleton() {
  return (
    <div className="group flex flex-col justify-between rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs animate-pulse">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1">
            <div className="h-8 w-8 rounded-lg bg-gray-200 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
        <div className="h-3 w-20 rounded bg-gray-100" />
        <div className="h-5 w-14 rounded-full bg-gray-100" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar Skeleton */}
      <nav className="border-b border-gray-200 bg-white px-6 py-3.5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-200 animate-pulse" />
            <div className="h-5 w-24 rounded bg-gray-200 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-32 rounded bg-gray-200 animate-pulse hidden sm:block" />
            <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
          </div>
        </div>
      </nav>

      {/* Main Content Skeleton */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="h-8 w-48 rounded-lg bg-gray-200 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-9 w-32 rounded-lg bg-gray-200 animate-pulse" />
            <div className="h-9 w-36 rounded-lg bg-indigo-300 animate-pulse" />
          </div>
        </div>

        {/* Owned Section Skeleton */}
        <section className="mt-8">
          <div className="h-4 w-28 rounded bg-gray-200 animate-pulse mb-3" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DocumentCardSkeleton />
            <DocumentCardSkeleton />
            <DocumentCardSkeleton />
          </div>
        </section>

        {/* Shared Section Skeleton */}
        <section className="mt-10">
          <div className="h-4 w-32 rounded bg-gray-200 animate-pulse mb-3" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DocumentCardSkeleton />
            <DocumentCardSkeleton />
          </div>
        </section>
      </main>
    </div>
  );
}

export function DocumentEditorSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar Skeleton */}
      <nav className="border-b border-gray-200 bg-white px-6 py-3.5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-200 animate-pulse" />
            <div className="h-5 w-24 rounded bg-gray-200 animate-pulse" />
          </div>
          <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
        </div>
      </nav>

      {/* Action Header Skeleton */}
      <div className="border-b border-gray-200/80 bg-white/80 sticky top-0 z-20 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-8 w-8 rounded-lg bg-gray-200 animate-pulse shrink-0" />
            <div className="h-6 w-56 rounded bg-gray-200 animate-pulse" />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-20 rounded-full bg-emerald-100 animate-pulse hidden sm:block" />
            <div className="h-8 w-16 rounded-lg bg-gray-200 animate-pulse" />
            <div className="h-8 w-16 rounded-lg bg-indigo-300 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Canvas & Toolbar Skeleton */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 flex flex-col items-center">
        {/* Toolbar Skeleton */}
        <div className="sticky top-16 z-30 mb-6 flex w-full max-w-4xl items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-2.5 shadow-xs animate-pulse">
          <div className="flex items-center gap-1.5 flex-1">
            <div className="h-6 w-12 rounded bg-gray-200" />
            <div className="h-6 w-12 rounded bg-gray-200" />
            <div className="h-4 w-px bg-gray-300 mx-1" />
            <div className="h-6 w-8 rounded bg-gray-200" />
            <div className="h-6 w-8 rounded bg-gray-200" />
            <div className="h-6 w-8 rounded bg-gray-200" />
            <div className="h-4 w-px bg-gray-300 mx-1" />
            <div className="h-6 w-16 rounded bg-gray-200" />
            <div className="h-6 w-16 rounded bg-gray-200" />
          </div>
          <div className="h-5 w-24 rounded bg-gray-100" />
        </div>

        {/* Paper Canvas Skeleton */}
        <div className="w-full max-w-4xl rounded-2xl border border-gray-200/90 bg-white p-8 sm:p-14 md:p-16 shadow-xs animate-pulse space-y-6">
          <div className="h-8 w-2/5 rounded-lg bg-gray-200" />
          <div className="space-y-3 pt-2">
            <div className="h-4 w-full rounded bg-gray-100" />
            <div className="h-4 w-11/12 rounded bg-gray-100" />
            <div className="h-4 w-4/5 rounded bg-gray-100" />
            <div className="h-4 w-9/12 rounded bg-gray-100" />
          </div>
          <div className="space-y-3 pt-4">
            <div className="h-6 w-1/4 rounded bg-gray-200" />
            <div className="h-4 w-full rounded bg-gray-100" />
            <div className="h-4 w-10/12 rounded bg-gray-100" />
            <div className="h-4 w-3/4 rounded bg-gray-100" />
          </div>
          <div className="space-y-3 pt-4">
            <div className="h-4 w-full rounded bg-gray-100" />
            <div className="h-4 w-5/6 rounded bg-gray-100" />
          </div>
        </div>
      </main>
    </div>
  );
}
