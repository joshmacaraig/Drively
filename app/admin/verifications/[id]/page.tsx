import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import VerificationReviewForm from '@/components/admin/VerificationReviewForm';
import VerificationImageViewer from '@/components/admin/VerificationImageViewer';
import AdminNavigation from '@/components/admin/AdminNavigation';

export default async function VerificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Check if user is admin
  if (profile?.active_role !== 'admin') {
    redirect('/');
  }

  // Fetch profile details (new verification system)
  const { data: verification, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone_number, phone, active_role, roles, verification_status, proof_of_id_urls, drivers_license_urls, proof_of_address_urls, created_at, updated_at, address')
    .eq('id', id)
    .single();

  if (error || !verification) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Verification Not Found
          </h1>
          <Link
            href="/admin/verifications"
            className="text-gray-700 hover:text-gray-900 font-medium"
          >
            ← Back to Verifications
          </Link>
        </div>
      </div>
    );
  }

  // Helper function to construct full storage URL from path
  const getStorageUrl = (path: string | null) => {
    if (!path) return null;

    // If it's already a full URL, return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // Otherwise, construct the full URL
    // Use verification-documents bucket for verification files
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const storageBucket = 'verification-documents';
    return `${supabaseUrl}/storage/v1/object/public/${storageBucket}/${path}`;
  };

  // Document URLs might be stored as paths or full URLs - convert all to full URLs
  const proofOfIdUrls = (verification.proof_of_id_urls || []).map(getStorageUrl).filter(Boolean) as string[];
  const proofOfAddressUrls = (verification.proof_of_address_urls || []).map(getStorageUrl).filter(Boolean) as string[];
  const driversLicenseUrls = (verification.drivers_license_urls || []).map(getStorageUrl).filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <AdminNavigation
        userFullName={profile?.full_name}
        userAvatar={profile?.avatar_url}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        <Link
          href="/admin/verifications"
          className="inline-flex items-center text-gray-700 hover:text-gray-900 mb-6 font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Verifications
        </Link>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900">
                  Verification Review
                </h1>
                <p className="text-gray-600 mt-2">
                  Review user documents and approve or deny verification
                </p>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                  verification.verification_status === 'verified'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : verification.verification_status === 'rejected'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                }`}
              >
                {verification.verification_status || 'pending'}
              </span>
            </div>
          </div>

          {/* User Information */}
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              User Information
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Full Name</p>
                <p className="text-lg text-gray-900">
                  {verification.full_name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Phone Number</p>
                <p className="text-lg text-gray-900">
                  {verification.phone_number || verification.phone || 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Address</p>
                <p className="text-lg text-gray-900">
                  {verification.address || 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Current Role</p>
                <p className="text-lg text-gray-900 capitalize">
                  {verification.active_role}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">All Roles</p>
                <div className="flex gap-2 mt-1">
                  {verification.roles?.map((role: string) => (
                    <span
                      key={role}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium capitalize"
                    >
                      {role.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Member Since</p>
                <p className="text-lg text-gray-900">
                  {format(
                    new Date(verification.created_at),
                    'MMM dd, yyyy HH:mm'
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Last Updated</p>
                <p className="text-lg text-gray-900">
                  {format(
                    new Date(verification.updated_at),
                    'MMM dd, yyyy HH:mm'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Submitted Documents */}
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Submitted Documents
            </h2>

            {/* Proof of ID Documents */}
            {proofOfIdUrls.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Proof of ID ({proofOfIdUrls.length})
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {proofOfIdUrls.map((url: string, index: number) => (
                    <VerificationImageViewer
                      key={url}
                      imageUrl={url}
                      title={`ID ${index + 1}`}
                      colorClass="bg-blue-50 text-blue-700"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Driver's License Documents */}
            {driversLicenseUrls.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Driver's License ({driversLicenseUrls.length})
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {driversLicenseUrls.map((url: string, index: number) => (
                    <VerificationImageViewer
                      key={url}
                      imageUrl={url}
                      title={`License ${index + 1}`}
                      colorClass="bg-green-50 text-green-700"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Proof of Address Documents */}
            {proofOfAddressUrls.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Proof of Address ({proofOfAddressUrls.length})
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {proofOfAddressUrls.map((url: string, index: number) => (
                    <VerificationImageViewer
                      key={url}
                      imageUrl={url}
                      title={`Address ${index + 1}`}
                      colorClass="bg-purple-50 text-purple-700"
                    />
                  ))}
                </div>
              </div>
            )}

            {proofOfIdUrls.length === 0 && driversLicenseUrls.length === 0 && proofOfAddressUrls.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No documents submitted
              </div>
            )}
          </div>

          {/* Review Form (only if pending) */}
          {verification.verification_status === 'pending' && (
            <div className="p-8">
              <VerificationReviewForm
                verificationId={verification.id}
                userId={verification.id}
                defaultRole={verification.active_role as 'renter' | 'car_owner'}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
