import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import RenterNavigation from '@/components/renter/RenterNavigation';

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch booking details
  const { data: booking, error } = await supabase
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
        daily_rate,
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
        phone_number,
        email
      )
    `)
    .eq('id', id)
    .eq('renter_id', user.id)
    .single();

  if (error || !booking) {
    notFound();
  }

  const car = booking.cars;
  const owner = booking.profiles;
  const primaryImage = car?.car_images?.find((img: any) => img.is_primary) || car?.car_images?.[0];
  const imageSrc = primaryImage?.image_url || '/images/site/jamie-street-JtP_Dqtz6D8-unsplash.jpg';

  const startDate = new Date(booking.start_datetime);
  const endDate = new Date(booking.end_datetime);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-green-100 text-green-800 border-green-300',
      active: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-gray-100 text-gray-800 border-gray-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    };

    return styles[status as keyof typeof styles] || styles.pending;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <RenterNavigation
        userFullName={profile?.full_name}
        userAvatar={profile?.avatar_url}
        isVerified={profile?.verification_status === 'verified'}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/renter/bookings"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to My Bookings
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
              <p className="text-gray-600 mt-1">Booking ID: {booking.id.substring(0, 8)}...</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusBadge(booking.status)}`}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Information */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Vehicle Information
              </h2>

              {imageSrc && (
                <div className="relative aspect-[16/9] mb-4 rounded-xl overflow-hidden">
                  <Image
                    src={imageSrc}
                    alt={`${car?.make} ${car?.model}`}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Vehicle</p>
                  <p className="text-lg font-bold text-gray-900">
                    {car?.year} {car?.make} {car?.model}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Plate Number</p>
                  <p className="text-lg font-bold text-gray-900">{car?.plate_number}</p>
                </div>
                {car?.location && (
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="text-lg font-bold text-gray-900">{car.location}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Daily Rate</p>
                  <p className="text-lg font-bold text-blue-600">
                    ₱{Number(car?.daily_rate || 0).toLocaleString()}/day
                  </p>
                </div>
              </div>
            </div>

            {/* Owner Information */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Car Owner
              </h2>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                  {owner?.avatar_url ? (
                    <Image
                      src={owner.avatar_url}
                      alt={owner.full_name}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-600">
                      {owner?.full_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{owner?.full_name}</p>
                  {owner?.phone_number && (
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {owner.phone_number}
                    </p>
                  )}
                  {owner?.email && (
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {owner.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            {booking.notes && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Notes</h2>
                <p className="text-gray-700">{booking.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rental Period */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Rental Period
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Pick-up</p>
                  <p className="font-semibold text-gray-900">
                    {startDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {startDate.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-600 mb-1">Return</p>
                  <p className="font-semibold text-gray-900">
                    {endDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {endDate.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-600 mb-1">Duration</p>
                  <p className="font-semibold text-gray-900">
                    {totalDays} day{totalDays !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Payment
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 font-semibold">Total Amount:</span>
                  <span className="font-bold text-2xl text-gray-900">
                    ₱{Number(booking.total_amount).toLocaleString()}
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Payment Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${
                      booking.payment_status === 'paid' ? 'bg-green-100 text-green-800 border-green-300' :
                      booking.payment_status === 'partial' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                      'bg-yellow-100 text-yellow-800 border-yellow-300'
                    }`}>
                      {(booking.payment_status || 'pending').charAt(0).toUpperCase() + (booking.payment_status || 'pending').slice(1)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Daily rate: ₱{Number(car?.daily_rate || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
