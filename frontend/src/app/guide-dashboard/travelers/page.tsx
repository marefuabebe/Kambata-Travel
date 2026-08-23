"use client";

import React, { useEffect, useState } from "react";
import apiClient from "@/utils/apiClient";
import { PageHeader, LoadingCenter, EmptyState, ContactActions, StatusBadge } from "@/components/guide/ui";
import Link from "next/link";
import { downloadCsv } from "@/utils/dashboardHelpers";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Download, ShieldAlert, Navigation, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function TravelersPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [travelers, setTravelers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState<string | null>(null);
  const [tourFilter, setTourFilter] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tourFilter) params.set("tourId", tourFilter);
      if (attendanceFilter) params.set("attendance", attendanceFilter);
      const { data } = await apiClient.get(`/guide-ops/travelers?${params}`);
      setTravelers(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const exportCsv = () => {
    downloadCsv(
      "travelers-roster.csv",
      travelers.map((t) => ({
        name: t.fullName,
        email: t.email,
        phone: t.phone || "",
        reference: t.referenceNumber,
        party: t.partySize,
        attendance: t.attendanceStatus,
        tour: t.tourName,
      }))
    );
  };

  const handleMessageClick = async (userId: string) => {
    if (!userId) {
      toast.error("User ID not found for this traveler.");
      return;
    }
    
    setStartingChat(userId);
    try {
      const { data } = await apiClient.post("/messages/direct", { userId });
      if (data.success && data.data?._id) {
        router.push(`/guide-dashboard/messages?roomId=${data.data._id}`);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to start chat with this traveler");
    } finally {
      setStartingChat(null);
    }
  };

  if (loading) return <LoadingCenter />;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <PageHeader
          title={t("guidePages.travelers.title")}
          subtitle={t("guidePages.travelers.subtitle")}
          action={
            <button
              type="button"
              onClick={exportCsv}
              disabled={!travelers.length}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm bg-[#FF8C00] hover:bg-[#e67e00] shadow-lg shadow-[#FF8C00]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 shrink-0 whitespace-nowrap"
            >
              <Download size={18} />
              {t("guidePages.travelers.exportCsv")}
            </button>
          }
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
            placeholder={t("guidePages.travelers.searchPlaceholder")} 
            className="bg-transparent border-none outline-none text-sm font-bold w-full text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>
        <div className="relative">
          <select
            value={attendanceFilter}
            onChange={(e) => setAttendanceFilter(e.target.value)}
            className="px-4 pr-10 py-3 bg-gray-50/50 dark:bg-[#0F172A]/50 rounded-2xl border border-gray-100 dark:border-white/5 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-[#145A41] transition-colors appearance-none"
          >
            <option value="">{t("guidePages.travelers.allAttendance")}</option>
            <option value="pending">{t("guidePages.travelers.pending")}</option>
            <option value="present">{t("guidePages.travelers.present")}</option>
            <option value="absent">{t("guidePages.travelers.absent")}</option>
            <option value="late">{t("guidePages.travelers.late")}</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          className="px-6 py-3 bg-[#1A331B] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#1A331B]/20 hover:-translate-y-0.5 transition-all"
        >
          {t("guidePages.travelers.applyFilters")}
        </button>
      </motion.div>

      {travelers.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <EmptyState
            title={t("guidePages.travelers.emptyTitle")}
            description={t("guidePages.travelers.emptyDesc")}
          />
        </motion.div>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence>
            {travelers.map((t, idx) => (
              <motion.div
                key={t.bookingId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group bg-white dark:bg-[#161B26]/60 backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 justify-between shadow-sm hover:shadow-2xl dark:shadow-none hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all relative overflow-hidden"
              >
                {/* Subtle Background Glow based on Status */}
                <div className={`absolute top-0 right-0 w-64 h-64 opacity-[0.03] dark:opacity-10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none transition-colors ${
                  t.attendanceStatus === 'present' ? 'bg-emerald-500' : 
                  t.attendanceStatus === 'absent' ? 'bg-red-500' : 
                  'bg-[#FF8C00]'
                }`} />

                {/* Left Status Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${
                  t.attendanceStatus === 'present' ? 'bg-emerald-500' : 
                  t.attendanceStatus === 'absent' ? 'bg-red-500' : 
                  'bg-[#FF8C00]'
                }`} />

                <div className="pl-4 flex-1">
                  <div className="flex items-center gap-4 mb-5">
                    {/* Avatar Placeholder */}
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-[#0F172A] flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-inner shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                      <span className="text-xl font-black text-gray-400 dark:text-gray-500 uppercase">
                        {t.fullName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight group-hover:text-[#145A41] dark:group-hover:text-emerald-400 transition-colors">
                        {t.fullName}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
                        <Navigation size={14} className="text-[#FF8C00]" />
                        {t.tourName}
                      </div>
                    </div>
                    <div className="ml-auto md:hidden relative z-10">
                      <StatusBadge status={t.attendanceStatus} />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-gray-50 dark:bg-[#0F172A] border border-gray-100 dark:border-white/5 px-4 py-2.5 rounded-2xl flex flex-col justify-center transition-colors group-hover:border-gray-200 dark:group-hover:border-white/10">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Booking Ref</span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{t.referenceNumber}</span>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#0F172A] border border-gray-100 dark:border-white/5 px-4 py-2.5 rounded-2xl flex flex-col justify-center transition-colors group-hover:border-gray-200 dark:group-hover:border-white/10">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Party Size</span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{t.partySize} Guest{t.partySize > 1 ? 's' : ''}</span>
                    </div>
                    <div className="hidden md:block relative z-10">
                      <StatusBadge status={t.attendanceStatus} />
                    </div>
                  </div>

                  {t.emergencyContact?.name && (
                    <div className="mt-5 flex items-center gap-3 p-3 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-100 dark:border-red-500/20 w-fit">
                      <div className="p-2 bg-white dark:bg-red-500/20 rounded-xl shadow-sm">
                        <ShieldAlert size={14} className="text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-0.5">Emergency Contact</p>
                        <p className="text-xs text-red-700 dark:text-red-300 font-bold">
                          {t.emergencyContact.name} <span className="opacity-50 mx-1">•</span> {t.emergencyContact.phone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-4 items-start md:items-end justify-center border-t md:border-t-0 md:border-l border-gray-100 dark:border-white/5 pt-6 md:pt-0 pl-0 md:pl-8 relative z-10">
                  <ContactActions phone={t.phone} email={t.email} />
                  <button
                    onClick={() => handleMessageClick(t.userId)}
                    disabled={startingChat === t.userId}
                    className="group/btn relative flex items-center gap-2 px-6 py-3 bg-[#FF8C00]/10 dark:bg-[#FF8C00]/20 text-[#FF8C00] dark:text-[#FF8C00] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#FF8C00] hover:text-white dark:hover:text-white transition-all overflow-hidden w-full md:w-auto justify-center mt-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10">
                      {startingChat === t.userId ? "Starting..." : "Message"}
                    </span>
                    {startingChat === t.userId ? (
                      <Loader2 size={14} className="relative z-10 animate-spin" />
                    ) : (
                      <svg className="relative z-10 transform group-hover/btn:translate-x-1 transition-transform" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
