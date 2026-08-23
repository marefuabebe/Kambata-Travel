"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  Package,
  CalendarCheck,
  MessageSquare,
  Bell,
  Heart,
  Star,
  Search,
  Menu,
  LifeBuoy,
  CreditCard,
  Siren,
  Sun,
  Moon,
  ChevronLeft
} from "lucide-react";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useAuth } from "@/context/AuthContext";
import { applyExplorerTheme, readExplorerTheme } from "@/utils/explorerTheme";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/layout/Sidebar";
import { Settings, User, LogOut } from "iconoir-react";

const getNav = (t: any) => [
  { name: t("sidebar.dashboard"), icon: LayoutDashboard, path: "/explorer-dashboard" },
  { name: t("sidebar.exploreTours"), icon: Compass, path: "/explorer-dashboard/explore-tours" },
  { name: t("sidebar.explorePackages"), icon: Package, path: "/explorer-dashboard/packages" },
  { name: t("sidebar.myBookings"), icon: CalendarCheck, path: "/explorer-dashboard/bookings" },
  { name: t("sidebar.myRequests"), icon: CalendarCheck, path: "/explorer-dashboard/my-requests" },
  { name: t("sidebar.payments"), icon: CreditCard, path: "/explorer-dashboard/payments" },
  { name: t("sidebar.messages"), icon: MessageSquare, path: "/explorer-dashboard/messages" },
  { name: t("sidebar.notifications"), icon: Bell, path: "/explorer-dashboard/notifications" },
  { name: t("sidebar.wishlist"), icon: Heart, path: "/explorer-dashboard/wishlist" },
  { name: t("sidebar.reviews"), icon: Star, path: "/explorer-dashboard/reviews" },
  { name: t("sidebar.profile"), icon: User, path: "/explorer-dashboard/settings" },
  { name: t("sidebar.sosEmergency"), icon: Siren, path: "/explorer-dashboard/sos", sos: true },
];



