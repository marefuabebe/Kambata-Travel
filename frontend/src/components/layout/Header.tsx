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
      {/* Desktop Header */}
      <div className="hidden lg:flex container mx-auto px-6 h-full items-center justify-between relative z-[10001] pointer-events-auto">
        
        {/* Logo Section */}
        <Link href="/" className="relative flex items-center h-full group" onClick={() => setIsMobileMenuOpen(false)}>
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-10 md:h-12 overflow-hidden py-1 transition-transform duration-300 group-hover:scale-105 flex items-center"
          >
            <img loading="lazy" 
              src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg" 
              alt="Visit Kambaata Icon" 
              className={`h-full w-auto object-contain transition-all duration-300 ${
                isCreamHeader ? "brightness-75 contrast-125" : "brightness-0 invert"
              }`}
            />
            <div className={`ml-2 flex flex-col items-start justify-center ${
                isCreamHeader ? "text-[#1E293B]" : "text-white"
            }`}>
              <span className="font-allura text-lg leading-none -mb-0.5 ml-0.5 font-bold text-[#12634d]" style={{ WebkitTextStroke: '0.5px currentColor' }}>visit</span>
              <span className="font-great-vibes text-2xl leading-none font-bold" style={{ WebkitTextStroke: '0.5px currentColor' }}>Kambata</span>
            </div>
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <Link 
              key={item.name}
              href={item.href} 
              className={`flex items-center gap-2 ${language === 'am' ? 'font-black text-[14px]' : 'font-black text-[13px]'} uppercase tracking-[0.15em] transition-all relative overflow-hidden group font-display ${
                isCreamHeader ? "text-gray-600 hover:text-[#D97706]" : "text-white/80 hover:text-[#D97706]"
              }`}
            >
              <item.icon className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5" />
              <span className="relative z-10">{t(`nav.${item.key}`)}</span>
              <span className={`absolute bottom-0 left-0 w-full h-[2px] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${
                isCreamHeader ? "bg-[#D97706]" : "bg-[#D97706]"
              }`} />
            </Link>
          ))}
        </nav>

          {/* Action Hub */}
          <div className="flex items-center gap-4 md:gap-6">
          
          {/* Language Switcher */}
          <LanguageDropdown isCreamHeader={isCreamHeader} />
          <div className={`h-6 w-[1px] hidden md:block ${
            isCreamHeader ? "bg-gray-200" : "bg-white/10"
          }`} />


          {user ? (
            <div className="flex items-center gap-4">
              <Link href={user.role === 'guide' ? "/guide-dashboard" : "/explorer-dashboard"} className="relative group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-[2px] shadow-md transition-all ${
                  isCreamHeader 
                    ? "border-gray-200 text-gray-600 bg-gray-50 group-hover:bg-[#1E293B] group-hover:border-[#1E293B] group-hover:text-white"
                    : "border-white text-white bg-white/20 group-hover:bg-white group-hover:text-[#1E293B]"
                }`}>
                  <User className="w-5 h-5 stroke-[2.5]" />
                </div>
              </Link>
              <button 
                onClick={logout}
                className={`p-2.5 rounded-xl border transition-all ${
                  isCreamHeader 
                    ? "bg-gray-50 border-gray-100 text-gray-500 hover:text-red-500 hover:bg-red-500/5 hover:border-red-500/20"
                    : "bg-white/5 border-white/10 text-white/60 hover:text-red-500"
                }`}
                title="Secure Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="relative group">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-[2px] shadow-md transition-all ${
                isCreamHeader 
                  ? "border-gray-200 text-gray-600 bg-gray-50 group-hover:bg-[#1E293B] group-hover:border-[#1E293B] group-hover:text-white"
                  : "border-white text-white bg-white/20 group-hover:bg-white group-hover:text-[#1E293B]"
              }`}>
                <User className="w-5 h-5 stroke-[2.5]" />
              </div>
            </Link>
          )}

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
