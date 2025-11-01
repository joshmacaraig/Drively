'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import SignOutButton from '@/components/auth/SignOutButton';
import {
  Users,
  Car,
  Calendar,
  ShieldCheck,
  House,
  List,
  X,
  User,
} from '@phosphor-icons/react';

interface AdminNavigationProps {
  userFullName?: string;
  userAvatar?: string;
}

export default function AdminNavigation({
  userFullName,
  userAvatar,
}: AdminNavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  const navLinks = [
    { href: '/admin/verifications', label: 'Verifications' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/cars', label: 'Cars' },
    { href: '/admin/rentals', label: 'Rentals' },
  ];

  return (
    <>
      {/* Desktop & Mobile Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/admin/dashboard" className="flex items-center gap-2 flex-shrink-0">
              <Image
                src="/images/logo1.png"
                alt="Drively"
                width={140}
                height={45}
                className="h-9 sm:h-11 w-auto"
                priority
              />
              <span className="hidden sm:inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                ADMIN
              </span>
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
                  <div className="w-8 h-8 rounded-full bg-red-600 overflow-hidden flex items-center justify-center">
                    {userAvatar ? (
                      <Image
                        src={userAvatar}
                        alt={userFullName || 'Admin'}
                        width={32}
                        height={32}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-white text-sm font-semibold">
                        {userFullName?.charAt(0) || 'A'}
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
                        <p className="text-xs text-red-600 font-semibold mt-0.5">Administrator</p>
                      </div>
                      <Link
                        href="/admin/dashboard"
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        Dashboard
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
                  <div className="w-14 h-14 rounded-full bg-red-600 overflow-hidden flex items-center justify-center">
                    {userAvatar ? (
                      <Image
                        src={userAvatar}
                        alt={userFullName || 'Admin'}
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-white text-xl font-semibold">
                        {userFullName?.charAt(0) || 'A'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{userFullName}</p>
                    <p className="text-sm text-red-600 font-semibold">Administrator</p>
                  </div>
                </div>

                {/* Navigation Links */}
                <nav className="mt-6 space-y-1">
                  <Link
                    href="/admin/verifications"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive('/admin/verifications')
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ShieldCheck size={24} weight={isActive('/admin/verifications') ? 'bold' : 'regular'} />
                    Verifications
                  </Link>

                  <Link
                    href="/admin/users"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive('/admin/users')
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Users size={24} weight={isActive('/admin/users') ? 'bold' : 'regular'} />
                    Users
                  </Link>

                  <Link
                    href="/admin/cars"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive('/admin/cars')
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Car size={24} weight={isActive('/admin/cars') ? 'bold' : 'regular'} />
                    Cars
                  </Link>

                  <Link
                    href="/admin/rentals"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive('/admin/rentals')
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Calendar size={24} weight={isActive('/admin/rentals') ? 'bold' : 'regular'} />
                    Rentals
                  </Link>

                  <Link
                    href="/admin/dashboard"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      pathname === '/admin/dashboard'
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <House size={24} weight={pathname === '/admin/dashboard' ? 'bold' : 'regular'} />
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
            href="/admin/verifications"
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              isActive('/admin/verifications')
                ? 'text-red-600'
                : 'text-gray-600'
            }`}
          >
            <ShieldCheck size={24} weight={isActive('/admin/verifications') ? 'fill' : 'regular'} className="mb-1" />
            <span className={`text-xs ${isActive('/admin/verifications') ? 'font-bold' : 'font-medium'}`}>
              Verify
            </span>
          </Link>

          <Link
            href="/admin/users"
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              isActive('/admin/users')
                ? 'text-red-600'
                : 'text-gray-600'
            }`}
          >
            <Users size={24} weight={isActive('/admin/users') ? 'fill' : 'regular'} className="mb-1" />
            <span className={`text-xs ${isActive('/admin/users') ? 'font-bold' : 'font-medium'}`}>
              Users
            </span>
          </Link>

          <Link
            href="/admin/cars"
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              isActive('/admin/cars')
                ? 'text-red-600'
                : 'text-gray-600'
            }`}
          >
            <Car size={24} weight={isActive('/admin/cars') ? 'fill' : 'regular'} className="mb-1" />
            <span className={`text-xs ${isActive('/admin/cars') ? 'font-bold' : 'font-medium'}`}>
              Cars
            </span>
          </Link>

          <Link
            href="/admin/dashboard"
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              pathname === '/admin/dashboard'
                ? 'text-red-600'
                : 'text-gray-600'
            }`}
          >
            <House size={24} weight={pathname === '/admin/dashboard' ? 'fill' : 'regular'} className="mb-1" />
            <span className={`text-xs ${pathname === '/admin/dashboard' ? 'font-bold' : 'font-medium'}`}>
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
