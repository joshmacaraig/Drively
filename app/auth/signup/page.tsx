'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  EnvelopeSimple,
  LockKey,
  User,
  Phone,
  UserPlus,
  Car,
  CurrencyCircleDollar,
  CheckCircle
} from '@phosphor-icons/react';
import type { UserRole } from '@/lib/types/database';
import AuthHeader from '@/components/auth/AuthHeader';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('renter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (roleParam === 'owner') {
      setRole('car_owner');
    } else if (roleParam === 'renter') {
      setRole('renter');
    }
  }, [roleParam]);

  const handleSignup = async (e: React.FormEvent) => {
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

      // Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
            phone_number: phone,
            active_role: role,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Show success message asking user to verify email
        setSuccess(true);
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col">
      <AuthHeader />

      {/* Signup Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {!success ? (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-secondary-900 mb-2">
                  Create Account
                </h1>
                <p className="text-secondary-600">
                  Join Drively and start your journey
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

            {/* Role Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-secondary-700 mb-3">
                I want to
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('renter')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    role === 'renter'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-secondary-200 hover:border-secondary-300'
                  }`}
                >
                  <Car size={32} weight="duotone" className={role === 'renter' ? 'text-primary-500 mx-auto mb-2' : 'text-secondary-400 mx-auto mb-2'} />
                  <p className={`text-sm font-semibold ${role === 'renter' ? 'text-primary-700' : 'text-secondary-700'}`}>
                    Rent a Car
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('car_owner')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    role === 'car_owner'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-secondary-200 hover:border-secondary-300'
                  }`}
                >
                  <CurrencyCircleDollar size={32} weight="duotone" className={role === 'car_owner' ? 'text-primary-500 mx-auto mb-2' : 'text-secondary-400 mx-auto mb-2'} />
                  <p className={`text-sm font-semibold ${role === 'car_owner' ? 'text-primary-700' : 'text-secondary-700'}`}>
                    List My Car
                  </p>
                </button>
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-secondary-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-400">
                    <User size={20} weight="duotone" />
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors bg-white text-gray-900 placeholder:text-gray-500"
                    placeholder="Juan Dela Cruz"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-400">
                    <EnvelopeSimple size={20} weight="duotone" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors bg-white text-gray-900 placeholder:text-gray-500"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-400">
                    <Phone size={20} weight="duotone" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors bg-white text-gray-900 placeholder:text-gray-500"
                    placeholder="+63 912 345 6789"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-400">
                    <LockKey size={20} weight="duotone" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors bg-white text-gray-900 placeholder:text-gray-500"
                    placeholder="••••••••"
                    minLength={8}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-400">
                    <LockKey size={20} weight="duotone" />
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors bg-white text-gray-900 placeholder:text-gray-500"
                    placeholder="••••••••"
                    minLength={8}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary-900 hover:bg-secondary-800 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus size={20} weight="duotone" />
                    Create Account
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-secondary-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-secondary-900 hover:text-secondary-700 font-semibold">
                  Sign in
                </Link>
              </p>
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
                We've sent a verification link to <strong>{email}</strong>.
                Please check your email and click the link to verify your account.
              </p>
              <p className="text-sm text-secondary-500 mb-6">
                Didn't receive the email? Check your spam folder.
              </p>
              <div className="space-y-3">
                <Link
                  href="/auth/login"
                  className="block w-full bg-secondary-900 hover:bg-secondary-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Go to Login
                </Link>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  className="w-full text-secondary-600 hover:text-secondary-900 font-medium py-3 transition-colors"
                >
                  Sign up with different email
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
