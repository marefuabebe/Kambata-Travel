"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/utils/apiClient";
import {
  User, Mail, Phone, MapPin, Shield, Loader2, Camera,
  Bell, Compass, Activity, Users, AlertCircle, Lock,
  Save, RotateCcw, ChevronRight, ChevronLeft, ShieldCheck, Eye, Globe, Upload,
  Moon, Trash2, X, ChevronDown, CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { applyExplorerTheme } from "@/utils/explorerTheme";

const getTabs = (t: any) => [
  { id: "general",       label: t("settings.general"),        icon: User,        desc: "Photo & contact info" },
  { id: "preferences",   label: t("settings.preferences"),    icon: Compass,     desc: "Travel style" },
  { id: "emergency",     label: t("settings.emergency"),      icon: AlertCircle, desc: "Crisis contact" },
  { id: "notifications", label: t("settings.notifications"),  icon: Bell,        desc: "Alerts & privacy" },
  { id: "security",      label: t("settings.security"),       icon: Shield,      desc: "Password & access" },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none shrink-0 ${checked ? "bg-[#FF8C00] shadow-[0_0_15px_rgba(255,140,0,0.4)]" : "bg-gray-200 dark:bg-gray-700"}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${checked ? "translate-x-6" : ""}`} />
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{label}</label>
      {children}
    </div>
  );
}

const inputCls = (icon: boolean, disabled?: boolean) =>
  `w-full text-sm rounded-xl py-3.5 outline-none transition-colors border ${icon ? "pl-12 pr-4" : "px-4"} ${
    disabled
      ? "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 cursor-not-allowed"
      : "bg-gray-50 dark:bg-[#0F172A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:border-emerald-500"
  }`;

export default function ExplorerSettings() {
  const { t } = useLanguage();
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({ name: "", phone: "", location: "", newPassword: "" });
  const [emergencyContact, setEmergencyContact] = useState({ name: "", phone: "", relation: "" });
  const [preferences, setPreferences] = useState({ difficulty: "Moderate", groupType: "Solo" });
  const [settings, setSettings] = useState({
    notifications: { emailAlerts: true, bookingUpdates: true, reminders: true },
    privacy: { profileVisibility: "public", travelHistoryVisibility: "guides_only" },
    ui: { language: "en", theme: "system" },
  });
  const [profilePicture, setProfilePicture] = useState("");
  const [rawImageFile, setRawImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setFetching(true);
    try {
      const { data } = await apiClient.get("/users/profile");
      const p = data.data;
      setFormData(prev => ({ ...prev, name: p.name || "", phone: p.phone || "", location: p.location || "", newPassword: "" }));
      if (p.emergencyContact) setEmergencyContact(p.emergencyContact);
      if (p.preferences) setPreferences(prev => ({ difficulty: p.preferences.difficulty || prev.difficulty, groupType: p.preferences.groupType || prev.groupType }));
      if (p.settings) setSettings(prev => ({
        notifications: { ...prev.notifications, ...p.settings.notifications },
        privacy: { ...prev.privacy, ...p.settings.privacy },
        ui: { ...prev.ui, ...p.settings.ui },
      }));
      if (p.settings?.ui?.theme) {
        applyExplorerTheme(p.settings.ui.theme as "light" | "dark" | "system");
      }
      if (p.profilePicture) setProfilePicture(p.profilePicture);
      setIsDirty(false);
    } catch { toast.error("Failed to load profile."); }
    finally { setFetching(false); }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be smaller than 5MB"); return; }
    setRawImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => { setProfilePicture(reader.result as string); setIsDirty(true); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword && formData.newPassword.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      if (rawImageFile) {
        const fd = new FormData();
        fd.append("image", rawImageFile);
        await apiClient.post("/users/profile-image", fd, { headers: { "Content-Type": "multipart/form-data" } });
        setRawImageFile(null);
      }
      const payload: any = { name: formData.name, phone: formData.phone, location: formData.location, emergencyContact, preferences, settings };
      if (formData.newPassword) payload.password = formData.newPassword;
      await apiClient.put("/users/profile", payload);
      applyExplorerTheme(settings.ui.theme as "light" | "dark" | "system");
      await refreshUser();
      setFormData(prev => ({ ...prev, newPassword: "" }));
      setIsDirty(false);
      toast.success("Profile saved successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save changes.");
    } finally { setLoading(false); }
  };

  if (fetching) return (
    <div className="max-w-5xl mx-auto animate-pulse space-y-6">
      <div className="h-52 bg-gray-200 dark:bg-white/5 rounded-[2.5rem]" />
      <div className="flex gap-6"><div className="w-56 space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 dark:bg-white/5 rounded-2xl" />)}</div><div className="flex-1 h-96 bg-gray-100 dark:bg-white/5 rounded-[2.5rem]" /></div>
    </div>
  );

  const avatarSrc = profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || "U")}&background=FF8C00&color=fff&size=256`;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 pt-4">
      
      {/* ── Mobile Back Button ── */}
      <div className="lg:hidden">
        <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#161B26] border border-gray-200 dark:border-white/10 rounded-xl text-gray-600 dark:text-gray-300 font-bold shadow-sm active:scale-95 transition-transform">
          <ChevronLeft size={18} />
          Back
        </button>
      </div>

      {/* ── Hero Profile Banner ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white dark:from-[#1E293B] dark:to-[#0F172A] p-8 shadow-xl shadow-teal-900/5 dark:shadow-2xl border border-teal-100/50 dark:border-white/10 mb-4">
        {/* decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#0F766E]/5 dark:bg-[#FF8C00]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-8">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-28 h-28 rounded-3xl overflow-hidden ring-4 ring-white/50 dark:ring-white/10 shadow-2xl bg-white dark:bg-gray-800">
              <img loading="lazy" src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-3 -right-3 w-10 h-10 bg-[#FF8C00] hover:bg-[#e07a00] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#FF8C00]/30 transition-all hover:-translate-y-1 z-10 border-4 border-white dark:border-[#0F172A]">
              <Camera size={16} />
            </button>
            <input type="file" hidden ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-3xl font-black text-teal-950 dark:text-white tracking-tight">{formData.name || "Your Name"}</h1>
              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/30">Explorer</span>
              {rawImageFile && <span className="text-[10px] font-black uppercase tracking-widest bg-[#FF8C00]/20 text-[#FF8C00] border border-[#FF8C00]/30 px-3 py-1.5 rounded-lg flex items-center gap-1"><Camera size={12}/> New photo</span>}
            </div>
            <p className="text-teal-700/80 dark:text-gray-400 text-sm font-medium">{user?.email}</p>
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              {formData.phone && <span className="flex items-center gap-1.5 text-xs font-bold text-teal-800 dark:text-gray-400 bg-white/50 dark:bg-white/5 border border-teal-100/50 dark:border-transparent px-3 py-1.5 rounded-lg"><Phone size={12} className="text-[#FF8C00]" />{formData.phone}</span>}
              {formData.location && <span className="flex items-center gap-1.5 text-xs font-bold text-teal-800 dark:text-gray-400 bg-white/50 dark:bg-white/5 border border-teal-100/50 dark:border-transparent px-3 py-1.5 rounded-lg"><MapPin size={12} className="text-emerald-500 dark:text-emerald-400" />{formData.location}</span>}
            </div>
          </div>

          {/* Quick upload button */}
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="hidden sm:flex items-center gap-2 px-5 py-3 rounded-xl border border-teal-200/50 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-sm font-bold text-teal-900 dark:text-white transition-all hover:-translate-y-0.5">
            <Upload size={16} /> Change Photo
          </button>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="md:w-64 shrink-0 flex flex-col gap-2 relative">
            <div className="hidden md:flex flex-col gap-2">
              {getTabs(t).map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-all duration-200 ${
                      isActive ? "bg-[#FF8C00] text-white shadow-lg shadow-[#FF8C00]/20" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                    }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isActive ? "bg-white/20" : "bg-gray-100 dark:bg-white/5"}`}>
                      <Icon size={18} className={isActive ? "text-white" : "text-gray-500 dark:text-gray-400"} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold leading-tight ${isActive ? "text-white" : "text-gray-900 dark:text-gray-200"}`}>{tab.label}</p>
                      <p className={`text-[10px] uppercase tracking-widest leading-tight mt-1 ${isActive ? "text-white/70" : "text-gray-400 dark:text-gray-500"}`}>{tab.desc}</p>
                    </div>
                    {isActive && <ChevronRight size={16} className="ml-auto opacity-70" />}
                  </button>
                );
              })}
            </div>
            
            <div className="lg:hidden w-full relative z-50" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between bg-white dark:bg-[#161B26]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm"
              >
                <span className="font-bold text-gray-900 dark:text-white flex-1 text-left">{getTabs(t).find(t => t.id === activeTab)?.label}</span>
                <ChevronDown size={18} className={`text-gray-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#161B26] border border-gray-100 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden z-50 p-2 space-y-1"
                  >
                    {getTabs(t).map(tab => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => { setActiveTab(tab.id); setIsDropdownOpen(false); }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                            isActive ? "bg-[#FF8C00] text-white" : "hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          <Icon size={16} className={isActive ? "text-white" : "text-gray-400"} />
                          <span className="text-sm font-bold">{tab.label}</span>
                          {isActive && <CheckCircle2 size={16} className="ml-auto" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab}
                initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }} 
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }} 
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-[#161B26]/60 backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm p-8 min-h-[400px]">

                {activeTab === "general" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <User className="text-[#FF8C00]" size={24} /> {t("settings.personalInfo")}
                      </h2>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">Update your name and contact details to keep your profile current.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <Field label={t("settings.name")}>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input type="text" value={formData.name} required placeholder="John Doe"
                            onChange={e => { setFormData({ ...formData, name: e.target.value }); setIsDirty(true); }}
                            className={inputCls(true)} />
                        </div>
                      </Field>
                      <Field label="Email Address">
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input type="email" value={user?.email || ""} disabled className={inputCls(true, true)} />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-2 ml-1">Email cannot be changed.</p>
                      </Field>
                      <Field label={t("settings.phone")}>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input type="tel" value={formData.phone} placeholder="+251 91 234 5678"
                            onChange={e => { setFormData({ ...formData, phone: e.target.value }); setIsDirty(true); }}
                            className={inputCls(true)} />
                        </div>
                      </Field>
                      <Field label={t("settings.location")}>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input type="text" value={formData.location} placeholder="Addis Ababa, Ethiopia"
                            onChange={e => { setFormData({ ...formData, location: e.target.value }); setIsDirty(true); }}
                            className={inputCls(true)} />
                        </div>
                      </Field>
                    </div>
                  </div>
                )}

                {activeTab === "preferences" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <Compass className="text-emerald-500" size={24} /> {t("settings.travelPreferences")}
                      </h2>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">Help us match you with the perfect guides and tours.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <Field label={t("settings.difficulty")}>
                        <div className="relative">
                          <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
                          <select value={preferences.difficulty} onChange={e => { setPreferences({ ...preferences, difficulty: e.target.value }); setIsDirty(true); }}
                            className={inputCls(true) + " appearance-none"}>
                            <option value="Easy">Easy – Light walking</option>
                            <option value="Moderate">Moderate – Active</option>
                            <option value="Challenging">Challenging – Hiking</option>
                            <option value="Extreme">Extreme – Mountaineering</option>
                          </select>
                        </div>
                      </Field>
                      <Field label="Group Size">
                        <div className="relative">
                          <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
                          <select value={preferences.groupType} onChange={e => { setPreferences({ ...preferences, groupType: e.target.value }); setIsDirty(true); }}
                            className={inputCls(true) + " appearance-none"}>
                            <option value="Solo">Solo Traveler</option>
                            <option value="Couple">Couple</option>
                            <option value="Family">Family</option>
                            <option value="Group">Large Group</option>
                          </select>
                        </div>
                      </Field>
                    </div>
                    <div className="p-6 bg-[#FF8C00]/5 dark:bg-[#FF8C00]/10 border border-[#FF8C00]/20 rounded-2xl flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#FF8C00]/20 flex items-center justify-center shrink-0">
                        <Compass size={20} className="text-[#FF8C00]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Personalized Experience</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">These preferences are used to personalize your tour recommendations and ensure you get matched with guides that fit your travel style.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "emergency" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <AlertCircle className="text-red-500" size={24} /> {t("settings.emergencyContact")}
                      </h2>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">In a trekking emergency, your guide will contact this person.</p>
                    </div>
                    
                    <div className="p-6 bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                        <AlertCircle size={20} className="text-red-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-red-700 dark:text-red-400 text-sm mb-1">Critical Safety Information</h4>
                        <p className="text-sm text-red-600/80 dark:text-red-400/80">Please keep this information up-to-date for your safety on remote expeditions and challenging treks.</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <Field label="Contact Name">
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input type="text" value={emergencyContact.name} placeholder="Jane Doe"
                            onChange={e => { setEmergencyContact({ ...emergencyContact, name: e.target.value }); setIsDirty(true); }}
                            className={inputCls(true)} />
                        </div>
                      </Field>
                      <Field label="Relationship">
                        <input type="text" value={emergencyContact.relation} placeholder="Spouse, Sibling, Parent..."
                          onChange={e => { setEmergencyContact({ ...emergencyContact, relation: e.target.value }); setIsDirty(true); }}
                          className={inputCls(false)} />
                      </Field>
                      <Field label={t("settings.phone")}>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input type="tel" value={emergencyContact.phone} placeholder="+1 555 000 1234"
                            onChange={e => { setEmergencyContact({ ...emergencyContact, phone: e.target.value }); setIsDirty(true); }}
                            className={inputCls(true)} />
                        </div>
                      </Field>
                    </div>
                  </div>
                )}

                {activeTab === "notifications" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <Bell className="text-[#FF8C00]" size={24} /> Notifications & Privacy
                      </h2>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">Control how Kambata Travel communicates with you and what others can see.</p>
                    </div>
                    
                    <div>
                      <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">{t("settings.emailAlerts")}</h3>
                      <div className="space-y-3">
                        {[
                          { key: "bookingUpdates", label: "Booking Updates",    desc: "Guide accepts, rejects, or changes your trip." },
                          { key: "emailAlerts",    label: "Promotions & News",  desc: "Special offers and travel inspiration." },
                          { key: "reminders",      label: "Trip Reminders",     desc: "24-hour alert before your upcoming tour." },
                        ].map(item => (
                          <div key={item.key} className="flex items-center justify-between p-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 transition-colors">
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{item.label}</p>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{item.desc}</p>
                            </div>
                            <Toggle checked={(settings.notifications as any)[item.key]}
                              onChange={v => { setSettings({ ...settings, notifications: { ...settings.notifications, [item.key]: v } }); setIsDirty(true); }} />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-100 dark:border-white/10 pt-8">
                      <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Appearance & Language</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Field label="Language">
                          <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
                            <select
                              value={settings.ui.language}
                              onChange={(e) => {
                                setSettings({ ...settings, ui: { ...settings.ui, language: e.target.value } });
                                setIsDirty(true);
                              }}
                              className={inputCls(true) + " appearance-none"}
                            >
                              <option value="en">English</option>
                              <option value="am">Amharic</option>
                              <option value="kam">Kambata</option>
                            </select>
                          </div>
                        </Field>
                        <Field label="Theme">
                          <div className="relative">
                            <Moon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
                            <select
                              value={settings.ui.theme}
                              onChange={(e) => {
                                const theme = e.target.value as "light" | "dark" | "system";
                                setSettings({ ...settings, ui: { ...settings.ui, theme } });
                                applyExplorerTheme(theme);
                                setIsDirty(true);
                              }}
                              className={inputCls(true) + " appearance-none"}
                            >
                              <option value="system">System default</option>
                              <option value="light">Light</option>
                              <option value="dark">Dark</option>
                            </select>
                          </div>
                        </Field>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-100 dark:border-white/10 pt-8">
                      <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Privacy</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Field label="Profile Visibility">
                          <div className="relative">
                            <Eye className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
                            <select value={settings.privacy.profileVisibility}
                              onChange={e => { setSettings({ ...settings, privacy: { ...settings.privacy, profileVisibility: e.target.value } }); setIsDirty(true); }}
                              className={inputCls(true) + " appearance-none"}>
                              <option value="public">Public</option>
                              <option value="private">Private</option>
                            </select>
                          </div>
                        </Field>
                        <Field label="Travel History">
                          <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
                            <select value={settings.privacy.travelHistoryVisibility}
                              onChange={e => { setSettings({ ...settings, privacy: { ...settings.privacy, travelHistoryVisibility: e.target.value } }); setIsDirty(true); }}
                              className={inputCls(true) + " appearance-none"}>
                              <option value="guides_only">Guides Only</option>
                              <option value="public">Public</option>
                              <option value="private">Private</option>
                            </select>
                          </div>
                        </Field>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "security" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <Shield className="text-emerald-500" size={24} /> Security
                      </h2>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">Manage your password and keep your account safe.</p>
                    </div>
                    
                    <div className="flex items-start gap-4 p-6 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <ShieldCheck size={20} className="text-emerald-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-emerald-700 dark:text-emerald-400 text-sm mb-1">Account Secured</h4>
                        <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">Email verification is active on your account. Your data is protected.</p>
                      </div>
                    </div>
                    
                    <div className="max-w-md">
                      <Field label={t("settings.newPassword")}>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input type="password" value={formData.newPassword} placeholder="Min. 8 characters"
                            onChange={e => { setFormData({ ...formData, newPassword: e.target.value }); setIsDirty(true); }}
                            className={inputCls(true)} />
                        </div>
                      </Field>
                      {formData.newPassword.length > 0 && formData.newPassword.length < 8 && (
                        <p className="text-xs font-bold text-red-500 mt-2 ml-1 flex items-center gap-1"><AlertCircle size={12} /> Password must be at least 8 characters.</p>
                      )}
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-3 ml-1">Leave blank to keep your current password.</p>
                    </div>
                    
                    <div className="border-t border-red-500/10 dark:border-red-500/20 pt-8 mt-8">
                      <h3 className="text-base font-black text-red-600 dark:text-red-500 flex items-center gap-2 mb-2">
                        <Trash2 size={18} /> {t("settings.dangerZone")}
                      </h3>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6 max-w-lg">
                        Permanently remove your account, wishlist, and reviews. You cannot delete while active bookings exist. This action cannot be undone.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        className="px-6 py-3 rounded-xl border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        Delete My Account
                      </button>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 p-6 bg-white dark:bg-[#161B26]/60 backdrop-blur-xl rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
              <button type="button" onClick={fetchProfile} disabled={loading || !isDirty}
                className="w-full sm:w-auto flex justify-center items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 px-6 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all disabled:opacity-30">
                <RotateCcw size={16} /> Discard Changes
              </button>
              
              <button type="submit"
                disabled={loading || (formData.newPassword.length > 0 && formData.newPassword.length < 8)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1A331B] hover:bg-[#122413] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-black px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-[#1A331B]/20 dark:shadow-emerald-500/20 hover:-translate-y-0.5 disabled:opacity-50">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {loading ? t("settings.saving") : t("settings.saveChanges")}
              </button>
            </div>
          </div>
        </div>
      </form>

      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowDeleteModal(false); setDeletePassword(""); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-white/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black text-red-600 dark:text-red-500 flex items-center gap-2">
                    <AlertCircle size={24} /> Delete Account
                  </h2>
                </div>
                <button 
                  onClick={() => { setShowDeleteModal(false); setDeletePassword(""); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-6 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-4 rounded-xl">
                This action is <span className="font-bold text-red-600 dark:text-red-400">permanent and cannot be undone</span>.
              </p>
              
              <div className="space-y-2 mb-8">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Your Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    className="w-full border border-gray-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm bg-gray-50 dark:bg-[#0F172A] text-gray-900 dark:text-white outline-none focus:border-red-500 transition-colors"
                    placeholder="Enter password to confirm"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword("");
                  }}
                  className="flex-1 py-4 rounded-2xl font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting || !deletePassword}
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      await apiClient.delete("/users/account", { data: { password: deletePassword } });
                      toast.success("Account deleted successfully");
                      logout();
                      router.push("/");
                    } catch (err: any) {
                      toast.error(err.response?.data?.message || "Could not delete account");
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  className="flex-[2] py-4 rounded-2xl font-black bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20 hover:-translate-y-0.5"
                >
                  {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                  Delete Forever
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
