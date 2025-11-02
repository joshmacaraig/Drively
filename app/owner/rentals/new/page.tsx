'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  ArrowLeft,
  Car,
  User,
  Calendar,
  CurrencyCircleDollar,
  Plus,
  Phone,
  EnvelopeSimple,
  FileText,
  Warning,
  CheckCircle,
  Target,
  Star,
  Fire,
  Trophy,
} from '@phosphor-icons/react';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { creatingQuotes } from '@/lib/loadingQuotes';

export default function NewBookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cars, setCars] = useState<any[]>([]);
  const [conflictWarning, setConflictWarning] = useState('');
  const [checkingConflict, setCheckingConflict] = useState(false);

  // Form state
  const [carId, setCarId] = useState('');
  const [renterName, setRenterName] = useState('');
  const [renterEmail, setRenterEmail] = useState('');
  const [renterPhone, setRenterPhone] = useState('');
  const [renterFacebook, setRenterFacebook] = useState('');
  const [startDateTime, setStartDateTime] = useState<Date | null>(null);
  const [endDateTime, setEndDateTime] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [dailyRate, setDailyRate] = useState(0);

  // Schedule visualization state
  const [carBookings, setCarBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedCar, setSelectedCar] = useState<any>(null);

  useEffect(() => {
    loadCars();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [carId, startDateTime, endDateTime]);

  useEffect(() => {
    checkConflict();
  }, [carId, startDateTime, endDateTime]);

  useEffect(() => {
    if (carId) {
      loadCarBookings(carId);
    } else {
      setCarBookings([]);
    }
  }, [carId]);


  const loadCars = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('cars')
        .select('id, make, model, year, plate_number, daily_rate, status')
        .eq('owner_id', user.id)
        .in('status', ['available', 'rented'])
        .order('make', { ascending: true });

      if (error) throw error;
      setCars(data || []);
    } catch (err: any) {
      console.error('Error loading cars:', err);
      setError('Failed to load cars');
    }
  };

  const calculateTotal = () => {
    if (!carId || !startDateTime || !endDateTime) {
      setTotalAmount(0);
      return;
    }

    const selectedCar = cars.find(c => c.id === carId);
    if (!selectedCar) return;

    const days = Math.ceil((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60 * 24));

    if (days > 0) {
      const total = days * parseFloat(selectedCar.daily_rate);
      setTotalAmount(total);
      setDailyRate(parseFloat(selectedCar.daily_rate));
    }
  };

  const checkConflict = async () => {
    if (!carId || !startDateTime || !endDateTime) {
      setConflictWarning('');
      return;
    }

    setCheckingConflict(true);
    try {
      const supabase = createClient();

      // Check for overlapping bookings
      const { data: conflicts } = await supabase
        .from('rentals')
        .select('id, start_datetime, end_datetime, status')
        .eq('car_id', carId)
        .neq('status', 'cancelled')
        .neq('status', 'completed');

      if (conflicts && conflicts.length > 0) {
        const hasConflict = conflicts.some(booking => {
          const bookingStart = new Date(booking.start_datetime);
          const bookingEnd = new Date(booking.end_datetime);

          return (
            (startDateTime >= bookingStart && startDateTime < bookingEnd) ||
            (endDateTime > bookingStart && endDateTime <= bookingEnd) ||
            (startDateTime <= bookingStart && endDateTime >= bookingEnd)
          );
        });

        if (hasConflict) {
          setConflictWarning('This time slot overlaps with an existing booking. Please choose different dates/times.');
        } else {
          setConflictWarning('');
        }
      } else {
        setConflictWarning('');
      }
    } catch (err) {
      console.error('Error checking conflicts:', err);
    } finally {
      setCheckingConflict(false);
    }
  };

  const loadCarBookings = async (selectedCarId: string) => {
    setLoadingBookings(true);
    try {
      const supabase = createClient();

      // Get the selected car details
      const { data: carData } = await supabase
        .from('cars')
        .select('*')
        .eq('id', selectedCarId)
        .single();

      setSelectedCar(carData);

      // Get bookings for the next 60 days (extended view)
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60);

      const { data, error } = await supabase
        .from('rentals')
        .select('id, start_datetime, end_datetime, status, total_amount')
        .eq('car_id', selectedCarId)
        .neq('status', 'cancelled')
        .gte('end_datetime', today.toISOString())
        .lte('start_datetime', futureDate.toISOString())
        .order('start_datetime', { ascending: true });

      if (error) throw error;
      setCarBookings(data || []);
    } catch (err) {
      console.error('Error loading car bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if there's a conflict
    if (conflictWarning) {
      setError('Cannot create booking: time slot conflicts with an existing booking.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');
      if (!startDateTime || !endDateTime) throw new Error('Date and time are required');

      // Check if renter exists by email (if email provided)
      let renterId = user.id; // Default to owner ID
      let isManualBooking = true;

      if (renterEmail) {
        // Check/create guest renter via API route
        try {
          const response = await fetch('/api/rentals/create-guest-renter', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: renterEmail,
              fullName: renterName,
              phoneNumber: renterPhone,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            renterId = data.renterId;
            isManualBooking = false;
          } else {
            console.warn('Could not auto-create account, using manual booking');
          }
        } catch (createError) {
          console.warn('Could not auto-create account, using manual booking:', createError);
          // Fall back to manual booking if account creation fails
        }
      }

      // Create rental
      const rentalData: any = {
        car_id: carId,
        renter_id: renterId,
        owner_id: user.id,
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        total_amount: totalAmount,
        status: 'confirmed',
        notes: notes || null,
        is_manual_booking: isManualBooking,
      };

      // Add guest renter info if manual booking
      if (isManualBooking) {
        rentalData.guest_renter_name = renterName;
        rentalData.guest_renter_email = renterEmail || null;
        rentalData.guest_renter_phone = renterPhone;
        rentalData.guest_renter_facebook = renterFacebook || null;
      }

      const { error: rentalError } = await supabase
        .from('rentals')
        .insert(rentalData);

      if (rentalError) throw rentalError;

      // Car availability is now automatically determined by checking the rentals table
      // No need to update car status - the get_available_cars() function handles this

      // Show success and redirect
      router.push('/owner/rentals');
    } catch (err: any) {
      console.error('Error creating booking:', err);
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const getDays = () => {
    if (!startDateTime || !endDateTime) return 0;
    return Math.ceil((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Format datetime in US format: MM/DD/YYYY, h:mm AM/PM
  const formatDateTime = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Helper function to check if a date is within any booking
  const isDateBooked = (date: Date) => {
    if (!carBookings || carBookings.length === 0) return false;

    return carBookings.some(booking => {
      const bookingStart = new Date(booking.start_datetime);
      const bookingEnd = new Date(booking.end_datetime);

      // Strip time for date comparison
      const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const startDate = new Date(bookingStart.getFullYear(), bookingStart.getMonth(), bookingStart.getDate());
      const endDate = new Date(bookingEnd.getFullYear(), bookingEnd.getMonth(), bookingEnd.getDate());

      return checkDate >= startDate && checkDate <= endDate;
    });
  };

  // Custom day class names for the calendar
  const getDayClassName = (date: Date) => {
    const isBooked = isDateBooked(date);

    if (isBooked) {
      return 'booked-date';
    }

    return '';
  };

  // Handle date range change
  const handleDateRangeChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDateTime(start);
    setEndDateTime(end);
  };

  if (loading) {
    return <LoadingOverlay quotes={creatingQuotes} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Custom Calendar Styles */}
      <style jsx global>{`
        .custom-calendar {
          font-family: inherit;
          border: none !important;
          width: 100% !important;
        }

        .react-datepicker {
          border: none !important;
          font-family: inherit;
          width: 100% !important;
        }

        .react-datepicker__month-container {
          width: 100% !important;
        }

        .react-datepicker__header {
          background: linear-gradient(135deg, #F97316 0%, #EA580C 100%) !important;
          border: none !important;
          padding: 1.5rem !important;
          border-radius: 0.75rem 0.75rem 0 0 !important;
        }

        .react-datepicker__current-month {
          color: white !important;
          font-weight: 700 !important;
          font-size: 1.25rem !important;
          margin-bottom: 0.5rem !important;
        }

        .react-datepicker__day-names {
          display: flex;
          justify-content: space-around;
          margin-top: 0.5rem;
        }

        .react-datepicker__day-name {
          color: white !important;
          font-weight: 600 !important;
          width: 3rem !important;
          line-height: 3rem !important;
        }

        .react-datepicker__week {
          display: flex;
          justify-content: space-around;
        }

        .react-datepicker__day {
          width: 3rem !important;
          height: 3rem !important;
          line-height: 3rem !important;
          margin: 0.25rem !important;
          border-radius: 0.75rem !important;
          transition: all 0.3s ease !important;
          font-weight: 700 !important;
          position: relative !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          color: #1f2937 !important;
          font-size: 0.95rem !important;
        }

        .react-datepicker__day:hover {
          background: #F97316 !important;
          color: white !important;
          transform: scale(1.15) !important;
          z-index: 10 !important;
          box-shadow: 0 4px 6px rgba(0,0,0,0.2) !important;
        }

        .react-datepicker__day--selected,
        .react-datepicker__day--in-selecting-range,
        .react-datepicker__day--in-range {
          background: #10b981 !important;
          color: white !important;
          font-weight: 800 !important;
          transform: scale(1.05) !important;
        }

        .react-datepicker__day--range-start,
        .react-datepicker__day--range-end {
          background: #f59e0b !important;
          color: #1f2937 !important;
          font-weight: 900 !important;
          transform: scale(1.1) !important;
          box-shadow: 0 0 0 3px #fef3c7 !important;
        }

        .react-datepicker__day--keyboard-selected {
          background: #F97316 !important;
          color: white !important;
        }

        .react-datepicker__day--today {
          font-weight: 900 !important;
          background: #fbbf24 !important;
          color: #1f2937 !important;
          border: 3px solid #f59e0b !important;
          box-shadow: 0 0 0 2px white, 0 0 0 4px #fbbf24 !important;
        }

        .react-datepicker__day.booked-date {
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%) !important;
          color: white !important;
          position: relative;
          cursor: not-allowed !important;
          border: 2px solid #2563eb !important;
          font-weight: 800 !important;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3) !important;
        }

        .react-datepicker__day.booked-date::after {
          content: '🚗';
          position: absolute;
          top: -4px;
          right: -4px;
          font-size: 0.75rem;
          background: white;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .react-datepicker__day.booked-date:hover {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
          transform: scale(1.05) !important;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.5) !important;
        }

        .react-datepicker__day--disabled {
          color: #9ca3af !important;
          cursor: not-allowed !important;
          opacity: 0.6 !important;
          font-weight: 500 !important;
          background: #f9fafb !important;
        }

        .react-datepicker__navigation-icon::before {
          border-color: white !important;
        }

        .react-datepicker__navigation:hover *::before {
          border-color: #fbbf24 !important;
        }

        .react-datepicker__month {
          margin: 1rem !important;
        }

        /* Time Picker Styles */
        .react-datepicker__time-container {
          border: none !important;
          width: 100% !important;
        }

        .react-datepicker__time {
          background: white !important;
          border-radius: 0.5rem !important;
        }

        .react-datepicker__time-box {
          width: 100% !important;
          max-height: 250px !important;
          overflow-y: auto !important;
        }

        .react-datepicker__time-list {
          padding: 0.5rem !important;
          height: auto !important;
          overflow-y: visible !important;
        }

        .react-datepicker__time-list-item {
          height: auto !important;
          padding: 0.75rem 1rem !important;
          font-size: 1rem !important;
          font-weight: 700 !important;
          color: #1f2937 !important;
          border-radius: 0.5rem !important;
          margin-bottom: 0.25rem !important;
          transition: all 0.2s ease !important;
        }

        .react-datepicker__time-list-item:hover {
          background: #F97316 !important;
          color: white !important;
          transform: scale(1.02) !important;
        }

        .react-datepicker__time-list-item--selected {
          background: #10b981 !important;
          color: white !important;
          font-weight: 900 !important;
        }

        /* Fix for inline time picker */
        .react-datepicker--time-only {
          width: 100% !important;
        }

        .react-datepicker--time-only .react-datepicker__time-container {
          width: 100% !important;
        }

        .react-datepicker--time-only .react-datepicker__time {
          border-radius: 0.75rem !important;
        }

        /* Time Picker Popper - Ensure it's not cut off */
        .time-picker-popper {
          z-index: 9999 !important;
        }

        .time-picker-popper .react-datepicker {
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2) !important;
          border: 2px solid #e5e7eb !important;
          border-radius: 0.75rem !important;
        }

        .time-picker-popper .react-datepicker__time-container {
          width: 100% !important;
          min-width: 150px !important;
        }

        .time-picker-popper .react-datepicker__time-box {
          width: 100% !important;
          max-height: 280px !important;
        }

        .time-picker-popper .react-datepicker__time-list {
          height: auto !important;
          max-height: 280px !important;
        }
      `}</style>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/owner/rentals"
              className="inline-flex items-center gap-2 text-secondary-600 hover:text-primary-500 mb-4 transition-colors"
            >
              <ArrowLeft size={20} weight="duotone" />
              Back to Rentals
            </Link>

            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 flex items-center gap-3">
                <Calendar size={40} weight="duotone" className="text-primary-500" />
                Create New Booking
              </h1>
              <p className="text-secondary-600 mt-2">
                Add a new rental booking for your cars
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-4 md:p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Select Car */}
            <div className="mb-8">
              <h2 className="text-lg md:text-xl font-bold text-secondary-900 mb-4 flex items-center gap-2">
                <Car size={24} weight="duotone" className="text-primary-500" />
                Select Car
                {carId && (
                  <span className="ml-auto text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle size={16} weight="fill" />
                    Selected!
                  </span>
                )}
              </h2>
              <select
                required
                value={carId}
                onChange={(e) => setCarId(e.target.value)}
                className="block w-full px-4 py-3 border-2 border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-secondary-900 hover:border-primary-400"
              >
                <option value="">Choose a car...</option>
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.year} {car.make} {car.model} - {car.plate_number} (₱{parseFloat(car.daily_rate).toLocaleString()}/day)
                  </option>
                ))}
              </select>
              {cars.length === 0 ? (
                <p className="text-sm text-secondary-600 mt-2">
                  No active cars available for booking.
                </p>
              ) : (
                <p className="text-sm text-secondary-600 mt-2 flex items-center gap-1">
                  <Target size={14} weight="duotone" />
                  You can book cars that are currently rented for future dates. The system will prevent overlapping bookings.
                </p>
              )}
            </div>

            {/* Visual Schedule for Selected Car */}
            {carId && (
              <div className="mb-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200">
                <h3 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                  <Calendar size={24} weight="duotone" className="text-blue-500" />
                  Car Schedule - Next 30 Days
                  {loadingBookings && (
                    <div className="ml-auto">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </h3>

                {loadingBookings ? (
                  <div className="text-center py-8 text-secondary-600">
                    Loading schedule...
                  </div>
                ) : carBookings.length === 0 ? (
                  <div className="bg-white rounded-xl p-6 text-center border-2 border-dashed border-green-300">
                    <CheckCircle size={48} weight="duotone" className="mx-auto text-green-500 mb-2" />
                    <p className="text-green-700 font-semibold">All Clear!</p>
                    <p className="text-sm text-secondary-600 mt-1">
                      No bookings in the next 30 days. This car is wide open!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-secondary-600 mb-2">
                      <Warning size={16} weight="duotone" />
                      <span>Avoid these time slots to prevent conflicts</span>
                    </div>
                    {carBookings.map((booking, index) => {
                      const start = new Date(booking.start_datetime);
                      const end = new Date(booking.end_datetime);
                      const daysUntil = Math.ceil((start.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                      return (
                        <div
                          key={booking.id}
                          className="bg-white rounded-xl p-4 border-l-4 border-orange-500 shadow-md hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-1 rounded-full">
                                  Booked
                                </span>
                                {daysUntil <= 7 && daysUntil > 0 && (
                                  <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                                    <Fire size={12} weight="fill" />
                                    In {daysUntil} days
                                  </span>
                                )}
                                {daysUntil <= 0 && (
                                  <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full animate-pulse">
                                    Active Now
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-semibold text-secondary-900 mb-1">
                                {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                {' '} at {' '}
                                {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                              </p>
                              <p className="text-sm text-secondary-600">
                                Until: {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                {' '} at {' '}
                                {end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary-500">
                                ₱{parseFloat(booking.total_amount).toLocaleString()}
                              </p>
                              <p className="text-xs text-secondary-500">Revenue</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {carBookings.length > 0 && (
                      <div className="bg-blue-100 rounded-xl p-4 mt-4">
                        <p className="text-sm text-blue-800 font-semibold flex items-center gap-2">
                          <Trophy size={16} weight="duotone" />
                          This car has {carBookings.length} upcoming booking{carBookings.length !== 1 ? 's' : ''}!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Renter Information */}
            <div className="mb-8">
              <h2 className="text-lg md:text-xl font-bold text-secondary-900 mb-4 flex items-center gap-2">
                <User size={24} weight="duotone" className="text-primary-500" />
                Renter Information
                {renterName && (renterEmail || renterFacebook) && (
                  <span className="ml-auto text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle size={16} weight="fill" />
                    Complete!
                  </span>
                )}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="renterName" className="block text-sm font-medium text-secondary-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <input
                      id="renterName"
                      type="text"
                      required
                      value={renterName}
                      onChange={(e) => setRenterName(e.target.value)}
                      className="block w-full px-4 py-3 border-2 border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-secondary-900 hover:border-primary-400"
                      placeholder="Juan Dela Cruz"
                    />
                    {renterName && (
                      <CheckCircle size={20} weight="fill" className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="renterPhone" className="block text-sm font-medium text-secondary-700 mb-2">
                    <Phone size={16} weight="duotone" className="inline mr-1" />
                    Phone
                  </label>
                  <div className="relative">
                    <input
                      id="renterPhone"
                      type="tel"
                      value={renterPhone}
                      onChange={(e) => setRenterPhone(e.target.value)}
                      className="block w-full px-4 py-3 border-2 border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-secondary-900 hover:border-primary-400"
                      placeholder="+63 912 345 6789"
                    />
                    {renterPhone && (
                      <CheckCircle size={20} weight="fill" className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="renterEmail" className="block text-sm font-medium text-secondary-700 mb-2">
                    <EnvelopeSimple size={16} weight="duotone" className="inline mr-1" />
                    Email
                  </label>
                  <div className="relative">
                    <input
                      id="renterEmail"
                      type="email"
                      value={renterEmail}
                      onChange={(e) => setRenterEmail(e.target.value)}
                      className="block w-full px-4 py-3 border-2 border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-secondary-900 hover:border-primary-400"
                      placeholder="juan@example.com"
                    />
                    {renterEmail && (
                      <CheckCircle size={20} weight="fill" className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                    )}
                  </div>
                  {renterEmail && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Star size={12} weight="fill" />
                      Account will be created automatically
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="renterFacebook" className="block text-sm font-medium text-secondary-700 mb-2">
                    <svg className="inline w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook Profile URL
                  </label>
                  <div className="relative">
                    <input
                      id="renterFacebook"
                      type="url"
                      value={renterFacebook}
                      onChange={(e) => setRenterFacebook(e.target.value)}
                      className="block w-full px-4 py-3 border-2 border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-secondary-900 hover:border-primary-400"
                      placeholder="https://facebook.com/juandelacruz"
                    />
                    {renterFacebook && (
                      <CheckCircle size={20} weight="fill" className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-secondary-600 mt-1">
                    Great for Facebook Marketplace clients! Paste their Facebook profile link here.
                  </p>
                  {!renterEmail && !renterFacebook && (
                    <p className="text-xs text-orange-600 font-semibold mt-2 flex items-center gap-1">
                      <Warning size={14} weight="fill" />
                      Please provide at least Email OR Facebook contact information
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Rental Period - Date Range Calendar */}
            <div className="mb-8">
              <h2 className="text-lg md:text-xl font-bold text-secondary-900 mb-4 flex items-center gap-2">
                <Calendar size={24} weight="duotone" className="text-primary-500" />
                Rental Period
                {startDateTime && endDateTime && (
                  <span className="ml-auto text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle size={16} weight="fill" />
                    {getDays()} Day{getDays() !== 1 ? 's' : ''} Selected
                  </span>
                )}
              </h2>

              <div className="bg-gradient-to-br from-primary-50 to-orange-50 rounded-2xl p-6 border-2 border-primary-200 overflow-visible">
                <div className="grid lg:grid-cols-3 gap-6 overflow-visible">
                  {/* Calendar */}
                  <div className="lg:col-span-2">
                    <div className="mb-3">
                      <label className="block text-sm font-bold text-secondary-900">
                        Select Your Rental Dates *
                      </label>
                      <p className="text-xs text-secondary-600 mt-1">
                        Click start date, then click end date. Blue/purple dates with 🚗 are already booked.
                      </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-primary-300">
                      <DatePicker
                        selectsRange
                        startDate={startDateTime}
                        endDate={endDateTime}
                        onChange={handleDateRangeChange}
                        minDate={new Date()}
                        inline
                        calendarClassName="custom-calendar"
                        monthsShown={1}
                        dayClassName={getDayClassName}
                        showDisabledMonthNavigation
                      />
                    </div>
                  </div>

                  {/* Selection Summary & Time Picker */}
                  <div className="space-y-4 overflow-visible">
                    {/* Selection Info */}
                    {selectedCar && (
                      <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-purple-300">
                        <h3 className="font-bold text-secondary-900 mb-2 flex items-center gap-2">
                          <Car size={20} weight="duotone" className="text-purple-500" />
                          Selected Car
                        </h3>
                        {selectedCar.primary_image_url && (
                          <img
                            src={selectedCar.primary_image_url}
                            alt={`${selectedCar.make} ${selectedCar.model}`}
                            className="w-full h-32 object-cover rounded-lg mb-2"
                          />
                        )}
                        <p className="text-sm font-semibold text-secondary-900">
                          {selectedCar.year} {selectedCar.make} {selectedCar.model}
                        </p>
                        <p className="text-xs text-secondary-600">{selectedCar.plate_number}</p>
                      </div>
                    )}

                    {/* Date Selection Info */}
                    {startDateTime && (
                      <div className="bg-green-50 rounded-xl p-4 border-2 border-green-300">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle size={20} weight="fill" className="text-green-600" />
                          <span className="font-bold text-green-800">Pick-up</span>
                        </div>
                        <p className="text-sm font-semibold text-green-900">
                          {startDateTime.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <div className="mt-2 relative z-50">
                          <label className="text-xs text-green-800 font-semibold block mb-1">Time</label>
                          <DatePicker
                            selected={startDateTime}
                            onChange={(date) => date && setStartDateTime(date)}
                            showTimeSelect
                            showTimeSelectOnly
                            timeIntervals={15}
                            timeCaption="Time"
                            dateFormat="h:mm aa"
                            className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 text-base font-bold text-green-900 bg-white"
                            popperClassName="time-picker-popper"
                            popperPlacement="bottom-start"
                          />
                        </div>
                      </div>
                    )}

                    {endDateTime && (
                      <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-300">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle size={20} weight="fill" className="text-purple-600" />
                          <span className="font-bold text-purple-800">Drop-off</span>
                        </div>
                        <p className="text-sm font-semibold text-purple-900">
                          {endDateTime.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <div className="mt-2 relative z-50">
                          <label className="text-xs text-purple-800 font-semibold block mb-1">Time</label>
                          <DatePicker
                            selected={endDateTime}
                            onChange={(date) => date && setEndDateTime(date)}
                            showTimeSelect
                            showTimeSelectOnly
                            timeIntervals={15}
                            timeCaption="Time"
                            dateFormat="h:mm aa"
                            className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-base font-bold text-purple-900 bg-white"
                            popperClassName="time-picker-popper"
                            popperPlacement="bottom-start"
                          />
                        </div>
                      </div>
                    )}

                    {/* Legend - Compact */}
                    <div className="bg-white rounded-xl p-3 border-2 border-primary-200">
                      <p className="text-xs font-bold text-secondary-900 mb-2">Legend</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 bg-yellow-400 rounded border border-yellow-600"></div>
                          <span className="text-xs text-secondary-700">Today</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 bg-green-500 rounded"></div>
                          <span className="text-xs text-secondary-700">Range</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 bg-orange-500 rounded"></div>
                          <span className="text-xs text-secondary-700">Start/End</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded relative flex items-center justify-center text-[8px]">🚗</div>
                          <span className="text-xs text-secondary-700">Booked</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conflict Warning */}
              {conflictWarning && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <Warning size={24} weight="duotone" className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">Booking Conflict</p>
                    <p className="text-sm text-red-700 mt-1">{conflictWarning}</p>
                  </div>
                </div>
              )}

              {/* Duration Summary */}
              {startDateTime && endDateTime && getDays() > 0 && !conflictWarning && (
                <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                  <p className="text-sm text-secondary-900 font-semibold mb-2">Booking Summary</p>
                  <p className="text-sm text-secondary-600">
                    <strong>Start:</strong> {formatDateTime(startDateTime)}
                  </p>
                  <p className="text-sm text-secondary-600 mt-1">
                    <strong>End:</strong> {formatDateTime(endDateTime)}
                  </p>
                  <p className="text-sm text-secondary-600 mt-2">
                    <strong>Duration:</strong> {getDays()} day{getDays() !== 1 ? 's' : ''}
                  </p>
                  {dailyRate > 0 && (
                    <p className="text-sm text-secondary-600 mt-1">
                      <strong>Rate:</strong> ₱{dailyRate.toLocaleString()} × {getDays()} day{getDays() !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="mb-8">
              <label htmlFor="notes" className="block text-sm font-medium text-secondary-700 mb-2">
                <FileText size={16} weight="duotone" className="inline mr-1" />
                Additional Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900 resize-none"
                placeholder="Any special instructions or notes..."
              />
            </div>

            {/* Total Amount */}
            {totalAmount > 0 && (
              <div className="mb-8 p-6 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="bg-white rounded-full p-4">
                    <CurrencyCircleDollar size={40} weight="fill" className="text-primary-500" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-semibold opacity-90">Total Revenue</p>
                    <p className="text-4xl font-bold text-white mb-1">
                      ₱{totalAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-white opacity-80">
                      {getDays()} day{getDays() !== 1 ? 's' : ''} × ₱{dailyRate.toLocaleString()}/day
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Link
                href="/owner/rentals"
                className="flex-1 px-6 py-4 border-2 border-secondary-300 text-secondary-700 rounded-xl font-bold hover:border-secondary-400 hover:bg-secondary-50 transition-all text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !carId || !startDateTime || !endDateTime || totalAmount === 0 || !!conflictWarning || checkingConflict}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-6 py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Creating Booking...</span>
                  </>
                ) : (
                  <>
                    <Plus size={24} weight="duotone" />
                    Create Booking
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
