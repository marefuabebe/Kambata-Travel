"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  Calendar, 
  CreditCard, 
  User as UserIcon, 
  Package, 
  Loader2,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";
import { confirmAction, promptAction } from "@/utils/confirmAlert";

export default function PackageBookingMonitor() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "" });
  const [urlSearch, setUrlSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUrlSearch(params.get("search") || "");
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { status } = filters;
      const url = status ? `/package-bookings?status=${status}` : "/package-bookings";
      const { data } = await apiClient.get(url, {
        baseURL: apiClient.defaults.baseURL?.replace('/admin', '')
      });
      setBookings(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load package bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [filters.status]);

  const isPaymentExpired = (booking: any) => {
    if (booking.bookingStatus === "expired") return true;
    if (booking.paymentStatus === "failed") return true;
    if (
      booking.paymentStatus === "pending" &&
      booking.paymentExpiresAt &&
      new Date(booking.paymentExpiresAt).getTime() < Date.now()
    ) {
      return true;
    }
    return false;
  };

  const handleForceCancel = async (id: string, paid: boolean) => {
    if (paid) {
      toast.error("Paid package bookings cannot be cancelled here. Use the refund flow.");
      return;
    }

    const isConfirmed = await confirmAction("Cancel Booking?", "Cancel this unpaid package booking?");
    if (!isConfirmed) return;
    
    try {
      await apiClient.patch(`/package-bookings/${id}/cancel`, {}, {
        baseURL: apiClient.defaults.baseURL?.replace('/admin', '')
      });
      toast.success("Package booking cancelled");
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Cancel failed");
    }
  };

  const packageLabel = (pkg: any) => {
    if (!pkg) return "Unknown Package";
    if (pkg.name?.en) return pkg.name.en;
    if (pkg.name?.am) return pkg.name.am;
    if (typeof pkg.name === "string") return pkg.name;
    return "Package";
  };

  const visibleBookings = useMemo(() => {
    if (!urlSearch.trim()) return bookings;
    const q = urlSearch.toLowerCase();
    return bookings.filter((b) => {
      const pkgName = packageLabel(b.packageId).toLowerCase();
      const user = (b.user?.name || "").toLowerCase();
      const id = b._id.toLowerCase();
      return pkgName.includes(q) || user.includes(q) || id.includes(q);
    });
  }, [bookings, urlSearch]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-[#F8FAFC] p-4 md:p-8 space-y-8 font-sans">
      
      {/* Header & Sticky Filter Bar */}
      <div className="sticky top-0 z-50 bg-slate-50/90 dark:bg-[#0F172A]/90 backdrop-blur-md pt-4 pb-4 border-b border-slate-200 dark:border-[#334155] space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              Package Bookings
              <span className="bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 text-xs font-bold px-3 py-1 rounded-full border border-purple-200 dark:border-purple-500/20">
                {bookings.length} Total
              </span>
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Supervise and manage all bundled travel package reservations.</p>
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
              <option value="expired" className="dark:bg-[#1E293B]">Payment Expired</option>
            </select>
            
            <div className="w-full sm:w-[1px] h-[1px] sm:h-6 bg-slate-200 dark:bg-[#334155]" />
            
            <button 
              onClick={fetchBookings} 
              className="w-full sm:w-auto bg-[#0F172A] dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity whitespace-nowrap flex items-center justify-center gap-2 shadow-md"
            >
              <Filter size={16} />
              Apply Filter
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
              <Package size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg">No package bookings found.</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">Adjust your filters or wait for new reservations.</p>
          </div>
        ) : (
          <div className="w-full overflow-hidden">
            {/* Desktop Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 pb-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-[#334155] mb-4">
              <div className="col-span-4">Booking & Package</div>
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
                const expired = isPaymentExpired(booking);
                const statusColor = 
                  booking.bookingStatus === "confirmed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                  booking.bookingStatus === "completed" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" :
                  booking.bookingStatus === "cancelled" || booking.bookingStatus === "expired" ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400" :
                  "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";
                
                const paymentColor = 
                  booking.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                  "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";

                return (
                  <motion.div
                    key={booking._id}
                    variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                    className="bg-white dark:bg-[#1E293B] rounded-[1.5rem] p-5 md:p-6 border border-slate-200 dark:border-[#334155] shadow-sm hover:shadow-md transition-shadow relative group"
                  >
                    {/* Desktop Layout */}
                    <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-4 flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 flex items-center justify-center shrink-0">
                          <Package size={20} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">#{booking._id.slice(-8).toUpperCase()}</span>
                            <div className={`w-2 h-2 rounded-full ${booking.bookingStatus === 'confirmed' ? 'bg-emerald-500' : booking.bookingStatus === 'completed' ? 'bg-blue-500' : expired ? 'bg-rose-500' : booking.bookingStatus === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'}`} />
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={packageLabel(booking.packageId)}>{packageLabel(booking.packageId)}</h3>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {expired ? (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 flex items-center gap-1">
                                <AlertTriangle size={10} /> PAYMENT EXPIRED
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${statusColor}`}>{booking.bookingStatus}</span>
                            )}
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${expired && booking.paymentStatus !== "paid" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400" : paymentColor}`}>{booking.paymentStatus}</span>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-3 flex flex-col min-w-0">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
                          <UserIcon size={14} className="text-slate-400" />
                          {booking.user?.name || "Unknown Traveler"}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1.5">
                          <Calendar size={14} className="text-slate-400" />
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </span>
                        {booking.paymentExpiresAt && (
                          <span className={`text-xs font-semibold flex items-center gap-1.5 mt-1.5 ${expired ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            <Clock size={13} className={expired ? 'text-rose-500 shrink-0' : 'text-slate-400 shrink-0'} />
                            <span>{new Date(booking.paymentExpiresAt).getTime() < Date.now() ? "Expired: " : "Window: "} {new Date(booking.paymentExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
                          </span>
                        )}
                      </div>

                      <div className="col-span-2 text-right">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Total</span>
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          ETB {booking.totalPrice?.toLocaleString() || 0}
                        </span>
                      </div>

                      <div className="col-span-3 flex justify-end gap-2">
                        {booking.bookingStatus !== "cancelled" && booking.bookingStatus !== "expired" && booking.paymentStatus !== "paid" && (
                          <button
                            onClick={() => handleForceCancel(booking._id, booking.paymentStatus === "paid")}
                            className="w-10 h-10 bg-slate-50 dark:bg-[#0F172A] text-red-500 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white rounded-xl transition-colors flex items-center justify-center border border-slate-100 dark:border-[#334155] shadow-sm"
                            title="Cancel Booking"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Mobile Layout */}
                    <div className="flex flex-col lg:hidden gap-4">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">#{booking._id.slice(-8).toUpperCase()}</span>
                            <div className={`w-2 h-2 rounded-full ${booking.bookingStatus === 'confirmed' ? 'bg-emerald-500' : booking.bookingStatus === 'completed' ? 'bg-blue-500' : expired ? 'bg-rose-500' : booking.bookingStatus === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'}`} />
                          </div>
                          <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-2">{packageLabel(booking.packageId)}</h3>
                        </div>
                        
                        <div className="flex gap-2 shrink-0">
                          {booking.bookingStatus !== "cancelled" && booking.bookingStatus !== "expired" && booking.paymentStatus !== "paid" && (
                            <button onClick={() => handleForceCancel(booking._id, booking.paymentStatus === "paid")} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-[#0F172A] text-red-500 flex items-center justify-center border border-slate-100 dark:border-[#334155]">
                              <XCircle size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {expired ? (
                          <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 flex items-center gap-1">
                            <AlertTriangle size={12} /> PAYMENT EXPIRED
                          </span>
                        ) : (
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>{booking.bookingStatus}</span>
                        )}
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${expired && booking.paymentStatus !== "paid" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400" : paymentColor}`}>{booking.paymentStatus}</span>
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
                        {booking.paymentExpiresAt && (
                          <div className={`flex items-center gap-1.5 text-xs font-semibold pt-1 border-t border-slate-200 dark:border-slate-800 ${expired ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            <Clock size={12} className={expired ? 'text-rose-500 shrink-0' : 'text-slate-400 shrink-0'} />
                            <span>{new Date(booking.paymentExpiresAt).getTime() < Date.now() ? "Expired: " : "Window: "} {new Date(booking.paymentExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
                          </div>
                        )}
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
