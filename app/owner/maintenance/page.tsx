import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Wrench, Plus, Car, CalendarBlank, CurrencyCircleDollar, ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import OwnerNavigation from '@/components/owner/OwnerNavigation';

export default async function MaintenancePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch maintenance records with car details
  const { data: maintenanceRecords } = await supabase
    .from('maintenance_records')
    .select(`
      *,
      car:cars(make, model, year, plate_number)
    `)
    .eq('owner_id', user.id)
    .order('maintenance_date', { ascending: false });

  const getMaintenanceTypeColor = (type: string) => {
    switch (type) {
      case 'routine':
        return 'bg-blue-100 text-blue-700';
      case 'repair':
        return 'bg-red-100 text-red-700';
      case 'inspection':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const totalCost = maintenanceRecords?.reduce((sum, record) => sum + (parseFloat(record.cost) || 0), 0) || 0;

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Navigation */}
      <OwnerNavigation
        userFullName={profile?.full_name}
        userAvatar={profile?.avatar_url}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-2">
                  Maintenance Management
                </h1>
                <p className="text-sm md:text-base text-secondary-600">
                  Track and manage vehicle maintenance records
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/owner/maintenance/new"
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm md:text-base"
                >
                  <Plus size={20} weight="duotone" />
                  <span className="hidden sm:inline">Add Maintenance</span>
                  <span className="sm:hidden">Add</span>
                </Link>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-primary-50 p-4 rounded-lg">
                <p className="text-sm text-secondary-600 mb-1">Total Records</p>
                <p className="text-2xl font-bold text-primary-500">{maintenanceRecords?.length || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-secondary-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {maintenanceRecords?.filter(r => r.status === 'completed').length || 0}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg col-span-2 md:col-span-1">
                <p className="text-sm text-secondary-600 mb-1">Total Cost</p>
                <p className="text-2xl font-bold text-blue-600">₱{totalCost.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Maintenance Records */}
          {!maintenanceRecords || maintenanceRecords.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <Wrench size={64} weight="duotone" className="mx-auto text-secondary-300 mb-4" />
              <h3 className="text-xl font-bold text-secondary-900 mb-2">
                No maintenance records yet
              </h3>
              <p className="text-secondary-600 mb-6">
                Start tracking your vehicle maintenance history
              </p>
              <Link
                href="/owner/maintenance/new"
                className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                <Plus size={20} weight="duotone" />
                Add First Record
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {maintenanceRecords.map((record: any) => (
                <div
                  key={record.id}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow"
                >
                  <div className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg md:text-xl font-bold text-secondary-900">
                            {record.car?.year} {record.car?.make} {record.car?.model}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getMaintenanceTypeColor(record.maintenance_type)}`}>
                            {record.maintenance_type.charAt(0).toUpperCase() + record.maintenance_type.slice(1)}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(record.status)}`}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-secondary-600">{record.car?.plate_number}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        {record.cost && (
                          <p className="text-xl md:text-2xl font-bold text-primary-500">
                            ₱{parseFloat(record.cost).toLocaleString()}
                          </p>
                        )}
                        <p className="text-xs md:text-sm text-secondary-600">
                          {new Date(record.maintenance_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="font-semibold text-secondary-900 mb-1">{record.description}</p>
                      {record.service_provider && (
                        <p className="text-sm text-secondary-600">
                          <strong>Service Provider:</strong> {record.service_provider}
                        </p>
                      )}
                      {record.mileage && (
                        <p className="text-sm text-secondary-600">
                          <strong>Mileage:</strong> {record.mileage.toLocaleString()} km
                        </p>
                      )}
                    </div>

                    {record.notes && (
                      <div className="bg-secondary-50 rounded-lg p-3">
                        <p className="text-sm text-secondary-600">
                          <strong>Notes:</strong> {record.notes}
                        </p>
                      </div>
                    )}

                    {record.next_maintenance_date && (
                      <div className="mt-4 pt-4 border-t border-secondary-200">
                        <p className="text-sm text-secondary-600">
                          <CalendarBlank size={16} weight="duotone" className="inline mr-1" />
                          Next maintenance due: {new Date(record.next_maintenance_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Back to Dashboard */}
          <div className="mt-8 text-center">
            <Link
              href="/owner/dashboard"
              className="inline-flex items-center gap-2 text-secondary-600 hover:text-primary-500 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
