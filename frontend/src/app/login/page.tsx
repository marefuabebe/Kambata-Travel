"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Lock, ArrowLeft, ArrowRight, Quote, LogIn, Compass, Eye, EyeOff, User, Star, Luggage, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { GoogleLogin } from "@react-oauth/google";
const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginWithGoogle, loading, error } = useAuth();
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  const [googleError, setGoogleError] = useState<string | null>(null);

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
             <div className="flex items-center gap-3 text-white/90 font-medium"><span className="text-[#D4A017] text-lg">✓</span> {t("auth.discoverHidden")}</div>
             <div className="flex items-center gap-3 text-white/90 font-medium"><span className="text-[#D4A017] text-lg">✓</span> {t("auth.bookGuides")}</div>
             <div className="flex items-center gap-3 text-white/90 font-medium"><span className="text-[#D4A017] text-lg">✓</span> {t("auth.experienceCulture")}</div>
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
