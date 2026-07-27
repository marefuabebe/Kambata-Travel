"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Map,
  Users,
  MessageSquare,
  ClipboardCheck,
  AlertTriangle,
  History,
  Bell,
  User,
  Settings,
  LogOut,
  Search,
  BadgeCheck,
  HelpCircle,
  CloudSun,
  ChevronDown,
  Moon,
  Sun,
  CheckSquare,
  CalendarDays,
  QrCode,
  Siren,
  Home,
  Phone,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWeather } from "@/hooks/useWeather";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import GuideGate from "@/components/guide/GuideGate";
import Sidebar from "@/components/layout/Sidebar";
import { useLanguage } from "@/context/LanguageContext";

const getNav = (t: (key: string) => string) => [
  { name: t("guideSidebar.dashboard"), icon: LayoutDashboard, path: "/guide-dashboard" },
  { name: t("guideSidebar.myCalendar"), icon: CalendarDays, path: "/guide-dashboard/calendar" },
  { name: t("guideSidebar.customRequests"), icon: CalendarDays, path: "/guide-dashboard/requests" },
  { name: t("guideSidebar.assignments"), icon: CheckSquare, path: "/guide-dashboard/assignments" },
  { name: t("guideSidebar.qrScanner"), icon: QrCode, path: "/guide-dashboard/scanner", highlight: true },
  { name: t("guideSidebar.assignedTours"), icon: Map, path: "/guide-dashboard/assigned-tours" },
  { name: t("guideSidebar.travelers"), icon: Users, path: "/guide-dashboard/travelers" },
  { name: t("guideSidebar.messages"), icon: MessageSquare, path: "/guide-dashboard/messages" },
  { name: t("guideSidebar.attendance"), icon: ClipboardCheck, path: "/guide-dashboard/attendance" },
  { name: t("guideSidebar.incidentReports"), icon: AlertTriangle, path: "/guide-dashboard/incidents" },
  { name: t("guideSidebar.sosEmergency"), icon: Siren, path: "/guide-dashboard/sos", sos: true },
  { name: t("guideSidebar.walletEarnings"), icon: CheckSquare, path: "/guide-dashboard/wallet" },
  { name: t("guideSidebar.tourHistory"), icon: History, path: "/guide-dashboard/history" },
  { name: t("guideSidebar.myRatings"), icon: BadgeCheck, path: "/guide-dashboard/reviews" },
  { name: t("guideSidebar.notifications"), icon: Bell, path: "/guide-dashboard/notifications" },
  { name: t("guideSidebar.profile"), icon: User, path: "/guide-dashboard/profile" },
  { name: t("guideSidebar.settings"), icon: Settings, path: "/guide-dashboard/settings" },
];


