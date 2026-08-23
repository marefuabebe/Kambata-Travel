"use client";

import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import apiClient from "@/utils/apiClient";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";
import { Send, Loader2, ArrowLeft, CheckCheck, User, Search, ShieldAlert, Zap, Paperclip, FileText, MessageSquare, Mic, Square, Edit2, Trash, X, Check, Reply, Forward, Copy, Smile } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import EmojiPicker from 'emoji-picker-react';

interface ChatRoom {
  _id: string;
  title: string;
  participants: any[];
  contextType: string;
  lastMessage?: {
    text: string;
    sender: string;
    timestamp: string;
  };
}

interface Message {
  _id: string;
  roomId: string;
  sender: {
    _id: string;
    name: string;
    profilePicture?: string;
    role: string;
  };
  text: string;
  attachment?: {
    url: string;
    fileType: string;
    fileName: string;
  };
  createdAt: string;
  isEdited?: boolean;
  editedAt?: string;
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

export default function AdminChatInterface() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [guides, setGuides] = useState<any[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Editing & Deleting State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState("");
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  // Reply State
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);

  // Forward State
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [forwardSearchTerm, setForwardSearchTerm] = useState("");

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const searchParams = useSearchParams();
  const initialGuideId = searchParams.get("guideId");
  const initialProcessed = useRef(false);

  const startDirectChat = async (guideId: string) => {
    try {
      const { data } = await apiClient.post("/messages/direct", { userId: guideId }, {
        baseURL: apiClient.defaults.baseURL?.replace('/admin', '') || "http://localhost:5000/api"
      });
      const newRoom = data.data;
      
      setRooms((prev) => {
        if (!prev.find(r => r._id === newRoom._id)) {
          return [newRoom, ...prev];
        }
        return prev;
      });
      setActiveRoom(newRoom);
    } catch (error) {
      console.error("Failed to start direct chat:", error);
    }
  };

