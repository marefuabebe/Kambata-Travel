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
  Activity,
  Sun
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
      className={`fixed top-0 left-0 w-full transition-all duration-500 z-[10000] ${
        isCreamHeader 
          ? "bg-white h-16 lg:h-20 shadow-[0_10px_40px_rgba(15,23,42,0.05)] border-b border-gray-100" 
          : "bg-transparent h-16 lg:h-20"
      }`}
    >
      {/* Desktop Header */}
      <div className="hidden lg:flex container mx-auto px-6 h-full items-center justify-between relative z-[10001] pointer-events-auto">
          
        {/* Logo (Left) */}
        <div className="flex items-center">
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
                className="h-10 w-auto object-contain transition-all duration-300"
                style={isCreamHeader ? { filter: "brightness(0) saturate(100%) invert(39%) sepia(30%) saturate(1512%) hue-rotate(113deg) brightness(97%) contrast(98%)" } : { filter: "brightness(0) invert(1)" }} 
              />
              <div className="ml-2 flex flex-col items-start justify-center transition-colors duration-300">
                <span className={`font-allura text-[15px] leading-none -mb-1 font-bold ${isCreamHeader ? 'text-[#059669]' : 'text-white'}`} style={{ WebkitTextStroke: '0.5px currentColor' }}>visit</span>
                <span className={`font-great-vibes text-[22px] leading-none font-bold ${isCreamHeader ? 'text-[#1E293B]' : 'text-white'}`} style={{ WebkitTextStroke: '0.3px currentColor' }}>Kambata</span>
              </div>
            </motion.div>
          </Link>
        </div>

        {/* Navigation (Centered) */}
        <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-7 xl:gap-9">
          {navItems.map((item) => {
            const isActive = item.key === "home";
            return (
              <Link 
                key={item.name}
                href={item.href} 
                className={`flex flex-col relative group cursor-pointer transition-all ${
                  isActive 
                    ? (isCreamHeader ? "text-[#059669]" : "text-white") 
                    : (isCreamHeader ? "text-[#475569] hover:text-[#059669]" : "text-white/80 hover:text-white")
                }`}
              >
                <div className="flex items-center gap-1.5 pb-[6px]">
                  <item.icon className={`w-[18px] h-[18px] transition-transform group-hover:-translate-y-[1px] ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
                  <span className="text-[13px] font-bold uppercase tracking-wide pt-[2px] font-sans">{t(`nav.${item.key}`)}</span>
                </div>
                {/* Active Underline */}
                <span className={`absolute bottom-0 left-0 w-full h-[2px] rounded-full transform transition-transform duration-300 origin-center ${
                  isActive ? (isCreamHeader ? "scale-x-100 bg-[#059669]" : "scale-x-100 bg-white") : (isCreamHeader ? "scale-x-0 group-hover:scale-x-100 bg-[#059669]" : "scale-x-0 group-hover:scale-x-100 bg-white")
                }`} />
              </Link>
            );
          })}
        </nav>

        {/* Action Hub */}
        <div className="flex items-center gap-4">
          
          {/* Language Switcher */}
          <LanguageDropdown isCreamHeader={isCreamHeader} />

          {user ? (
            <div className="flex items-center gap-3">
              <Link href={user.role === 'guide' ? "/guide-dashboard" : "/explorer-dashboard"} className="relative group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all shadow-sm ${
                  isCreamHeader
                    ? "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
                    : "border-white/20 text-white bg-white/10 hover:bg-white/20 backdrop-blur-md"
                }`}>
                  <User className="w-5 h-5 stroke-[2]" />
                </div>
              </Link>
              <button 
                onClick={logout}
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all shadow-sm ${
                  isCreamHeader
                    ? "border-gray-200 text-gray-500 hover:text-red-500 hover:bg-red-50"
                    : "border-white/20 text-white/80 hover:text-red-400 bg-white/10 hover:bg-white/20 backdrop-blur-md"
                }`}
                title="Secure Logout"
              >
                <LogOut className="w-4 h-4 stroke-[2]" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="relative group ml-1">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all shadow-sm ${
                isCreamHeader
                  ? "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
                  : "border-white/20 text-white bg-white/10 hover:bg-white/20 backdrop-blur-md"
              }`}>
                <User className="w-5 h-5 stroke-[2]" />
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden w-full h-full px-4 flex items-center justify-end relative z-[10001] pointer-events-auto">
        
        {/* Logo */}
        <Link href="/" className="hidden items-center group" onClick={() => setIsMobileMenuOpen(false)}>
          <img loading="lazy" 
            src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg" 
            alt="Visit Kambaata Icon" 
            className="h-8 w-auto object-contain transition-all duration-300"
            style={isCreamHeader ? { filter: "brightness(0) saturate(100%) invert(39%) sepia(30%) saturate(1512%) hue-rotate(113deg) brightness(97%) contrast(98%)" } : { filter: "brightness(0) invert(1)" }} 
          />
          <div className="ml-1.5 flex flex-col items-start justify-center transition-colors duration-300">
            <span className={`font-allura text-[13px] leading-none -mb-1 font-bold ${isCreamHeader ? 'text-[#059669]' : 'text-white'}`} style={{ WebkitTextStroke: '0.5px currentColor' }}>visit</span>
            <span className={`font-great-vibes text-[20px] leading-none font-bold ${isCreamHeader ? 'text-[#1E293B]' : 'text-white'}`} style={{ WebkitTextStroke: '0.3px currentColor' }}>Kambata</span>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {/* Language Dropdown */}
          <LanguageDropdown isCreamHeader={isCreamHeader} />

          {/* Theme Toggle (Removed random Sun icon to match desktop flat layout cleaner action hub) */}

          {/* Profile */}
          <Link 
            href={user ? (user.role === 'guide' ? "/guide-dashboard" : "/explorer-dashboard") : "/login"} 
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm ${
              isCreamHeader 
                ? "border border-gray-200 text-gray-600 bg-white hover:bg-gray-50" 
                : "border border-white/20 text-white bg-white/10 hover:bg-white/20 backdrop-blur-md"
            }`}
          >
            <User size={18} strokeWidth={2} />
          </Link>

          {/* Menu Toggle */}
          <button 
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md ml-0.5 ${
              isCreamHeader 
                ? "bg-[#059669] text-white hover:bg-[#047857]" 
                : "bg-white text-[#059669] hover:bg-gray-100"
            }`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
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
                      <Link href="/privacy" onClick={() => setIsMobileMenuOpen(false)}>{t('footer.privacy')}</Link>
                      <Link href="/terms" onClick={() => setIsMobileMenuOpen(false)}>{t('footer.terms')}</Link>
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
