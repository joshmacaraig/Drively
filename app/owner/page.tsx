'use client';

import Image from "next/image";
import Link from "next/link";
import { CurrencyCircleDollar, Shield, ChartLine, Users, CaretRight, CheckCircle } from "@phosphor-icons/react";

export default function OwnerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo2.png"
            alt="Drively Logo"
            width={160}
            height={50}
            className="h-12 w-auto"
            priority
          />
        </Link>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-6xl mx-auto">
          {/* Hero Content */}
          <div className="text-center mb-16">
            <div className="inline-block bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              For Car Owners
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary-900 mb-6 leading-tight">
              Turn Your Car Into<br />
              <span className="text-primary-500">A Source of Income</span>
            </h1>
            <p className="text-xl text-secondary-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              List your vehicle on Drively and earn money when you're not using it. Connect with verified renters across Quezon Province.
            </p>
            <Link
              href="/auth/signup?role=owner"
              className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-8 py-3.5 rounded-lg font-semibold text-base transition-colors shadow-lg"
            >
              Get Started
              <CaretRight size={20} weight="bold" />
            </Link>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white p-8 rounded-2xl shadow-md border border-secondary-100">
              <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center mb-6">
                <CurrencyCircleDollar size={32} weight="duotone" className="text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-3">
                Earn Extra Income
              </h3>
              <p className="text-secondary-600 leading-relaxed">
                Generate passive income from your car when you're not using it. Set your own rates and availability.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md border border-secondary-100">
              <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center mb-6">
                <Shield size={32} weight="duotone" className="text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-3">
                Verified Renters Only
              </h3>
              <p className="text-secondary-600 leading-relaxed">
                All renters are verified with PhilSys ID, proof of address, and driver's license before they can book.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md border border-secondary-100">
              <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center mb-6">
                <ChartLine size={32} weight="duotone" className="text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-3">
                You're In Control
              </h3>
              <p className="text-secondary-600 leading-relaxed">
                Approve or decline booking requests, set your pricing, and manage your vehicle's availability.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
                How to List Your Car
              </h2>
              <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
                Four simple steps to start earning with your vehicle
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-white p-8 md:p-12 rounded-2xl shadow-md border border-secondary-100">
                <div className="space-y-8">
                  <div className="flex gap-6 items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-500 text-white rounded-xl flex items-center justify-center font-bold text-xl">
                      1
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-secondary-900 mb-2">Create Owner Account</h3>
                      <p className="text-secondary-600 leading-relaxed">
                        Sign up as a car owner and complete the verification process with your identification documents.
                      </p>
                    </div>
                  </div>

                  <div className="border-l-2 border-secondary-200 ml-6 h-8"></div>

                  <div className="flex gap-6 items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-500 text-white rounded-xl flex items-center justify-center font-bold text-xl">
                      2
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-secondary-900 mb-2">List Your Vehicle</h3>
                      <p className="text-secondary-600 leading-relaxed">
                        Add your car details, upload clear photos, set your pricing, and define your availability calendar.
                      </p>
                    </div>
                  </div>

                  <div className="border-l-2 border-secondary-200 ml-6 h-8"></div>

                  <div className="flex gap-6 items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-500 text-white rounded-xl flex items-center justify-center font-bold text-xl">
                      3
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-secondary-900 mb-2">Review & Approve Bookings</h3>
                      <p className="text-secondary-600 leading-relaxed">
                        Receive booking requests from verified renters, review their profiles, and approve rentals you're comfortable with.
                      </p>
                    </div>
                  </div>

                  <div className="border-l-2 border-secondary-200 ml-6 h-8"></div>

                  <div className="flex gap-6 items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-500 text-white rounded-xl flex items-center justify-center font-bold text-xl">
                      4
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-secondary-900 mb-2">Hand Over & Earn</h3>
                      <p className="text-secondary-600 leading-relaxed">
                        Meet the renter, complete the pickup checklist with photos, hand over the keys, and receive payment for the rental.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Safety Features */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
                Your Vehicle is Protected
              </h2>
              <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
                We implement multiple safety measures to protect your investment
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="flex gap-4 items-start bg-white p-6 rounded-xl border border-secondary-100">
                <CheckCircle size={24} weight="fill" className="text-primary-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-secondary-900 mb-1">Detailed Documentation</h3>
                  <p className="text-secondary-600 text-sm">
                    Pickup and return checklists with photos document vehicle condition before and after every rental.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-white p-6 rounded-xl border border-secondary-100">
                <CheckCircle size={24} weight="fill" className="text-primary-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-secondary-900 mb-1">Verified Renters</h3>
                  <p className="text-secondary-600 text-sm">
                    All renters must verify their identity with government-issued ID and driver's license.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-white p-6 rounded-xl border border-secondary-100">
                <CheckCircle size={24} weight="fill" className="text-primary-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-secondary-900 mb-1">You Approve Every Rental</h3>
                  <p className="text-secondary-600 text-sm">
                    Review each booking request and renter profile before accepting. You're always in control.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-white p-6 rounded-xl border border-secondary-100">
                <CheckCircle size={24} weight="fill" className="text-primary-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-secondary-900 mb-1">Clear Terms & Conditions</h3>
                  <p className="text-secondary-600 text-sm">
                    Transparent rental agreements outline responsibilities, damages, and payment terms.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Earning?
            </h2>
            <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
              Join Drively as a car owner and turn your vehicle into a revenue stream.
            </p>
            <Link
              href="/auth/signup?role=owner"
              className="inline-flex items-center gap-2 bg-white text-secondary-900 hover:bg-gray-50 px-8 py-3.5 rounded-lg font-semibold text-base transition-colors shadow-lg border border-gray-200"
            >
              Create Owner Account
              <CaretRight size={20} weight="bold" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-12 mt-20">
        <div className="container mx-auto px-4 text-center">
          <Image
            src="/images/logo2.png"
            alt="Drively Logo"
            width={180}
            height={60}
            className="h-14 w-auto mx-auto mb-4"
          />
          <p className="text-secondary-500 text-sm">
            © 2025 Drively. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
