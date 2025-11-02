'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Wrench,
  Car,
  Calendar,
  CurrencyCircleDollar,
  FileText,
  GasPump,
  Plus,
} from '@phosphor-icons/react';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { savingQuotes } from '@/lib/loadingQuotes';
import OwnerNavigation from '@/components/owner/OwnerNavigation';

export default function NewMaintenancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cars, setCars] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Form state
  const [carId, setCarId] = useState('');
  const [maintenanceType, setMaintenanceType] = useState<'routine' | 'repair' | 'inspection' | 'other'>('routine');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [serviceProvider, setServiceProvider] = useState('');
  const [maintenanceDate, setMaintenanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState('');
  const [mileage, setMileage] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'scheduled' | 'in_progress' | 'completed'>('completed');

  useEffect(() => {
    loadCars();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setUserProfile(profileData);
      }
    } catch (err: any) {
      console.error('Error loading user profile:', err);
    }
  };

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
        .select('id, make, model, year, plate_number')
        .eq('owner_id', user.id)
        .order('make', { ascending: true });

      if (error) throw error;
      setCars(data || []);
    } catch (err: any) {
      console.error('Error loading cars:', err);
      setError('Failed to load cars');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { error: insertError } = await supabase
        .from('maintenance_records')
        .insert({
          car_id: carId,
          owner_id: user.id,
          maintenance_type: maintenanceType,
          description,
          cost: cost ? parseFloat(cost) : null,
          service_provider: serviceProvider || null,
          maintenance_date: maintenanceDate,
          next_maintenance_date: nextMaintenanceDate || null,
          mileage: mileage ? parseInt(mileage) : null,
          notes: notes || null,
          status,
        });

      if (insertError) throw insertError;

      router.push('/owner/maintenance');
    } catch (err: any) {
      console.error('Error creating maintenance record:', err);
      setError(err.message || 'Failed to create maintenance record');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingOverlay quotes={savingQuotes} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Navigation */}
      <OwnerNavigation
        userFullName={userProfile?.full_name}
        userAvatar={userProfile?.avatar_url}
      />

      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/owner/maintenance"
              className="inline-flex items-center gap-2 text-secondary-600 hover:text-primary-500 mb-4 transition-colors"
            >
              <ArrowLeft size={20} weight="duotone" />
              Back to Maintenance
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">Add Maintenance Record</h1>
            <p className="text-secondary-600 mt-2">
              Track maintenance, repairs, and inspections for your vehicles
            </p>
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
              </h2>
              <select
                required
                value={carId}
                onChange={(e) => setCarId(e.target.value)}
                className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900"
              >
                <option value="">Choose a car</option>
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.year} {car.make} {car.model} - {car.plate_number}
                  </option>
                ))}
              </select>
            </div>

            {/* Maintenance Type & Status */}
            <div className="mb-8">
              <h2 className="text-lg md:text-xl font-bold text-secondary-900 mb-4 flex items-center gap-2">
                <Wrench size={24} weight="duotone" className="text-primary-500" />
                Maintenance Details
              </h2>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="maintenanceType" className="block text-sm font-medium text-secondary-700 mb-2">
                    Type *
                  </label>
                  <select
                    id="maintenanceType"
                    required
                    value={maintenanceType}
                    onChange={(e) => setMaintenanceType(e.target.value as any)}
                    className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900"
                  >
                    <option value="routine">Routine Maintenance</option>
                    <option value="repair">Repair</option>
                    <option value="inspection">Inspection</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-secondary-700 mb-2">
                    Status *
                  </label>
                  <select
                    id="status"
                    required
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-secondary-700 mb-2">
                  Description *
                </label>
                <input
                  id="description"
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900"
                  placeholder="e.g., Oil change, Brake pad replacement"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="serviceProvider" className="block text-sm font-medium text-secondary-700 mb-2">
                    Service Provider
                  </label>
                  <input
                    id="serviceProvider"
                    type="text"
                    value={serviceProvider}
                    onChange={(e) => setServiceProvider(e.target.value)}
                    className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900"
                    placeholder="e.g., Auto Shop XYZ"
                  />
                </div>

                <div>
                  <label htmlFor="mileage" className="block text-sm font-medium text-secondary-700 mb-2">
                    <GasPump size={16} weight="duotone" className="inline mr-1" />
                    Mileage (km)
                  </label>
                  <input
                    id="mileage"
                    type="number"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900"
                    placeholder="e.g., 50000"
                  />
                </div>
              </div>
            </div>

            {/* Dates & Cost */}
            <div className="mb-8">
              <h2 className="text-lg md:text-xl font-bold text-secondary-900 mb-4 flex items-center gap-2">
                <Calendar size={24} weight="duotone" className="text-primary-500" />
                Date & Cost
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="maintenanceDate" className="block text-sm font-medium text-secondary-700 mb-2">
                    Maintenance Date *
                  </label>
                  <input
                    id="maintenanceDate"
                    type="date"
                    required
                    value={maintenanceDate}
                    onChange={(e) => setMaintenanceDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900"
                  />
                </div>

                <div>
                  <label htmlFor="nextMaintenanceDate" className="block text-sm font-medium text-secondary-700 mb-2">
                    Next Due Date
                  </label>
                  <input
                    id="nextMaintenanceDate"
                    type="date"
                    value={nextMaintenanceDate}
                    onChange={(e) => setNextMaintenanceDate(e.target.value)}
                    min={maintenanceDate}
                    className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900"
                  />
                </div>

                <div>
                  <label htmlFor="cost" className="block text-sm font-medium text-secondary-700 mb-2">
                    <CurrencyCircleDollar size={16} weight="duotone" className="inline mr-1" />
                    Cost (₱)
                  </label>
                  <input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-8">
              <label htmlFor="notes" className="block text-sm font-medium text-secondary-700 mb-2">
                <FileText size={16} weight="duotone" className="inline mr-1" />
                Additional Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900 resize-none"
                placeholder="Any additional details, parts replaced, recommendations..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Link
                href="/owner/maintenance"
                className="flex-1 px-6 py-3 border-2 border-secondary-200 text-secondary-700 rounded-lg font-semibold hover:border-secondary-300 transition-colors text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !carId}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus size={20} weight="duotone" />
                    Save Record
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
