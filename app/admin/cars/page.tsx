import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminCarsPage() {
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

  // Fetch all cars with owner information
  const { data: cars, error } = await supabase
    .from('cars')
    .select(`
      *,
      owner:profiles!owner_id(full_name, phone_number)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching cars:', error);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <Link
                  href="/admin/dashboard"
                  className="text-primary-500 hover:text-primary-600 mb-2 inline-block"
                >
                  ← Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-secondary-900">
                  Manage Cars
                </h1>
                <p className="text-secondary-600 mt-1">
                  View and manage all listed vehicles
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-secondary-200">
                    <th className="text-left py-4 px-4 font-semibold text-secondary-900">
                      Vehicle
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-secondary-900">
                      Owner
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-secondary-900">
                      Plate Number
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-secondary-900">
                      Daily Rate
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
                  {cars && cars.length > 0 ? (
                    cars.map((car) => (
                      <tr
                        key={car.id}
                        className="border-b border-secondary-100 hover:bg-primary-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-secondary-900">
                              {car.year} {car.make} {car.model}
                            </p>
                            <p className="text-sm text-secondary-500">
                              {car.color} • {car.transmission}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-secondary-900">
                              {car.owner?.full_name || 'Unknown'}
                            </p>
                            <p className="text-sm text-secondary-500">
                              {car.owner?.phone_number || 'N/A'}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-secondary-900">
                          {car.plate_number}
                        </td>
                        <td className="py-4 px-4 text-secondary-900">
                          ₱{parseFloat(car.daily_rate).toLocaleString()}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              car.status === 'available'
                                ? 'bg-green-100 text-green-800'
                                : car.status === 'rented'
                                  ? 'bg-blue-100 text-blue-800'
                                  : car.status === 'maintenance'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {car.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <Link
                            href={`/admin/cars/${car.id}`}
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
                        No cars found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 text-secondary-600">
              Total Cars: {cars?.length || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
