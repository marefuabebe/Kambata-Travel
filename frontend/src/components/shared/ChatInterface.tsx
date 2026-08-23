"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import apiClient from "@/utils/apiClient";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";
import {
  Send, Loader2, ArrowLeft, CheckCheck, User, Search,
  FileText, ShieldAlert, Pencil, Trash2, X, Check,
  Paperclip, Mic, MicOff, Image as ImageIcon, FileUp, Play, Pause, ExternalLink, Download,
  Reply, Forward, Copy, Smile
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import EmojiPicker from 'emoji-picker-react';

interface ChatRoom {
  _id: string;
  title: string;
  participants: any[];
  contextType: string;
  unreadCount?: number;
  lastMessage?: { text: string; sender: string; timestamp: string };
}

interface Message {
  _id: string;
  roomId: string;
  sender: { _id: string; name: string; profilePicture?: string; role: string };
  text: string;
  attachment?: { url: string; fileType: string; fileName: string };
  createdAt: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  isForwarded?: boolean;
  replyTo?: {
    _id: string;
    text: string;
    attachment?: any;
    sender: {
      name: string;
      role: string;
    }
  };
  seenBy?: string[];
}

interface MergedConversation {
  personId: string;
  personName: string;
  personPicture?: string;
  roomIds: string[];
  activeRoomId: string;
  lastMessageText?: string;
  lastMessageSender?: string;
  lastMessageTimestamp?: string;
  unreadCount?: number;
}

// ── Pure dedup helper (module-level, no stale-closure risk) ──────────────────
// Builds a Map keyed on _id so the returned array always has unique messages.
function dedupMessages(msgs: Message[]): Message[] {
  const map = new Map<string, Message>();
  for (const m of msgs) map.set(m._id, m);
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

const handleDownload = async (url: string, fileName: string, e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  window.open(url, "_blank", "noopener,noreferrer");
};

export default function ChatInterface() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeConvo, setActiveConvo] = useState<MergedConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit & Delete state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  // Reply and Forward state
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [forwardSearchQuery, setForwardSearchQuery] = useState("");

  // Hover tracking for action button visibility
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Media Upload state ───────────────────────────────────────────────────────
  const [uploading, setUploading] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState<{
    url: string; fileType: string; fileName: string; file: File;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ── Voice recording state ────────────────────────────────────────────────────
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const searchParams = useSearchParams();
  const roomIdParam = searchParams?.get("roomId");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const autoSelectedRef = useRef(false);

  const activeConvoRef = useRef<MergedConversation | null>(null);
  useEffect(() => { activeConvoRef.current = activeConvo; }, [activeConvo]);

  // ── Merged conversations ────────────────────────────────────────────────────
  const conversations = useMemo<MergedConversation[]>(() => {
    if (!user?._id) return [];
    const map = new Map<string, MergedConversation>();
    for (const room of rooms) {
      const other = room.participants.find((p) => p._id !== user._id);
      if (!other) continue;
      const existing = map.get(other._id);
      const roomLastTs = room.lastMessage?.timestamp ? new Date(room.lastMessage.timestamp).getTime() : 0;
      if (!existing) {
        map.set(other._id, {
          personId: other._id,
          personName: other.name,
          personPicture: other.profilePicture,
          roomIds: [room._id],
          activeRoomId: room._id,
          lastMessageText: room.lastMessage?.text,
          lastMessageSender: room.lastMessage?.sender,
          lastMessageTimestamp: room.lastMessage?.timestamp,
          unreadCount: room.unreadCount || 0,
        });
      } else {
        existing.roomIds.push(room._id);
        existing.unreadCount = (existing.unreadCount || 0) + (room.unreadCount || 0);
        const existingTs = existing.lastMessageTimestamp ? new Date(existing.lastMessageTimestamp).getTime() : 0;
        if (roomLastTs > existingTs) {
          existing.activeRoomId = room._id;
          existing.lastMessageText = room.lastMessage?.text;
          existing.lastMessageSender = room.lastMessage?.sender;
          existing.lastMessageTimestamp = room.lastMessage?.timestamp;
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const tA = a.lastMessageTimestamp ? new Date(a.lastMessageTimestamp).getTime() : 0;
      const tB = b.lastMessageTimestamp ? new Date(b.lastMessageTimestamp).getTime() : 0;
      return tB - tA;
    });
  }, [rooms, user?._id]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => c.personName.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const forwardFilteredConversations = useMemo(() => {
    if (!forwardSearchQuery.trim()) return conversations;
    const q = forwardSearchQuery.toLowerCase();
    return conversations.filter((c) => c.personName.toLowerCase().includes(q));
  }, [conversations, forwardSearchQuery]);

  // ── Fetch rooms ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const { data } = await apiClient.get("/messages/rooms");
        const filteredRooms = (data.data || []).filter((r: any) => r.contextType !== "booking" && r.contextType !== "request");
        setRooms(filteredRooms);
        
        if (roomIdParam) {
          const targetRoom = filteredRooms.find((r: any) => r._id === roomIdParam);
          if (targetRoom) {
            const other = targetRoom.participants.find((p: any) => p._id !== user?._id);
            if (other) {
              setActiveConvo({
                personId: other._id,
                personName: other.name,
                personPicture: other.profilePicture,
                roomIds: [targetRoom._id],
                activeRoomId: targetRoom._id,
              });
            }
          }
        }
      } catch { console.error("Failed to load rooms"); }
      finally { setLoadingRooms(false); }
    };
    fetchRooms();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-select room from URL param
  useEffect(() => {
    if (!roomIdParam || autoSelectedRef.current || conversations.length === 0) return;
    const matched = conversations.find((c) => c.roomIds.includes(roomIdParam));
    if (matched) { autoSelectedRef.current = true; setActiveConvo(matched); }
  }, [conversations, roomIdParam]);

  // ── Socket ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?._id) return;
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

    const newSocket = io(socketUrl, {
      auth: { token: currentToken },
      transports: ["websocket", "polling"],
      reconnection: true, reconnectionAttempts: 5,
      reconnectionDelay: 1000, reconnectionDelayMax: 5000,
    });

    newSocket.on("connect_error", (err) => {
      console.warn("Chat Socket Error:", err.message);
      if (err.message.includes("Authentication error")) {
        const freshToken = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (freshToken && freshToken !== currentToken) {
          currentToken = freshToken;
          // @ts-ignore
          newSocket.auth.token = currentToken;
          newSocket.connect();
        }
      }
    });

    newSocket.on("receive_message", (msg: Message) => {
      const isActive = activeConvoRef.current?.roomIds.includes(msg.roomId);
      
      if (isActive) {
        setMessages((m) => dedupMessages([...m, msg]));
        newSocket.emit("mark_seen", { roomId: msg.roomId });
        window.dispatchEvent(new Event("chat-messages-read"));
      }

      setRooms((prev) =>
        prev.map((r) =>
          r._id === msg.roomId
            ? { 
                ...r, 
                lastMessage: { text: msg.text, sender: msg.sender._id, timestamp: msg.createdAt },
                unreadCount: isActive ? 0 : (r.unreadCount || 0) + (msg.sender._id !== user?._id ? 1 : 0)
              }
            : r
        )
      );
    });

    newSocket.on("message_updated", (data: any) => {
      setMessages(prev => prev.map(m => m._id === data.messageId ? { ...m, text: data.text, isEdited: data.isEdited, editedAt: data.editedAt } : m));
    });

    newSocket.on("message_deleted", (data: any) => {
      setMessages(prev => prev.map(m => m._id === data.messageId ? { ...m, text: "", attachment: undefined, isDeleted: true } : m));
    });

    newSocket.on("messages_seen", (data: any) => {
      setMessages(prev => prev.map(m => {
        if (!m.seenBy?.includes(data.userId)) {
          return { ...m, seenBy: [...(m.seenBy || []), data.userId] };
        }
        return m;
      }));
    });

    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  // ── Load messages for active conversation ───────────────────────────────────
  useEffect(() => {
    if (!activeConvo || !socket) return;
    activeConvo.roomIds.forEach((rid) => socket.emit("join_room", rid));

    let aborted = false; // guard against StrictMode double-run
    const loadAllMessages = async () => {
      setLoadingMessages(true);
      try {
        const results = await Promise.all(
          activeConvo.roomIds.map((rid) => apiClient.get(`/messages/rooms/${rid}`).then((r) => r.data.data || []))
        );
        if (aborted) return; // second StrictMode run cancelled the first
        setMessages(dedupMessages(results.flat()));
        activeConvo.roomIds.forEach((rid) => socket.emit("mark_seen", { roomId: rid }));
        window.dispatchEvent(new Event("chat-messages-read"));
      } catch { if (!aborted) console.error("Failed to load messages"); }
      finally { if (!aborted) setLoadingMessages(false); }
    };
    loadAllMessages();
    return () => { aborted = true; }; // cleanup cancels in-flight load
  }, [activeConvo, socket]);

  useEffect(() => {
    window.dispatchEvent(new Event(activeConvo ? "chat-opened" : "chat-closed"));
    return () => { window.dispatchEvent(new Event("chat-closed")); };
  }, [activeConvo]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Focus edit input when entering edit mode
  useEffect(() => {
    if (editingId) setTimeout(() => editInputRef.current?.focus(), 50);
  }, [editingId]);


  // ── File picker ──────────────────────────────────────────────────────────────────
  const handleFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const fileType = file.type.startsWith("image/") ? "image" : ext === "pdf" ? "pdf" : "file";
    setAttachmentPreview({ url: localUrl, fileType, fileName: file.name, file });
    // reset input so same file can be re-selected
    e.target.value = "";
  };

  const cancelAttachment = () => {
    if (attachmentPreview?.url.startsWith("blob:")) URL.revokeObjectURL(attachmentPreview.url);
    setAttachmentPreview(null);
  };

  // ── Voice recording ──────────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioPreviewUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch { alert("Microphone access denied."); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setRecording(false);
  };

  const cancelVoice = () => {
    if (recording) stopRecording();
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioBlob(null);
    setAudioPreviewUrl(null);
    setAudioPlaying(false);
    setRecordingSeconds(0);
  };

  const toggleAudioPlay = () => {
    if (!audioPreviewRef.current) return;
    if (audioPlaying) { audioPreviewRef.current.pause(); setAudioPlaying(false); }
    else { audioPreviewRef.current.play(); setAudioPlaying(true); }
  };

  const fmtTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // ── Upload helper ──────────────────────────────────────────────────────────────────
  const uploadMedia = async (file: File | Blob, fileName: string): Promise<{ url: string; fileType: string; fileName: string; public_id?: string; resource_type?: string } | null> => {
    const fd = new FormData();
    fd.append("file", file, fileName);
    try {
      const { data } = await apiClient.post("/messages/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { url: data.url, fileType: data.fileType, fileName: data.fileName, public_id: data.public_id, resource_type: data.resource_type };
    } catch { console.error("Upload failed"); return null; }
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvo || !socket) return;
    const hasText = newMessage.trim().length > 0;
    const hasAttachment = !!attachmentPreview;
    const hasVoice = !!audioBlob;
    if (!hasText && !hasAttachment && !hasVoice) return;

    setUploading(true);
    try {
      let attachment: { url: string; fileType: string; fileName: string; public_id?: string; resource_type?: string } | undefined;

      if (hasVoice && audioBlob) {

        const res = await uploadMedia(audioBlob, `voice-${Date.now()}.webm`);
        if (res) attachment = res;
        cancelVoice();
      } else if (hasAttachment && attachmentPreview) {
        const res = await uploadMedia(attachmentPreview.file, attachmentPreview.fileName);
        if (res) attachment = res;
        cancelAttachment();
      }

      socket.emit("send_message", {
        roomId: activeConvo.activeRoomId,
        text: hasText ? newMessage.trim() : (hasVoice ? "" : ""),
        attachment,
        replyTo: replyingToMessage?._id
      });
      setNewMessage("");
      setReplyingToMessage(null);
      setShowEmojiPicker(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } finally {
      setUploading(false);
    }
  };

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`message-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMsgId(msgId);
      setTimeout(() => setHighlightedMsgId(null), 2000);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Text copied");
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const localUrl = URL.createObjectURL(file);
          setAttachmentPreview({ url: localUrl, fileType: "image", fileName: file.name, file });
          e.preventDefault();
          break;
        }
      }
    }
  };

  // ── Edit ────────────────────────────────────────────────────────────────────
  const startEdit = (msg: Message) => {
    setEditingId(msg._id);
    setEditText(msg.text);
  };

  const submitEdit = async (msgId: string) => {
    if (!editText.trim()) return;
    if (!activeConvo || !socket) return;
    socket.emit("edit_message", {
      roomId: activeConvo.activeRoomId,
      messageId: msgId,
      text: editText.trim()
    });
    setEditingId(null); 
    setEditText("");
  };

  const cancelEdit = () => { setEditingId(null); setEditText(""); };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (msgId: string) => {
    setMessageToDelete(msgId);
  };

  const confirmDelete = async () => {
    if (!messageToDelete) return;
    
    // Optimistic update so UI reflects immediately
    setMessages(prev => prev.map(m => 
      m._id === messageToDelete 
        ? { ...m, isDeleted: true, text: "", attachment: undefined } 
        : m
    ));

    socket?.emit("delete_message", {
      roomId: activeConvo?.activeRoomId,
      messageId: messageToDelete
    });
    setMessageToDelete(null);
    toast.success("Message deleted");
  };

  // ── Forward ─────────────────────────────────────────────────────────────────
  const handleForward = (targetRoomId: string) => {
    if (!forwardingMessage || !socket) return;
    socket.emit("send_message", {
      roomId: targetRoomId,
      text: forwardingMessage.text,
      attachment: forwardingMessage.attachment,
      isForwarded: true
    });
    setForwardingMessage(null);
    setForwardSearchQuery("");
    toast.success("Message forwarded successfully!");
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex h-full w-full bg-white dark:bg-[#0F172A] md:rounded-2xl overflow-hidden md:shadow-lg border-y md:border border-gray-100 dark:border-white/5">

        {/* Sidebar */}
        <div className={`${activeConvo ? "hidden md:flex" : "flex"} flex-col w-full md:w-[320px] lg:w-[380px] shrink-0 border-r border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#1E293B]`}>
          <div className="p-6 border-b border-gray-100 dark:border-white/5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-white/5 shrink-0 active:scale-95 transition-transform"
                onClick={() => window.dispatchEvent(new Event("open-mobile-menu"))}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
              </button>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Messages</h2>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search conversations..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/5 rounded-full py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-[#FF8C00]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingRooms ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-sm font-medium text-gray-500">No conversations yet.</div>
            ) : (
              filteredConversations.map((convo) => {
                const isActive = activeConvo?.personId === convo.personId;
                return (
                  <button key={convo.personId}
                    onClick={() => { 
                      setMessages([]); 
                      setActiveConvo(convo);
                      setRooms(prev => prev.map(r => convo.roomIds.includes(r._id) ? { ...r, unreadCount: 0 } : r));
                    }}
                    className={`w-full text-left p-4 border-b border-gray-100 dark:border-white/5 flex gap-3 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors ${isActive ? "bg-white dark:bg-[#0F172A]" : ""}`}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-white dark:border-[#334155]">
                      {convo.personPicture ? (
                        <img loading="lazy" src={convo.personPicture} alt={convo.personName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#1A331B] text-white flex items-center justify-center font-bold">
                          {convo.personName?.charAt(0) || "U"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-bold text-sm text-gray-900 dark:text-white truncate pr-2">{convo.personName}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {convo.unreadCount ? (
                            <span className="bg-[#FF8C00] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                              {convo.unreadCount > 99 ? '99+' : convo.unreadCount}
                            </span>
                          ) : null}
                          <span className="text-[10px] text-gray-400 font-medium">
                            {convo.lastMessageTimestamp ? format(new Date(convo.lastMessageTimestamp), "MMM d") : ""}
                          </span>
                        </div>
                      </div>
                      <p className={`text-xs truncate ${convo.unreadCount ? "text-gray-900 font-semibold dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
                        {convo.lastMessageText
                          ? (convo.lastMessageSender === user?._id ? `You: ${convo.lastMessageText}` : convo.lastMessageText)
                          : "No messages yet"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className={`${activeConvo ? "flex" : "hidden md:flex"} flex-1 flex-col relative`}>
          {activeConvo ? (
            <>
              {/* Header */}
              <div className="h-20 shrink-0 border-b border-gray-100 dark:border-white/5 px-6 flex items-center bg-white dark:bg-[#0F172A] z-10">
                <button onClick={() => setActiveConvo(null)} className="md:hidden text-gray-400 hover:text-gray-900 dark:hover:text-white mr-4">
                  <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-[#334155] hidden sm:block mr-4">
                  {activeConvo.personPicture ? (
                    <img loading="lazy" src={activeConvo.personPicture} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#1A331B] text-white flex items-center justify-center font-bold">
                      {activeConvo.personName?.charAt(0) || "U"}
                    </div>
                  )}
                </div>
                <div>
                  <span className="font-black text-lg text-gray-900 dark:text-white leading-tight block">{activeConvo.personName}</span>
                  <span className="text-xs font-bold text-emerald-500">Live Secure Chat</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 bg-[#F1F5F9]/50 dark:bg-[#0F172A] flex flex-col gap-4">
                {loadingMessages ? (
                  <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-gray-400" /></div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <User size={24} className="text-gray-400" />
                    </div>
                    <p className="font-bold">This is the start of the conversation.</p>
                    <p className="text-sm mt-1">Messages are securely encrypted and monitored for safety.</p>
                  </div>
                ) : (
                  messages.filter(msg => !msg.isDeleted).map((msg, idx, arr) => {
                    const isMe = msg.sender._id === user?._id;
                    const showAvatar = idx === 0 || arr[idx - 1].sender._id !== msg.sender._id;
                    const isEditing = editingId === msg._id;

                    return (
                      <div
                        id={`message-${msg._id}`}
                        key={msg._id}
                        className={`flex gap-2 max-w-[85%] md:max-w-[70%] lg:max-w-[60%] ${isMe ? "self-end flex-row-reverse" : "self-start"} ${highlightedMsgId === msg._id ? "animate-pulse ring-2 ring-yellow-400 rounded-2xl" : ""}`}
                        onMouseEnter={() => setHoveredMsgId(msg._id)}
                        onMouseLeave={() => setHoveredMsgId(null)}
                      >
                        {/* Avatar */}
                        {showAvatar ? (
                          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-auto bg-gray-200">
                            {msg.sender.profilePicture ? (
                              <img loading="lazy" src={msg.sender.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-[#1A331B] text-white flex items-center justify-center text-xs font-bold">
                                {msg.sender.name.charAt(0)}
                              </div>
                            )}
                          </div>
                        ) : <div className="w-8 shrink-0" />}

                        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                          {showAvatar && (
                            <span className="text-[10px] font-bold text-gray-400 mb-1 ml-1 flex items-center gap-1.5">
                              {msg.sender.name}
                              {msg.sender.role === "admin" && (
                                <span className="text-[9px] text-[#FF8C00] flex items-center gap-1 bg-[#FF8C00]/10 px-1.5 py-0.5 rounded-full">
                                  <ShieldAlert size={9} /> Admin
                                </span>
                              )}
                            </span>
                          )}

                          {/* Bubble + action button */}
                          <div className={`flex items-end gap-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>

                            {/* Inline Edit / Delete / Reply / Forward buttons — shown on hover */}
                            {!msg.isDeleted && !isEditing && (
                              <div
                                className={`flex items-center gap-1 mb-1 shrink-0 ${isMe ? 'flex-col' : 'flex-col-reverse'}`}
                                style={{ opacity: hoveredMsgId === msg._id ? 1 : 0, transition: 'opacity 0.15s', pointerEvents: hoveredMsgId === msg._id ? 'auto' : 'none' }}
                              >
                                <button onClick={() => handleCopy(msg.text)} title="Copy" className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 text-gray-500 hover:text-[#FF8C00] transition-colors">
                                  <Copy size={13} />
                                </button>
                                <button onClick={() => setReplyingToMessage(msg)} title="Reply" className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 text-gray-500 hover:text-[#FF8C00] transition-colors">
                                  <Reply size={13} />
                                </button>
                                <button onClick={() => setForwardingMessage(msg)} title="Forward" className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 text-gray-500 hover:text-[#FF8C00] transition-colors">
                                  <Forward size={13} />
                                </button>

                                {isMe && (
                                  <>
                                    <button
                                      onClick={() => startEdit(msg)}
                                      title="Edit message"
                                      className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 shadow-sm transition-colors"
                                    >
                                      <Pencil size={13} />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(msg._id)}
                                      title="Delete message"
                                      className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 shadow-sm transition-colors"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </>
                                )}
                              </div>
                            )}

                            <div>
                              {/* Inline edit mode */}
                              {isEditing ? (
                                <div className="flex items-center gap-2 bg-white dark:bg-[#1E293B] border border-[#FF8C00] rounded-2xl px-3 py-2 shadow-md min-w-[180px]">
                                  <input
                                    ref={editInputRef}
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") submitEdit(msg._id);
                                      if (e.key === "Escape") cancelEdit();
                                    }}
                                    className="flex-1 bg-transparent text-sm font-medium text-gray-900 dark:text-white outline-none"
                                  />
                                  <button onClick={() => submitEdit(msg._id)} title="Save" className="text-emerald-500 hover:text-emerald-600 shrink-0"><Check size={16} /></button>
                                  <button onClick={cancelEdit} title="Cancel" className="text-gray-400 hover:text-red-400 shrink-0"><X size={16} /></button>
                                </div>
                              ) : (
                                <div className={`px-4 py-3 rounded-2xl text-sm font-medium shadow-sm flex flex-col relative ${
                                  isMe
                                    ? "bg-[#1A331B] text-white rounded-br-none"
                                    : "bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white rounded-bl-none border border-gray-100 dark:border-white/5"
                                }`}>
                                  
                                  {msg.isForwarded && (
                                    <div className={`text-[10px] font-bold italic mb-1 flex items-center gap-1 ${isMe ? 'text-gray-300' : 'text-gray-400'}`}>
                                      <Forward size={10} /> Forwarded
                                    </div>
                                  )}

                                  {msg.replyTo && (
                                    <div onClick={() => msg.replyTo && scrollToMessage(msg.replyTo._id)} className={`cursor-pointer px-3 py-2 rounded-lg text-xs border-l-4 mb-2 transition-opacity hover:opacity-80 ${isMe ? 'bg-white/20 border-white text-white' : 'bg-gray-50 dark:bg-black/20 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
                                      <div className="font-bold mb-0.5">{msg.replyTo.sender?.name || 'Unknown'}</div>
                                      <div className="truncate opacity-80">{msg.replyTo.text || (msg.replyTo.attachment ? 'Attachment' : '')}</div>
                                    </div>
                                  )}

                                  {!msg.isDeleted && msg.attachment?.url && (
                                    <div className="mb-2">
                                      {msg.attachment.fileType === "image" ? (
                                        <div className="relative group inline-block">
                                          <img
                                            loading="lazy"
                                            src={msg.attachment.url}
                                            alt="Attachment"
                                            className="max-w-[200px] sm:max-w-[280px] rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => window.open(msg.attachment?.url, "_blank")}
                                          />
                                          <button 
                                            onClick={(e) => handleDownload(msg.attachment!.url, msg.attachment!.fileName, e)}
                                            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Download Image"
                                          >
                                            <Download size={16} />
                                          </button>
                                        </div>
                                      ) : msg.attachment.fileType === "audio" ? (
                                        <div className={`flex items-center gap-2 p-2 pr-3 rounded-xl ${isMe ? "bg-black/20" : "bg-gray-100 dark:bg-black/20"}`}>
                                          <Mic size={16} className={isMe ? "text-white/70" : "text-[#FF8C00]"} />
                                          <audio
                                            src={msg.attachment.url}
                                            controls
                                            className="h-8 max-w-[180px]"
                                            style={{ filter: isMe ? "invert(1) brightness(0.85)" : "none" }}
                                          />
                                        </div>
                                      ) : (
                                        <div className={`flex items-center justify-between gap-4 p-2 pr-3 rounded-xl ${isMe ? "bg-black/20 text-white" : "bg-gray-100 dark:bg-black/30 text-[#FF8C00]"}`}>
                                          <a
                                            href={msg.attachment.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 hover:opacity-80"
                                          >
                                            <FileText size={16} />
                                            <span className="truncate max-w-[150px] text-xs font-semibold">{msg.attachment.fileName}</span>
                                          </a>
                                          <button 
                                            onClick={(e) => handleDownload(msg.attachment!.url, msg.attachment!.fileName, e)}
                                            className={`hover:scale-110 transition-transform ${isMe ? "text-white/80 hover:text-white" : "text-[#FF8C00]/80 hover:text-[#FF8C00]"}`}
                                            title="Download File"
                                          >
                                            <Download size={16} />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {msg.text && msg.text !== "[Attachment]" && <span>{msg.text}</span>}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Timestamp + edited badge */}
                          <div className="flex items-center gap-1.5 mt-1 mx-1">
                            <span className="text-[9px] text-gray-400 font-medium">
                              {format(new Date(msg.createdAt), "h:mm a")}
                            </span>
                            {msg.isEdited && !msg.isDeleted && (
                              <span className="text-[9px] text-gray-400 italic">edited</span>
                            )}
                            {isMe && (
                              msg.seenBy && msg.seenBy.length > 0 && !msg.seenBy.every(id => id === user?._id)
                                ? <CheckCheck size={12} className="text-[#10B981]" />
                                : <Check size={12} className="text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="shrink-0 bg-white dark:bg-[#0F172A] border-t border-gray-100 dark:border-white/5 flex flex-col">
                
                {/* Reply Preview Strip */}
                {replyingToMessage && (
                  <div className="px-4 pt-3 pb-1 flex items-center">
                    <div className="flex items-center justify-between w-full max-w-md bg-gray-50 dark:bg-[#1E293B] border-l-4 border-[#FF8C00] rounded-r-xl p-3 shadow-sm relative">
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <span className="text-xs font-bold text-[#FF8C00] flex items-center gap-1.5"><Reply size={12}/> Replying to {replyingToMessage.sender.name}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{replyingToMessage.text || (replyingToMessage.attachment ? 'Attachment' : '')}</span>
                      </div>
                      <button onClick={() => setReplyingToMessage(null)} className="w-6 h-6 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors shrink-0">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Attachment preview strip */}
                {(attachmentPreview || audioPreviewUrl) && !recording && (
                  <div className="px-4 pt-3 flex items-center gap-3">
                    {attachmentPreview && (
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#1E293B] rounded-xl px-3 py-2 border border-gray-200 dark:border-white/10 max-w-xs">
                        {attachmentPreview.fileType === "image" ? (
                          <img src={attachmentPreview.url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                            <FileText size={18} className="text-red-400" />
                          </div>
                        )}
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{attachmentPreview.fileName}</span>
                        <button onClick={cancelAttachment} className="text-gray-400 hover:text-red-400 ml-auto shrink-0"><X size={14} /></button>
                      </div>
                    )}
                    {audioPreviewUrl && (
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#1E293B] rounded-xl px-3 py-2 border border-gray-200 dark:border-white/10">
                        <button onClick={toggleAudioPlay} className="w-8 h-8 rounded-full bg-[#FF8C00] text-white flex items-center justify-center shrink-0">
                          {audioPlaying ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <audio ref={audioPreviewRef} src={audioPreviewUrl} onEnded={() => setAudioPlaying(false)} className="hidden" />
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Voice message</span>
                        <span className="text-[10px] text-gray-400">{fmtTime(recordingSeconds)}</span>
                        <button onClick={cancelVoice} className="text-gray-400 hover:text-red-400 ml-1 shrink-0"><X size={14} /></button>
                      </div>
                    )}
                  </div>
                )}

                {/* Recording indicator */}
                {recording && (
                  <div className="px-4 pt-3 flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2 border border-red-200 dark:border-red-500/20">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                      <span className="text-xs font-bold text-red-500">{fmtTime(recordingSeconds)}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Recording…</span>
                      <button onClick={stopRecording} className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded-full ml-2">Stop</button>
                      <button onClick={cancelVoice} className="text-gray-400 hover:text-red-400 shrink-0"><X size={14} /></button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSend} className="p-3 flex items-center gap-2">
                  {/* Hidden file inputs */}
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChosen} />
                  <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChosen} />

                  {/* Image button */}
                  <button type="button" onClick={() => imageInputRef.current?.click()}
                    title="Send image"
                    className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-[#FF8C00] transition-colors"
                  >
                    <ImageIcon size={17} />
                  </button>

                  {/* PDF button */}
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    title="Send PDF"
                    className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-[#FF8C00] transition-colors"
                  >
                    <FileUp size={17} />
                  </button>

                  {/* Mic button */}
                  <button type="button"
                    onClick={recording ? stopRecording : startRecording}
                    title={recording ? "Stop recording" : "Record voice"}
                    className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-full border transition-colors ${
                      recording
                        ? "border-red-300 bg-red-50 dark:bg-red-500/10 text-red-500"
                        : "border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-[#FF8C00]"
                    }`}
                  >
                    {recording ? <MicOff size={17} /> : <Mic size={17} />}
                  </button>

                  {/* Text input */}
                  <div className="flex-1 flex flex-col relative">
                    {showEmojiPicker && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                        <div className="absolute bottom-[calc(100%+0.5rem)] left-0 z-50 shadow-2xl rounded-2xl overflow-hidden">
                          <EmojiPicker 
                            onEmojiClick={(emoji) => setNewMessage(prev => prev + emoji.emoji)}
                            theme={"auto" as any}
                            height={320}
                            width={300}
                          />
                        </div>
                      </>
                    )}
                    <div className="flex-1 flex items-end bg-gray-50 dark:bg-[#1E293B] rounded-[1.5rem] border border-gray-100 dark:border-white/5 focus-within:border-[#FF8C00] transition-colors pl-2 pr-4 py-1.5 relative group">
                      <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors shrink-0 mb-0.5">
                        <Smile size={18} />
                      </button>
                      <textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={handleTextareaInput}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        placeholder={attachmentPreview ? "Add a caption…" : audioPreviewUrl ? "Voice message ready" : "Type a message…"}
                        disabled={recording}
                        rows={1}
                        className="flex-1 bg-transparent border-none outline-none text-sm font-medium py-2.5 text-gray-900 dark:text-white placeholder-gray-400 disabled:opacity-50 resize-none custom-scrollbar"
                        style={{ maxHeight: '120px' }}
                      />
                    </div>
                  </div>

                  {/* Send button */}
                  <button
                    type="submit"
                    disabled={uploading || (!newMessage.trim() && !attachmentPreview && !audioBlob)}
                    className="w-10 h-10 shrink-0 rounded-full bg-[#FF8C00] text-white flex items-center justify-center hover:bg-[#e67e22] transition-colors disabled:opacity-50 shadow-md shadow-[#FF8C00]/20"
                  >
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </form>
              </div>

            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F1F5F9]/50 dark:bg-[#0F172A]">
              <div className="w-24 h-24 bg-white dark:bg-[#1E293B] rounded-full flex items-center justify-center shadow-sm mb-6 border border-gray-100 dark:border-white/5">
                <Send size={32} className="text-gray-300 dark:text-gray-600 ml-1" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Select a Conversation</h3>
              <p className="text-sm font-medium text-gray-500 max-w-sm">Choose a conversation from the sidebar to view your message history.</p>
            </div>
          )}
        </div>
      </div>

      {/* Forward Modal */}
      {forwardingMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10">
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Forward className="text-[#FF8C00]" /> Forward Message
              </h3>
              <button onClick={() => setForwardingMessage(null)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-[#0F172A] border-b border-gray-100 dark:border-white/10">
               <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search conversations..." 
                  value={forwardSearchQuery}
                  onChange={e => setForwardSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:border-[#FF8C00]"
                />
               </div>
            </div>

            <div className="max-h-64 overflow-y-auto p-2">
              {forwardFilteredConversations.length === 0 ? (
                 <div className="p-6 text-center text-sm text-gray-500">No conversations found.</div>
              ) : (
                forwardFilteredConversations.map(convo => (
                  <button 
                    key={convo.personId}
                    onClick={() => handleForward(convo.activeRoomId)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors text-left group"
                  >
                    <div className="w-10 h-10 rounded-full border border-gray-200 dark:border-[#334155] flex items-center justify-center overflow-hidden shrink-0">
                       {convo.personPicture ? (
                         <img src={convo.personPicture} className="w-full h-full object-cover"/>
                       ) : (
                         <div className="w-full h-full bg-[#1A331B] text-white flex items-center justify-center font-bold text-sm">
                           {convo.personName.charAt(0)}
                         </div>
                       )}
                    </div>
                    <div className="flex-1 truncate text-sm font-bold text-gray-900 dark:text-gray-100">{convo.personName}</div>
                    <Send size={16} className="text-gray-400 group-hover:text-[#FF8C00]" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {messageToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 text-red-500 flex items-center justify-center mb-4 mx-auto">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-black text-center text-gray-900 dark:text-white mb-2">Delete Message?</h3>
              <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">Are you sure you want to delete this message? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setMessageToDelete(null)} className="flex-1 py-2.5 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
