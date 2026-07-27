"use client";

import React from "react";
import ChatInterface from "@/components/shared/ChatInterface";
import { PageHeader } from "@/components/guide/ui";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export default function GuideMessagesPage() {
  const { t } = useLanguage();
  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-6rem)] flex flex-col md:p-8 md:gap-6">
      <motion.div className="hidden md:block shrink-0 px-4 md:px-0 pt-4 md:pt-0" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <PageHeader
          title={t("guidePages.messages.title")}
          subtitle={t("guidePages.messages.subtitle")}
        />
      </motion.div>

      <motion.div className="flex-1 min-h-0 h-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <ChatInterface />
      </motion.div>
    </div>
  );
}
