"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Users, Loader2, Search, CheckCircle, AlertTriangle, Trash2, Edit2, X, ArrowRight, ChevronDown } from "lucide-react";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";
import { confirmAction } from "@/utils/confirmAlert";

interface GuideRosterEntry {
  guideId: string;
  guideName: string;
  guideProfile?: string;
  status: "Available" | "Assigned" | "Highly Active";
  assignments: {
    tourId: string;
    tourTitle: string;
    startDate: string;
    scheduleId: string;
    assignmentStatus: string;
  }[];
}

export default function MasterAssignmentsPage() {
  const [roster, setRoster] = useState<GuideRosterEntry[]>([]);
  const [guidesList, setGuidesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  const fetchOpsData = React.useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all guides & all tours simultaneously
      const [guidesRes, toursRes] = await Promise.all([
        apiClient.get("/guides"),
        apiClient.get("/tours?limit=100")
      ]);

      const allGuides = Array.isArray(guidesRes.data) ? guidesRes.data : (guidesRes.data.data || []);
      const allTours = toursRes.data.data || [];
      
      setGuidesList(allGuides.filter((g: any) => g.guideStatus === 'approved'));

      // Map schedules to Guide IDs
      const scheduleMap: Record<string, any[]> = {};
      
      allTours.forEach((tour: any) => {
        if (tour.schedules && Array.isArray(tour.schedules)) {
          tour.schedules.forEach((sch: any) => {
            if (sch.status !== 'cancelled' && sch.status !== 'completed' && sch.guide) {
              const gId = sch.guide._id || sch.guide;
              if (!scheduleMap[gId]) scheduleMap[gId] = [];
              
              scheduleMap[gId].push({
                tourId: tour._id,
                tourTitle: typeof tour.title === 'string' ? tour.title : (tour.title?.en || "Unnamed Tour"),
                startDate: sch.startDate,
                scheduleId: sch._id,
                assignmentStatus: sch.assignmentStatus || 'pending'
              });
            }
          });
        }
      });

      // Build roster
      const builtRoster: GuideRosterEntry[] = allGuides
        .filter((g: any) => g.guideStatus === 'approved')
        .map((g: any) => {
          const gId = g._id;
          const myAssignments = scheduleMap[gId] || [];
          
          // Sort assignments by closest date
          myAssignments.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

          let status: "Available" | "Assigned" | "Highly Active" = "Available";
          if (myAssignments.length === 1) status = "Assigned";
          if (myAssignments.length >= 2) status = "Highly Active";

          return {
            guideId: gId,
            guideName: g.name,
            guideProfile: g.profilePicture,
            status,
            assignments: myAssignments
          };
        });

      setRoster(builtRoster);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load operations dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpsData();
  }, [fetchOpsData]);

  const handleRemove = async (tourId: string, scheduleId: string) => {
    const isConfirmed = await confirmAction(
      "Remove Assignment?",
      "Are you sure you want to remove this assignment?"
    );
    if (!isConfirmed) return;

    try {
      setLoading(true);
      await apiClient.delete(`/tours/${tourId}/schedules/${scheduleId}`);
      toast.success("Assignment removed successfully");
      await fetchOpsData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to remove assignment");
      setLoading(false);
    }
  };

  const handleReassign = async (tourId: string, scheduleId: string, newGuideId: string) => {
    try {
      setLoading(true);
      await apiClient.patch(`/tours/${tourId}/schedules/${scheduleId}`, { guideId: newGuideId });
      toast.success("Guide reassigned successfully");
      await fetchOpsData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reassign guide");
      setLoading(false);
    }
  };

  const filtered = roster.filter(g => 
    g.guideName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.assignments.some(a => a.tourTitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-[#FF8C00]" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 text-slate-900 dark:text-slate-50">
      
      {/* Header & Sticky Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Operations Roster
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 max-w-xl leading-relaxed">
            Birds-eye view of your staffing. See exactly who is assigned today, who is available, and identify overloaded guides instantly.
          </p>
        </div>
        
        <div className="relative w-full md:w-80 sticky top-20 md:static z-20">
          <input 
            type="text" 
            placeholder="Search guides or tours..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-[#161B26] border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 font-medium text-sm outline-none focus:border-orange-500 dark:focus:border-orange-500 shadow-sm transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        </div>
      </div>

      {/* Summary Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-white dark:bg-[#161B26] p-5 md:p-6 rounded-[20px] md:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Guides</p>
            <h3 className="text-2xl md:text-3xl font-black">{roster.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
            <Users size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-[#161B26] p-5 md:p-6 rounded-[20px] md:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Available Now</p>
            <h3 className="text-2xl md:text-3xl font-black text-green-600 dark:text-green-500">{roster.filter(r => r.status === 'Available').length}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-500 group-hover:scale-105 transition-transform">
            <CheckCircle size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-[#161B26] p-5 md:p-6 rounded-[20px] md:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between group hover:shadow-md transition-all sm:col-span-1">
          <div>
            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Highly Active</p>
            <h3 className="text-2xl md:text-3xl font-black text-violet-600 dark:text-violet-500">{roster.filter(r => r.status === 'Highly Active').length}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-500 group-hover:scale-105 transition-transform">
            <Calendar size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#161B26] rounded-[20px] md:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-[20px] flex items-center justify-center mb-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <Users className="text-slate-400 dark:text-slate-500" size={32} />
            </div>
            <h3 className="text-xl font-black mb-2">No Guides Found</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              You don't have any approved guides matching this search.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-wider text-slate-500">Guide Name</th>
                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-wider text-slate-500">Current Tour(s)</th>
                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-wider text-slate-500">Date(s)</th>
                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-wider text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filtered.map((g, idx) => (
                    <React.Fragment key={g.guideId}>
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="px-6 py-5 align-top">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-[14px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0 shadow-sm">
                            {g.guideProfile ? (
                              <img src={g.guideProfile} alt={g.guideName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-black text-slate-400 dark:text-slate-500 text-lg">
                                {g.guideName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <p className="font-bold text-sm md:text-base">{g.guideName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        {g.status === "Available" && (
                          <div className="inline-flex px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-500 text-[11px] font-black uppercase tracking-wider border border-green-200 dark:border-green-500/20 shadow-sm">
                            Available
                          </div>
                        )}
                        {g.status === "Assigned" && (
                          <div className="inline-flex px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-black uppercase tracking-wider border border-blue-200 dark:border-blue-500/20 shadow-sm">
                            Assigned
                          </div>
                        )}
                        {g.status === "Highly Active" && (
                          <div className="inline-flex px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-500 text-[11px] font-black uppercase tracking-wider border border-violet-200 dark:border-violet-500/20 shadow-sm">
                            Highly Active ({g.assignments.length})
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 align-top">
                        {g.assignments.length === 0 ? (
                          <span className="text-slate-400 font-medium italic text-sm">None</span>
                        ) : (
                          <div className="space-y-3">
                            {g.assignments.map(a => (
                              <div key={a.scheduleId} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                                <p className="font-bold text-sm truncate max-w-[200px]" title={a.tourTitle}>
                                  {a.tourTitle}
                                </p>
                                {a.assignmentStatus === "pending" && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500 border border-amber-200 dark:border-amber-500/20">Pending</span>}
                                {a.assignmentStatus === "accepted" && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-500 border border-green-200 dark:border-green-500/20">Accepted</span>}
                                {a.assignmentStatus === "rejected" && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500 border border-red-200 dark:border-red-500/20">Rejected</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 align-top">
                        {g.assignments.length === 0 ? (
                          <span className="text-slate-400 font-medium text-sm">-</span>
                        ) : (
                          <div className="space-y-3">
                            {g.assignments.map(a => {
                              const dateObj = new Date(a.startDate);
                              const isValid = !isNaN(dateObj.getTime());
                              return (
                                <div key={a.scheduleId} className="h-[42px] flex items-center">
                                  <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                                    <Calendar size={14} className="text-slate-400" />
                                    {isValid ? dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Date TBD"}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 align-top">
                        {g.assignments.length === 0 ? (
                          <span className="text-slate-400 font-medium block text-right">-</span>
                        ) : (
                          <div className="space-y-3 flex flex-col items-end">
                            {g.assignments.map(a => (
                              <div key={a.scheduleId} className="flex items-center gap-2 h-[42px]">
                                <button 
                                  onClick={() => {
                                    if (editingScheduleId === a.scheduleId) setEditingScheduleId(null);
                                    else setEditingScheduleId(a.scheduleId);
                                  }}
                                  className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-orange-500 hover:border-orange-200 dark:hover:border-orange-500/30 transition-all shadow-sm"
                                  title="Change Guide"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleRemove(a.tourId, a.scheduleId)}
                                  className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-red-600 dark:hover:text-red-500 hover:border-red-200 dark:hover:border-red-500/30 transition-all shadow-sm"
                                  title="Remove Assignment"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </motion.tr>
                    {/* Inline Reassign UI */}
                    <AnimatePresence>
                      {g.assignments.some(a => a.scheduleId === editingScheduleId) && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-700"
                        >
                          <td colSpan={5} className="px-6 py-5">
                            <div className="flex items-center justify-end gap-3 max-w-xl ml-auto">
                              <p className="text-sm font-bold text-slate-500 mr-2 flex items-center gap-2">
                                <ArrowRight size={16} /> Reassign Guide:
                              </p>
                              <div className="relative flex-1">
                                <select 
                                  id={`select-${editingScheduleId}`}
                                  className="w-full appearance-none bg-white dark:bg-[#161B26] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm"
                                >
                                  <option value="">Select new guide...</option>
                                  {guidesList.filter(newG => newG._id !== g.guideId).map(newG => (
                                    <option key={newG._id} value={newG._id}>{newG.name}</option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                              </div>
                              <button 
                                onClick={() => {
                                  const sel = document.getElementById(`select-${editingScheduleId}`) as HTMLSelectElement;
                                  if (sel && sel.value) {
                                    const tourId = g.assignments.find(a => a.scheduleId === editingScheduleId)?.tourId;
                                    if (tourId) handleReassign(tourId, editingScheduleId as string, sel.value);
                                  } else {
                                    toast.error("Please select a guide");
                                  }
                                }}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-colors shadow-sm shadow-orange-500/20"
                              >
                                Save
                              </button>
                              <button 
                                onClick={() => setEditingScheduleId(null)}
                                className="w-10 h-10 rounded-xl bg-white dark:bg-[#161B26] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all shadow-sm"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards Grid (hidden on large desktop) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-4 md:p-6 lg:hidden bg-slate-50/50 dark:bg-slate-900/20">
              {filtered.map((g, idx) => (
                <motion.div 
                  key={g.guideId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white dark:bg-[#161B26] rounded-2xl md:rounded-[20px] border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-5"
                >
                  {/* Top Row: Avatar, Name, Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-[14px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0 shadow-sm">
                        {g.guideProfile ? (
                          <img src={g.guideProfile} alt={g.guideName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-black text-slate-400 dark:text-slate-500 text-lg">
                            {g.guideName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-base">{g.guideName}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">Operations ID: {g.guideId.slice(-6).toUpperCase()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {g.status === "Available" && (
                      <div className="inline-flex px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-500 text-[11px] font-black uppercase tracking-wider border border-green-200 dark:border-green-500/20 shadow-sm">
                        Available
                      </div>
                    )}
                    {g.status === "Assigned" && (
                      <div className="inline-flex px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-black uppercase tracking-wider border border-blue-200 dark:border-blue-500/20 shadow-sm">
                        Assigned
                      </div>
                    )}
                    {g.status === "Highly Active" && (
                      <div className="inline-flex px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-500 text-[11px] font-black uppercase tracking-wider border border-violet-200 dark:border-violet-500/20 shadow-sm">
                        Highly Active ({g.assignments.length})
                      </div>
                    )}
                  </div>

                  {/* Assignments Section */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">Current Tours & Actions</h4>
                    {g.assignments.length === 0 ? (
                      <div className="flex items-center justify-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-sm font-medium text-slate-400">No active assignments</p>
                      </div>
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-4">
                        {g.assignments.map(a => {
                          const dateObj = new Date(a.startDate);
                          const isValid = !isNaN(dateObj.getTime());
                          return (
                            <div key={a.scheduleId} className="flex flex-col gap-3 pb-4 last:pb-0 last:border-0 border-b border-slate-200 dark:border-slate-700">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <p className="font-bold text-sm leading-tight">{a.tourTitle}</p>
                                  <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mt-1.5">
                                    <Calendar size={12} className="text-slate-400"/> {isValid ? dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Date TBD"}
                                  </p>
                                </div>
                                <div className="flex-shrink-0">
                                  {a.assignmentStatus === "pending" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500 border border-amber-200 dark:border-amber-500/20">Pending</span>}
                                  {a.assignmentStatus === "accepted" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-500 border border-green-200 dark:border-green-500/20">Accepted</span>}
                                  {a.assignmentStatus === "rejected" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500 border border-red-200 dark:border-red-500/20">Rejected</span>}
                                </div>
                              </div>
                              
                              {/* Reassign UI or Action Buttons */}
                              <AnimatePresence mode="wait">
                                {editingScheduleId === a.scheduleId ? (
                                  <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex flex-col gap-2 pt-1"
                                  >
                                    <div className="relative">
                                      <select 
                                        id={`m-select-${a.scheduleId}`}
                                        className="w-full min-h-[44px] appearance-none bg-white dark:bg-[#161B26] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm"
                                      >
                                        <option value="">Select new guide...</option>
                                        {guidesList.filter(newG => newG._id !== g.guideId).map(newG => (
                                          <option key={newG._id} value={newG._id}>{newG.name}</option>
                                        ))}
                                      </select>
                                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button 
                                        onClick={() => {
                                          const sel = document.getElementById(`m-select-${a.scheduleId}`) as HTMLSelectElement;
                                          if (sel && sel.value) handleReassign(a.tourId, a.scheduleId, sel.value);
                                          else toast.error("Please select a guide");
                                        }}
                                        className="flex-1 min-h-[44px] bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-black transition-colors shadow-sm shadow-orange-500/20"
                                      >
                                        Save
                                      </button>
                                      <button 
                                        onClick={() => setEditingScheduleId(null)}
                                        className="w-[44px] h-[44px] rounded-xl bg-white dark:bg-[#161B26] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all shadow-sm"
                                      >
                                        <X size={18} />
                                      </button>
                                    </div>
                                  </motion.div>
                                ) : (
                                  <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2 pt-1"
                                  >
                                    <button 
                                      onClick={() => setEditingScheduleId(a.scheduleId)}
                                      className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-[#161B26] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                                    >
                                      <Edit2 size={14} /> Reassign
                                    </button>
                                    <button 
                                      onClick={() => handleRemove(a.tourId, a.scheduleId)}
                                      className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs hover:bg-red-100 dark:hover:bg-red-500/20 transition-all shadow-sm"
                                    >
                                      <Trash2 size={14} /> Remove
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
