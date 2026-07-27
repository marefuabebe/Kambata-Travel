"use client";

import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function PrivacyPage() {
  return (
    <div className="bg-[#F8F9F5] min-h-screen">
      <Header />
      <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto text-gray-800">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="mb-4 text-gray-500">Last Updated: October 2025</p>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, and other information you choose to provide.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to provide, maintain, and improve our services, such as to facilitate payments, send receipts, provide products and services you request, develop new features, provide customer support to Users and Guides, develop safety features, authenticate users, and send product updates and administrative messages.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">3. Sharing of Information</h2>
            <p>We may share your information with our guides and tour operators to enable them to provide the Services you request. For example, we share your name and photo with the guide when you book a tour.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-3">4. Security</h2>
            <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-3">5. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at privacy@kambatatravel.com.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
