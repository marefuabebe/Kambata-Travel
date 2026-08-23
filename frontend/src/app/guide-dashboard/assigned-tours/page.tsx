"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, Play, CheckCircle, Search, MapPin, Users, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "@/utils/apiClient";
import { PageHeader, StatusBadge, LoadingCenter, EmptyState } from "@/components/guide/ui";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";

export default function AssignedToursPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const q = searchParams.get("search") || filter;
      const { data } = await apiClient.get(
        `/guide-ops/assignments${q ? `?search=${encodeURIComponent(q)}` : ""}`
      );
      setRows(data.data || []);
    } catch {
      toast.error("Could not load assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [searchParams]);

  const updateStatus = async (tourId: string, scheduleId: string, status: string) => {
    try {
      await apiClient.patch(`/guide-ops/assignments/${tourId}/${scheduleId}/status`, { status });
      toast.success("Tour status updated");
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Update failed");
    }
  };

  if (loading) return <LoadingCenter />;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <PageHeader
          title={t("guidePages.assignedTours.title")}
          subtitle={t("guidePages.assignedTours.subtitle")}
          action={
            <div className="flex items-center gap-2 bg-white dark:bg-[#1E293B] backdrop-blur-xl rounded-2xl px-4 py-2.5 border border-gray-100 dark:border-white/5 focus-within:border-[#145A41] dark:focus-within:border-[#10B981] transition-colors shadow-sm">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder={t("guidePages.assignedTours.filterPlaceholder")}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load()}
                className="bg-transparent border-none outline-none text-sm font-medium w-64 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
          }
        />
      </motion.div>

      {rows.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <EmptyState
            title={t("guidePages.assignedTours.emptyTitle")}
            description={t("guidePages.assignedTours.emptyDesc")}
          />
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-white dark:bg-[#1E293B] backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm"
        >
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto p-4 md:p-6">
              <table className="w-full text-left text-sm border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    <th className="px-6 py-4 border-b border-gray-100 dark:border-white/5 font-semibold">{t("guidePages.assignedTours.tourType")}</th>
                    <th className="px-6 py-4 border-b border-gray-100 dark:border-white/5 font-semibold">{t("guidePages.assignedTours.destination")}</th>
                    <th className="px-6 py-4 border-b border-gray-100 dark:border-white/5 font-semibold">{t("guidePages.assignedTours.dateTime")}</th>
                    <th className="px-6 py-4 border-b border-gray-100 dark:border-white/5 font-semibold">{t("guidePages.assignedTours.travelers")}</th>
                    <th className="px-6 py-4 border-b border-gray-100 dark:border-white/5 font-semibold">{t("guidePages.assignedTours.status")}</th>
                    <th className="px-6 py-4 border-b border-gray-100 dark:border-white/5 font-semibold text-right">{t("guidePages.assignedTours.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {rows.map((r, idx) => (
                      <motion.tr 
                        key={r.scheduleId} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 rounded-l-2xl">
                          <div className="flex flex-col gap-1.5">
                            <span className="font-bold text-gray-900 dark:text-white text-base group-hover:text-[#145A41] dark:group-hover:text-[#10B981] transition-colors">{r.tourName}</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest w-fit px-2.5 py-1 rounded-lg ${r.type === 'package' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'}`}>
                              {r.type === 'package' ? t("guidePages.assignedTours.package") : t("guidePages.assignedTours.tour")}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium">
                            <MapPin size={16} className="text-gray-400" />
                            {r.destination}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                            <Calendar size={16} className="text-gray-400" />
                            {new Date(r.date).toLocaleDateString()} · <span className="font-bold text-gray-700 dark:text-gray-300">{r.startTime}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium">
                            <Users size={16} className="text-gray-400" />
                            {r.travelerCount} / {r.capacity}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={r.isLocked ? "Locked" : r.status} />
                        </td>
                        <td className="px-6 py-4 rounded-r-2xl">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/guide-dashboard/assigned-tours/${r.tourId}/${r.scheduleId}`}
                              className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
                              title={t("guidePages.assignedTours.viewDetails")}
                            >
                              <Eye size={18} />
                            </Link>
                            {!r.isLocked && ["draft", "published", "full"].includes(r.rawStatus) && (
                              <button
                                type="button"
                                onClick={() => updateStatus(r.tourId, r.scheduleId, "start")}
                                className="p-2.5 rounded-xl bg-amber-50 dark:bg-[#FF8C00]/10 text-[#FF8C00] hover:bg-[#FF8C00] hover:text-white transition-colors"
                                title={t("guidePages.assignedTours.startTour")}
                              >
                                <Play size={18} />
                              </button>
                            )}
                            {!r.isLocked && r.rawStatus === "in_progress" && (
                              <button
                                type="button"
                                onClick={() => updateStatus(r.tourId, r.scheduleId, "complete")}
                                className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                                title={t("guidePages.assignedTours.completeTour")}
                              >
                                <CheckCircle size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-4 p-4">
              <AnimatePresence>
                {rows.map((r, idx) => (
                  <motion.div
                    key={r.scheduleId}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col gap-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`text-[10px] font-black uppercase tracking-widest w-fit px-2 py-0.5 rounded ${r.type === 'package' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'}`}>
                          {r.type === 'package' ? t("guidePages.assignedTours.package") : t("guidePages.assignedTours.tour")}
                        </span>
                        <h4 className="font-bold text-gray-900 dark:text-white mt-1.5 leading-tight">{r.tourName}</h4>
                      </div>
                      <StatusBadge status={r.isLocked ? "Locked" : r.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-[#D97706]" />
                        <span className="truncate">{r.destination}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-[#D97706]" />
                        <span className="truncate">{new Date(r.date).toLocaleDateString()} · {r.startTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <Users size={14} className="text-[#D97706]" />
                        <span>Travelers: {r.travelerCount} / {r.capacity}</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">
                      <Link
                        href={`/guide-dashboard/assigned-tours/${r.tourId}/${r.scheduleId}`}
                        className="flex-1 flex justify-center items-center gap-1.5 py-2 px-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 font-medium text-xs transition-colors"
                      >
                        <Eye size={14} /> {t("guidePages.assignedTours.view")}
                      </Link>
                      {!r.isLocked && ["draft", "published", "full"].includes(r.rawStatus) && (
                        <button
                          type="button"
                          onClick={() => updateStatus(r.tourId, r.scheduleId, "start")}
                          className="flex-1 flex justify-center items-center gap-1.5 py-2 px-3 rounded-xl bg-amber-50 dark:bg-[#FF8C00]/10 text-[#FF8C00] hover:bg-[#FF8C00] hover:text-white font-medium text-xs transition-colors"
                        >
                          <Play size={14} /> {t("guidePages.assignedTours.start")}
                        </button>
                      )}
                      {!r.isLocked && r.rawStatus === "in_progress" && (
                        <button
                          type="button"
                          onClick={() => updateStatus(r.tourId, r.scheduleId, "complete")}
                          className="flex-1 flex justify-center items-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white font-medium text-xs transition-colors"
                        >
                          <CheckCircle size={14} /> {t("guidePages.assignedTours.finish")}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        </motion.div>
      )}
    </div>
  );
}
