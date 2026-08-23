"use client";

import React, { useEffect, useState } from "react";
import apiClient from "@/utils/apiClient";
import { PageHeader, LoadingCenter, EmptyState, StatusBadge } from "@/components/guide/ui";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Users, Calendar, CheckCircle2, ChevronRight, BookOpen } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function TourHistoryPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    apiClient
      .get("/guide-ops/history")
      .then((res) => setRows(res.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = rows.filter(
    (r) =>
      !q ||
      String(r.tourName).toLowerCase().includes(q.toLowerCase()) ||
      String(r.destination).toLowerCase().includes(q.toLowerCase())
  );

  if (loading) return <LoadingCenter />;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <PageHeader
          title={t("guidePages.history.title")}
          subtitle={t("guidePages.history.subtitle")}
        />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-4 mb-10 items-center bg-white dark:bg-[#161B26]/60 backdrop-blur-xl p-4 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm"
      >
        <div className="flex-1 min-w-[200px] flex items-center gap-3 px-4 py-3 bg-gray-50/50 dark:bg-[#0F172A]/50 rounded-2xl border border-gray-100 dark:border-white/5 focus-within:border-[#145A41] transition-colors">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text" 
            placeholder={t("guidePages.history.searchPlaceholder")} 
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-bold w-full text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>
      </motion.div>

      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <EmptyState title={t("guidePages.history.emptyTitle")} description={t("guidePages.history.emptyDesc")} />
        </motion.div>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-8 bottom-8 w-px bg-gray-200 dark:bg-gray-800 hidden md:block" />

          <div className="space-y-8 relative z-10">
            <AnimatePresence>
              {filtered.map((r, idx) => (
                <motion.div
                  key={r.scheduleId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex flex-col md:flex-row gap-6 md:gap-8 group"
                >
                  {/* Timeline Dot & Date */}
                  <div className="hidden md:flex flex-col items-center w-16 shrink-0 relative pt-2">
                    <div className="w-4 h-4 rounded-full bg-[#1A331B] border-4 border-white dark:border-[#0F172A] shadow-sm z-10 group-hover:scale-125 transition-transform" />
                    <p className="text-[10px] font-black uppercase text-gray-400 mt-4 rotate-180" style={{ writingMode: 'vertical-rl' }}>
                      {new Date(r.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Content Card */}
                  <div className="flex-1 bg-white dark:bg-[#161B26]/60 backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-6 md:p-8 shadow-sm hover:shadow-xl dark:shadow-none hover:bg-gray-50 dark:hover:bg-[#161B26] transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2 md:hidden">
                          <Calendar size={14} className="text-[#1A331B]" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#1A331B]">
                            {new Date(r.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <h3 className="font-black text-2xl text-gray-900 dark:text-white tracking-tight">{r.tourName}</h3>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-2">
                          <MapPin size={14} className="text-[#FF8C00]" />
                          {r.destination}
                        </p>
                      </div>
                      <StatusBadge status={t("guidePages.history.completed")} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-50 dark:bg-[#0F172A] rounded-2xl p-4 flex flex-col justify-center items-center shadow-inner border border-gray-100 dark:border-white/5">
                        <Users size={16} className="text-gray-400 mb-1" />
                        <span className="text-lg font-black text-gray-900 dark:text-white">{r.travelerCount}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t("guidePages.history.travelers")}</span>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-4 flex flex-col justify-center items-center shadow-inner border border-emerald-100 dark:border-emerald-500/20">
                        <CheckCircle2 size={16} className="text-emerald-500 mb-1" />
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{r.attendance?.present || 0}</span>
                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">{t("guidePages.history.present")}</span>
                      </div>
                      <div className="bg-red-50 dark:bg-red-500/10 rounded-2xl p-4 flex flex-col justify-center items-center shadow-inner border border-red-100 dark:border-red-500/20">
                        <span className="text-lg font-black text-red-600 dark:text-red-400">{r.attendance?.absent || 0}</span>
                        <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest mt-1">{t("guidePages.history.absent")}</span>
                      </div>
                      <div className="bg-amber-50 dark:bg-[#FF8C00]/10 rounded-2xl p-4 flex flex-col justify-center items-center shadow-inner border border-amber-100 dark:border-[#FF8C00]/20">
                        <span className="text-lg font-black text-amber-600 dark:text-[#FF8C00]">{r.attendance?.late || 0}</span>
                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mt-1">{t("guidePages.history.late")}</span>
                      </div>
                    </div>

                    {r.guideNotes ? (
                      <div className="bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl p-5 border border-blue-100 dark:border-blue-500/10">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2 flex items-center gap-1.5">
                          <BookOpen size={12} /> {t("guidePages.history.operationalNotes")}
                        </h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed">
                          "{r.guideNotes}"
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-600 pt-2 px-2">
                        <ChevronRight size={14} /> {t("guidePages.history.noNotes")}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
