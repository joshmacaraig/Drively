import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import OwnerNavigation from '@/components/owner/OwnerNavigation';
import { Warning, IdentificationCard } from '@phosphor-icons/react/dist/ssr';

export default async function OwnerDashboard() {
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

  // Fetch user's cars count
  const { data: cars } = await supabase
    .from('cars')
    .select('id, is_active')
    .eq('owner_id', user.id);

  // Fetch active rentals count
  const { data: rentals } = await supabase
    .from('rentals')
    .select('id, total_amount')
    .eq('owner_id', user.id)
    .in('status', ['active', 'confirmed']);

  const totalCars = cars?.length || 0;
  const activeRentals = rentals?.length || 0;
  const totalEarnings = rentals?.reduce((sum, rental) => sum + parseFloat(rental.total_amount), 0) || 0;

  const isVerified = profile?.verification_status === 'verified';
  const hasProofOfId = profile?.proof_of_id_urls?.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Navigation */}
      <OwnerNavigation
        userFullName={profile?.full_name}
        userAvatar={profile?.avatar_url}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Verification Warning Banner */}
          {!isVerified && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 md:p-6 mb-6 shadow-lg">
              <div className="flex gap-3">
                <Warning size={24} weight="fill" className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-base md:text-lg font-bold text-yellow-900 mb-1">
                    Verification Required
                  </h3>
                  <p className="text-sm md:text-base text-yellow-800 mb-3">
                    Your car listings are hidden from renters until you verify your identity.
                    {!hasProofOfId && ' Upload your government-issued ID to get verified.'}
                    {hasProofOfId && profile?.verification_status === 'pending' && ' Your documents are under review.'}
                  </p>
                  <Link
                    href="/owner/profile"
                    className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                  >
                    <IdentificationCard size={20} weight="duotone" />
                    {!hasProofOfId ? 'Upload ID Now' : 'View Verification Status'}
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-2">
                Welcome back, {profile?.full_name}!
              </h1>
              <p className="text-sm md:text-base text-secondary-600">
                Car Owner Dashboard
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-primary-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  My Cars
                </h3>
                <p className="text-3xl font-bold text-primary-500">{totalCars}</p>
              </div>

              <div className="bg-primary-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  Active Rentals
                </h3>
                <p className="text-3xl font-bold text-primary-500">{activeRentals}</p>
              </div>

              <div className="bg-primary-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  Total Earnings
                </h3>
                <p className="text-3xl font-bold text-primary-500">₱{totalEarnings.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold text-secondary-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  href="/owner/cars"
                  className="p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 transition-colors"
                >
                  <h3 className="font-semibold text-secondary-900 mb-1">
                    My Cars
                  </h3>
                  <p className="text-sm text-secondary-600">
                    View all your listed vehicles
                  </p>
                </Link>

                <Link
                  href="/owner/cars/new"
                  className="p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 transition-colors"
                >
                  <h3 className="font-semibold text-secondary-900 mb-1">
                    List a New Car
                  </h3>
                  <p className="text-sm text-secondary-600">
                    Add a vehicle to rent out
                  </p>
                </Link>

                <Link
                  href="/owner/rentals"
                  className="p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 transition-colors"
                >
                  <h3 className="font-semibold text-secondary-900 mb-1">
                    Manage Rentals
                  </h3>
                  <p className="text-sm text-secondary-600">
                    View and manage bookings
                  </p>
                </Link>

                <Link
                  href="/owner/maintenance"
                  className="p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 transition-colors"
                >
                  <h3 className="font-semibold text-secondary-900 mb-1">
                    Maintenance
                  </h3>
                  <p className="text-sm text-secondary-600">
                    Track vehicle maintenance
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
