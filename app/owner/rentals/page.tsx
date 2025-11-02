'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  CalendarBlank,
  Car,
  User,
  Plus,
  ArrowLeft,
  GasPump,
  Gauge,
  Camera,
  CreditCard,
  Clock,
  MapPin,
  CaretRight,
  X,
  Check,
  FileText,
} from '@phosphor-icons/react';
import OwnerNavigation from '@/components/owner/OwnerNavigation';
import { ToastProvider, useToast } from '@/components/ui/ToastContainer';
import Pagination from '@/components/admin/Pagination';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { ownerQuotes } from '@/lib/loadingQuotes';

const ITEMS_PER_PAGE = 10;

function OwnerRentalsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rentals, setRentals] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [cars, setCars] = useState<any[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedRental, setSelectedRental] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Management form state
  const [startMileage, setStartMileage] = useState('');
  const [endMileage, setEndMileage] = useState('');
  const [gasLevel, setGasLevel] = useState('full');
  const [easytripBalance, setEasytripBalance] = useState('');
  const [autosweepBalance, setAutosweepBalance] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [beforePhotos, setBeforePhotos] = useState<File[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<File[]>([]);

  useEffect(() => {
    loadData();
  }, [searchParams]);

  const loadData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Load user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setUserProfile(profileData);

      // Load cars
      const { data: carsData } = await supabase
        .from('cars')
        .select('*')
        .eq('owner_id', user.id)
        .order('make', { ascending: true });

      setCars(carsData || []);

      // Pagination
      const currentPage = parseInt(searchParams.get('page') || '1');
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;

      // Get total count
      const { count } = await supabase
        .from('rentals')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);

      setTotalCount(count || 0);

      // Load rentals with pagination
      const { data: rentalsData } = await supabase
        .from('rentals')
        .select(`
          *,
          car:cars!rentals_car_id_fkey(id, make, model, plate_number),
          renter:profiles!rentals_renter_id_fkey(id, full_name, phone_number)
        `)
        .eq('owner_id', user.id)
        .order('start_datetime', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      setRentals(rentalsData || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'confirmed':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'active':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'completed':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredRentals = selectedCarId === 'all'
    ? rentals
    : rentals.filter(r => r.car_id === selectedCarId);

  // Helper to check if a date has bookings
  const getBookingsForDate = (date: Date) => {
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    return filteredRentals.filter(rental => {
      if (rental.status === 'cancelled') return false;

      const start = new Date(rental.start_datetime);
      const end = new Date(rental.end_datetime);
      const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

      return checkDate >= startDate && checkDate <= endDate;
    });
  };

  // Custom day renderer for calendar
  const renderDayContents = (day: number, date: Date) => {
    const bookings = getBookingsForDate(date);

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span className="relative z-10">{day}</span>
        {bookings.length > 0 && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-0.5">
            {bookings.slice(0, 3).map((booking, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full ${
                  booking.status === 'active' ? 'bg-green-500' :
                  booking.status === 'confirmed' ? 'bg-blue-500' :
                  'bg-yellow-500'
                }`}
                title={`${booking.car?.make} ${booking.car?.model}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const getDayClassName = (date: Date) => {
    const bookings = getBookingsForDate(date);
    const isSelected = selectedDate &&
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate();

    if (isSelected) {
      return 'selected-date';
    }
    if (bookings.length > 0) {
      return 'has-booking';
    }
    return '';
  };

  const handleDateClick = (date: Date | null) => {
    setSelectedDate(date);
  };

  const getBookingsForSelectedDate = () => {
    if (!selectedDate) return [];
    return getBookingsForDate(selectedDate);
  };

  const openManageModal = (rental: any) => {
    setSelectedRental(rental);
    setStartMileage(rental.start_mileage || '');
    setEndMileage(rental.end_mileage || '');
    setGasLevel(rental.gas_level || 'full');
    setEasytripBalance(rental.easytrip_balance || '');
    setAutosweepBalance(rental.autosweep_balance || '');
    setConditionNotes(rental.condition_notes || '');
    setPaymentStatus(rental.payment_status || 'pending');
    setBeforePhotos([]);
    setAfterPhotos([]);
    setShowManageModal(true);
  };

  const saveBookingDetails = async () => {
    if (!selectedRental) return;

    setIsSaving(true);

    try {
      const supabase = createClient();

      // Upload photos to Supabase Storage
      const beforePhotoUrls: string[] = [];
      const afterPhotoUrls: string[] = [];

      // Upload before photos
      if (beforePhotos.length > 0) {
        for (const photo of beforePhotos) {
          const fileExt = photo.name.split('.').pop();
          const fileName = `${selectedRental.id}/before/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('rental-photos')
            .upload(fileName, photo);

          if (uploadError) {
            console.error('Error uploading before photo:', uploadError);
            showToast(`Failed to upload photo: ${photo.name}`, 'warning');
            continue;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('rental-photos')
            .getPublicUrl(fileName);

          beforePhotoUrls.push(publicUrl);
        }
      }

      // Upload after photos
      if (afterPhotos.length > 0) {
        for (const photo of afterPhotos) {
          const fileExt = photo.name.split('.').pop();
          const fileName = `${selectedRental.id}/after/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('rental-photos')
            .upload(fileName, photo);

          if (uploadError) {
            console.error('Error uploading after photo:', uploadError);
            showToast(`Failed to upload photo: ${photo.name}`, 'warning');
            continue;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('rental-photos')
            .getPublicUrl(fileName);

          afterPhotoUrls.push(publicUrl);
        }
      }

      // Update rental record
      const updates: any = {
        start_mileage: startMileage ? parseInt(startMileage) : null,
        end_mileage: endMileage ? parseInt(endMileage) : null,
        gas_level: gasLevel,
        easytrip_balance: easytripBalance ? parseFloat(easytripBalance) : null,
        autosweep_balance: autosweepBalance ? parseFloat(autosweepBalance) : null,
        condition_notes: conditionNotes,
        payment_status: paymentStatus,
      };

      // Merge new photo URLs with existing ones
      if (beforePhotoUrls.length > 0) {
        const existingBeforePhotos = selectedRental.before_photos || [];
        updates.before_photos = [...existingBeforePhotos, ...beforePhotoUrls];
      }
      if (afterPhotoUrls.length > 0) {
        const existingAfterPhotos = selectedRental.after_photos || [];
        updates.after_photos = [...existingAfterPhotos, ...afterPhotoUrls];
      }

      const { error } = await supabase
        .from('rentals')
        .update(updates)
        .eq('id', selectedRental.id);

      if (error) throw error;

      showToast('Booking details saved successfully!', 'success');
      setShowManageModal(false);
      setBeforePhotos([]);
      setAfterPhotos([]);
      loadData();
    } catch (err: any) {
      console.error('Error saving booking details:', err);
      console.error('Error details:', {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code
      });
      showToast(`Failed to save booking details: ${err?.message || 'Unknown error'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <LoadingOverlay quotes={ownerQuotes} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Navigation */}
      <OwnerNavigation
        userFullName={userProfile?.full_name}
        userAvatar={userProfile?.avatar_url}
      />
      {/* Calendar Styles */}
      <style jsx global>{`
        .has-booking {
          background: #FED7AA !important;
          font-weight: 700 !important;
          cursor: pointer !important;
        }

        .has-booking:hover {
          background: #FB923C !important;
          color: white !important;
        }

        .selected-date {
          background: #F97316 !important;
          color: white !important;
          font-weight: 900 !important;
          border: 2px solid #EA580C !important;
        }

        .react-datepicker {
          border: none !important;
          font-family: inherit;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          width: 100% !important;
        }

        .react-datepicker__month-container {
          width: 100% !important;
        }

        .react-datepicker__header {
          background: linear-gradient(135deg, #F97316 0%, #EA580C 100%) !important;
          border: none !important;
          padding: 1.5rem !important;
        }

        .react-datepicker__current-month,
        .react-datepicker__day-name {
          color: white !important;
          font-weight: 700 !important;
        }

        .react-datepicker__day {
          width: 3rem !important;
          height: 3rem !important;
          line-height: 3rem !important;
          margin: 0.25rem !important;
          border-radius: 0.5rem !important;
          font-weight: 600 !important;
          color: #1f2937 !important;
        }

        .react-datepicker__day:hover {
          background: #F97316 !important;
          color: white !important;
          transform: scale(1.1) !important;
        }

        .react-datepicker__day--today {
          background: #fbbf24 !important;
          color: #1f2937 !important;
          font-weight: 900 !important;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-secondary-900 mb-2">
                  Manage Rentals
                </h1>
                <p className="text-secondary-600">
                  View and manage booking requests for your cars
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/owner/rentals/new"
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg"
                >
                  <Plus size={20} weight="duotone" />
                  Add Booking
                </Link>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200">
                <p className="text-sm text-secondary-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {rentals.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                <p className="text-sm text-secondary-600 mb-1">Confirmed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {rentals.filter(r => r.status === 'confirmed').length}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                <p className="text-sm text-secondary-600 mb-1">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {rentals.filter(r => r.status === 'active').length}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                <p className="text-sm text-secondary-600 mb-1">Total</p>
                <p className="text-2xl font-bold text-purple-600">
                  {rentals.length}
                </p>
              </div>
            </div>

            {/* Filters and View Toggle */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              {/* Car Filter */}
              <div className="flex-1">
                <label className="block text-sm font-semibold text-secondary-700 mb-2">
                  Filter by Car
                </label>
                <select
                  value={selectedCarId}
                  onChange={(e) => setSelectedCarId(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-semibold"
                >
                  <option value="all">All Cars</option>
                  {cars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.year} {car.make} {car.model} - {car.plate_number}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode Toggle */}
              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2">
                  View Mode
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      viewMode === 'list'
                        ? 'bg-primary-500 text-white shadow-lg'
                        : 'bg-white text-secondary-700 border-2 border-secondary-300'
                    }`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      viewMode === 'calendar'
                        ? 'bg-primary-500 text-white shadow-lg'
                        : 'bg-white text-secondary-700 border-2 border-secondary-300'
                    }`}
                  >
                    <CalendarBlank size={20} weight="duotone" className="inline mr-1" />
                    Calendar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          {filteredRentals.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <CalendarBlank size={64} weight="duotone" className="mx-auto text-secondary-300 mb-4" />
              <h3 className="text-xl font-bold text-secondary-900 mb-2">
                No rental bookings yet
              </h3>
              <p className="text-secondary-600 mb-6">
                {selectedCarId === 'all'
                  ? 'Rental requests will appear here when renters book your cars'
                  : 'No bookings for this car yet'}
              </p>
            </div>
          ) : viewMode === 'calendar' ? (
            /* Calendar View */
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Calendar Section */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-secondary-900 mb-4 flex items-center gap-2">
                  <CalendarBlank size={24} weight="duotone" className="text-primary-500" />
                  Booking Calendar
                  {selectedCarId !== 'all' && (
                    <span className="ml-auto text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded-full">
                      {cars.find(c => c.id === selectedCarId)?.make} {cars.find(c => c.id === selectedCarId)?.model}
                    </span>
                  )}
                </h2>

                <div className="mb-4 flex items-center gap-4 text-sm flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-secondary-600">Pending</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-secondary-600">Confirmed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-secondary-600">Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                    <span className="text-secondary-600">Selected</span>
                  </div>
                </div>

                <DatePicker
                  inline
                  monthsShown={2}
                  renderDayContents={renderDayContents}
                  dayClassName={getDayClassName}
                  onClickOutside={() => {}}
                  onSelect={handleDateClick}
                />
              </div>

              {/* Booking Details Panel */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="font-bold text-secondary-900 mb-4 flex items-center gap-2">
                  <Car size={20} weight="duotone" className="text-primary-500" />
                  {selectedDate ? 'Bookings on ' + selectedDate.toLocaleDateString() : 'Select a Date'}
                </h3>

                {selectedDate ? (
                  getBookingsForSelectedDate().length > 0 ? (
                    <div className="space-y-3">
                      {getBookingsForSelectedDate().map((rental) => (
                        <div
                          key={rental.id}
                          className="p-4 bg-gradient-to-br from-primary-50 to-orange-50 rounded-xl border-2 border-primary-200 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(rental.status)}`}>
                              {getStatusText(rental.status)}
                            </span>
                            <span className="text-lg font-bold text-primary-600">
                              ₱{parseFloat(rental.total_amount).toLocaleString()}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Car size={16} weight="duotone" className="text-secondary-500" />
                              <p className="text-sm font-semibold text-secondary-900">
                                {rental.car?.make} {rental.car?.model}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <User size={16} weight="duotone" className="text-secondary-500" />
                              <p className="text-sm text-secondary-700">
                                {rental.is_manual_booking
                                  ? rental.guest_renter_name || 'Guest'
                                  : rental.renter?.full_name || 'N/A'
                                }
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <Clock size={16} weight="duotone" className="text-secondary-500" />
                              <p className="text-xs text-secondary-600">
                                {new Date(rental.start_datetime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} - {new Date(rental.end_datetime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-3 pt-3 border-t border-primary-200">
                            <button
                              onClick={() => openManageModal(rental)}
                              className="flex-1 text-center px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold text-xs transition-colors"
                            >
                              Manage
                            </button>
                            <Link
                              href={`/owner/rentals/${rental.id}`}
                              className="flex-1 text-center px-3 py-2 bg-secondary-200 hover:bg-secondary-300 text-secondary-900 rounded-lg font-semibold text-xs transition-colors"
                            >
                              Details
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarBlank size={48} weight="duotone" className="mx-auto text-secondary-300 mb-2" />
                      <p className="text-sm text-secondary-600">No bookings on this date</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8">
                    <CalendarBlank size={48} weight="duotone" className="mx-auto text-secondary-300 mb-2" />
                    <p className="text-sm text-secondary-600 mb-4">Click on a date to view bookings</p>
                    <p className="text-xs text-secondary-500">Dates with colored dots have bookings</p>
                  </div>
                )}

                {/* Quick Stats for Selected Date */}
                {selectedDate && getBookingsForSelectedDate().length > 0 && (
                  <div className="mt-4 pt-4 border-t border-secondary-200">
                    <div className="bg-primary-100 rounded-lg p-3">
                      <p className="text-xs text-secondary-600 mb-1">Revenue for this date</p>
                      <p className="text-2xl font-bold text-primary-600">
                        ₱{getBookingsForSelectedDate().reduce((sum, r) => sum + parseFloat(r.total_amount), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              {filteredRentals.map((rental: any) => (
                <div
                  key={rental.id}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-secondary-900">
                            {rental.car?.make} {rental.car?.model}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusColor(rental.status)}`}>
                            {getStatusText(rental.status)}
                          </span>
                        </div>
                        <p className="text-secondary-600 text-sm">{rental.car?.plate_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary-500">
                          ₱{parseFloat(rental.total_amount).toLocaleString()}
                        </p>
                        <p className="text-sm text-secondary-600">Total</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <User size={20} weight="duotone" className="text-secondary-400" />
                        <div className="flex-1">
                          <p className="text-sm text-secondary-600">
                            Renter
                            {rental.is_manual_booking && (
                              <span className="ml-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                Guest
                              </span>
                            )}
                          </p>
                          <p className="font-semibold text-secondary-900">
                            {rental.is_manual_booking
                              ? rental.guest_renter_name || 'Guest Renter'
                              : rental.renter?.full_name || 'N/A'
                            }
                          </p>
                          {rental.is_manual_booking && rental.guest_renter_phone && (
                            <p className="text-xs text-secondary-600">{rental.guest_renter_phone}</p>
                          )}
                          {rental.is_manual_booking && rental.guest_renter_facebook && (
                            <a
                              href={rental.guest_renter_facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                              </svg>
                              Facebook Profile
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <CalendarBlank size={20} weight="duotone" className="text-secondary-400" />
                        <div>
                          <p className="text-sm text-secondary-600">Start</p>
                          <p className="font-semibold text-secondary-900">
                            {new Date(rental.start_datetime).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <CalendarBlank size={20} weight="duotone" className="text-secondary-400" />
                        <div>
                          <p className="text-sm text-secondary-600">End</p>
                          <p className="font-semibold text-secondary-900">
                            {new Date(rental.end_datetime).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {rental.notes && (
                      <div className="bg-secondary-50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-secondary-600">
                          <strong>Notes:</strong> {rental.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-secondary-200">
                      <button
                        onClick={() => openManageModal(rental)}
                        className="flex-1 text-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-all shadow-lg"
                      >
                        Manage Booking
                      </button>
                      <Link
                        href={`/owner/rentals/${rental.id}`}
                        className="flex-1 text-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={parseInt(searchParams.get('page') || '1')}
              totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)}
              totalItems={totalCount}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          )}

          {/* Back to Dashboard */}
          <div className="mt-8 text-center">
            <Link
              href="/owner/dashboard"
              className="inline-flex items-center gap-2 text-secondary-600 hover:text-primary-500 transition-colors font-semibold"
            >
              <ArrowLeft size={20} weight="duotone" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Manage Booking Modal */}
      {showManageModal && selectedRental && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Manage Booking</h2>
                  <p className="text-sm opacity-90">
                    {selectedRental.car?.make} {selectedRental.car?.model} - {selectedRental.car?.plate_number}
                  </p>
                </div>
                <button
                  onClick={() => setShowManageModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 hover:text-primary-600 p-2 rounded-lg transition-all"
                >
                  <X size={24} weight="bold" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Mileage */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                    <Gauge size={18} weight="duotone" className="text-primary-500" />
                    Start Mileage (km)
                  </label>
                  <input
                    type="number"
                    value={startMileage}
                    onChange={(e) => setStartMileage(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-bold text-secondary-900 bg-white"
                    placeholder="e.g., 15000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                    <Gauge size={18} weight="duotone" className="text-primary-500" />
                    End Mileage (km)
                  </label>
                  <input
                    type="number"
                    value={endMileage}
                    onChange={(e) => setEndMileage(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-bold text-secondary-900 bg-white"
                    placeholder="e.g., 15200"
                  />
                </div>
              </div>

              {/* Gas Level */}
              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                  <GasPump size={18} weight="duotone" className="text-purple-500" />
                  Gas Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['empty', 'quarter', 'half', 'full'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setGasLevel(level)}
                      className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                        gasLevel === level
                          ? 'bg-primary-500 text-white shadow-lg'
                          : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* RFID Balances */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                    <CreditCard size={18} weight="duotone" className="text-primary-500" />
                    EasyTrip Balance (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={easytripBalance}
                    onChange={(e) => setEasytripBalance(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-bold text-secondary-900 bg-white"
                    placeholder="e.g., 500.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                    <CreditCard size={18} weight="duotone" className="text-primary-500" />
                    Autosweep Balance (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={autosweepBalance}
                    onChange={(e) => setAutosweepBalance(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-bold text-secondary-900 bg-white"
                    placeholder="e.g., 300.00"
                  />
                </div>
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                  <CreditCard size={18} weight="duotone" className="text-primary-500" />
                  Payment Status
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['pending', 'partial', 'paid', 'refunded'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setPaymentStatus(status)}
                      className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                        paymentStatus === status
                          ? 'bg-primary-500 text-white shadow-lg'
                          : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition Notes */}
              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                  <FileText size={18} weight="duotone" className="text-primary-500" />
                  Condition Notes
                </label>
                <textarea
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base font-semibold text-secondary-900 bg-white resize-none"
                  placeholder="Describe the vehicle condition, any damages, cleanliness, etc."
                />
              </div>

              {/* Photos - Before Rental */}
              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                  <Camera size={18} weight="duotone" className="text-green-500" />
                  Condition Photos - Before Rental
                </label>

                {/* Existing Photos */}
                {selectedRental?.before_photos && selectedRental.before_photos.length > 0 && (
                  <div className="mb-3 p-3 bg-white rounded-lg border-2 border-green-300">
                    <p className="text-xs font-semibold text-green-700 mb-2">Current Photos ({selectedRental.before_photos.length})</p>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedRental.before_photos.map((url: string, idx: number) => (
                        <div key={idx} className="relative group">
                          <img
                            src={url}
                            alt={`Before ${idx + 1}`}
                            className="w-full h-16 object-cover rounded border-2 border-green-400"
                          />
                          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-60 transition-opacity rounded flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">View Only</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-secondary-600 mt-2">Note: Only admins can delete existing photos</p>
                  </div>
                )}

                <div className="border-2 border-dashed border-green-300 rounded-lg p-4 bg-green-50">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        setBeforePhotos(Array.from(e.target.files));
                      }
                    }}
                    className="hidden"
                    id="before-photos"
                  />
                  <label
                    htmlFor="before-photos"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Camera size={48} weight="duotone" className="text-green-500 mb-2" />
                    <p className="text-sm text-green-700 font-semibold mb-1">
                      {beforePhotos.length > 0 ? `${beforePhotos.length} new photo(s) selected` : 'Click to upload new photos'}
                    </p>
                    <p className="text-xs text-secondary-600">
                      Add more photos for this rental
                    </p>
                  </label>

                  {beforePhotos.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {beforePhotos.map((file, idx) => {
                        let imageUrl = '';
                        try {
                          imageUrl = typeof window !== 'undefined' ? URL.createObjectURL(file) : '';
                        } catch (e) {
                          console.error('Error creating object URL:', e);
                        }

                        return (
                          <div key={idx} className="relative group">
                            {imageUrl && (
                              <img
                                src={imageUrl}
                                alt={`Before ${idx + 1}`}
                                className="w-full h-20 object-cover rounded-lg border-2 border-green-400"
                              />
                            )}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setBeforePhotos(beforePhotos.filter((_, i) => i !== idx));
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={14} weight="bold" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Photos - After Rental */}
              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                  <Camera size={18} weight="duotone" className="text-blue-500" />
                  Condition Photos - After Rental
                </label>

                {/* Existing Photos */}
                {selectedRental?.after_photos && selectedRental.after_photos.length > 0 && (
                  <div className="mb-3 p-3 bg-white rounded-lg border-2 border-blue-300">
                    <p className="text-xs font-semibold text-blue-700 mb-2">Current Photos ({selectedRental.after_photos.length})</p>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedRental.after_photos.map((url: string, idx: number) => (
                        <div key={idx} className="relative group">
                          <img
                            src={url}
                            alt={`After ${idx + 1}`}
                            className="w-full h-16 object-cover rounded border-2 border-blue-400"
                          />
                          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-60 transition-opacity rounded flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">View Only</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-secondary-600 mt-2">Note: Only admins can delete existing photos</p>
                  </div>
                )}

                <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        setAfterPhotos(Array.from(e.target.files));
                      }
                    }}
                    className="hidden"
                    id="after-photos"
                  />
                  <label
                    htmlFor="after-photos"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Camera size={48} weight="duotone" className="text-blue-500 mb-2" />
                    <p className="text-sm text-blue-700 font-semibold mb-1">
                      {afterPhotos.length > 0 ? `${afterPhotos.length} new photo(s) selected` : 'Click to upload new photos'}
                    </p>
                    <p className="text-xs text-secondary-600">
                      Add more photos for this rental
                    </p>
                  </label>

                  {afterPhotos.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {afterPhotos.map((file, idx) => {
                        let imageUrl = '';
                        try {
                          imageUrl = typeof window !== 'undefined' ? URL.createObjectURL(file) : '';
                        } catch (e) {
                          console.error('Error creating object URL:', e);
                        }

                        return (
                          <div key={idx} className="relative group">
                            {imageUrl && (
                              <img
                                src={imageUrl}
                                alt={`After ${idx + 1}`}
                                className="w-full h-20 object-cover rounded-lg border-2 border-blue-400"
                              />
                            )}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setAfterPhotos(afterPhotos.filter((_, i) => i !== idx));
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={14} weight="bold" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-secondary-200">
                <button
                  onClick={() => setShowManageModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-secondary-300 text-secondary-700 rounded-xl font-bold hover:bg-secondary-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveBookingDetails}
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-secondary-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={20} weight="bold" />
                      Save Details
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OwnerRentalsPage() {
  return (
    <ToastProvider>
      <OwnerRentalsPageContent />
    </ToastProvider>
  );
}
