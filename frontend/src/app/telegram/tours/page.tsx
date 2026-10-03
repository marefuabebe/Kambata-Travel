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

export default function ToursPage() {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    apiClient
      .get("/tours?limit=30")
      .then((r) => setTours(r.data?.data || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? tours.filter((t: any) =>
        (t.title?.en || t.title || "").toLowerCase().includes(search.toLowerCase())
      )
    : tours;

  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || "";

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "80px", background: "#0f0f0f" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #0a1a0f 0%, #1a3a1f 60%, #2d5a37 100%)",
          padding: "36px 20px 28px", textAlign: "center",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "10px" }}>🏕️</div>
        <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: "#fff" }}>Tours</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "8px 0 0" }}>
          Book your Kambata adventure
        </p>
      </div>

      {/* Search */}
      <div style={{ padding: "12px 16px", background: "#111", borderBottom: "1px solid #1e1e1e" }}>
        <input
          type="text"
          placeholder="Search tours…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "10px 16px", borderRadius: "10px",
            border: "1px solid #2a2a2a", background: "#1a1a1a", color: "#fff",
            fontSize: "14px", outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ padding: "16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#444" }}>Loading tours…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#555" }}>No tours found</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filtered.map((tour: any) => (
              <div
                key={tour._id}
                style={{
                  background: "#1a1a1a", borderRadius: "16px", overflow: "hidden",
                  border: "1px solid #262626", boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
                }}
              >
                {tour.images?.[0] && (
                  <img
                    src={tour.images[0]}
                    alt={tour.title?.en || tour.title}
                    style={{ width: "100%", height: "175px", objectFit: "cover", display: "block" }}
                  />
                )}
                <div style={{ padding: "14px" }}>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "6px" }}>
                    {tour.title?.en || tour.title}
                  </div>
                  <div
                    style={{
                      fontSize: "13px", color: "#777", marginBottom: "12px",
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}
                  >
                    {tour.description?.en || tour.description || ""}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "17px", fontWeight: 800, color: "#10B981" }}>
                        ETB {tour.price?.toLocaleString()}
                      </div>
                      <div style={{ fontSize: "11px", color: "#555" }}>per person</div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span
                        style={{
                          background: "#0d2b1e", color: "#10B981",
                          padding: "4px 10px", borderRadius: "20px", fontSize: "11px",
                        }}
                      >
                        {tour.duration}h
                      </span>
                      <a
                        href={`${frontendUrl}/tours/${tour._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: "#2AABEE", color: "#fff",
                          padding: "9px 16px", borderRadius: "10px",
                          fontSize: "13px", fontWeight: 700, textDecoration: "none",
                        }}
                      >
                        Book
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TgNav active="/telegram/tours" />
    </div>
  );
}