  useEffect(() => {
    if (initialGuideId && !initialProcessed.current) {
      initialProcessed.current = true;
      startDirectChat(initialGuideId);
    }
  }, [initialGuideId]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const { data } = await apiClient.get("/messages/rooms", { 
          baseURL: apiClient.defaults.baseURL?.replace('/admin', '') || "http://localhost:5000/api" 
        });
        setRooms(data.data || []);
      } catch (error) {
        console.error("Failed to load rooms");
      } finally {
        setLoadingRooms(false);
      }
    };
    const fetchGuides = async () => {
      try {
        const { data } = await apiClient.get("/guides");
        setGuides(data.filter((g: any) => g.guideProfile?.isVerified || g.guideStatus === "approved"));
      } catch (error) {
        console.error("Failed to load guides:", error);
      }
    };
    fetchRooms();
    fetchGuides();
  }, []);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("adminToken") || localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000", {
      auth: { token }
    });

    newSocket.on("connect", () => {
      console.log("Admin Socket connected:", newSocket.id);
    });

    newSocket.on("receive_message", (msg: Message) => {
      setMessages(prev => [...prev, msg]);
      
      setRooms(prev => prev.map(r => {
        if (r._id === msg.roomId) {
          return {
            ...r,
            lastMessage: {
              text: msg.text,
              sender: msg.sender._id,
              timestamp: msg.createdAt
            }
          };
        }
        return r;
      }).sort((a, b) => {
         const tA = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
         const tB = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
         return tB - tA;
      }));
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

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (activeRoom && socket) {
      socket.emit("join_room", activeRoom._id);
      
      const fetchMessages = async () => {
        setLoadingMessages(true);
        try {
          const { data } = await apiClient.get(`/messages/rooms/${activeRoom._id}`, {
            baseURL: apiClient.defaults.baseURL?.replace('/admin', '') || "http://localhost:5000/api"
          });
          setMessages(data.data || []);
          socket.emit("mark_seen", { roomId: activeRoom._id });
        } catch (error) {
          console.error("Failed to load messages");
        } finally {
          setLoadingMessages(false);
        }
      };
      fetchMessages();
    }
  }, [activeRoom, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoom || !socket) return;
    uploadDocument(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadDocument = async (file: File) => {
    setUploadingAttachment(true);
    const formData = new FormData();
    formData.append("document", file);

    try {
      const { data } = await apiClient.post("/upload/document", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        baseURL: apiClient.defaults.baseURL?.replace('/admin', '') || "http://localhost:5000/api"
      });

      if (data.success) {
        let fileType = "pdf";
        if (file.type.startsWith("image/")) fileType = "image";
        if (file.type.startsWith("audio/")) fileType = "audio";

        socket?.emit("send_message", {
          roomId: activeRoom?._id,
          text: "",
          attachment: {
            url: data.url,
            fileType: fileType,
            fileName: file.name
          },
          replyTo: replyingToMessage?._id
        });
        setReplyingToMessage(null);
      }
    } catch (error) {
      console.error("Failed to upload attachment:", error);
    } finally {
      setUploadingAttachment(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
        uploadDocument(audioFile);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone error:", error);
      alert("Could not access microphone for audio recording.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom || !socket) return;

    socket.emit("send_message", {
      roomId: activeRoom._id,
      text: newMessage.trim(),
      replyTo: replyingToMessage?._id
    });
    
    setNewMessage("");
    setReplyingToMessage(null);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
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
          uploadDocument(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  const handleEditSubmit = (msgId: string) => {
    if (!editMessageText.trim() || !activeRoom || !socket) return;
    socket.emit("edit_message", {
      roomId: activeRoom._id,
      messageId: msgId,
      text: editMessageText.trim()
    });
    setEditingMessageId(null);
  };

  const handleDelete = (msgId: string) => {
    setMessageToDelete(msgId);
  };

  const confirmDelete = () => {
    if (messageToDelete && socket) {
      
      // Optimistic update
      setMessages(prev => prev.map(m => 
        m._id === messageToDelete 
          ? { ...m, isDeleted: true, text: "", attachment: undefined } 
          : m
      ));

      socket.emit("delete_message", {
        roomId: activeRoom?._id,
        messageId: messageToDelete
      });
      toast.success("Message deleted");
    }
    setMessageToDelete(null);
  };

  const handleForward = (targetRoomId: string) => {
    if (!forwardingMessage || !socket) return;
    socket.emit("send_message", {
      roomId: targetRoomId,
      text: forwardingMessage.text,
      attachment: forwardingMessage.attachment,
      isForwarded: true
    });
    setForwardingMessage(null);
    setForwardSearchTerm("");
    toast.success("Message forwarded successfully!");
  };

  const filteredGuides = guides.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const forwardFilteredGuides = guides.filter(g => g.name.toLowerCase().includes(forwardSearchTerm.toLowerCase()));

  return (
    <>
      <div className="flex h-[calc(100vh-10rem)] bg-white dark:bg-[#161B26] rounded-[2rem] overflow-hidden shadow-sm border border-gray-200 dark:border-slate-700">
        
        {/* Sidebar List */}
        <div className={`${activeRoom ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 z-10`}>
          <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex flex-col gap-5 bg-white dark:bg-[#161B26]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
                <MessageSquare className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Conversations</h2>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input 
                type="text" 
                placeholder="Search guides..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingRooms ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-500" /></div>
            ) : (
              <div className="flex flex-col">
                {/* Guides Section */}
                {filteredGuides.length > 0 && (
                  <div className="py-2">
                    <div className="px-5 py-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Available Guides</div>
                    {filteredGuides.map(guide => (
                      <button
                        key={guide._id}
                        onClick={() => startDirectChat(guide._id)}
                        className={`w-full text-left p-4 border-b border-gray-100 dark:border-white/5 flex gap-4 transition-colors hover:bg-white dark:hover:bg-slate-800 border-l-4 border-l-transparent group`}
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-gray-200 dark:bg-gray-800 border-2 border-white dark:border-white/10 shadow-sm relative">
                           {guide.profilePicture ? (
                             <img src={guide.profilePicture} alt="" className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white bg-emerald-500">
                               {guide.name?.charAt(0)}
                             </div>
                           )}
                           {guide.guideProfile?.isVerified && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                           )}
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col justify-center">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate pr-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{guide.name}</span>
                          </div>
                          <p className="text-xs truncate font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            {guide.email}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {filteredGuides.length === 0 && (
                  <div className="p-12 text-center flex flex-col items-center">
                     <div className="w-16 h-16 rounded-full border border-dashed border-gray-300 dark:border-slate-700 flex items-center justify-center mb-4 text-gray-400 dark:text-gray-600">
                        <Search size={24} />
                     </div>
                     <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No guides found.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className={`${activeRoom ? 'flex' : 'hidden md:flex'} flex-1 flex-col relative z-10 bg-white dark:bg-slate-900`}>
          {activeRoom ? (
            <>
              {/* Header */}
              <div className="h-[88px] shrink-0 border-b border-gray-100 dark:border-slate-700 px-6 flex items-center justify-between bg-white dark:bg-[#161B26]">
                <div className="flex items-center gap-4">
                  <button onClick={() => setActiveRoom(null)} className="md:hidden w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                    <ArrowLeft size={18} />
                  </button>
                  <div className="flex flex-col gap-1">
                    <span className="font-black text-xl text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                      {activeRoom.title}
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-md text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Live
                      </span>
                    </span>
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Zap size={12} className="text-blue-500 dark:text-blue-400" /> Secure Communication Channel
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar bg-gray-50 dark:bg-slate-900">
                {loadingMessages ? (
                  <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-blue-500" /></div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-500 dark:text-gray-400">
                    <div className="w-20 h-20 bg-white dark:bg-[#161B26] border border-gray-200 dark:border-slate-700 shadow-sm rounded-full flex items-center justify-center mb-6">
                      <MessageSquare size={32} className="text-blue-500" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Secure Communications Channel</h3>
                    <p className="font-medium text-sm text-gray-500 max-w-sm">No messages have been exchanged in this operation yet.</p>
                  </div>
                ) : (
                  messages.filter(msg => !msg.isDeleted).map((msg, idx, arr) => {
                    const isMe = msg.sender._id === user?._id;
                    const showAvatar = idx === 0 || arr[idx-1].sender._id !== msg.sender._id;
                    
                    return (
                      <div id={`message-${msg._id}`} key={msg._id} className={`flex gap-4 max-w-[85%] group ${isMe ? 'self-end flex-row-reverse' : 'self-start'} ${highlightedMsgId === msg._id ? 'animate-pulse ring-2 ring-yellow-400 rounded-2xl' : ''}`}>
                        {showAvatar ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 mt-auto bg-gray-200 dark:bg-gray-800 border border-gray-200 dark:border-slate-700 shadow-sm">
                             {msg.sender.profilePicture ? (
                               <img src={msg.sender.profilePicture} alt="" className="w-full h-full object-cover" />
                             ) : (
                               <div className={`w-full h-full flex items-center justify-center text-sm font-bold text-white ${msg.sender.role === 'guide' ? 'bg-emerald-500' : msg.sender.role === 'admin' ? 'bg-blue-500' : 'bg-gray-500'}`}>
                                 {msg.sender.name.charAt(0)}
                               </div>
                             )}
                          </div>
                        ) : <div className="w-10" />}
                        
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          {showAvatar && (
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-widest flex items-center gap-1.5 px-1">
                              {msg.sender.name} <span className="text-gray-300 dark:text-gray-600">·</span> 
                              <span className={msg.sender.role === 'admin' ? 'text-blue-500 dark:text-blue-400' : msg.sender.role === 'guide' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}>
                                {msg.sender.role}
                              </span>
                            </span>
                          )}

                          <div className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-center gap-2`}>
                            {/* Actions (Hover) */}
                            {!msg.isDeleted && (
                              <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 ${isMe ? 'pr-2' : 'pl-2'}`}>
                                <button onClick={() => handleCopy(msg.text)} className="text-gray-400 hover:text-blue-500 transition-colors" title="Copy">
                                  <Copy size={14} />
                                </button>
                                <button onClick={() => setReplyingToMessage(msg)} className="text-gray-400 hover:text-blue-500 transition-colors" title="Reply">
                                  <Reply size={14} />
                                </button>
                                <button onClick={() => setForwardingMessage(msg)} className="text-gray-400 hover:text-blue-500 transition-colors" title="Forward">
                                  <Forward size={14} />
                                </button>
                                {isMe && (
                                  <>
                                    <button onClick={() => { setEditingMessageId(msg._id); setEditMessageText(msg.text); }} className="text-gray-400 hover:text-blue-500 transition-colors" title="Edit">
                                      <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(msg._id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                                      <Trash size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                            
                            {/* Bubble */}
                            <div className={`px-5 py-3.5 rounded-2xl text-sm font-medium shadow-sm flex flex-col gap-2 relative ${
                                isMe 
                                ? 'bg-blue-600 text-white rounded-br-sm border border-blue-500' 
                                : 'bg-white dark:bg-[#161B26] text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-slate-700'
                            }`}>
                              {msg.isForwarded && (
                                <div className={`text-[10px] font-bold italic mb-1 flex items-center gap-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                  <Forward size={10} /> Forwarded
                                </div>
                              )}

                              {msg.replyTo && (
                                <div onClick={() => msg.replyTo && scrollToMessage(msg.replyTo._id)} className={`cursor-pointer px-3 py-2 rounded-lg text-xs border-l-4 mb-2 transition-opacity hover:opacity-80 ${isMe ? 'bg-blue-700/50 border-blue-300 text-blue-100' : 'bg-gray-50 dark:bg-black/20 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
                                  <div className="font-bold mb-0.5">{msg.replyTo.sender?.name || 'Unknown'}</div>
                                  <div className="truncate opacity-80">{msg.replyTo.text || (msg.replyTo.attachment ? 'Attachment' : '')}</div>
                                </div>
                              )}
                              {msg.attachment?.url && (
                                <div className="mb-1">
                                  {msg.attachment.fileType === "image" ? (
                                    <img src={msg.attachment.url} alt="Attachment" className="max-w-[200px] sm:max-w-[300px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.attachment?.url, "_blank")} />
                                  ) : msg.attachment.fileType === "audio" ? (
                                    <audio controls src={msg.attachment.url} className="max-w-[200px] sm:max-w-[300px] rounded" />
                                  ) : (
                                    <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-black/5 dark:bg-black/20 p-3 rounded-lg hover:bg-black/10 dark:hover:bg-black/30 transition-colors">
                                      <FileText size={20} className={isMe ? 'text-white' : 'text-blue-500'} />
                                      <span className="truncate max-w-[150px] sm:max-w-[200px]">{msg.attachment.fileName}</span>
                                    </a>
                                  )}
                                </div>
                              )}
                              
                              {editingMessageId === msg._id ? (
                                <div className="flex items-center gap-2 min-w-[200px]">
                                  <input 
                                    type="text"
                                    value={editMessageText}
                                    onChange={(e) => setEditMessageText(e.target.value)}
                                    className="flex-1 bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/10 rounded px-2 py-1 text-white dark:text-gray-100 outline-none focus:ring-1 focus:ring-white"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleEditSubmit(msg._id);
                                      if (e.key === 'Escape') setEditingMessageId(null);
                                    }}
                                  />
                                  <button onClick={() => handleEditSubmit(msg._id)} className="text-white hover:text-green-300 transition-colors"><Check size={16}/></button>
                                  <button onClick={() => setEditingMessageId(null)} className="text-white hover:text-red-300 transition-colors"><X size={16}/></button>
                                </div>
                              ) : (
                                msg.text && msg.text !== "[Attachment]" && <span>{msg.text}</span>
                              )}
                            </div>
                          </div>

                          <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold tracking-wider mt-1.5 mx-1 flex items-center gap-1">
                            {format(new Date(msg.createdAt), "h:mm a")}
                            {msg.isEdited && !msg.isDeleted && <span className="italic ml-1">(edited)</span>}
                            {isMe && (
                              msg.seenBy && msg.seenBy.length > 0 && !msg.seenBy.every(id => id === user?._id)
                                ? <CheckCheck size={10} className="text-blue-500 ml-0.5" />
                                : <Check size={10} className="text-gray-400 ml-0.5" />
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white dark:bg-[#161B26] border-t border-gray-100 dark:border-slate-700 shrink-0 flex flex-col gap-3">
                
                {/* Reply Preview */}
                {replyingToMessage && (
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-black/20 border-l-4 border-blue-500 rounded-r-xl p-3 px-4 shadow-sm relative">
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <span className="text-xs font-bold text-blue-500 dark:text-blue-400 flex items-center gap-1.5"><Reply size={12}/> Replying to {replyingToMessage.sender.name}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{replyingToMessage.text || (replyingToMessage.attachment ? 'Attachment' : '')}</span>
                    </div>
                    <button onClick={() => setReplyingToMessage(null)} className="w-6 h-6 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors shrink-0">
                      <X size={12} />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSend} className={`flex items-center gap-3 bg-gray-50 dark:bg-slate-900 rounded-[1.5rem] p-2 pr-2 border ${isRecording ? 'border-red-500/50 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500/50'} transition-all shadow-sm relative`}>
                  <div className="flex gap-2 items-center ml-2">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-[#161B26] flex items-center justify-center text-gray-400 dark:text-gray-500 shadow-sm shrink-0 border border-gray-200 dark:border-white/5">
                      <ShieldAlert size={14} />
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,.pdf,audio/*"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAttachment || isRecording}
                      className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#161B26] flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-white/10 transition-all border border-transparent dark:border-white/5"
                    >
                      {uploadingAttachment ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={uploadingAttachment}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border ${
                        isRecording 
                          ? 'bg-red-500 text-white border-red-600 animate-pulse' 
                          : 'bg-gray-200 dark:bg-[#161B26] text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-white/10 border-transparent dark:border-white/5'
                      }`}
                    >
                      {isRecording ? <Square size={12} fill="currentColor" /> : <Mic size={14} />}
                    </button>
                  </div>
                  
                  {isRecording ? (
                    <div className="flex-1 bg-transparent border-none outline-none text-sm font-medium px-2 text-red-500 dark:text-red-400 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce" /> Recording voice message...
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col relative">
                      {showEmojiPicker && (
                        <div className="absolute bottom-[calc(100%+1rem)] left-0 z-50 shadow-2xl">
                          <EmojiPicker 
                            onEmojiClick={(emoji) => setNewMessage(prev => prev + emoji.emoji)}
                            theme={"auto" as any}
                          />
                        </div>
                      )}
                      <div className="flex items-end bg-transparent w-full relative group">
                        <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="absolute left-2 bottom-1.5 p-1 text-gray-400 hover:text-gray-600 transition-colors z-10">
                          <Smile size={18} />
                        </button>
                        <textarea
                          ref={textareaRef}
                          value={newMessage}
                          onChange={handleTextareaInput}
                          onKeyDown={handleKeyDown}
                          onPaste={handlePaste}
                          placeholder="Broadcast message to guide..."
                          rows={1}
                          className="flex-1 bg-transparent border-none outline-none text-sm font-medium py-2.5 pl-10 pr-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none custom-scrollbar"
                          style={{ maxHeight: '120px' }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={(!newMessage.trim() && !isRecording) || uploadingAttachment}
                    className="w-11 h-11 rounded-[1.2rem] bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all disabled:opacity-50 shrink-0"
                  >
                    <Send size={18} className="ml-1" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-slate-900">
              <div className="w-32 h-32 bg-white dark:bg-[#161B26] rounded-full flex items-center justify-center shadow-sm border border-gray-200 dark:border-slate-700 mb-6">
                <MessageSquare size={48} className="text-blue-500" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-4">Command Center</h3>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
                Select a conversation or a guide from the sidebar to establish a secure communication link.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Forward Modal */}
      {forwardingMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#161B26] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-700">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Forward className="text-blue-500" /> Forward Message
              </h3>
              <button onClick={() => setForwardingMessage(null)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
               <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search guides to forward to..." 
                  value={forwardSearchTerm}
                  onChange={e => setForwardSearchTerm(e.target.value)}
                  className="w-full bg-white dark:bg-[#161B26] border border-gray-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                />
               </div>
            </div>

            <div className="max-h-64 overflow-y-auto p-2">
              {forwardFilteredGuides.length === 0 ? (
                 <div className="p-6 text-center text-sm text-gray-500">No guides found.</div>
              ) : (
                forwardFilteredGuides.map(guide => {
                  // Find or create room logic is trickier. Since we only have startDirectChat that modifies active room.
                  // For simplicity in UI, we fetch their direct room if it exists, but wait, `handleForward` takes `targetRoomId`.
                  // The guide list here doesn't directly map to room IDs unless we already started a chat with them.
                  // If we need a room ID, we must find the room where participants includes guide._id.
                  const existingRoom = rooms.find(r => r.participants.some(p => p._id === guide._id || p === guide._id));
                  return (
                    <button 
                      key={guide._id}
                      onClick={async () => {
                        if (existingRoom) {
                           handleForward(existingRoom._id);
                        } else {
                           try {
                             const { data } = await apiClient.post("/messages/direct", { userId: guide._id }, {
                               baseURL: apiClient.defaults.baseURL?.replace('/admin', '') || "http://localhost:5000/api"
                             });
                             handleForward(data.data._id);
                           } catch (err) {
                             console.error(err);
                           }
                        }
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold overflow-hidden shrink-0">
                         {guide.profilePicture ? <img src={guide.profilePicture} className="w-full h-full object-cover"/> : guide.name.charAt(0)}
                      </div>
                      <div className="flex-1 truncate text-sm font-bold text-gray-900 dark:text-gray-100">{guide.name}</div>
                      <Send size={16} className="text-gray-400 group-hover:text-blue-500" />
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {messageToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#161B26] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 text-red-500 flex items-center justify-center mb-4 mx-auto">
                <Trash size={24} />
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
