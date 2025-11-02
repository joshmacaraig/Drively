'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

interface LoadingOverlayProps {
  message?: string;
  quotes?: string[];
}

export default function LoadingOverlay({ message, quotes }: LoadingOverlayProps) {
  const [displayMessage, setDisplayMessage] = useState(message || 'Loading...');

  useEffect(() => {
    if (quotes && quotes.length > 0) {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      setDisplayMessage(randomQuote);
    } else if (message) {
      setDisplayMessage(message);
    }
  }, [quotes, message]);
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto relative animate-zoom">
            <Image
              src="/images/logo2.png"
              alt="Drively Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Loading Text */}
        <p className="text-sm text-gray-600 font-medium">
          {displayMessage}
        </p>
      </div>

      <style jsx>{`
        @keyframes zoom {
          0%, 100% {
            transform: scale(0.8);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        .animate-zoom {
          animation: zoom 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
