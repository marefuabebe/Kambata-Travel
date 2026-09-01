"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, KeyRound, Lock, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import apiClient from "@/utils/apiClient";
import { useLanguage } from "@/context/LanguageContext";

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill email from query param if available (from email link)
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
      // If they clicked the link, they might already have the OTP, so skip to step 2 automatically if they choose
      // For simplicity, we just pre-fill the email.
    }
  }, [searchParams]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await apiClient.post("/auth/forgot-password", { email });
      // Always transition to step 2 to avoid leaking user existence, or based on backend logic
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP code.");
      return;
    }
    setLoading(true);
    try {
      await apiClient.post("/auth/verify-otp", { email, otp });
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await apiClient.post("/auth/reset-password", { email, otp, newPassword });
      setStep(4);
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Common input styling based on login/register pages
  const inputClassName = "w-full pl-12 pr-4 py-3 sm:py-4 bg-white/5 dark:bg-[#0A0F1C]/50 border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00]/50 focus:border-[#FF8C00]/50 text-gray-900 dark:text-white placeholder:text-gray-400 text-sm sm:text-base transition-all duration-300 backdrop-blur-sm shadow-inner";
  const buttonClassName = "w-full py-3.5 sm:py-4 bg-gradient-to-r from-[#FF8C00] to-[#E67E22] hover:from-[#E67E22] hover:to-[#D35400] text-white rounded-2xl sm:rounded-xl font-bold shadow-lg shadow-[#FF8C00]/25 transition-all duration-300 flex items-center justify-center gap-2 group text-sm sm:text-base active:scale-[0.98]";

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gray-50 dark:bg-[#0A0F1C] overflow-hidden p-4 sm:p-6 lg:p-8 selection:bg-[#FF8C00]/30 selection:text-[#FF8C00]">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-[#FF8C00]/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link href="/login" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium hidden sm:inline">Back to Login</span>
        </Link>
      </div>

      <div className="w-full max-w-md relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl sm:rounded-[2rem] p-6 sm:p-10 shadow-2xl shadow-black/5"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
              {step === 1 && "Forgot Password?"}
              {step === 2 && "Enter Verification Code"}
              {step === 3 && "Create New Password"}
              {step === 4 && "Password Reset!"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
              {step === 1 && "Enter your email address and we'll send you a 6-digit code to reset your password."}
              {step === 2 && `We sent a 6-digit code to ${email}.`}
              {step === 3 && "Your new password must be different from previous used passwords."}
              {step === 4 && "Your password has been successfully reset. You can now log in."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-3"
              >
                <div className="shrink-0 mt-0.5">⚠️</div>
                <p>{error}</p>
              </motion.div>
            )}

            {/* STEP 1: REQUEST OTP */}
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleRequestOTP}
                className="space-y-5"
              >
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[#FF8C00] transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClassName}
                    placeholder="Enter your email"
                  />
                </div>
                
                <button type="submit" disabled={loading} className={buttonClassName}>
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Send Reset Code
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {/* STEP 2: VERIFY OTP */}
            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleVerifyOTP}
                className="space-y-5"
              >
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-gray-400 group-focus-within:text-[#FF8C00] transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className={`${inputClassName} tracking-[0.5em] font-mono text-center pl-4 pr-4`}
                    placeholder="••••••"
                  />
                </div>
                
                <button type="submit" disabled={loading} className={buttonClassName}>
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Verify Code
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button 
                    type="button" 
                    onClick={() => setStep(1)}
                    className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Didn't receive code? Change email.
                  </button>
                </div>
              </motion.form>
            )}

            {/* STEP 3: RESET PASSWORD */}
            {step === 3 && (
              <motion.form
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleResetPassword}
                className="space-y-5"
              >
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[#FF8C00] transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputClassName}
                    placeholder="New Password (min 8 chars)"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[#FF8C00] transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClassName}
                    placeholder="Confirm New Password"
                  />
                </div>
                
                <button type="submit" disabled={loading} className={buttonClassName}>
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Save New Password
                      <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {/* STEP 4: SUCCESS */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                
                <Link 
                  href="/login" 
                  className={buttonClassName}
                >
                  Continue to Login
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A0F1C] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#FF8C00] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  );
}
