'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  CheckCircle
} from '@phosphor-icons/react';
import OwnerNavigation from '@/components/owner/OwnerNavigation';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { creatingQuotes } from '@/lib/loadingQuotes';

export default function NewCarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Reference data
  const [makes, setMakes] = useState<any[]>([]);
  const [allModels, setAllModels] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [filteredModels, setFilteredModels] = useState<any[]>([]);

  // Form state
  const [makeId, setMakeId] = useState('');
  const [make, setMake] = useState('');
  const [modelId, setModelId] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [colorId, setColorId] = useState('');
  const [color, setColor] = useState('');
  const [transmission, setTransmission] = useState<'automatic' | 'manual'>('automatic');
  const [fuelType, setFuelType] = useState<'gasoline' | 'diesel' | 'electric' | 'hybrid'>('gasoline');
  const [seats, setSeats] = useState('5');
  const [dailyRate, setDailyRate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [uploadingImages, setUploadingImages] = useState(false);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    loadReferenceData();
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
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  useEffect(() => {
    if (makeId) {
      const models = allModels.filter(m => m.make_id === makeId);
      setFilteredModels(models);
      setModelId('');
      setModel('');
    } else {
      setFilteredModels([]);
    }
  }, [makeId, allModels]);

  const loadReferenceData = async () => {
    try {
      const supabase = createClient();

      // Load makes
      const { data: makesData } = await supabase
        .from('car_makes')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      // Load models
      const { data: modelsData } = await supabase
        .from('car_models')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      // Load colors
      const { data: colorsData } = await supabase
        .from('car_colors')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      setMakes(makesData || []);
      setAllModels(modelsData || []);
      setColors(colorsData || []);
    } catch (err) {
      console.error('Error loading reference data:', err);
    }
  };

  const handleMakeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMakeId = e.target.value;
    setMakeId(selectedMakeId);
    const selectedMake = makes.find(m => m.id === selectedMakeId);
    setMake(selectedMake?.name || '');
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedModelId = e.target.value;
    setModelId(selectedModelId);
    const selectedModel = filteredModels.find(m => m.id === selectedModelId);
    setModel(selectedModel?.name || '');
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedColorId = e.target.value;
    setColorId(selectedColorId);
    const selectedColor = colors.find(c => c.id === selectedColorId);
    setColor(selectedColor?.name || '');
  };

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 5 - images.length); // Max 5 images
    setImages([...images, ...newFiles]);

    // Create previews
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    if (primaryImageIndex === index) {
      setPrimaryImageIndex(0);
    } else if (primaryImageIndex > index) {
      setPrimaryImageIndex(primaryImageIndex - 1);
    }
  };

  const uploadImages = async (carId: string, supabase: any) => {
    if (images.length === 0) return [];

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${carId}/${Date.now()}-${i}.${fileExt}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('drively-storage')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('drively-storage')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);

        // Save to car_images table
        await supabase.from('car_images').insert({
          car_id: carId,
          image_url: publicUrl,
          is_primary: i === primaryImageIndex,
          display_order: i,
        });
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    } finally {
      setUploadingImages(false);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to list a car');
      }

      // Create car entry
      const { data: carData, error: carError } = await supabase
        .from('cars')
        .insert({
          owner_id: user.id,
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
          is_active: true,
        })
        .select()
        .single();

      if (carError) throw carError;

      // Upload images if any
      if (images.length > 0) {
        await uploadImages(carData.id, supabase);
      }

      setSuccess(true);

      // Redirect to car details or dashboard after 2 seconds
      setTimeout(() => {
        router.push('/owner/dashboard');
      }, 2000);

    } catch (err: any) {
      console.error('Error creating car:', err);
      setError(err.message || 'Failed to list car. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingOverlay quotes={creatingQuotes} />;
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-green-500 mb-4">
            <CheckCircle size={64} weight="duotone" className="mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">
            Car Listed Successfully!
          </h2>
          <p className="text-secondary-600 mb-4">
            Your {make} {model} has been added to the platform.
          </p>
          <p className="text-sm text-secondary-500">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Navigation */}
      <OwnerNavigation
        userFullName={userProfile?.full_name}
        userAvatar={userProfile?.avatar_url}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/owner/cars"
              className="inline-flex items-center gap-2 text-secondary-600 hover:text-primary-500 mb-4 transition-colors"
            >
              <ArrowLeft size={20} weight="duotone" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-secondary-900">List a New Car</h1>
            <p className="text-secondary-600 mt-2">
              Add your vehicle to start earning
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Vehicle Information */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-secondary-900 mb-4 flex items-center gap-2">
                <Car size={24} weight="duotone" className="text-primary-500" />
                Vehicle Information
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Make */}
                <div>
                  <label htmlFor="make" className="block text-sm font-medium text-secondary-700 mb-2">
                    Make *
                  </label>
                  <select
                    id="make"
                    required
                    value={makeId}
                    onChange={handleMakeChange}
                    className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900"
                  >
                    <option value="">Select Make</option>
                    {makes.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Model */}
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-secondary-700 mb-2">
                    Model *
                  </label>
                  <select
                    id="model"
                    required
                    value={modelId}
                    onChange={handleModelChange}
                    disabled={!makeId}
                    className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Model</option>
                    {filteredModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  {!makeId && (
                    <p className="text-xs text-secondary-500 mt-1">Select a make first</p>
                  )}
                </div>

                {/* Year */}
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-secondary-700 mb-2">
                    <Calendar size={16} weight="duotone" className="inline mr-1" />
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
                    placeholder={currentYear.toString()}
                  />
                </div>

                {/* Plate Number */}
                <div>
                  <label htmlFor="plateNumber" className="block text-sm font-medium text-secondary-700 mb-2">
                    <FileText size={16} weight="duotone" className="inline mr-1" />
                    Plate Number *
                  </label>
                  <input
                    id="plateNumber"
                    type="text"
                    required
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                    className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900 placeholder:text-secondary-400"
                    placeholder="ABC 1234"
                  />
                </div>

                {/* Color */}
                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-secondary-700 mb-2">
                    <Palette size={16} weight="duotone" className="inline mr-1" />
                    Color
                  </label>
                  <select
                    id="color"
                    value={colorId}
                    onChange={handleColorChange}
                    className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900"
                  >
                    <option value="">Select Color</option>
                    {colors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Seats */}
                <div>
                  <label htmlFor="seats" className="block text-sm font-medium text-secondary-700 mb-2">
                    <Users size={16} weight="duotone" className="inline mr-1" />
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

                {/* Transmission */}
                <div>
                  <label htmlFor="transmission" className="block text-sm font-medium text-secondary-700 mb-2">
                    <GearSix size={16} weight="duotone" className="inline mr-1" />
                    Transmission *
                  </label>
                  <select
                    id="transmission"
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value as 'automatic' | 'manual')}
                    className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900"
                  >
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>

                {/* Fuel Type */}
                <div>
                  <label htmlFor="fuelType" className="block text-sm font-medium text-secondary-700 mb-2">
                    <GasPump size={16} weight="duotone" className="inline mr-1" />
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
              <h2 className="text-xl font-bold text-secondary-900 mb-4 flex items-center gap-2">
                <CurrencyCircleDollar size={24} weight="duotone" className="text-primary-500" />
                Pricing & Location
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Daily Rate */}
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
                    placeholder="1500"
                  />
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-secondary-700 mb-2">
                    <MapPin size={16} weight="duotone" className="inline mr-1" />
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="block w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900 placeholder:text-secondary-400"
                    placeholder="e.g., Makati, Manila"
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
                placeholder="Tell renters about your car, its condition, and any special features..."
              />
            </div>

            {/* Car Images */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-secondary-900 mb-4 flex items-center gap-2">
                <ImageIcon size={24} weight="duotone" className="text-primary-500" />
                Car Images
              </h2>
              <p className="text-sm text-secondary-600 mb-4">
                Upload up to 5 images of your car. The first image will be the primary image.
              </p>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Car preview ${index + 1}`}
                        className={`w-full h-32 object-cover rounded-lg ${
                          index === primaryImageIndex ? 'ring-4 ring-primary-500' : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg"
                      >
                        <X size={16} weight="bold" />
                      </button>
                      {index === primaryImageIndex && (
                        <span className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-2 py-1 rounded">
                          Primary
                        </span>
                      )}
                      {index !== primaryImageIndex && (
                        <button
                          type="button"
                          onClick={() => setPrimaryImageIndex(index)}
                          className="absolute bottom-2 left-2 bg-white text-secondary-700 text-xs px-2 py-1 rounded hover:bg-secondary-100 transition-colors"
                        >
                          Set Primary
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {images.length < 5 && (
                <div className="border-2 border-dashed border-secondary-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
                  <input
                    type="file"
                    id="carImages"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="carImages"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <ImageIcon size={48} weight="duotone" className="text-secondary-400" />
                    <span className="text-secondary-700 font-medium">
                      Click to upload images
                    </span>
                    <span className="text-sm text-secondary-500">
                      {images.length}/5 images uploaded • PNG, JPG up to 10MB each
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-secondary-900 mb-4">
                Features
              </h2>

              {/* Common Features */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {commonFeatures.map((feature) => (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => toggleCommonFeature(feature)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                      features.includes(feature)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-secondary-200 hover:border-secondary-300 text-secondary-700'
                    }`}
                  >
                    {feature}
                  </button>
                ))}
              </div>

              {/* Custom Feature Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                  className="flex-1 px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white text-secondary-900 placeholder:text-secondary-400"
                  placeholder="Add custom feature"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-4 py-2 bg-secondary-100 hover:bg-secondary-200 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus size={20} weight="bold" />
                  Add
                </button>
              </div>

              {/* Selected Features */}
              {features.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {features.map((feature) => (
                    <span
                      key={feature}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                    >
                      {feature}
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(feature)}
                        className="hover:text-primary-900 transition-colors"
                      >
                        <X size={16} weight="bold" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border-2 border-secondary-200 text-secondary-700 rounded-lg font-semibold hover:border-secondary-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Listing Car...
                  </>
                ) : (
                  <>
                    <Car size={20} weight="duotone" />
                    List Car
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
