"use client";

import React, { useEffect, useState } from "react";
import apiClient from "@/utils/apiClient";
import { toast } from "react-hot-toast";
import { Loader2, Calendar, MapPin, Users, Info, ChevronRight, CheckCircle2, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader, LoadingCenter, EmptyState } from "@/components/guide/ui";
import PaymentExpiryTimer from "@/components/shared/PaymentExpiryTimer";
import { useLanguage } from "@/context/LanguageContext";

export default function GuideRequestsPage() {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("guide_pending");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Create this endpoint or reuse existing one
      const res = await apiClient.get("/guide-ops/requests");
      setRequests(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load custom requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRespond = async (requestId: string, action: "accept" | "decline") => {
    try {
      await apiClient.post(`/requests/${requestId}/guide-response`, { action });
      toast.success(`Request ${action}ed successfully`);
      fetchRequests();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Operation failed");
    }
  };

  if (loading) {
    return <LoadingCenter />;
  }

  const filteredRequests = requests.filter(req => req.status === activeTab);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <PageHeader
          title={t("guidePages.requests.title")}
          subtitle={t("guidePages.requests.subtitle")}
        />
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800 mb-8 overflow-x-auto pb-2">
        {["guide_pending", "awaiting_payment", "confirmed", "declined_by_guide"].map(tab => {
          const count = requests.filter(r => r.status === tab).length;
          
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all capitalize flex items-center gap-2 ${
                activeTab === tab 
                  ? "bg-[#1A331B] text-white shadow-md dark:bg-emerald-500"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
              }`}
            >
              {tab.replace(/_/g, ' ')}
              {count > 0 && (
                <span className={`py-0.5 px-2 rounded-full text-[10px] ${activeTab === tab ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filteredRequests.length === 0 ? (
        <EmptyState
          title={t("guidePages.requests.emptyTitle").replace("{status}", activeTab.replace(/_/g, " "))}
          description={t("guidePages.requests.emptyDesc").replace("{status}", activeTab.replace(/_/g, " "))}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredRequests.map((req, idx) => (
              <motion.div 
                key={req._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white dark:bg-[#0A0F1C] backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-[2rem] p-6 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-[#FF8C00]/10 text-[#FF8C00] text-[10px] font-black uppercase tracking-widest rounded-xl">
                    {req.requestType?.replace('_', ' ')}
                  </span>
                </div>
                
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4 line-clamp-2">
                  {req.tourId ? req.tourId.title?.en : req.packageId?.name?.en || 'Travel Experience'}
                </h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-400">
                    <Calendar size={18} className="text-emerald-500" />
                    {new Date(req.preferredDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-400">
                    <Clock size={18} className="text-blue-500" />
                    {req.preferredTime || 'Flexible Time'}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-400">
                    <Users size={18} className="text-[#FF8C00]" />
                    {req.travelers} Travelers
                  </div>
                </div>

                {activeTab === "guide_pending" && req.guideReservationExpiresAt && (
                  <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-700 dark:text-amber-400 text-xs font-bold">
                    Respond within: <PaymentExpiryTimer expiresAt={req.guideReservationExpiresAt} />
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5 flex gap-3">
                  {activeTab === "guide_pending" && (
                    <>
                      <button
                        onClick={() => handleRespond(req._id, "decline")}
                        className="flex-1 py-3 flex justify-center items-center gap-2 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors"
                      >
                        <XCircle size={18} /> Decline
                      </button>
                      <button
                        onClick={() => handleRespond(req._id, "accept")}
                        className="flex-1 py-3 flex justify-center items-center gap-2 rounded-xl bg-[#10B981] text-white font-bold hover:bg-[#059669] transition-colors shadow-md shadow-emerald-500/20"
                      >
                        <CheckCircle2 size={18} /> Accept
                      </button>
                    </>
                  )}
                  {activeTab === "awaiting_payment" && (
                    <div className="w-full py-3 flex justify-center items-center gap-2 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 font-bold text-sm">
                      <Clock size={18} /> Awaiting traveler payment
                    </div>
                  )}
                  {activeTab === "confirmed" && (
                    <div className="w-full py-3 flex justify-center items-center gap-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500 font-bold">
                      <CheckCircle2 size={18} /> You accepted this request
                    </div>
                  )}
                  {activeTab === "declined_by_guide" && (
                    <div className="w-full py-3 flex justify-center items-center gap-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 font-bold">
                      <XCircle size={18} /> You declined this request
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
