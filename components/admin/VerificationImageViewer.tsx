'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from '@phosphor-icons/react';

interface VerificationImageViewerProps {
  imageUrl: string;
  title: string;
  colorClass: string;
}

export default function VerificationImageViewer({
  imageUrl,
  title,
  colorClass,
}: VerificationImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all">
        <div className={`${colorClass} px-4 py-3`}>
          <h3 className="font-semibold">{title}</h3>
        </div>
        <div className="p-4">
          <button
            onClick={() => setIsOpen(true)}
            className="block w-full relative h-48 rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
          >
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              unoptimized
            />
          </button>
          <button
            onClick={() => setIsOpen(true)}
            className="text-gray-700 hover:text-gray-900 mt-3 inline-block text-sm font-medium"
          >
            View Full Size →
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 bg-white text-gray-900 p-3 rounded-full hover:bg-gray-100 transition-colors z-10 shadow-lg"
          >
            <X size={24} weight="bold" />
          </button>

          <div className="relative w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
              unoptimized
            />
          </div>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-gray-900 px-6 py-3 rounded-full font-semibold shadow-lg">
            {title}
          </div>
        </div>
      )}
    </>
  );
}
