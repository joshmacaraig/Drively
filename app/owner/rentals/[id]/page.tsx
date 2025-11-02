'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Car,
  User,
  Calendar,
  CurrencyCircleDollar,
  Phone,
  EnvelopeSimple,
  MapPin,
  Gauge,
  GasPump,
  CreditCard,
  FileText,
  Camera,
  Clock,
  X,
  CaretLeft,
  CaretRight,
  PencilSimple,
  Check,
  ShieldCheck,
  IdentificationCard,
  CalendarBlank,
  Star,
} from '@phosphor-icons/react';
import { useToast } from '@/components/ui/ToastContainer';
import OwnerNavigation from '@/components/owner/OwnerNavigation';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { ownerQuotes } from '@/lib/loadingQuotes';

export default function RentalDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const rentalId = params?.id as string;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [rental, setRental] = useState<any>(null);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImageSet, setCurrentImageSet] = useState<string[]>([]);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [startMileage, setStartMileage] = useState('');
  const [endMileage, setEndMileage] = useState('');
  const [gasLevel, setGasLevel] = useState('full');
  const [easytripBalance, setEasytripBalance] = useState('');
  const [autosweepBalance, setAutosweepBalance] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [beforePhotos, setBeforePhotos] = useState<File[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<File[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [renterTripCount, setRenterTripCount] = useState<number>(0);

  useEffect(() => {
    if (rentalId) {
      loadRentalDetails();
    }
  }, [rentalId]);

  const loadRentalDetails = async () => {
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

      const { data, error } = await supabase
        .from('rentals')
        .select(`
          *,
          car:cars!rentals_car_id_fkey(id, make, model, year, plate_number, daily_rate, primary_image_url),
          renter:profiles!rentals_renter_id_fkey(id, full_name, phone_number, email, verification_status, created_at, proof_of_id_urls, drivers_license_urls)
        `)
        .eq('id', rentalId)
        .eq('owner_id', user.id)
        .single();

      if (error) throw error;
      if (!data) {
        setError('Rental not found');
        return;
      }

      setRental(data);

      // Count renter's previous completed trips (only if not a guest booking)
      if (!data.is_manual_booking && data.renter_id) {
        const { count } = await supabase
          .from('rentals')
          .select('*', { count: 'exact', head: true })
          .eq('renter_id', data.renter_id)
          .eq('status', 'completed');

        setRenterTripCount(count || 0);
      }

      // Initialize form fields
      setStartMileage(data.start_mileage?.toString() || '');
      setEndMileage(data.end_mileage?.toString() || '');
      setGasLevel(data.gas_level || 'full');
      setEasytripBalance(data.easytrip_balance?.toString() || '');
      setAutosweepBalance(data.autosweep_balance?.toString() || '');
      setConditionNotes(data.condition_notes || '');
      setPaymentStatus(data.payment_status || 'pending');
    } catch (err: any) {
      console.error('Error loading rental details:', err);
      setError(err.message || 'Failed to load rental details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setBeforePhotos([]);
    setAfterPhotos([]);
    // Reset form fields to current rental data
    if (rental) {
      setStartMileage(rental.start_mileage?.toString() || '');
      setEndMileage(rental.end_mileage?.toString() || '');
      setGasLevel(rental.gas_level || 'full');
      setEasytripBalance(rental.easytrip_balance?.toString() || '');
      setAutosweepBalance(rental.autosweep_balance?.toString() || '');
      setConditionNotes(rental.condition_notes || '');
      setPaymentStatus(rental.payment_status || 'pending');
    }
  };

  const handleSaveChanges = async () => {
    if (!rental) return;

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
          const fileName = `${rental.id}/before/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('rental-photos')
            .upload(fileName, photo);

          if (uploadError) {
            console.error('Error uploading before photo:', uploadError);
            showToast(`Failed to upload photo: ${photo.name}`, 'warning');
            continue;
          }

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
          const fileName = `${rental.id}/after/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('rental-photos')
            .upload(fileName, photo);

          if (uploadError) {
            console.error('Error uploading after photo:', uploadError);
            showToast(`Failed to upload photo: ${photo.name}`, 'warning');
            continue;
          }

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
        const existingBeforePhotos = rental.before_photos || [];
        updates.before_photos = [...existingBeforePhotos, ...beforePhotoUrls];
      }
      if (afterPhotoUrls.length > 0) {
        const existingAfterPhotos = rental.after_photos || [];
        updates.after_photos = [...existingAfterPhotos, ...afterPhotoUrls];
      }

      const { error } = await supabase
        .from('rentals')
        .update(updates)
        .eq('id', rental.id);

      if (error) throw error;

      showToast('Booking details updated successfully!', 'success');
      setIsEditing(false);
      setBeforePhotos([]);
      setAfterPhotos([]);
      loadRentalDetails();
    } catch (err: any) {
      console.error('Error saving booking details:', err);
      showToast(`Failed to save booking details: ${err?.message || 'Unknown error'}`, 'error');
    } finally {
      setIsSaving(false);
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'partial':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'paid':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'refunded':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPaymentStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const openImageViewer = (images: string[], index: number) => {
    setCurrentImageSet(images);
    setCurrentImageIndex(index);
    setSelectedImage(images[index]);
  };

  const closeImageViewer = () => {
    setSelectedImage(null);
    setCurrentImageSet([]);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (currentImageIndex < currentImageSet.length - 1) {
      const newIndex = currentImageIndex + 1;
      setCurrentImageIndex(newIndex);
      setSelectedImage(currentImageSet[newIndex]);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      const newIndex = currentImageIndex - 1;
      setCurrentImageIndex(newIndex);
      setSelectedImage(currentImageSet[newIndex]);
    }
  };

  if (loading) {
    return <LoadingOverlay quotes={ownerQuotes} />;
  }

  if (error || !rental) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-secondary-900 mb-4">
            {error || 'Rental not found'}
          </h1>
          <Link
            href="/owner/rentals"
            className="text-primary-500 hover:text-primary-600 font-semibold"
          >
            Back to Rentals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Navigation */}
      <OwnerNavigation
        userFullName={userProfile?.full_name}
        userAvatar={userProfile?.avatar_url}
      />

      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/owner/rentals"
              className="inline-flex items-center gap-2 text-secondary-600 hover:text-primary-500 mb-4 transition-colors"
            >
              <ArrowLeft size={20} weight="duotone" />
              Back to Rentals
            </Link>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 flex items-center gap-3">
                  <Calendar size={40} weight="duotone" className="text-primary-500" />
                  Rental Details
                </h1>
                <p className="text-secondary-600 mt-2">
                  Booking ID: {rental.id.substring(0, 8)}...
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(rental.status)}`}>
                  {getStatusText(rental.status)}
                </span>

                {!isEditing ? (
                  <button
                    onClick={handleEditClick}
                    className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
                  >
                    <PencilSimple size={20} weight="bold" />
                    Update
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="bg-secondary-200 hover:bg-secondary-300 disabled:bg-secondary-100 disabled:cursor-not-allowed text-secondary-900 px-4 py-2 rounded-xl font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-secondary-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check size={20} weight="bold" />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Car Information */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-secondary-900 mb-4 flex items-center gap-2">
                  <Car size={24} weight="duotone" className="text-primary-500" />
                  Vehicle Information
                </h2>

                {rental.car?.primary_image_url && (
                  <img
                    src={rental.car.primary_image_url}
                    alt={`${rental.car.make} ${rental.car.model}`}
                    className="w-full h-48 object-cover rounded-xl mb-4"
                  />
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-secondary-600">Make & Model</p>
                    <p className="text-lg font-bold text-secondary-900">
                      {rental.car?.year} {rental.car?.make} {rental.car?.model}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-600">Plate Number</p>
                    <p className="text-lg font-bold text-secondary-900">{rental.car?.plate_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-600">Daily Rate</p>
                    <p className="text-lg font-bold text-primary-600">
                      ₱{parseFloat(rental.car?.daily_rate || 0).toLocaleString()}/day
                    </p>
                  </div>
                </div>
              </div>

              {/* Renter Information */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-secondary-900 mb-4 flex items-center gap-2">
                  <User size={24} weight="duotone" className="text-primary-500" />
                  Renter Information
                  {rental.is_manual_booking && (
                    <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-semibold">
                      Guest Booking
                    </span>
                  )}
                </h2>

                {/* Verification Status - Only for registered renters */}
                {!rental.is_manual_booking && rental.renter && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck size={24} weight="duotone" className="text-green-600" />
                      <h3 className="font-bold text-secondary-900">Verification Status</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* ID Verification Badge */}
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                        rental.renter.proof_of_id_urls && rental.renter.proof_of_id_urls.length > 0 && rental.renter.verification_status === 'verified'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <IdentificationCard size={18} weight="duotone" />
                        <div className="text-xs">
                          <p className="font-semibold">ID {rental.renter.proof_of_id_urls && rental.renter.proof_of_id_urls.length > 0 && rental.renter.verification_status === 'verified' ? 'Verified' : 'Not Verified'}</p>
                        </div>
                      </div>

                      {/* License Verification Badge */}
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                        rental.renter.drivers_license_urls && rental.renter.drivers_license_urls.length > 0 && rental.renter.verification_status === 'verified'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Car size={18} weight="duotone" />
                        <div className="text-xs">
                          <p className="font-semibold">License {rental.renter.drivers_license_urls && rental.renter.drivers_license_urls.length > 0 && rental.renter.verification_status === 'verified' ? 'Verified' : 'Not Verified'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Account Standing & Stats */}
                    <div className="mt-3 pt-3 border-t border-green-200 grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <CalendarBlank size={16} weight="duotone" className="text-secondary-500" />
                        <div>
                          <p className="text-secondary-600">Member Since</p>
                          <p className="font-semibold text-secondary-900">
                            {new Date(rental.renter.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Car size={16} weight="duotone" className="text-secondary-500" />
                        <div>
                          <p className="text-secondary-600">Completed Trips</p>
                          <p className="font-semibold text-secondary-900">{renterTripCount}</p>
                        </div>
                      </div>
                    </div>

                    {/* Rating Placeholder */}
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <div className="flex items-center gap-2">
                        <Star size={16} weight="fill" className="text-yellow-500" />
                        <p className="text-xs text-secondary-600">
                          Rating: <span className="font-semibold text-secondary-900">New Renter</span>
                          <span className="ml-1 text-secondary-500">(Rating system coming soon)</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User size={20} weight="duotone" className="text-secondary-400" />
                    <div>
                      <p className="text-sm text-secondary-600">Name</p>
                      <p className="font-semibold text-secondary-900">
                        {rental.is_manual_booking
                          ? rental.guest_renter_name || 'Guest Renter'
                          : rental.renter?.full_name || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {rental.is_manual_booking ? (
                    <>
                      {rental.guest_renter_phone && (
                        <div className="flex items-center gap-3">
                          <Phone size={20} weight="duotone" className="text-secondary-400" />
                          <div>
                            <p className="text-sm text-secondary-600">Phone</p>
                            <p className="font-semibold text-secondary-900">{rental.guest_renter_phone}</p>
                          </div>
                        </div>
                      )}

                      {rental.guest_renter_email && (
                        <div className="flex items-center gap-3">
                          <EnvelopeSimple size={20} weight="duotone" className="text-secondary-400" />
                          <div>
                            <p className="text-sm text-secondary-600">Email</p>
                            <p className="font-semibold text-secondary-900">{rental.guest_renter_email}</p>
                          </div>
                        </div>
                      )}

                      {rental.guest_renter_facebook && (
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-secondary-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          <div>
                            <p className="text-sm text-secondary-600">Facebook</p>
                            <a
                              href={rental.guest_renter_facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-blue-600 hover:text-blue-700"
                            >
                              View Profile
                            </a>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {rental.renter?.phone_number && (
                        <div className="flex items-center gap-3">
                          <Phone size={20} weight="duotone" className="text-secondary-400" />
                          <div>
                            <p className="text-sm text-secondary-600">Phone</p>
                            <p className="font-semibold text-secondary-900">{rental.renter.phone_number}</p>
                          </div>
                        </div>
                      )}

                      {rental.renter?.email && (
                        <div className="flex items-center gap-3">
                          <EnvelopeSimple size={20} weight="duotone" className="text-secondary-400" />
                          <div>
                            <p className="text-sm text-secondary-600">Email</p>
                            <p className="font-semibold text-secondary-900">{rental.renter.email}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Booking Details */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-secondary-900 mb-4 flex items-center gap-2">
                  <FileText size={24} weight="duotone" className="text-primary-500" />
                  Booking Details
                  {isEditing && (
                    <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-semibold">
                      Editing Mode
                    </span>
                  )}
                </h2>

                {isEditing ? (
                  /* Edit Mode */
                  <div className="space-y-4">
                    {/* Mileage */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-secondary-700 mb-2">
                          Start Mileage (km)
                        </label>
                        <input
                          type="number"
                          value={startMileage}
                          onChange={(e) => setStartMileage(e.target.value)}
                          className="w-full px-4 py-2 border-2 border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base font-semibold text-secondary-900 bg-white"
                          placeholder="e.g., 15000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-secondary-700 mb-2">
                          End Mileage (km)
                        </label>
                        <input
                          type="number"
                          value={endMileage}
                          onChange={(e) => setEndMileage(e.target.value)}
                          className="w-full px-4 py-2 border-2 border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base font-semibold text-secondary-900 bg-white"
                          placeholder="e.g., 15200"
                        />
                      </div>
                    </div>

                    {/* Gas Level */}
                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">
                        Gas Level
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {['empty', 'quarter', 'half', 'full'].map((level) => (
                          <button
                            key={level}
                            onClick={() => setGasLevel(level)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
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
                        <label className="block text-sm font-semibold text-secondary-700 mb-2">
                          EasyTrip Balance (₱)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={easytripBalance}
                          onChange={(e) => setEasytripBalance(e.target.value)}
                          className="w-full px-4 py-2 border-2 border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base font-semibold text-secondary-900 bg-white"
                          placeholder="e.g., 500.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-secondary-700 mb-2">
                          Autosweep Balance (₱)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={autosweepBalance}
                          onChange={(e) => setAutosweepBalance(e.target.value)}
                          className="w-full px-4 py-2 border-2 border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base font-semibold text-secondary-900 bg-white"
                          placeholder="e.g., 300.00"
                        />
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                        <CurrencyCircleDollar size={18} weight="duotone" className="text-primary-500" />
                        Payment Status
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {['pending', 'partial', 'paid', 'refunded'].map((status) => (
                          <button
                            key={status}
                            onClick={() => setPaymentStatus(status)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
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
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">
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

                    {/* Photo Upload */}
                    <div className="border-t border-secondary-200 pt-4">
                      <h3 className="text-sm font-bold text-secondary-900 mb-3">Add Photos</h3>

                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Before Photos */}
                        <div>
                          <label className="block text-xs font-semibold text-green-700 mb-2">
                            Before Rental Photos
                          </label>
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
                            id="edit-before-photos"
                          />
                          <label
                            htmlFor="edit-before-photos"
                            className="cursor-pointer flex flex-col items-center p-4 border-2 border-dashed border-green-300 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
                          >
                            <Camera size={32} weight="duotone" className="text-green-500 mb-2" />
                            <p className="text-xs text-green-700 font-semibold text-center">
                              {beforePhotos.length > 0 ? `${beforePhotos.length} photo(s) selected` : 'Click to add photos'}
                            </p>
                          </label>
                        </div>

                        {/* After Photos */}
                        <div>
                          <label className="block text-xs font-semibold text-blue-700 mb-2">
                            After Rental Photos
                          </label>
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
                            id="edit-after-photos"
                          />
                          <label
                            htmlFor="edit-after-photos"
                            className="cursor-pointer flex flex-col items-center p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            <Camera size={32} weight="duotone" className="text-blue-500 mb-2" />
                            <p className="text-xs text-blue-700 font-semibold text-center">
                              {afterPhotos.length > 0 ? `${afterPhotos.length} photo(s) selected` : 'Click to add photos'}
                            </p>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Mileage */}
                      {(rental.start_mileage || rental.end_mileage || startMileage || endMileage) && (
                        <>
                          <div className="flex items-center gap-3">
                            <Gauge size={20} weight="duotone" className="text-secondary-400" />
                            <div>
                              <p className="text-sm text-secondary-600">Start Mileage</p>
                              <p className="font-semibold text-secondary-900">
                                {rental.start_mileage ? `${rental.start_mileage.toLocaleString()} km` : 'Not recorded'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Gauge size={20} weight="duotone" className="text-secondary-400" />
                            <div>
                              <p className="text-sm text-secondary-600">End Mileage</p>
                              <p className="font-semibold text-secondary-900">
                                {rental.end_mileage ? `${rental.end_mileage.toLocaleString()} km` : 'Not recorded'}
                              </p>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Gas Level */}
                      {rental.gas_level && (
                        <div className="flex items-center gap-3">
                          <GasPump size={20} weight="duotone" className="text-secondary-400" />
                          <div>
                            <p className="text-sm text-secondary-600">Gas Level</p>
                            <p className="font-semibold text-secondary-900 capitalize">{rental.gas_level}</p>
                          </div>
                        </div>
                      )}

                      {/* RFID Balances */}
                      {(rental.easytrip_balance || rental.autosweep_balance) && (
                        <>
                          {rental.easytrip_balance && (
                            <div className="flex items-center gap-3">
                              <CreditCard size={20} weight="duotone" className="text-secondary-400" />
                              <div>
                                <p className="text-sm text-secondary-600">EasyTrip Balance</p>
                                <p className="font-semibold text-secondary-900">
                                  ₱{parseFloat(rental.easytrip_balance).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}

                          {rental.autosweep_balance && (
                            <div className="flex items-center gap-3">
                              <CreditCard size={20} weight="duotone" className="text-secondary-400" />
                              <div>
                                <p className="text-sm text-secondary-600">Autosweep Balance</p>
                                <p className="font-semibold text-secondary-900">
                                  ₱{parseFloat(rental.autosweep_balance).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Condition Notes */}
                    {rental.condition_notes && (
                      <div className="mt-4 p-4 bg-secondary-50 rounded-lg">
                        <p className="text-sm font-semibold text-secondary-700 mb-1">Condition Notes</p>
                        <p className="text-sm text-secondary-900">{rental.condition_notes}</p>
                      </div>
                    )}

                    {/* Notes */}
                    {rental.notes && (
                      <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                        <p className="text-sm font-semibold text-secondary-700 mb-1">Additional Notes</p>
                        <p className="text-sm text-secondary-900">{rental.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Photos */}
              {((rental.before_photos && rental.before_photos.length > 0) ||
                (rental.after_photos && rental.after_photos.length > 0)) && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h2 className="text-xl font-bold text-secondary-900 mb-4 flex items-center gap-2">
                    <Camera size={24} weight="duotone" className="text-primary-500" />
                    Condition Photos
                  </h2>

                  {rental.before_photos && rental.before_photos.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                        <Camera size={18} weight="duotone" className="text-green-500" />
                        Before Rental
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {rental.before_photos.map((url: string, idx: number) => (
                          <div
                            key={idx}
                            onClick={() => openImageViewer(rental.before_photos, idx)}
                            className="cursor-pointer group"
                          >
                            <img
                              src={url}
                              alt={`Before ${idx + 1}`}
                              className="w-full h-32 object-cover rounded-lg border-2 border-green-400 group-hover:border-green-600 transition-all group-hover:scale-105"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {rental.after_photos && rental.after_photos.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                        <Camera size={18} weight="duotone" className="text-blue-500" />
                        After Rental
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {rental.after_photos.map((url: string, idx: number) => (
                          <div
                            key={idx}
                            onClick={() => openImageViewer(rental.after_photos, idx)}
                            className="cursor-pointer group"
                          >
                            <img
                              src={url}
                              alt={`After ${idx + 1}`}
                              className="w-full h-32 object-cover rounded-lg border-2 border-blue-400 group-hover:border-blue-600 transition-all group-hover:scale-105"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Payment Summary */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                  <CurrencyCircleDollar size={24} weight="duotone" className="text-primary-500" />
                  Payment
                </h2>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-600">Total Amount</span>
                    <span className="text-2xl font-bold text-primary-600">
                      ₱{parseFloat(rental.total_amount).toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-secondary-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-secondary-600">Payment Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getPaymentStatusColor(rental.payment_status || 'pending')}`}>
                        {getPaymentStatusText(rental.payment_status || 'pending')}
                      </span>
                    </div>
                    <p className="text-xs text-secondary-500">
                      Daily rate: ₱{parseFloat(rental.car?.daily_rate || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rental Period */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                  <Clock size={24} weight="duotone" className="text-primary-500" />
                  Rental Period
                </h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-secondary-600 mb-1">Start</p>
                    <p className="font-semibold text-secondary-900">
                      {new Date(rental.start_datetime).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-secondary-600">
                      {new Date(rental.start_datetime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div className="border-t border-secondary-200 pt-4">
                    <p className="text-xs text-secondary-600 mb-1">End</p>
                    <p className="font-semibold text-secondary-900">
                      {new Date(rental.end_datetime).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-secondary-600">
                      {new Date(rental.end_datetime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div className="border-t border-secondary-200 pt-4">
                    <p className="text-xs text-secondary-600 mb-1">Duration</p>
                    <p className="font-semibold text-secondary-900">
                      {Math.ceil(
                        (new Date(rental.end_datetime).getTime() - new Date(rental.start_datetime).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{' '}
                      day(s)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
          onClick={closeImageViewer}
        >
          <button
            onClick={closeImageViewer}
            className="absolute top-4 right-4 text-white hover:text-primary-400 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all z-10"
          >
            <X size={32} weight="bold" />
          </button>

          {/* Previous Button */}
          {currentImageIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-primary-400 p-3 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all"
            >
              <CaretLeft size={40} weight="bold" />
            </button>
          )}

          {/* Next Button */}
          {currentImageIndex < currentImageSet.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-primary-400 p-3 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all"
            >
              <CaretRight size={40} weight="bold" />
            </button>
          )}

          <div className="max-w-7xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain rounded-lg"
            />

            {/* Image Counter */}
            <div className="mt-4 text-white text-center">
              <p className="text-lg font-semibold">
                {currentImageIndex + 1} / {currentImageSet.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
