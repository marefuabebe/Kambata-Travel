"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const NAV = [
  { label: "Explore", icon: "🗺️", href: "/telegram/explore" },
  { label: "Destinations", icon: "📍", href: "/telegram/destinations" },
  { label: "Tours", icon: "🏕️", href: "/telegram/tours" },
  { label: "Bookings", icon: "📋", href: "/telegram/bookings" },
  { label: "Account", icon: "👤", href: "/telegram/account" },
];

function TgNav({ active }: { active: string }) {
  const router = useRouter();
  return (
    <nav
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(15,15,15,0.97)", backdropFilter: "blur(14px)",
        borderTop: "1px solid #222", display: "flex", justifyContent: "space-around",
        padding: "8px 0 env(safe-area-inset-bottom, 8px)", zIndex: 100,
      }}
    >
      {NAV.map((n) => (
        <button
          key={n.href}
          onClick={() => router.push(n.href)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
            background: "none", border: "none", cursor: "pointer", padding: "4px 8px",
            opacity: active === n.href ? 1 : 0.45,
          }}
        >
          <span style={{ fontSize: "22px" }}>{n.icon}</span>
          <span style={{ fontSize: "10px", color: active === n.href ? "#2AABEE" : "#888" }}>{n.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || "";

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/telegram");
  };

  const initials = user?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const isGuide = user?.role === "guide";
  const dashboardPath = isGuide ? "/guide-dashboard" : "/explorer-dashboard";
  const roleLabel = isGuide ? "Local Guide" : "Explorer / Traveler";
  const roleColor = isGuide ? "#10B981" : "#2AABEE";
  const roleBg = isGuide ? "rgba(16,185,129,0.15)" : "rgba(42,171,238,0.15)";

  const isTelegramEmail = user?.email?.startsWith("tg_");

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "80px", background: "#0f0f0f" }}>
      {/* Profile header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1a0820 0%, #2d0a3f 60%, #4a1270 100%)",
          padding: "36px 20px 28px", textAlign: "center",
        }}
      >
        <div
          style={{
            width: "76px", height: "76px", borderRadius: "50%",
            background: "linear-gradient(135deg, #2AABEE, #1565c0)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px", fontWeight: 800, color: "#fff",
            margin: "0 auto 14px", overflow: "hidden",
          }}
        >
          {user?.profilePicture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profilePicture}
              alt={user.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            initials
          )}
        </div>
        <h1 style={{ fontSize: "21px", fontWeight: 800, margin: 0, color: "#fff" }}>
          {user?.name || "Guest"}
        </h1>
        {user?.telegramUsername && (
          <p style={{ color: "#888", fontSize: "12px", margin: "4px 0 0" }}>
            @{user.telegramUsername}
          </p>
        )}
        <div
          style={{
            display: "inline-block", background: roleBg, color: roleColor,
            padding: "5px 16px", borderRadius: "20px", fontSize: "12px",
            fontWeight: 700, marginTop: "10px",
          }}
        >
          {roleLabel}
        </div>
      </div>

      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* Account details card */}
        <div
          style={{
            background: "#1a1a1a", borderRadius: "16px",
            border: "1px solid #262626", overflow: "hidden",
          }}
        >
          {[
            { label: "Name", value: user?.name || "—" },
            { label: "Email", value: isTelegramEmail ? "(Telegram account)" : (user?.email || "—") },
            { label: "Role", value: roleLabel },
            ...(isGuide && user?.guideStatus
              ? [{ label: "Guide Status", value: user.guideStatus.toUpperCase() }]
              : []),
          ].map((item, i, arr) => (
            <div
              key={i}
              style={{
                padding: "14px 16px",
                borderBottom: i < arr.length - 1 ? "1px solid #222" : "none",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
            >
              <span style={{ color: "#555", fontSize: "13px" }}>{item.label}</span>
              <span style={{ color: "#bbb", fontSize: "13px", textAlign: "right", maxWidth: "60%" }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Full dashboard CTA */}
        <a
          href={frontendUrl + dashboardPath}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            background: "linear-gradient(135deg, #2AABEE 0%, #1565c0 100%)",
            color: "#fff", padding: "17px", borderRadius: "14px",
            textAlign: "center", fontWeight: 700, fontSize: "15px",
            textDecoration: "none", letterSpacing: "0.2px",
          }}
        >
          Open Full Dashboard ↗
        </a>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          style={{
            background: "#1a1a1a", border: "1px solid rgba(239,68,68,0.35)",
            color: "#EF4444", padding: "15px", borderRadius: "14px",
            fontSize: "14px", fontWeight: 600, cursor: "pointer",
          }}
        >
          Sign Out
        </button>

        <p style={{ color: "#333", fontSize: "11px", textAlign: "center", margin: "4px 0 0", lineHeight: 1.6 }}>
          Kambata Travel — Telegram Mini App
          <br />
          For full features visit kambata.travel
        </p>
      </div>

      <TgNav active="/telegram/account" />
    </div>
  );
}
