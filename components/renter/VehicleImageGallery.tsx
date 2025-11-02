'use client';

import { useState } from 'react';
import Image from 'next/image';
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
            className="relative aspect-[16/10] overflow-hidden rounded-lg cursor-pointer group"
            onClick={() => openImageViewer(images[0].image_url, 0)}
          >
            <Image
              src={images[0].image_url}
              alt={carName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              priority
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-300 flex items-center justify-center">
              <div className="bg-white bg-opacity-90 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Thumbnail Grid */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.slice(1, 5).map((image, idx) => {
                const actualIndex = idx + 1;
                return (
                  <div
                    key={image.id}
                    className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
                    onClick={() => openImageViewer(image.image_url, actualIndex)}
                  >
                    <Image
                      src={image.image_url}
                      alt={`${carName} ${actualIndex + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300" />
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
            <div className="relative w-full h-full">
              <Image
                src={selectedImage}
                alt={`${carName} full size`}
                fill
                className="object-contain"
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
