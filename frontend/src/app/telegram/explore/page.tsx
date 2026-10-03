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
            opacity: active === n.href ? 1 : 0.45, transition: "opacity 0.2s",
          }}
        >
          <span style={{ fontSize: "22px" }}>{n.icon}</span>
          <span style={{ fontSize: "10px", color: active === n.href ? "#2AABEE" : "#888" }}>{n.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default function ExplorePage() {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiClient
      .get("/tours?limit=8")
      .then((r) => setTours(r.data?.data || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "80px", background: "#0f0f0f" }}>
      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg, #0a2647 0%, #144272 50%, #205295 100%)",
          padding: "36px 20px 28px", textAlign: "center",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "10px" }}>🌍</div>
        <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: "#fff", letterSpacing: "-0.5px" }}>
          Explore Kambata
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px", margin: "8px 0 0" }}>
          Ethiopia&apos;s Hidden Highland Gem
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "flex", justifyContent: "space-around",
          background: "#111", padding: "16px 0", borderBottom: "1px solid #1e1e1e",
        }}
      >
        {[["🏔️", "15+", "Destinations"], ["🏕️", "30+", "Tours"], ["⭐", "4.9", "Rating"]].map(
          ([icon, val, label]) => (
            <div key={String(label)} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "20px" }}>{icon}</div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#2AABEE", lineHeight: 1.2 }}>{val}</div>
              <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>{label}</div>
            </div>
          )
        )}
      </div>

      {/* Featured Tours */}
      <div style={{ padding: "20px 16px 0" }}>
        <h2 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 14px", color: "#fff" }}>Featured Tours</h2>
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#444" }}>Loading tours…</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {tours.slice(0, 6).map((tour: any) => (
              <div
                key={tour._id}
                onClick={() => router.push("/telegram/tours")}
                style={{
                  background: "#1a1a1a", borderRadius: "16px", overflow: "hidden",
                  cursor: "pointer", border: "1px solid #262626",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
                }}
              >
                {tour.images?.[0] && (
                  <img
                    src={tour.images[0]}
                    alt={tour.title?.en || tour.title}
                    style={{ width: "100%", height: "168px", objectFit: "cover", display: "block" }}
                  />
                )}
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: "#fff", marginBottom: "6px" }}>
                    {tour.title?.en || tour.title}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#2AABEE", fontWeight: 700, fontSize: "15px" }}>
                      ETB {tour.price?.toLocaleString()}
                    </span>
                    <span
                      style={{
                        background: "#0d3b6e", color: "#7ec8f9",
                        padding: "3px 10px", borderRadius: "20px", fontSize: "11px",
                      }}
                    >
                      {tour.duration}h
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TgNav active="/telegram/explore" />
    </div>
  );
}
