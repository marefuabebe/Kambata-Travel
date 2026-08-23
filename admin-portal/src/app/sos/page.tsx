"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Siren,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Phone,
  User,
  Filter,
  ChevronDown,
  Loader2,
  Shield,
  Radio,
  Eye,
  MessageSquare,
  PlusSquare,
  Car,
  CloudLightning,
  Wrench,
} from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:5000";

const getApiBase = () =>
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api");

// Use the main API (not admin sub-path) since SOS is under /api/sos
const sosApi = axios.create({
  baseURL: `${getApiBase()}/sos`,
  withCredentials: true,
});

sosApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("adminToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  critical: { color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-200 dark:border-red-500/30", label: "Critical" },
  high:     { color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/10", border: "border-orange-200 dark:border-orange-500/30", label: "High" },
  medium:   { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/30", label: "Medium" },
  low:      { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/30", label: "Low" },
};

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  active:      { color: "text-red-500", icon: <Radio size={12} className="animate-pulse" />, label: "Active" },
  acknowledged:{ color: "text-amber-500", icon: <Eye size={12} />, label: "Acknowledged" },
  resolved:    { color: "text-emerald-500", icon: <CheckCircle2 size={12} />, label: "Resolved" },
  false_alarm: { color: "text-gray-400", icon: <XCircle size={12} />, label: "False Alarm" },
};

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  medical_emergency: { label: "Medical Emergency", icon: <PlusSquare size={14} /> },
  safety_threat:     { label: "Safety Threat", icon: <Shield size={14} /> },
  accident:          { label: "Accident / Injury", icon: <Car size={14} /> },
  natural_disaster:  { label: "Natural Disaster", icon: <CloudLightning size={14} /> },
  lost_traveler:     { label: "Lost Traveler", icon: <MapPin size={14} /> },
  vehicle_breakdown: { label: "Vehicle Breakdown", icon: <Wrench size={14} /> },
  harassment:        { label: "Harassment / Threat", icon: <AlertTriangle size={14} /> },
  other:             { label: "Other Emergency", icon: <Siren size={14} /> },
};

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`flex flex-col items-center px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl border ${color}`}>
      <span className="text-xl md:text-2xl font-black">{value}</span>
      <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest mt-0.5 opacity-70">{label}</span>
    </div>
  );
}

