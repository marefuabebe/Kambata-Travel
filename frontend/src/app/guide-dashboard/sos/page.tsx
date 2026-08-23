"use client";

import React, { useState, useEffect } from "react";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Siren,
  Phone,
  MapPin,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Activity,
  RefreshCw,
  User,
  AlertTriangle,
  HeartPulse,
  ShieldAlert,
  Ambulance,
  CloudLightning,
  Map,
  AlertOctagon,
  LifeBuoy,
  AlertCircle,
  Info
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const getAlertTypes = (t: (key: string) => string) => [
  { value: "medical_emergency", label: t("guidePages.sos.typeMedical"), icon: <HeartPulse className="text-rose-500" size={24} /> },
  { value: "safety_threat", label: t("guidePages.sos.typeSafety"), icon: <ShieldAlert className="text-amber-500" size={24} /> },
  { value: "accident", label: t("guidePages.sos.typeAccident"), icon: <Ambulance className="text-red-500" size={24} /> },
  { value: "natural_disaster", label: t("guidePages.sos.typeDisaster"), icon: <CloudLightning className="text-cyan-500" size={24} /> },
  { value: "lost_traveler", label: t("guidePages.sos.typeLost"), icon: <Map className="text-blue-500" size={24} /> },
  { value: "vehicle_breakdown", label: t("guidePages.sos.typeVehicle"), icon: <AlertTriangle className="text-orange-500" size={24} /> },
  { value: "harassment", label: t("guidePages.sos.typeHarassment"), icon: <AlertOctagon className="text-fuchsia-500" size={24} /> },
  { value: "other", label: t("guidePages.sos.typeOther"), icon: <LifeBuoy className="text-emerald-500" size={24} /> },
];

const getSeverityOpts = (t: (key: string) => string) => [
  { value: "critical", label: t("guidePages.sos.severityCritical"), icon: <Siren size={18} className="text-red-500" /> },
  { value: "high", label: t("guidePages.sos.severityHigh"), icon: <AlertOctagon size={18} className="text-orange-500" /> },
  { value: "medium", label: t("guidePages.sos.severityMedium"), icon: <AlertCircle size={18} className="text-amber-500" /> },
  { value: "low", label: t("guidePages.sos.severityLow"), icon: <Info size={18} className="text-blue-500" /> },
];

