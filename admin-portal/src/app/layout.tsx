"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Map,
  Award,
  CreditCard,
  LogOut,
  Bell,
  Search,
  ShieldAlert,
  ArrowLeftRight,
  MessageSquare,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  LifeBuoy,
  Siren,
  LucideIcon,
  BarChart3,
  Settings,
  Building2,
  ClipboardList,
  Menu,
  X,
  FileText,
} from "lucide-react";
import { useTheme } from "next-themes";
import { ThemeProvider } from "@/components/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { io } from "socket.io-client";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import apiClient from "@/utils/apiClient";

const NAV_FLAT = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { name: "Analytics", icon: BarChart3, path: "/analytics" },
  { name: "Tours", icon: Map, path: "/tours" },
  { name: "Destinations", icon: Map, path: "/destinations" },
  { name: "Tour Schedules", icon: Map, path: "/tours/schedules" },
  { name: "Packages", icon: MapPin, path: "/packages" },
  { name: "Package Schedules", icon: MapPin, path: "/packages/schedules" },
  { name: "Hotels", icon: Building2, path: "/hotels" },
  { name: "Room Types", icon: Building2, path: "/hotels/rooms" },
  { name: "Guides", icon: Award, path: "/guides" },
  { name: "Tour Bookings", icon: ArrowLeftRight, path: "/bookings/tour" },
  { name: "Package Bookings", icon: ArrowLeftRight, path: "/bookings/package" },
  { name: "Custom Requests", icon: ClipboardList, path: "/requests" },
  { name: "Customers", icon: Users, path: "/customers" },
  { name: "Attendance", icon: ClipboardList, path: "/attendance" },
  { name: "Check-In Audit", icon: ClipboardList, path: "/checkins" },
  { name: "Incident Reports", icon: ShieldAlert, path: "/incidents" },
  { name: "Transactions", icon: CreditCard, path: "/transactions" },
  { name: "Payments", icon: CreditCard, path: "/payments" },
  { name: "SOS Emergency", icon: Siren, path: "/sos", sos: true },
  { name: "Messages", icon: MessageSquare, path: "/messages" },
  { name: "Settings", icon: Settings, path: "/settings" },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [headerSearch, setHeaderSearch] = React.useState("");
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [openMenus, setOpenMenus] = React.useState<{ [key: string]: boolean }>({
    Tours: true,
    Bookings: true,
  });
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isLgScreen, setIsLgScreen] = React.useState(true);
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (user) {
      apiClient.get("/notifications")
        .then(({ data }) => {
          if (Array.isArray(data)) {
            setUnreadCount(data.filter((n: any) => !n.isRead).length);
          }
        })
        .catch(() => {});
    }
  }, [user, pathname]);

  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsLgScreen(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  React.useEffect(() => {
    if (isLgScreen) setIsMobileMenuOpen(false);
  }, [isLgScreen]);

  React.useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  React.useEffect(() => {
    if (!user) return;

    const getSocketUrl = () => {
      if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL.replace("/api", "");
      if (typeof window !== "undefined") {
        const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        if (!isLocalhost) return `http://${window.location.hostname}:5000`;
      }
      return "http://localhost:5000";
    };

    const socket = io(getSocketUrl(), {
      auth: { token: localStorage.getItem("adminToken") },
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("Real-time Admin Socket Connected");
    });

    socket.on("document_uploaded", (data: { guideName: string; documentType: string }) => {
      toast.custom(
        (t) => (
          <div
            className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-white dark:bg-[#1E293B] shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/10 p-4 border-l-4 border-[#FF8C00]`}
          >
            <div className="flex-1 w-0">
              <div className="flex items-start">
                <div className="ml-3 flex-1">
                  <p className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">New Document Uploaded <FileText className="w-4 h-4 text-[#FF8C00]" /></p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-bold">{data.guideName}</span> just submitted their{" "}
                    <span className="font-bold text-[#FF8C00]">{data.documentType}</span> for verification.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200 dark:border-white/10 pl-4 ml-4">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  router.push("/guides");
                }}
                className="text-sm font-bold text-[#FF8C00] hover:text-[#e67e22] transition-colors"
              >
                Review
              </button>
            </div>
          </div>
        ),
        { duration: 6000, position: "bottom-right" }
      );
    });

    socket.on("db_change", (data: { model: string; action: string; id: string }) => {
      if (typeof window !== "undefined") {
        console.log(`[Real-Time] Database change detected for ${data.model} (${data.action})`);
        window.dispatchEvent(new CustomEvent(`sync_${data.model.toLowerCase()}`));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, router]);

  const handleHeaderSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !headerSearch.trim()) return;
    const q = encodeURIComponent(headerSearch.trim());
    if (pathname.startsWith("/guides")) router.push(`/guides?search=${q}`);
    else if (pathname.startsWith("/customers")) router.push(`/customers?search=${q}`);
    else router.push(`/bookings/tour?search=${q}`);
  };

  if (pathname === "/login") return <>{children}</>;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A]">
        <p className="font-semibold text-slate-400">Loading admin portal…</p>
      </div>
    );
  }

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isExpanded = isSidebarOpen || isMobileMenuOpen;
  const closeMobile = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex font-sans transition-colors duration-300">


      {/* Sidebar — integrated with dashboard design system */}
      {/* ── Universal Sidebar ── */}
      <Sidebar 
        user={user}
        logout={logout}
        pathname={pathname || ""}
        router={router}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        navItems={NAV_FLAT}
        portalName="Admin Portal"
        portalLink="/"
        helpLink="/support"
        unreadNotificationsCount={unreadCount}
      />

      {/* Main content */}
      <main
        className="flex-1 flex flex-col min-w-0 min-h-screen transition-[margin] duration-300 ease-out"
      >
        <header className="sticky top-0 z-30 bg-[#F8FAFC]/90 dark:bg-[#0F172A]/90 backdrop-blur-xl border-b border-[#E2E8F0] dark:border-[#334155] px-4 md:px-8 py-3 flex justify-between items-center gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1 max-w-2xl">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-[#1E293B] border border-transparent hover:border-[#E2E8F0] dark:hover:border-[#334155] transition-colors"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <div className="relative w-full group hidden sm:block">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF8C00] transition-colors pointer-events-none"
                size={17}
              />
              <input
                type="search"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                onKeyDown={handleHeaderSearch}
                placeholder="Search..."
                aria-label="Search"
                className="w-full min-h-[44px] bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl py-2 pl-10 pr-4 text-sm font-medium text-[#0F172A] dark:text-white outline-none focus:border-[#FF8C00] focus:ring-2 focus:ring-[#FF8C00]/20 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <button
              type="button"
              className="sm:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-[#FF8C00]"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="min-h-[44px] min-w-[44px] bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#FF8C00] transition-colors shadow-sm"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link
              href="/notifications"
              className="min-h-[44px] min-w-[44px] bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#FF8C00] transition-colors relative shadow-sm"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 border-2 border-white dark:border-[#1E293B] text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            <div className="hidden md:flex items-center gap-2.5 pl-1">
              <div className="text-right">
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white leading-tight">{user.name}</p>
                <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">Master Access</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FF8C00]/10 border border-[#FF8C00]/20 flex items-center justify-center text-[#FF8C00] font-bold overflow-hidden shrink-0">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                ) : (
                  user.name?.[0] || "A"
                )}
              </div>
            </div>
          </div>
        </header>

        <div className={`w-full flex-1 px-4 md:px-8 pt-6 md:pt-8 min-w-0 ${pathname?.startsWith("/messages") ? "pb-0" : "pb-28 lg:pb-12"}`}>{children}</div>

        {/* ── Advanced Mobile Bottom Navigation ── */}
        {(!pathname?.startsWith("/messages")) && (
          <div className="lg:hidden fixed bottom-6 left-4 right-4 z-[100] pointer-events-none">
            <div className="bg-white dark:bg-[#0F172A]/90 backdrop-blur-3xl border border-[#E2E8F0] dark:border-[#334155] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] rounded-[2.5rem] flex justify-around items-center h-[72px] px-2 relative pointer-events-auto">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/50 to-transparent" />
              
              {[
                { name: "Home", icon: LayoutDashboard, path: "/" },
                { name: "Users", icon: Users, path: "/customers" },
                { name: "Bookings", icon: ArrowLeftRight, path: "/bookings/tour" },
                { name: "Messages", icon: MessageSquare, path: "/messages" },
                { name: "Settings", icon: Settings, path: "/settings" },
              ].map((item) => {
                 const isActive = pathname === item.path || (item.path !== "/" && pathname?.startsWith(item.path));
                 return (
                   <Link key={item.name} href={item.path} className="relative flex-1 flex flex-col items-center justify-center h-full group transition-all duration-300">
                      <div className="relative z-10 flex flex-col items-center justify-center">
                        <item.icon 
                          size={22} 
                          className={`transition-all duration-300 ease-out ${isActive ? "text-[#FF8C00] -translate-y-2 scale-110" : "text-slate-500 dark:text-slate-400 group-active:scale-90"}`} 
                          strokeWidth={isActive ? 3 : 2.5}
                        />
                        
                        <AnimatePresence>
                          {isActive && (
                            <motion.span 
                              initial={{ opacity: 0, y: 10, scale: 0.8 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.8 }}
                              transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                              className="absolute -bottom-4 text-[9px] font-black tracking-widest text-[#FF8C00] uppercase whitespace-nowrap"
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
      </main>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Kambata Admin</title>
        <meta name="application-name" content="Kambata Admin" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Kambata Admin" />
        <link rel="apple-touch-icon" href="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg" />
        <link rel="icon" href="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg" />
      </head>
      <body className="min-h-screen dark:bg-[#0F172A]">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <Toaster position="top-right" />
            <AdminShell>{children}</AdminShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
