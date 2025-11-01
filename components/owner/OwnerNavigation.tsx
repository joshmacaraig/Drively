'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import SignOutButton from '@/components/auth/SignOutButton';
import {
  Car,
  Calendar,
  Wrench,
  House,
  List,
  X,
  User,
} from '@phosphor-icons/react';

interface OwnerNavigationProps {
  userFullName?: string;
  userAvatar?: string;
}

export default function OwnerNavigation({
  userFullName,
  userAvatar,
}: OwnerNavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  const navLinks = [
    { href: '/owner/cars', label: 'Vehicles' },
    { href: '/owner/rentals', label: 'Bookings' },
    { href: '/owner/maintenance', label: 'Maintenance' },
  ];

  return (
    <>
      {/* Desktop & Mobile Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/owner/dashboard" className="flex items-center gap-2 flex-shrink-0">
              <Image
                src="/images/logo2.png"
                alt="Drively"
                width={140}
                height={45}
                className="h-9 sm:h-11 w-auto"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    isActive(link.href)
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Profile Menu */}
            <div className="hidden md:flex items-center gap-3">
              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-3 p-2 pl-3 pr-2 border border-gray-300 rounded-full hover:shadow-md transition-shadow"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <div className="w-8 h-8 rounded-full bg-primary-600 overflow-hidden flex items-center justify-center">
                    {userAvatar ? (
                      <Image
                        src={userAvatar}
                        alt={userFullName || 'User'}
                        width={32}
                        height={32}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-white text-sm font-semibold">
                        {userFullName?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {profileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setProfileMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{userFullName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Car Owner</p>
                      </div>
                      <Link
                        href="/owner/dashboard"
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/owner/profile"
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <div className="px-4 py-1">
                          <SignOutButton />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X size={24} weight="bold" className="text-gray-700" />
              ) : (
                <List size={24} weight="bold" className="text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Slide-in */}
        {mobileMenuOpen && (
          <>
            {/* Overlay */}
            <div
              className="md:hidden fixed inset-0 bg-black/20 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Slide-in Menu */}
            <div className="md:hidden fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl z-50 overflow-y-auto">
              {/* Close Button */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={24} weight="bold" className="text-gray-700" />
              </button>

              <div className="p-6 pt-20 sm:pt-24">
                {/* User Info */}
                <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
                  <div className="w-14 h-14 rounded-full bg-primary-600 overflow-hidden flex items-center justify-center">
                    {userAvatar ? (
                      <Image
                        src={userAvatar}
                        alt={userFullName || 'User'}
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-white text-xl font-semibold">
                        {userFullName?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{userFullName}</p>
                    <p className="text-sm text-gray-500">Car Owner</p>
                  </div>
                </div>

                {/* Navigation Links */}
                <nav className="mt-6 space-y-1">
                  <Link
                    href="/owner/cars"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive('/owner/cars')
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Car size={24} weight={isActive('/owner/cars') ? 'bold' : 'regular'} />
                    Vehicles
                  </Link>

                  <Link
                    href="/owner/rentals"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive('/owner/rentals')
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Calendar size={24} weight={isActive('/owner/rentals') ? 'bold' : 'regular'} />
                    Bookings
                  </Link>

                  <Link
                    href="/owner/maintenance"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive('/owner/maintenance')
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Wrench size={24} weight={isActive('/owner/maintenance') ? 'bold' : 'regular'} />
                    Maintenance
                  </Link>

                  <Link
                    href="/owner/profile"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive('/owner/profile')
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User size={24} weight={isActive('/owner/profile') ? 'bold' : 'regular'} />
                    Profile
                  </Link>

                  <Link
                    href="/owner/dashboard"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      pathname === '/owner/dashboard'
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <House size={24} weight={pathname === '/owner/dashboard' ? 'bold' : 'regular'} />
                    Dashboard
                  </Link>
                </nav>

                {/* Sign Out */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <SignOutButton />
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
        <nav className="grid grid-cols-4 gap-1 px-2 py-2">
          <Link
            href="/owner/cars"
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              isActive('/owner/cars')
                ? 'text-primary-600'
                : 'text-gray-600'
            }`}
          >
            <Car size={24} weight={isActive('/owner/cars') ? 'fill' : 'regular'} className="mb-1" />
            <span className={`text-xs ${isActive('/owner/cars') ? 'font-bold' : 'font-medium'}`}>
              Vehicles
            </span>
          </Link>

          <Link
            href="/owner/rentals"
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              isActive('/owner/rentals')
                ? 'text-primary-600'
                : 'text-gray-600'
            }`}
          >
            <Calendar size={24} weight={isActive('/owner/rentals') ? 'fill' : 'regular'} className="mb-1" />
            <span className={`text-xs ${isActive('/owner/rentals') ? 'font-bold' : 'font-medium'}`}>
              Bookings
            </span>
          </Link>

          <Link
            href="/owner/maintenance"
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              isActive('/owner/maintenance')
                ? 'text-primary-600'
                : 'text-gray-600'
            }`}
          >
            <Wrench size={24} weight={isActive('/owner/maintenance') ? 'fill' : 'regular'} className="mb-1" />
            <span className={`text-xs ${isActive('/owner/maintenance') ? 'font-bold' : 'font-medium'}`}>
              Service
            </span>
          </Link>

          <Link
            href="/owner/dashboard"
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              pathname === '/owner/dashboard'
                ? 'text-primary-600'
                : 'text-gray-600'
            }`}
          >
            <House size={24} weight={pathname === '/owner/dashboard' ? 'fill' : 'regular'} className="mb-1" />
            <span className={`text-xs ${pathname === '/owner/dashboard' ? 'font-bold' : 'font-medium'}`}>
              Home
            </span>
          </Link>
        </nav>
      </div>

      {/* Add padding to content on mobile to account for bottom nav */}
      <style jsx global>{`
        @media (max-width: 768px) {
          body {
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
          .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
        }
      `}</style>
    </>
  );
}
