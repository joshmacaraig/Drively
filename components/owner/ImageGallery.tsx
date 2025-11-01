'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Car, X } from '@phosphor-icons/react';

interface CarImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

interface ImageGalleryProps {
  images: CarImage[];
  carName: string;
}

export default function ImageGallery({ images, carName }: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="h-96 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
          <div className="text-center">
            <Car size={64} weight="duotone" className="text-primary-500 mx-auto mb-4" />
            <p className="text-secondary-600">No images uploaded</p>
          </div>
        </div>
      </div>
    );
  }

  const currentImage = images[selectedImageIndex];

  return (
    <>
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="space-y-4 p-6">
          {/* Main Image */}
          <div
            className="relative h-96 w-full bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => setIsLightboxOpen(true)}
          >
            <Image
              src={currentImage.image_url}
              alt={carName}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              {selectedImageIndex + 1} / {images.length}
            </div>
          </div>

          {/* Thumbnail Grid */}
          {images.length > 1 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative h-24 rounded-lg overflow-hidden transition-all ${
                    index === selectedImageIndex
                      ? 'ring-4 ring-primary-500 scale-[0.98]'
                      : 'ring-1 ring-secondary-200 hover:ring-2 hover:ring-primary-300'
                  }`}
                >
                  <Image
                    src={image.image_url}
                    alt={`${carName} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  {image.is_primary && (
                    <span className="absolute top-1 left-1 bg-primary-500 text-white text-xs px-2 py-0.5 rounded">
                      Primary
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 bg-white text-secondary-900 p-2 rounded-full hover:bg-secondary-100 transition-colors z-10"
          >
            <X size={24} weight="bold" />
          </button>

          {/* Previous Button */}
          {images.length > 1 && selectedImageIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(selectedImageIndex - 1);
              }}
              className="absolute left-4 bg-white text-secondary-900 px-4 py-2 rounded-lg hover:bg-secondary-100 transition-colors font-semibold"
            >
              ← Previous
            </button>
          )}

          {/* Image */}
          <div className="relative w-full h-full max-w-6xl max-h-[90vh]">
            <Image
              src={currentImage.image_url}
              alt={carName}
              fill
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Next Button */}
          {images.length > 1 && selectedImageIndex < images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(selectedImageIndex + 1);
              }}
              className="absolute right-4 bg-white text-secondary-900 px-4 py-2 rounded-lg hover:bg-secondary-100 transition-colors font-semibold"
            >
              Next →
            </button>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-secondary-900 px-4 py-2 rounded-full font-semibold">
            {selectedImageIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
