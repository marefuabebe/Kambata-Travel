"use client";

import React, { Suspense } from "react";
import ChatInterface from "@/components/shared/ChatInterface";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export default function ExplorerMessagesPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-6rem)] flex flex-col md:p-8 md:gap-6">
      <motion.div className="hidden md:block shrink-0 px-4 md:px-0 pt-4 md:pt-0" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{t("messages.title")}</h1>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
          {t("messages.subtitle")}
        </p>
      </motion.div>

      <motion.div className="flex-1 min-h-0 h-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Suspense fallback={<div className="h-full flex items-center justify-center animate-pulse bg-gray-100 rounded-2xl">{t("messages.loading")}</div>}>
          <ChatInterface />
        </Suspense>
      </motion.div>
    </div>
  );
}
