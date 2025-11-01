'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LockKey, CheckCircle } from '@phosphor-icons/react';
import AuthHeader from '@/components/auth/AuthHeader';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(true);

  useEffect(() => {
    // Check if we have a valid session from the email link
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setValidToken(false);
        setError('Invalid or expired reset link. Please request a new password reset.');
      }
    };

    checkSession();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col">
      <AuthHeader />

      {/* Reset Password Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {!validToken ? (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <LockKey size={32} weight="duotone" className="text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-secondary-900 mb-4 text-center">
                Invalid Reset Link
              </h1>
              <p className="text-secondary-600 mb-6 text-center">
                {error}
              </p>
              <div className="space-y-3">
                <Link
                  href="/auth/forgot-password"
                  className="block w-full bg-secondary-900 hover:bg-secondary-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center"
                >
                  Request New Reset Link
                </Link>
                <Link
                  href="/auth/login"
                  className="block w-full text-secondary-600 hover:text-secondary-900 font-medium py-3 transition-colors text-center"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          ) : !success ? (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-secondary-900 mb-2">
                  Reset Password
                </h1>
                <p className="text-secondary-600">
                  Enter your new password below
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-secondary-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <LockKey size={20} className="text-secondary-400" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                      minLength={8}
                      disabled={loading}
                    />
                  </div>
                  <p className="mt-2 text-xs text-secondary-500">
                    Must be at least 8 characters long
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-secondary-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <LockKey size={20} className="text-secondary-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                      minLength={8}
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-secondary-900 hover:bg-secondary-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/auth/login"
                  className="text-secondary-600 hover:text-secondary-900 font-medium transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} weight="duotone" className="text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-secondary-900 mb-4">
                Password Reset Successful
              </h1>
              <p className="text-secondary-600 mb-6">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <p className="text-sm text-secondary-500 mb-6">
                Redirecting to login page...
              </p>
              <Link
                href="/auth/login"
                className="inline-block bg-secondary-900 hover:bg-secondary-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Go to Login
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
