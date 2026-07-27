"use client";

import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function TermsPage() {
  return (
    <div className="bg-[#F8F9F5] min-h-screen">
      <Header />
      <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto text-gray-800">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="mb-4 text-gray-500">Last Updated: October 2025</p>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-3">1. Acceptance of Terms</h2>
            <p>By accessing and using the Kambata Travel platform, you accept and agree to be bound by the terms and provision of this agreement.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-3">2. Booking and Payments</h2>
            <p>All bookings made through Kambata Travel are subject to availability and our confirmation. Payment must be made in full or as per the agreed schedule to secure your reservation.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">3. Cancellations and Refunds</h2>
            <p>Cancellations made 48 hours or more before the scheduled tour date are eligible for a full refund. Cancellations made within 48 hours may be subject to a cancellation fee. Please refer to specific tour details for exact terms.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-3">4. User Conduct</h2>
            <p>You agree to use our services only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of Kambata Travel.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-3">5. Modification of Terms</h2>
            <p>We reserve the right to change these conditions from time to time as we see fit and your continued use of the site will signify your acceptance of any adjustment to these terms.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
