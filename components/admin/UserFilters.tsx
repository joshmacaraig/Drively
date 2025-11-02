'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MagnifyingGlass, Funnel, X } from '@phosphor-icons/react';

interface UserFiltersProps {
  currentRole?: string;
  currentVerification?: string;
  currentSearch?: string;
}

export default function UserFilters({
  currentRole = 'all',
  currentVerification = 'all',
  currentSearch = '',
}: UserFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(currentSearch);
  const [role, setRole] = useState(currentRole || 'all');
  const [verification, setVerification] = useState(currentVerification || 'all');

  // Sync with URL params
  useEffect(() => {
    setSearch(currentSearch || '');
    setRole(currentRole || 'all');
    setVerification(currentVerification || 'all');
  }, [currentSearch, currentRole, currentVerification]);

  const updateFilters = (newRole: string, newVerification: string, newSearch: string) => {
    const params = new URLSearchParams(searchParams.toString());

    // Update role
    if (newRole && newRole !== 'all') {
      params.set('role', newRole);
    } else {
      params.delete('role');
    }

    // Update verification
    if (newVerification && newVerification !== 'all') {
      params.set('verification', newVerification);
    } else {
      params.delete('verification');
    }

    // Update search
    if (newSearch && newSearch.trim()) {
      params.set('search', newSearch.trim());
    } else {
      params.delete('search');
    }

    // Reset to page 1 when filters change
    params.delete('page');

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    updateFilters(newRole, verification, search);
  };

  const handleVerificationChange = (newVerification: string) => {
    setVerification(newVerification);
    updateFilters(role, newVerification, search);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(role, verification, search);
  };

  const clearFilters = () => {
    setRole('all');
    setVerification('all');
    setSearch('');
    router.push(pathname);
  };

  const hasActiveFilters = role !== 'all' || verification !== 'all' || search.trim() !== '';

  return (
    <div className="mb-6 space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative">
          <MagnifyingGlass
            size={20}
            weight="bold"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name or email..."
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 placeholder-gray-400"
          />
        </div>
      </form>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Funnel size={20} weight="duotone" className="text-gray-600" />
          <span className="font-semibold text-gray-700">Filters:</span>
        </div>

        {/* Role Filter */}
        <div className="flex-1 min-w-[200px] max-w-[250px]">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-medium text-gray-900 bg-white"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="car_owner">Car Owner</option>
            <option value="renter">Renter</option>
          </select>
        </div>

        {/* Verification Status Filter */}
        <div className="flex-1 min-w-[200px] max-w-[250px]">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Verification Status
          </label>
          <select
            value={verification}
            onChange={(e) => handleVerificationChange(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-medium text-gray-900 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="unsubmitted">Unsubmitted</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors flex items-center gap-2 mt-6"
          >
            <X size={18} weight="bold" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-semibold text-gray-600">Active filters:</span>
          {role !== 'all' && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold flex items-center gap-2">
              Role: {role === 'car_owner' ? 'Car Owner' : role.charAt(0).toUpperCase() + role.slice(1)}
              <button
                onClick={() => handleRoleChange('all')}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <X size={14} weight="bold" />
              </button>
            </span>
          )}
          {verification !== 'all' && (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold flex items-center gap-2">
              Status: {verification.charAt(0).toUpperCase() + verification.slice(1)}
              <button
                onClick={() => handleVerificationChange('all')}
                className="hover:bg-green-200 rounded-full p-0.5"
              >
                <X size={14} weight="bold" />
              </button>
            </span>
          )}
          {search.trim() && (
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold flex items-center gap-2">
              Search: "{search}"
              <button
                onClick={() => {
                  setSearch('');
                  updateFilters(role, verification, '');
                }}
                className="hover:bg-purple-200 rounded-full p-0.5"
              >
                <X size={14} weight="bold" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
