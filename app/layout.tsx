import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import ExtensionErrorGuard from '@/components/ExtensionErrorGuard';
import BackendWarmup from '@/components/BackendWarmup';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Ajaia Docs',
  description: 'A lightweight collaborative document editor',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ExtensionErrorGuard>
          <BackendWarmup />
          <AuthProvider>{children}</AuthProvider>
          <Toaster position="bottom-right" richColors closeButton />
        </ExtensionErrorGuard>
      </body>
    </html>
  );
}
