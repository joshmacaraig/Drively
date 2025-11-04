'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SignOut } from '@phosphor-icons/react';
import { useState } from 'react';

export default function SignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }

      // Clear service worker caches in PWA mode
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Force a hard reload to clear all state
      // This works better in PWA standalone mode than router.push
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to sign out:', error);
      alert('Failed to sign out. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 text-secondary-600 hover:text-secondary-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <SignOut size={20} weight="duotone" />
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </button>
  );
}
