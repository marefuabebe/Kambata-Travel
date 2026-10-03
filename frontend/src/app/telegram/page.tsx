"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";

export default function TelegramPage() {
  const { status, user, telegramUser, error, completeRegistration, retry } = useTelegramAuth();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [linkMode, setLinkMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && user) {
      if (user.role === "guide") {
        router.replace("/guide-dashboard");
      } else {
        router.replace("/explorer-dashboard");
      }
    }
  }, [status, user, router]);

  const handleRegister = async () => {
    if (!selectedRole) { setRegError("Please choose your role."); return; }
    setRegistering(true);
    setRegError("");
    try {
      if (linkMode) {
        await completeRegistration(selectedRole, email, password);
      } else {
        await completeRegistration(selectedRole);
      }
    } catch (e: any) {
      setRegError(e?.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  if (status === "loading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "16px" }}>
        <div style={{ width: "48px", height: "48px", border: "3px solid #2AABEE", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#aaa", fontSize: "14px" }}>Connecting to Kambata Travel...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", padding: "24px", textAlign: "center", gap: "16px" }}>
        <div style={{ fontSize: "48px" }}>⚠️</div>
        <h2 style={{ color: "#EF4444", fontSize: "20px", margin: 0 }}>Authentication Error</h2>
        <p style={{ color: "#999", fontSize: "14px", margin: 0 }}>{error}</p>
        <button
          onClick={retry}
          style={{
            padding: "10px 24px",
            borderRadius: "10px",
            background: "#2AABEE",
            color: "#ffffff",
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          🔄 Try Again
        </button>
        <p style={{ color: "#666", fontSize: "12px" }}>Please close and reopen this app inside Telegram.</p>
      </div>
    );
  }

  if (status === "requireRoleSelection") {
    const tg = telegramUser;
    return (
      <div style={{ maxWidth: "440px", margin: "0 auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", paddingTop: "16px" }}>
          <div style={{ fontSize: "56px", marginBottom: "8px" }}>🌍</div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "#fff" }}>Welcome to Kambata Travel</h1>
          {tg && <p style={{ color: "#aaa", fontSize: "14px", margin: "8px 0 0" }}>Hello, {tg.firstName}! Choose how you want to join.</p>}
        </div>

        {/* Role Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            onClick={() => setSelectedRole("user")}
            style={{
              padding: "20px", borderRadius: "16px", border: `2px solid ${selectedRole === "user" ? "#2AABEE" : "#333"}`,
              background: selectedRole === "user" ? "rgba(42,171,238,0.12)" : "#1a1a1a",
              cursor: "pointer", textAlign: "left", transition: "all 0.2s",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "6px" }}>🗺️</div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: "16px" }}>Explorer / Traveler</div>
            <div style={{ color: "#888", fontSize: "13px", marginTop: "4px" }}>Discover destinations, book tours, and explore Kambata</div>
          </button>

          <button
            onClick={() => setSelectedRole("guide")}
            style={{
              padding: "20px", borderRadius: "16px", border: `2px solid ${selectedRole === "guide" ? "#10B981" : "#333"}`,
              background: selectedRole === "guide" ? "rgba(16,185,129,0.12)" : "#1a1a1a",
              cursor: "pointer", textAlign: "left", transition: "all 0.2s",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "6px" }}>🏕️</div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: "16px" }}>Local Guide</div>
            <div style={{ color: "#888", fontSize: "13px", marginTop: "4px" }}>Share your expertise and lead tours around Kambata</div>
          </button>
        </div>

        {/* Link existing account toggle */}
        <button
          onClick={() => setLinkMode(!linkMode)}
          style={{ background: "none", border: "none", color: "#2AABEE", cursor: "pointer", fontSize: "13px", textDecoration: "underline", padding: 0 }}
        >
          {linkMode ? "↩ Create a new account instead" : "Already have a Kambata account? Link it"}
        </button>

        {linkMode && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input
              type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
              style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid #333", background: "#111", color: "#fff", fontSize: "14px", outline: "none" }}
            />
            <input
              type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
              style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid #333", background: "#111", color: "#fff", fontSize: "14px", outline: "none" }}
            />
          </div>
        )}

        {regError && <p style={{ color: "#EF4444", fontSize: "13px", margin: 0, textAlign: "center" }}>{regError}</p>}

        <button
          onClick={handleRegister}
          disabled={registering || !selectedRole}
          style={{
            padding: "16px", borderRadius: "12px", border: "none",
            background: registering || !selectedRole ? "#333" : "#2AABEE",
            color: registering || !selectedRole ? "#666" : "#fff",
            fontWeight: 700, fontSize: "16px", cursor: registering || !selectedRole ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {registering ? "Setting up your account..." : "Get Started →"}
        </button>

        <p style={{ color: "#555", fontSize: "11px", textAlign: "center", margin: 0 }}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    );
  }

  return null;
}
