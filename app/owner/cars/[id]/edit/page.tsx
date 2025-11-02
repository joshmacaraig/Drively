'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Car,
  Calendar,
  FileText,
  Palette,
  GearSix,
  GasPump,
  Users,
  CurrencyCircleDollar,
  MapPin,
  Plus,
  X,
  Image as ImageIcon,
  CheckCircle,
  FloppyDisk
} from '@phosphor-icons/react';
import PricingRulesManager from '@/components/owner/PricingRulesManager';

export default function EditCarPage() {
  const params = useParams();
  const carId = params?.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form state
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [color, setColor] = useState('');
  const [transmission, setTransmission] = useState<'automatic' | 'manual'>('automatic');
  const [fuelType, setFuelType] = useState<'gasoline' | 'diesel' | 'electric' | 'hybrid'>('gasoline');
  const [seats, setSeats] = useState('5');
  const [dailyRate, setDailyRate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);

  const currentYear = new Date().getFullYear();

  const commonFeatures = [
    'Air Conditioning',
    'Bluetooth',
    'Backup Camera',
    'GPS Navigation',
    'USB Ports',
    'Apple CarPlay',
    'Android Auto',
    'Leather Seats',
    'Sunroof',
    'Cruise Control',
  ];

  useEffect(() => {
    if (carId) {
      loadCarData();
    }
  }, [carId]);

  const loadCarData = async () => {
    try {
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Fetch car data
      const { data: car, error: carError } = await supabase
        .from('cars')
        .select('*')
        .eq('id', carId)
        .eq('owner_id', user.id)
        .single();

      if (carError || !car) {
        setError('Car not found');
        return;
      }

      // Fetch car images
      const { data: images } = await supabase
        .from('car_images')
        .select('*')
        .eq('car_id', carId)
        .order('display_order', { ascending: true });

      // Set form data
      setMake(car.make);
      setModel(car.model);
      setYear(car.year.toString());
      setPlateNumber(car.plate_number);
      setColor(car.color || '');
      setTransmission(car.transmission);
      setFuelType(car.fuel_type);
      setSeats(car.seats?.toString() || '5');
      setDailyRate(car.daily_rate.toString());
      setLocation(car.location || '');
      setDescription(car.description || '');
      setFeatures(car.features || []);
      setExistingImages(images || []);

      // Find primary image index
      const primaryIdx = images?.findIndex(img => img.is_primary) ?? 0;
      setPrimaryImageIndex(primaryIdx >= 0 ? primaryIdx : 0);

    } catch (err: any) {
      console.error('Error loading car:', err);
      setError(err.message || 'Failed to load car data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (feature: string) => {
    setFeatures(features.filter(f => f !== feature));
  };

  const toggleCommonFeature = (feature: string) => {
    if (features.includes(feature)) {
      handleRemoveFeature(feature);
    } else {
      setFeatures([...features, feature]);
    }
  };

  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const totalImages = existingImages.length + newImages.length;
    const newFiles = Array.from(files).slice(0, 5 - totalImages);
    setNewImages([...newImages, ...newFiles]);

    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveExistingImage = async (imageId: string) => {
    try {
      const supabase = createClient();
      const image = existingImages.find(img => img.id === imageId);

      if (image) {
        // Delete from storage
        const path = image.image_url.split('/').slice(-2).join('/');
        await supabase.storage.from('drively-storage').remove([path]);

        // Delete from database
        await supabase.from('car_images').delete().eq('id', imageId);

        setExistingImages(existingImages.filter(img => img.id !== imageId));
      }
    } catch (err) {
      console.error('Error removing image:', err);
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index));
  };

  const uploadNewImages = async (carId: string, supabase: any) => {
    if (newImages.length === 0) return;

    const currentCount = existingImages.length;

    for (let i = 0; i < newImages.length; i++) {
      const file = newImages[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${carId}/${Date.now()}-${i}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('drively-storage')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('drively-storage')
        .getPublicUrl(fileName);

      await supabase.from('car_images').insert({
        car_id: carId,
        image_url: publicUrl,
        is_primary: (currentCount + i) === primaryImageIndex,
        display_order: currentCount + i,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const supabase = createClient();

      // Update car data
      const { error: updateError } = await supabase
        .from('cars')
        .update({
          make,
          model,
          year: parseInt(year),
          plate_number: plateNumber.toUpperCase(),
          color,
          transmission,
          fuel_type: fuelType,
          seats: parseInt(seats),
          daily_rate: parseFloat(dailyRate),
          location,
          description,
          features,
          updated_at: new Date().toISOString(),
        })
        .eq('id', carId);

      if (updateError) throw updateError;

      // Upload new images if any
      if (newImages.length > 0) {
        await uploadNewImages(carId, supabase);
      }

      setSuccess(true);

      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push(`/owner/cars/${carId}`);
      }, 1500);

    } catch (err: any) {
      console.error('Error updating car:', err);
      setError(err.message || 'Failed to update car. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading car data...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-green-500 mb-4">
            <CheckCircle size={64} weight="duotone" className="mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">
            Car Updated Successfully!
          </h2>
          <p className="text-secondary-600 mb-4">
            Your {make} {model} has been updated.
          </p>
          <p className="text-sm text-secondary-500">
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href={`/owner/cars/${carId}`}
              className="inline-flex items-center gap-2 text-secondary-600 hover:text-primary-500 mb-4 transition-colors"
            >
              <ArrowLeft size={20} weight="duotone" />
              Back to Car Details
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">Edit Car</h1>
            <p className="text-secondary-600 mt-2">
              Update your vehicle information
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-4 md:p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            {/* Vehicle Information */}
            <div className="mb-8">
              <h2 className="text-lg md:text-xl font-bold text-secondary-900 mb-4 flex items-center gap-2">
                <Car size={24} weight="duotone" className="text-primary-500" />
                Vehicle Information
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="make" className="block text-sm font-medium text-secondary-700 mb-2">
                    Make *
                  </label>
                  <input
                    id="make"
                    type="text"
                    required
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900 placeholder:text-secondary-400"
                  />
                </div>

                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-secondary-700 mb-2">
                    Model *
                  </label>
                  <input
                    id="model"
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900 placeholder:text-secondary-400"
                  />
                </div>

                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-secondary-700 mb-2">
                    Year *
                  </label>
                  <input
                    id="year"
                    type="number"
                    required
                    min="1900"
                    max={currentYear + 1}
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900 placeholder:text-secondary-400"
                  />
                </div>

                <div>
                  <label htmlFor="plateNumber" className="block text-sm font-medium text-secondary-700 mb-2">
                    Plate Number *
                  </label>
                  <input
                    id="plateNumber"
                    type="text"
                    required
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                    className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900 placeholder:text-secondary-400"
                  />
                </div>

                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-secondary-700 mb-2">
                    Color
                  </label>
                  <input
                    id="color"
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900 placeholder:text-secondary-400"
                  />
                </div>

                <div>
                  <label htmlFor="seats" className="block text-sm font-medium text-secondary-700 mb-2">
                    Seats
                  </label>
                  <select
                    id="seats"
                    value={seats}
                    onChange={(e) => setSeats(e.target.value)}
                    className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900"
                  >
                    <option value="2">2 Seats</option>
                    <option value="4">4 Seats</option>
                    <option value="5">5 Seats</option>
                    <option value="7">7 Seats</option>
                    <option value="8">8 Seats</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="transmission" className="block text-sm font-medium text-secondary-700 mb-2">
                    Transmission *
                  </label>
                  <select
                    id="transmission"
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value as any)}
                    className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900"
                  >
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="fuelType" className="block text-sm font-medium text-secondary-700 mb-2">
                    Fuel Type *
                  </label>
                  <select
                    id="fuelType"
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value as any)}
                    className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900"
                  >
                    <option value="gasoline">Gasoline</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing & Location */}
            <div className="mb-8">
              <h2 className="text-lg md:text-xl font-bold text-secondary-900 mb-4 flex items-center gap-2">
                <CurrencyCircleDollar size={24} weight="duotone" className="text-primary-500" />
                Pricing & Location
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dailyRate" className="block text-sm font-medium text-secondary-700 mb-2">
                    Daily Rate (₱) *
                  </label>
                  <input
                    id="dailyRate"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900 placeholder:text-secondary-400"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-secondary-700 mb-2">
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900 placeholder:text-secondary-400"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <label htmlFor="description" className="block text-sm font-medium text-secondary-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900 placeholder:text-secondary-400 resize-none"
              />
            </div>

            {/* Images */}
            <div className="mb-8">
              <h2 className="text-lg md:text-xl font-bold text-secondary-900 mb-4 flex items-center gap-2">
                <ImageIcon size={24} weight="duotone" className="text-primary-500" />
                Car Images
              </h2>

              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-secondary-600 mb-3">Existing Images</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {existingImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.image_url}
                          alt="Car"
                          className={`w-full h-24 md:h-32 object-cover rounded-lg ${
                            image.is_primary ? 'ring-4 ring-primary-500' : ''
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(image.id)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} weight="bold" />
                        </button>
                        {image.is_primary && (
                          <span className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-2 py-0.5 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images Previews */}
              {newImagePreviews.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-secondary-600 mb-3">New Images (will be uploaded)</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {newImagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt="New"
                          className="w-full h-24 md:h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} weight="bold" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload New */}
              {(existingImages.length + newImages.length) < 5 && (
                <div className="border-2 border-dashed border-secondary-300 rounded-lg p-6 md:p-8 text-center hover:border-primary-500 transition-colors">
                  <input
                    type="file"
                    id="newImages"
                    accept="image/*"
                    multiple
                    onChange={handleNewImageChange}
                    className="hidden"
                  />
                  <label htmlFor="newImages" className="cursor-pointer flex flex-col items-center gap-2">
                    <ImageIcon size={48} weight="duotone" className="text-secondary-400" />
                    <span className="text-secondary-700 font-medium text-sm md:text-base">
                      Add more images
                    </span>
                    <span className="text-xs md:text-sm text-secondary-500">
                      {existingImages.length + newImages.length}/5 images
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="mb-8">
              <h2 className="text-lg md:text-xl font-bold text-secondary-900 mb-4">
                Features
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 mb-4">
                {commonFeatures.map((feature) => (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => toggleCommonFeature(feature)}
                    className={`px-3 md:px-4 py-2 rounded-lg border-2 transition-all text-xs md:text-sm font-medium ${
                      features.includes(feature)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-secondary-200 hover:border-secondary-300 text-secondary-700'
                    }`}
                  >
                    {feature}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                  className="flex-1 px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900 placeholder:text-secondary-400 text-sm"
                  placeholder="Add custom feature"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-4 py-2 bg-secondary-100 hover:bg-secondary-200 rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus size={16} weight="bold" />
                  Add
                </button>
              </div>

              {features.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {features.map((feature) => (
                    <span
                      key={feature}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs md:text-sm"
                    >
                      {feature}
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(feature)}
                        className="hover:text-primary-900 transition-colors"
                      >
                        <X size={14} weight="bold" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Link
                href={`/owner/cars/${carId}`}
                className="flex-1 px-6 py-3 border-2 border-secondary-200 text-secondary-700 rounded-lg font-semibold hover:border-secondary-300 transition-colors text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <FloppyDisk size={20} weight="duotone" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Pricing Rules Manager (separate section below the form) */}
          <div className="mt-6">
            <PricingRulesManager carId={carId} dailyRate={parseFloat(dailyRate) || 0} />
          </div>
        </div>
      </div>
    </div>
  );
}
