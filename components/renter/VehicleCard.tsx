'use client';

import Image from 'next/image';
import Link from 'next/link';

interface CarImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

interface Owner {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface Rental {
  id: string;
  start_datetime: string;
  end_datetime: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
}

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  transmission?: 'automatic' | 'manual';
  fuel_type?: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  seats?: number;
  daily_rate: number;
  location?: string;
  description?: string;
  features?: string[];
  car_images?: CarImage[];
  profiles?: Owner;
  rentals?: Rental[];
}

export default function VehicleCard({
  car,
  isVerified,
  startDate,
  endDate,
}: {
  car: Car;
  isVerified: boolean;
  startDate?: string;
  endDate?: string;
}) {
  // Get primary image or first image
  const primaryImage = car.car_images?.find((img) => img.is_primary) || car.car_images?.[0];
  const imageSrc = primaryImage?.image_url || '/images/site/jamie-street-JtP_Dqtz6D8-unsplash.jpg';

  // Build URL with dates if provided
  let vehicleUrl = `/renter/vehicles/${car.id}`;
  if (startDate && endDate) {
    vehicleUrl += `?start_date=${startDate}&end_date=${endDate}`;
  }

  // Calculate total days and price
  const totalDays =
    startDate && endDate
      ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
  const totalPrice = totalDays > 0 ? totalDays * Number(car.daily_rate) : 0;

  // Get active rentals (pending, confirmed, or active status)
  const activeRentals = car.rentals?.filter(r =>
    ['pending', 'confirmed', 'active'].includes(r.status)
  ) || [];

  // Find the nearest upcoming rental
  const now = new Date();
  const upcomingRentals = activeRentals
    .filter(r => new Date(r.start_datetime) > now)
    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());
  const nextRental = upcomingRentals[0];

  return (
    <Link
      href={isVerified ? vehicleUrl : '#'}
      className={`group block ${!isVerified ? 'cursor-not-allowed opacity-75' : ''}`}
      onClick={(e) => {
        if (!isVerified) {
          e.preventDefault();
          alert('Please complete your profile verification to view vehicle details and make bookings.');
        }
      }}
    >
      <div className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={imageSrc}
            alt={`${car.make} ${car.model}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Status badges */}
          {nextRental && !startDate && (
            <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
              Booked {new Date(nextRental.start_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          )}
          {/* Overlay badge if not verified */}
          {!isVerified && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white px-4 py-2 rounded-lg">
                <p className="text-sm font-semibold text-gray-900">Verification Required</p>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <div className="mb-3">
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary-600 transition-colors">
              {car.year} {car.make} {car.model}
            </h3>
            {car.location && (
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {car.location}
              </p>
            )}
          </div>

          {/* Specs */}
          <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
            {car.transmission && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="capitalize">{car.transmission}</span>
              </div>
            )}
            {car.fuel_type && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="capitalize">{car.fuel_type}</span>
              </div>
            )}
            {car.seats && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>{car.seats} seats</span>
              </div>
            )}
          </div>

          {/* Price & Owner */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              {totalDays > 0 ? (
                <>
                  <p className="text-xs text-gray-600">{totalDays} day{totalDays !== 1 ? 's' : ''} total</p>
                  <p className="text-xl font-bold text-gray-900">
                    ₱{totalPrice.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    ₱{car.daily_rate.toLocaleString()}/day
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-600">From</p>
                  <p className="text-xl font-bold text-gray-900">
                    ₱{car.daily_rate.toLocaleString()}
                    <span className="text-sm font-normal text-gray-600">/day</span>
                  </p>
                </>
              )}
            </div>
            {car.profiles && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                  {car.profiles.avatar_url ? (
                    <Image
                      src={car.profiles.avatar_url}
                      alt={car.profiles.full_name}
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-gray-600">
                      {car.profiles.full_name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
