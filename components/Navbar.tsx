'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
      <Link href="/dashboard" className="text-lg font-semibold text-ink">
        Ajaia Docs
      </Link>
      {user && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {user.user_metadata?.full_name ?? user.email}
          </span>
          <button
            onClick={async () => {
              await signOut();
              router.push('/login');
            }}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
