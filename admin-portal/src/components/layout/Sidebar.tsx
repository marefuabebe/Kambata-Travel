"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, HelpCircle, PanelLeftClose, PanelLeftOpen, BadgeCheck } from "lucide-react";

export type NavItem = {
  name: string;
  icon: React.ElementType;
  path: string;
  highlight?: boolean;
  sos?: boolean;
};

export type SidebarProps = {
  user: any;
  logout: () => void;
  pathname: string;
  router: any;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (val: boolean) => void;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
  navItems: NavItem[];
  portalName: string;
  portalLink: string;
  helpLink?: string;
};

export default function Sidebar({
  user,
  logout,
  pathname,
  router,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0,
  navItems,
  portalName,
  portalLink,
  helpLink,
}: SidebarProps) {
  // Collapse state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    const newVal = !isCollapsed;
    setIsCollapsed(newVal);
    localStorage.setItem("sidebarCollapsed", String(newVal));
  };

  const handleLinkClick = () => {
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const SidebarInner = ({ isMobile = false }: { isMobile?: boolean }) => {
    const collapsed = isMobile ? false : isCollapsed;
    
    return (
      <div className="flex flex-col h-full overflow-hidden relative">
        {/* ── Logo Header ── */}
        <div className="h-24 flex items-center px-5 border-b border-gray-200 dark:border-white/10 shrink-0 relative transition-all duration-300">
          <Link href={portalLink} onClick={handleLinkClick} className={`flex items-center gap-3 group w-full ${collapsed ? 'justify-center' : ''}`}>
            <div className="h-8 md:h-10 overflow-hidden flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
              <img loading="lazy" 
                src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg" 
                alt="Kambata" 
                className="h-full w-auto object-contain dark:brightness-0 dark:invert"
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col opacity-100 transition-opacity duration-300 delay-100 min-w-0">
                <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white leading-none truncate">Kambata</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 truncate">{portalName}</span>
              </div>
            )}
          </Link>
          {/* Desktop Collapse Toggle */}
          {!isMobile && (
            <button 
              onClick={toggleCollapse} 
              className="absolute right-[-14px] top-1/2 -translate-y-1/2 w-7 h-7 bg-white dark:bg-[#0A0F1C] border border-gray-200 dark:border-white/10 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all shadow-sm z-[200] focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            </button>
          )}
        </div>

        {/* ── Profile Section ── */}
        <div className={`p-4 border-b border-gray-200 dark:border-white/10 transition-all duration-300 ${collapsed ? 'flex justify-center items-center' : ''}`}>
          <Link href={`${portalLink}/settings`} onClick={handleLinkClick} className={`flex items-center group rounded-[12px] hover:bg-gray-100/80 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/10 relative ${collapsed ? 'justify-center p-0' : 'gap-3 p-2'}`}>
            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-white/10 shrink-0 shadow-sm relative">
              <img loading="lazy"
                src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name}&background=FF8C00&color=fff`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col overflow-hidden min-w-0">
                <span className="font-medium text-sm text-gray-900 dark:text-white truncate flex items-center gap-1.5 transition-colors">
                  {user?.name?.split(" ")[0]}
                  {user?.guideStatus === "approved" && (
                    <BadgeCheck size={16} className="text-[#10B981] shrink-0" />
                  )}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">{user?.role || "User"}</span>
              </div>
            )}
            
            {/* Tooltip for collapsed state */}
            {collapsed && (
              <div className="fixed left-[90px] px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100] shadow-xl border border-white/10">
                {user?.name}
              </div>
            )}
          </Link>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-2 custom-scrollbar overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path !== portalLink && pathname?.startsWith(item.path));
            
            return (
              <div key={item.path} className="relative group">
                <Link
                  href={item.path}
                  onClick={handleLinkClick}
                  aria-label={item.name}
                  className={`flex items-center rounded-[12px] text-sm font-medium transition-all duration-300 relative focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'
                  } ${
                    isActive 
                      ? 'text-gray-900 dark:text-white bg-gray-100/80 dark:bg-white/5 shadow-sm before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-[#FF8C00] before:rounded-r-full' 
                      : item.sos
                      ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/5 hover:bg-red-100 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20'
                      : item.highlight
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/5 hover:bg-emerald-100 dark:hover:bg-emerald-500/10 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-500/20'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-[#1E293B] border border-transparent hover:border-gray-200 dark:hover:border-white/10'
                  }`}
                >
                  <Icon 
                    size={18} 
                    className={`relative z-10 transition-colors shrink-0 ${
                      isActive ? 'text-[#FF8C00]' 
                      : item.sos ? 'text-red-500 dark:text-red-400'
                      : item.highlight ? 'text-emerald-500 dark:text-emerald-400'
                      : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white'
                    }`} 
                  />
                  {!collapsed && (
                    <>
                      <span className="relative z-10 truncate min-w-0 flex-1">{item.name}</span>
                      
                      {/* Badges */}
                      {item.name === "Messages" && unreadMessagesCount > 0 && (
                        <span className="ml-auto flex items-center justify-center bg-[#FF8C00] text-white text-[10px] font-black rounded-full min-w-[20px] h-[20px] px-1 shrink-0 shadow-sm">
                          {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                        </span>
                      )}
                      {item.name === "Notifications" && unreadNotificationsCount > 0 && (
                        <span className="ml-auto flex items-center justify-center bg-[#FF8C00] text-white text-[10px] font-black rounded-full min-w-[20px] h-[20px] px-1 shrink-0 shadow-sm">
                          {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                        </span>
                      )}
                      {item.highlight && !isActive && (
                        <span className="ml-auto text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white px-1.5 py-0.5 rounded-md shrink-0 shadow-sm">New</span>
                      )}
                      {item.sos && !isActive && (
                        <span className="ml-auto flex items-center gap-1 shrink-0">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                        </span>
                      )}
                    </>
                  )}

                  {/* Collapsed Badges (Dot only) */}
                  {collapsed && (
                    <>
                      {((item.name === "Messages" && unreadMessagesCount > 0) || (item.name === "Notifications" && unreadNotificationsCount > 0)) && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF8C00] rounded-full border border-white dark:border-gray-900"></span>
                      )}
                      {item.sos && !isActive && (
                        <span className="absolute top-2 right-2 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                      )}
                    </>
                  )}
                </Link>
                
                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="fixed left-[90px] px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100] shadow-xl border border-white/10 flex items-center gap-2">
                    {item.name}
                    {item.name === "Messages" && unreadMessagesCount > 0 && <span className="bg-[#FF8C00] text-white px-1.5 rounded-full text-[10px]">{unreadMessagesCount}</span>}
                    {item.name === "Notifications" && unreadNotificationsCount > 0 && <span className="bg-[#FF8C00] text-white px-1.5 rounded-full text-[10px]">{unreadNotificationsCount}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Footer ── */}
        <footer className="p-4 border-t border-gray-200 dark:border-white/10 space-y-2 shrink-0">
          {helpLink && (
            <div className="relative group">
              <Link href={helpLink} onClick={handleLinkClick} aria-label="Help" className={`flex items-center rounded-[12px] text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-colors ${collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'}`}>
                <HelpCircle size={18} className="text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors shrink-0" /> 
                {!collapsed && <span className="truncate min-w-0 flex-1">Help</span>}
              </Link>
              {collapsed && (
                <div className="fixed left-[90px] px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100] shadow-xl border border-white/10">
                  Help
                </div>
              )}
            </div>
          )}
          <div className="relative group">
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/");
              }}
              aria-label="Sign Out"
              className={`w-full flex items-center rounded-[12px] text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/5 hover:text-red-600 dark:hover:text-red-400 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20 ${collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'}`}
            >
              <LogOut size={18} className="text-gray-400 dark:text-gray-500 group-hover:text-red-500 transition-colors shrink-0" /> 
              {!collapsed && <span className="truncate min-w-0 flex-1 text-left">Sign Out</span>}
            </button>
            {collapsed && (
              <div className="fixed left-[90px] px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100] shadow-xl border border-white/10">
                Sign Out
              </div>
            )}
          </div>
        </footer>
      </div>
    );
  };

  if (!mounted) return null;

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 80 : 270 }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className="hidden lg:flex bg-white dark:bg-[#0A0F1C] border-r border-gray-200 dark:border-white/10 h-screen sticky top-0 shrink-0 z-40 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
      >
        <SidebarInner />
      </motion.aside>

      {/* ── Mobile Sidebar Overlay ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[270px] bg-white dark:bg-[#0A0F1C] border-r border-gray-200 dark:border-white/10 flex flex-col h-screen shrink-0 z-[110] shadow-2xl"
            >
              {/* Force expanded on mobile always */}
              <div className="w-[270px] h-full relative">
                <SidebarInner isMobile={true} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
