import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import RenterNavigation from '@/components/renter/RenterNavigation';
import Pagination from '@/components/admin/Pagination';

const ITEMS_PER_PAGE = 10;

export default async function RenterBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
  }>;
}) {
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

  // Pagination
  const params = await searchParams;
  const currentPage = parseInt(params.page || '1');
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // Get total count
  const { count: totalCount } = await supabase
    .from('rentals')
    .select('*', { count: 'exact', head: true })
    .eq('renter_id', user.id);

  const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE);

  // Fetch bookings for this renter with pagination
  const { data: bookings, error } = await supabase
    .from('rentals')
    .select(`
      *,
      cars:car_id (
        id,
        make,
        model,
        year,
        plate_number,
        location,
        car_images (
          id,
          image_url,
          is_primary,
          display_order
        )
      ),
      profiles:owner_id (
        id,
        full_name,
        avatar_url,
        phone_number
      )
    `)
    .eq('renter_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1);

  if (error) {
    console.error('Error fetching bookings:', error);
  }

  // Group bookings by status
  const upcomingBookings = bookings?.filter((b) =>
    ['pending', 'confirmed'].includes(b.status) &&
    new Date(b.start_datetime) > new Date()
  ) || [];

  const activeBookings = bookings?.filter((b) =>
    b.status === 'active'
  ) || [];

  const pastBookings = bookings?.filter((b) =>
    ['completed', 'cancelled'].includes(b.status) ||
    (new Date(b.end_datetime) < new Date() && b.status !== 'active')
  ) || [];

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          styles[status as keyof typeof styles] || styles.pending
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const BookingCard = ({ booking }: { booking: any }) => {
    const car = booking.cars;
    const owner = booking.profiles;
    const primaryImage = car?.car_images?.find((img: any) => img.is_primary) || car?.car_images?.[0];
    const imageSrc = primaryImage?.image_url || '/images/site/jamie-street-JtP_Dqtz6D8-unsplash.jpg';

    const startDate = new Date(booking.start_datetime);
    const endDate = new Date(booking.end_datetime);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Image */}
          <div className="relative aspect-[4/3] md:aspect-auto md:h-full">
            <Image
              src={imageSrc}
              alt={`${car?.make} ${car?.model}`}
              fill
              className="object-cover"
            />
            {/* Status Badge Overlay */}
            <div className="absolute top-3 right-3">
              {getStatusBadge(booking.status)}
            </div>
          </div>

          {/* Details */}
          <div className="col-span-2 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {car?.year} {car?.make} {car?.model}
                </h3>
                {car?.location && (
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {car.location}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  ₱{Number(booking.total_amount).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">{totalDays} day{totalDays !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Pick-up</p>
                <p className="text-sm font-semibold text-gray-900">
                  {startDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-xs text-gray-600">
                  {startDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Return</p>
                <p className="text-sm font-semibold text-gray-900">
                  {endDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-xs text-gray-600">
                  {endDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Owner Info */}
            {owner && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                    {owner.avatar_url ? (
                      <Image
                        src={owner.avatar_url}
                        alt={owner.full_name}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-gray-600">
                        {owner.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{owner.full_name}</p>
                    <p className="text-xs text-gray-500">Owner</p>
                  </div>
                </div>

                {/* Action Button */}
                <Link
                  href={`/renter/bookings/${booking.id}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  View Details
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <RenterNavigation
        userFullName={profile?.full_name}
        userAvatar={profile?.avatar_url}
        isVerified={profile?.verification_status === 'verified'}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600 text-lg">
            {totalCount || 0} total booking{totalCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Bookings Sections */}
        {bookings && bookings.length > 0 ? (
          <div className="space-y-10">
            {/* Active Bookings */}
            {activeBookings.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Active Rentals ({activeBookings.length})
                </h2>
                <div className="space-y-4">
                  {activeBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Bookings */}
            {upcomingBookings.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Upcoming ({upcomingBookings.length})
                </h2>
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </div>
            )}

            {/* Past Bookings */}
            {pastBookings.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Past Bookings ({pastBookings.length})
                </h2>
                <div className="space-y-4">
                  {pastBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount || 0}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center">
            <svg
              className="w-20 h-20 text-gray-300 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No bookings yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start exploring vehicles and make your first booking
            </p>
            <Link
              href="/renter/browse"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Browse Vehicles
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
