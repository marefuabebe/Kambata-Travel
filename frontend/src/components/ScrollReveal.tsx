"use client";

import { motion } from "framer-motion";
import React from "react";

export default function ScrollReveal({ 
  children, 
  delay = 0 
}: { 
  children: React.ReactNode, 
  delay?: number 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
