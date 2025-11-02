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
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
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

  // Get total count
  const { count: totalCount } = await supabase
    .from('verification_documents')
    .select('*', { count: 'exact', head: true });

  // Fetch verification documents with pagination
  const { data: verifications, error } = await supabase
    .from('verification_documents')
    .select(`
      *,
      user:profiles!verification_documents_user_id_fkey(full_name, phone_number),
      reviewer:profiles!verification_documents_reviewed_by_fkey(full_name)
    `)
    .order('submitted_at', { ascending: false })
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
              <button className="px-4 py-2 font-semibold text-gray-900 border-b-2 border-gray-900">
                All
              </button>
              <button className="px-4 py-2 font-semibold text-gray-600 hover:text-gray-900">
                Pending
              </button>
              <button className="px-4 py-2 font-semibold text-gray-600 hover:text-gray-900">
                Approved
              </button>
              <button className="px-4 py-2 font-semibold text-gray-600 hover:text-gray-900">
                Rejected
              </button>
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
                      Submitted
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">
                      Reviewed By
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
                              {verification.user?.full_name || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {verification.user?.phone_number || 'N/A'}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1">
                            {verification.philsys_id_url && (
                              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                Proof of ID
                              </span>
                            )}
                            {verification.drivers_license_url && (
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                                Driver's License
                              </span>
                            )}
                            {verification.proof_of_address_url && (
                              <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                                Proof of Address
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {format(
                            new Date(verification.submitted_at),
                            'MMM dd, yyyy HH:mm'
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              verification.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : verification.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {verification.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {verification.reviewer?.full_name || '-'}
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
