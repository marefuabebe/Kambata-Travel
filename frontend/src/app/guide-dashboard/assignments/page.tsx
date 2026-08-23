"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, Clock, MapPin, Users, Calendar, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "@/utils/apiClient";
import { PageHeader, LoadingCenter, EmptyState } from "@/components/guide/ui";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";

export default function AssignmentsPage() {
  const { t } = useLanguage();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "accepted" | "rejected">("pending");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/guide-ops/assignments`);
      setAssignments(data.data || []);
    } catch {
      toast.error("Could not load assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRespond = async (scheduleId: string, type: string, decision: "accepted" | "rejected") => {
    try {
      await apiClient.post(`/guide-ops/assignments/respond`, { scheduleId, type, decision });
      toast.success(`Assignment ${decision}`);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Operation failed");
    }
  };

  if (loading) return <LoadingCenter />;

  const filtered = assignments.filter((a) => a.assignmentStatus === activeTab);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <PageHeader
          title={t("guidePages.assignments.title")}
          subtitle={t("guidePages.assignments.subtitle")}
        />
      </motion.div>

      {/* TABS */}
      <div className="flex items-center gap-4 mb-8 border-b border-gray-200 dark:border-white/10 pb-4">
        {["pending", "accepted", "rejected"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all capitalize ${
              activeTab === tab
                ? "bg-[#1A331B] text-white shadow-md dark:bg-emerald-500"
                : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={t("guidePages.assignments.emptyTitle").replace("{tab}", activeTab)}
          description={t("guidePages.assignments.emptyDesc").replace("{tab}", activeTab)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.map((a, idx) => (
              <motion.div
                key={a.scheduleId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white dark:bg-[#1E293B] backdrop-blur-xl rounded-[2rem] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm flex flex-col"
              >
                {/* Image Header */}
                <div className="h-40 relative bg-gray-200 dark:bg-gray-800">
                  {a.image ? (
                    <img loading="lazy" src={a.image} alt={a.tourName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <MapPin size={32} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-md ${a.type === 'package' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'}`}>
                      {a.type}
                    </span>
                  </div>
                  {activeTab === "pending" && (
                     <div className="absolute top-4 right-4 bg-[#FF8C00] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
                       <Clock size={12} /> {t("guidePages.assignments.actionRequired")}
                     </div>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-4 line-clamp-2">
                    {a.tourName}
                  </h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                      <Calendar size={18} className="text-emerald-500" />
                      <span>{new Date(a.date).toLocaleDateString()} at {a.startTime}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                      <MapPin size={18} className="text-[#FF8C00]" />
                      <span className="truncate">{a.meetingPoint}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                      <Users size={18} className="text-blue-500" />
                      <span>{a.travelerCount} Travelers ({a.capacity} max)</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5 flex gap-3">
                    {activeTab === "pending" && (
                      <>
                        <button
                          onClick={() => handleRespond(a.scheduleId, a.type, "rejected")}
                          className="flex-1 py-3 flex justify-center items-center gap-2 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors"
                        >
                          <XCircle size={18} /> {t("guidePages.assignments.reject")}
                        </button>
                        <button
                          onClick={() => handleRespond(a.scheduleId, a.type, "accepted")}
                          className="flex-1 py-3 flex justify-center items-center gap-2 rounded-xl bg-[#10B981] text-white font-bold hover:bg-[#059669] transition-colors shadow-md shadow-emerald-500/20"
                        >
                          <CheckCircle size={18} /> {t("guidePages.assignments.accept")}
                        </button>
                      </>
                    )}
                    {activeTab === "accepted" && (
                      <Link
                        href={`/guide-dashboard/assigned-tours/${a.tourId}/${a.scheduleId}`}
                        className="w-full py-3 flex justify-center items-center gap-2 rounded-xl bg-[#1A331B] dark:bg-[#1E293B] text-white font-bold hover:opacity-90 transition-opacity"
                      >
                        {t("guidePages.assignments.viewDashboard")}
                      </Link>
                    )}
                    {activeTab === "rejected" && (
                      <div className="w-full py-3 flex justify-center items-center gap-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 font-bold">
                        <AlertTriangle size={18} /> {t("guidePages.assignments.declined")}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
