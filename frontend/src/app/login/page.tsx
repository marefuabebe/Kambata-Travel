"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Lock, ArrowLeft, ArrowRight, Quote, LogIn, Compass, Eye, EyeOff, User, Star, Luggage, ShieldCheck, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { GoogleLogin } from "@react-oauth/google";
import { useTelegramGoogleHandoff } from "@/hooks/useTelegramGoogleHandoff";
const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginWithGoogle, loading, error } = useAuth();
  const { t, language } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  const [googleError, setGoogleError] = useState<string | null>(null);
  const {
    isTelegram,
    isWaitingForGoogle,
    telegramLoading,
    startGoogleLogin,
    cancelGoogleLogin,
    startTelegramOneClick,
  } = useTelegramGoogleHandoff();

  const handleGoogleSuccess = (credentialResponse: any) => {
    console.log("[DEBUG GOOGLE OAUTH] Login Success! credentialResponse:", credentialResponse);
    setGoogleError(null);
    const token = credentialResponse.credential;
    if (!token) {
      console.error("[DEBUG GOOGLE OAUTH] No credential in response!");
      setGoogleError("Google login failed: No token received.");
      return;
    }
    loginWithGoogle(token);
  };

  const handleGoogleError = () => {
    console.error("[DEBUG GOOGLE OAUTH] Login Error");
    setGoogleError("Google login failed.");
  };
  const searchParams = useSearchParams();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("registered")) {
      setSuccessMessage("Account created successfully! Please sign in to continue.");
    }
  }, [searchParams]);

  const visualStories = [
    {
      image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782475294/file_ddh4wk.svg",
      tagline: "THE COLORS OF KAMBATA",
      title: "Woven in \n Heritage.",
      description: "Adorned in signature hand-woven 'Hambacho' garments, the sisters of Kambata embody a legacy of elegance, community, and the timeless art of traditional craftsmanship."
    },
    {
      image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782475307/file_1_kqa1l2.svg",
      tagline: "THE MAJESTY OF AMBARCHO",
      title: "Peak of the \n Highlands.",
      description: "Ascend the legendary 777 stairs of Mount Ambarcho, where ancient horizons reveal the mist-shrouded soul of Southern Ethiopia's most breathtaking landscape."
    }
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % visualStories.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData);
    } catch (err) {
      // Error handled by context
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9F5] flex flex-col lg:flex-row font-sans overflow-x-hidden">
      
      {/* Back to Home Button */}
      <Link href="/" className="absolute top-4 left-4 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white transition-all shadow-sm border border-white/20">
        <ArrowLeft size={20} />
      </Link>

      {/* Left Side: Desktop Image Carousel / Mobile Hero */}
      <div className="w-full lg:w-1/2 h-[25vh] md:h-[40vh] lg:h-auto lg:min-h-screen relative flex flex-col items-center justify-center">
        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <motion.img 
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            src={visualStories[currentSlide].image} 
            className="w-full h-full object-cover" 
            alt="Kambata Background" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/10 md:bg-black/30" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center w-full max-w-lg mx-auto">
          <span className="bg-white/20 backdrop-blur-md text-white text-[9px] uppercase tracking-widest font-bold py-1 px-3 rounded-full mb-2 md:mb-3 border border-white/30">KAMBATA TRAVEL</span>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2 shadow-sm leading-tight">{t("auth.welcomeBack")}</h1>
          <p className="text-white/90 text-xs md:text-sm max-w-[280px] md:max-w-md">{t("auth.continueJourney")}</p>
          
          <div className="hidden lg:flex flex-col gap-3 text-left mt-8 w-full px-8">
             <div className="flex items-center gap-3 text-white/90 font-medium"><Check className="text-[#D4A017]" size={18} /> {t("auth.discoverHidden")}</div>
             <div className="flex items-center gap-3 text-white/90 font-medium"><Check className="text-[#D4A017]" size={18} /> {t("auth.bookGuides")}</div>
             <div className="flex items-center gap-3 text-white/90 font-medium"><Check className="text-[#D4A017]" size={18} /> {t("auth.experienceCulture")}</div>
          </div>
        </div>
      </div>

      {/* Right Side: Auth Card Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-3 sm:p-4 md:p-8 -mt-[40px] md:-mt-[60px] lg:mt-0 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[500px] bg-[rgba(255,255,255,0.92)] backdrop-blur-[20px] rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-5 sm:p-7 border border-white/50 flex flex-col"
        >
          <div className="flex justify-center mb-6">
            <img src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg" alt="Kambaata Travel Logo" className="h-10 w-auto object-contain" />
          </div>

          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-xs font-medium rounded-r-lg"
            >
              {successMessage}
            </motion.div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-medium rounded-r-lg">
              {error}
            </div>
          )}

          {googleError && (
            <div className="mb-4 p-3 bg-orange-50 border-l-4 border-orange-500 text-orange-700 text-xs font-medium rounded-r-lg">
              {googleError}
            </div>
          )}


          <form onSubmit={handleSubmit} className="space-y-3 flex-1">
            {/* Floating Label Email */}
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0F766E] transition-colors w-5 h-5" />
              <input 
                type="email" 
                name="email"
                id="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="peer w-full bg-white border border-gray-200 rounded-[24px] pt-6 pb-2 px-12 text-gray-900 font-medium focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all outline-none shadow-sm" 
                placeholder=" "
              />
              <label htmlFor="email" className="absolute left-12 top-4 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wider text-gray-400 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-[11px] peer-placeholder-shown:font-semibold peer-placeholder-shown:normal-case peer-focus:top-4 peer-focus:text-[9px] peer-focus:font-bold peer-focus:uppercase peer-focus:text-[#0F766E] cursor-text">
                {t("auth.email")}
              </label>
            </div>

            {/* Floating Label Password */}
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0F766E] transition-colors w-5 h-5" />
              <input 
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="peer w-full bg-white border border-gray-200 rounded-[24px] pt-6 pb-2 px-12 text-gray-900 font-medium focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all outline-none shadow-sm" 
                placeholder=" "
              />
              <label htmlFor="password" className="absolute left-12 top-4 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wider text-gray-400 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-[11px] peer-placeholder-shown:font-semibold peer-placeholder-shown:normal-case peer-focus:top-4 peer-focus:text-[9px] peer-focus:font-bold peer-focus:uppercase peer-focus:text-[#0F766E] cursor-text">
                {t("auth.password")}
              </label>
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="flex justify-between items-center py-1">
               <div className="flex items-center gap-2">
                  <input type="checkbox" id="stay" className="w-4 h-4 rounded border-gray-300 text-[#0F766E] focus:ring-[#0F766E] cursor-pointer" />
                  <label htmlFor="stay" className="text-[11px] font-medium text-gray-500 cursor-pointer">{t("auth.rememberMe")}</label>
               </div>
               <Link href="/forgot-password" className="text-[11px] font-bold text-[#14532D] hover:text-[#0F766E] transition-colors">{t("auth.forgotPassword")}</Link>
            </div>

            <div className="text-center mt-2 mb-1">
               <p className="text-[11px] text-gray-500">
                 {t("auth.agreeTo")} <Link href="/terms" className="text-[#0F766E] hover:underline">{t("auth.terms")}</Link> {t("auth.and")} <Link href="/privacy" className="text-[#0F766E] hover:underline">{t("auth.privacy")}</Link>.
               </p>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-[56px] bg-gradient-to-r from-[#0F766E] to-[#15803D] text-white font-bold rounded-full shadow-[0_8px_20px_rgba(15,118,110,0.3)] hover:shadow-[0_12px_25px_rgba(15,118,110,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 text-[15px] mt-1 flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  {t("auth.signingIn")}
                </>
              ) : t("auth.signIn")}
            </button>
          </form>

          {/* Trust Indicators directly below button */}
          {/* OPTION 1: Pill style (Active) */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <div className="flex items-center gap-[8px] bg-[#0F766E]/10 px-3 py-1.5 rounded-full border border-[#0F766E]/20 text-[#0F766E] text-[10px] font-bold">
              <Star size={12} fill="currentColor" /> 4.9 {t("auth.rating")}
            </div>
            <div className="flex items-center gap-[8px] bg-[#0F766E]/10 px-3 py-1.5 rounded-full border border-[#0F766E]/20 text-[#0F766E] text-[10px] font-bold">
              <Luggage size={12} /> 1K+ {t("auth.travelers")}
            </div>
            <div className="flex items-center gap-[8px] bg-[#0F766E]/10 px-3 py-1.5 rounded-full border border-[#0F766E]/20 text-[#0F766E] text-[10px] font-bold">
              <ShieldCheck size={12} /> {t("auth.secureLogin")}
            </div>
          </div>

          <div className="flex items-center gap-4 my-5">
             <div className="h-px bg-gray-200 flex-1"></div>
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("auth.or")}</span>
             <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          {/* Social Buttons */}
          <div className="flex flex-col gap-2.5">
            {isTelegram ? (
              <div className="flex flex-col gap-2.5">
                {/* 1. Continue with Google (Handoff to external browser + automatic return to Telegram) */}
                {isWaitingForGoogle ? (
                  <div className="w-full p-3.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center justify-between text-xs font-semibold shadow-sm animate-pulse">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span>Completing Google sign-in in browser...</span>
                    </div>
                    <button
                      type="button"
                      onClick={cancelGoogleLogin}
                      className="text-gray-500 hover:text-gray-800 underline text-[11px] ml-2"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={startGoogleLogin}
                    className="w-full py-3 px-4 rounded-full bg-white hover:bg-gray-50 text-gray-700 font-semibold flex items-center justify-center gap-3 shadow-sm border border-gray-300 transition-all text-sm active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    Continue with Google
                  </button>
                )}

                {/* 2. Instant 1-Click Telegram Login */}
                <button
                  type="button"
                  onClick={startTelegramOneClick}
                  disabled={telegramLoading}
                  className="w-full py-2.5 px-4 rounded-full bg-[#2AABEE]/10 hover:bg-[#2AABEE]/20 text-[#0088cc] font-semibold flex items-center justify-center gap-2 border border-[#2AABEE]/30 transition-all text-xs"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                  </svg>
                  {telegramLoading ? "Signing in..." : "Or Instant 1-Click with Telegram"}
                </button>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  shape="pill"
                  text="continue_with"
                  size="large"
                  theme="outline"
                />
              </div>
            )}
          </div>

          {/* OPTION 2: Minimalist style (Commented out)
          <div className="flex flex-wrap items-center justify-center gap-5 mt-4 text-[11px] font-semibold text-gray-600">
            <div className="flex items-center gap-1.5">
              <Star size={14} className="text-[#0F766E]" fill="currentColor" /> 4.9 Rating
            </div>
            <div className="flex items-center gap-1.5">
              <Luggage size={14} className="text-[#0F766E]" /> 1K+ Travelers
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#0F766E]" /> Secure Login
            </div>
          </div>
          */}

          <div className="mt-2 pt-2 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500 font-medium">
              {t("auth.noAccount")} <Link href="/register" className="text-[#0F766E] font-bold hover:text-[#15803D] transition-colors">{t("auth.startJourney")}</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default function LoginPageWrapper() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#FDFCF0] flex items-center justify-center">Loading...</div>}>
      <LoginPage />
    </React.Suspense>
  );
}