function AlertCard({
  alert,
  onStatusUpdate,
}: {
  alert: any;
  onStatusUpdate: (id: string, status: string, note: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [adminNote, setAdminNote] = useState(alert.adminNotes || "");
  const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium;
  const st = STATUS_CONFIG[alert.status] || STATUS_CONFIG.active;

  const handleUpdate = async (newStatus: string) => {
    setUpdating(true);
    try {
      await onStatusUpdate(alert._id, newStatus, adminNote);
    } finally {
      setUpdating(false);
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[1.5rem] border-2 ${sev.border} ${sev.bg} overflow-hidden transition-all`}
    >
      {/* Header row */}
      <div className="p-5 flex items-start gap-4">
        {/* Severity badge */}
        <div className={`mt-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${sev.color} bg-white/60 dark:bg-black/20 border ${sev.border} shrink-0`}>
          {sev.label}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
              {TYPE_CONFIG[alert.type] ? (
                <>
                  {TYPE_CONFIG[alert.type].icon}
                  {TYPE_CONFIG[alert.type].label}
                </>
              ) : (
                alert.type
              )}
            </span>
            <span className={`flex items-center gap-1 text-xs font-bold ${st.color}`}>
              {st.icon} {st.label}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
            <span className="flex items-center gap-1"><User size={11} /> {alert.submittedBy?.name || "Unknown User"}</span>
            <span className="flex items-center gap-1"><Clock size={11} /> {timeAgo(alert.createdAt)}</span>
            {alert.location?.address && (
              <span className="flex items-center gap-1"><MapPin size={11} /> {alert.location.address}</span>
            )}
          </div>
          {alert.description && (
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">{alert.description}</p>
          )}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 rounded-xl bg-white/60 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 transition-colors shrink-0 text-gray-600 dark:text-gray-300"
        >
          <ChevronDown size={16} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/40 dark:border-black/20"
          >
            <div className="p-5 space-y-4">
              {/* Contact info */}
              {(alert.submittedBy?.phone || alert.contactPhone) && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={14} className="text-gray-400" />
                  <span className="font-bold text-gray-900 dark:text-white">
                    {alert.submittedBy?.phone || alert.contactPhone}
                  </span>
                </div>
              )}

              {/* GPS coordinates */}
              {alert.location?.coordinates?.length === 2 && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={14} className="text-gray-400" />
                  <a
                    href={`https://maps.google.com/?q=${alert.location.coordinates[1]},${alert.location.coordinates[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-blue-600 dark:text-blue-400 underline"
                  >
                    {alert.location.coordinates[1].toFixed(5)}, {alert.location.coordinates[0].toFixed(5)} — Open in Maps
                  </a>
                </div>
              )}

              {/* Admin note input */}
              <div>
                <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">
                  Admin Response Note
                </label>
                <textarea
                  rows={2}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add a response note or action taken…"
                  className="w-full text-sm bg-white/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 resize-none focus:outline-none focus:border-gray-400 dark:focus:border-white/30 transition-colors text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              {/* Action buttons */}
              {alert.status !== "resolved" && alert.status !== "false_alarm" && (
                <div className="flex flex-wrap gap-2">
                  {alert.status === "active" && (
                    <button
                      onClick={() => handleUpdate("acknowledged")}
                      disabled={updating}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-black hover:bg-amber-600 disabled:opacity-50 transition-colors"
                    >
                      {updating ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />} Acknowledge
                    </button>
                  )}
                  <button
                    onClick={() => handleUpdate("resolved")}
                    disabled={updating}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-black hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                  >
                    {updating ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Mark Resolved
                  </button>
                  <button
                    onClick={() => handleUpdate("false_alarm")}
                    disabled={updating}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-400 text-white text-xs font-black hover:bg-gray-500 disabled:opacity-50 transition-colors"
                  >
                    {updating ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />} False Alarm
                  </button>
                </div>
              )}

              {alert.status === "resolved" && (
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Resolved {timeAgo(alert.updatedAt)}
                  {alert.adminNotes && ` — "${alert.adminNotes}"`}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AdminSOSPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const fetchAlerts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const params: Record<string, string> = { limit: "50" };
      if (statusFilter !== "all") params.status = statusFilter;
      if (severityFilter !== "all") params.severity = severityFilter;

      const { data } = await sosApi.get("/admin", { params });
      setAlerts(data.data || []);
    } catch (err) {
      console.error("Failed to load SOS alerts", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, severityFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchAlerts(true), 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleStatusUpdate = async (id: string, status: string, adminNotes: string) => {
    await sosApi.patch(`/admin/${id}`, { status, adminNote: adminNotes });
    setAlerts((prev) =>
      prev.map((a) => (a._id === id ? { ...a, status, adminNotes, updatedAt: new Date().toISOString() } : a))
    );
  };

  // Compute stats
  const stats = {
    total: alerts.length,
    active: alerts.filter((a) => a.status === "active").length,
    acknowledged: alerts.filter((a) => a.status === "acknowledged").length,
    resolved: alerts.filter((a) => a.status === "resolved").length,
    critical: alerts.filter((a) => a.severity === "critical").length,
  };

  const filtered = alerts.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (severityFilter !== "all" && a.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/25">
              <Siren size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">SOS Emergency Center</h1>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Real-time distress alert management</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => fetchAlerts(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/5 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shadow-sm hover:-translate-y-0.5 transition-all"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 md:gap-3">
        <StatPill label="Total" value={stats.total} color="bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-700 dark:text-white" />
        <StatPill label="Active" value={stats.active} color="bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400" />
        <StatPill label="Acknowledged" value={stats.acknowledged} color="bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400" />
        <StatPill label="Resolved" value={stats.resolved} color="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400" />
        <StatPill label="Critical" value={stats.critical} color="bg-red-100 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 col-span-2 sm:col-span-1" />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 p-5 bg-white dark:bg-[#1E293B] rounded-[1.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
          <Filter size={12} /> Filters
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", "active", "acknowledged", "resolved", "false_alarm"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
                statusFilter === s
                  ? "bg-[#1A331B] text-white"
                  : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
        <div className="w-px bg-gray-100 dark:bg-white/10 mx-1" />
        <div className="flex flex-wrap gap-2">
          {["all", "critical", "high", "medium", "low"].map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
                severityFilter === s
                  ? "bg-red-500 text-white"
                  : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Alert List ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 size={40} className="animate-spin text-red-500" />
          <p className="text-sm font-bold text-gray-400">Loading emergency alerts…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#1E293B] rounded-[2rem] border border-gray-100 dark:border-white/5">
          <div className="w-16 h-16 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-emerald-500" />
          </div>
          <h3 className="font-black text-gray-800 dark:text-white text-lg mb-1">All Clear</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {alerts.length === 0 ? "No SOS alerts have been reported." : "No alerts match the current filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
            Showing {filtered.length} alert{filtered.length !== 1 ? "s" : ""}
          </p>
          {filtered.map((alert) => (
            <AlertCard key={alert._id} alert={alert} onStatusUpdate={handleStatusUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
