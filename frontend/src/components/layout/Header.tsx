"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Home, 
  Compass, 
  Map, 
  Crown, 
  Image as ImageIcon, 
  ScrollText, 
  MessageSquare,
  Music,
  Activity
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageDropdown } from "./LanguageDropdown";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { name: "Home", key: "home", href: "/", icon: Home },
  { name: "Explore", key: "explore", href: "/explore", icon: Compass },
  { name: "Tours", key: "tours", href: "/tours", icon: Map },
  { name: "Heritage", key: "heritage", href: "/heritage", icon: Crown },
  { name: "Gallery", key: "gallery", href: "/gallery", icon: ImageIcon },
  { name: "About", key: "about", href: "/about", icon: ScrollText },
  { name: "Contact", key: "contact", href: "/contact", icon: MessageSquare },
];

interface HeaderProps {
  isVisible?: boolean;
  theme?: "dark" | "light";
}

const Header: React.FC<HeaderProps> = ({ isVisible = true, theme = "dark" }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [isAudioActive, setIsAudioActive] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    handleResize(); // Initial check
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Body Scroll Lock logic
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  // Determine current theme state
  const isCreamHeader = (!isMobileMenuOpen && isScrolled) || (!isMobileMenuOpen && !isScrolled && theme === "light");

  return (
    <header 
      style={{ 
        zIndex: isMobileMenuOpen ? 9999 : 1000,
        display: isVisible ? "block" : "none", // Absolute visibility control
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? "auto" : "none"
      }}
      className={`fixed top-0 left-0 w-full transition-all duration-500 ${
        isCreamHeader 
          ? "lg:bg-white lg:h-20 lg:shadow-[0_10px_40px_rgba(15,23,42,0.05)] lg:border-b lg:border-gray-100" 
          : "bg-transparent lg:h-20"
      }`}
    >
      {/* Desktop Header (Design 1) */}
      <div className="hidden lg:block w-full px-8 pt-6 relative z-[10001] pointer-events-auto">
        <div className="w-full h-20 bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center justify-between px-8">
          
          {/* Logo Section */}
          <div className="flex items-center h-full">
            <Link href="/" className="relative flex items-center group">
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-12 flex items-center transition-transform duration-300 group-hover:scale-105"
              >
                <img loading="lazy" 
                  src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg" 
                  alt="Visit Kambaata Icon" 
                  className="h-full w-auto object-contain brightness-75 contrast-125"
                />
                <div className="ml-2 flex flex-col items-start justify-center text-[#1E293B]">
                  <span className="font-allura text-lg leading-none -mb-0.5 ml-0.5 font-bold text-[#059669]" style={{ WebkitTextStroke: '0.5px currentColor' }}>visit</span>
                  <span className="font-great-vibes text-2xl leading-none font-bold" style={{ WebkitTextStroke: '0.5px currentColor' }}>Kambata</span>
                </div>
              </motion.div>
            </Link>
            
            <div className="h-8 w-[1px] bg-gray-200 mx-6 xl:mx-8"></div>

            {/* Desktop Navigation */}
            <nav className="flex items-center gap-6 xl:gap-8">
              {navItems.map((item) => {
                const isActive = item.key === "home";
                return (
                  <Link 
                    key={item.name}
                    href={item.href} 
                    className={`flex items-center gap-2 text-[13px] font-black uppercase tracking-[0.1em] transition-all relative group font-display py-2 ${
                      isActive ? "text-[#059669]" : "text-[#1E293B] hover:text-[#059669]"
                    }`}
                  >
                    <item.icon className={`w-4 h-4 transition-transform group-hover:-translate-y-0.5 ${isActive ? "" : "opacity-70"}`} />
                    <span className="relative z-10 pt-0.5">{t(`nav.${item.key}`)}</span>
                    <span className={`absolute bottom-0 left-0 w-full h-[2.5px] transform transition-transform duration-300 origin-left ${
                      isActive ? "scale-x-100 bg-[#059669]" : "scale-x-0 group-hover:scale-x-100 bg-[#059669]"
                    }`} />
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Action Hub */}
          <div className="flex items-center gap-4">
            
            {/* Language Switcher */}
            <LanguageDropdown isMobilePill={true} />

            {user ? (
              <div className="flex items-center gap-3">
                <Link href={user.role === 'guide' ? "/guide-dashboard" : "/explorer-dashboard"} className="relative group">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-all shadow-sm">
                    <User className="w-5 h-5 stroke-[2]" />
                  </div>
                </Link>
                <button 
                  onClick={logout}
                  className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200 text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
                  title="Secure Logout"
                >
                  <LogOut className="w-4 h-4 stroke-[2]" />
                </button>
              </div>
            ) : (
              <Link href="/login" className="relative group ml-1">
                <div className="w-11 h-11 rounded-full flex items-center justify-center border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-all shadow-sm">
                  <User className="w-5 h-5 stroke-[2]" />
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Header (Design 3) */}
      <div className="lg:hidden absolute top-4 left-4 right-4 bg-white rounded-full overflow-visible shadow-lg border-t-4 border-[#059669] z-[10001] px-2 py-2 flex items-center justify-between pointer-events-auto h-16">
        
        {/* Logo */}
        <Link href="/" className="flex items-center pl-2 pb-1" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="flex flex-col items-start justify-center text-[#1E293B]">
            <span className="font-allura text-[15px] leading-none -mb-1 font-bold text-[#059669]" style={{ WebkitTextStroke: '0.5px currentColor' }}>visit</span>
            <span className="font-great-vibes text-[22px] leading-none font-bold" style={{ WebkitTextStroke: '0.3px currentColor' }}>Kambata</span>
            <svg width="60" height="6" viewBox="0 0 160 12" fill="none" className="mt-0.5 origin-left">
              <path d="M2 8 C40 2, 80 2, 120 6 S155 8, 158 5" stroke="#059669" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1.5 pr-1">
          {/* Language Dropdown */}
          <LanguageDropdown isMobilePill={true} />

          {/* Theme Toggle / Random Sun Icon from Design */}
          <button className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition-all shadow-sm">
            <Sun size={18} strokeWidth={2} />
          </button>

          {/* Profile */}
          <Link 
            href={user ? (user.role === 'guide' ? "/guide-dashboard" : "/explorer-dashboard") : "/login"} 
            className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-[#059669] hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
          >
            <User size={18} strokeWidth={2} />
          </Link>

          {/* Menu Toggle */}
          <button 
            className="w-10 h-10 rounded-full bg-[#059669] text-white flex items-center justify-center shadow-md active:scale-95 transition-all ml-0.5"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={22} strokeWidth={2.5} /> : <Menu size={22} strokeWidth={2.5} />}
          </button>
        </div>
      </div>

      {/* Advanced Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[100] bg-black flex flex-col pt-28 px-8 pb-10 overflow-y-auto"
          >
             <nav className="flex flex-col gap-6 mt-8">
                {navItems.map((item, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
                    key={item.name}
                  >
                    <Link 
                      href={item.href}
                      className={`text-2xl font-black text-white hover:text-[#C89B3C] transition-all flex items-center gap-4 group font-display`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#C89B3C]/20 transition-colors">
                        <item.icon className="w-5 h-5 text-white/80 group-hover:text-[#C89B3C] transition-colors" />
                      </div>
                      <span className="tracking-wide">{t(`nav.${item.key}`)}</span>
                    </Link>
                  </motion.div>
                ))}
             </nav>
             
             <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 0.6 }}
                className="mt-auto pt-12"
             >
                <div className="flex flex-col items-center gap-4">
                   <div className="w-12 h-1 bg-white/20 rounded-full mb-4" />
                   <span className="text-[#C89B3C] font-semibold tracking-[0.2em] uppercase text-xs">Kambaata Highland</span>
                   <div className="flex gap-6 text-white/50 text-[10px] uppercase tracking-widest mt-2">
                      <Link href="/privacy" onClick={() => setIsMobileMenuOpen(false)}>Privacy</Link>
                      <Link href="/terms" onClick={() => setIsMobileMenuOpen(false)}>Terms</Link>
                   </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>

  );
};

export default Header;
