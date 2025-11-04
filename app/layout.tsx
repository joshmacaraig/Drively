import type { Metadata } from "next";
import { Poppins, Sora } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastContainer";
import NavigationLoader from "@/components/ui/NavigationLoader";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Drively - Your Key to Adventure",
  description: "Peer-to-peer car rental platform connecting car owners with renters in the Philippines",
  keywords: ["car rental", "Philippines", "peer-to-peer", "rent a car", "car sharing"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Drively",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Drively",
    title: "Drively - Your Key to Adventure",
    description: "Peer-to-peer car rental platform connecting car owners with renters in the Philippines",
  },
  twitter: {
    card: "summary",
    title: "Drively - Your Key to Adventure",
    description: "Peer-to-peer car rental platform connecting car owners with renters in the Philippines",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="Drively" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Drively" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#F97316" />

        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${poppins.variable} ${sora.variable} antialiased`}
      >
        <ToastProvider>
          <Suspense fallback={null}>
            <NavigationLoader />
          </Suspense>
          {children}
          <PWAInstallPrompt />
        </ToastProvider>
      </body>
    </html>
  );
}
