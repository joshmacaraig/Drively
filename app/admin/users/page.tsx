import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AdminNavigation from '@/components/admin/AdminNavigation';
import Pagination from '@/components/admin/Pagination';

const ITEMS_PER_PAGE = 20;

export default async function AdminUsersPage({
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
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Fetch users with pagination
  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1);

  const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE);

  if (error) {
    console.error('Error fetching users:', error);
  }

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
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-secondary-200">
                    <th className="text-left py-4 px-4 font-semibold text-secondary-900">
                      Name
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-secondary-900">
                      Active Role
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-secondary-900">
                      All Roles
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
                  {users && users.length > 0 ? (
                    users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-secondary-100 hover:bg-primary-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-secondary-900">
                              {u.full_name}
                            </p>
                            <p className="text-sm text-secondary-500">
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
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {u.active_role}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1">
                            {u.roles?.map((role: string) => (
                              <span
                                key={role}
                                className="px-2 py-1 bg-secondary-100 text-secondary-700 rounded text-xs"
                              >
                                {role}
                              </span>
                            ))}
                          </div>
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
                            className="text-primary-500 hover:text-primary-600 font-medium"
                          >
                            View Details
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
