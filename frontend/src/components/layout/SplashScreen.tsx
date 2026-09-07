"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [activeDot, setActiveDot] = useState(0);

  const dismiss = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem("hasSeenSplash", "true");
  }, []);

  useEffect(() => {
    // Skip if already shown this session
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    if (hasSeenSplash) {
      setVisible(false);
      return;
    }

    // Progress bar effect over 10 seconds for mobile dots
    const interval = setInterval(() => {
      setActiveDot((prev) => (prev < 2 ? prev + 1 : prev));
    }, 3333);

    // Auto-dismiss splash screen after 10 seconds
    const timer = setTimeout(() => {
      dismiss();
    }, 10000);

    // On desktop, allow scroll or keypress to explore/dismiss
    const handleWheel = () => {
      dismiss();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        dismiss();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          id="global-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
          className="fixed inset-0 z-[99999] w-[100vw] h-[100dvh] overflow-hidden bg-[#0A1110] select-none"
          style={{ touchAction: "none" }}
        >
          {/* ══════════════════════════════════════════════════════════
              DESKTOP SPLASH VIEW (sm and above)
              Uses the official Hambaricho Mountain PC artwork
             ══════════════════════════════════════════════════════════ */}
          <div 
            className="hidden sm:block absolute inset-0 w-full h-full cursor-pointer"
            onClick={dismiss}
          >
            {/* Desktop Splash Artwork */}
            <motion.div
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src="https://res.cloudinary.com/dzf4st3t2/image/upload/f_auto,q_auto,w_1920/v1788764143/ChatGPT_Image_Sep_7_2026_09_37_17_AM_qrwy6r.png"
                alt="Kambata Travel - Discover Hambaricho Mountain"
                className="w-full h-full object-cover object-center pointer-events-none"
                loading="eager"
              />
            </motion.div>

            {/* Desktop Quick Skip Control (top right corner) */}
            <div className="absolute top-6 right-8 z-30 flex items-center gap-3">
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.4 }}
                onClick={(e) => {
                  e.stopPropagation();
                  dismiss();
                }}
                className="px-4 py-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white text-xs font-medium tracking-wider uppercase backdrop-blur-md border border-white/15 transition-all shadow-lg hover:scale-105 flex items-center gap-1.5"
              >
                <span>Skip</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </motion.button>
            </div>

            {/* Desktop Interactive Hotspot for "Explore Kambata ->" (bottom right) */}
            <div 
              className="absolute bottom-6 right-8 z-30 w-52 h-16 cursor-pointer"
              title="Click to Enter Kambata Travel"
            />

            {/* Desktop Interactive Hotspot for "SCROLL TO EXPLORE" (bottom center) */}
            <div 
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-44 h-16 cursor-pointer"
              title="Scroll or click to explore"
            />

            {/* Desktop Subtle Progress Line (bottom edge) */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-30">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 10, ease: "linear" }}
                className="h-full bg-emerald-500/80 shadow-[0_0_10px_#10b981]"
              />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              MOBILE SPLASH VIEW (below sm screen width)
              Preserves the mobile portrait layout & curved bottom
             ══════════════════════════════════════════════════════════ */}
          <div className="sm:hidden absolute inset-0 w-full h-full">
            {/* Mobile Background */}
            <motion.div
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <img
                src="https://res.cloudinary.com/dzf4st3t2/image/upload/f_auto,q_auto,w_1920/v1787784033/ChatGPT_Image_Aug_27_2026_01_36_23_AM_ebnr7a.png"
                alt="Kambata Landscape"
                className="w-full h-full object-cover"
                style={{ objectPosition: "50% 30%" }}
                loading="eager"
              />
              {/* Cinematic overlays */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/15 to-black/70" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
            </motion.div>

            {/* Mobile Top Bar */}
            <div
              className="relative z-10 flex justify-between items-start px-5 pt-4"
              style={{ paddingTop: "max(env(safe-area-inset-top), 16px)" }}
            >
              {/* Brand mark - top left */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="flex flex-col items-start"
              >
                <span
                  className="font-allura text-xs text-[#3CB371] leading-none"
                  style={{ WebkitTextStroke: "0.3px currentColor" }}
                >
                  visit
                </span>
                <span
                  className="font-great-vibes text-lg text-white leading-none -mt-0.5"
                  style={{ WebkitTextStroke: "0.3px currentColor" }}
                >
                  Kambata
                </span>
              </motion.div>

              {/* Version / Skip - top right */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                onClick={dismiss}
                className="text-white/60 text-[11px] font-medium tracking-wider uppercase px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm border border-white/10"
              >
                Skip
              </motion.button>
            </div>

            {/* Mobile Center Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-[calc(100dvh-220px)] -mt-2 px-4">
              {/* "visit" */}
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
                className="font-allura text-4xl leading-none text-[#3CB371] drop-shadow-lg"
                style={{ WebkitTextStroke: "0.4px currentColor" }}
              >
                visit
              </motion.span>

              {/* "Kambata" */}
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.7, ease: "easeOut" }}
                className="font-great-vibes text-7xl leading-none text-white drop-shadow-2xl -mt-2"
                style={{ WebkitTextStroke: "0.5px currentColor", textShadow: "0 4px 30px rgba(0,0,0,0.4)" }}
              >
                Kambata
              </motion.span>

              {/* Green swoosh underline */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.5, ease: "easeOut" }}
                className="mt-1 origin-left"
              >
                <svg width="140" height="12" viewBox="0 0 160 12" fill="none">
                  <path
                    d="M2 8 C40 2, 80 2, 120 6 S155 8, 158 5"
                    stroke="#3CB371"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </motion.div>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="text-white/60 text-[10px] tracking-[0.3em] uppercase mt-6 font-medium text-center"
              >
                Explore &nbsp;·&nbsp; Discover &nbsp;·&nbsp; Experience
              </motion.p>

              {/* Location icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4, duration: 0.5 }}
                className="mt-8"
              >
                <div className="w-14 h-14 rounded-full border border-[#3CB371]/40 flex items-center justify-center border-dashed">
                  <div className="w-10 h-10 rounded-full border border-[#3CB371]/60 flex items-center justify-center">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#3CB371"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Mobile Bottom Area: White Curve Design */}
            <div className="absolute bottom-0 left-0 right-0 z-10">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                className="flex flex-col w-full"
              >
                {/* SVG Curve */}
                <svg viewBox="0 0 1440 120" className="w-full h-[60px] block" preserveAspectRatio="none">
                  <path fill="#F8FAFC" d="M0,0 Q720,120 1440,0 L1440,120 L0,120 Z" />
                  <path
                    fill="none"
                    stroke="#059669"
                    strokeWidth="6"
                    d="M0,0 Q720,120 1440,0"
                    className="opacity-90"
                  />
                </svg>

                {/* Solid white block */}
                <div className="bg-[#F8FAFC] w-full pb-10 pt-4 flex flex-col items-center justify-center">
                  <div className="text-center text-[13px] text-slate-800 font-medium mb-6 leading-relaxed px-6">
                    The heart of <span className="text-[#059669]">Ethiopia</span>.<br />
                    The soul of nature and culture.
                  </div>

                  {/* Pagination Dots */}
                  <div className="flex items-center gap-2.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{
                          backgroundColor: activeDot >= i ? "#059669" : "#CBD5E1",
                          scale: activeDot === i ? 1.2 : 1,
                        }}
                        transition={{ duration: 0.3 }}
                        className="w-1.5 h-1.5 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
