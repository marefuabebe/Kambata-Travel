"use client";
import React from "react";
import { LayoutDashboard } from "lucide-react";

import { motion } from "framer-motion";

export default function PageStub() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center min-h-[60vh]"
    >
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mb-6 shadow-sm"
      >
        <LayoutDashboard size={32} />
      </motion.div>
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-3xl font-black text-gray-900 mb-4 tracking-tight"
      >
        Module Under Construction
      </motion.h1>
    </motion.div>
  );
}
