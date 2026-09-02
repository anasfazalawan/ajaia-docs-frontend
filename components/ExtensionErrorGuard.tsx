'use client';

import { useEffect } from 'react';

/**
 * Suppresses unhandled runtime errors caused by injected third-party Chrome/Firefox
 * extensions (e.g. `chrome-extension://...` or extension-injected content scripts)
 * so they do not trigger the Next.js development error overlay.
 */
export default function ExtensionErrorGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    function handleError(event: ErrorEvent) {
      const filename = event.filename || '';
      const stack = event.error?.stack || '';
      const message = event.message || '';

      const isExtensionError =
        filename.startsWith('chrome-extension://') ||
        filename.startsWith('moz-extension://') ||
        stack.includes('chrome-extension://') ||
        stack.includes('moz-extension://') ||
        message.includes('M_ID') ||
        message.includes('eppiocemhmnlbhjplcgkofciiegomcon');

      if (isExtensionError) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return true;
      }
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      const stack = typeof reason === 'object' && reason !== null ? (reason as { stack?: string }).stack || '' : '';
      const message =
        typeof reason === 'object' && reason !== null
          ? (reason as { message?: string }).message || ''
          : String(reason);

      const isExtensionError =
        stack.includes('chrome-extension://') ||
        stack.includes('moz-extension://') ||
        message.includes('M_ID') ||
        message.includes('eppiocemhmnlbhjplcgkofciiegomcon');

      if (isExtensionError) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }

    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);

    return () => {
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
    };
  }, []);

  return <>{children}</>;
}
