"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  Calendar, 
  MapPin, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Trash2,
  Check,
  Loader2,
  ChevronLeft
} from "lucide-react";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { t } = useLanguage();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await apiClient.get("/notifications");
      setNotifications(data.data || data || []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
      toast.error("Could not load notifications");
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === "unread" 
    ? notifications.filter(n => !n.isRead) 
    : notifications;

  const markAsRead = async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      window.dispatchEvent(new Event('notification-read'));
    } catch (err) {
      toast.error("Failed to mark as read");
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.put("/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      window.dispatchEvent(new Event('notifications-read-all'));
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Failed to update notifications");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "booking": return CheckCircle;
      case "payment": return CreditCard;
      case "reminder": return Calendar;
      case "system": return Info;
      default: return Bell;
    }
  };

  const openNotification = async (n: any) => {
    if (!n.isRead) await markAsRead(n._id);
    
    if (n.type === "booking" || n.type === "payment" || n.type === "reminder") {
      router.push("/explorer-dashboard/bookings");
      return;
    }
    if (n.type === "message" || n.message?.toLowerCase().includes("message")) {
      router.push("/explorer-dashboard/messages");
      return;
    }
    if (n.message?.toLowerCase().includes("sos alert") || n.message?.toLowerCase().includes("support ticket") || n.message?.toLowerCase().includes("support team")) {
      router.push("/explorer-dashboard/support");
      return;
    }
    if (n.message?.toLowerCase().includes("custom tour request") || n.message?.toLowerCase().includes("request update") || n.message?.toLowerCase().includes("tour request")) {
      router.push("/explorer-dashboard/my-requests");
      return;
    }
    
    router.push("/explorer-dashboard/discover");
  };

  const getColor = (type: string) => {
    switch (type) {
      case "booking": return "emerald";
      case "payment": return "emerald";
      case "reminder": return "amber";
      case "system": return "blue";
      default: return "gray";
    }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-8 animate-pulse pb-12">
      <div className="h-48 bg-gray-200 dark:bg-white/5 rounded-[2.5rem] w-full" />
      <div className="flex gap-4 mb-4">
        <div className="h-10 w-24 bg-gray-200 dark:bg-white/5 rounded-full" />
        <div className="h-10 w-24 bg-gray-200 dark:bg-white/5 rounded-full" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-28 bg-gray-100 dark:bg-white/5 rounded-3xl w-full" />
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 mt-4 lg:mt-0">
      
      {/* ── Mobile Back Button ── */}
      <div className="lg:hidden mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#161B26] border border-gray-200 dark:border-white/10 rounded-xl text-gray-600 dark:text-gray-300 font-bold shadow-sm active:scale-95 transition-transform w-fit">
          <ChevronLeft size={18} />
          Back
        </button>
      </div>

      {/* ── Page Header ── */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white dark:from-[#1E293B] dark:to-[#0F172A] p-8 md:p-10 text-teal-950 dark:text-white shadow-xl shadow-teal-900/5 dark:shadow-xl border border-teal-100/50 dark:border-white/10"
      >
        <div className="absolute top-0 right-0 w-64 h-full bg-[#0F766E]/5 dark:bg-[#FF8C00]/10 blur-3xl rounded-full transform translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-full bg-emerald-500/10 dark:bg-emerald-500/10 blur-3xl rounded-full transform -translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#0F766E]/10 dark:bg-[#FF8C00]/20 border border-[#0F766E]/20 dark:border-[#FF8C00]/30 text-[10px] font-black uppercase tracking-widest text-[#0F766E] dark:text-[#FF8C00] mb-4"
            >
              <Bell size={12} className="text-[#0F766E] dark:text-[#FF8C00]" />
              {notifications.filter(n => !n.isRead).length} {t("notifications.newAlerts")}
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-teal-950 dark:text-white">{t("notifications.title")}</h1>
            <p className="text-teal-700/80 dark:text-gray-400 text-sm font-medium">{t("notifications.subtitle")}</p>
          </div>
          <motion.button 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ delay: 0.3 }}
            onClick={markAllRead}
            disabled={notifications.every(n => n.isRead)}
            className="bg-[#0F766E] dark:bg-white/10 text-white hover:bg-[#0F766E]/90 dark:hover:bg-white/20 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-[#0F766E]/20 dark:shadow-none flex items-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent dark:border-white/20"
          >
            <Check size={18} /> {t("notifications.markAllAsRead")}
          </motion.button>
        </div>
      </motion.div>

      {/* ── Tabs & Filter ── */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 bg-white dark:bg-[#161B26]/60 backdrop-blur-xl p-2 rounded-2xl border border-gray-100 dark:border-white/5 w-fit shadow-sm"
      >
        {["all", "unread"].map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize tracking-wide transition-all relative ${
              filter === t ? "text-white" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
          >
            {filter === t && (
              <motion.div 
                layoutId="activeFilterBg"
                className="absolute inset-0 bg-[#0F766E] rounded-xl shadow-md shadow-[#0F766E]/20"
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {t === "unread" && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
              {t}
            </span>
          </button>
        ))}
      </motion.div>

      {/* ── Notification List ── */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-24 text-center bg-white dark:bg-[#161B26]/60 backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm"
            >
              <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400 dark:text-gray-500">
                <Bell size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t("notifications.caughtUp")}</h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium max-w-sm mx-auto">{filter === "unread" ? t("notifications.noUnreadFound") : t("notifications.noAllFound")}</p>
            </motion.div>
          ) : (
            filtered.map((n, i) => {
              const Icon = getIcon(n.type);
              const color = getColor(n.type);
              return (
                <motion.div
                  key={n._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  role="button"
                  tabIndex={0}
                  onClick={() => openNotification(n)}
                  onKeyDown={(e) => e.key === "Enter" && openNotification(n)}
                  className={`relative bg-white dark:bg-[#161B26]/60 backdrop-blur-xl p-6 rounded-3xl border transition-all hover:shadow-lg group flex gap-6 cursor-pointer overflow-hidden ${
                    n.isRead ? "border-gray-100 dark:border-white/5 opacity-80" : "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-500/5 shadow-sm"
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    color === "emerald" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" :
                    color === "amber" ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400" :
                    "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                  }`}>
                    <Icon size={24} />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <h3 className={`font-bold text-base md:text-lg truncate capitalize ${n.isRead ? "text-gray-600 dark:text-gray-300" : "text-gray-900 dark:text-white"}`}>
                        {n.type} {t("notifications.alert")}
                      </h3>
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap bg-gray-50 dark:bg-white/5 px-3 py-1 rounded-lg">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${n.isRead ? "text-gray-500 dark:text-gray-400" : "text-gray-600 dark:text-gray-300"}`}>
                      {n.message}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                    {!n.isRead && (
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); markAsRead(n._id); }}
                        className="w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-white/5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/20 rounded-xl transition-all"
                        title="Mark as read"
                      >
                        <Check size={18} />
                      </button>
                    )}
                  </div>
                  
                  {!n.isRead && (
                    <div className="absolute top-1/2 -translate-y-1/2 right-6 w-3 h-3 bg-emerald-500 rounded-full group-hover:hidden shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  )}
                  
                  {!n.isRead && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Page Footer */}
      <footer className="pt-8 pb-4 text-center opacity-50 hover:opacity-100 transition-opacity">
        <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center justify-center gap-3">
          <span>Kambata Travel</span>
          <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          <span>Explorer Portal</span>
          <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          <span>&copy; {new Date().getFullYear()}</span>
        </p>
      </footer>
    </div>
  );
}
