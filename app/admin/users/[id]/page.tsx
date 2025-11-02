import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { ArrowLeft, User, Envelope, Phone, Calendar, CheckCircle, XCircle, Clock, MapPin } from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  // Fetch the user details
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (!userProfile) {
    redirect('/admin/users');
  }

  // Get email from auth
  const { data: authUser } = await supabase.auth.admin.getUserById(id);
  const userEmail = authUser?.user?.email;

  // Check if user has car_owner role
  const isCarOwner = userProfile.active_role === 'car_owner' || userProfile.roles?.includes('car_owner');

  // Get user's cars if owner
  let cars = null;
  if (isCarOwner) {
    const { data: carsData } = await supabase
      .from('cars')
      .select('*')
      .eq('owner_id', id);
    cars = carsData;
  }

  // Get user's rentals
  const { data: rentals } = await supabase
    .from('rentals')
    .select('*, cars:car_id(make, model, year)')
    .eq('renter_id', id);

  // Get user's verifications
  const { data: verifications } = await supabase
    .from('user_verifications')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'car_owner':
        return 'bg-purple-100 text-purple-800';
      case 'renter':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Navigation */}
      <AdminNavigation
        userFullName={profile?.full_name}
        userAvatar={profile?.avatar_url}
      />

      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 text-secondary-600 hover:text-primary-500 mb-6 font-semibold transition-colors"
          >
            <ArrowLeft size={20} weight="bold" />
            Back to Users
          </Link>

          {/* User Header */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="relative w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
                {userProfile.avatar_url ? (
                  <Image
                    src={userProfile.avatar_url}
                    alt={userProfile.full_name}
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <User size={48} weight="duotone" className="text-primary-500" />
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-secondary-900 mb-2">
                  {userProfile.full_name}
                </h1>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoleColor(userProfile.active_role)}`}>
                    {userProfile.active_role === 'car_owner' ? 'Car Owner' : userProfile.active_role?.charAt(0).toUpperCase() + userProfile.active_role?.slice(1)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(userProfile.verification_status)}`}>
                    {userProfile.verification_status?.charAt(0).toUpperCase() + userProfile.verification_status?.slice(1)}
                  </span>
                </div>
                <div className="space-y-2 text-secondary-600">
                  <div className="flex items-center gap-2">
                    <Envelope size={18} weight="duotone" />
                    <span>{userEmail}</span>
                  </div>
                  {userProfile.phone_number && (
                    <div className="flex items-center gap-2">
                      <Phone size={18} weight="duotone" />
                      <span>{userProfile.phone_number}</span>
                    </div>
                  )}
                  {userProfile.address && (
                    <div className="flex items-center gap-2">
                      <MapPin size={18} weight="duotone" />
                      <span>{userProfile.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar size={18} weight="duotone" />
                    <span>Joined {new Date(userProfile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className={`grid grid-cols-1 ${isCarOwner ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6 mb-6`}>
            {isCarOwner && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-sm font-semibold text-secondary-600 uppercase mb-2">Cars Listed</h3>
                <p className="text-3xl font-bold text-primary-500">{cars?.length || 0}</p>
              </div>
            )}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-sm font-semibold text-secondary-600 uppercase mb-2">Rentals Made</h3>
              <p className="text-3xl font-bold text-blue-500">{rentals?.length || 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-sm font-semibold text-secondary-600 uppercase mb-2">Verifications</h3>
              <p className="text-3xl font-bold text-green-500">{verifications?.length || 0}</p>
            </div>
          </div>

          {/* Details Tabs */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Cars Section */}
            {isCarOwner && cars && cars.length > 0 && (
              <div className="p-6 border-b border-secondary-200">
                <h2 className="text-xl font-bold text-secondary-900 mb-4">Listed Cars</h2>
                <div className="space-y-3">
                  {cars.map((car) => (
                    <div key={car.id} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-secondary-900">
                          {car.year} {car.make} {car.model}
                        </p>
                        <p className="text-sm text-secondary-600">{car.plate_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary-500">₱{parseFloat(car.daily_rate).toLocaleString()}/day</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${car.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {car.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rentals Section */}
            {rentals && rentals.length > 0 && (
              <div className="p-6 border-b border-secondary-200">
                <h2 className="text-xl font-bold text-secondary-900 mb-4">Rental History</h2>
                <div className="space-y-3">
                  {rentals.slice(0, 5).map((rental: any) => (
                    <div key={rental.id} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-secondary-900">
                          {rental.cars?.year} {rental.cars?.make} {rental.cars?.model}
                        </p>
                        <p className="text-sm text-secondary-600">
                          {new Date(rental.start_datetime).toLocaleDateString()} - {new Date(rental.end_datetime).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary-500">₱{parseFloat(rental.total_cost).toLocaleString()}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          rental.status === 'completed' ? 'bg-green-100 text-green-800' :
                          rental.status === 'active' ? 'bg-blue-100 text-blue-800' :
                          rental.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {rental.status?.charAt(0).toUpperCase() + rental.status?.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verifications Section */}
            {verifications && verifications.length > 0 && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-secondary-900 mb-4">Verification History</h2>
                <div className="space-y-3">
                  {verifications.map((verification: any) => (
                    <div key={verification.id} className="p-4 bg-secondary-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(verification.status)}`}>
                          {verification.status?.charAt(0).toUpperCase() + verification.status?.slice(1)}
                        </span>
                        <span className="text-sm text-secondary-600">
                          {new Date(verification.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {verification.admin_notes && (
                        <p className="text-sm text-secondary-600 mt-2">
                          <strong>Notes:</strong> {verification.admin_notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {(!isCarOwner || !cars || cars.length === 0) && (!rentals || rentals.length === 0) && (!verifications || verifications.length === 0) && (
              <div className="p-12 text-center text-secondary-500">
                No additional data available for this user.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
