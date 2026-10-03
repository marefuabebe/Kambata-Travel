"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import apiClient from "@/utils/apiClient";
import { Compass, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

function GoogleTelegramContent() {
  const searchParams = useSearchParams();
  const handoffId = searchParams.get("handoff");
  const [status, setStatus] = useState<"ready" | "loading" | "success" | "error">("ready");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [botUrl, setBotUrl] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<"user" | "guide">("user");

  useEffect(() => {
    if (!handoffId) {
      setStatus("error");
      setErrorMessage("No Telegram session identified. Please start from the Telegram app.");
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

      const targetUrl = data.botUrl || `https://t.me/KambataTravelBot/app?startapp=auth_${handoffId}`;
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
    <div className="min-h-screen bg-gradient-to-br from-[#0a1917] via-[#0F766E]/20 to-[#052e2b] flex items-center justify-center p-4 font-sans text-white">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Glow decoration */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-[#0F766E]/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-[#2AABEE]/30 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0F766E] to-[#2AABEE] flex items-center justify-center shadow-lg mb-4">
          <Compass className="w-9 h-9 text-white animate-pulse" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-1">Kambata Travel</h1>
        <p className="text-xs text-emerald-200/80 mb-6 flex items-center justify-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-[#2AABEE]" /> Telegram Authentication Gateway
        </p>

        {status === "ready" && (
          <div className="w-full flex flex-col items-center">
            <p className="text-sm text-gray-200 mb-5 leading-relaxed">
              Sign in with your Google account below. Once authenticated, you will immediately return to the Telegram app.
            </p>

            {/* Role preference */}
            <div className="w-full grid grid-cols-2 gap-2 mb-6 p-1 bg-black/20 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setSelectedRole("user")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
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
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  selectedRole === "guide"
                    ? "bg-[#0F766E] text-white shadow-md"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Local Guide
              </button>
            </div>

            {/* Google Login Component */}
            <div className="w-full flex justify-center py-2">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                shape="pill"
                size="large"
                theme="outline"
                text="continue_with"
              />
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-6">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Google OAuth2 Connection</span>
            </div>
          </div>
        )}

        {status === "loading" && (
          <div className="py-10 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#2AABEE] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-gray-200">
              Verifying Google credentials...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="py-6 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 mb-1">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-white">Login Successful!</h2>
            <p className="text-xs text-gray-300 max-w-xs">
              Opening Kambata Travel inside Telegram now...
            </p>
            {botUrl && (
              <a
                href={botUrl}
                className="mt-3 w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#2AABEE] to-[#0F766E] hover:opacity-95 text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 text-sm"
              >
                Open Telegram <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        )}

        {status === "error" && (
          <div className="py-6 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-400/40 flex items-center justify-center text-red-400 text-xl font-bold">
              !
            </div>
            <h2 className="text-lg font-bold text-red-300">Authentication Error</h2>
            <p className="text-xs text-gray-300">{errorMessage}</p>
            <button
              onClick={() => setStatus("ready")}
              className="mt-2 py-2 px-5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold"
            >
              Try Again
            </button>
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
        <div className="min-h-screen bg-[#0a1917] flex items-center justify-center text-white">
          <div className="w-8 h-8 border-2 border-[#2AABEE] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <GoogleTelegramContent />
    </Suspense>
  );
}
