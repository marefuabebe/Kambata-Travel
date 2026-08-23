"use client";

import React, { useState, useEffect, useCallback } from "react";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Siren,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  Shield,
  Phone,
  MapPin,
  User,
  Filter,
  RefreshCw,
  Loader2,
  AlertTriangle,
  ChevronDown,
  Send,
  PlusSquare,
  Car,
  CloudLightning,
  UserX,
  Wrench,
} from "lucide-react";

const ALERT_TYPES: Record<string, { label: string; icon: React.ReactNode }> = {
  medical_emergency: { label: "Medical Emergency", icon: <PlusSquare size={24} /> },
  safety_threat: { label: "Safety Threat", icon: <Shield size={24} /> },
  accident: { label: "Accident / Injury", icon: <Car size={24} /> },
  natural_disaster: { label: "Natural Disaster", icon: <CloudLightning size={24} /> },
  lost_traveler: { label: "Lost Traveler", icon: <MapPin size={24} /> },
  guide_no_show: { label: "Guide No-Show", icon: <UserX size={24} /> },
  vehicle_breakdown: { label: "Vehicle Breakdown", icon: <Wrench size={24} /> },
  harassment: { label: "Harassment / Threat", icon: <AlertTriangle size={24} /> },
  other: { label: "Other Emergency", icon: <Siren size={24} /> },
};

