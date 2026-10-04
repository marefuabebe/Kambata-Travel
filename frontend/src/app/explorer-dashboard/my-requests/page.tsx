"use client";

import React, { useEffect, useState } from "react";
import apiClient from "@/utils/apiClient";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import { Loader2, Calendar, MapPin, Users, Info, ChevronRight, CheckCircle2, Clock, ChevronDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import RequestTimeline from "@/components/shared/RequestTimeline";
import PaymentExpiryTimer from "@/components/shared/PaymentExpiryTimer";
import { PageHeader } from "@/components/explorer/ui";

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending_admin");
  const { t } = useLanguage();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await apiClient.get("/requests/my-requests");
      setRequests(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load your requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-[#FF8C00] w-8 h-8" />
      </div>
    );
  }

  const filteredRequests = requests.filter(req => req.status === activeTab);

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <PageHeader 
          title={t("requests.title")} 
          subtitle={t("requests.subtitle")} 
        />
      </motion.div>

      {/* Dropdown UI */}
      <div className="relative mb-8 z-20">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full md:w-64 flex items-center justify-between bg-white dark:bg-[#1E293B] backdrop-blur-xl border border-gray-200 dark:border-gray-700 px-5 py-3.5 rounded-2xl shadow-sm text-gray-900 dark:text-white font-bold transition-all hover:border-[#FF8C00]"
        >
          <span className="flex items-center gap-2">
            {activeTab === "awaiting_payment" ? t("requests.paymentPending") : activeTab.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            {(() => {
              const count = requests.filter(r => r.status === activeTab).length;
              return count > 0 ? (
                <span className="bg-[#FF8C00]/10 text-[#FF8C00] py-0.5 px-2 rounded-full text-[10px]">
                  {count}
                </span>
              ) : null;
            })()}
          </span>
          <ChevronDown size={18} className={`transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 mt-2 w-full md:w-64 bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-gray-800 shadow-xl rounded-2xl py-2 overflow-hidden z-30"
            >
              {["pending_admin", "guide_pending", "awaiting_payment", "declined_by_guide", "confirmed", "completed", "payment_expired", "expired", "cancelled"].map(tab => {
                const count = requests.filter(r => r.status === tab).length;
                if (tab === "expired" && count === 0) return null;
                
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3 text-sm font-bold flex items-center justify-between transition-colors ${
                      activeTab === tab
                        ? "bg-[#FF8C00]/5 text-[#FF8C00]"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                    }`}
                  >
                    {tab === "awaiting_payment" ? t("requests.paymentPending") : tab.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    {count > 0 && (
                      <span className={`py-0.5 px-2 rounded-full text-[10px] ${activeTab === tab ? 'bg-[#FF8C00]/10 text-[#FF8C00]' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-6">
        <AnimatePresence>
          {filteredRequests.map(req => (

            <motion.div 
              key={req._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1E293B] backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-sm relative flex flex-col gap-4 overflow-hidden"
            >
              {/* Row 1: Header - Category Tag / Date (Left) & Status Badge (Right) */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm">
                    {req.requestType?.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-medium text-gray-400">
                    Submitted on {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="shrink-0">
                  {req.status === "awaiting_payment" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold shadow-sm">
                      <Clock size={12} /> {t("requests.status.actionRequired")}
                    </span>
                  )}
                  {req.status === "guide_pending" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold shadow-sm">
                      <Loader2 size={12} className="animate-spin" /> {t("requests.status.assigningGuide")}
                    </span>
                  )}
                  {req.status === "pending_admin" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-full text-xs font-bold shadow-sm">
                      <Loader2 size={12} className="animate-spin" /> Under Review
                    </span>
                  )}
                  {(req.status === "declined_by_guide" || req.status === "rejected") && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-full text-xs font-bold shadow-sm">
                      {t("requests.status.unavailable")}
                    </span>
                  )}
                  {req.status === "payment_expired" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 rounded-full text-xs font-bold shadow-sm">
                      {t("requests.status.expired")}
                    </span>
                  )}
                  {req.status === "confirmed" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold shadow-sm">
                      <CheckCircle2 size={13} className="text-emerald-500" /> Payment Successful
                    </span>
                  )}
                  {req.status === "expired" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-bold shadow-sm">
                      {t("requests.status.expired")}
                    </span>
                  )}
                  {req.status === "cancelled" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-full text-xs font-bold shadow-sm">
                      {t("requests.status.cancelled")}
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: Title */}
              <div>
                <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white tracking-tight leading-snug">
                  {req.tourId ? req.tourId.title?.en : req.packageId?.name?.en || t("requests.travelExperience")}
                </h3>
              </div>

              {/* Row 3: Metadata Bar */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-gray-50 dark:bg-white/5 p-2 sm:p-2.5 rounded-xl border border-gray-100 dark:border-white/5 w-full sm:w-fit">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Calendar size={13} />
                  </div>
                  <span>
                    {(() => {
                      const startDate = new Date(req.preferredDate);
                      let endDate = null;
                      const duration = req.tourId?.duration || req.packageId?.duration;
                      
                      if (duration && duration.value && duration.unit === "days") {
                        endDate = new Date(startDate);
                        endDate.setDate(endDate.getDate() + duration.value - 1);
                      } else if (duration && duration.value && duration.unit === "weeks") {
                        endDate = new Date(startDate);
                        endDate.setDate(endDate.getDate() + (duration.value * 7) - 1);
                      }
                      
                      if (endDate && endDate.getTime() >= startDate.getTime()) {
                        if (endDate.getTime() === startDate.getTime()) {
                          return `${startDate.toLocaleDateString()} (1D)`;
                        }
                        return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
                      }
                      return startDate.toLocaleDateString();
                    })()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 border-l border-gray-200 dark:border-gray-700 pl-2">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Clock size={13} />
                  </div>
                  <span>{req.preferredTime || 'Flexible'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 border-l border-gray-200 dark:border-gray-700 pl-2">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-[#FF8C00]">
                    <Users size={13} />
                  </div>
                  <span>{req.travelers} {t("requests.travelers")}</span>
                </div>
              </div>

              {/* Admin Notes */}
              {req.adminNotes && (
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl shadow-sm text-xs">
                  <p className="font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1"><Info size={12}/> {t("requests.messageFromAdmin")}</p>
                  <p className="font-medium text-blue-900 dark:text-blue-200 leading-relaxed">{req.adminNotes}</p>
                </div>
              )}

              {/* Row 4: Horizontal Timeline */}
              <div className="pt-2 border-t border-gray-100 dark:border-white/5 w-full">
                <RequestTimeline requestId={req._id} horizontal={true} />
              </div>

              {/* Row 5: Action Footer Bar */}
              {req.status === "confirmed" && (
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/5 gap-3 flex-wrap">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Tour confirmed & scheduled
                  </span>
                  <Link
                    href={`/explorer-dashboard/bookings`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF8C00] hover:bg-[#e07b00] text-white font-bold rounded-xl transition-all text-xs shadow-sm hover:shadow"
                  >
                    <span>{t("requests.status.viewDetails")}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              )}

              {req.status === "awaiting_payment" && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Amount:</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {(req.finalPrice || req.customPrice * req.travelers).toLocaleString()} ETB
                    </span>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={async () => {
                        if (!confirm(t("requests.status.confirmCancel"))) return;
                        try {
                          await apiClient.patch(`/requests/${req._id}/cancel`);
                          toast.success("Request cancelled successfully");
                          fetchRequests();
                        } catch (err: any) {
                          toast.error(err.response?.data?.message || "Failed to cancel request");
                        }
                      }}
                      className="px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 transition-colors bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-100 dark:border-red-500/20 rounded-xl"
                    >
                      {t("requests.status.cancelRequest")}
                    </button>
                    <div className="w-auto">
                      <PayNowButton request={req} t={t} compact={true} />
                    </div>
                  </div>
                </div>
              )}

              {["pending_admin", "guide_pending"].includes(req.status) && (
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/5 gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {req.status === "guide_pending" ? t("requests.status.assigningGuide") : "Our team is reviewing your custom request"}
                  </span>
                  <button
                    onClick={async () => {
                      if (!confirm(t("requests.status.confirmCancel"))) return;
                      try {
                        await apiClient.patch(`/requests/${req._id}/cancel`);
                        toast.success("Request cancelled successfully");
                        fetchRequests();
                      } catch (err: any) {
                        toast.error(err.response?.data?.message || "Failed to cancel request");
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-red-600 hover:text-red-700 transition-colors bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-100 dark:border-red-500/20 rounded-xl"
                  >
                    {t("requests.status.cancelRequest")}
                  </button>
                </div>
              )}

            </motion.div>
          ))}
        </AnimatePresence>

        {filteredRequests.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-[#1E293B] border border-dashed border-gray-200 dark:border-gray-700 rounded-3xl">
            <Calendar size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t("requests.empty.title")}</h3>
            <p className="text-gray-500">{t("requests.empty.subtitle")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PayNowButton({ request, t, compact = false }: { request: any, t: any, compact?: boolean }) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post(`/requests/${request._id}/initiate-payment`);
      if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        toast.error("Payment initialization failed");
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className={`block w-full bg-[#FF8C00] hover:bg-[#E67E22] text-center text-white font-black rounded-xl transition-colors shadow-lg shadow-orange-500/30 disabled:opacity-50 ${compact ? "py-1.5 px-4 text-[11px]" : "py-3 text-sm"}`}
    >
      {loading ? t("requests.status.processing") : t("requests.status.payNow")}
    </button>
  );
}
