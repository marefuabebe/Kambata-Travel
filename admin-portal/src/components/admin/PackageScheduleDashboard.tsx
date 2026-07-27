"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Clock, DollarSign, Users, X, MapPin, 
  Search, Filter, Plus, FileText, CheckCircle, 
  XCircle, AlertCircle, Loader2, Navigation, MoreVertical 
} from "lucide-react";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";
import { confirmAction } from "@/utils/confirmAlert";

interface PackageScheduleDashboardProps {
  packageData: any;
  onClose: () => void;
}

export default function PackageScheduleDashboard({ packageData, onClose }: PackageScheduleDashboardProps) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "calendar" | "timeline">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Action State
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  // Reassign Guide State
  const [reassignSchedule, setReassignSchedule] = useState<any | null>(null);
  const [availableGuides, setAvailableGuides] = useState<any[]>([]);
  const [searchingGuides, setSearchingGuides] = useState(false);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get(`/packages/${packageData._id}/schedules/all`);
      setSchedules(data.data || []);
    } catch (err) {
      toast.error("Failed to load schedules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (packageData?._id) {
      fetchSchedules();
    }
  }, [packageData._id]);

  const handleCancelSchedule = async (scheduleId: string) => {
    const isConfirmed = await confirmAction(
      "Cancel Schedule?", 
      "Are you sure you want to cancel this schedule? Affected bookings will be marked as Cancelled with Refund Pending."
    );
    if (!isConfirmed) return;

    try {
      setIsProcessing(scheduleId);
      await apiClient.patch(`/packages/${packageData._id}/schedules/${scheduleId}/cancel-admin`);
      toast.success("Schedule cancelled successfully.");
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Cancellation failed");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleUpdateStatus = async (scheduleId: string, newStatus: string) => {
    try {
      setIsProcessing(scheduleId);
      await apiClient.patch(`/packages/${packageData._id}/schedules/${scheduleId}/status`, { status: newStatus });
      toast.success(`Schedule status updated to ${newStatus}`);
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Status update failed");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleOpenReassign = async (schedule: any) => {
    setReassignSchedule(schedule);
    setSearchingGuides(true);
    setAvailableGuides([]);
    try {
      const { data } = await apiClient.post(`/tours/guides/availability`, {
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      });
      setAvailableGuides(data.data?.filter((g: any) => !g.hasConflict) || []);
    } catch (err: any) {
      toast.error("Failed to find available guides");
    } finally {
      setSearchingGuides(false);
    }
  };

  const handleReassignGuide = async (guideId: string) => {
    try {
      setIsProcessing(reassignSchedule._id);
      await apiClient.put(`/packages/${packageData._id}/schedules/${reassignSchedule._id}`, { assignedGuide: guideId });
      toast.success("Guide reassigned successfully.");
      setReassignSchedule(null);
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reassign guide");
    } finally {
      setIsProcessing(null);
    }
  };

  const filteredSchedules = schedules.filter(sch => {
    const matchesStatus = statusFilter === "all" || sch.status === statusFilter;
    const matchesSearch = sch.assignedGuide?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && (searchTerm === "" || matchesSearch);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300";
      case "published": return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400";
      case "in_progress": return "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400";
      case "completed": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400";
      case "cancelled": return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400";
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-[#0F172A] w-full max-w-6xl rounded-[2rem] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden border border-gray-100 dark:border-white/10"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <Calendar className="text-[#FF8C00]" size={24} />
              Manage Package Schedules
            </h2>
            <p className="text-sm font-semibold text-[#FF8C00] mt-1">{packageData.name?.en || "Package"}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors absolute top-6 right-8">
            <X size={18} />
          </button>
        </div>

        {/* Dashboard Toolbar */}
        <div className="px-8 py-4 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#0F172A] flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
          <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
            {(["list", "calendar", "timeline"] as const).map(v => (
              <button 
                key={v} onClick={() => setView(v)} 
                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${view === v ? 'bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full lg:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} 
                placeholder="Search guide..." 
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <select 
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)} 
              className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-blue-500 transition-all appearance-none"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-50/30 dark:bg-transparent">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-[#FF8C00]">
              <Loader2 className="animate-spin mb-4" size={40} />
              <p className="font-semibold text-gray-500">Loading schedules...</p>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl">
              <Calendar className="text-gray-300 dark:text-gray-600 mb-4" size={48} />
              <p className="font-bold text-gray-500">No schedules found matching your criteria.</p>
            </div>
          ) : view === "list" ? (
            <div className="space-y-4">
              {filteredSchedules.map((schedule) => (
                <div key={schedule._id} className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm p-6 flex flex-col xl:flex-row gap-6 hover:shadow-md transition-shadow">
                  {/* Left Column: Dates & Meta */}
                  <div className="xl:w-1/4 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusColor(schedule.status)}`}>
                          {schedule.status}
                        </span>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${schedule.scheduleType === 'private' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400'}`}>
                          {schedule.scheduleType || 'Public'}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white mt-2">
                        {new Date(schedule.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </h3>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
                        <Clock size={14} /> {schedule.startTime} - {schedule.endTime}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/5">
                      <div className="flex items-center gap-3">
                        <img src={schedule.assignedGuide?.profileImage || "/default-avatar.png"} alt="Guide" className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-[#1E293B] shadow-sm" />
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Assigned Guide</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{schedule.assignedGuide?.name || "Unassigned"}</p>
                        </div>
                      </div>
                      {schedule.status !== "cancelled" && schedule.status !== "completed" && (
                        <button 
                          onClick={() => handleOpenReassign(schedule)}
                          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline px-2"
                        >
                          Change
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Operational Metrics */}
                  <div className="xl:w-2/4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 dark:bg-[#0F172A]/50 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                      <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-2 flex items-center gap-1.5"><Users size={12} /> Bookings</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white">{schedule.stats?.totalBookings || 0}</p>
                      <p className="text-xs font-semibold text-gray-500 mt-1">{schedule.stats?.totalTravelers || 0} Travelers total</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#0F172A]/50 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                      <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-2 flex items-center gap-1.5"><Navigation size={12} /> Capacity</p>
                      <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{schedule.availableSeats}</p>
                      <p className="text-xs font-semibold text-gray-500 mt-1">Seats remaining</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#0F172A]/50 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                      <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-2 flex items-center gap-1.5"><DollarSign size={12} /> Expected</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white">${schedule.stats?.expectedRevenue?.toLocaleString() || 0}</p>
                      <p className="text-xs font-semibold text-gray-500 mt-1">Total revenue value</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#0F172A]/50 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                      <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-2 flex items-center gap-1.5"><CheckCircle size={12} /> Collected</p>
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">${schedule.stats?.revenue?.toLocaleString() || 0}</p>
                      <p className="text-xs font-semibold text-gray-500 mt-1">Paid bookings</p>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="xl:w-1/4 flex flex-col justify-center gap-2 border-t xl:border-t-0 xl:border-l border-gray-100 dark:border-white/5 pt-4 xl:pt-0 xl:pl-6">
                    {schedule.status === "draft" && (
                      <button onClick={() => handleUpdateStatus(schedule._id, "published")} disabled={isProcessing === schedule._id} className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors text-center disabled:opacity-50">
                        Publish Schedule
                      </button>
                    )}
                    {schedule.status === "published" && (
                      <>
                        <button onClick={() => handleUpdateStatus(schedule._id, "in_progress")} disabled={isProcessing === schedule._id} className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors text-center disabled:opacity-50">
                          Mark In-Progress
                        </button>
                        <button onClick={() => handleCancelSchedule(schedule._id)} disabled={isProcessing === schedule._id} className="w-full bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors text-center disabled:opacity-50">
                          Cancel Schedule
                        </button>
                      </>
                    )}
                    {schedule.status === "in_progress" && (
                      <button onClick={() => handleUpdateStatus(schedule._id, "completed")} disabled={isProcessing === schedule._id} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors text-center disabled:opacity-50">
                        Mark Completed
                      </button>
                    )}
                    {schedule.status === "cancelled" && (
                      <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl p-3 text-center">
                        <AlertCircle className="mx-auto text-red-500 mb-1" size={20} />
                        <p className="text-xs font-bold text-red-600 dark:text-red-400">Cancelled</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl">
              <Calendar className="text-gray-300 dark:text-gray-600 mb-4" size={48} />
              <p className="font-bold text-gray-500">Advanced {view} view is under construction.</p>
              <button onClick={() => setView("list")} className="mt-4 text-blue-500 hover:underline text-sm font-semibold">Return to List View</button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Reassign Guide Modal */}
      {reassignSchedule && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setReassignSchedule(null)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-[#0F172A] w-full max-w-lg rounded-3xl shadow-2xl relative z-10 p-6 border border-gray-100 dark:border-white/10">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Reassign Guide</h3>
            <p className="text-sm text-gray-500 mb-6">Select a new available guide for this schedule.</p>
            
            {searchingGuides ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="animate-spin text-[#FF8C00] mb-2" size={32} />
                <p className="text-sm font-medium text-gray-500">Finding available guides...</p>
              </div>
            ) : availableGuides.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No guides are available for these dates.
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                {availableGuides.map(guide => (
                  <div key={guide._id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-white/5 hover:border-blue-500/50 transition-colors bg-gray-50 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                      <img src={guide.profileImage || "/default-avatar.png"} className="w-10 h-10 rounded-full" alt="Guide" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{guide.name}</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Available</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleReassignGuide(guide._id)}
                      disabled={isProcessing === reassignSchedule._id || reassignSchedule.assignedGuide?._id === guide._id}
                      className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {reassignSchedule.assignedGuide?._id === guide._id ? "Current" : "Select"}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <button onClick={() => setReassignSchedule(null)} className="px-5 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
