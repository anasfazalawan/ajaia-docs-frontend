import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-semibold text-ink">Page not found</h1>
      <p className="text-sm text-gray-500">
        This document may have been deleted, or you may not have access to it.
      </p>
      <Link href="/dashboard" className="mt-2 text-sm font-medium text-accent hover:underline">
        Back to your documents
      </Link>
    </main>
  );
}
