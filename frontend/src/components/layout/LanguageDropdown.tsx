"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export function LanguageDropdown({ 
  isCreamHeader = false, 
  isDashboard = false,
  isMobilePill = false
}: { 
  isCreamHeader?: boolean;
  isDashboard?: boolean;
  isMobilePill?: boolean;
}) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "am", label: "አማርኛ", flag: "🇪🇹" },
  ];

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  const btnClass = isMobilePill 
    ? "px-3 h-10 rounded-full flex items-center justify-center gap-1.5 font-bold text-[11px] bg-white border border-gray-100 shadow-sm text-gray-700"
    : isDashboard
    ? "px-3 h-10 lg:h-12 rounded-xl lg:rounded-[1.25rem] flex items-center justify-center gap-1.5 font-bold text-[11px] lg:text-sm bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/5 shadow-sm text-gray-700 dark:text-gray-300 hover:text-[#1A331B] dark:hover:text-emerald-500 transition-all hover:shadow-md"
    : `px-3 py-2 rounded-xl flex items-center gap-1.5 font-bold transition-all border ${
        isCreamHeader
          ? "bg-white text-gray-900 border-gray-200 hover:bg-gray-50 shadow-sm"
          : "bg-white/20 text-white border-white/20 hover:bg-white/30 backdrop-blur-md"
      }`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={btnClass}
      >
        <span className="text-base leading-none">{currentLang.flag}</span>
        <span className="uppercase">{currentLang.code}</span>
        <ChevronDown size={14} className={`transition-transform ml-0.5 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute right-0 mt-2 w-36 rounded-xl shadow-xl border overflow-hidden z-[100] ${
              isCreamHeader || isDashboard
                ? "bg-white dark:bg-[#1E293B] border-gray-100 dark:border-white/10"
                : "bg-[#1E293B]/95 backdrop-blur-xl border-white/10"
            }`}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code as any);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                  language === lang.code
                    ? (isCreamHeader || isDashboard ? "bg-gray-50 dark:bg-white/5 text-[#0F766E] dark:text-emerald-400" : "bg-white/10 text-emerald-400")
                    : (isCreamHeader || isDashboard ? "hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300" : "hover:bg-white/10 text-white")
                } font-bold`}
              >
                <span className="text-xl leading-none">{lang.flag}</span>
                <span className="text-sm">{lang.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
