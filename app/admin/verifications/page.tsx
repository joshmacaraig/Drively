import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import AdminNavigation from '@/components/admin/AdminNavigation';
import Pagination from '@/components/admin/Pagination';

const ITEMS_PER_PAGE = 20;

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { page: pageParam, status: statusFilter } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam || '1'));
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

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

  // Check if user is admin
  if (profile?.active_role !== 'admin') {
    redirect('/');
  }

  // Query profiles table for users who have uploaded verification documents
  // Filter by verification_status and check if they have any uploaded docs
  let countQuery = supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .or('proof_of_id_urls.not.is.null,drivers_license_urls.not.is.null,proof_of_address_urls.not.is.null');

  let dataQuery = supabase
    .from('profiles')
    .select('id, full_name, phone_number, phone, active_role, roles, verification_status, proof_of_id_urls, drivers_license_urls, proof_of_address_urls, created_at, updated_at')
    .or('proof_of_id_urls.not.is.null,drivers_license_urls.not.is.null,proof_of_address_urls.not.is.null');

  // Apply status filter if provided
  if (statusFilter && ['pending', 'verified', 'rejected'].includes(statusFilter)) {
    countQuery = countQuery.eq('verification_status', statusFilter);
    dataQuery = dataQuery.eq('verification_status', statusFilter);
  }

  // Get total count
  const { count: totalCount } = await countQuery;

  // Fetch profiles with verification documents and pagination
  const { data: verifications, error } = await dataQuery
    .order('updated_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1);

  const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE);

  if (error) {
    console.error('Error fetching verifications:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <AdminNavigation
        userFullName={profile?.full_name}
        userAvatar={profile?.avatar_url}
      />

      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                User Verifications
              </h1>
              <p className="text-gray-600 mt-1">
                Review and manage user verification requests
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="font-semibold mb-1">Error loading verifications</p>
                <p className="text-sm">{error.message}</p>
              </div>
            )}

            {/* Filter tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
              <Link
                href="/admin/verifications"
                className={`px-4 py-2 font-semibold transition-colors ${
                  !statusFilter
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All
              </Link>
              <Link
                href="/admin/verifications?status=pending"
                className={`px-4 py-2 font-semibold transition-colors ${
                  statusFilter === 'pending'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pending
              </Link>
              <Link
                href="/admin/verifications?status=verified"
                className={`px-4 py-2 font-semibold transition-colors ${
                  statusFilter === 'verified'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Verified
              </Link>
              <Link
                href="/admin/verifications?status=rejected"
                className={`px-4 py-2 font-semibold transition-colors ${
                  statusFilter === 'rejected'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Rejected
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">
                      User
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">
                      Documents
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">
                      Last Updated
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">
                      Role
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {verifications && verifications.length > 0 ? (
                    verifications.map((verification) => (
                      <tr
                        key={verification.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {verification.full_name || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {verification.phone_number || verification.phone || 'N/A'}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1">
                            {verification.proof_of_id_urls && verification.proof_of_id_urls.length > 0 && (
                              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                ID ({verification.proof_of_id_urls.length})
                              </span>
                            )}
                            {verification.drivers_license_urls && verification.drivers_license_urls.length > 0 && (
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                                License ({verification.drivers_license_urls.length})
                              </span>
                            )}
                            {verification.proof_of_address_urls && verification.proof_of_address_urls.length > 0 && (
                              <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                                Address ({verification.proof_of_address_urls.length})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {format(
                            new Date(verification.updated_at),
                            'MMM dd, yyyy HH:mm'
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                              verification.verification_status === 'verified'
                                ? 'bg-green-100 text-green-800'
                                : verification.verification_status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {verification.verification_status || 'pending'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded capitalize">
                            {verification.active_role || '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <Link
                            href={`/admin/verifications/${verification.id}`}
                            className="text-gray-700 hover:text-gray-900 font-medium"
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        No verification requests found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount || 0}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