export default function ExplorerDashboardLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const [headerSearch, setHeaderSearch] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isChatActive, setIsChatActive] = useState(false);
  const { language, setLanguage } = useLanguage();
  const unreadMessagesCount = useRealtimeMessages();
  const unreadNotificationsCount = useRealtimeNotifications();

  const hasRefreshed = React.useRef(false);

  useEffect(() => {
    if (!user || user.role !== "user") {
      router.push("/login");
    } else if (!hasRefreshed.current) {
      hasRefreshed.current = true;
      refreshUser();
    }
  }, [user, router, refreshUser]);

  useEffect(() => {
    const handleOpenMenu = () => setIsMobileMenuOpen(true);
    const handleChatOpened = () => setIsChatActive(true);
    const handleChatClosed = () => setIsChatActive(false);
    const handleToggleTheme = () => {
      const currentTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      applyExplorerTheme(newTheme);
      setIsDark(newTheme === "dark");
    };

    window.addEventListener("open-mobile-menu", handleOpenMenu);
    window.addEventListener("chat-opened", handleChatOpened);
    window.addEventListener("chat-closed", handleChatClosed);
    window.addEventListener("toggle-theme", handleToggleTheme);

    return () => {
      window.removeEventListener("open-mobile-menu", handleOpenMenu);
      window.removeEventListener("chat-opened", handleChatOpened);
      window.removeEventListener("chat-closed", handleChatClosed);
      window.removeEventListener("toggle-theme", handleToggleTheme);
    };
  }, []);

  useEffect(() => {
    const theme = readExplorerTheme();
    applyExplorerTheme(theme);
    setIsDark(theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches));
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    applyExplorerTheme(newTheme);
    setIsDark(!isDark);
  };



  if (!user || user.role !== "user") return null;

  const isMessages = pathname === "/explorer-dashboard/messages";

  const getPageTitle = (path: string) => {
    if (path.includes("explore-tours")) return t("sidebar.exploreTours");
    if (path.includes("packages")) return t("sidebar.explorePackages");
    if (path.includes("bookings")) return t("sidebar.myBookings");
    if (path.includes("settings") || path.includes("profile")) return t("sidebar.profile");
    if (path.includes("reviews")) return t("sidebar.reviews");
    if (path.includes("my-requests")) return t("sidebar.myRequests");
    if (path.includes("wishlist")) return t("sidebar.wishlist");
    if (path.includes("payments")) return t("sidebar.payments");
    if (path.includes("support")) return t("support.title");
    if (path.includes("notifications")) return t("sidebar.notifications");
    if (path.includes("support")) return t("support.title");
    if (path.includes("notifications")) return t("sidebar.notifications");
    return "Kambata Travel";
  };

  const isMainTab = [
    "/explorer-dashboard",
    "/explorer-dashboard/explore-tours",
    "/explorer-dashboard/bookings",
    "/explorer-dashboard/messages",
    "/explorer-dashboard/settings"
  ].includes(pathname || "");

  return (
    <div className="bg-[#F8FAFC] dark:bg-[#0A0F1C] min-h-screen flex selection:bg-[#FF8C00]/30 selection:text-[#FF8C00] overflow-hidden">
      
      {/* ── Background Glow Effects ── */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-[#FF8C00]/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full" />
      </div>

      {/* ── Universal Sidebar ── */}
      <Sidebar 
        user={user}
        logout={logout}
        pathname={pathname || ""}
        router={router}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        unreadMessagesCount={unreadMessagesCount}
        unreadNotificationsCount={unreadNotificationsCount}
        navItems={getNav(t)}
        portalName="Traveler"
        portalLink="/explorer-dashboard"
        helpLink="/explorer-dashboard/support"
      />



      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-h-screen h-screen overflow-hidden relative z-10">
        
        {/* ── Desktop Header ── */}
        <header className="hidden lg:flex h-20 bg-white/50 dark:bg-[#0F172A]/50 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5 items-center justify-between px-6 lg:px-10 shrink-0 z-30 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-4 flex-1">
            <Link href="/explorer-dashboard" className="hidden lg:flex items-center gap-2 group">
              <div className="h-8 overflow-hidden transition-transform duration-300 group-hover:scale-105">
                <img loading="lazy" 
                  src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg" 
                  alt="Kambata Traveler" 
                  className="h-full w-auto object-contain dark:brightness-0 dark:invert"
                />
              </div>
              <span className="font-black text-lg tracking-tight text-gray-900 dark:text-white">Kambata</span>
            </Link>
            
            <div className="hidden sm:flex flex-1 max-w-2xl relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF8C00] to-orange-500 rounded-2xl opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-500" />
              <div className="relative flex items-center gap-3 bg-white dark:bg-[#1E293B] rounded-2xl px-5 py-3 w-full border border-gray-200 dark:border-white/5 shadow-sm group-focus-within:border-transparent transition-all">
                <Search size={18} className="text-gray-400 dark:text-gray-500" />
                <input 
                  type="text"
                  placeholder={t("sidebar.searchPlaceholder")}
                  className="bg-transparent border-none outline-none w-full text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLanguage(language === "en" ? "am" : "en")}
              className="px-3 h-11 rounded-2xl flex items-center justify-center font-bold text-sm bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              {language === "en" ? "አማ" : "EN"}
            </button>
            <button 
              onClick={() => window.dispatchEvent(new Event('toggle-theme'))}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-amber-500 dark:text-sky-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <Sun className="hidden dark:block" size={20} />
              <Moon className="block dark:hidden" size={20} />
            </button>
            <Link 
              href="/explorer-dashboard/notifications" 
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors relative"
            >
              <Bell size={20} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] flex items-center justify-center bg-[#FF8C00] text-white text-[10px] font-black rounded-full px-1 border-2 border-white dark:border-[#0F172A]">
                  {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                </span>
              )}
            </Link>
            <Link 
              href="/explorer-dashboard/settings" 
              className="w-11 h-11 rounded-2xl overflow-hidden border border-transparent hover:border-[#FF8C00] transition-all hover:scale-105 shadow-sm ml-2"
            >
              <img loading="lazy"
                src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name}&background=FF8C00&color=fff`}
                alt="Image"
                className="w-full h-full object-cover"
              />
            </Link>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className={`flex-1 overflow-y-auto overflow-x-auto min-h-0 custom-scrollbar relative z-10 ${(isMessages && isChatActive) ? "p-0 pb-0" : "pb-24 lg:pb-10"}`}>
          {/* ── Unified Mobile Header (Visible on ALL mobile pages) ── */}
          {!isMessages && (
            <div className="lg:hidden h-16 bg-white/80 dark:bg-[#0A0F1C]/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 flex items-center justify-between px-4 shrink-0 sticky top-0 z-40 mb-4 relative">
              <div className="flex items-center gap-2 relative z-10">
                <button onClick={() => setIsMobileMenuOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 active:scale-95 transition-transform">
                  <Menu size={20} />
                </button>
                <Link href="/explorer-dashboard/settings" className="w-9 h-9 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm ml-1 block shrink-0">
                  <img src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name}&background=0F766E&color=fff`} className="w-full h-full object-cover" />
                </Link>
              </div>
              
              {/* Title (Only on subpages, truncated) */}
              {pathname !== "/explorer-dashboard" && (
                <h1 className="absolute left-1/2 -translate-x-1/2 font-black text-gray-900 dark:text-white text-base tracking-tight truncate max-w-[120px] pointer-events-none hidden sm:block">
                  {getPageTitle(pathname)}
                </h1>
              )}

              <div className="flex items-center gap-2 relative z-10">
                <Link 
                  href="/explorer-dashboard/notifications"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 active:scale-95 transition-transform relative"
                >
                  <Bell size={20} />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-[#FF8C00] text-white text-[9px] font-black rounded-full px-1 border-2 border-white dark:border-[#0F172A]">
                      {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => setLanguage(language === "en" ? "am" : "en")}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-bold text-[11px] active:scale-95 transition-transform"
                >
                  {language === "en" ? "አማ" : "EN"}
                </button>
                <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 active:scale-95 transition-transform">
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>
            </div>
          )}
          
          <div className={isMessages ? "" : "px-4 md:px-6 lg:px-10"}>
            {children}
          </div>
        </main>

        {/* ── Advanced Mobile Bottom Navigation ── */}
        {(!isMessages || !isChatActive) && (
          <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50 pointer-events-none">
            <div className="bg-white dark:bg-[#0F172A]/90 backdrop-blur-3xl border border-gray-200 dark:border-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] rounded-[2.5rem] flex justify-around items-center h-[72px] px-2 relative pointer-events-auto">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              
              {[
                { name: "Home", icon: LayoutDashboard, path: "/explorer-dashboard" },
                { name: "Explore", icon: Compass, path: "/explorer-dashboard/explore-tours" },
                { name: "Bookings", icon: CalendarCheck, path: "/explorer-dashboard/bookings" },
                { name: "Messages", icon: MessageSquare, path: "/explorer-dashboard/messages", badge: unreadMessagesCount },
                { name: "Profile", icon: User, path: "/explorer-dashboard/settings" },
              ].map((item) => {
                 const isActive = pathname === item.path || (item.path !== "/explorer-dashboard" && pathname?.startsWith(item.path));
                 return (
                   <Link key={item.name} href={item.path} className="relative flex-1 flex flex-col items-center justify-center h-full group transition-all duration-300">
                      <div className="relative z-10 flex flex-col items-center justify-center">
                        <item.icon 
                          width={22} height={22} 
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

                        {item.badge ? (
                          <span className={`absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-black rounded-full px-1 border-2 border-white dark:border-[#0F172A] transition-colors shadow-sm ${isActive ? "bg-[#0F766E] text-white" : "bg-[#FF8C00] text-white"}`}>
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        ) : null}
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
