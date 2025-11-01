'use client';

import { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CalendarX,
  TrendUp,
  Clock,
  CheckCircle,
  Trophy,
  Target
} from '@phosphor-icons/react';

interface Booking {
  id: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
  notes?: string;
}

interface BookingTimelineProps {
  carId: string;
  bookings: Booking[];
  selectedStart: Date | null;
  selectedEnd: Date | null;
}

export default function BookingTimeline({
  carId,
  bookings,
  selectedStart,
  selectedEnd
}: BookingTimelineProps) {
  const [stats, setStats] = useState({
    totalBookings: 0,
    utilizationRate: 0,
    availableSlots: 0,
    nextAvailable: null as Date | null,
  });

  useEffect(() => {
    calculateStats();
  }, [bookings]);

  const calculateStats = () => {
    const activeBookings = bookings.filter(b => b.status !== 'cancelled');
    const totalBookings = activeBookings.length;

    // Calculate utilization rate (next 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const bookingsNext30Days = activeBookings.filter(b => {
      const start = new Date(b.start_datetime);
      return start >= now && start <= thirtyDaysFromNow;
    });

    const totalHoursIn30Days = 30 * 24;
    const bookedHours = bookingsNext30Days.reduce((sum, b) => {
      const start = new Date(b.start_datetime);
      const end = new Date(b.end_datetime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    const utilizationRate = Math.min((bookedHours / totalHoursIn30Days) * 100, 100);

    // Find next available slot
    const sortedBookings = [...activeBookings]
      .filter(b => new Date(b.end_datetime) > now)
      .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());

    let nextAvailable = now;
    for (const booking of sortedBookings) {
      const start = new Date(booking.start_datetime);
      if (nextAvailable < start) {
        break;
      }
      nextAvailable = new Date(booking.end_datetime);
    }

    setStats({
      totalBookings,
      utilizationRate: Math.round(utilizationRate),
      availableSlots: Math.max(10 - bookingsNext30Days.length, 0),
      nextAvailable: nextAvailable > now ? nextAvailable : now,
    });
  };

  const getUpcomingBookings = () => {
    const now = new Date();
    return bookings
      .filter(b => new Date(b.end_datetime) > now && b.status !== 'cancelled')
      .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
      .slice(0, 5);
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  const checkOverlap = (booking: Booking) => {
    if (!selectedStart || !selectedEnd) return false;
    const bookingStart = new Date(booking.start_datetime);
    const bookingEnd = new Date(booking.end_datetime);

    return (
      (selectedStart >= bookingStart && selectedStart < bookingEnd) ||
      (selectedEnd > bookingStart && selectedEnd <= bookingEnd) ||
      (selectedStart <= bookingStart && selectedEnd >= bookingEnd)
    );
  };

  const upcomingBookings = getUpcomingBookings();

  return (
    <div className="space-y-6">
      {/* Gamified Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bookings */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200 transform transition-all hover:scale-105">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 rounded-lg p-2">
              <CalendarCheck size={24} weight="duotone" className="text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-700">Total Bookings</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalBookings}</p>
            </div>
          </div>
        </div>

        {/* Utilization Rate */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4 border-2 border-primary-200 transform transition-all hover:scale-105">
          <div className="flex items-center gap-3">
            <div className="bg-primary-500 rounded-lg p-2">
              <TrendUp size={24} weight="duotone" className="text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-primary-700">Utilization</p>
              <p className="text-2xl font-bold text-primary-900">{stats.utilizationRate}%</p>
            </div>
          </div>
          <div className="mt-2 bg-white rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary-500 h-full transition-all duration-1000 ease-out"
              style={{ width: `${stats.utilizationRate}%` }}
            />
          </div>
        </div>

        {/* Available Slots */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200 transform transition-all hover:scale-105">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 rounded-lg p-2">
              <Target size={24} weight="duotone" className="text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-green-700">Available Slots</p>
              <p className="text-2xl font-bold text-green-900">{stats.availableSlots}</p>
            </div>
          </div>
        </div>

        {/* Achievement Badge */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200 transform transition-all hover:scale-105">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500 rounded-lg p-2">
              <Trophy size={24} weight="duotone" className="text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-purple-700">Status</p>
              <p className="text-sm font-bold text-purple-900">
                {stats.utilizationRate >= 80 ? 'Hot Car!' :
                 stats.utilizationRate >= 50 ? 'Popular' :
                 'Available'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Bookings Timeline */}
      {upcomingBookings.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-secondary-200">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={24} weight="duotone" className="text-primary-500" />
            <h3 className="text-lg font-bold text-secondary-900">Upcoming Schedule</h3>
          </div>

          <div className="space-y-3">
            {upcomingBookings.map((booking, index) => {
              const isConflict = checkOverlap(booking);
              return (
                <div
                  key={booking.id}
                  className={`relative pl-8 pb-3 ${
                    index !== upcomingBookings.length - 1 ? 'border-l-2 border-secondary-200' : ''
                  }`}
                >
                  {/* Timeline dot */}
                  <div className={`absolute left-0 top-0 w-4 h-4 rounded-full -ml-2 ${
                    isConflict
                      ? 'bg-red-500 ring-4 ring-red-100 animate-pulse'
                      : 'bg-green-500 ring-4 ring-green-100'
                  }`} />

                  {/* Booking card */}
                  <div className={`rounded-lg p-4 transition-all transform hover:scale-[1.02] ${
                    isConflict
                      ? 'bg-red-50 border-2 border-red-200'
                      : 'bg-secondary-50 border border-secondary-200'
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            booking.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-700'
                              : booking.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-secondary-100 text-secondary-700'
                          }`}>
                            {booking.status.toUpperCase()}
                          </span>
                          {isConflict && (
                            <span className="text-xs font-semibold px-2 py-1 rounded bg-red-100 text-red-700">
                              CONFLICT!
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-secondary-900">
                          {formatDateTime(booking.start_datetime)} → {formatDateTime(booking.end_datetime)}
                        </p>
                        <p className="text-xs text-secondary-600 mt-1">
                          Duration: {formatDateRange(booking.start_datetime, booking.end_datetime)}
                        </p>
                      </div>
                      {isConflict && (
                        <CalendarX size={24} weight="duotone" className="text-red-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {upcomingBookings.length === 0 && (
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 text-center border-2 border-green-200">
          <CheckCircle size={48} weight="duotone" className="text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-green-900 mb-2">All Clear!</h3>
          <p className="text-sm text-green-700">
            No upcoming bookings. This car is ready for action!
          </p>
        </div>
      )}

      {/* Next Available */}
      {stats.nextAvailable && (
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-4 border-2 border-primary-200">
          <div className="flex items-center gap-3">
            <div className="bg-primary-500 rounded-lg p-2">
              <Clock size={24} weight="duotone" className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-700">Next Available From</p>
              <p className="text-lg font-bold text-primary-900">
                {stats.nextAvailable.getTime() <= new Date().getTime() + 60000
                  ? 'Right Now!'
                  : formatDateTime(stats.nextAvailable.toISOString())}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