const STATUS_META: Record<string, { label: string; colorClass: string; dot: string }> = {
  open: { label: "Open", colorClass: "text-red-600 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30", dot: "bg-red-500 animate-pulse" },
  acknowledged: { label: "Acknowledged", colorClass: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30", dot: "bg-blue-500" },
  in_progress: { label: "In Progress", colorClass: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30", dot: "bg-indigo-500 animate-pulse" },
  resolved: { label: "Resolved", colorClass: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30", dot: "bg-emerald-500" },
  false_alarm: { label: "False Alarm", colorClass: "text-gray-600 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-white/10", dot: "bg-gray-400" },
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "text-red-600 bg-red-100 dark:bg-red-500/20 dark:text-red-400",
  high: "text-orange-600 bg-orange-100 dark:bg-orange-500/20 dark:text-orange-400",
  medium: "text-amber-600 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400",
  low: "text-blue-600 bg-blue-100 dark:bg-blue-500/20 dark:text-blue-400",
};

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className={`bg-white dark:bg-[#161B26] rounded-3xl border ${color} p-6 shadow-sm`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-current/10" style={{ color: "inherit" }}>
          {icon}
        </div>
        <span className="text-xs font-black uppercase tracking-widest text-current opacity-70">{label}</span>
      </div>
      <p className="text-4xl font-black text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function AlertCard({ alert, onUpdate }: { alert: any; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState("");
  const [adminNote, setAdminNote] = useState(alert.adminNote || "");
  const [saving, setSaving] = useState(false);
  const typeInfo = ALERT_TYPES[alert.type] || { label: alert.type, icon: <Siren size={24} /> };
  const statusMeta = STATUS_META[alert.status] || STATUS_META.open;

  const updateStatus = async (status: string) => {
    setUpdatingStatus(status);
    try {
      await apiClient.patch(`/sos/admin/${alert._id}`, { status, adminNote });
      toast.success(`Alert marked as ${status}`);
      onUpdate();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Update failed");
    } finally {
      setUpdatingStatus("");
    }
  };

  const saveNote = async () => {
    setSaving(true);
    try {
      await apiClient.patch(`/sos/admin/${alert._id}`, { status: alert.status, adminNote });
      toast.success("Note saved");
      onUpdate();
    } catch {
      toast.error("Could not save note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      layout
      className={`bg-white dark:bg-[#161B26] rounded-[2rem] border shadow-sm overflow-hidden transition-all ${
        alert.severity === "critical" || alert.status === "open"
          ? "border-red-200 dark:border-red-500/20"
          : "border-gray-100 dark:border-white/5"
      }`}
    >
      {/* Card Header */}
      <div
        className="p-6 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4">
          <div className="text-3xl shrink-0">{typeInfo.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className="font-black text-gray-900 dark:text-white">{typeInfo.label}</span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${SEVERITY_COLORS[alert.severity]}`}>
                {alert.severity}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusMeta.colorClass}`}>
                <span className={`w-2 h-2 rounded-full ${statusMeta.dot}`} />
                {statusMeta.label}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium line-clamp-2">{alert.description}</p>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {alert.submittedBy && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <User size={12} />
                  <span className="font-bold">{alert.submittedBy.name}</span>
                  <span className="text-gray-400">({alert.role})</span>
                </span>
              )}
              {alert.location && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin size={12} /> {alert.location}
                </span>
              )}
              <span className="text-xs text-gray-400">{new Date(alert.createdAt).toLocaleString()}</span>
            </div>
          </div>
          <ChevronDown size={18} className={`text-gray-400 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Expanded Panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-5 border-t border-gray-100 dark:border-white/5 pt-5">
              {/* Full details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {alert.submittedBy?.phone && (
                  <div className="bg-gray-50 dark:bg-[#0F172A] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Account Phone</p>
                    <a href={`tel:${alert.submittedBy.phone}`} className="font-bold text-blue-600 dark:text-blue-400 text-sm flex items-center gap-1.5">
                      <Phone size={14} /> {alert.submittedBy.phone}
                    </a>
                  </div>
                )}
                {alert.contactPhone && (
                  <div className="bg-red-50 dark:bg-red-500/10 rounded-2xl p-4 border border-red-100 dark:border-red-500/20">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Emergency Contact</p>
                    <a href={`tel:${alert.contactPhone}`} className="font-bold text-red-600 dark:text-red-400 text-sm flex items-center gap-1.5">
                      <Phone size={14} /> {alert.contactPhone}
                    </a>
                  </div>
                )}
                {alert.tourName && (
                  <div className="bg-gray-50 dark:bg-[#0F172A] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tour</p>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{alert.tourName}</p>
                  </div>
                )}
              </div>

              {/* Full description */}
              <div className="bg-gray-50 dark:bg-[#0F172A] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Description</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{alert.description}</p>
              </div>

              {/* Admin Note */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Admin Note (sent to submitter)</label>
                <div className="flex gap-3">
                  <textarea
                    rows={2}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Add a note for the traveler / guide…"
                    className="flex-1 bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#1A331B] dark:focus:border-emerald-500 transition-colors resize-none font-medium"
                  />
                  <button onClick={saveNote} disabled={saving}
                    className="w-12 h-auto min-h-[4rem] flex items-center justify-center rounded-2xl bg-[#1A331B] text-white shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>

              {/* Status Actions */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Change Status</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { status: "acknowledged", label: "Acknowledge", color: "bg-blue-500 hover:bg-blue-600" },
                    { status: "in_progress", label: "In Progress", color: "bg-indigo-500 hover:bg-indigo-600" },
                    { status: "resolved", label: "Resolve", color: "bg-emerald-500 hover:bg-emerald-600" },
                    { status: "false_alarm", label: "False Alarm", color: "bg-gray-500 hover:bg-gray-600" },
                  ].map((action) => (
                    <button
                      key={action.status}
                      onClick={() => updateStatus(action.status)}
                      disabled={updatingStatus !== "" || alert.status === action.status}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-black transition-all ${action.color} disabled:opacity-50 hover:-translate-y-0.5 shadow-sm`}
                    >
                      {updatingStatus === action.status ? <Loader2 size={12} className="animate-spin" /> : null}
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>

              {alert.resolvedAt && (
                <p className="text-xs text-gray-400 font-medium">
                  Resolved at: {new Date(alert.resolvedAt).toLocaleString()}
                  {alert.resolvedBy?.name ? ` by ${alert.resolvedBy.name}` : ""}
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
  const [stats, setStats] = useState({ open: 0, critical: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", severity: "", role: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.severity) params.set("severity", filters.severity);
      if (filters.role) params.set("role", filters.role);

      const [alertRes, statsRes] = await Promise.all([
        apiClient.get(`/sos/admin?${params}`),
        apiClient.get("/sos/admin/stats"),
      ]);
      setAlerts(alertRes.data.data || []);
      setStats(statsRes.data.data || {});
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not load SOS data");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-[1.5rem] bg-red-500 flex items-center justify-center shadow-xl shadow-red-500/25">
            <Siren size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">SOS Emergency Center</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monitor and respond to traveler & guide emergencies.</p>
          </div>
        </div>
        <button onClick={fetchData} className="w-11 h-11 rounded-2xl bg-white dark:bg-[#161B26] border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-500 hover:text-[#1A331B] dark:hover:text-emerald-400 shadow-sm transition-colors">
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-red-500 rounded-3xl p-6 shadow-xl shadow-red-500/20 text-white">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="opacity-80" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Open</span>
          </div>
          <p className="text-4xl font-black">{stats.open}</p>
        </div>
        <div className="bg-white dark:bg-[#161B26] rounded-3xl border border-red-100 dark:border-red-500/20 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Critical</span>
          </div>
          <p className="text-4xl font-black text-gray-900 dark:text-white">{stats.critical}</p>
        </div>
        <div className="bg-white dark:bg-[#161B26] rounded-3xl border border-indigo-100 dark:border-indigo-500/20 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={16} className="text-indigo-500" />
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">In Progress</span>
          </div>
          <p className="text-4xl font-black text-gray-900 dark:text-white">{stats.inProgress}</p>
        </div>
        <div className="bg-white dark:bg-[#161B26] rounded-3xl border border-emerald-100 dark:border-emerald-500/20 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Resolved</span>
          </div>
          <p className="text-4xl font-black text-gray-900 dark:text-white">{stats.resolved}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { key: "status", label: "Status", options: ["open", "acknowledged", "in_progress", "resolved", "false_alarm"] },
          { key: "severity", label: "Severity", options: ["critical", "high", "medium", "low"] },
          { key: "role", label: "Role", options: ["traveler", "guide"] },
        ].map((f) => (
          <select
            key={f.key}
            value={filters[f.key as keyof typeof filters]}
            onChange={(e) => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
            className="bg-white dark:bg-[#161B26] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#1A331B] dark:focus:border-emerald-500 transition-colors cursor-pointer"
          >
            <option value="">All {f.label}s</option>
            {f.options.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
        ))}
        {(filters.status || filters.severity || filters.role) && (
          <button onClick={() => setFilters({ status: "", severity: "", role: "" })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gray-100 dark:bg-white/10 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <XCircle size={14} /> Clear Filters
          </button>
        )}
      </div>

      {/* Alert List */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={32} className="animate-spin text-red-500" />
            <p className="text-sm font-bold text-gray-500">Loading SOS alerts…</p>
          </div>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white dark:bg-[#161B26] rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm p-16 text-center">
          <Shield size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="font-black text-gray-700 dark:text-white text-xl mb-2">All Clear</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">No SOS alerts match the current filters. Travelers and guides are safe!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <AlertCard key={alert._id} alert={alert} onUpdate={fetchData} />
          ))}
        </div>
      )}
    </div>
  );
}
