'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'sonner';

type Mode = 'signin' | 'signup';

function LoginForm() {
  const { user, loading, signInWithPassword, signUpWithPassword, signInWithOAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextTarget = searchParams.get('next');
  const redirectUrl = nextTarget && nextTarget.startsWith('/') ? nextTarget : '/dashboard';

  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectUrl);
    }
  }, [user, loading, router, redirectUrl]);

  // When auth state is loading or user is already authenticated and redirecting,
  // show a clean full-page loader to prevent the login component from flashing.
  if (loading || user) {
    return <LoadingSpinner fullScreen size="lg" label="Signing you in to Ajaia Docs…" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match.');
        return;
      }

      setPending('email-auth');
      try {
        const { error: signUpError } = await signUpWithPassword(
          email.trim(),
          password,
          name.trim() || undefined,
        );

        if (signUpError) {
          if (
            signUpError.message.toLowerCase().includes('rate limit') ||
            (signUpError as { status?: number }).status === 429
          ) {
            toast.error('Registration rate limit reached. Please try again in a few moments.');
          } else {
            toast.error(signUpError.message || 'Failed to create account.');
          }
        } else {
          toast.success('Account created successfully! Welcome to Ajaia Docs.');
          router.replace(redirectUrl);
        }
      } catch {
        toast.error('Failed to create account. Please try again.');
      } finally {
        setPending(null);
      }
    } else {
      setPending('email-auth');
      try {
        const { error: signInError } = await signInWithPassword(email.trim(), password);
        if (signInError) {
          toast.error(signInError.message || 'Invalid email or password.');
        } else {
          toast.success('Signed in successfully!');
          router.replace(redirectUrl);
        }
      } catch {
        toast.error('Failed to sign in. Please verify your credentials and try again.');
      } finally {
        setPending(null);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setPending('google');
    try {
      await signInWithOAuth('google');
    } catch {
      toast.error('Failed to connect with Google. Please try again.');
      setPending(null);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafaf9] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Ajaia Docs</h1>
          <p className="mt-1 text-sm text-gray-500">
            {mode === 'signin' ? 'Sign in to access your documents' : 'Create an account to get started'}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="mt-6 flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${
              mode === 'signin'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${
              mode === 'signup'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                disabled={pending !== null}
                className="mt-1.5 w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 disabled:bg-gray-50"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={pending !== null}
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={pending !== null}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 disabled:bg-gray-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={pending !== null}
                className="mt-1.5 w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 disabled:bg-gray-50"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={pending !== null}
            className="mt-2 flex w-full items-center justify-center rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
          >
            {pending === 'email-auth' ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                <span>{mode === 'signin' ? 'Signing in…' : 'Creating account…'}</span>
              </span>
            ) : mode === 'signin' ? (
              'Sign In with Email'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400">Or continue with</span>
          </div>
        </div>

        {/* Single Social Login: Google */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={pending !== null}
            className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
          >
            {pending === 'google' ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span>Connecting to Google…</span>
              </span>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Footer info / Toggle hint */}
        <p className="mt-8 text-center text-xs text-gray-500">
          {mode === 'signin' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="font-medium text-indigo-600 hover:text-indigo-500 underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="font-medium text-indigo-600 hover:text-indigo-500 underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen size="lg" label="Signing you in to Ajaia Docs…" />}>
      <LoginForm />
    </Suspense>
  );
}
