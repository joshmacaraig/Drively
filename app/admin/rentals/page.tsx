import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import AdminNavigation from '@/components/admin/AdminNavigation';
import Pagination from '@/components/admin/Pagination';

const ITEMS_PER_PAGE = 20;

export default async function AdminRentalsPage({
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
    .from('rentals')
    .select('*', { count: 'exact', head: true });

  // Fetch rentals with pagination
  const { data: rentals, error } = await supabase
    .from('rentals')
    .select(`
      *,
      car:cars(make, model, year, plate_number),
      renter:profiles!renter_id(full_name, phone_number),
      owner:profiles!owner_id(full_name, phone_number)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1);

  const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE);

  if (error) {
    console.error('Error fetching rentals:', error);
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
                Manage Rentals
              </h1>
              <p className="text-secondary-600 mt-1">
                View and manage all rental transactions
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-secondary-200">
                    <th className="text-left py-4 px-4 font-semibold text-secondary-900">
                      Vehicle
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-secondary-900">
                      Renter
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-secondary-900">
                      Owner
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-secondary-900">
                      Dates
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-secondary-900">
                      Amount
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-secondary-900">
                      Status
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-secondary-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rentals && rentals.length > 0 ? (
                    rentals.map((rental) => (
                      <tr
                        key={rental.id}
                        className="border-b border-secondary-100 hover:bg-primary-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-secondary-900">
                              {rental.car?.year} {rental.car?.make}{' '}
                              {rental.car?.model}
                            </p>
                            <p className="text-sm text-secondary-500 font-mono">
                              {rental.car?.plate_number}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-secondary-900">
                              {rental.renter?.full_name || 'Unknown'}
                            </p>
                            <p className="text-sm text-secondary-500">
                              {rental.renter?.phone_number || 'N/A'}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-secondary-900">
                              {rental.owner?.full_name || 'Unknown'}
                            </p>
                            <p className="text-sm text-secondary-500">
                              {rental.owner?.phone_number || 'N/A'}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-secondary-900">
                              {format(new Date(rental.start_date), 'MMM dd, yyyy')}
                            </p>
                            <p className="text-sm text-secondary-500">
                              to {format(new Date(rental.end_date), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-semibold text-secondary-900">
                          ₱{parseFloat(rental.total_amount).toLocaleString()}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              rental.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : rental.status === 'confirmed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : rental.status === 'completed'
                                    ? 'bg-gray-100 text-gray-800'
                                    : rental.status === 'cancelled'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {rental.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <Link
                            href={`/admin/rentals/${rental.id}`}
                            className="text-primary-500 hover:text-primary-600 font-medium"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-secondary-500">
                        No rentals found
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
