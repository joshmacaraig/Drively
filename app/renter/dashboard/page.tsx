import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import RenterNavigation from '@/components/renter/RenterNavigation';

export default async function RenterDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Check verification status
  const isVerified = profile?.verification_status === 'verified';
  const hasUploadedDocs = profile?.proof_of_id_urls?.length > 0 || profile?.proof_of_address_urls?.length > 0 || profile?.drivers_license_urls?.length > 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <RenterNavigation
        userFullName={profile?.full_name}
        userAvatar={profile?.avatar_url}
        isVerified={isVerified}
      />

      {/* Verification Banner */}
      {!isVerified && (
        <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="min-w-0">
                  <p className="font-semibold text-sm sm:text-base">Complete your profile to start booking</p>
                  <p className="text-xs sm:text-sm text-white/90">
                    {hasUploadedDocs
                      ? 'Under review. We\'ll notify you once verified.'
                      : 'Upload your verification documents.'}
                  </p>
                </div>
              </div>
              {!hasUploadedDocs && (
                <Link
                  href="/renter/profile"
                  className="bg-white text-red-600 px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap flex-shrink-0"
                >
                  Verify
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="text-4xl font-semibold text-gray-900 mb-2">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-gray-600 text-lg">
            {isVerified ? 'Ready to find your next vehicle?' : 'Start by completing your profile'}
          </p>
        </div>

        {/* Explore Section - Airbnb Style */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Explore nearby
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Quick Action Cards */}
            <Link
              href="/renter/browse"
              className="group relative overflow-hidden rounded-xl hover:shadow-lg transition-all"
            >
              <div className="aspect-[4/3] relative">
                <Image
                  src="/images/site/jamie-street-JtP_Dqtz6D8-unsplash.jpg"
                  alt="Browse vehicles"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-semibold text-lg">Browse Vehicles</h3>
                  <p className="text-sm text-white/90">Find your perfect ride</p>
                </div>
              </div>
            </Link>

            <Link
              href="/renter/bookings"
              className="group relative overflow-hidden rounded-xl hover:shadow-lg transition-all"
            >
              <div className="aspect-[4/3] relative">
                <Image
                  src="/images/site/photo-1565043666747-69f6646db940.jpg"
                  alt="My bookings"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-semibold text-lg">My Bookings</h3>
                  <p className="text-sm text-white/90">View your rentals</p>
                </div>
              </div>
            </Link>

            <Link
              href="/renter/profile"
              className="group relative overflow-hidden rounded-xl hover:shadow-lg transition-all"
            >
              <div className="aspect-[4/3] relative bg-gradient-to-br from-primary-400 to-primary-600">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-16 h-16 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-semibold text-lg">My Profile</h3>
                  <p className="text-sm text-white/90">
                    {isVerified ? 'Manage account' : 'Complete verification'}
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/renter/browse?category=premium"
              className="group relative overflow-hidden rounded-xl hover:shadow-lg transition-all"
            >
              <div className="aspect-[4/3] relative">
                <Image
                  src="/images/site/jessica-furtney-sc7n5Xo-w1o-unsplash.jpg"
                  alt="Premium vehicles"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-semibold text-lg">Premium Selection</h3>
                  <p className="text-sm text-white/90">Luxury vehicles</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Your trips section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Your trips
            </h2>
            <Link
              href="/renter/bookings"
              className="text-sm font-semibold text-gray-900 hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="bg-gray-50 rounded-2xl p-12 text-center">
            <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No trips yet
            </h3>
            <p className="text-gray-600 mb-6">
              {isVerified
                ? 'Start planning your next adventure by browsing available vehicles.'
                : 'Complete your profile verification to start booking vehicles.'}
            </p>
            <Link
              href={isVerified ? "/renter/browse" : "/renter/profile"}
              className="inline-block bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {isVerified ? 'Explore vehicles' : 'Complete profile'}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
