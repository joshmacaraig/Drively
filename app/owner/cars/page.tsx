import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Car, Plus, MapPin, CurrencyCircleDollar, GearSix, Users } from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';
import OwnerNavigation from '@/components/owner/OwnerNavigation';
import Pagination from '@/components/admin/Pagination';

const ITEMS_PER_PAGE = 12;

export default async function OwnerCarsPage({
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

  // Pagination
  const params = await searchParams;
  const currentPage = parseInt(params.page || '1');
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // Get total count
  const { count: totalCount } = await supabase
    .from('cars')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', user.id);

  const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE);

  // Fetch user's cars with images and pagination
  const { data: cars, error } = await supabase
    .from('cars')
    .select(`
      *,
      car_images (
        id,
        image_url,
        is_primary,
        display_order
      )
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700';
      case 'rented':
        return 'bg-blue-100 text-blue-700';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-700';
      case 'inactive':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Navigation */}
      <OwnerNavigation
        userFullName={profile?.full_name}
        userAvatar={profile?.avatar_url}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-2">
                  My Cars
                </h1>
                <p className="text-sm md:text-base text-secondary-600">
                  Manage your vehicle listings
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/owner/cars/new"
                  className="flex-1 sm:flex-none bg-primary-500 hover:bg-primary-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <Plus size={20} weight="duotone" />
                  <span className="hidden sm:inline">Add New Car</span>
                  <span className="sm:hidden">Add Car</span>
                </Link>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-primary-50 p-4 rounded-lg">
                <p className="text-sm text-secondary-600 mb-1">Total Cars</p>
                <p className="text-2xl font-bold text-primary-500">{cars?.length || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-secondary-600 mb-1">Available</p>
                <p className="text-2xl font-bold text-green-600">
                  {cars?.filter(c => c.status === 'available').length || 0}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-secondary-600 mb-1">Rented</p>
                <p className="text-2xl font-bold text-blue-600">
                  {cars?.filter(c => c.status === 'rented').length || 0}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-secondary-600 mb-1">Maintenance</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {cars?.filter(c => c.status === 'maintenance').length || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Cars List */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              Failed to load cars. Please try again.
            </div>
          )}

          {!cars || cars.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <Car size={64} weight="duotone" className="mx-auto text-secondary-300 mb-4" />
              <h3 className="text-xl font-bold text-secondary-900 mb-2">
                No cars listed yet
              </h3>
              <p className="text-secondary-600 mb-6">
                Start earning by listing your first vehicle
              </p>
              <Link
                href="/owner/cars/new"
                className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                <Plus size={20} weight="duotone" />
                List Your First Car
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {cars.map((car: any) => {
                const primaryImage = car.car_images?.find((img: any) => img.is_primary);
                const displayImage = primaryImage || car.car_images?.[0];

                return (
                  <div
                    key={car.id}
                    className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow"
                  >
                    {/* Car Image */}
                    <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200">
                      {displayImage ? (
                        <Image
                          src={displayImage.image_url}
                          alt={`${car.make} ${car.model}`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Car size={64} weight="duotone" className="text-primary-500" />
                        </div>
                      )}
                    </div>

                  {/* Car Details */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-secondary-900">
                          {car.make} {car.model}
                        </h3>
                        <p className="text-secondary-600">{car.year} • {car.plate_number}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(car.status)}`}>
                        {getStatusText(car.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-secondary-600">
                        <GearSix size={16} weight="duotone" />
                        {car.transmission}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-secondary-600">
                        <Users size={16} weight="duotone" />
                        {car.seats} seats
                      </div>
                      {car.location && (
                        <div className="flex items-center gap-2 text-sm text-secondary-600 col-span-2">
                          <MapPin size={16} weight="duotone" />
                          {car.location}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-secondary-200">
                      <div className="flex items-center gap-2">
                        <CurrencyCircleDollar size={20} weight="duotone" className="text-primary-500" />
                        <span className="text-2xl font-bold text-primary-500">
                          ₱{parseFloat(car.daily_rate).toLocaleString()}
                        </span>
                        <span className="text-sm text-secondary-600">/day</span>
                      </div>
                      <Link
                        href={`/owner/cars/${car.id}`}
                        className="text-primary-500 hover:text-primary-600 font-semibold transition-colors"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount || 0}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          )}

          {/* Back to Dashboard */}
          <div className="mt-8 text-center">
            <Link
              href="/owner/dashboard"
              className="inline-flex items-center gap-2 text-secondary-600 hover:text-primary-500 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
