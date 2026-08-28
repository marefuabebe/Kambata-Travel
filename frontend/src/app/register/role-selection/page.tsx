"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Compass, ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState<"user" | "guide">("user");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { completeGoogleRegistration } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if there is a pending google token in session storage
    const token = sessionStorage.getItem("pendingGoogleToken");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  const handleContinue = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await completeGoogleRegistration(selectedRole);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to complete registration. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9F5] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#059669]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#C89B3C]/10 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-4xl bg-white/80 backdrop-blur-xl border border-gray-100 rounded-3xl p-6 md:p-10 shadow-2xl relative z-10"
      >
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#059669]/10 text-[#059669] text-xs font-semibold uppercase tracking-wider mb-4"
          >
            <Sparkles size={14} /> One Last Step
          </motion.div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            How will you experience Kambata?
          </h1>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed">
            Welcome! Select how you plan to use Kambata Travel so we can tailor your experience.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm text-center font-medium">
            {errorMessage}
          </div>
        )}

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Card 1: Traveler */}
          <motion.div
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedRole("user")}
            className={`cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300 relative flex flex-col justify-between ${
              selectedRole === "user"
                ? "border-[#059669] bg-emerald-50/40 shadow-lg shadow-[#059669]/10"
                : "border-gray-100 bg-white hover:border-gray-200 shadow-sm"
            }`}
          >
            {selectedRole === "user" && (
              <div className="absolute top-4 right-4 text-[#059669]">
                <CheckCircle2 size={24} className="fill-[#059669] text-white" />
              </div>
            )}
            <div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
                selectedRole === "user" ? "bg-[#059669] text-white" : "bg-gray-100 text-gray-600"
              }`}>
                <Compass size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Traveler / Explorer</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Discover breathtaking landscapes, book verified tours, explore rich cultural heritage, and connect with local guides.
              </p>
            </div>
            <ul className="space-y-2 pt-4 border-t border-gray-100 text-xs text-gray-500 font-medium">
              <li className="flex items-center gap-2">✓ Access custom itineraries & booking</li>
              <li className="flex items-center gap-2">✓ Direct chat with verified guides</li>
            </ul>
          </motion.div>

          {/* Card 2: Local Guide */}
          <motion.div
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedRole("guide")}
            className={`cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300 relative flex flex-col justify-between ${
              selectedRole === "guide"
                ? "border-[#059669] bg-emerald-50/40 shadow-lg shadow-[#059669]/10"
                : "border-gray-100 bg-white hover:border-gray-200 shadow-sm"
            }`}
          >
            {selectedRole === "guide" && (
              <div className="absolute top-4 right-4 text-[#059669]">
                <CheckCircle2 size={24} className="fill-[#059669] text-white" />
              </div>
            )}
            <div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
                selectedRole === "guide" ? "bg-[#059669] text-white" : "bg-gray-100 text-gray-600"
              }`}>
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Local Tour Guide</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Share your knowledge, host authentic highland experiences, list custom tour packages, and receive bookings.
              </p>
            </div>
            <ul className="space-y-2 pt-4 border-t border-gray-100 text-xs text-gray-500 font-medium">
              <li className="flex items-center gap-2">✓ Create & manage tour offerings</li>
              <li className="flex items-center gap-2">✓ Undergo official identity verification</li>
            </ul>
          </motion.div>

        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <Link href="/login" className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors">
            Cancel & Return to Sign In
          </Link>

          <button
            disabled={isSubmitting}
            onClick={handleContinue}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#059669] hover:bg-[#047857] active:scale-95 text-white font-semibold text-sm shadow-lg shadow-[#059669]/30 flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span>Completing setup...</span>
            ) : (
              <>
                <span>Continue to Account</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
