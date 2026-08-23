import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import apiClient from "@/utils/apiClient";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export function useRealtimeNotifications() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?._id) return;

    // Fetch initial count
    apiClient.get("/notifications/unread-count")
      .then(res => {
        const count = res.data?.unreadCount ?? (typeof res.data === 'number' ? res.data : 0);
        setUnreadCount(count);
      })
      .catch(console.error);

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    const getSocketUrl = () => {
      if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '');
      if (typeof window !== "undefined") {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (!isLocalhost) return `http://${window.location.hostname}:5000`;
      }
      return "http://localhost:5000";
    };
    const socketUrl = getSocketUrl();
    
    let currentToken = token;
    const socket = io(socketUrl, {
      auth: { token: currentToken },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect_error", (err) => {
      console.warn("Notification Socket Error:", err.message);
      if (err.message.includes("Authentication error")) {
        const freshToken = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (freshToken && freshToken !== currentToken) {
          currentToken = freshToken;
          // @ts-ignore
          socket.auth.token = currentToken;
          socket.connect();
        }
      }
    });

    socket.on("new_notification", (data) => {
      setUnreadCount(prev => prev + 1);
      toast.success(data?.title || "New notification received", {
        duration: 4000,
        position: 'top-right'
      });
    });

    const handleReset = () => setUnreadCount(0);
    const handleDecrement = () => setUnreadCount(prev => Math.max(0, prev - 1));

    window.addEventListener("notifications-read-all", handleReset);
    window.addEventListener("notification-read", handleDecrement);

    return () => {
      socket.disconnect();
      window.removeEventListener("notifications-read-all", handleReset);
      window.removeEventListener("notification-read", handleDecrement);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  return unreadCount;
}
