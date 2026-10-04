"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import apiClient from "@/utils/apiClient";
import { CheckCircle2, ArrowRight, ShieldCheck, Send, Zap, Lock, Compass } from "lucide-react";

function GoogleTelegramContent() {
  const searchParams = useSearchParams();
  const handoffId = searchParams.get("handoff");
  const [status, setStatus] = useState<"ready" | "loading" | "success" | "error">("ready");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [botUrl, setBotUrl] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<"user" | "guide">("user");
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  useEffect(() => {
    if (!handoffId) {
      setStatus("error");
      setErrorMessage("No Telegram session identified. Please launch this from @KambataTravelBot.");
    }
  }, [handoffId]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    const token = credentialResponse?.credential;
    if (!token || !handoffId) {
      setStatus("error");
      setErrorMessage("Google token not received. Please try again.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const { data } = await apiClient.post("/telegram/handoff-complete", {
        handoffId,
        token,
        role: selectedRole,
      });

      const targetUrl = data.botUrl || `https://t.me/KambataTravelBot?startapp=auth_${handoffId}`;
      setBotUrl(targetUrl);
      setStatus("success");

      // Auto-redirect to Telegram after 800ms
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 800);
    } catch (err: any) {
      console.error("[Handoff] Error completing Google Auth:", err);
      setStatus("error");
      setErrorMessage(
        err.response?.data?.message || "Failed to complete Google authentication. Please try again."
      );
    }
  };

  const handleGoogleError = () => {
    setStatus("error");
    setErrorMessage("Google sign-in was canceled or encountered an issue.");
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 font-sans overflow-hidden bg-[#041110]">
      {/* Background Image with Dark Vignette */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat filter blur-[1px] scale-105 opacity-40 transition-transform duration-1000"
        style={{
          backgroundImage: `url('https://res.cloudinary.com/dzf4st3t2/image/upload/v1782475307/file_1_kqa1l2.svg')`
        }}
      />
      
      {/* Ambient Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-[#071917]/80 to-[#041110]/95" />
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#0F766E]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#2AABEE]/25 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md bg-[#0A1A18]/90 backdrop-blur-2xl border border-white/15 rounded-[32px] p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.6)] flex flex-col items-center text-center overflow-hidden">
        
        {/* Brand Logo */}
        <div className="mb-4 flex flex-col items-center">
          <img
            src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg"
            alt="Kambata Travel Logo"
            className="h-10 sm:h-12 w-auto object-contain drop-shadow-md mb-2"
          />
          {/* Telegram Connection Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2AABEE]/15 border border-[#2AABEE]/30 text-[#2AABEE] text-[11px] font-semibold tracking-wide">
            <Send className="w-3 h-3 text-[#2AABEE]" />
            <span>@KambataTravelBot Gateway</span>
          </div>
        </div>

        {status === "ready" && (
          <div className="w-full flex flex-col items-center animate-in fade-in duration-300">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              Continue with Google
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 mb-6 leading-relaxed max-w-xs">
              Sign in with your Google account to access your tours, bookings, and dashboard inside Telegram.
            </p>

            {/* Google Login Component Frame */}
            <div className="w-full flex justify-center py-2 mb-4">
              <div className="p-1 rounded-full bg-white/10 border border-white/20 shadow-lg hover:border-emerald-400/50 transition-all duration-300">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  shape="pill"
                  size="large"
                  theme="outline"
                  text="continue_with"
                />
              </div>
            </div>

            {/* Optional Role Preference for new accounts */}
            <div className="w-full mt-2">
              <button
                type="button"
                onClick={() => setShowRoleSelector(!showRoleSelector)}
                className="text-[11px] text-emerald-300/80 hover:text-white underline transition-colors"
              >
                {showRoleSelector ? "Hide account type options" : "Joining as a Local Guide? Select here"}
              </button>

              {showRoleSelector && (
                <div className="mt-3 w-full grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-2xl border border-white/10 animate-in fade-in duration-200">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("user")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                      selectedRole === "user"
                        ? "bg-[#0F766E] text-white shadow-md"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    Explorer / Traveler
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("guide")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                      selectedRole === "guide"
                        ? "bg-[#0F766E] text-white shadow-md"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    Local Guide
                  </button>
                </div>
              )}
            </div>

            {/* Security Badges */}
            <div className="grid grid-cols-3 gap-2 w-full mt-6 pt-5 border-t border-white/10 text-[10px] sm:text-[11px] text-gray-300">
              <div className="flex flex-col items-center gap-1 text-center">
                <ShieldCheck className="w-4 h-4 text-[#D4A017]" />
                <span className="font-medium">OAuth 2.0</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <Zap className="w-4 h-4 text-[#2AABEE]" />
                <span className="font-medium">Instant Return</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span className="font-medium">256-Bit SSL</span>
              </div>
            </div>
          </div>
        )}

        {status === "loading" && (
          <div className="py-10 flex flex-col items-center gap-4 animate-in fade-in duration-200">
            <div className="w-14 h-14 border-4 border-[#2AABEE] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(42,171,238,0.3)]" />
            <h3 className="text-lg font-bold text-white">Verifying Credentials</h3>
            <p className="text-xs text-emerald-200/80">Connecting your Google profile to Telegram...</p>
          </div>
        )}

        {status === "success" && (
          <div className="py-6 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300 w-full">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] mb-1">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Login Successful!</h2>
            <p className="text-xs sm:text-sm text-gray-200 max-w-xs leading-relaxed">
              Opening Kambata Travel inside Telegram now...
            </p>
            {botUrl && (
              <a
                href={botUrl}
                className="mt-3 w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#2AABEE] via-[#0F766E] to-[#10B981] hover:opacity-95 text-white font-bold flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(42,171,238,0.4)] transition-transform active:scale-95 text-sm"
              >
                <Send className="w-4 h-4" /> Open Telegram App <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        )}

        {status === "error" && (
          <div className="py-6 flex flex-col items-center gap-3 w-full animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 text-2xl font-bold shadow-[0_0_25px_rgba(244,63,94,0.2)] mb-1">
              !
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Authentication Notice</h2>
            <p className="text-xs sm:text-sm text-gray-200 max-w-sm px-2 leading-relaxed">
              {errorMessage}
            </p>
            <div className="flex gap-2 w-full mt-4">
              <button
                type="button"
                onClick={() => setStatus("ready")}
                className="flex-1 py-3 px-4 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-all active:scale-95"
              >
                Try Again
              </button>
              <a
                href="https://t.me/KambataTravelBot"
                className="flex-1 py-3 px-4 rounded-full bg-gradient-to-r from-[#2AABEE] to-[#0F766E] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Send className="w-3.5 h-3.5" /> Back to Bot
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function GoogleTelegramPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#041110] flex items-center justify-center text-white">
          <div className="w-8 h-8 border-2 border-[#2AABEE] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <GoogleTelegramContent />
    </Suspense>
  );
}
