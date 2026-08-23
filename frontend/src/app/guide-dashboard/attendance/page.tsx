"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/utils/apiClient";
import { PageHeader, LoadingCenter, EmptyState } from "@/components/guide/ui";
import { downloadCsv } from "@/utils/dashboardHelpers";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Clock, Download, Users, QrCode, Lock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function AttendancePage() {
  const { t } = useLanguage();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selected, setSelected] = useState("");
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/guide-ops/assignments").then((res) => {
      const active = (res.data.data || []).filter(
        (a: any) => a.rawStatus !== "completed" && a.rawStatus !== "cancelled"
      );
      setAssignments(active);
      if (active[0]) setSelected(`${active[0].tourId}:${active[0].scheduleId}`);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    const [tourId, scheduleId] = selected.split(":");
    apiClient.get(`/guide-ops/assignments/${tourId}/${scheduleId}`).then((res) => {
      setRoster(res.data.data.travelers || []);
    });
  }, [selected]);

  const setAll = async (status: string) => {
    const updates = roster.map((t) => ({ bookingId: t.bookingId, status }));
    await apiClient.patch("/guide-ops/attendance/bulk", { updates });
    toast.success("Attendance saved");
    const [tourId, scheduleId] = selected.split(":");
    const { data } = await apiClient.get(`/guide-ops/assignments/${tourId}/${scheduleId}`);
    setRoster(data.data.travelers);
  };

  const saveOne = async (bookingId: string, status: string) => {
    await apiClient.patch("/guide-ops/attendance/bulk", {
      updates: [{ bookingId, status }],
    });
    setRoster((prev) =>
      prev.map((t) => (t.bookingId === bookingId ? { ...t, attendanceStatus: status } : t))
    );
  };

  const summary = {
    total: roster.reduce((sum, t) => sum + (t.partySize || 1), 0),
    present: roster.filter((t) => t.attendanceStatus === "present").reduce((sum, t) => sum + (t.partySize || 1), 0),
    absent: roster.filter((t) => t.attendanceStatus === "absent").reduce((sum, t) => sum + (t.partySize || 1), 0),
    late: roster.filter((t) => t.attendanceStatus === "late").reduce((sum, t) => sum + (t.partySize || 1), 0),
  };

  const currentAssignment = assignments.find((a) => `${a.tourId}:${a.scheduleId}` === selected);
  const isLocked = currentAssignment?.isLocked || false;

  if (loading) return <LoadingCenter />;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <PageHeader
          title={t("guidePages.attendance.title")}
          subtitle={t("guidePages.attendance.subtitle")}
        />
      </motion.div>

      {assignments.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <EmptyState title={t("guidePages.attendance.emptyTitle")} description={t("guidePages.attendance.emptyDesc")} />
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
          <div className="bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl p-4 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm mb-8 flex items-center focus-within:border-[#145A41] transition-colors">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-gray-900 dark:text-white font-black text-sm px-4 py-2 cursor-pointer"
            >
              {assignments.map((a) => (
                <option key={a.scheduleId} value={`${a.tourId}:${a.scheduleId}`} className="text-gray-900">
                  {a.tourName} — {new Date(a.date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-white/5 p-6 text-center shadow-sm">
              <div className="w-10 h-10 mx-auto bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-500 mb-3">
                <Users size={18} />
              </div>
              <p className="text-3xl font-black text-gray-900 dark:text-white">{summary.total}</p>
              <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">{t("guidePages.attendance.total")}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-3xl border border-emerald-100 dark:border-emerald-500/20 p-6 text-center shadow-sm">
              <div className="w-10 h-10 mx-auto bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-600 mb-3">
                <CheckCircle2 size={18} />
              </div>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{summary.present}</p>
              <p className="text-[10px] font-black text-emerald-500 mt-1 uppercase tracking-widest">{t("guidePages.attendance.present")}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-500/10 rounded-3xl border border-red-100 dark:border-red-500/20 p-6 text-center shadow-sm">
              <div className="w-10 h-10 mx-auto bg-red-100 dark:bg-red-500/20 rounded-xl flex items-center justify-center text-red-600 mb-3">
                <XCircle size={18} />
              </div>
              <p className="text-3xl font-black text-red-600 dark:text-red-400">{summary.absent}</p>
              <p className="text-[10px] font-black text-red-500 mt-1 uppercase tracking-widest">{t("guidePages.attendance.absent")}</p>
            </div>
            <div className="bg-amber-50 dark:bg-[#FF8C00]/10 rounded-3xl border border-amber-100 dark:border-[#FF8C00]/20 p-6 text-center shadow-sm">
              <div className="w-10 h-10 mx-auto bg-amber-100 dark:bg-[#FF8C00]/20 rounded-xl flex items-center justify-center text-amber-600 dark:text-[#FF8C00] mb-3">
                <Clock size={18} />
              </div>
              <p className="text-3xl font-black text-amber-600 dark:text-[#FF8C00]">{summary.late}</p>
              <p className="text-[10px] font-black text-amber-500 mt-1 uppercase tracking-widest">{t("guidePages.attendance.late")}</p>
            </div>
          </div>

          {isLocked && (
            <div className="bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 p-4 rounded-2xl flex items-center gap-3 mb-6 shadow-sm">
              <Lock size={20} className="text-slate-500" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                This schedule is locked. Attendance can no longer be modified.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 mb-6">
            {!isLocked && (
              <button
                type="button"
                onClick={() => setAll("present")}
                className="flex items-center gap-2 text-sm font-bold px-6 py-3.5 rounded-2xl bg-[#1A331B] text-white shadow-lg shadow-[#1A331B]/20 hover:-translate-y-0.5 transition-all"
              >
                <CheckCircle2 size={16} />
                {t("guidePages.attendance.markAllPresent")}
              </button>
            )}
            {!isLocked && (
              <Link
                href="/guide-dashboard/scanner"
                className="flex items-center gap-2 text-sm font-bold px-6 py-3.5 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 transition-all"
              >
                <QrCode size={16} />
                {t("guidePages.attendance.openScanner")}
              </Link>
            )}
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  "attendance.csv",
                  roster.map((traveler) => ({
                    name: traveler.fullName,
                    status: traveler.attendanceStatus,
                    ref: traveler.referenceNumber,
                  }))
                )
              }
              className="flex items-center gap-2 text-sm font-bold px-6 py-3.5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <Download size={16} />
              {t("guidePages.attendance.exportReport")}
            </button>
          </div>

          <div className="bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              <AnimatePresence>
                {roster.map((traveler, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={traveler.bookingId} 
                    className="p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                  >
                    <div>
                      <span className="font-black text-gray-900 dark:text-white text-lg block mb-1">{traveler.fullName}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">REF: {traveler.referenceNumber}</span>
                    </div>
                    
                    {!isLocked && (
                      <div className="flex bg-gray-50 dark:bg-[#0F172A] rounded-xl p-1.5 shadow-inner border border-gray-100 dark:border-white/5 w-full sm:w-auto">
                        {(["present", "absent", "late"] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => saveOne(traveler.bookingId, s)}
                            className={`flex-1 sm:flex-none text-[10px] font-black uppercase px-4 py-2.5 rounded-lg transition-all ${
                              traveler.attendanceStatus === s
                                ? s === 'present' ? "bg-emerald-500 text-white shadow-md"
                                  : s === 'absent' ? "bg-red-500 text-white shadow-md"
                                  : "bg-[#FF8C00] text-white shadow-md"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"
                            }`}
                          >
                            {s === "present" ? t("guidePages.attendance.presentBtn") : s === "absent" ? t("guidePages.attendance.absentBtn") : t("guidePages.attendance.lateBtn")}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

