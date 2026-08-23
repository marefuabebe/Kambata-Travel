"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  Calendar, 
  CreditCard, 
  User as UserIcon, 
  Compass, 
  Loader2,
  AlertTriangle,
  RotateCcw,
  XCircle,
} from "lucide-react";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";
import { confirmAction, promptAction } from "@/utils/confirmAlert";

export default function BookingMonitor() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", startDate: "", endDate: "" });
  const [urlSearch, setUrlSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUrlSearch(params.get("search") || "");
  }, []);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { status, startDate, endDate } = filters;
      const { data } = await apiClient.get(`/bookings?status=${status}&startDate=${startDate}&endDate=${endDate}`);
      setBookings(data.bookings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefundOverride = async (id: string) => {
    const reason = await promptAction("Reason for manual refund (processed via Chapa):", "Write reason here...");
    if (!reason) return;
    
    const isConfirmed = await confirmAction("Issue manual refund?", "This cannot be undone easily.");
    if (!isConfirmed) return;
    
    try {
      await apiClient.patch(`/bookings/${id}/payment-override`, {
        paymentStatus: "refunded",
        reason,
      });
      toast.success("Refund issued via Chapa");
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Refund failed");
    }
  };

  const handleForceCancel = async (id: string, paid: boolean) => {
    const reason = await promptAction("Reason for force-cancel (dispute/emergency):", "Write reason here...");
    if (!reason) return;
    
    let issueRefund = false;
    if (paid) {
      issueRefund = await confirmAction("Issue Refund?", "Also issue a Chapa refund for this paid booking?");
    }
    
    const isConfirmed = await confirmAction("Force Cancel?", "Force-cancel this booking immediately?");
    if (!isConfirmed) return;
    
    try {
      await apiClient.patch(`/bookings/${id}/cancel`, { reason, issueRefund });
      toast.success(issueRefund ? "Booking cancelled and refunded" : "Booking force-cancelled");
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Cancel failed");
    }
  };

  const handleResolveDispute = async (id: string, resolution: "guide_favor" | "traveler_favor") => {
    const isConfirmed = await confirmAction("Resolve Dispute?", `Are you sure you want to resolve this dispute in favor of the ${resolution === "guide_favor" ? "guide" : "traveler"}?`);
    if (!isConfirmed) return;

    try {
      await apiClient.patch(`/bookings/${id}/resolve-dispute`, { resolution });
      toast.success("Dispute resolved successfully");
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to resolve dispute");
    }
  };

  const tourLabel = (tour: any) => {
    if (!tour?.title) return "Tour";
    if (typeof tour.title === "string") return tour.title;
    return tour.title.en || tour.title.am || "Tour";
  };

  const visibleBookings = useMemo(() => {
    if (!urlSearch.trim()) return bookings;
    const q = urlSearch.toLowerCase();
    return bookings.filter((b) => {
      const tour = tourLabel(b.tour).toLowerCase();
      const user = (b.user?.name || "").toLowerCase();
      const id = b._id.toLowerCase();
      return tour.includes(q) || user.includes(q) || id.includes(q);
    });
  }, [bookings, urlSearch]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-[#F8FAFC] p-4 md:p-8 space-y-8 font-sans">
      
      {/* Header & Sticky Filter Bar */}
      <div className="sticky top-0 z-50 bg-slate-50/90 dark:bg-[#0F172A]/90 backdrop-blur-md pt-4 pb-4 border-b border-slate-200 dark:border-[#334155] space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">Expedition Monitor</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Real-time supervision of all platform bookings and revenue.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto bg-white dark:bg-[#1E293B] p-2 rounded-2xl border border-slate-200 dark:border-[#334155] shadow-sm">
            <select 
              value={filters.status} 
              onChange={e => setFilters({...filters, status: e.target.value})}
              className="w-full sm:w-auto bg-transparent border-none px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="" className="dark:bg-[#1E293B]">All Statuses</option>
              <option value="confirmed" className="dark:bg-[#1E293B]">Confirmed</option>
              <option value="pending" className="dark:bg-[#1E293B]">Pending</option>
              <option value="completed" className="dark:bg-[#1E293B]">Completed</option>
              <option value="cancelled" className="dark:bg-[#1E293B]">Cancelled</option>
            </select>
            
            <div className="w-full sm:w-[1px] h-[1px] sm:h-6 bg-slate-200 dark:bg-[#334155]" />
            
            <div className="flex items-center gap-2 w-full sm:w-auto px-2">
              <Calendar size={16} className="text-slate-400" />
              <input 
                type="date" 
                value={filters.startDate}
                onChange={e => setFilters({...filters, startDate: e.target.value})}
                className="bg-transparent border-none w-full sm:w-auto text-sm font-semibold text-slate-700 dark:text-slate-300 outline-none dark:[color-scheme:dark]" 
              />
            </div>
            
            <button 
              onClick={fetchBookings} 
              className="w-full sm:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity whitespace-nowrap flex items-center justify-center gap-2 shadow-md"
            >
              <Filter size={16} />
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Bookings List Area */}
      <div className="w-full">
        {loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="animate-spin text-slate-900 dark:text-white" size={32} />
          </div>
        ) : visibleBookings.length === 0 ? (
          <div className="bg-white dark:bg-[#1E293B] flex flex-col items-center justify-center py-32 rounded-3xl border border-slate-200 dark:border-[#334155] shadow-sm">
            <div className="w-16 h-16 bg-slate-50 dark:bg-[#0F172A] rounded-full flex items-center justify-center mb-4">
              <Search size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-semibold">No bookings found for the selected criteria.</p>
          </div>
        ) : (
          <div className="w-full overflow-hidden">
            {/* Desktop Table Header (Hidden on Mobile) */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 pb-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-[#334155] mb-4">
              <div className="col-span-4">Booking & Destination</div>
              <div className="col-span-3">Traveler & Date</div>
              <div className="col-span-2 text-right">Revenue</div>
              <div className="col-span-3 text-right">Actions</div>
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
              {visibleBookings.map((booking) => {
                // Determine pill colors
                const statusColor = 
                  booking.status === "confirmed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                  booking.status === "completed" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" :
                  booking.status === "cancelled" ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400" :
                  "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";
                
                const paymentColor = 
                  booking.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                  "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";

                const attendanceColor = 
                  booking.attendanceStatus === "present" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" :
                  booking.attendanceStatus === "absent" ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400" : "";

                return (
                  <motion.div
                    key={booking._id}
                    variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                    className="bg-white dark:bg-[#1E293B] rounded-2xl md:rounded-[20px] p-5 md:p-6 border border-slate-200 dark:border-[#334155] shadow-sm hover:shadow-md transition-shadow relative group"
                  >
                    {/* Desktop Layout (Grid) */}
                    <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                      {/* Booking & Destination */}
                      <div className="col-span-4 flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-100 dark:border-[#334155] flex items-center justify-center shrink-0">
                          <Compass size={20} className="text-slate-600 dark:text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">#{booking._id.slice(-8).toUpperCase()}</span>
                            <div className={`w-2 h-2 rounded-full ${booking.status === 'confirmed' ? 'bg-emerald-500' : booking.status === 'completed' ? 'bg-blue-500' : booking.status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'}`} />
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={tourLabel(booking.tour)}>{tourLabel(booking.tour)}</h3>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${paymentColor}`}>{booking.paymentStatus}</span>
                            {booking.attendanceStatus && (
                              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${attendanceColor}`}>{booking.attendanceStatus}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Traveler & Date */}
                      <div className="col-span-3 flex flex-col min-w-0">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
                          <UserIcon size={14} className="text-slate-400" />
                          {booking.user?.name || "Unknown Traveler"}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                          <Calendar size={14} className="text-slate-400" />
                          {(() => {
                            const schedule = booking.tour?.schedules?.find((s: any) => s._id?.toString() === booking.scheduleId?.toString());
                            if (schedule && (schedule.startDate || schedule.date)) {
                              return new Date(schedule.startDate || schedule.date).toLocaleDateString();
                            }
                            return new Date(booking.createdAt).toLocaleDateString();
                          })()}
                        </span>
                        
                        {/* Lock/Expired Badge logic */}
                        {(() => {
                          const schedule = booking.tour?.schedules?.find((s: any) => s._id?.toString() === booking.scheduleId?.toString());
                          const isExpired = schedule && new Date(schedule.endDate || schedule.startDate || schedule.date) < new Date();
                          const isLocked = schedule?.attendanceLocked;
                          
                          if (booking.status === "confirmed" && booking.payoutStatus === "pending_completion" && isExpired) {
                            return (
                              <div className="mt-2">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${isLocked ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>
                                  {isLocked ? 'LOCKED' : 'EXPIRED'}
                                </span>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold leading-tight">
                                  Guide did not complete tour
                                </p>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Revenue */}
                      <div className="col-span-2 text-right">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">ETB</span>
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          {booking.totalPrice?.toLocaleString() || 0}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="col-span-3 flex justify-end gap-2">
                        {booking.hasDispute ? (
                          <>
                            <button
                              onClick={() => handleResolveDispute(booking._id, "guide_favor")}
                              className="px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white rounded-xl transition-colors text-xs font-bold flex-1 max-w-[100px]"
                            >
                              Guide
                            </button>
                            <button
                              onClick={() => handleResolveDispute(booking._id, "traveler_favor")}
                              className="px-3 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-white rounded-xl transition-colors text-xs font-bold flex-1 max-w-[100px]"
                            >
                              Traveler
                            </button>
                          </>
                        ) : (
                          <>
                            {booking.status !== "cancelled" && booking.status !== "completed" && (
                              <button
                                onClick={() => handleForceCancel(booking._id, booking.paymentStatus === "paid")}
                                className="w-10 h-10 bg-slate-50 dark:bg-[#0F172A] text-red-500 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white rounded-xl transition-colors flex items-center justify-center border border-slate-100 dark:border-[#334155]"
                                title="Force Cancel"
                              >
                                <XCircle size={16} />
                              </button>
                            )}
                            {booking.paymentStatus === "paid" && (
                              <button
                                onClick={() => handleRefundOverride(booking._id)}
                                className="w-10 h-10 bg-slate-50 dark:bg-[#0F172A] text-amber-500 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white rounded-xl transition-colors flex items-center justify-center border border-slate-100 dark:border-[#334155]"
                                title="Manual Refund"
                              >
                                <RotateCcw size={16} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Mobile Layout (Stacked) */}
                    <div className="flex flex-col lg:hidden gap-4">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">#{booking._id.slice(-8).toUpperCase()}</span>
                            <div className={`w-2 h-2 rounded-full ${booking.status === 'confirmed' ? 'bg-emerald-500' : booking.status === 'completed' ? 'bg-blue-500' : booking.status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'}`} />
                          </div>
                          <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-2">{tourLabel(booking.tour)}</h3>
                        </div>
                        
                        {/* Mobile Actions (Top Right) */}
                        <div className="flex gap-2 shrink-0">
                          {booking.hasDispute ? (
                             <div className="flex flex-col gap-1">
                                <button onClick={() => handleResolveDispute(booking._id, "guide_favor")} className="px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg">Guide</button>
                                <button onClick={() => handleResolveDispute(booking._id, "traveler_favor")} className="px-2 py-1 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-lg">Traveler</button>
                             </div>
                          ) : (
                            <>
                              {booking.status !== "cancelled" && (
                                <button onClick={() => handleForceCancel(booking._id, booking.paymentStatus === "paid")} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-[#0F172A] text-red-500 flex items-center justify-center border border-slate-100 dark:border-[#334155]">
                                  <XCircle size={14} />
                                </button>
                              )}
                              {booking.paymentStatus === "paid" && (
                                <button onClick={() => handleRefundOverride(booking._id)} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-[#0F172A] text-amber-500 flex items-center justify-center border border-slate-100 dark:border-[#334155]">
                                  <RotateCcw size={14} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${paymentColor}`}>{booking.paymentStatus}</span>
                        {booking.attendanceStatus && (
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${attendanceColor}`}>{booking.attendanceStatus}</span>
                        )}
                      </div>

                      <div className="bg-slate-50 dark:bg-[#0F172A] rounded-xl p-3 border border-slate-100 dark:border-[#334155] flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                          <UserIcon size={14} className="text-slate-400" />
                          <span className="truncate">{booking.user?.name || "Unknown"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <Calendar size={14} className="text-slate-400" />
                            {new Date(booking.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-right">
                            <span className="text-base font-black text-slate-900 dark:text-white">
                              ETB {booking.totalPrice?.toLocaleString() || 0}
                            </span>
                          </div>
                        </div>
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
