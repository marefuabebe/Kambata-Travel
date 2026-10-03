"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/utils/apiClient";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export function useTelegramGoogleHandoff() {
  const [isTelegram, setIsTelegram] = useState(false);
  const [isWaitingForGoogle, setIsWaitingForGoogle] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { setUser } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasInitData = Boolean((window as any).Telegram?.WebApp?.initData);
      setIsTelegram(hasInitData);
    }
  }, []);

  // Handle deep link claim when Telegram app opens with ?startapp=auth_<handoffId>
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkDeepLinkParam = async () => {
      const tg = (window as any).Telegram?.WebApp;
      const startParam = tg?.initDataUnsafe?.start_param;

      if (startParam && startParam.startsWith("auth_")) {
        const handoffId = startParam.replace("auth_", "");

        // 1. If already authenticated via polling, navigate directly
        const existingToken = localStorage.getItem("token");
        const existingUserStr = localStorage.getItem("user");
        if (existingToken && existingUserStr) {
          try {
            const parsed = JSON.parse(existingUserStr);
            setUser(parsed);
            if (parsed.role === "guide") {
              router.replace("/guide-dashboard");
            } else {
              router.replace("/explorer-dashboard");
            }
            return;
          } catch (e) {}
        }

        // 2. Otherwise claim the handoff session
        try {
          const { data } = await apiClient.post("/telegram/handoff-claim", { handoffId });
          if (data.accessToken && data.user) {
            localStorage.setItem("token", data.accessToken);
            localStorage.setItem("user", JSON.stringify(data.user));
            setUser(data.user);
            toast.success(`Welcome, ${data.user.name || "Explorer"}!`);
            if (data.user.role === "guide") {
              router.replace("/guide-dashboard");
            } else {
              router.replace("/explorer-dashboard");
            }
          }
        } catch (e: any) {
          // If already claimed by background polling (410), fallback to localStorage
          const t = localStorage.getItem("token");
          const u = localStorage.getItem("user");
          if (t && u) {
            try {
              const parsed = JSON.parse(u);
              setUser(parsed);
              if (parsed.role === "guide") {
                router.replace("/guide-dashboard");
              } else {
                router.replace("/explorer-dashboard");
              }
              return;
            } catch (err) {}
          }
          console.error("[Handoff] Error claiming start_param auth:", e);
        }
      }
    };

    checkDeepLinkParam();
  }, [router, setUser]);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const startGoogleLogin = async () => {
    if (typeof window === "undefined") return;
    const tg = (window as any).Telegram?.WebApp;
    const telegramId = tg?.initDataUnsafe?.user?.id;

    setIsWaitingForGoogle(true);

    try {
      // 1. Initialize handoff session
      const { data } = await apiClient.post("/telegram/handoff-init", { telegramId });
      const handoffId = data.handoffId;

      // 2. Open external browser with Google OAuth gateway
      const browserUrl = `${window.location.origin}/auth/google-telegram?handoff=${handoffId}`;
      if (tg && typeof tg.openLink === "function") {
        tg.openLink(browserUrl);
      } else {
        window.open(browserUrl, "_blank");
      }

      // 3. Start polling for completion in background
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      let attempts = 0;
      const maxAttempts = 120; // 3 minutes max

      pollIntervalRef.current = setInterval(async () => {
        attempts++;
        if (attempts > maxAttempts) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsWaitingForGoogle(false);
          return;
        }

        try {
          const res = await apiClient.get(`/telegram/handoff-status?handoff=${handoffId}`);
          if (res.data.status === "completed" && res.data.accessToken) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setIsWaitingForGoogle(false);

            localStorage.setItem("token", res.data.accessToken);
            localStorage.setItem("user", JSON.stringify(res.data.user));
            setUser(res.data.user);

            toast.success(`Welcome back, ${res.data.user.name || "Explorer"}!`);
            if (res.data.user.role === "guide") {
              router.push("/guide-dashboard");
            } else {
              router.push("/explorer-dashboard");
            }
          }
        } catch (err) {
          // Keep polling silently
        }
      }, 1500);
    } catch (err: any) {
      setIsWaitingForGoogle(false);
      toast.error(err.response?.data?.message || "Failed to initiate Google login");
    }
  };

  const cancelGoogleLogin = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setIsWaitingForGoogle(false);
  };

  // Direct 1-Click Telegram Login (no browser redirect)
  const startTelegramOneClick = async () => {
    if (typeof window === "undefined") return;
    const tg = (window as any).Telegram?.WebApp;
    const initData = tg?.initData;

    if (!initData) {
      toast.error("Please open this app inside Telegram.");
      return;
    }

    setTelegramLoading(true);
    try {
      const { data } = await apiClient.post("/telegram/auth", { initData });

      if (data.requireRoleSelection) {
        // Complete registration as explorer/user
        const regRes = await apiClient.post("/telegram/auth/complete", {
          initData,
          role: "user",
        });
        localStorage.setItem("token", regRes.data.accessToken);
        localStorage.setItem("user", JSON.stringify(regRes.data.user));
        setUser(regRes.data.user);
        toast.success(`Welcome, ${regRes.data.user.name || "Explorer"}!`);
        router.push("/explorer-dashboard");
      } else {
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        toast.success(`Welcome back, ${data.user.name || "Explorer"}!`);
        if (data.user.role === "guide") {
          router.push("/guide-dashboard");
        } else {
          router.push("/explorer-dashboard");
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Telegram 1-click login failed");
    } finally {
      setTelegramLoading(false);
    }
  };

  return {
    isTelegram,
    isWaitingForGoogle,
    telegramLoading,
    startGoogleLogin,
    cancelGoogleLogin,
    startTelegramOneClick,
  };
}
