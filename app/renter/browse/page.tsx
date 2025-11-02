import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import RenterNavigation from '@/components/renter/RenterNavigation';
import VehicleCard from '@/components/renter/VehicleCard';
import BrowseFilters from '@/components/renter/BrowseFilters';
import Pagination from '@/components/admin/Pagination';

const ITEMS_PER_PAGE = 12;

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    start_date?: string;
    end_date?: string;
    transmission?: string;
    fuel_type?: string;
    min_price?: string;
    max_price?: string;
    seats?: string;
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

  // Await searchParams (Next.js 15 requirement)
  const params = await searchParams;

  // Pagination
  const currentPage = parseInt(params.page || '1');
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // Check if dates are provided for availability filtering
  const startDate = params.start_date;
  const endDate = params.end_date;
  let availableCarIds: string[] | null = null;

  // If both dates are provided, use RPC function to get available cars
  if (startDate && endDate) {
    const { data: availableCars, error: rpcError } = await supabase.rpc('get_available_cars', {
      start_date_param: startDate,
      end_date_param: endDate,
    });

    if (!rpcError && availableCars) {
      availableCarIds = availableCars.map((item: { car_id: string }) => item.car_id);
    }
  }

  // Build base query for counting
  let countQuery = supabase
    .from('cars')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  // Build query for active cars with all related data
  let query = supabase
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
        avatar_url
      ),
      rentals (
        id,
        start_datetime,
        end_datetime,
        status
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // If we have date-filtered availability, apply it
  if (availableCarIds !== null) {
    if (availableCarIds.length === 0) {
      // No cars available for these dates, return empty array
      query = query.eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID
      countQuery = countQuery.eq('id', '00000000-0000-0000-0000-000000000000');
    } else {
      query = query.in('id', availableCarIds);
      countQuery = countQuery.in('id', availableCarIds);
    }
  }

  // Apply filters
  if (params.search) {
    const search = params.search.toLowerCase();
    query = query.or(`make.ilike.%${search}%,model.ilike.%${search}%,location.ilike.%${search}%`);
    countQuery = countQuery.or(`make.ilike.%${search}%,model.ilike.%${search}%,location.ilike.%${search}%`);
  }

  if (params.transmission) {
    query = query.eq('transmission', params.transmission);
    countQuery = countQuery.eq('transmission', params.transmission);
  }

  if (params.fuel_type) {
    query = query.eq('fuel_type', params.fuel_type);
    countQuery = countQuery.eq('fuel_type', params.fuel_type);
  }

  if (params.min_price) {
    query = query.gte('daily_rate', parseFloat(params.min_price));
    countQuery = countQuery.gte('daily_rate', parseFloat(params.min_price));
  }

  if (params.max_price) {
    query = query.lte('daily_rate', parseFloat(params.max_price));
    countQuery = countQuery.lte('daily_rate', parseFloat(params.max_price));
  }

  if (params.seats) {
    query = query.gte('seats', parseInt(params.seats));
    countQuery = countQuery.gte('seats', parseInt(params.seats));
  }

  // Get total count
  const { count: totalCount } = await countQuery;
  const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE);

  // Apply pagination
  const { data: cars, error } = await query.range(offset, offset + ITEMS_PER_PAGE - 1);

  if (error) {
    console.error('Error fetching cars:', error);
  }

  // Check verification status
  const isVerified = profile?.verification_status === 'verified';

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
                  <p className="font-semibold text-sm sm:text-base">Verification required to book</p>
                  <p className="text-xs sm:text-sm text-white/90 hidden sm:block">
                    Complete your profile verification to start making bookings.
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
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold text-gray-900 mb-2">
            Browse Vehicles
          </h1>
          <p className="text-gray-600 text-lg">
            {totalCount || 0} vehicles available
            {startDate && endDate && (
              <>
                {' '}for{' '}
                <span className="font-semibold text-gray-900">
                  {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {' - '}
                  {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </>
            )}
          </p>
        </div>

        {/* Filters */}
        <BrowseFilters />

        {/* Results */}
        {cars && cars.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cars.map((car) => (
                <VehicleCard
                  key={car.id}
                  car={car}
                  isVerified={isVerified}
                  startDate={startDate}
                  endDate={endDate}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount || 0}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </>
        ) : (
          <div className="text-center py-16">
            <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No vehicles found
            </h3>
            <p className="text-gray-600 mb-6">
              {startDate && endDate ? (
                <>No vehicles are available for the selected dates. Try different dates or adjust your filters.</>
              ) : (
                <>Try adjusting your search or filters to find more vehicles.</>
              )}
            </p>
            <Link
              href="/renter/browse"
              className="inline-block bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Clear all filters
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
