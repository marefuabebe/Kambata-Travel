"use client";

import React, { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Loader2, ShieldAlert, CreditCard, Ticket, AlertCircle } from "lucide-react";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";

interface Notification {
  _id: string;
  type: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  message: string;
  isRead: boolean;
  createdAt: string;
}

import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const { data } = await apiClient.get("/notifications");
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      setNotifications((prev) => prev); // trigger re-render if needed
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      toast.error("Could not mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Could not mark all as read");
    }
  };

  const openNotification = async (notification: Notification) => {
    if (!notification.isRead) await markAsRead(notification._id);
    
    if (notification.type === "booking" || notification.message.toLowerCase().includes("booking")) {
      router.push("/bookings");
      return;
    }
    if (notification.type === "payment" || notification.message.toLowerCase().includes("payment") || notification.message.toLowerCase().includes("refund") || notification.message.toLowerCase().includes("payout")) {
      router.push("/payments");
      return;
    }
    if (notification.message.toLowerCase().includes("sos alert") || notification.message.toLowerCase().includes("emergency")) {
      router.push("/sos");
      return;
    }
    if (notification.message.toLowerCase().includes("support") || notification.message.toLowerCase().includes("ticket")) {
      router.push("/support");
      return;
    }
    if (notification.message.toLowerCase().includes("custom tour request") || notification.message.toLowerCase().includes("tour request")) {
      router.push("/requests");
      return;
    }
    if (notification.message.toLowerCase().includes("guide application") || notification.message.toLowerCase().includes("guide verification") || notification.message.toLowerCase().includes("guide")) {
      router.push("/guides");
      return;
    }
  };

  const getIcon = (type: string, priority: string) => {
    if (priority === "HIGH" || priority === "URGENT") return <ShieldAlert className="text-red-500" size={24} />;
    if (type === "payment" || type === "refund") return <CreditCard className="text-emerald-500" size={24} />;
    if (type === "booking") return <Ticket className="text-[#FF8C00]" size={24} />;
    return <AlertCircle className="text-blue-500" size={24} />;
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "URGENT":
      case "HIGH":
        return "bg-red-50 border-red-100 text-red-700";
      case "NORMAL":
        return "bg-blue-50 border-blue-100 text-blue-700";
      default:
        return "bg-gray-50 border-gray-100 text-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-[#FF8C00]" size={40} />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-4">
            System Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                {unreadCount} New
              </span>
            )}
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
            Stay on top of bookings, payments, and security alerts.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 bg-white dark:bg-[#161B26] border border-gray-200 dark:border-white/5 text-gray-700 dark:text-gray-300 px-5 py-3 rounded-2xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all shadow-sm"
          >
            <CheckCheck size={18} />
            Mark All as Read
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#161B26] rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-xl shadow-gray-200/40 dark:shadow-none overflow-hidden p-2">
        {notifications.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Bell className="text-gray-300 dark:text-gray-500" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">You're all caught up!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No new notifications right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-6 flex items-start justify-between transition-all rounded-[1.5rem] ${
                  notification.isRead ? "opacity-70 hover:opacity-100" : "bg-[#FF8C00]/5"
                }`}
              >
                <div className="flex items-start gap-5">
                  <div className={`p-4 rounded-2xl shadow-sm border ${getPriorityStyle(notification.priority)}`}>
                    {getIcon(notification.type, notification.priority)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                        {notification.type}
                      </span>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-[#FF8C00] rounded-full animate-pulse" />
                      )}
                    </div>
                    <p className={`text-sm ${notification.isRead ? "text-gray-600 dark:text-gray-400" : "text-gray-900 dark:text-white font-bold"}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-2">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => openNotification(notification)}
                    className="px-4 py-2 bg-[#FF8C00] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#E67E00] transition-colors"
                  >
                    View Details
                  </button>
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      className="px-4 py-2 text-[#FF8C00] bg-orange-50 border border-orange-100 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-orange-100 transition-colors"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
