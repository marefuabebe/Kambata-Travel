"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

/** Guides cannot access financial analytics — wallet handled by admin on completion */
export default function EarningsRestricted() {
  const { t } = useLanguage();
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto py-12"
    >
      <div className="bg-white dark:bg-[#0A0F1C] backdrop-blur-xl border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-12 md:p-16 text-center shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mb-8 border border-gray-100 dark:border-white/10 shadow-inner">
            <ShieldAlert className="text-gray-400 dark:text-gray-500" size={48} />
          </div>
          
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">{t("guidePages.earnings.title")}</h1>
          
          <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed font-medium mb-10 max-w-md">
            {t("guidePages.earnings.desc")}
          </p>
          
          <Link
            href="/guide-dashboard/assigned-tours"
            className="inline-flex items-center gap-2 bg-[#1A331B] hover:bg-[#0F172A] text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <ArrowLeft size={18} />
            {t("guidePages.earnings.viewTours")}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
