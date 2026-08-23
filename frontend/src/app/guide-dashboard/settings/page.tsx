"use client";

import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Bell, 
  CreditCard, 
  Mail, 
  Phone, 
  CheckCircle,
  Building,
  ChevronDown,
  Loader2,
  Lock,
  Globe,
  Settings,
  AlertTriangle,
  RefreshCcw,
  Check
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "@/utils/apiClient";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AccountSettings() {
  const { user: authUser } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const canDoItems = [
    t("guidePages.settings.canView"),
    t("guidePages.settings.canMessage"),
    t("guidePages.settings.canAttendance"),
    t("guidePages.settings.canIncidents"),
    t("guidePages.settings.canStatus"),
  ];
  const restrictedItems = [
    t("guidePages.settings.cannotCreate"),
    t("guidePages.settings.cannotBookings"),
    t("guidePages.settings.cannotPayments"),
    t("guidePages.settings.cannotAnalytics"),
  ];
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [toggles, setToggles] = useState({
    tfa: false,
    emailAlerts: true,
    bookingAlerts: true,
    earningsAlerts: true
  });

  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    accountHolder: "",
    accountNumber: ""
  });

  const [mobileMoney, setMobileMoney] = useState({
    provider: "",
    phoneNumber: ""
  });
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const dm = localStorage.getItem("guide-dark-mode") === "1";
    setDarkMode(dm);
    document.documentElement.classList.toggle("dark", dm);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get("/guides/profile");
        const { bankDetails: b, mobileMoney: m } = res.data.data;
        if (b) setBankDetails(b);
        if (m) setMobileMoney(m);
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (bankDetails.accountNumber !== "" || mobileMoney.phoneNumber !== "") {
      const isConfirmed = window.confirm(
        "You are about to update your secure financial payout methods. Are you sure you want to proceed?"
      );
      if (!isConfirmed) return;
    }

    try {
      await apiClient.put("/guides/profile", {
        bankDetails,
        mobileMoney
      });
      setIsSaved(true);
      toast.success("Payout settings saved");
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    }
  };

  const toggleSwitch = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin h-12 w-12 text-[#1A331B]" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto pb-12"
    >
      <div className="mb-10">
        <h1 className="font-black text-4xl text-gray-900 dark:text-white tracking-tight mb-2">{t("guidePages.settings.title")}</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium">{t("guidePages.settings.subtitle")}</p>
      </div>

      <div className="mb-8 p-6 md:p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 backdrop-blur-xl shadow-sm">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
          <Shield size={12} /> {t("guidePages.settings.rolePermissions")}
        </h3>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-6">
          {t("guidePages.settings.roleDesc")}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-[1.25rem] p-5 border border-gray-100 dark:border-white/5">
            <h4 className="text-xs font-black text-gray-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="text-[#0F766E] w-4 h-4" /> {t("guidePages.settings.whatYouCanDo")}
            </h4>
            <ul className="space-y-3">
              {canDoItems.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-gray-300">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                   {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white dark:bg-[#1E293B] rounded-[1.25rem] p-5 border border-gray-100 dark:border-white/5 opacity-80">
            <h4 className="text-xs font-black text-gray-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
              <Lock className="text-gray-400 w-4 h-4" /> {t("guidePages.settings.restrictedActions")}
            </h4>
            <ul className="space-y-3">
              {restrictedItems.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                   <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                   {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t("guidePages.settings.interfaceTheme")}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("guidePages.settings.themeDesc")}</p>
          </div>
          <div 
            className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors shadow-inner flex items-center ${darkMode ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'}`}
            onClick={() => {
              const newMode = !darkMode;
              setDarkMode(newMode);
              document.documentElement.classList.toggle("dark", newMode);
              localStorage.setItem("guide-dark-mode", newMode ? "1" : "0");
            }}
          >
            <motion.div 
              layout 
              className="w-6 h-6 bg-white rounded-full shadow-sm" 
              animate={{ x: darkMode ? 24 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Security Section */}
        <div className="bg-white dark:bg-[#1E293B] backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-white/5 pb-6 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Lock size={20} />
            </div>
            <h2 className="font-black text-xl text-gray-900 dark:text-white">{t("guidePages.settings.securityAccess")}</h2>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{t("guidePages.settings.currentPassword")}</label>
              <input type="password" placeholder={t("guidePages.settings.passwordPlaceholder")} className="w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{t("guidePages.settings.newPassword")}</label>
              <input type="password" placeholder={t("guidePages.settings.minPassword")} className="w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
            </div>
            
            <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t("guidePages.settings.tfa")}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("guidePages.settings.tfaDesc")}</p>
              </div>
              <div 
                className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors shadow-inner flex items-center ${toggles.tfa ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                onClick={() => toggleSwitch("tfa")}
              >
                <motion.div 
                  layout 
                  className="w-6 h-6 bg-white rounded-full shadow-sm" 
                  animate={{ x: toggles.tfa ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white dark:bg-[#1E293B] backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-white/5 pb-6 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Bell size={20} />
            </div>
            <h2 className="font-black text-xl text-gray-900 dark:text-white">{t("guidePages.settings.notificationEcosystem")}</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#0F172A] shadow-sm flex items-center justify-center text-gray-400"><Mail size={18} /></div>
                 <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t("guidePages.settings.systemBulletins")}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t("guidePages.settings.systemBulletinsDesc")}</p>
                 </div>
               </div>
               <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors shadow-inner flex items-center ${toggles.emailAlerts ? 'bg-[#FF8C00]' : 'bg-gray-200 dark:bg-gray-700'}`} onClick={() => toggleSwitch("emailAlerts")}>
                 <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" animate={{ x: toggles.emailAlerts ? 24 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
               </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#0F172A] shadow-sm flex items-center justify-center text-gray-400"><Globe size={18} /></div>
                 <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t("guidePages.settings.realtimeBookings")}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t("guidePages.settings.realtimeBookingsDesc")}</p>
                 </div>
               </div>
               <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors shadow-inner flex items-center ${toggles.bookingAlerts ? 'bg-[#FF8C00]' : 'bg-gray-200 dark:bg-gray-700'}`} onClick={() => toggleSwitch("bookingAlerts")}>
                 <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" animate={{ x: toggles.bookingAlerts ? 24 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
               </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#0F172A] shadow-sm flex items-center justify-center text-gray-400"><CreditCard size={18} /></div>
                 <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t("guidePages.settings.financialIntegrity")}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t("guidePages.settings.financialIntegrityDesc")}</p>
                 </div>
               </div>
               <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors shadow-inner flex items-center ${toggles.earningsAlerts ? 'bg-[#FF8C00]' : 'bg-gray-200 dark:bg-gray-700'}`} onClick={() => toggleSwitch("earningsAlerts")}>
                 <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" animate={{ x: toggles.earningsAlerts ? 24 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Channels Section */}
      <div className="bg-white dark:bg-[#1E293B] backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm mb-8">
        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-white/5 pb-6 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CreditCard size={20} />
          </div>
          <h2 className="font-black text-xl text-gray-900 dark:text-white">{t("guidePages.settings.payoutInfrastructure")}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Bank Channel */}
          <div className="bg-gray-50/50 dark:bg-[#0F172A] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5">
             <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-6 bg-white dark:bg-white/5 px-4 py-2 rounded-xl inline-flex shadow-sm"><Building size={14} className="text-[#1A331B] dark:text-emerald-500" /> {t("guidePages.settings.settlementBank")}</span>
             
             <div className="space-y-5">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{t("guidePages.settings.bankInstitution")}</label>
                  <input 
                    type="text" 
                    className="w-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#1A331B] focus:ring-1 focus:ring-[#1A331B] transition-all shadow-sm" 
                    placeholder="e.g. Commercial Bank of Ethiopia"
                    value={bankDetails.bankName}
                    onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})}
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Legal Account Holder</label>
                  <input 
                    type="text" 
                    className="w-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#1A331B] focus:ring-1 focus:ring-[#1A331B] transition-all shadow-sm" 
                    placeholder="Matches your National ID"
                    value={bankDetails.accountHolder}
                    onChange={e => setBankDetails({...bankDetails, accountHolder: e.target.value})}
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">SWIFT / Account Number</label>
                  <input 
                    type="text" 
                    className="w-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#1A331B] focus:ring-1 focus:ring-[#1A331B] transition-all shadow-sm" 
                    placeholder="Full account string"
                    value={bankDetails.accountNumber}
                    onChange={e => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                  />
               </div>
             </div>
          </div>

          {/* Mobile Money Channel */}
          <div className="bg-gray-50/50 dark:bg-[#0F172A] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5">
             <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-6 bg-white dark:bg-white/5 px-4 py-2 rounded-xl inline-flex shadow-sm"><Phone size={14} className="text-[#FF8C00]" /> Local Mobile Money Gateway</span>
             
             <div className="space-y-5">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Service Operator</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#1A331B] focus:ring-1 focus:ring-[#1A331B] transition-all shadow-sm pr-10" 
                      placeholder="e.g. TeleBirr"
                      value={mobileMoney.provider}
                      onChange={e => setMobileMoney({...mobileMoney, provider: e.target.value})}
                    />
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Registered Phone Terminal</label>
                  <input 
                    type="text" 
                    className="w-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#1A331B] focus:ring-1 focus:ring-[#1A331B] transition-all shadow-sm" 
                    placeholder="+251 ..."
                    value={mobileMoney.phoneNumber}
                    onChange={e => setMobileMoney({...mobileMoney, phoneNumber: e.target.value})}
                  />
               </div>
               <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20 flex gap-3">
                  <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 leading-relaxed">Mobile money settlements are processed within 24 hours of guest checkout.</span>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50/50 dark:bg-red-500/5 rounded-[2.5rem] border border-red-100 dark:border-red-500/20 p-8 mb-8">
        <div className="flex items-center gap-3 text-red-600 font-black text-lg mb-4 tracking-tight">
          <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600">
            <AlertTriangle size={20} />
          </div>
          Profile Deactivation
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl font-medium leading-relaxed">Deactivating your expert profile will remove all your public tour listings and pause any pending payouts. Use this only if you wish to exit the platform.</p>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("You will be taken to support to request profile deactivation. Continue?")) {
                router.push("/guide-dashboard/contact");
              }
            }}
            className="px-6 py-3 rounded-xl border-2 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm font-black tracking-wide hover:bg-red-600 hover:text-white transition-all whitespace-nowrap"
          >
            Request Deactivation
          </button>
        </div>
      </div>

      {/* Final Actions */}
      <div className="w-full mt-4">
        <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-[2rem] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <button 
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ml-2" 
            onClick={() => window.location.reload()}
          >
            <RefreshCcw size={16} /> Revert Changes
          </button>
          <button 
            className={`flex justify-center w-full md:w-auto items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-black transition-all shadow-sm ${
              isSaved 
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20" 
                : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-[#1A331B] hover:text-white hover:scale-[1.02]"
            }`} 
            onClick={handleSave} 
            disabled={isSaved}
          >
            {isSaved ? (
              <><Check size={18} /> Preferences Secured</>
            ) : "Save Global Settings"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

