"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if splash screen has already been shown in this session
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    if (hasSeenSplash) {
      setLoading(false);
      return;
    }

    // Fast loading animation — 600ms total
    const duration = 600;
    const interval = 30;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const rawProgress = (currentStep / steps);
      const easeProgress = 1 - Math.pow(1 - rawProgress, 3);
      
      setProgress(Math.min(easeProgress * 100, 100));

      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(() => {
          setLoading(false);
          sessionStorage.setItem("hasSeenSplash", "true");
        }, 150); // Brief hold at 100%
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            transition: { duration: 0.3, ease: "easeInOut" } 
          }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#071120] text-white overflow-hidden"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <img 
              src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg" 
              alt="Kambata Travel" 
              className="h-20 md:h-24 w-auto brightness-0 invert mb-12 drop-shadow-2xl"
            />
          </motion.div>

          {/* Progress Bar Container */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.2 }}
            className="w-64 max-w-[70vw] flex flex-col items-center"
          >
            {/* Progress Bar Track */}
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-4">
              {/* Progress Bar Fill */}
              <motion.div 
                className="h-full bg-gradient-to-r from-[#FF8C00] to-[#E65100]"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Percentage Text */}
            <div className="flex items-center justify-between w-full text-[10px] font-black tracking-[0.3em] uppercase text-gray-500">
              <span>Loading</span>
              <span className="text-[#FF8C00]">{Math.round(progress)}%</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

