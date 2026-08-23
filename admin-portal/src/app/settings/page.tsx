"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Shield, 
  Globe, 
  Send, 
  AlertTriangle, 
  Loader2,
  Lock,
  User as UserIcon,
  Phone,
  MapPin,
  KeyRound,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  Eye,
  EyeOff,
  Mail,
  Camera,
  ShieldCheck
} from "lucide-react";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";
import { confirmAction } from "@/utils/confirmAlert";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

// Helper for password strength
const getPasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: "None", color: "bg-slate-200 dark:bg-slate-700" };
  if (password.length < 8) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) return { score: 3, label: "Strong", color: "bg-emerald-500" };
  return { score: 2, label: "Fair", color: "bg-amber-500" };
};

export default function SettingsPage() {
  const { updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "system">("profile");

  // Profile State
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "", // read-only
    phone: "",
    location: "",
    profilePicture: "",
  });
  const [imageUploading, setImageUploading] = useState(false);

  // Password State
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // System Broadcast State
  const [announcement, setAnnouncement] = useState({ title: "", message: "", priority: "NORMAL" });
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  // Load Profile Data on Mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await apiClient.get(apiClient.defaults.baseURL?.replace('/admin', '') + "/users/profile");
        setProfileData({
          name: data.data.name || "",
          email: data.data.email || "",
          phone: data.data.phone || "",
          location: data.data.location || "",
          profilePicture: data.data.profilePicture || "",
        });
      } catch (err) {
        toast.error("Failed to load profile data");
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword && passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }

    if (passwordData.newPassword && passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setSavingProfile(true);
    try {
      const payload: any = {
        name: profileData.name,
        phone: profileData.phone,
        location: profileData.location,
      };

      if (passwordData.newPassword) {
        payload.password = passwordData.newPassword;
      }

      await apiClient.put(apiClient.defaults.baseURL?.replace('/admin', '') + "/users/profile", payload);
      updateUser({ name: profileData.name });
      toast.success("Profile updated successfully!");
      
      // Clear password fields after successful save
      setPasswordData({ newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setImageUploading(true);
    try {
      // Must not use apiClient due to Content-Type headers for FormData,
      // but we need to pass the Authorization token manually
      const token = localStorage.getItem("adminToken");
      const res = await fetch(apiClient.defaults.baseURL?.replace('/admin', '') + "/users/profile-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      
      setProfileData(prev => ({ ...prev, profilePicture: data.data.profilePicture }));
      updateUser({ profilePicture: data.data.profilePicture });
      toast.success("Profile picture updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setImageUploading(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    const isConfirmed = await confirmAction("Confirm Broadcast?", "Send this message to ALL registered users?");
    if (!isConfirmed) return;
    
    setBroadcastLoading(true);
    try {
      await apiClient.post("/announcements", announcement);
      toast.success("Broadcast successful!");
      setAnnouncement({ title: "", message: "", priority: "NORMAL" });
    } catch (err) {
      toast.error("Broadcast failed");
    } finally {
      setBroadcastLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-[#F8FAFC] pb-24 md:pb-12 font-sans overflow-x-hidden">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-slate-50/90 dark:bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-200 dark:border-[#334155] px-4 py-4 md:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm">Settings</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Manage your profile and platform policies.</p>
          </div>

          {/* Segmented Tabs */}
          <div className="flex bg-slate-100 dark:bg-[#161B26] p-1.5 rounded-2xl border border-slate-200 dark:border-[#334155] shadow-inner relative w-full md:w-auto overflow-hidden">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`relative z-10 flex-1 md:flex-none md:w-44 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "profile" ? "text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <UserIcon size={16} /> <span className="hidden sm:inline">Personal Profile</span><span className="sm:hidden">Profile</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("system")}
              className={`relative z-10 flex-1 md:flex-none md:w-44 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "system" ? "text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Shield size={16} /> <span className="hidden sm:inline">System Control</span><span className="sm:hidden">System</span>
            </button>
            
            {/* Animated Tab Indicator */}
            <motion.div
              className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] md:w-44 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600"
              initial={false}
              animate={{ x: activeTab === "profile" ? 0 : "100%" }}
              style={{ left: "6px" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8 mt-2 md:mt-4">
        <AnimatePresence mode="wait">
          {activeTab === "profile" && (
            <motion.form 
              key="profile"
              id="profile-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleProfileUpdate} 
              className="space-y-6 md:space-y-8"
            >
              
              {/* Profile Card */}
              <div className="bg-white dark:bg-[#161B26] rounded-[24px] p-6 md:p-10 border border-slate-200 dark:border-[#334155] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF8C00]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3 relative z-10">
                  <UserIcon className="text-[#FF8C00]" /> General Information
                </h3>
                
                {profileLoading ? (
                  <div className="space-y-8 animate-pulse">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <div className="space-y-3">
                        <div className="w-32 h-5 bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="w-48 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                      <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                      <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                      <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                      <div className="relative group self-start">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-100 dark:bg-[#161B26] border-4 border-white dark:border-[#1E293B] shadow-md overflow-hidden flex items-center justify-center">
                          {profileData.profilePicture ? (
                            <img src={profileData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="text-slate-400" size={48} />
                          )}
                        </div>
                        <label className="absolute bottom-1 right-1 w-9 h-9 sm:w-10 sm:h-10 bg-[#FF8C00] text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-emerald-500 hover:scale-105 transition-all disabled:opacity-50 border-2 border-white dark:border-[#1E293B]">
                          {imageUploading ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={imageUploading} />
                        </label>
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-lg">Profile Picture</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Upload a high-quality headshot to build trust with users.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Floating Label Input: Full Name */}
                      <div className="relative group">
                        <input 
                          type="text"
                          id="name"
                          required 
                          value={profileData.name}
                          onChange={e => setProfileData({...profileData, name: e.target.value})}
                          className="peer w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl px-4 pt-6 pb-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] transition-all min-h-[56px] placeholder-transparent" 
                          placeholder="Full Name"
                        />
                        <label htmlFor="name" className="absolute left-4 top-2 text-[10px] font-black uppercase tracking-widest text-slate-400 peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-[#FF8C00] transition-all pointer-events-none">
                          Full Name
                        </label>
                      </div>

                      {/* Floating Label Input: Email */}
                      <div className="relative group">
                        <input 
                          type="email"
                          id="email"
                          disabled
                          value={profileData.email}
                          className="peer w-full bg-slate-100 dark:bg-[#161B26] border border-slate-200 dark:border-[#334155] rounded-xl px-4 pl-10 pt-6 pb-2 text-sm font-bold text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed min-h-[56px] placeholder-transparent" 
                          placeholder="Email"
                        />
                        <Mail className="absolute left-4 top-[22px] text-slate-400" size={16} />
                        <label htmlFor="email" className="absolute left-10 top-2 text-[10px] font-black uppercase tracking-widest text-slate-400 peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px] transition-all pointer-events-none">
                          Email Address (Read-only)
                        </label>
                      </div>

                      {/* Floating Label Input: Phone */}
                      <div className="relative group">
                        <input 
                          type="text"
                          id="phone"
                          value={profileData.phone}
                          onChange={e => setProfileData({...profileData, phone: e.target.value})}
                          className="peer w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl px-4 pl-10 pt-6 pb-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] transition-all min-h-[56px] placeholder-transparent" 
                          placeholder="Phone"
                        />
                        <Phone className="absolute left-4 top-[22px] text-slate-400 peer-focus:text-[#FF8C00] transition-colors" size={16} />
                        <label htmlFor="phone" className="absolute left-10 top-2 text-[10px] font-black uppercase tracking-widest text-slate-400 peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-[#FF8C00] transition-all pointer-events-none">
                          Phone Number
                        </label>
                      </div>

                      {/* Floating Label Input: Location */}
                      <div className="relative group">
                        <input 
                          type="text"
                          id="location"
                          value={profileData.location}
                          onChange={e => setProfileData({...profileData, location: e.target.value})}
                          className="peer w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl px-4 pl-10 pt-6 pb-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] transition-all min-h-[56px] placeholder-transparent" 
                          placeholder="Location"
                        />
                        <MapPin className="absolute left-4 top-[22px] text-slate-400 peer-focus:text-[#FF8C00] transition-colors" size={16} />
                        <label htmlFor="location" className="absolute left-10 top-2 text-[10px] font-black uppercase tracking-widest text-slate-400 peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-[#FF8C00] transition-all pointer-events-none">
                          Location
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Security Card */}
              {!profileLoading && (
                <div className="bg-white dark:bg-[#161B26] rounded-[24px] p-6 md:p-10 border border-slate-200 dark:border-[#334155] shadow-sm relative overflow-hidden">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3 relative z-10">
                    <KeyRound className="text-[#FF8C00]" /> Security
                  </h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">Leave these fields blank if you do not want to change your password.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* New Password */}
                    <div className="space-y-3">
                      <div className="relative group">
                        <input 
                          type={showPassword ? "text" : "password"}
                          id="newPassword"
                          value={passwordData.newPassword}
                          onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                          className="peer w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl px-4 pt-6 pb-2 pr-10 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] transition-all min-h-[56px] placeholder-transparent" 
                          placeholder="New Password"
                        />
                        <label htmlFor="newPassword" className="absolute left-4 top-2 text-[10px] font-black uppercase tracking-widest text-slate-400 peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-[#FF8C00] transition-all pointer-events-none">
                          New Password
                        </label>
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 w-10 h-10 flex items-center justify-center rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00]/50"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      
                      {/* Password Strength Indicator */}
                      <div className="space-y-1.5 px-1">
                        <div className="flex gap-1 h-1.5">
                          {[1, 2, 3, 4].map((i) => (
                            <div 
                              key={i} 
                              className={`flex-1 rounded-full transition-colors duration-300 ${
                                i <= passwordStrength.score ? passwordStrength.color : 'bg-slate-200 dark:bg-slate-700'
                              }`} 
                            />
                          ))}
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            {passwordStrength.label}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                            Min 8 chars, 1 uppercase, 1 number
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="relative group self-start">
                      <input 
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="peer w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl px-4 pt-6 pb-2 pr-10 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] transition-all min-h-[56px] placeholder-transparent" 
                        placeholder="Confirm Password"
                      />
                      <label htmlFor="confirmPassword" className="absolute left-4 top-2 text-[10px] font-black uppercase tracking-widest text-slate-400 peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-[#FF8C00] transition-all pointer-events-none">
                        Confirm New Password
                      </label>
                      <button 
                        type="button" 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 w-10 h-10 flex items-center justify-center rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00]/50"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Sticky Action Bar */}
              {!profileLoading && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md border-t border-slate-200 dark:border-[#334155] md:static md:bg-transparent md:border-none md:p-0 md:backdrop-blur-none flex justify-end z-30 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] md:shadow-none pb-8 md:pb-0">
                  <button 
                    type="submit"
                    disabled={savingProfile}
                    className="w-full md:w-auto bg-[#FF8C00] hover:bg-emerald-500 text-white px-8 py-3.5 min-h-[44px] rounded-xl font-black text-sm shadow-lg shadow-[#FF8C00]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {savingProfile ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                    Save Changes
                  </button>
                </div>
              )}
            </motion.form>
          )}

          {activeTab === "system" && (
            <motion.div 
              key="system"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8"
            >
              {/* ── Announcement Center ── */}
              <div className="lg:col-span-3 bg-white dark:bg-[#161B26] rounded-[24px] p-6 md:p-10 border border-slate-200 dark:border-[#334155] shadow-sm flex flex-col relative overflow-hidden group">
                {/* Subtle Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF8C00]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-opacity duration-500 opacity-50 group-hover:opacity-100" />
                
                <div className="flex items-center gap-4 mb-8 relative z-10">
                  <div className="w-12 h-12 bg-[#FF8C00]/10 rounded-xl flex items-center justify-center text-[#FF8C00] border border-[#FF8C00]/20 shadow-inner">
                    <Bell size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Broadcast Center</h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Global Notifications</p>
                  </div>
                </div>

                <form id="broadcast-form" onSubmit={handleBroadcast} className="space-y-6 flex-1 flex flex-col relative z-10">
                  {/* Floating Label Input: Subject */}
                  <div className="relative group">
                    <input 
                      type="text"
                      id="subject"
                      required 
                      value={announcement.title}
                      onChange={e => setAnnouncement({...announcement, title: e.target.value})}
                      className="peer w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl px-4 pt-6 pb-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] transition-all min-h-[56px] placeholder-transparent shadow-inner" 
                      placeholder="Subject"
                    />
                    <label htmlFor="subject" className="absolute left-4 top-2 text-[10px] font-black uppercase tracking-widest text-slate-400 peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-[#FF8C00] transition-all pointer-events-none">
                      Subject
                    </label>
                  </div>

                  {/* Message Body */}
                  <div className="relative group flex-1 flex flex-col min-h-[160px]">
                    <textarea 
                      id="message"
                      required 
                      value={announcement.message}
                      onChange={e => setAnnouncement({...announcement, message: e.target.value})}
                      className="peer w-full flex-1 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl px-4 pt-8 pb-4 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] transition-all placeholder-transparent resize-none shadow-inner" 
                      placeholder="Message Body"
                    />
                    <label htmlFor="message" className="absolute left-4 top-3 text-[10px] font-black uppercase tracking-widest text-slate-400 peer-focus:text-[#FF8C00] transition-all pointer-events-none">
                      Message Body
                    </label>
                  </div>

                  {/* Priority Segmented Control */}
                  <div className="space-y-3 pt-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Priority Level</p>
                    <div className="flex bg-slate-100 dark:bg-[#0F172A] p-1.5 rounded-2xl border border-slate-200 dark:border-[#334155] shadow-inner relative w-full overflow-hidden">
                      <button 
                        type="button"
                        onClick={() => setAnnouncement({...announcement, priority: "NORMAL"})}
                        className={`relative z-10 flex-1 py-2.5 rounded-xl font-bold text-xs transition-all min-h-[44px] flex items-center justify-center gap-2 ${
                          announcement.priority === "NORMAL" 
                            ? "text-slate-900 dark:text-white" 
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                      >
                        <Shield size={14} className={announcement.priority === "NORMAL" ? "text-slate-900 dark:text-white" : "opacity-50"} /> Normal
                      </button>
                      <button 
                        type="button"
                        onClick={() => setAnnouncement({...announcement, priority: "HIGH"})}
                        className={`relative z-10 flex-1 py-2.5 rounded-xl font-bold text-xs transition-all min-h-[44px] flex items-center justify-center gap-2 ${
                          announcement.priority === "HIGH" 
                            ? "text-[#FF8C00]" 
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                      >
                        <AlertTriangle size={14} className={announcement.priority === "HIGH" ? "text-[#FF8C00]" : "opacity-50"} /> Urgent
                      </button>

                      {/* Animated Priority Indicator */}
                      <motion.div
                        className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-[#161B26] rounded-xl shadow border ${announcement.priority === 'HIGH' ? 'border-[#FF8C00]/30 shadow-[#FF8C00]/10' : 'border-slate-200 dark:border-slate-700'}`}
                        initial={false}
                        animate={{ left: announcement.priority === "NORMAL" ? "6px" : "calc(50% + 0px)" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    </div>
                  </div>

                  {/* Desktop Action Button */}
                  <div className="hidden lg:block mt-auto pt-4">
                    <button 
                      type="submit"
                      disabled={broadcastLoading}
                      className="w-full bg-[#FF8C00] hover:bg-emerald-500 text-white py-4 min-h-[52px] rounded-xl font-black text-sm shadow-lg shadow-[#FF8C00]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {broadcastLoading ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Broadcast to All Users</>}
                    </button>
                  </div>
                </form>
              </div>

              {/* ── Global Policies ── */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Booking Rules Card */}
                <div className="bg-white dark:bg-[#161B26] rounded-[24px] p-6 border border-slate-200 dark:border-[#334155] shadow-sm flex items-center gap-5 relative overflow-hidden group cursor-not-allowed">
                  <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-[1px] z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-slate-900/80 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5">
                      <Lock size={12} /> Locked by Admin
                    </div>
                  </div>
                  
                  <div className="w-12 h-12 bg-slate-50 dark:bg-[#0F172A] rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#334155] shadow-inner relative z-10 shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="flex-1 relative z-10 min-w-0">
                    <h4 className="font-black text-slate-900 dark:text-white text-sm truncate">Booking Rules</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">Configure deposit & inventory lock.</p>
                  </div>
                  
                  {/* Premium Disabled Switch */}
                  <div className="w-12 h-6 bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full relative z-10 opacity-50 shrink-0">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-emerald-500 rounded-full shadow-sm" />
                  </div>
                </div>

                {/* Refund Policy Card */}
                <div className="bg-white dark:bg-[#161B26] rounded-[24px] p-6 border border-slate-200 dark:border-[#334155] shadow-sm flex items-center gap-5 relative overflow-hidden group cursor-not-allowed">
                  <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-[1px] z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-slate-900/80 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5">
                      <Lock size={12} /> Locked by Admin
                    </div>
                  </div>
                  
                  <div className="w-12 h-12 bg-slate-50 dark:bg-[#0F172A] rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#334155] shadow-inner relative z-10 shrink-0">
                    <Globe size={20} />
                  </div>
                  <div className="flex-1 relative z-10 min-w-0">
                    <h4 className="font-black text-slate-900 dark:text-white text-sm truncate">Refund Policy</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">Set universal cancellation windows.</p>
                  </div>
                  
                  {/* Premium Disabled Switch */}
                  <div className="w-12 h-6 bg-[#FF8C00]/20 dark:bg-[#FF8C00]/10 rounded-full relative z-10 opacity-50 shrink-0">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-[#FF8C00] rounded-full shadow-sm" />
                  </div>
                </div>

                {/* Warning Card */}
                <div className="bg-[#0F172A] rounded-[24px] p-8 text-white relative overflow-hidden shadow-xl border border-slate-800">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF8C00]/15 rounded-full blur-[64px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                  
                  <div className="relative z-10 space-y-5">
                    <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 border border-red-500/20">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight mb-2">Admin Safety Protocol</h3>
                      <p className="text-slate-400 text-sm font-medium leading-relaxed">
                        Changes made here affect the entire marketplace instantly. Use caution when broadcasting or updating financial policies.
                      </p>
                    </div>
                    <div className="pt-2 flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-300 shadow-sm flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Audit Enabled
                      </span>
                      <span className="px-3 py-1.5 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-300 shadow-sm flex items-center gap-1.5">
                        <Lock size={10} /> v1.0.4 Secure
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mobile Sticky Action Bar for Broadcast */}
              <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md border-t border-slate-200 dark:border-[#334155] z-40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] pb-8 md:pb-4">
                <button 
                  type="submit"
                  form="broadcast-form"
                  onClick={(e) => {
                    // Manual trigger for the form since it's outside the form tags on mobile
                    e.preventDefault();
                    handleBroadcast(e as any);
                  }}
                  disabled={broadcastLoading}
                  className="w-full bg-[#FF8C00] hover:bg-emerald-500 text-white py-3.5 min-h-[44px] rounded-xl font-black text-sm shadow-lg shadow-[#FF8C00]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {broadcastLoading ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Broadcast to All Users</>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
