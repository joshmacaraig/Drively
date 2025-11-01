'use client';

import Image from "next/image";
import Link from "next/link";
import { Car, CurrencyCircleDollar, CheckCircle, Shield, DeviceMobile, MapPin, MagnifyingGlass, Info, Clock, UserCheck, FileText } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);

      if (user) {
        // Fetch user role
        supabase
          .from('profiles')
          .select('active_role')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            setUserRole(data?.active_role || null);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        supabase
          .from('profiles')
          .select('active_role')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            setUserRole(data?.active_role || null);
          });
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getDashboardLink = () => {
    if (userRole === 'admin') return '/admin/dashboard';
    if (userRole === 'car_owner') return '/owner/dashboard';
    return '/renter/dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo2.png"
              alt="Drively Logo"
              width={120}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </div>
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-32 h-10 bg-secondary-200 animate-pulse rounded-lg"></div>
            ) : user ? (
              <Link
                href={getDashboardLink()}
                className="bg-secondary-900 hover:bg-secondary-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors text-sm"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-secondary-700 hover:text-secondary-900 font-medium transition-colors text-sm px-4 py-2"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-secondary-900 hover:bg-secondary-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors text-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative overflow-hidden">
        {/* Hero with Background Image */}
        <div className="relative min-h-[90vh] flex items-center">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/site/photo-1492144534655-ae79c964c9d7.jpg"
              alt="Car on scenic road"
              fill
              className="object-cover brightness-50"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
          </div>

          {/* Hero Content */}
          <div className="container mx-auto px-4 py-20 relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/20">
                <MapPin size={16} weight="fill" />
                <span>Quezon Province</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Rent Quality Cars<br />
                <span className="text-primary-400">In Your Community</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed">
                Book verified vehicles from trusted owners across Quezon Province. Safe, secure, and convenient car rentals for your journey.
              </p>

              {!user && (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/auth/signup?role=renter"
                    className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3.5 rounded-lg font-semibold text-base transition-colors shadow-lg flex items-center justify-center gap-2"
                  >
                    <MagnifyingGlass size={20} weight="bold" />
                    Browse Vehicles
                  </Link>
                  <Link
                    href="/owner"
                    className="bg-white/95 hover:bg-white text-secondary-900 px-8 py-3.5 rounded-lg font-semibold text-base transition-colors border border-white/50 shadow-lg flex items-center justify-center gap-2"
                  >
                    <Info size={20} weight="bold" />
                    For Car Owners
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-20">

          {/* Features */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Why Choose Drively
            </h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              A secure and transparent platform connecting renters with quality vehicles across the Philippines.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20 max-w-sm md:max-w-none mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all border border-secondary-100">
              <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <UserCheck size={32} weight="duotone" className="text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-3 text-center">
                Verified Owners
              </h3>
              <p className="text-secondary-600 leading-relaxed text-center">
                All car owners undergo thorough verification to ensure you rent from trusted individuals in your community.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all border border-secondary-100">
              <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <FileText size={32} weight="duotone" className="text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-3 text-center">
                Documented Process
              </h3>
              <p className="text-secondary-600 leading-relaxed text-center">
                Complete pickup and return checklists with photo documentation ensure transparency and accountability.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all border border-secondary-100">
              <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <Clock size={32} weight="duotone" className="text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-3 text-center">
                Flexible Booking
              </h3>
              <p className="text-secondary-600 leading-relaxed text-center">
                Book vehicles for the exact dates you need with transparent pricing and clear rental terms.
              </p>
            </div>
          </div>

          {/* Featured Vehicles - Gallery */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
                Featured Vehicles
              </h2>
              <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
                Discover quality vehicles available across Quezon Province
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden group shadow-lg hover:shadow-2xl transition-shadow">
                <Image
                  src="/images/site/jamie-street-JtP_Dqtz6D8-unsplash.jpg"
                  alt="Luxury sedan"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <div className="text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-xl font-bold mb-1">Luxury Sedans</h3>
                    <p className="text-sm text-gray-200">Comfortable & stylish rides</p>
                  </div>
                </div>
              </div>

              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden group shadow-lg hover:shadow-2xl transition-shadow">
                <Image
                  src="/images/site/photo-1565043666747-69f6646db940.jpg"
                  alt="SUV"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <div className="text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-xl font-bold mb-1">SUVs & Crossovers</h3>
                    <p className="text-sm text-gray-200">Perfect for family adventures</p>
                  </div>
                </div>
              </div>

              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden group shadow-lg hover:shadow-2xl transition-shadow">
                <Image
                  src="/images/site/devon-janse-van-rensburg-1YGYCKdb8y4-unsplash.jpg"
                  alt="Van"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <div className="text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-xl font-bold mb-1">Vans</h3>
                    <p className="text-sm text-gray-200">Spacious for groups</p>
                  </div>
                </div>
              </div>

              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden group shadow-lg hover:shadow-2xl transition-shadow">
                <Image
                  src="/images/site/jamie-street-jYVnwIc1H-c-unsplash.jpg"
                  alt="Sports car"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <div className="text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-xl font-bold mb-1">Sports Cars</h3>
                    <p className="text-sm text-gray-200">For the thrill seekers</p>
                  </div>
                </div>
              </div>

              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden group shadow-lg hover:shadow-2xl transition-shadow">
                <Image
                  src="/images/site/jessica-furtney-sc7n5Xo-w1o-unsplash.jpg"
                  alt="Classic car"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <div className="text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-xl font-bold mb-1">Premium Vehicles</h3>
                    <p className="text-sm text-gray-200">Luxury experiences</p>
                  </div>
                </div>
              </div>

              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden group shadow-lg hover:shadow-2xl transition-shadow">
                <Image
                  src="/images/site/martin-katler-ZA9ZwElRtL4-unsplash.jpg"
                  alt="Compact car"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <div className="text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-xl font-bold mb-1">Compact Cars</h3>
                    <p className="text-sm text-gray-200">Efficient city driving</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
                How to Rent a Car
              </h2>
              <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
                Three simple steps to get on the road with Drively
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-white p-8 md:p-12 rounded-2xl shadow-md border border-secondary-100">
                <div className="space-y-8">
                  <div className="flex gap-6 items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-500 text-white rounded-xl flex items-center justify-center font-bold text-xl">
                      1
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-secondary-900 mb-2">Create Account & Verify</h3>
                      <p className="text-secondary-600 leading-relaxed">
                        Sign up and complete the verification process by submitting your PhilSys ID, proof of address, and valid driver's license.
                      </p>
                    </div>
                  </div>

                  <div className="border-l-2 border-secondary-200 ml-6 h-8"></div>

                  <div className="flex gap-6 items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-500 text-white rounded-xl flex items-center justify-center font-bold text-xl">
                      2
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-secondary-900 mb-2">Browse & Book Vehicle</h3>
                      <p className="text-secondary-600 leading-relaxed">
                        Search available cars, review details and pricing, select your rental dates, and submit your booking request to the owner.
                      </p>
                    </div>
                  </div>

                  <div className="border-l-2 border-secondary-200 ml-6 h-8"></div>

                  <div className="flex gap-6 items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-500 text-white rounded-xl flex items-center justify-center font-bold text-xl">
                      3
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-secondary-900 mb-2">Pick Up & Drive</h3>
                      <p className="text-secondary-600 leading-relaxed">
                        Meet the owner, complete the pickup checklist with photos, receive the keys, and enjoy your trip. Return with the same process.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Final CTA Section */}
          {!user && (
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <div className="absolute inset-0">
                <Image
                  src="/images/site/kevin-bonilla-YPfnvLc3bbQ-unsplash.jpg"
                  alt="Car interior"
                  fill
                  className="object-cover brightness-[0.35]"
                />
              </div>
              <div className="relative z-10 p-12 md:p-16 text-center text-white">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Start Renting Today
                </h2>
                <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
                  Join our car sharing community and discover convenient transportation solutions across the Philippines.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/auth/signup?role=renter"
                    className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3.5 rounded-lg font-semibold text-base transition-colors shadow-lg flex items-center justify-center gap-2"
                  >
                    <Car size={20} weight="bold" />
                    Get Started
                  </Link>
                  <Link
                    href="/owner"
                    className="bg-white hover:bg-gray-50 text-secondary-900 px-8 py-3.5 rounded-lg font-semibold text-base transition-colors border border-gray-200 shadow-lg flex items-center justify-center gap-2"
                  >
                    <Info size={20} weight="bold" />
                    For Car Owners
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <Image
                src="/images/logo2.png"
                alt="Drively Logo"
                width={180}
                height={60}
                className="h-14 w-auto mb-4 brightness-0 invert"
              />
              <p className="text-secondary-400 text-sm">
                A peer-to-peer car rental platform serving Candelaria, Quezon.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2 text-secondary-400 text-sm">
                <li>
                  <Link href="/auth/signup?role=renter" className="hover:text-primary-400 transition-colors">
                    Find a Car
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup?role=owner" className="hover:text-primary-400 transition-colors">
                    List Your Car
                  </Link>
                </li>
                <li>
                  <Link href="/auth/login" className="hover:text-primary-400 transition-colors">
                    Login
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Coverage Area</h3>
              <div className="flex items-start gap-2 text-secondary-400 text-sm">
                <MapPin size={16} weight="fill" className="mt-1 flex-shrink-0" />
                <span>Quezon Province<br />Philippines</span>
              </div>
            </div>
          </div>

          <div className="border-t border-secondary-800 pt-8 text-center">
            <p className="text-secondary-500 text-sm">
              © 2025 Drively. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
