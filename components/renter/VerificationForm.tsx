'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface VerificationFormProps {
  existingVerification?: any;
}

export default function VerificationForm({
  existingVerification,
}: VerificationFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [philsysId, setPhilsysId] = useState<File | null>(null);
  const [driversLicense, setDriversLicense] = useState<File | null>(null);
  const [proofOfAddress, setProofOfAddress] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }

      setter(file);
      setError(null);
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('verification-documents')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('verification-documents').getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // Upload files
      let philsysUrl = existingVerification?.philsys_id_url;
      let licenseUrl = existingVerification?.drivers_license_url;
      let addressUrl = existingVerification?.proof_of_address_url;

      if (philsysId) {
        const url = await uploadFile(philsysId, `verification/${user.id}/philsys`);
        if (url) philsysUrl = url;
      }

      if (driversLicense) {
        const url = await uploadFile(
          driversLicense,
          `verification/${user.id}/license`
        );
        if (url) licenseUrl = url;
      }

      if (proofOfAddress) {
        const url = await uploadFile(
          proofOfAddress,
          `verification/${user.id}/address`
        );
        if (url) addressUrl = url;
      }

      // Check if at least one document is provided
      if (!philsysUrl && !licenseUrl && !addressUrl) {
        throw new Error('Please upload at least one document');
      }

      // Insert or update verification document
      if (existingVerification) {
        // Update existing
        const { error: updateError } = await supabase
          .from('verification_documents')
          .update({
            philsys_id_url: philsysUrl,
            drivers_license_url: licenseUrl,
            proof_of_address_url: addressUrl,
            status: 'pending',
            submitted_at: new Date().toISOString(),
          })
          .eq('id', existingVerification.id);

        if (updateError) throw updateError;
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('verification_documents')
          .insert({
            user_id: user.id,
            philsys_id_url: philsysUrl,
            drivers_license_url: licenseUrl,
            proof_of_address_url: addressUrl,
            status: 'pending',
            submitted_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }

      // Success! Refresh the page
      router.refresh();
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to submit verification');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* PhilSys ID */}
      <div>
        <label className="block text-sm font-semibold text-secondary-900 mb-2">
          PhilSys ID (National ID)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e, setPhilsysId)}
          className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={isSubmitting}
        />
        {philsysId && (
          <p className="text-sm text-green-600 mt-2">✓ {philsysId.name}</p>
        )}
      </div>

      {/* Driver's License */}
      <div>
        <label className="block text-sm font-semibold text-secondary-900 mb-2">
          Driver's License
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e, setDriversLicense)}
          className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={isSubmitting}
        />
        {driversLicense && (
          <p className="text-sm text-green-600 mt-2">
            ✓ {driversLicense.name}
          </p>
        )}
      </div>

      {/* Proof of Address */}
      <div>
        <label className="block text-sm font-semibold text-secondary-900 mb-2">
          Proof of Address (Utility Bill, etc.)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e, setProofOfAddress)}
          className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={isSubmitting}
        />
        {proofOfAddress && (
          <p className="text-sm text-green-600 mt-2">
            ✓ {proofOfAddress.name}
          </p>
        )}
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Upload at least one document. Make sure the
          images are clear and readable. Maximum file size: 5MB per file.
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Uploading...
          </span>
        ) : existingVerification ? (
          'Resubmit Verification'
        ) : (
          'Submit for Verification'
        )}
      </button>
    </form>
  );
}
