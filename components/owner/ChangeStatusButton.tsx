'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CaretDown } from '@phosphor-icons/react';

interface ChangeStatusButtonProps {
  carId: string;
  currentStatus: boolean;
}

export default function ChangeStatusButton({ carId, currentStatus }: ChangeStatusButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const statuses = [
    { value: true, label: 'Active', color: 'text-green-600' },
    { value: false, label: 'Inactive', color: 'text-gray-600' },
  ];

  const handleStatusChange = async (newStatus: boolean) => {
    if (newStatus === currentStatus) {
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('cars')
        .update({ is_active: newStatus })
        .eq('id', carId);

      if (error) throw error;

      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="bg-secondary-100 hover:bg-secondary-200 text-secondary-700 px-3 md:px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 text-sm md:text-base whitespace-nowrap"
      >
        <span className="hidden sm:inline">Change Status</span>
        <span className="sm:hidden">Status</span>
        <CaretDown size={16} weight="bold" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-secondary-200 py-2 z-20">
            {statuses.map((status) => (
              <button
                key={String(status.value)}
                onClick={() => handleStatusChange(status.value)}
                disabled={loading}
                className={`w-full text-left px-4 py-2 hover:bg-secondary-50 transition-colors flex items-center justify-between ${
                  status.value === currentStatus ? 'bg-primary-50' : ''
                } disabled:opacity-50`}
              >
                <span className={`font-medium ${status.color}`}>
                  {status.label}
                </span>
                {status.value === currentStatus && (
                  <span className="text-xs text-primary-500">Current</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
