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

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#10B981",
  pending: "#F59E0B",
  cancelled: "#EF4444",
  completed: "#6366F1",
  waitlisted: "#8B5CF6",
  rejected: "#EF4444",
};

export default function BookingsPage() {
  const [data, setData] = useState<{ tourBookings: any[]; packageBookings: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Session expired — please re-open the app.");
      setLoading(false);
      return;
    }
    apiClient
      .get("/telegram/bookings")
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.message || "Could not load bookings"))
      .finally(() => setLoading(false));
  }, []);

  const allBookings = [
    ...(data?.tourBookings || []).map((b) => ({ ...b, _btype: "tour" })),
    ...(data?.packageBookings || []).map((b) => ({ ...b, _btype: "package" })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "80px", background: "#0f0f0f" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #0f0a2e 0%, #1e1347 60%, #2d1b69 100%)",
          padding: "36px 20px 28px", textAlign: "center",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "10px" }}>📋</div>
        <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: "#fff" }}>My Bookings</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "8px 0 0" }}>
          Your Kambata travel history
        </p>
      </div>

      <div style={{ padding: "16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#444" }}>Loading your bookings…</div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>⚠️</div>
            <p style={{ color: "#EF4444", fontSize: "14px" }}>{error}</p>
          </div>
        ) : allBookings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: "56px", marginBottom: "14px" }}>🗺️</div>
            <p style={{ color: "#555", fontSize: "15px", marginBottom: "20px" }}>No bookings yet. Start exploring!</p>
            <button
              onClick={() => router.push("/telegram/tours")}
              style={{
                background: "#2AABEE", color: "#fff", border: "none",
                padding: "13px 28px", borderRadius: "12px",
                fontSize: "15px", fontWeight: 700, cursor: "pointer",
              }}
            >
              Browse Tours
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {allBookings.map((booking: any) => {
              const title =
                booking._btype === "tour"
                  ? booking.tour?.title?.en || booking.tour?.title || "Tour"
                  : booking.package?.title?.en || booking.package?.title || "Package";
              const statusColor = STATUS_COLORS[booking.status] || "#888";
              return (
                <div
                  key={booking._id}
                  style={{
                    background: "#1a1a1a", borderRadius: "16px", padding: "16px",
                    border: "1px solid #262626",
                  }}
                >
                  <div
                    style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "flex-start", marginBottom: "10px",
                    }}
                  >
                    <div style={{ flex: 1, marginRight: "10px" }}>
                      <div style={{ fontSize: "15px", fontWeight: 600, color: "#fff" }}>{title}</div>
                      <div style={{ fontSize: "11px", color: "#444", marginTop: "3px" }}>
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      style={{
                        background: statusColor + "22", color: statusColor,
                        padding: "4px 10px", borderRadius: "20px",
                        fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap",
                      }}
                    >
                      {booking.status?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <div>
                      <span style={{ color: "#555" }}>Ref: </span>
                      <span style={{ color: "#aaa", fontFamily: "monospace", fontSize: "12px" }}>
                        {booking.referenceNumber || booking.tx_ref || "—"}
                      </span>
                    </div>
                    <span style={{ color: "#10B981", fontWeight: 700 }}>
                      ETB {booking.totalPrice?.toLocaleString() || "—"}
                    </span>
                  </div>
                  {booking._btype === "package" && (
                    <div
                      style={{
                        marginTop: "8px", background: "#0d2b1e", display: "inline-block",
                        padding: "3px 10px", borderRadius: "6px", fontSize: "11px", color: "#10B981",
                      }}
                    >
                      Package
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TgNav active="/telegram/bookings" />
    </div>
  );
}