const getStatusMeta = (t: (key: string) => string): Record<string, { label: string; color: string; icon: React.ReactNode }> => ({
  open: { label: t("guidePages.sos.statusReceived"), color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10", icon: <Clock size={14} /> },
  acknowledged: { label: t("guidePages.sos.statusAcknowledged"), color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10", icon: <Shield size={14} /> },
  in_progress: { label: t("guidePages.sos.statusBeingHandled"), color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10", icon: <Activity size={14} /> },
  resolved: { label: t("guidePages.sos.statusResolved"), color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10", icon: <CheckCircle2 size={14} /> },
  false_alarm: { label: t("guidePages.sos.statusFalseAlarm"), color: "text-gray-600 bg-gray-50 dark:bg-gray-500/10", icon: <XCircle size={14} /> },
});

function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  const STATUS_META = getStatusMeta(t);
  const meta = STATUS_META[status] || STATUS_META.open;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${meta.color}`}>
      {meta.icon} {meta.label}
    </span>
  );
}

export default function GuideSOSPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const ALERT_TYPES = getAlertTypes(t);
  const SEVERITY_OPTS = getSeverityOpts(t);
  const [tab, setTab] = useState<"submit" | "history">("submit");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    type: "",
    severity: "high",
    description: "",
    location: "",
    tourName: "",
    contactPhone: "",
  });

  const [tours, setTours] = useState<any[]>([]);

  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const { data } = await apiClient.get("/sos/mine");
      setAlerts(data.data || []);
    } catch {
      toast.error("Could not load your alerts");
    } finally {
      setLoadingAlerts(false);
    }
  };

  const fetchTours = async () => {
    try {
      const { data } = await apiClient.get("/tours");
      setTours(data.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => { 
    fetchAlerts(); 
    fetchTours(); 
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.type) { toast.error("Please select an emergency type"); return; }
    if (!form.description.trim()) { toast.error("Please describe the emergency"); return; }
    setSubmitting(true);
    try {
      await apiClient.post("/sos", form);
      setSubmitted(true);
      fetchAlerts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit SOS");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-16">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-[1.5rem] bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
            <Siren size={28} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Emergency SOS</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Report emergencies for yourself or your travelers.</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#161B26] border border-red-100 dark:border-red-500/20 shadow-sm rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
            <Phone size={18} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-[15px]">Operations Line: +251 911 234 567</p>
            <p className="text-xs text-red-500 dark:text-red-400 font-bold mt-0.5">Available 24/7 for life-threatening emergencies</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-gray-50 dark:bg-white/5 p-1.5 rounded-[20px]">
        {[{ id: "submit", label: "Submit SOS" }, { id: "history", label: "My Alerts" }].map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id as any); if (t.id === "history") fetchAlerts(); }}
            className={`flex-1 py-3 rounded-2xl text-[14px] font-bold transition-all ${tab === t.id ? "bg-white dark:bg-[#161B26] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "submit" && (
          <motion.div key="submit" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {submitted ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-[#161B26] rounded-[2.5rem] border border-emerald-200 dark:border-emerald-500/30 shadow-2xl overflow-hidden">
                <div className="bg-emerald-500 p-10 text-center">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={44} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2">Alert Received!</h2>
                  <p className="text-emerald-100 text-sm">The operations team has been notified. Help is coming.</p>
                </div>
                <div className="p-8 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setTab("history")} className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-2xl text-sm">
                      <Clock size={16} /> Track Status
                    </button>
                    <button onClick={() => { setForm({ type: "", severity: "high", description: "", location: "", tourName: "", contactPhone: "" }); setSubmitted(false); }}
                      className="flex items-center justify-center gap-2 bg-red-500 text-white font-bold py-3 rounded-2xl text-sm shadow-lg shadow-red-500/20">
                      <RefreshCw size={16} /> New Alert
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 pb-6">
                {/* Tour name */}
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-1">Tour Name (optional)</label>
                  <select
                    value={form.tourName} 
                    onChange={(e) => setForm(f => ({ ...f, tourName: e.target.value }))}
                    className="w-full bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 shadow-sm rounded-2xl px-4 py-4 text-[15px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors font-medium appearance-none"
                  >
                    <option value="" disabled>Select a tour (optional)</option>
                    {tours.map(t => (
                      <option key={t._id} value={t.title}>{t.title}</option>
                    ))}
                  </select>
                </div>

                {/* Emergency Type & Severity (Side-by-Side on Desktop) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Emergency Type */}
                  <div className="flex flex-col">
                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-1">Emergency Type *</label>
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      {ALERT_TYPES.map((t) => (
                        <button key={t.value} type="button" onClick={() => setForm(f => ({ ...f, type: t.value }))}
                          className={`flex items-center gap-2.5 p-3 rounded-2xl border-2 text-[13px] font-bold transition-all text-left bg-white dark:bg-[#0F172A] ${form.type === t.value ? "border-red-500 dark:border-red-500 bg-red-50/50 dark:bg-red-500/10 text-red-600 dark:text-red-400 shadow-sm" : "border-gray-100 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:border-gray-200 dark:hover:border-white/10"}`}>
                          <span className="text-lg shrink-0">{t.icon}</span>
                          <span className="leading-tight">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Severity */}
                  <div className="flex flex-col">
                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-1">Severity *</label>
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      {SEVERITY_OPTS.map((s) => (
                        <button key={s.value} type="button" onClick={() => setForm(f => ({ ...f, severity: s.value }))}
                          className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border-2 text-[13px] font-bold transition-all bg-white dark:bg-[#0F172A] ${form.severity === s.value ? "border-gray-900 dark:border-white shadow-md text-gray-900 dark:text-white" : "border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-white/10"}`}>
                          {s.icon}
                          <span>{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-1">Description *</label>
                  <textarea rows={4} placeholder="What happened? How many travelers affected? Any injuries? What do you need?"
                    value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 shadow-sm rounded-2xl px-4 py-4 text-[15px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors resize-none font-medium"
                    required />
                </div>

                {/* Location & Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-1">Location</label>
                    <input type="text" placeholder="Current location…"
                      value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                      className="w-full bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 shadow-sm rounded-2xl px-4 py-4 text-[15px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-1">Contact Phone</label>
                    <input type="tel" placeholder="+251 9XX XXX XXXX"
                      value={form.contactPhone} onChange={(e) => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                      className="w-full bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 shadow-sm rounded-2xl px-4 py-4 text-[15px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors font-medium" />
                  </div>
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full flex items-center justify-center gap-3 bg-red-500 text-white font-black py-5 rounded-2xl text-base shadow-2xl shadow-red-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-70">
                  {submitting ? <Loader2 size={20} className="animate-spin" /> : <Siren size={20} />}
                  {submitting ? "Sending SOS…" : "Send Emergency Alert"}
                </button>
              </form>
            )}
          </motion.div>
        )}

        {tab === "history" && (
          <motion.div key="history" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-gray-900 dark:text-white text-lg">My SOS Alerts</h2>
              <button onClick={fetchAlerts} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10 text-gray-500">
                <RefreshCw size={16} className={loadingAlerts ? "animate-spin" : ""} />
              </button>
            </div>
            {loadingAlerts ? (
              <div className="h-40 flex items-center justify-center"><Loader2 size={28} className="animate-spin text-red-500" /></div>
            ) : alerts.length === 0 ? (
              <div className="bg-white dark:bg-[#161B26] rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-12 text-center">
                <Shield size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="font-black text-gray-700 dark:text-white text-lg mb-2">No Alerts</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Stay safe out there, {user?.name?.split(" ")[0]}!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert, idx) => {
                  const typeInfo = ALERT_TYPES.find(t => t.value === alert.type);
                  return (
                    <motion.div key={alert._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                      className="bg-white dark:bg-[#161B26] rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm p-6 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl flex items-center justify-center w-8">{typeInfo?.icon || <Siren size={24} />}</span>
                          <div>
                            <p className="font-black text-gray-900 dark:text-white">{typeInfo?.label || alert.type}</p>
                            <p className="text-xs text-gray-400">{new Date(alert.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <StatusBadge status={alert.status} t={t} />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 p-3 rounded-xl">{alert.description}</p>
                      {alert.adminNote && (
                        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                          <User size={14} className="text-blue-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">{alert.adminNote}</p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