export default function GuideDashboardLayout({ children }: { children: React.ReactNode }) {
  const { t, language, setLanguage } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, syncGuideStatus } = useAuth();
  const weather = useWeather();
  const [headerSearch, setHeaderSearch] = React.useState("");
  const [isMobileMenuOpen, React_setIsMobileMenuOpen] = React.useState(false);
  const [theme, setTheme] = React.useState("light");
  const [isChatActive, setIsChatActive] = React.useState(false);

  const unreadMessagesCount = useRealtimeMessages();
  const unreadNotificationsCount = useRealtimeNotifications();

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };


  const hasSynced = React.useRef(false);

  React.useEffect(() => {
    if (!user || user.role !== "guide") {
      router.push("/login");
    } else if (!hasSynced.current) {
      syncGuideStatus();
      hasSynced.current = true;
    }
  }, [user, router]);

  React.useEffect(() => {
    const handleChatOpened = () => setIsChatActive(true);
    const handleChatClosed = () => setIsChatActive(false);

    window.addEventListener("chat-opened", handleChatOpened);
    window.addEventListener("chat-closed", handleChatClosed);

    return () => {
      window.removeEventListener("chat-opened", handleChatOpened);
      window.removeEventListener("chat-closed", handleChatClosed);
    };
  }, []);

  if (!user || user.role !== "guide") return null;

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && headerSearch.trim()) {
      router.push(
        `/guide-dashboard/assigned-tours?search=${encodeURIComponent(headerSearch.trim())}`
      );
    }
  };

  const isMessages = pathname === "/guide-dashboard/messages";

  return (
    <div className="bg-[#F8FAFC] dark:bg-[#0B1120] h-screen overflow-hidden flex selection:bg-[#FF8C00]/30 selection:text-[#FF8C00]">
      {/* ── Universal Sidebar ── */}
      <Sidebar 
        user={user}
        logout={logout}
        pathname={pathname || ""}
        router={router}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={React_setIsMobileMenuOpen}
        unreadMessagesCount={unreadMessagesCount}
        unreadNotificationsCount={unreadNotificationsCount}
        navItems={getNav(t)}
        portalName={t("guideSidebar.portalName")}
        portalLink="/guide-dashboard"
        helpLink="/guide-dashboard/contact"
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <header className="h-24 bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 flex items-center px-4 sm:px-8 gap-4 sm:gap-6 sticky top-0 z-40 shrink-0 relative">
          <button 
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-white/5 shrink-0 active:scale-95 transition-transform relative z-10"
            onClick={() => React_setIsMobileMenuOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </button>

          <Link href="/guide-dashboard" className="lg:hidden flex items-center ml-3 group">
            <span className="font-black text-xl tracking-tight text-[#1A331B] dark:text-white">Kambata</span>
          </Link>

          <div className="flex-1 max-w-2xl hidden lg:flex items-center gap-3 bg-gray-50/50 dark:bg-[#0F172A]/50 rounded-[1.25rem] px-5 py-3.5 border border-gray-100 dark:border-white/5 focus-within:border-[#1A331B] dark:focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-[#1A331B]/5 dark:focus-within:ring-emerald-500/10 transition-all shadow-sm focus-within:bg-white dark:focus-within:bg-[#0F172A]">
            <Search size={20} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder={t("guideSidebar.searchPlaceholder")}
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              onKeyDown={handleSearch}
              className="bg-transparent border-none outline-none text-sm font-medium w-full text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>

          {/* Meaningful Features: Weather & Duty Status */}
          <div className="flex-1 flex items-center justify-end gap-6">
             {/* Weather Widget */}
             <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-[#0F172A] rounded-2xl border border-gray-100 dark:border-white/5">
                <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                   <CloudSun size={16} className="text-amber-500" />
                </div>
                <div className="flex flex-col">
                   <span className="text-xs font-bold text-gray-900 dark:text-white">{weather.temp}, {weather.desc}</span>
                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t("guideSidebar.kambataZone")}</span>
                </div>
             </div>

             {/* Duty Status */}
             <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-all shadow-sm group">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <div className="flex flex-col mx-1">
                   <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-[#1A331B] dark:group-hover:text-emerald-500 transition-colors">{t("guideSidebar.available")}</span>
                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t("guideSidebar.dutyStatus")}</span>
                </div>
                <ChevronDown size={14} className="text-gray-400 ml-1" />
             </div>
          </div>

          <div className="flex items-center gap-4 border-l border-gray-100 dark:border-white/5 pl-6 ml-auto relative z-10">
            <button
              onClick={() => setLanguage(language === "en" ? "am" : "en")}
              className="lg:hidden px-3 h-10 rounded-xl flex items-center justify-center font-bold text-[11px] bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/5 shadow-sm text-gray-700 dark:text-gray-300"
            >
              {language === "en" ? "አማ" : "EN"}
            </button>
            <button
              onClick={() => setLanguage(language === "en" ? "am" : "en")}
              className="hidden lg:flex px-3 h-12 rounded-[1.25rem] items-center justify-center font-bold text-sm bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md text-gray-700 dark:text-gray-300 hover:text-[#1A331B] dark:hover:text-emerald-500 transition-all"
            >
              {language === "en" ? "አማ" : "EN"}
            </button>
            <button 
              onClick={toggleTheme} 
              className="relative w-12 h-12 flex items-center justify-center rounded-[1.25rem] bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all text-gray-500 hover:text-[#1A331B] dark:hover:text-emerald-500"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Link
              href="/guide-dashboard/notifications"
              className="relative w-12 h-12 flex items-center justify-center rounded-[1.25rem] bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all text-gray-500 hover:text-[#1A331B] dark:hover:text-emerald-500"
            >
              <Bell size={20} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] flex items-center justify-center bg-[#FF8C00] text-white text-[10px] font-black rounded-full px-1 border-2 border-white dark:border-[#1E293B]">
                  {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                </span>
              )}
            </Link>
            <Link href="/guide-dashboard/profile" className="relative block shrink-0">
              <div className="w-12 h-12 rounded-[1.25rem] overflow-hidden border-2 border-white dark:border-[#334155] shadow-sm hover:shadow-md active:scale-95 transition-all">
                <img loading="lazy"
                  src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name}&background=1A331B&color=fff`}
                  alt="Image"
                  className="w-full h-full object-cover"
                />
              </div>
              {(user?.guideStatus === "approved" || user?.guideStatus === "verified") && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#10B981] rounded-full flex items-center justify-center border-2 border-white dark:border-[#0B1120] shadow-sm pointer-events-none">
                  <ShieldCheck size={10} className="text-white" />
                </div>
              )}
            </Link>
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto overflow-x-auto min-h-0 ${(isMessages && isChatActive) ? "p-0 pb-0" : "p-4 md:p-10 pb-24 lg:pb-10"}`}>
          <GuideGate>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </GuideGate>
        </main>
        

        {/* ── Advanced Mobile Bottom Navigation ── */}
        {(!isMessages || !isChatActive) && (
          <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50 pointer-events-none">
            <div className="bg-white dark:bg-[#0F172A]/90 backdrop-blur-3xl border border-gray-200 dark:border-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] rounded-[2.5rem] flex justify-around items-center h-[72px] px-2 relative pointer-events-auto">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              
              {[
                { name: t("guideSidebar.mobileHome"), icon: Home, path: "/guide-dashboard" },
                { name: t("guideSidebar.mobileTours"), icon: Map, path: "/guide-dashboard/assigned-tours" },
                { name: t("guideSidebar.mobileRequests"), icon: CheckSquare, path: "/guide-dashboard/requests" },
                { name: t("guideSidebar.mobileCalendar"), icon: CalendarDays, path: "/guide-dashboard/calendar" },
                { name: t("guideSidebar.mobileProfile"), icon: User, path: "/guide-dashboard/profile" },
              ].map((item) => {
                 const isActive = pathname === item.path || (item.path !== "/guide-dashboard" && pathname?.startsWith(item.path));
                 return (
                   <Link key={item.name} href={item.path} className="relative flex-1 flex flex-col items-center justify-center h-full group transition-all duration-300">
                      <div className="relative z-10 flex flex-col items-center justify-center">
                        <item.icon 
                          size={22} 
                          className={`transition-all duration-300 ease-out ${isActive ? "text-[#0F766E] -translate-y-2 scale-110" : "text-gray-500 dark:text-gray-400 group-active:scale-90"}`} 
                          strokeWidth={isActive ? 3 : 2.5}
                        />
                        
                        <AnimatePresence>
                          {isActive && (
                            <motion.span 
                              initial={{ opacity: 0, y: 10, scale: 0.8 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.8 }}
                              transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                              className="absolute -bottom-4 text-[9px] font-black tracking-widest text-[#0F766E] uppercase whitespace-nowrap"
                            >
                              {item.name}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                   </Link>
                 )
              })}
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
