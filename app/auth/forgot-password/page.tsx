'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { EnvelopeSimple, ArrowLeft, CheckCircle } from '@phosphor-icons/react';
import AuthHeader from '@/components/auth/AuthHeader';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        // Handle rate limit error gracefully
        if (error.message.includes('rate limit') || error.message.includes('Email rate limit exceeded')) {
          throw new Error('Too many password reset attempts. Please try again in a few minutes.');
        }
        throw error;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col">
      <AuthHeader />

      {/* Forgot Password Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {!success ? (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-secondary-900 mb-2">
                  Forgot Password?
                </h1>
                <p className="text-secondary-600">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-secondary-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <EnvelopeSimple size={20} className="text-secondary-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="your.email@example.com"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-secondary-900 hover:bg-secondary-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 text-secondary-600 hover:text-secondary-900 font-medium transition-colors"
                >
                  <ArrowLeft size={16} />
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
                Check Your Email
              </h1>
              <p className="text-secondary-600 mb-6">
                We've sent a password reset link to <strong>{email}</strong>.
                Click the link in the email to reset your password.
              </p>
              <p className="text-sm text-secondary-500 mb-6">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  className="w-full bg-secondary-100 hover:bg-secondary-200 text-secondary-900 font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Try Different Email
                </button>
                <Link
                  href="/auth/login"
                  className="block w-full text-secondary-600 hover:text-secondary-900 font-medium py-3 transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
