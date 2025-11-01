import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Palette,
  GearSix,
  GasPump,
  Users,
  CurrencyCircleDollar,
  MapPin,
  PencilSimple,
  CheckCircle,
} from '@phosphor-icons/react/dist/ssr';
import DeleteCarButton from '@/components/owner/DeleteCarButton';
import ChangeStatusButton from '@/components/owner/ChangeStatusButton';
import ImageGallery from '@/components/owner/ImageGallery';
import OwnerNavigation from '@/components/owner/OwnerNavigation';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CarDetailsPage(props: PageProps) {
  const params = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch car details
  const { data: car, error: carError } = await supabase
    .from('cars')
    .select('*')
    .eq('id', params.id)
    .eq('owner_id', user.id) // Ensure only owner can view
    .single();

  if (carError || !car) {
    notFound();
  }

  // Fetch car images
  const { data: images } = await supabase
    .from('car_images')
    .select('*')
    .eq('car_id', params.id)
    .order('display_order', { ascending: true });

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-700'
      : 'bg-gray-100 text-gray-700';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Navigation */}
      <OwnerNavigation
        userFullName={profile?.full_name}
        userAvatar={profile?.avatar_url}
      />

      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/owner/cars"
              className="inline-flex items-center gap-2 text-secondary-600 hover:text-primary-500 mb-4 transition-colors"
            >
              <ArrowLeft size={20} weight="duotone" />
              Back to My Cars
            </Link>
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-2">
                  {car.make} {car.model}
                </h1>
                <p className="text-secondary-600">
                  {car.year} • {car.plate_number}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <span className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-semibold ${getStatusColor(car.is_active)}`}>
                  {getStatusText(car.is_active)}
                </span>
                <ChangeStatusButton carId={car.id} currentStatus={car.is_active} />
                <Link
                  href={`/owner/cars/${car.id}/edit`}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-3 md:px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm md:text-base"
                >
                  <PencilSimple size={18} weight="duotone" className="md:w-5 md:h-5" />
                  <span>Edit</span>
                </Link>
                <DeleteCarButton carId={car.id} carName={`${car.make} ${car.model}`} />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Images & Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <ImageGallery images={images || []} carName={`${car.make} ${car.model}`} />

              {/* Description */}
              {car.description && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h2 className="text-xl font-bold text-secondary-900 mb-4">Description</h2>
                  <p className="text-secondary-600 whitespace-pre-line">{car.description}</p>
                </div>
              )}

              {/* Features */}
              {car.features && car.features.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h2 className="text-xl font-bold text-secondary-900 mb-4">Features</h2>
                  <div className="flex flex-wrap gap-2">
                    {car.features.map((feature: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium"
                      >
                        <CheckCircle size={16} weight="duotone" />
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Specs & Info */}
            <div className="space-y-6">
              {/* Pricing */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-secondary-900 mb-4">Pricing</h2>
                <div className="flex items-center gap-2">
                  <CurrencyCircleDollar size={32} weight="duotone" className="text-primary-500" />
                  <div>
                    <span className="text-3xl font-bold text-primary-500">
                      ₱{parseFloat(car.daily_rate).toLocaleString()}
                    </span>
                    <span className="text-secondary-600 ml-2">/day</span>
                  </div>
                </div>
              </div>

              {/* Specifications */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-secondary-900 mb-4">Specifications</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar size={20} weight="duotone" className="text-secondary-400" />
                    <div>
                      <p className="text-sm text-secondary-600">Year</p>
                      <p className="font-semibold text-secondary-900">{car.year}</p>
                    </div>
                  </div>

                  {car.color && (
                    <div className="flex items-center gap-3">
                      <Palette size={20} weight="duotone" className="text-secondary-400" />
                      <div>
                        <p className="text-sm text-secondary-600">Color</p>
                        <p className="font-semibold text-secondary-900">{car.color}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <GearSix size={20} weight="duotone" className="text-secondary-400" />
                    <div>
                      <p className="text-sm text-secondary-600">Transmission</p>
                      <p className="font-semibold text-secondary-900 capitalize">{car.transmission}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <GasPump size={20} weight="duotone" className="text-secondary-400" />
                    <div>
                      <p className="text-sm text-secondary-600">Fuel Type</p>
                      <p className="font-semibold text-secondary-900 capitalize">{car.fuel_type}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users size={20} weight="duotone" className="text-secondary-400" />
                    <div>
                      <p className="text-sm text-secondary-600">Seating Capacity</p>
                      <p className="font-semibold text-secondary-900">{car.seats} passengers</p>
                    </div>
                  </div>

                  {car.location && (
                    <div className="flex items-center gap-3">
                      <MapPin size={20} weight="duotone" className="text-secondary-400" />
                      <div>
                        <p className="text-sm text-secondary-600">Location</p>
                        <p className="font-semibold text-secondary-900">{car.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-secondary-900 mb-4">Statistics</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-secondary-600">Total Rentals</span>
                    <span className="font-bold text-secondary-900">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary-600">Total Earnings</span>
                    <span className="font-bold text-primary-500">₱0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary-600">Days Rented</span>
                    <span className="font-bold text-secondary-900">0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rental History (Placeholder) */}
          <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-secondary-900 mb-4">Rental History</h2>
            <div className="text-center py-12">
              <p className="text-secondary-600">No rental history yet</p>
              <p className="text-sm text-secondary-500 mt-2">
                Rental bookings will appear here once your car is rented
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
