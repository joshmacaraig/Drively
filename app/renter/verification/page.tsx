import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import VerificationForm from '@/components/renter/VerificationForm';

export default async function VerificationPage() {
  const supabase = await createClient();

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

  // Check if user already has a verification request
  const { data: existingVerification } = await supabase
    .from('verification_documents')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/renter/dashboard"
            className="text-primary-500 hover:text-primary-600 mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Verification
            </h1>
            <p className="text-secondary-600 mb-6">
              Submit your documents to get verified and unlock more features
            </p>

            {existingVerification ? (
              <div className="space-y-6">
                {/* Existing Verification Status */}
                <div
                  className={`p-6 rounded-xl border-2 ${
                    existingVerification.status === 'approved'
                      ? 'bg-green-50 border-green-200'
                      : existingVerification.status === 'rejected'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-secondary-900">
                      Verification Status
                    </h2>
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        existingVerification.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : existingVerification.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {existingVerification.status.toUpperCase()}
                    </span>
                  </div>

                  {existingVerification.status === 'pending' && (
                    <div>
                      <p className="text-secondary-700">
                        Your verification is being reviewed by our team. We'll
                        notify you once it's processed.
                      </p>
                      <p className="text-sm text-secondary-600 mt-2">
                        Submitted on:{' '}
                        {new Date(
                          existingVerification.submitted_at
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {existingVerification.status === 'approved' && (
                    <div>
                      <p className="text-green-700 font-semibold">
                        ✓ Your account has been verified!
                      </p>
                      <p className="text-sm text-green-600 mt-2">
                        You now have full access to all features.
                      </p>
                      {existingVerification.admin_notes && (
                        <div className="mt-4 p-3 bg-white rounded border border-green-200">
                          <p className="text-sm text-secondary-600">
                            Admin Note:
                          </p>
                          <p className="text-secondary-900">
                            {existingVerification.admin_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {existingVerification.status === 'rejected' && (
                    <div>
                      <p className="text-red-700 font-semibold">
                        Your verification was not approved.
                      </p>
                      {existingVerification.admin_notes && (
                        <div className="mt-4 p-3 bg-white rounded border border-red-200">
                          <p className="text-sm text-secondary-600">
                            Reason:
                          </p>
                          <p className="text-secondary-900">
                            {existingVerification.admin_notes}
                          </p>
                        </div>
                      )}
                      <p className="text-sm text-red-600 mt-4">
                        Please resubmit with correct documents.
                      </p>
                    </div>
                  )}
                </div>

                {/* Show documents submitted */}
                {(existingVerification.philsys_id_url ||
                  existingVerification.drivers_license_url ||
                  existingVerification.proof_of_address_url) && (
                  <div className="bg-secondary-50 p-6 rounded-xl">
                    <h3 className="font-semibold text-secondary-900 mb-4">
                      Submitted Documents
                    </h3>
                    <div className="space-y-2">
                      {existingVerification.philsys_id_url && (
                        <div className="flex items-center text-secondary-700">
                          <span className="text-green-500 mr-2">✓</span>
                          PhilSys ID
                        </div>
                      )}
                      {existingVerification.drivers_license_url && (
                        <div className="flex items-center text-secondary-700">
                          <span className="text-green-500 mr-2">✓</span>
                          Driver's License
                        </div>
                      )}
                      {existingVerification.proof_of_address_url && (
                        <div className="flex items-center text-secondary-700">
                          <span className="text-green-500 mr-2">✓</span>
                          Proof of Address
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {existingVerification.status === 'rejected' && (
                  <VerificationForm existingVerification={existingVerification} />
                )}
              </div>
            ) : (
              <>
                {/* Info Box */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6 rounded">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Why verify your account?
                  </h3>
                  <ul className="text-blue-800 space-y-2">
                    <li>✓ Rent vehicles from verified owners</li>
                    <li>✓ List your own cars for rent (Car Owner role)</li>
                    <li>✓ Build trust with the community</li>
                    <li>✓ Access premium features</li>
                  </ul>
                </div>

                {/* Verification Form */}
                <VerificationForm />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
