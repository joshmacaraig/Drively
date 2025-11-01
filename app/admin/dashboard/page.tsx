import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AdminNavigation from '@/components/admin/AdminNavigation';

export default async function AdminDashboard() {
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

  // Check if user is admin
  if (profile?.active_role !== 'admin') {
    redirect('/');
  }

  // Fetch dashboard statistics
  const [
    { count: totalUsers },
    { count: totalCars },
    { count: activeRentals },
    { count: pendingVerifications },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('cars').select('*', { count: 'exact', head: true }),
    supabase
      .from('rentals')
      .select('*', { count: 'exact', head: true })
      .in('status', ['confirmed', 'active']),
    supabase
      .from('verification_documents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Navigation */}
      <AdminNavigation
        userFullName={profile?.full_name}
        userAvatar={profile?.avatar_url}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-2">
                Welcome back, {profile?.full_name}!
              </h1>
              <p className="text-sm md:text-base text-secondary-600">
                Admin Dashboard
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-primary-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  Total Users
                </h3>
                <p className="text-3xl font-bold text-primary-500">
                  {totalUsers || 0}
                </p>
              </div>

              <div className="bg-primary-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  Total Cars
                </h3>
                <p className="text-3xl font-bold text-primary-500">
                  {totalCars || 0}
                </p>
              </div>

              <div className="bg-primary-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  Active Rentals
                </h3>
                <p className="text-3xl font-bold text-primary-500">
                  {activeRentals || 0}
                </p>
              </div>

              <div className="bg-primary-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  Pending Verifications
                </h3>
                <p className="text-3xl font-bold text-primary-500">
                  {pendingVerifications || 0}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold text-secondary-900 mb-4">
                Admin Tools
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Link
                  href="/admin/verifications"
                  className="p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 transition-colors"
                >
                  <h3 className="font-semibold text-secondary-900 mb-1">
                    Verify Users
                  </h3>
                  <p className="text-sm text-secondary-600">
                    Review pending verifications
                  </p>
                </Link>

                <Link
                  href="/admin/users"
                  className="p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 transition-colors"
                >
                  <h3 className="font-semibold text-secondary-900 mb-1">
                    Manage Users
                  </h3>
                  <p className="text-sm text-secondary-600">
                    View and edit user accounts
                  </p>
                </Link>

                <Link
                  href="/admin/cars"
                  className="p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 transition-colors"
                >
                  <h3 className="font-semibold text-secondary-900 mb-1">
                    Manage Cars
                  </h3>
                  <p className="text-sm text-secondary-600">
                    View all listed vehicles
                  </p>
                </Link>

                <Link
                  href="/admin/rentals"
                  className="p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 transition-colors"
                >
                  <h3 className="font-semibold text-secondary-900 mb-1">
                    Manage Rentals
                  </h3>
                  <p className="text-sm text-secondary-600">
                    View all rental transactions
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
