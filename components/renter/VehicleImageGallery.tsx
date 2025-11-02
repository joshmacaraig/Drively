'use client';

import { useState } from 'react';
import { X, CaretLeft, CaretRight } from '@phosphor-icons/react';

interface VehicleImageGalleryProps {
  images: Array<{
    id: string;
    image_url: string;
    is_primary: boolean;
    display_order: number;
  }>;
  carName: string;
}

export default function VehicleImageGallery({ images, carName }: VehicleImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        <div className="relative aspect-[16/10] bg-gray-100 flex items-center justify-center">
          <svg className="w-20 h-20 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    );
  }

  const openImageViewer = (imageUrl: string, index: number) => {
    setSelectedImage(imageUrl);
    setCurrentImageIndex(index);
  };

  const closeImageViewer = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    if (currentImageIndex < images.length - 1) {
      const newIndex = currentImageIndex + 1;
      setCurrentImageIndex(newIndex);
      setSelectedImage(images[newIndex].image_url);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      const newIndex = currentImageIndex - 1;
      setCurrentImageIndex(newIndex);
      setSelectedImage(images[newIndex].image_url);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        <div className="space-y-4 p-4">
          {/* Main Image */}
          <div
            className="relative aspect-[16/10] overflow-hidden rounded-lg cursor-pointer group bg-gray-100"
            onClick={() => openImageViewer(images[0].image_url, 0)}
          >
            <img
              src={images[0].image_url}
              alt={carName}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Thumbnail Grid */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.slice(1, 5).map((image, idx) => {
                const actualIndex = idx + 1;
                return (
                  <div
                    key={image.id}
                    className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group bg-gray-100"
                    onClick={() => openImageViewer(image.image_url, actualIndex)}
                  >
                    <img
                      src={image.image_url}
                      alt={`${carName} ${actualIndex + 1}`}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                );
              })}
              {images.length > 5 && (
                <div
                  className="relative aspect-square overflow-hidden rounded-lg cursor-pointer bg-gray-900 flex items-center justify-center"
                  onClick={() => openImageViewer(images[5].image_url, 5)}
                >
                  <span className="text-white text-xl font-bold">+{images.length - 5}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}
          onClick={closeImageViewer}
        >
          {/* Close Button */}
          <button
            onClick={closeImageViewer}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all z-10"
          >
            <X size={32} weight="bold" />
          </button>

          {/* Previous Button */}
          {currentImageIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-3 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all"
            >
              <CaretLeft size={40} weight="bold" />
            </button>
          )}

          {/* Next Button */}
          {currentImageIndex < images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-3 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all"
            >
              <CaretRight size={40} weight="bold" />
            </button>
          )}

          {/* Image */}
          <div className="max-w-7xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={selectedImage}
                alt={`${carName} full size`}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Image Counter */}
            <div className="mt-4 text-white text-center">
              <p className="text-lg font-semibold">
                {currentImageIndex + 1} / {images.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
