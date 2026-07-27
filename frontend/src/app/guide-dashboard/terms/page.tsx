"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, ArrowLeft, AlertCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function GuideTermsPage() {
  const { t } = useLanguage();
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto pb-24"
    >
      <div className="mb-10 flex items-center gap-4">
        <Link 
          href="/guide-dashboard" 
          className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1E293B]/60 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-black text-4xl text-gray-900 dark:text-white tracking-tight mb-1">{t("guidePages.terms.title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">{t("guidePages.terms.subtitle")}</p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
        
        <div className="relative z-10 prose prose-lg prose-amber dark:prose-invert max-w-none">
          <div className="flex items-center gap-3 mb-8 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 w-fit px-4 py-2 rounded-xl">
             <FileText size={24} />
             <span className="font-bold">{t("guidePages.terms.guideAgreement")}</span>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium text-lg">
            {t("guidePages.terms.agreementDesc")}
          </p>
          
          <div className="my-10 space-y-6">
             <div className="flex gap-4 p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                <div className="w-12 h-12 shrink-0 bg-white dark:bg-white/10 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 shadow-sm">
                   <AlertCircle size={20} />
                </div>
                <div>
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white m-0 mb-2">{t("guidePages.terms.compliance")}</h3>
                   <p className="text-gray-600 dark:text-gray-400 m-0">{t("guidePages.terms.complianceDesc")}</p>
                </div>
             </div>
          </div>
          
          <hr className="border-gray-100 dark:border-white/10 my-8" />
          
          <p className="text-gray-500 dark:text-gray-400 text-base">
            {t("guidePages.terms.contactSupport")}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
