'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Trash, Warning } from '@phosphor-icons/react';

interface DeleteCarButtonProps {
  carId: string;
  carName: string;
}

export default function DeleteCarButton({ carId, carName }: DeleteCarButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();

      // Delete car images first
      const { data: images } = await supabase
        .from('car_images')
        .select('image_url')
        .eq('car_id', carId);

      if (images && images.length > 0) {
        // Delete images from storage
        for (const image of images) {
          const path = image.image_url.split('/').slice(-2).join('/');
          await supabase.storage.from('drively-storage').remove([path]);
        }

        // Delete image records
        await supabase.from('car_images').delete().eq('car_id', carId);
      }

      // Delete the car
      const { error: deleteError } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId);

      if (deleteError) throw deleteError;

      // Redirect to cars list
      router.push('/owner/cars');
      router.refresh();
    } catch (err: any) {
      console.error('Error deleting car:', err);
      setError(err.message || 'Failed to delete car. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <Warning size={24} weight="duotone" className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-secondary-900">Delete Car</h2>
          </div>

          <p className="text-secondary-600 mb-6">
            Are you sure you want to delete <strong>{carName}</strong>? This action cannot be undone.
            All images and rental history will be permanently deleted.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={loading}
              className="flex-1 px-4 py-3 border-2 border-secondary-200 text-secondary-700 rounded-lg font-semibold hover:border-secondary-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash size={20} weight="duotone" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="bg-red-500 hover:bg-red-600 text-white px-3 md:px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm md:text-base"
    >
      <Trash size={18} weight="duotone" className="md:w-5 md:h-5" />
      <span>Delete</span>
    </button>
  );
}
