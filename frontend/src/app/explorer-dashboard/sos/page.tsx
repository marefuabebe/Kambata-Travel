"use client";

import React, { useState, useEffect } from "react";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Phone,
  MapPin,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  Shield,
  Siren,
  RefreshCw,
  Activity,
  User,
  ChevronLeft,
  HeartPulse,
  ShieldAlert,
  Ambulance,
  CloudLightning,
  Map,
  LifeBuoy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

const ALERT_TYPES = [
  { value: "medical_emergency", label: "Medical Emergency", icon: <HeartPulse size={24} />, color: "text-red-600" },
  { value: "safety_threat", label: "Safety Threat", icon: <ShieldAlert size={24} />, color: "text-red-600" },
  { value: "accident", label: "Accident / Injury", icon: <Ambulance size={24} />, color: "text-red-600" },
  { value: "natural_disaster", label: "Natural Disaster", icon: <CloudLightning size={24} />, color: "text-orange-600" },
  { value: "lost_traveler", label: "Lost / Separated", icon: <Map size={24} />, color: "text-orange-600" },
  { value: "guide_no_show", label: "Guide Didn't Show Up", icon: <User size={24} />, color: "text-amber-600" },
  { value: "harassment", label: "Harassment / Threat", icon: <AlertTriangle size={24} />, color: "text-red-600" },
  { value: "other", label: "Other Emergency", icon: <LifeBuoy size={24} />, color: "text-gray-600" },
];

