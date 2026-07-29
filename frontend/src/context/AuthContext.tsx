"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/utils/apiClient";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  profilePicture?: string;
  guideStatus?: "none" | "pending" | "approved" | "rejected";
  schedulingDisabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  error: string | null;
  login: (credentials: any) => Promise<void>;
  loginWithGoogle: (token: string, role?: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  syncGuideStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Load user from token on startup
  useEffect(() => {
    const hydrateAuth = async () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
      setLoading(false);
    };
    hydrateAuth();
  }, []);

  const login = async (credentials: any) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.post("/auth/login", credentials);
      setUser(data);
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data));
      
      // Admins use the isolated portal (port 3001) — never the main site
      if (data.role === "admin") {
        const adminPortalUrl =
          process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL || "http://localhost:3001/login";
        window.location.href = adminPortalUrl;
        return;
      } else if (data.role === "guide") {
        router.push("/guide-dashboard");
      } else {
        router.push("/explorer-dashboard");
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Login failed. Please try again.";
      if (err.response?.status === 403 && errorMessage.toLowerCase().includes("verify")) {
         router.push(`/verify-email?email=${encodeURIComponent(credentials.email)}`);
      } else {
         setError(errorMessage);
         throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (token: string, role?: string) => {
    console.log(`[DEBUG GOOGLE OAUTH] loginWithGoogle called. Token exists: ${!!token}, role: ${role}`);
    setLoading(true);
    setError(null);
    try {
      console.log(`[DEBUG GOOGLE OAUTH] Sending POST request to /auth/google...`);
      const { data } = await apiClient.post("/auth/google", { token, role });
      
      console.log(`[DEBUG GOOGLE OAUTH] Received response data:`, data);
      
      setUser(data);
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data));
      
      console.log(`[DEBUG GOOGLE OAUTH] Context and localStorage updated. Evaluating redirect for role: ${data.role}`);
      
      if (data.role === "admin") {
        const adminPortalUrl =
          process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL || "http://localhost:3001/login";
        console.log(`[DEBUG GOOGLE OAUTH] Redirecting to admin: ${adminPortalUrl}`);
        window.location.href = adminPortalUrl;
        return;
      } else if (data.role === "guide") {
        console.log(`[DEBUG GOOGLE OAUTH] Redirecting to /guide-dashboard`);
        window.location.href = "/guide-dashboard";
      } else {
        console.log(`[DEBUG GOOGLE OAUTH] Redirecting to /explorer-dashboard`);
        window.location.href = "/explorer-dashboard";
      }
    } catch (err: any) {
      console.error(`[DEBUG GOOGLE OAUTH] Error in loginWithGoogle:`, err);
      const errorMessage = err.response?.data?.message || "Google Login failed. Please try again.";
      setError(errorMessage);
      throw err;
    } finally {
      console.log(`[DEBUG GOOGLE OAUTH] loginWithGoogle finally block reached.`);
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post("/auth/register", userData);
      router.push(`/verify-email?email=${encodeURIComponent(userData.email)}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const syncGuideStatus = async () => {
    console.log("[DEBUG AUTH] syncGuideStatus initiated. User:", user ? user.role : "null");
    if (!user || user.role !== "guide") return;
    try {
      console.log("[DEBUG AUTH] syncGuideStatus calling /guides/profile...");
      const res = await apiClient.get("/guides/profile");
      console.log("[DEBUG AUTH] syncGuideStatus success. Data:", res.data);
      const updatedUser: User = {
        ...user,
        name: res.data.data.name,
        profilePicture: res.data.data.profilePicture,
        guideStatus: res.data.data.guideStatus,
        schedulingDisabled: res.data.data.schedulingDisabled,
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      console.warn("[DEBUG AUTH] syncGuideStatus failed", err);
    }
  };

  const refreshUser = async () => {
    try {
      const endpoint = user?.role === "guide" ? "/guides/profile" : "/users/profile";
      const res = await apiClient.get(endpoint);
      const updatedUser = {
        ...user!,
        name: res.data.data.name,
        profilePicture: res.data.data.profilePicture,
        phone: res.data.data.phone,
        location: res.data.data.location,
        ...(user?.role === "guide" && {
          guideStatus: res.data.data.guideStatus,
          schedulingDisabled: res.data.data.schedulingDisabled,
        }),
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      // Silently fail — don't re-throw, as this would bubble up to the
      // settings page and show a false "Failed to save" error even when the
      // actual PUT /users/profile succeeded.
      console.warn("refreshUser: could not refresh user state", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, error, login, loginWithGoogle, register, logout, refreshUser, syncGuideStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
