import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AdminNavigation from '@/components/admin/AdminNavigation';
import Pagination from '@/components/admin/Pagination';
import UserFilters from '@/components/admin/UserFilters';

const ITEMS_PER_PAGE = 20;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    role?: string;
    verification?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const { page: pageParam, role, verification, search } = params;
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

  // Build base queries with filters
  let countQuery = supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  let dataQuery = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  // Apply role filter
  if (role && role !== 'all') {
    countQuery = countQuery.eq('active_role', role);
    dataQuery = dataQuery.eq('active_role', role);
  }

  // Apply verification status filter
  if (verification && verification !== 'all') {
    countQuery = countQuery.eq('verification_status', verification);
    dataQuery = dataQuery.eq('verification_status', verification);
  }

  // Apply search filter (name or email)
  if (search && search.trim()) {
    const searchTerm = search.trim();
    countQuery = countQuery.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    dataQuery = dataQuery.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
  }

  // Get total count
  const { count: totalCount } = await countQuery;

  // Fetch users with pagination
  const { data: users, error } = await dataQuery
    .range(offset, offset + ITEMS_PER_PAGE - 1);

  const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE);

  if (error) {
    console.error('Error fetching users:', error);
  }

  // Get emails from auth.users for each profile
  const usersWithEmails = await Promise.all(
    (users || []).map(async (profile) => {
      const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
      return {
        ...profile,
        email: authUser?.user?.email || null,
      };
    })
  );

  // Get statistics for quick overview
  const { data: stats } = await supabase
    .from('profiles')
    .select('active_role, verification_status');

  const roleStats = {
    admin: stats?.filter(s => s.active_role === 'admin').length || 0,
    car_owner: stats?.filter(s => s.active_role === 'car_owner').length || 0,
    renter: stats?.filter(s => s.active_role === 'renter').length || 0,
  };

  const verificationStats = {
    verified: stats?.filter(s => s.verification_status === 'verified').length || 0,
    pending: stats?.filter(s => s.verification_status === 'pending').length || 0,
    rejected: stats?.filter(s => s.verification_status === 'rejected').length || 0,
    unsubmitted: stats?.filter(s => s.verification_status === 'unsubmitted').length || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Navigation */}
      <AdminNavigation
        userFullName={profile?.full_name}
        userAvatar={profile?.avatar_url}
      />

      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-secondary-900">
                Manage Users
              </h1>
              <p className="text-secondary-600 mt-1">
                View and manage all user accounts
              </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200">
                <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Total Users</p>
                <p className="text-2xl font-bold text-blue-900">{stats?.length || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border-2 border-red-200">
                <p className="text-xs font-semibold text-red-600 uppercase mb-1">Admins</p>
                <p className="text-2xl font-bold text-red-900">{roleStats.admin}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border-2 border-purple-200">
                <p className="text-xs font-semibold text-purple-600 uppercase mb-1">Owners</p>
                <p className="text-2xl font-bold text-purple-900">{roleStats.car_owner}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border-2 border-green-200">
                <p className="text-xs font-semibold text-green-600 uppercase mb-1">Renters</p>
                <p className="text-2xl font-bold text-green-900">{roleStats.renter}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border-2 border-emerald-200">
                <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">Verified</p>
                <p className="text-2xl font-bold text-emerald-900">{verificationStats.verified}</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border-2 border-yellow-200">
                <p className="text-xs font-semibold text-yellow-600 uppercase mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{verificationStats.pending}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border-2 border-orange-200">
                <p className="text-xs font-semibold text-orange-600 uppercase mb-1">Rejected</p>
                <p className="text-2xl font-bold text-orange-900">{verificationStats.rejected}</p>
              </div>
            </div>

            {/* Filters */}
            <UserFilters
              currentRole={role}
              currentVerification={verification}
              currentSearch={search}
            />

            {/* Results Count */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{usersWithEmails?.length || 0}</span> of{' '}
                <span className="font-semibold text-gray-900">{totalCount || 0}</span> users
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-secondary-200">
                    <th className="text-left py-4 px-4 font-semibold text-secondary-900">
                      User
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-secondary-900">
                      Active Role
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-secondary-900">
                      Verification
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-secondary-900">
                      Phone
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-secondary-900">
                      Joined
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-secondary-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usersWithEmails && usersWithEmails.length > 0 ? (
                    usersWithEmails.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-secondary-100 hover:bg-primary-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-semibold text-secondary-900">
                              {u.full_name}
                            </p>
                            <p className="text-sm text-secondary-600">
                              {u.email}
                            </p>
                            <p className="text-xs text-secondary-400 mt-0.5">
                              ID: {u.id.slice(0, 8)}...
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              u.active_role === 'admin'
                                ? 'bg-red-100 text-red-800'
                                : u.active_role === 'car_owner'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {u.active_role === 'car_owner' ? 'Car Owner' : u.active_role?.charAt(0).toUpperCase() + u.active_role?.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              u.verification_status === 'verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : u.verification_status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : u.verification_status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {u.verification_status?.charAt(0).toUpperCase() + u.verification_status?.slice(1) || 'Unsubmitted'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-secondary-600">
                          {u.phone_number || 'N/A'}
                        </td>
                        <td className="py-4 px-4 text-secondary-600">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <Link
                            href={`/admin/users/${u.id}`}
                            className="text-primary-500 hover:text-primary-600 font-semibold transition-colors"
                          >
                            View Details →
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-secondary-500">
                        No users found
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
