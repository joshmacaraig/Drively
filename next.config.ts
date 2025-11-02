import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'YOUR_PROJECT_ID.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/drively-storage/**',
      },
      {
        protocol: 'https',
        hostname: 'YOUR_PROJECT_ID.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/verification-documents/**',
      },
      {
        protocol: 'https',
        hostname: 'YOUR_PROJECT_ID.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/rental-photos/**',
      },
    ],
  },
};

export default nextConfig;
