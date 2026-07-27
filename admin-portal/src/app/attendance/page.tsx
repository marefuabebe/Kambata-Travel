"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Calendar, Map, CheckCircle2, AlertCircle, XCircle, Users } from "lucide-react";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function AttendancePage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/attendance");
      setSchedules(data.data || []);
    } catch (err) {
      toast.error("Failed to load attendance schedules");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-full text-[10px] font-black uppercase tracking-wider border border-slate-200 dark:border-slate-700">Draft</span>;
      case "published":
        return <span className="px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-100 dark:border-blue-500/20">Published</span>;
      case "full":
        return <span className="px-3 py-1 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-purple-100 dark:border-purple-500/20"><Users size={10} /> Full</span>;
      case "in_progress":
        return <span className="px-3 py-1 bg-[#FF8C00]/10 text-[#FF8C00] dark:bg-[#FF8C00]/10 dark:text-[#FF8C00] rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-[#FF8C00]/20 dark:border-[#FF8C00]/20"><AlertCircle size={10} /> Active</span>;
      case "completed":
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-emerald-100 dark:border-emerald-500/20"><CheckCircle2 size={10} /> Completed</span>;
      case "cancelled":
        return <span className="px-3 py-1 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-red-100 dark:border-red-500/20"><XCircle size={10} /> Cancelled</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-full text-[10px] font-black uppercase tracking-wider border border-slate-200 dark:border-slate-700">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-[#F8FAFC] p-4 md:p-8 space-y-8 font-sans pb-20">
      
      {/* Header (Sticky) */}
      <div className="sticky top-0 z-50 bg-slate-50/90 dark:bg-[#0F172A]/90 backdrop-blur-md pt-4 pb-4 border-b border-slate-200 dark:border-[#334155]">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm">Attendance & Dispatch Monitor</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Real-time overview of guide schedules across all active tours.</p>
        </div>
      </div>

      <div className="w-full">
        {loading ? (
          <div className="flex justify-center py-32">
            <div className="w-10 h-10 border-4 border-slate-200 dark:border-[#334155] border-t-[#FF8C00] rounded-full animate-spin" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-white dark:bg-[#1E293B] flex flex-col items-center justify-center py-32 rounded-3xl border border-slate-200 dark:border-[#334155] shadow-sm">
            <div className="w-16 h-16 bg-slate-50 dark:bg-[#0F172A] rounded-full flex items-center justify-center mb-4">
              <Calendar size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-semibold">No active schedules found.</p>
          </div>
        ) : (
          <div className="w-full overflow-hidden">
            {/* Desktop & Tablet Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 pb-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-[#334155] mb-4">
              <div className="col-span-5">Tour & Dates</div>
              <div className="col-span-3">Assigned Guide</div>
              <div className="col-span-2 text-center">Capacity</div>
              <div className="col-span-2 text-right">Status</div>
            </div>

            <motion.div 
              initial="hidden" 
              animate="show" 
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.05 } }
              }}
              className="flex flex-col gap-4"
            >
              {schedules.map((sched, idx) => {
                const bookedCount = (sched.maxCapacity || 0) - (sched.remainingSlots || 0);
                const isFull = sched.remainingSlots === 0;

                return (
                  <motion.div
                    key={`${sched.scheduleId}-${idx}`}
                    variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                    className="bg-white dark:bg-[#1E293B] rounded-2xl md:rounded-[20px] p-5 md:p-6 border border-slate-200 dark:border-[#334155] shadow-sm hover:shadow-md transition-shadow relative group"
                  >
                    {/* Desktop & Tablet Layout (Grid) */}
                    <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-5 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#FF8C00]/10 text-[#FF8C00] border border-[#FF8C00]/20 flex items-center justify-center flex-shrink-0 shadow-sm shadow-[#FF8C00]/10">
                          <Map size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">{sched.tourTitle}</p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                            {new Date(sched.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(sched.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      <div className="col-span-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-[#334155] shadow-sm overflow-hidden flex-shrink-0">
                          {sched.guideProfilePicture ? (
                            <img src={sched.guideProfilePicture} alt={sched.guideName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600 dark:from-emerald-500 dark:to-emerald-700 text-white font-bold text-sm uppercase">
                              {sched.guideName?.charAt(0) || "U"}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">{sched.guideName}</p>
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">{sched.guideEmail}</p>
                        </div>
                      </div>

                      <div className="col-span-2 flex justify-center">
                        <div className="inline-flex items-center gap-2 bg-slate-50 dark:bg-[#0F172A] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#334155]">
                          <Users size={14} className={isFull ? "text-emerald-500 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"} />
                          <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                            {bookedCount} / {sched.maxCapacity || "-"}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2 flex justify-end">
                        {getStatusBadge(sched.status)}
                      </div>
                    </div>

                    {/* Mobile Layout (Stacked Card) */}
                    <div className="flex flex-col md:hidden">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[#FF8C00]/10 text-[#FF8C00] border border-[#FF8C00]/20 flex items-center justify-center flex-shrink-0 shadow-sm shadow-[#FF8C00]/10">
                          <Map size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 dark:text-white">{sched.tourTitle}</p>
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                            <span className="text-sm">📅</span>
                            <span className="truncate">
                              {new Date(sched.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(sched.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-[#0F172A] rounded-xl p-3 mb-4 border border-slate-100 dark:border-[#334155]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                              {sched.guideProfilePicture ? (
                                <img src={sched.guideProfilePicture} alt={sched.guideName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600 dark:from-emerald-500 dark:to-emerald-700 text-white font-bold text-[10px] uppercase">
                                  {sched.guideName?.charAt(0) || "U"}
                                </div>
                              )}
                            </div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{sched.guideName}</p>
                          </div>
                          
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                             <Users size={12} className={isFull ? "text-emerald-500" : ""} />
                             <span>{bookedCount}/{sched.maxCapacity || "-"}</span>
                          </div>
                        </div>
                        
                        {/* Tiny capacity progress bar */}
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${isFull ? 'bg-emerald-500' : 'bg-[#FF8C00]'}`} 
                            style={{ width: `${Math.min(100, (bookedCount / (sched.maxCapacity || 1)) * 100)}%` }} 
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        {getStatusBadge(sched.status)}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
