"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import apiClient from "@/utils/apiClient";
import Link from "next/link";
import { Mail, CheckCircle, ArrowRight, ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const VerifyEmailContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!email) {
      router.push("/login");
    }
  }, [email, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value !== "" && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    // Auto-focus the next empty input, or the last one if full
    const focusIndex = pastedData.length < 6 ? pastedData.length : 5;
    const nextInput = document.getElementById(`otp-${focusIndex}`);
    nextInput?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.post("/auth/verify-email", { email, otp: otpValue });
      setSuccess("Email verified successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login?verified=true");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setResending(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.post("/auth/resend-verification", { email });
      setSuccess("A new verification code has been sent to your email.");
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-8 overflow-hidden">
      {/* Cinematic Blurred Backdrop */}
      <div className="absolute inset-0 z-0">
        <img loading="lazy" 
          src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1776367900/photo_2026-04-16_22-30-38_p79tks.jpg" 
          className="w-full h-full object-cover scale-110 blur-xl brightness-[0.3]" 
          alt="Backdrop" 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg bg-[#FDFCF0] rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        <div className="p-8 sm:p-12">
          <div className="flex items-center justify-between mb-10">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Back to Login
            </Link>
            <div className="h-8">
               <img loading="lazy" src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg" alt="Kambata Travel" className="h-full w-auto object-contain brightness-75 contrast-125" />
            </div>
          </div>

          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">Verify your email</h1>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            We sent a secure 6-digit code to <br/>
            <span className="font-bold text-gray-900">{email}</span>. <br/>
            Please enter it below to authenticate.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-start gap-3">
               <div className="mt-0.5"><ShieldCheck size={16}/></div>
               <div>{error}</div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm font-medium flex items-center gap-3">
               <CheckCircle size={16}/> {success}
            </div>
          )}

          <form onSubmit={handleVerify}>
            <div className="flex justify-between gap-2 mb-8">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 sm:w-14 sm:h-16 bg-[#F9FAFB] border border-gray-200 rounded-xl text-center text-xl font-bold text-gray-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join("").length < 6}
              className="w-full bg-[#1A331B] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#132614] transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Identity"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-sm text-gray-500 mb-3">Didn't receive the code?</p>
            <button
              onClick={handleResend}
              disabled={countdown > 0 || resending}
              className={`text-sm font-bold transition-colors ${countdown > 0 ? 'text-gray-400' : 'text-primary hover:underline'}`}
            >
              {resending ? "Sending..." : countdown > 0 ? `Resend available in ${countdown}s` : "Resend Verification Code"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
