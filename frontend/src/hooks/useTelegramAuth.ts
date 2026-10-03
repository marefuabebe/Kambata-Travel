"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/utils/apiClient";

export interface TelegramUser {
  id: string;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
}

export interface AuthState {
  status: "loading" | "authenticated" | "requireRoleSelection" | "error";
  user: any | null;
  telegramUser: TelegramUser | null;
  error: string | null;
  initData: string | null;
}

/**
 * useTelegramAuth
 *
 * Handles Telegram Mini App authentication:
 * 1. Reads initData from Telegram.WebApp
 * 2. Sends to backend for HMAC validation
 * 3. If existing user => gets JWT, stores in localStorage
 * 4. If new user => returns requireRoleSelection = true
 */
export const useTelegramAuth = () => {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
    telegramUser: null,
    error: null,
    initData: null,
  });

  const authenticate = useCallback(async (initData: string) => {
    try {
      const { data } = await apiClient.post("/telegram/auth", { initData });

      if (data.requireRoleSelection) {
        setState({
          status: "requireRoleSelection",
          user: null,
          telegramUser: data.telegramUser,
          error: null,
          initData,
        });
        return;
      }

      // Store token so existing apiClient interceptors work
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      setState({
        status: "authenticated",
        user: data.user,
        telegramUser: null,
        error: null,
        initData,
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: err.response?.data?.message || "Authentication failed",
      }));
    }
  }, []);

  const completeRegistration = useCallback(
    async (role: string, linkEmail?: string, linkPassword?: string) => {
      if (!state.initData) throw new Error("No initData available");
      setState((prev) => ({ ...prev, status: "loading" }));
      try {
        const payload: any = { initData: state.initData, role };
        if (linkEmail) payload.linkEmail = linkEmail;
        if (linkPassword) payload.linkPassword = linkPassword;

        const { data } = await apiClient.post("/telegram/auth/complete", payload);

        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("user", JSON.stringify(data.user));

        setState({
          status: "authenticated",
          user: data.user,
          telegramUser: null,
          error: null,
          initData: state.initData,
        });
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: err.response?.data?.message || "Registration failed",
        }));
        throw err;
      }
    },
    [state.initData]
  );

  const checkAndAuth = useCallback(() => {
    setState((prev) => ({ ...prev, status: "loading", error: null }));
    let attempts = 0;
    const maxAttempts = 30; // 3 seconds total

    const poll = () => {
      const tg = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : null;

      if (tg) {
        tg.ready();
        try { tg.expand(); } catch (e) {}

        const initData = tg.initData;
        if (!initData) {
          setState({
            status: "error",
            user: null,
            telegramUser: null,
            error: "Telegram session data not found. Please restart the app.",
            initData: null,
          });
          return;
        }

        authenticate(initData);
        return;
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(poll, 100);
      } else {
        setState({
          status: "error",
          user: null,
          telegramUser: null,
          error: "Please open this app inside Telegram.",
          initData: null,
        });
      }
    };

    poll();
  }, [authenticate]);

  useEffect(() => {
    checkAndAuth();
  }, [checkAndAuth]);

  return { ...state, completeRegistration, retry: checkAndAuth };
};
