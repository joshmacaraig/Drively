'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useToast } from '@/components/ui/ToastContainer';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { ownerQuotes, savingQuotes } from '@/lib/loadingQuotes';
import OwnerNavigation from '@/components/owner/OwnerNavigation';
import { CheckCircle, XCircle, Clock, Upload, Trash, Warning } from '@phosphor-icons/react';

export default function OwnerProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [signedUrls, setSignedUrls] = useState<{ [key: string]: string }>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ url: string; index: number } | null>(null);
  const [viewImage, setViewImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
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
        });

        // Fetch signed URLs for documents
        await fetchSignedUrls(profileData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSignedUrls(profileData: any) {
    const paths = profileData.proof_of_id_urls || [];
    if (paths.length === 0) return;

    const urls: { [key: string]: string } = {};

    for (const pathOrUrl of paths) {
      let path = pathOrUrl;
      if (pathOrUrl.includes('/storage/v1/object/public/verification-documents/')) {
        path = pathOrUrl.split('/storage/v1/object/public/verification-documents/')[1];
      } else if (pathOrUrl.startsWith('http')) {
        const urlParts = pathOrUrl.split('verification-documents/');
        if (urlParts.length > 1) {
          path = urlParts[1];
        }
      }

      console.log('Fetching signed URL for path:', path);

      const { data, error } = await supabase.storage
        .from('verification-documents')
        .createSignedUrl(path, 3600);

      if (error) {
        console.error('Error creating signed URL for', path, ':', error);
      } else if (data?.signedUrl) {
        console.log('Successfully created signed URL for', path);
        urls[pathOrUrl] = data.signedUrl;
      }
    }

    console.log('Final signed URLs:', urls);
    setSignedUrls(urls);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          phone_number: formData.phone, // Update both fields for compatibility
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      showToast('Profile updated successfully', 'success');
      await loadProfile();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const currentUrls = profile?.proof_of_id_urls || [];
      const newUrls = [...currentUrls];

      for (const file of Array.from(files)) {
        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/proof_of_id/${Date.now()}.${fileExt}`;

        console.log('Uploading file to:', fileName);

        const { data, error: uploadError } = await supabase.storage
          .from('verification-documents')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        console.log('Upload successful, path:', data.path);
        newUrls.push(data.path);
      }

      console.log('All files uploaded. New URLs array:', newUrls);

      // Update profile with new URLs
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          proof_of_id_urls: newUrls,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      showToast('Documents uploaded successfully', 'success');
      await loadProfile();
    } catch (error: any) {
      console.error('Upload error:', error);
      showToast(error.message || 'Failed to upload documents', 'error');
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDocument(url: string) {
    try {
      setSaving(true);

      // Extract path from URL
      let path = url;
      if (url.includes('/storage/v1/object/public/verification-documents/')) {
        path = url.split('/storage/v1/object/public/verification-documents/')[1];
      } else if (url.startsWith('http')) {
        const urlParts = url.split('verification-documents/');
        if (urlParts.length > 1) {
          path = urlParts[1];
        }
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('verification-documents')
        .remove([path]);

      if (storageError) throw storageError;

      // Update profile
      const currentUrls = profile?.proof_of_id_urls || [];
      const newUrls = currentUrls.filter((u: string) => u !== url);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          proof_of_id_urls: newUrls,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      showToast('Document deleted successfully', 'success');
      setDeleteConfirm(null);
      await loadProfile();
    } catch (error: any) {
      console.error('Delete error:', error);
      showToast(error.message || 'Failed to delete document', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingOverlay quotes={ownerQuotes} />;
  }

  if (saving) {
    return <LoadingOverlay quotes={savingQuotes} />;
  }

  const isVerified = profile?.verification_status === 'verified';
  const hasProofOfId = profile?.proof_of_id_urls?.length > 0;
  const verificationStatus = profile?.verification_status || 'unverified';

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'verified':
        return <CheckCircle size={24} weight="fill" className="text-green-600" />;
      case 'pending':
        return <Clock size={24} weight="fill" className="text-yellow-600" />;
      case 'rejected':
        return <XCircle size={24} weight="fill" className="text-red-600" />;
      default:
        return <XCircle size={24} weight="fill" className="text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'verified':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'rejected':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusText = () => {
    switch (verificationStatus) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Pending Review';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Not Verified';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <OwnerNavigation
        userFullName={profile?.full_name}
        userAvatar={profile?.avatar_url}
      />

      <main className="max-w-4xl mx-auto px-6 py-12 pb-24 md:pb-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-semibold text-gray-900 mb-2">
            Profile & Verification
          </h1>
          <p className="text-lg text-gray-600">
            Manage your profile and get verified to list your vehicles
          </p>
        </div>

        {/* Verification Warning */}
        {!isVerified && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8 rounded-lg">
            <div className="flex gap-3">
              <Warning size={24} weight="fill" className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  Verification Required
                </h3>
                <p className="text-yellow-800 mb-3">
                  You need to verify your identity before your car listings become visible to renters.
                  Please upload a valid government-issued ID below.
                </p>
                <p className="text-sm text-yellow-700">
                  Accepted documents: Passport, Driver's License, PhilSys ID, SSS/GSIS ID, Voter's ID
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Verification Status */}
        <div className={`border-2 rounded-xl p-6 mb-8 ${getStatusColor()}`}>
          <div className="flex items-center gap-3 mb-2">
            {getStatusIcon()}
            <h2 className="text-xl font-bold">Verification Status</h2>
          </div>
          <p className="text-lg font-semibold mb-1">{getStatusText()}</p>
          {verificationStatus === 'pending' && (
            <p className="text-sm">Our team is reviewing your documents. This usually takes 1-2 business days.</p>
          )}
          {verificationStatus === 'rejected' && (
            <p className="text-sm">Please contact support for more information.</p>
          )}
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Proof of ID Upload */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Identity Verification</h2>
          <p className="text-gray-600 mb-6">
            Upload a clear photo of your government-issued ID
          </p>

          {/* Current Documents */}
          {hasProofOfId && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Uploaded Documents</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(profile?.proof_of_id_urls || []).map((url: string, index: number) => (
                  <div
                    key={url}
                    className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary-500 transition-colors cursor-pointer group"
                    onClick={() => signedUrls[url] && setViewImage(signedUrls[url])}
                  >
                    {signedUrls[url] ? (
                      <Image
                        src={signedUrls[url]}
                        alt={`ID ${index + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                      </div>
                    )}

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ url, index });
                      }}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors shadow-lg"
                    >
                      <Trash size={16} weight="fill" />
                    </button>

                    {/* Click to view hint */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to view
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div>
            <label
              htmlFor="id-upload"
              className={`flex items-center justify-center gap-3 w-full p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                uploading
                  ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-300 hover:border-primary-500 hover:bg-primary-50'
              }`}
            >
              <Upload size={24} weight="duotone" className="text-primary-500" />
              <span className="font-semibold text-gray-700">
                {uploading ? 'Uploading...' : 'Upload ID Document'}
              </span>
            </label>
            <input
              id="id-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <p className="text-xs text-gray-500 mt-2">
              Accepted formats: JPG, PNG, PDF. Max 10MB per file. You can upload multiple documents.
            </p>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Document?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete ID Document {deleteConfirm.index + 1}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDocument(deleteConfirm.url)}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Image Viewer */}
      {viewImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4"
          onClick={() => setViewImage(null)}
        >
          <button
            onClick={() => setViewImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <XCircle size={32} weight="fill" />
          </button>
          <div className="relative w-full h-full max-w-4xl max-h-[90vh]">
            <Image
              src={viewImage}
              alt="Document"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  );
}
