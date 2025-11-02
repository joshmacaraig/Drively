'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { createClient } from '@/lib/supabase/client';
import { CarPricingRule } from '@/lib/types/database';
import { calculateRentalPrice, formatDiscountDescription } from '@/lib/utils/pricing';

interface Rental {
  id: string;
  start_datetime: string;
  end_datetime: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
}

interface BookingFormProps {
  carId: string;
  dailyRate: number;
  ownerId: string;
  renterId: string;
  initialStartDate?: string;
  initialEndDate?: string;
  isVerified: boolean;
  activeRentals: Rental[];
  pickupLocation?: string;
}

export default function BookingForm({
  carId,
  dailyRate,
  ownerId,
  renterId,
  initialStartDate,
  initialEndDate,
  isVerified,
  activeRentals,
  pickupLocation,
}: BookingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pricingRules, setPricingRules] = useState<CarPricingRule[]>([]);

  const [startDate, setStartDate] = useState<Date | null>(
    initialStartDate ? new Date(initialStartDate) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    initialEndDate ? new Date(initialEndDate) : null
  );
  const [notes, setNotes] = useState('');
  const [conflictWarning, setConflictWarning] = useState('');

  // Load pricing rules
  useEffect(() => {
    const loadPricingRules = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('car_pricing_rules')
          .select('*')
          .eq('car_id', carId)
          .eq('is_active', true)
          .order('min_days', { ascending: true });

        if (!error && data) {
          setPricingRules(data);
        }
      } catch (err) {
        console.error('Error loading pricing rules:', err);
      }
    };

    loadPricingRules();
  }, [carId]);

  // Calculate total with discounts
  const totalDays =
    startDate && endDate
      ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

  const priceCalculation = calculateRentalPrice(dailyRate, totalDays, pricingRules);
  const totalAmount = priceCalculation.finalPrice;

  // Check for conflicts
  useEffect(() => {
    if (!startDate || !endDate) {
      setConflictWarning('');
      return;
    }

    const hasConflict = activeRentals.some((rental) => {
      const rentalStart = new Date(rental.start_datetime);
      const rentalEnd = new Date(rental.end_datetime);

      return (
        (startDate >= rentalStart && startDate <= rentalEnd) ||
        (endDate >= rentalStart && endDate <= rentalEnd) ||
        (startDate <= rentalStart && endDate >= rentalEnd)
      );
    });

    if (hasConflict) {
      setConflictWarning('This vehicle is already booked for the selected dates. Please choose different dates.');
    } else {
      setConflictWarning('');
    }
  }, [startDate, endDate, activeRentals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isVerified) {
      alert('Please complete your profile verification to make bookings.');
      return;
    }

    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    if (conflictWarning) {
      setError('Cannot book - dates conflict with existing rental');
      return;
    }

    if (totalDays < 1) {
      setError('Rental must be at least 1 day');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/rentals/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          car_id: carId,
          owner_id: ownerId,
          renter_id: renterId,
          start_datetime: startDate.toISOString(),
          end_datetime: endDate.toISOString(),
          total_amount: totalAmount,
          pickup_location: pickupLocation,
          return_location: pickupLocation,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      setSuccess(true);

      // Redirect to bookings page after a short delay
      setTimeout(() => {
        router.push('/renter/bookings');
      }, 2000);
    } catch (err: any) {
      console.error('Error creating booking:', err);
      setError(err.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success message
  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Booking Submitted!</h3>
        <p className="text-gray-600 mb-4">Your booking request has been sent to the owner.</p>
        <p className="text-sm text-gray-500">Redirecting to your bookings...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Date Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Pick-up Date
        </label>
        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          minDate={new Date()}
          dateFormat="MMM d, yyyy"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-semibold"
          placeholderText="Select pick-up date"
          disabled={!isVerified}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Return Date
        </label>
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate || new Date()}
          dateFormat="MMM d, yyyy"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-semibold"
          placeholderText="Select return date"
          disabled={!isVerified || !startDate}
        />
      </div>

      {/* Days & Total Display */}
      {totalDays > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Duration:</span>
            <span className="font-semibold text-gray-900">
              {totalDays} day{totalDays !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">
              ₱{dailyRate.toLocaleString()} × {totalDays} day{totalDays !== 1 ? 's' : ''}:
            </span>
            <span className="font-semibold text-gray-900">
              ₱{priceCalculation.basePrice.toLocaleString()}
            </span>
          </div>
          {priceCalculation.appliedRule && (
            <>
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-600 font-medium">
                  {formatDiscountDescription(priceCalculation.appliedRule)}:
                </span>
                <span className="font-semibold text-green-600">
                  -₱{priceCalculation.discount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-300"></div>
            </>
          )}
          <div className="flex justify-between items-center">
            <span className="text-gray-900 font-semibold">Total Amount:</span>
            <span className="font-bold text-xl text-gray-900">
              ₱{totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* Conflict Warning */}
      {conflictWarning && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-red-800">{conflictWarning}</p>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Additional Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base font-medium"
          placeholder="Any special requests or notes for the owner..."
          disabled={!isVerified}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !isVerified || !!conflictWarning || !startDate || !endDate}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : !isVerified ? (
          'Verification Required'
        ) : (
          'Request to Book'
        )}
      </button>

      {/* Info Text */}
      <p className="text-xs text-gray-500 text-center">
        Your booking will be sent to the owner for approval. You won't be charged until the owner confirms.
      </p>
    </form>
  );
}
