import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import RenterNavigation from '@/components/renter/RenterNavigation';
import BookingForm from '@/components/renter/BookingForm';

export default async function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    start_date?: string;
    end_date?: string;
  }>;
}) {
  const supabase = await createClient();
  const { id } = await params;
  const { start_date, end_date } = await searchParams;

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

  // Check verification status
  const isVerified = profile?.verification_status === 'verified';

  // Fetch car details with images and owner
  const { data: car, error } = await supabase
    .from('cars')
    .select(`
      *,
      car_images (
        id,
        image_url,
        is_primary,
        display_order
      ),
      profiles:owner_id (
        id,
        full_name,
        avatar_url,
        phone_number
      ),
      rentals (
        id,
        start_datetime,
        end_datetime,
        status
      )
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !car) {
    notFound();
  }

  // Sort images by display order, primary first
  const sortedImages = car.car_images?.sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.display_order - b.display_order;
  }) || [];

  // Get active rentals
  const activeRentals = car.rentals?.filter((r) =>
    ['pending', 'confirmed', 'active'].includes(r.status)
  ) || [];

  // Calculate price if dates are provided
  const totalDays =
    start_date && end_date
      ? Math.ceil((new Date(end_date).getTime() - new Date(start_date).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
  const totalPrice = totalDays > 0 ? totalDays * Number(car.daily_rate) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <RenterNavigation
        userFullName={profile?.full_name}
        userAvatar={profile?.avatar_url}
        isVerified={isVerified}
      />

      {/* Back Button - Mobile & Desktop */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <Link href="/renter/browse" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Browse</span>
          </Link>
        </div>
      </div>

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
                  <p className="font-semibold text-sm sm:text-base">Verification required to book</p>
                  <p className="text-xs sm:text-sm text-white/90 hidden sm:block">
                    Complete your profile verification to continue.
                  </p>
                </div>
              </div>
              <Link
                href="/renter/profile"
                className="bg-white text-red-600 px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap flex-shrink-0"
              >
                Verify
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              {sortedImages.length > 0 ? (
                <div className="space-y-4 p-4">
                  {/* Main Image */}
                  <div className="relative aspect-[16/10] overflow-hidden rounded-lg">
                    <Image
                      src={sortedImages[0].image_url}
                      alt={`${car.make} ${car.model}`}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  {/* Thumbnail Grid */}
                  {sortedImages.length > 1 && (
                    <div className="grid grid-cols-4 gap-3">
                      {sortedImages.slice(1, 5).map((image) => (
                        <div key={image.id} className="relative aspect-square overflow-hidden rounded-lg">
                          <Image
                            src={image.image_url}
                            alt={`${car.make} ${car.model}`}
                            fill
                            className="object-cover hover:scale-105 transition-transform cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative aspect-[16/10] bg-gray-100 flex items-center justify-center">
                  <svg className="w-20 h-20 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Vehicle Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {car.year} {car.make} {car.model}
              </h1>
              {car.location && (
                <p className="text-gray-600 flex items-center gap-2 mb-6">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {car.location}
                </p>
              )}

              {/* Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {car.transmission && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <svg className="w-6 h-6 mx-auto mb-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm font-semibold text-gray-900 capitalize">{car.transmission}</p>
                    <p className="text-xs text-gray-500">Transmission</p>
                  </div>
                )}
                {car.fuel_type && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <svg className="w-6 h-6 mx-auto mb-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <p className="text-sm font-semibold text-gray-900 capitalize">{car.fuel_type}</p>
                    <p className="text-xs text-gray-500">Fuel Type</p>
                  </div>
                )}
                {car.seats && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <svg className="w-6 h-6 mx-auto mb-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-sm font-semibold text-gray-900">{car.seats} seats</p>
                    <p className="text-xs text-gray-500">Capacity</p>
                  </div>
                )}
                {car.color && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 mx-auto mb-2 rounded-full border-2 border-gray-300" style={{ backgroundColor: car.color.toLowerCase() }}></div>
                    <p className="text-sm font-semibold text-gray-900 capitalize">{car.color}</p>
                    <p className="text-xs text-gray-500">Color</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {car.description && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
                  <p className="text-gray-700 whitespace-pre-line">{car.description}</p>
                </div>
              )}

              {/* Features */}
              {car.features && car.features.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Features</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {car.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-gray-700">
                        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Owner Info */}
            {car.profiles && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Meet your host</h2>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                    {car.profiles.avatar_url ? (
                      <Image
                        src={car.profiles.avatar_url}
                        alt={car.profiles.full_name}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-gray-600">
                        {car.profiles.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-gray-900">{car.profiles.full_name}</p>
                    <p className="text-sm text-gray-600">Car Owner</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    ₱{car.daily_rate.toLocaleString()}
                  </span>
                  <span className="text-gray-600">/day</span>
                </div>
              </div>

              {/* Booking Form */}
              <BookingForm
                carId={car.id}
                dailyRate={Number(car.daily_rate)}
                ownerId={car.owner_id}
                renterId={user.id}
                initialStartDate={start_date}
                initialEndDate={end_date}
                isVerified={isVerified}
                activeRentals={activeRentals}
                pickupLocation={car.location}
              />

              {/* Price Breakdown */}
              {start_date && end_date && totalDays > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Price breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        ₱{car.daily_rate.toLocaleString()} × {totalDays} day{totalDays !== 1 ? 's' : ''}
                      </span>
                      <span className="text-gray-900">₱{totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">₱{totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
