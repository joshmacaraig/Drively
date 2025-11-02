'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/components/ui/ToastContainer';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { renterQuotes, savingQuotes } from '@/lib/loadingQuotes';
import RenterNavigation from '@/components/renter/RenterNavigation';

export default function RenterProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  const [signedUrls, setSignedUrls] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || '',
          phone: profileData.phone || profileData.phone_number || '',
          address: profileData.address || '',
        });

        // Fetch signed URLs for all document paths
        await fetchAllSignedUrls(profileData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllSignedUrls(profileData: any) {
    const allPaths = [
      ...(profileData.proof_of_id_urls || []),
      ...(profileData.proof_of_address_urls || []),
      ...(profileData.drivers_license_urls || []),
    ];

    if (allPaths.length === 0) return;

    const urls: { [key: string]: string } = {};

    // Fetch all signed URLs in parallel
    const promises = allPaths.map(async (pathOrUrl) => {
      // Extract path from URL if it's a full URL
      let path = pathOrUrl;
      if (pathOrUrl.includes('/storage/v1/object/public/verification-documents/')) {
        // Extract path from public URL
        path = pathOrUrl.split('/storage/v1/object/public/verification-documents/')[1];
      } else if (pathOrUrl.startsWith('http')) {
        // If it's some other URL format, try to extract the path
        const urlParts = pathOrUrl.split('verification-documents/');
        if (urlParts.length > 1) {
          path = urlParts[1];
        }
      }

      const { data, error } = await supabase.storage
        .from('verification-documents')
        .createSignedUrl(path, 3600); // 1 hour expiry

      if (data?.signedUrl) {
        urls[pathOrUrl] = data.signedUrl; // Use original pathOrUrl as key
      } else if (error) {
        console.error('Error creating signed URL for', path, error);
      }
    });

    await Promise.all(promises);
    setSignedUrls(urls);
  }

  async function handleFileUpload(field: string, files: FileList) {
    if (!user || files.length === 0) return;

    // Convert FileList to Array for proper iteration
    const filesArray = Array.from(files);
    console.log('Starting upload:', filesArray.length, 'files');

    try {
      setUploading({ ...uploading, [field]: true });

      const uploadedPaths: string[] = [];
      const newSignedUrls: { [key: string]: string } = {};

      // Upload each file
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        console.log(`Uploading file ${i + 1}/${filesArray.length}:`, file.name, file.size, 'bytes');

        const fileExt = file.name.split('.').pop();
        // Use timestamp + random string to ensure unique filenames
        const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const fileName = `${user.id}/${field}_${uniqueId}.${fileExt}`;

        console.log('Generated filename:', fileName);

        const { error: uploadError } = await supabase.storage
          .from('verification-documents')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error for file', i, ':', uploadError);
          throw uploadError;
        }

        console.log('Upload successful for file', i);

        // Generate signed URL for immediate display
        const { data } = await supabase.storage
          .from('verification-documents')
          .createSignedUrl(fileName, 3600);

        if (data?.signedUrl) {
          newSignedUrls[fileName] = data.signedUrl;
        }

        uploadedPaths.push(fileName);

        // Small delay to ensure unique timestamps if needed
        if (i < filesArray.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      console.log('All uploads complete. Uploaded paths:', uploadedPaths);

      // Get existing URLs and append new ones
      const existingPaths = profile?.[field] || [];
      const updatedPaths = [...existingPaths, ...uploadedPaths];

      // Update profile with array of paths
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [field]: updatedPaths })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update profile state without reloading
      setProfile({ ...profile, [field]: updatedPaths });

      // Add new signed URLs to existing cache
      setSignedUrls({ ...signedUrls, ...newSignedUrls });

      const count = uploadedPaths.length;
      showToast(`${count} document${count !== 1 ? 's' : ''} uploaded successfully!`, 'success');
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast('Failed to upload document. Please try again.', 'error');
    } finally {
      setUploading({ ...uploading, [field]: false });
    }
  }

  async function handleDeleteImage(field: string, pathOrUrlToDelete: string) {
    if (!user) return;

    try {
      // Get existing paths and remove the one to delete
      const existingPaths = profile?.[field] || [];
      const updatedPaths = existingPaths.filter((path: string) => path !== pathOrUrlToDelete);

      // Extract path from URL if needed
      let pathToDelete = pathOrUrlToDelete;
      if (pathOrUrlToDelete.includes('/storage/v1/object/public/verification-documents/')) {
        pathToDelete = pathOrUrlToDelete.split('/storage/v1/object/public/verification-documents/')[1];
      } else if (pathOrUrlToDelete.startsWith('http')) {
        const urlParts = pathOrUrlToDelete.split('verification-documents/');
        if (urlParts.length > 1) {
          pathToDelete = urlParts[1];
        }
      }

      // Delete from storage first
      await supabase.storage
        .from('verification-documents')
        .remove([pathToDelete]);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [field]: updatedPaths })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update profile state without reloading
      setProfile({ ...profile, [field]: updatedPaths });

      // Remove from signed URLs cache
      const updatedSignedUrls = { ...signedUrls };
      delete updatedSignedUrls[pathOrUrlToDelete];
      setSignedUrls(updatedSignedUrls);

      showToast('Document deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting file:', error);
      showToast('Failed to delete document. Please try again.', 'error');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          phone_number: formData.phone, // Update both phone fields for compatibility
        })
        .eq('id', user.id);

      if (error) throw error;

      showToast('Profile updated successfully!', 'success');
      await loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingOverlay quotes={renterQuotes} />;
  }

  if (saving) {
    return <LoadingOverlay quotes={savingQuotes} />;
  }

  const isVerified = profile?.verification_status === 'verified';
  const hasAllDocs = profile?.proof_of_id_urls?.length > 0 && profile?.proof_of_address_urls?.length > 0 && profile?.drivers_license_urls?.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Navigation */}
      <RenterNavigation
        userFullName={profile?.full_name}
        userAvatar={profile?.avatar_url}
        isVerified={isVerified}
      />

      <main className="max-w-4xl mx-auto px-6 py-12 pb-24 md:pb-12">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-4xl font-semibold text-gray-900 mb-2">
            Profile & Verification
          </h1>
          <p className="text-lg text-gray-600">
            Manage your personal information and verification documents
          </p>
        </div>

        {/* Status Banner */}
        {isVerified ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-green-900">Your profile is verified</p>
                <p className="text-sm text-green-700">You can now book vehicles on Drively</p>
              </div>
            </div>
          </div>
        ) : hasAllDocs ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-blue-900">Documents under review</p>
                <p className="text-sm text-blue-700">We're reviewing your documents. This usually takes 24-48 hours.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-amber-900">Complete your verification</p>
                <p className="text-sm text-amber-700">Upload all required documents to start booking vehicles</p>
              </div>
            </div>
          </div>
        )}

        {/* Personal Information */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Personal Information
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-900 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={user?.email || ''}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                disabled
              />
              <p className="text-sm text-gray-600 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                placeholder="+63 912 345 6789"
                required
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-900 mb-2">
                Complete Address
              </label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                placeholder="Enter your complete address"
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Verification Documents */}
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Verification Documents
          </h2>
          <p className="text-gray-600 mb-6">
            Upload clear photos of your documents. All information will be kept confidential.
          </p>

          <div className="space-y-6">
            {/* Proof of ID */}
            <DocumentUpload
              title="Proof of ID"
              description="Upload front and back of your government-issued ID (PhilSys, Passport, Driver's License, etc.)"
              fieldName="proof_of_id_urls"
              currentUrls={profile?.proof_of_id_urls || []}
              signedUrls={signedUrls}
              uploading={uploading.proof_of_id_urls}
              onUpload={handleFileUpload}
              onDelete={handleDeleteImage}
            />

            {/* Proof of Address */}
            <DocumentUpload
              title="Proof of Address"
              description="Recent utility bill, bank statement, or barangay certificate (multiple pages accepted)"
              fieldName="proof_of_address_urls"
              currentUrls={profile?.proof_of_address_urls || []}
              signedUrls={signedUrls}
              uploading={uploading.proof_of_address_urls}
              onUpload={handleFileUpload}
              onDelete={handleDeleteImage}
            />

            {/* Driver's License */}
            <DocumentUpload
              title="Driver's License"
              description="Upload both front and back of your valid driver's license"
              fieldName="drivers_license_urls"
              currentUrls={profile?.drivers_license_urls || []}
              signedUrls={signedUrls}
              uploading={uploading.drivers_license_urls}
              onUpload={handleFileUpload}
              onDelete={handleDeleteImage}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function DocumentUpload({
  title,
  description,
  fieldName,
  currentUrls,
  signedUrls,
  uploading,
  onUpload,
  onDelete,
}: {
  title: string;
  description: string;
  fieldName: string;
  currentUrls: string[];
  signedUrls: { [key: string]: string };
  uploading?: boolean;
  onUpload: (field: string, files: FileList) => void;
  onDelete: (field: string, url: string) => void;
}) {
  const [deleteConfirm, setDeleteConfirm] = useState<{ field: string; url: string; index: number } | null>(null);
  const [viewImage, setViewImage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUpload(fieldName, files);
    }
    // Reset input
    e.target.value = '';
  };

  const handleDeleteClick = (url: string, index: number) => {
    setDeleteConfirm({ field: fieldName, url, index });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      onDelete(deleteConfirm.field, deleteConfirm.url);
      setDeleteConfirm(null);
    }
  };

  const hasImages = currentUrls.length > 0;

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        {hasImages && (
          <div className="flex items-center gap-2 text-green-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">{currentUrls.length} uploaded</span>
          </div>
        )}
      </div>

      {hasImages && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {currentUrls.map((path, index) => (
            <div key={path} className="relative group border-2 border-gray-200 rounded-lg overflow-hidden hover:border-primary-500 transition-colors">
              <div
                className="relative aspect-video bg-gray-100 cursor-pointer"
                onClick={() => signedUrls[path] && setViewImage(signedUrls[path])}
              >
                {signedUrls[path] ? (
                  <Image
                    src={signedUrls[path]}
                    alt={`${title} ${index + 1}`}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
              <button
                onClick={() => handleDeleteClick(path, index)}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow-lg transition-all"
                title="Delete image"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Image {index + 1}
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Click to view
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Image?</h3>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete Image {deleteConfirm.index + 1}? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setViewImage(null)}
        >
          <button
            onClick={() => setViewImage(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative w-full h-full max-w-5xl max-h-[90vh]">
            <Image
              src={viewImage}
              alt="Document preview"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      )}

      <label className="block">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          disabled={uploading}
          multiple
          className="hidden"
        />
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer transition-colors">
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <span className="text-sm text-gray-600">Uploading...</span>
            </div>
          ) : (
            <>
              <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm font-medium text-gray-900 mb-1">
                {hasImages ? 'Add more images' : 'Click to upload'}
              </p>
              <p className="text-xs text-gray-500">Select multiple files • PNG, JPG, PDF up to 10MB each</p>
            </>
          )}
        </div>
      </label>
    </div>
  );
}
