"use client";

import React, { Suspense } from "react";
import AdminChatInterface from "@/components/admin/ChatInterface";
import { PageHeader } from "@/components/admin/ui";
import { motion } from "framer-motion";

export default function AdminMessagesPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <PageHeader
          title="Operations Communications"
          subtitle="Monitor and oversee real-time communications between travelers and guides."
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Suspense fallback={<div className="flex justify-center p-12 text-emerald-500">Loading interface...</div>}>
          <AdminChatInterface />
        </Suspense>
      </motion.div>
    </div>
  );
}
