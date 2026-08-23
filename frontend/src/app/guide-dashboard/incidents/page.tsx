"use client";

import React, { useEffect, useState } from "react";
import apiClient from "@/utils/apiClient";
import { PageHeader, LoadingCenter, StatusBadge, EmptyState } from "@/components/guide/ui";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Send, ShieldAlert, FileText, MapPin } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const TYPES = [
  { value: "weather_delay", label: "Weather Delay" },
  { value: "vehicle_issue", label: "Vehicle Issue" },
  { value: "traveler_emergency", label: "Traveler Emergency" },
  { value: "safety_issue", label: "Safety Issue" },
  { value: "schedule_delay", label: "Schedule Delay" },
  { value: "other", label: "Other" },
];

export default function IncidentsPage() {
  const { t } = useLanguage();
  const [list, setList] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    tourId: "",
    scheduleId: "",
    title: "",
    description: "",
    type: "other",
    severity: "medium",
    location: "",
  });

  useEffect(() => {
    Promise.all([
      apiClient.get("/guide-ops/incidents"),
      apiClient.get("/guide-ops/assignments"),
    ]).then(([inc, asn]) => {
      setList(inc.data.data || []);
      const active = (asn.data.data || []).filter((a: any) => a.rawStatus !== "cancelled");
      setAssignments(active);
      if (active[0]) {
        setForm((f) => ({
          ...f,
          tourId: active[0].tourId,
          scheduleId: active[0].scheduleId,
        }));
      }
      setLoading(false);
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/guide-ops/incidents", form);
      toast.success("Incident reported — admin notified");
      const { data } = await apiClient.get("/guide-ops/incidents");
      setList(data.data);
      setForm((f) => ({ ...f, title: "", description: "" }));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit");
    }
  };

  if (loading) return <LoadingCenter />;

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <PageHeader
          title={t("guidePages.incidents.title")}
          subtitle={t("guidePages.incidents.subtitle")}
        />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          onSubmit={submit} 
          className="bg-white dark:bg-[#0A0F1C] backdrop-blur-xl rounded-[3rem] border border-gray-100 dark:border-white/5 p-8 md:p-10 shadow-sm relative overflow-hidden md:sticky md:top-8 lg:top-10"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF8C00] opacity-5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <h3 className="font-black text-sm uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-8 flex items-center gap-2">
            <ShieldAlert size={16} className="text-[#FF8C00]" /> {t("guidePages.incidents.newReport")}
          </h3>
          
          <div className="space-y-6 relative z-10">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 pl-2">{t("guidePages.incidents.associatedTour")}</label>
              <div className="relative focus-within:ring-2 focus-within:ring-[#145A41]/20 rounded-2xl transition-all">
                <select
                  required
                  value={`${form.tourId}:${form.scheduleId}`}
                  onChange={(e) => {
                    const [tourId, scheduleId] = e.target.value.split(":");
                    setForm((f) => ({ ...f, tourId, scheduleId }));
                  }}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-[#0F172A] rounded-2xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white outline-none appearance-none"
                >
                  {assignments.map((a) => (
                    <option key={a.scheduleId} value={`${a.tourId}:${a.scheduleId}`}>
                      {a.tourName} — {new Date(a.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 pl-2">{t("guidePages.incidents.incidentTitle")}</label>
              <input
                required
                placeholder={t("guidePages.incidents.titlePlaceholder")}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-[#0F172A] rounded-2xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-[#145A41] transition-colors placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 pl-2">{t("guidePages.incidents.description")}</label>
              <textarea
                required
                placeholder={t("guidePages.incidents.descPlaceholder")}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-[#0F172A] rounded-2xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white min-h-[120px] outline-none focus:border-[#145A41] transition-colors resize-none placeholder-gray-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 pl-2">{t("guidePages.incidents.incidentType")}</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-[#0F172A] rounded-2xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white outline-none appearance-none"
                >
                  {TYPES.map((typeOpt) => (
                    <option key={typeOpt.value} value={typeOpt.value}>
                      {typeOpt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 pl-2">{t("guidePages.incidents.severityLevel")}</label>
                <select
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-[#0F172A] rounded-2xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white outline-none appearance-none"
                >
                  <option value="low">Low - Minor disruption</option>
                  <option value="medium">Medium - Noticeable impact</option>
                  <option value="high">High - Major disruption</option>
                  <option value="critical">Critical - Immediate action required</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 pl-2">{t("guidePages.incidents.locationOptional")}</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  placeholder={t("guidePages.incidents.locationPlaceholder")}
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full pl-12 pr-5 py-4 bg-gray-50 dark:bg-[#0F172A] rounded-2xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-[#145A41] transition-colors placeholder-gray-400"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button type="submit" className="flex items-center gap-2 bg-[#1A331B] text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-[#1A331B]/20 hover:-translate-y-0.5 transition-all">
                <Send size={16} /> {t("guidePages.incidents.submit")}
              </button>
            </div>
          </div>
        </motion.form>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="space-y-6">
          <h3 className="font-black text-sm uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-2">
            <FileText size={16} /> {t("guidePages.incidents.yourReports")}
          </h3>
          
          {list.length === 0 ? (
            <EmptyState title={t("guidePages.incidents.emptyTitle")} description={t("guidePages.incidents.emptyDesc")} />
          ) : (
            <div className="grid gap-4 max-h-[700px] overflow-y-auto pr-2">
              <AnimatePresence>
                {list.map((i, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={i._id} 
                    className="bg-white dark:bg-[#0A0F1C] backdrop-blur-xl rounded-[2rem] border border-gray-100 dark:border-white/5 p-6 shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-black text-gray-900 dark:text-white text-lg group-hover:text-[#FF8C00] transition-colors">{i.title}</p>
                          <StatusBadge status={i.status} />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{i.description}</p>
                        
                        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
                          <span className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500">
                            {i.type?.replace(/_/g, " ")}
                          </span>
                          <span className={`px-3 py-1.5 rounded-lg ${
                            i.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' :
                            i.severity === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400' :
                            i.severity === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-[#FF8C00]/10 dark:text-[#FF8C00]' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                          }`}>
                            Severity: {i.severity}
                          </span>
                          {i.location && (
                            <span className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 flex items-center gap-1">
                              <MapPin size={10} /> {i.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
