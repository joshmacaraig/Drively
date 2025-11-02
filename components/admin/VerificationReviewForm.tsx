'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface VerificationReviewFormProps {
  verificationId: string;
  userId: string;
  defaultRole?: 'renter' | 'car_owner';
}

export default function VerificationReviewForm({
  verificationId,
  userId,
  defaultRole = 'renter',
}: VerificationReviewFormProps) {
  const router = useRouter();
  const [approveAsRole, setApproveAsRole] = useState<'renter' | 'car_owner'>(defaultRole);
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReview = async (action: 'verify' | 'reject') => {
    setIsSubmitting(true);
    setError(null);

    const status = action === 'verify' ? 'verified' : 'rejected';

    try {
      const response = await fetch(`/api/admin/verifications/${verificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          admin_notes: adminNotes,
          approve_as_role: action === 'verify' ? approveAsRole : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update verification');
      }

      // Success! Redirect back to verifications list
      router.push('/admin/verifications?success=true');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Review Verification
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Role Selection for Approval */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Approve as Role
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setApproveAsRole('renter')}
            className={`p-6 rounded-xl border-2 transition-all ${
              approveAsRole === 'renter'
                ? 'border-gray-900 bg-gray-50'
                : 'border-gray-200 bg-white hover:border-gray-400'
            }`}
          >
            <div className="text-left">
              <p className="font-semibold text-gray-900 text-lg">Renter</p>
              <p className="text-sm text-gray-600 mt-1">
                User can rent vehicles
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setApproveAsRole('car_owner')}
            className={`p-6 rounded-xl border-2 transition-all ${
              approveAsRole === 'car_owner'
                ? 'border-gray-900 bg-gray-50'
                : 'border-gray-200 bg-white hover:border-gray-400'
            }`}
          >
            <div className="text-left">
              <p className="font-semibold text-gray-900 text-lg">Car Owner</p>
              <p className="text-sm text-gray-600 mt-1">
                User can list and rent out vehicles
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Admin Notes */}
      <div className="mb-8">
        <label
          htmlFor="admin_notes"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Admin Notes (Optional)
        </label>
        <textarea
          id="admin_notes"
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
          placeholder="Add any notes about this verification review..."
          disabled={isSubmitting}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => handleReview('verify')}
          disabled={isSubmitting}
          className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium py-4 px-6 rounded-xl transition-all shadow-sm hover:shadow-md"
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
              Processing...
            </span>
          ) : (
            `Verify as ${approveAsRole === 'renter' ? 'Renter' : 'Car Owner'}`
          )}
        </button>

        <button
          onClick={() => handleReview('reject')}
          disabled={isSubmitting}
          className="px-8 bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-900 font-medium py-4 rounded-xl transition-all border-2 border-gray-300 hover:border-gray-400"
        >
          {isSubmitting ? 'Processing...' : 'Reject'}
        </button>
      </div>

      <p className="text-sm text-gray-500 mt-4 text-center">
        This action will update the user's verification status and role permissions.
      </p>
    </div>
  );
}