const SEVERITY_OPTS = [
  { value: "critical", label: "Critical — Life Threatening", color: "bg-red-500" },
  { value: "high", label: "High — Urgent Help Needed", color: "bg-orange-500" },
  { value: "medium", label: "Medium — Serious Issue", color: "bg-amber-500" },
  { value: "low", label: "Low — Needs Attention", color: "bg-blue-500" },
];

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: "Received", color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10", icon: <Clock size={14} /> },
  acknowledged: { label: "Acknowledged", color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10", icon: <Shield size={14} /> },
  in_progress: { label: "Being Handled", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10", icon: <Activity size={14} /> },
  resolved: { label: "Resolved", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10", icon: <CheckCircle2 size={14} /> },
  false_alarm: { label: "False Alarm", color: "text-gray-600 bg-gray-50 dark:bg-gray-500/10", icon: <XCircle size={14} /> },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] || STATUS_META.open;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${meta.color}`}>
      {meta.icon} {meta.label}
    </span>
  );
}

export default function ExplorerSOSPage() {
  const { t } = useLanguage();
  const router = useRouter();
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
    contactPhone: "",
  });

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

  useEffect(() => {
    fetchAlerts();
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
      toast.error(err?.response?.data?.message || "Could not submit alert");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ type: "", severity: "high", description: "", location: "", contactPhone: "" });
    setSubmitted(false);
  };

  return (
    <div className="max-w-3xl mx-auto pb-16 pt-4">
      
      {/* ── Mobile Back Button ── */}
      <div className="lg:hidden mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-xl text-gray-600 dark:text-gray-300 font-bold shadow-sm active:scale-95 transition-transform w-fit">
          <ChevronLeft size={18} />
          Back
        </button>
      </div>

      {/* Header */}
      <div className="mb-10 pt-2">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-[1.5rem] bg-red-500 flex items-center justify-center shadow-xl shadow-red-500/25 shrink-0">
            <Siren size={28} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-500 dark:text-red-400 mb-1">Emergency</p>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">{t("sos.title")}</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t("sos.subtitle")}</p>
          </div>
        </div>

        {/* Emergency hotline banner */}
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0">
            <Phone size={18} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="font-black text-red-700 dark:text-red-300 text-sm">{t("sos.hotline")}: +251 911 234 567</p>
            <p className="text-xs text-red-500 dark:text-red-400 font-medium">{t("sos.available247")}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-gray-100 dark:bg-[#1E293B] p-1.5 rounded-2xl">
        {[{ id: "submit", label: "Submit SOS", icon: <AlertTriangle size={16} /> }, { id: "history", label: "My Alerts", icon: <Clock size={16} /> }].map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id as any); if (t.id === "history") fetchAlerts(); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === t.id ? "bg-white dark:bg-[#0F172A] text-red-600 dark:text-red-400 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"}`}
          >
            {t.icon} {t.label}
            {t.id === "history" && alerts.filter(a => a.status === "open" || a.status === "in_progress").length > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                {alerts.filter(a => a.status === "open" || a.status === "in_progress").length}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── SUBMIT TAB ── */}
        {tab === "submit" && (
          <motion.div key="submit" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {submitted ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-[#1E293B] rounded-[2.5rem] border border-emerald-200 dark:border-emerald-500/30 shadow-2xl shadow-emerald-500/10 overflow-hidden"
              >
                <div className="bg-emerald-500 p-10 text-center">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={44} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2">SOS Alert Received!</h2>
                  <p className="text-emerald-100 text-sm font-medium">Our team has been notified and is responding now.</p>
                </div>
                <div className="p-8 space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                    <Phone size={18} className="text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-blue-700 dark:text-blue-300 text-sm">Expect a callback within 10 minutes</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">For critical emergencies: +251 911 234 567</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                    <Shield size={18} className="text-gray-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Stay in a safe location. Do not put yourself at further risk. You can track your alert status in "My Alerts".</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setTab("history")}
                      className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-2xl text-sm hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                    >
                      <Clock size={16} /> Track Alert
                    </button>
                    <button
                      onClick={resetForm}
                      className="flex items-center justify-center gap-2 bg-red-500 text-white font-bold py-3 rounded-2xl text-sm shadow-lg shadow-red-500/20 hover:-translate-y-0.5 transition-all"
                    >
                      <RefreshCw size={16} /> New Alert
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1E293B] rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl p-8 space-y-6">
                {/* Emergency Type */}
                <div>
                  <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Emergency Type *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALERT_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, type: t.value }))}
                        className={`flex items-center gap-2.5 p-3.5 rounded-2xl border-2 text-sm font-bold transition-all text-left ${form.type === t.value ? "border-red-500 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" : "border-gray-100 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20 text-gray-700 dark:text-gray-300"}`}
                      >
                        <span className="text-xl">{t.icon}</span>
                        <span className="leading-tight">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Severity *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SEVERITY_OPTS.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, severity: s.value }))}
                        className={`flex items-center gap-2.5 p-3 rounded-2xl border-2 text-xs font-bold transition-all text-left ${form.severity === s.value ? "border-red-500 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" : "border-gray-100 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20 text-gray-600 dark:text-gray-300"}`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.color}`} />
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Describe the Emergency *</label>
                  <textarea
                    rows={4}
                    placeholder="Describe what happened, how many people are affected, any injuries, and what immediate help is needed..."
                    value={form.description}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-red-400 dark:focus:border-red-500 transition-colors resize-none font-medium"
                    required
                  />
                </div>

                {/* Location & Phone — side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                      <MapPin size={10} className="inline mr-1" />Your Location
                    </label>
                    <input
                      type="text"
                      placeholder="E.g., Alaba Kulito Market, km 3"
                      value={form.location}
                      onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-red-400 dark:focus:border-red-500 transition-colors font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                      <Phone size={10} className="inline mr-1" />Contact Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="+251 9XX XXX XXXX"
                      value={form.contactPhone}
                      onChange={(e) => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-red-400 dark:focus:border-red-500 transition-colors font-medium"
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-3 bg-red-500 text-white font-black py-4.5 py-5 rounded-2xl text-base shadow-2xl shadow-red-500/30 hover:-translate-y-0.5 hover:shadow-3xl hover:shadow-red-500/40 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 size={20} className="animate-spin" /> : <Siren size={20} />}
                  {submitting ? "Sending SOS Alert…" : "Send Emergency SOS Alert"}
                </button>
                <p className="text-center text-xs text-gray-400 font-medium">
                  By submitting, our operations team will be notified immediately via app and email.
                </p>
              </form>
            )}
          </motion.div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === "history" && (
          <motion.div key="history" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-gray-900 dark:text-white text-lg">My SOS Alerts</h2>
              <button onClick={fetchAlerts} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                <RefreshCw size={16} className={loadingAlerts ? "animate-spin" : ""} />
              </button>
            </div>

            {loadingAlerts ? (
              <div className="h-40 flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-red-500" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="bg-white dark:bg-[#1E293B] rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm p-12 text-center">
                <Shield size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="font-black text-gray-700 dark:text-white text-lg mb-2">No Alerts Submitted</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">You haven't submitted any SOS alerts yet. Stay safe!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert, idx) => {
                  const typeInfo = ALERT_TYPES.find(t => t.value === alert.type);
                  return (
                    <motion.div
                      key={alert._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white dark:bg-[#1E293B] rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm p-6 space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl flex items-center justify-center w-8">{typeInfo?.icon || <Siren size={24} />}</span>
                          <div>
                            <p className="font-black text-gray-900 dark:text-white">{typeInfo?.label || alert.type}</p>
                            <p className="text-xs text-gray-400 font-medium">{new Date(alert.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <StatusBadge status={alert.status} />
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-white/5 p-3 rounded-xl">
                        {alert.description}
                      </p>

                      {alert.adminNote && (
                        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                          <User size={14} className="text-blue-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-0.5">Admin Note</p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">{alert.adminNote}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 pt-1">
                        {alert.location && (
                          <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                            <MapPin size={12} /> {alert.location}
                          </span>
                        )}
                        <span className={`text-xs font-black px-2 py-1 rounded-lg ${
                          alert.severity === "critical" ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                          : alert.severity === "high" ? "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400"
                          : alert.severity === "medium" ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                          : "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
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
