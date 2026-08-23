"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import apiClient from "@/utils/apiClient";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("Verifying your payment…");

  useEffect(() => {
    const tx_ref = searchParams.get("trx_ref") || searchParams.get("tx_ref");
    if (!tx_ref) {
      setStatus("failed");
      setMessage("Missing transaction reference");
      return;
    }

    const verify = async () => {
      try {
        const { data } = await apiClient.get(`/payments/verify/${tx_ref}`);
        if (data.status === "success") {
          setStatus("success");
          setMessage("Payment confirmed! Funds are held securely until your tour is completed.");
        } else {
          setStatus("failed");
          setMessage(data.message || "Payment could not be verified");
        }
      } catch {
        setStatus("failed");
        setMessage("Verification failed. Check My Expeditions for booking status.");
      }
    };

    verify();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFCF0] via-[#F8F6F2] to-[#EBE6DC] flex flex-col font-sans transition-colors duration-500">
      <Header theme="light" />
      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden pt-32">
        {/* Decorative Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D97706]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#1E293B]/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] p-10 md:p-16 max-w-2xl w-full text-center shadow-[0_20px_60px_-15px_rgba(15,23,42,0.1)] border border-white relative z-10 transition-colors">
          {status === "loading" && (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-[#D97706]/5 rounded-full flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 border-4 border-[#D97706]/10 rounded-full animate-ping opacity-50" />
                <Loader2 className="animate-spin text-[#D97706]" size={40} />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[#D97706] mb-4 tracking-tight">Processing Payment</h1>
              <p className="text-gray-600 font-medium text-lg max-w-sm mx-auto leading-relaxed">{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-8 shadow-inner relative">
                <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl animate-pulse" />
                <CheckCircle2 className="text-amber-500 relative z-10" size={48} strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight transition-colors">Booking Confirmed!</h1>
              <p className="text-gray-600 font-medium text-lg max-w-md mx-auto mb-10 leading-relaxed transition-colors">{message}</p>
              
              <Link
                href="/explorer-dashboard/bookings"
                className="group relative inline-flex items-center justify-center bg-[#1E293B] text-white px-10 py-4 rounded-2xl font-black tracking-wide overflow-hidden transition-all hover:scale-105 hover:bg-[#0F172A] hover:shadow-[0_10px_40px_-10px_rgba(15,23,42,0.5)] active:scale-95"
              >
                <span className="relative z-10 flex items-center gap-2">
                  View My Expeditions
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              </Link>
            </div>
          )}

          {status === "failed" && (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-8 shadow-inner relative">
                <div className="absolute inset-0 bg-red-400/20 rounded-full blur-xl animate-pulse" />
                <XCircle className="text-red-500 relative z-10" size={48} strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight transition-colors">Payment Issue</h1>
              <p className="text-gray-600 font-medium text-lg max-w-md mx-auto mb-10 leading-relaxed transition-colors">{message}</p>
              
              <Link
                href="/explorer-dashboard/my-requests"
                className="inline-flex items-center justify-center bg-white text-red-600 border-2 border-red-100 hover:border-red-500 hover:bg-red-50 px-10 py-4 rounded-2xl font-black tracking-wide transition-all hover:scale-105 active:scale-95"
              >
                Return to Requests
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function PaymentCallbackPageWrapper() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center">Loading...</div>}>
      <PaymentCallbackPage />
    </React.Suspense>
  );
}
