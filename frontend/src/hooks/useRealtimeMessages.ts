import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import apiClient from "@/utils/apiClient";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export function useRealtimeMessages() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?._id) return;

    const fetchUnreadCount = () => {
      apiClient.get("/messages/unread-count?excludeContexts=booking,request")
        .then(res => setUnreadCount(res.data.unreadCount || 0))
        .catch(console.error);
    };

    fetchUnreadCount();

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
      console.warn("Messages Socket Error:", err.message);
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

    socket.on("receive_message", (message) => {
      // If we are the sender, don't increment
      if (message.sender === user._id || message.sender?._id === user._id) return;
      
      // Fetch the accurate count from the backend to respect context filtering
      fetchUnreadCount();

      // Only toast if the message is new (not just loading history)
      toast.success(`New message from ${message.sender?.name || 'someone'}`, {
        icon: '💬',
        duration: 4000,
        position: 'top-right'
      });
    });

    const handleReset = () => setUnreadCount(0);
    const handleDecrement = () => setUnreadCount(prev => Math.max(0, prev - 1));

    window.addEventListener("messages-read-all", handleReset);
    window.addEventListener("message-read", handleDecrement);
    window.addEventListener("chat-messages-read", fetchUnreadCount);

    return () => {
      socket.disconnect();
      window.removeEventListener("messages-read-all", handleReset);
      window.removeEventListener("message-read", handleDecrement);
      window.removeEventListener("chat-messages-read", fetchUnreadCount);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  return unreadCount;
}
