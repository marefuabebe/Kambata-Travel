"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/utils/apiClient";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, MessageSquare, Info, ShieldCheck, MailOpen } from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";

export default function NotificationsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await apiClient.get("/notifications");
        setNotifications(res.data.data || res.data || []);
      } catch (error) {
        console.error("Error fetching notifications", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await apiClient.put("/notifications/read-all");
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      window.dispatchEvent(new Event('notifications-read-all'));
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Could not update notifications");
    }
  };

  const markOneRead = async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      window.dispatchEvent(new Event('notification-read'));
    } catch {
      /* ignore */
    }
  };

  const openNotification = async (notif: any) => {
    if (!notif.isRead) await markOneRead(notif._id);

    if (notif.type === "booking" || notif.type === "payment") {
      router.push("/guide-dashboard/bookings");
      return;
    }
    if (notif.type === "message") {
      router.push("/guide-dashboard/messages");
      return;
    }
    if (notif.type === "system") {
      if (notif.message?.toLowerCase().includes("payout") || notif.message?.toLowerCase().includes("earning")) {
        router.push("/guide-dashboard/earnings");
        return;
      }
      if (notif.message?.toLowerCase().includes("verif") || notif.message?.toLowerCase().includes("approv")) {
        router.push("/guide-dashboard/profile");
        return;
      }
      if (notif.message?.toLowerCase().includes("custom tour request")) {
        router.push("/guide-dashboard/requests");
        return;
      }
      if (notif.message?.toLowerCase().includes("pending assignment")) {
        router.push("/guide-dashboard/assignments");
        return;
      }
      if (notif.message?.toLowerCase().includes("sos alert")) {
        router.push("/guide-dashboard/sos");
        return;
      }
      if (notif.message?.toLowerCase().includes("support ticket")) {
        router.push("/guide-dashboard/contact");
        return;
      }
      router.push("/guide-dashboard");
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'system': return <div className="w-full h-full rounded-full flex items-center justify-center shrink-0 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><ShieldCheck size={20} /></div>;
      case 'booking': return <div className="w-full h-full rounded-full flex items-center justify-center shrink-0 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"><Info size={20} /></div>;
      case 'payment': return <div className="w-full h-full rounded-full flex items-center justify-center shrink-0 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"><Info size={20} /></div>;
      case 'message': return <div className="w-full h-full rounded-full flex items-center justify-center shrink-0 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"><MessageSquare size={20} /></div>;
      case 'reminder': return <div className="w-full h-full rounded-full flex items-center justify-center shrink-0 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"><AlertTriangle size={20} /></div>;
      default: return <div className="w-full h-full rounded-full flex items-center justify-center shrink-0 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400"><Info size={20} /></div>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1A331B]"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto pb-24"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="font-black text-4xl text-gray-900 dark:text-white tracking-tight mb-2">{t("guidePages.notifications.title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">{t("guidePages.notifications.subtitle")}</p>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <button 
            type="button"
            onClick={markAllRead}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-[#FF8C00] hover:bg-[#FF8C00] hover:text-white hover:border-[#FF8C00] transition-all shadow-sm"
          >
            <MailOpen size={18} /> {t("guidePages.notifications.markAllRead")}
          </button>
        )}
      </div>

      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-[1.375rem] before:-translate-x-px sm:before:ml-[2.375rem] before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-gray-800 before:to-transparent">
         {notifications.length === 0 ? (
           <div className="relative z-10 bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-16 text-center shadow-sm ml-12 sm:ml-20">
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                 <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">{t("guidePages.notifications.emptyTitle")}</h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium">{t("guidePages.notifications.emptyDesc")}</p>
           </div>
         ) : (
            notifications.map((notif, index) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                key={notif._id} 
                className="relative z-10 flex items-start gap-4 sm:gap-6 group"
                onClick={() => openNotification(notif)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && openNotification(notif)}
              >
                 <div className="relative shrink-0 sm:w-20 sm:h-20 flex justify-center mt-1 sm:mt-0">
                    <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-4 border-white dark:border-[#0F172A] z-10 shadow-sm ${!notif.isRead ? 'ring-2 ring-[#FF8C00]/20' : ''}`}>
                       {getIcon(notif.type)}
                    </div>
                 </div>
                 
                 <div className={`flex-1 bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl rounded-[20px] sm:rounded-[2rem] p-5 sm:p-6 border transition-all group-hover:-translate-y-1 group-hover:shadow-lg ${
                  !notif.isRead 
                    ? 'border-l-4 border-l-[#FF8C00] border-t-gray-100 border-r-gray-100 border-b-gray-100 dark:border-l-[#FF8C00] dark:border-t-white/5 dark:border-r-white/5 dark:border-b-white/5 shadow-md' 
                    : 'border-gray-100 dark:border-white/5 shadow-sm opacity-80 group-hover:opacity-100'
                }`}>
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h3 className={`font-black tracking-wide truncate ${!notif.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                         {notif.type?.toUpperCase() || t("guidePages.notifications.alert")}
                      </h3>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap bg-gray-50 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                         {new Date(notif.createdAt).toLocaleString()}
                      </span>
                   </div>
                   <p className={`text-sm leading-relaxed mb-4 ${!notif.isRead ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                     {notif.message}
                   </p>
                   <div>
                     <button
                       type="button"
                       onClick={(e) => { e.stopPropagation(); openNotification(notif); }}
                       className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                         !notif.isRead 
                           ? 'bg-[#FF8C00] text-white hover:bg-[#FF8C00]/90 shadow-sm' 
                           : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                       }`}
                     >
                       {t("guidePages.notifications.viewDetails")}
                     </button>
                   </div>
                 </div>
              </motion.div>
            ))
         )}
      </div>
    </motion.div>
  );
}

