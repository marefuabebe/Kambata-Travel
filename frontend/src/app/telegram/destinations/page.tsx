"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/utils/apiClient";

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

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/destinations")
      .then((r) => setDestinations(r.data?.data || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "80px", background: "#0f0f0f" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #1a0a2e 0%, #16213e 60%, #0f3460 100%)",
          padding: "36px 20px 28px", textAlign: "center",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "10px" }}>📍</div>
        <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: "#fff" }}>Destinations</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "8px 0 0" }}>
          Discover Kambata&apos;s most beautiful places
        </p>
      </div>

      <div style={{ padding: "20px 16px 0" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#444" }}>Loading destinations…</div>
        ) : destinations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#555" }}>No destinations found</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {destinations.map((dest: any) => (
              <div
                key={dest._id}
                style={{
                  background: "#1a1a1a", borderRadius: "14px", overflow: "hidden",
                  border: "1px solid #262626",
                }}
              >
                {dest.images?.[0] && (
                  <img
                    src={dest.images[0]}
                    alt={dest.name?.en || dest.name}
                    style={{ width: "100%", height: "110px", objectFit: "cover", display: "block" }}
                  />
                )}
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>
                    {dest.name?.en || dest.name}
                  </div>
                  {dest.region && (
                    <div style={{ fontSize: "11px", color: "#555", marginTop: "3px" }}>{dest.region}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TgNav active="/telegram/destinations" />
    </div>
  );
}
