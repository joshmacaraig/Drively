'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import LoadingOverlay from './LoadingOverlay';
import { generalQuotes } from '@/lib/loadingQuotes';

export default function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Hide loader when route changes
    setIsNavigating(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    // Intercept all link clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href) {
        const url = new URL(link.href);
        const currentUrl = new URL(window.location.href);

        // Check if it's an internal navigation (same origin)
        if (url.origin === currentUrl.origin) {
          // Check if it's a different page
          if (url.pathname !== currentUrl.pathname || url.search !== currentUrl.search) {
            // Don't show loader for hash links or downloads
            if (!link.hasAttribute('download') && !url.hash) {
              setIsNavigating(true);
            }
          }
        }
      }
    };

    // Add event listener to document
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  if (!isNavigating) return null;

  return <LoadingOverlay quotes={generalQuotes} />;
}
