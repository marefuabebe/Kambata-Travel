"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    // Detect mobile
    const checkMobile = () => setIsMobile(window.innerWidth <= 430);
    checkMobile();

    // Check if splash screen has already been shown in this session
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    if (hasSeenSplash) {
      setLoading(false);
      return;
    }

    // Mobile: longer cinematic splash (2.5s), Desktop: fast (600ms)
    const duration = window.innerWidth <= 430 ? 2500 : 600;
    const interval = 30;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const rawProgress = currentStep / steps;
      const easeProgress = 1 - Math.pow(1 - rawProgress, 3);

      setProgress(Math.min(easeProgress * 100, 100));

      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(() => {
          setLoading(false);
          sessionStorage.setItem("hasSeenSplash", "true");
        }, 200);
      }
    }, interval);

    // Dot animation for mobile
    const dotTimer = setInterval(() => {
      setActiveDot((prev) => (prev + 1) % 3);
    }, 800);

    return () => {
      clearInterval(timer);
      clearInterval(dotTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.4, ease: "easeInOut" },
          }}
          className="fixed inset-0 z-[99999] overflow-hidden"
          style={{ touchAction: "none" }}
        >
          {isMobile ? (
            /* ═══════════════════════════════════════════
               MOBILE CINEMATIC SPLASH (320–430px)
            ═══════════════════════════════════════════ */
            <div className="relative w-full h-[100dvh] flex flex-col overflow-hidden">
              {/* ── Background Image ── */}
              <div className="absolute inset-0">
                <img
                  src="https://res.cloudinary.com/dzf4st3t2/image/upload/f_auto,q_auto,w_800/v1782037994/kambata/xbsw2ajsabbtz4tuwjvl.jpg"
                  alt="Kambata Landscape"
                  className="w-full h-full object-cover object-center"
                  style={{ objectPosition: "50% 35%" }}
                />
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
              </div>

              {/* ── Top Corners ── */}
              <div className="relative z-10 flex justify-between items-start px-5 pt-[env(safe-area-inset-top,12px)]" style={{ paddingTop: "max(env(safe-area-inset-top), 16px)" }}>
                {/* Brand mark - top left */}
                <motion.img
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 0.8, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg"
                  alt="Brand"
                  className="h-10 w-auto brightness-0 invert drop-shadow-lg"
                />
                {/* Version - top right */}
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="text-white/50 text-[10px] font-mono tracking-wider mt-3"
                >
                  v 1.0.0
                </motion.span>
              </div>

              {/* ── Center Logo Area ── */}
              <div className="relative z-10 flex-1 flex flex-col items-center justify-center -mt-8">
                {/* "visit" text */}
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                  className="font-allura text-[2.5rem] leading-none text-[#3CB371] drop-shadow-lg"
                  style={{ WebkitTextStroke: "0.3px currentColor" }}
                >
                  visit
                </motion.span>

                {/* "Kambata" text */}
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
                  className="font-great-vibes text-[4.5rem] leading-none text-white drop-shadow-2xl -mt-3"
                  style={{ WebkitTextStroke: "0.5px currentColor" }}
                >
                  Kambata
                </motion.span>

                {/* Divider line */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="w-10 h-[2px] bg-white/60 mt-6 mb-5"
                />

                {/* Tagline */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0, duration: 0.5 }}
                  className="text-white/70 text-[11px] font-bold tracking-[0.35em] uppercase"
                >
                  Explore. Discover. Experience.
                </motion.p>

                {/* Map/Location Icon Circle */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                  className="mt-8 relative"
                >
                  {/* Outer dashed ring */}
                  <div className="w-20 h-20 rounded-full border border-dashed border-white/25 flex items-center justify-center">
                    {/* Inner solid ring */}
                    <div className="w-16 h-16 rounded-full border border-[#3CB371]/40 flex items-center justify-center">
                      {/* Map icon SVG */}
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#3CB371"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-70"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                        <path d="M3 17l4-4M17 3l4 4" opacity="0.4" />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* ── Curved White Bottom Section ── */}
              <div className="relative z-10">
                {/* SVG Curve with green accent */}
                <svg
                  viewBox="0 0 430 80"
                  preserveAspectRatio="none"
                  className="w-full h-16 block"
                  style={{ marginBottom: "-1px" }}
                >
                  {/* Green accent line */}
                  <path
                    d="M0,45 Q107,0 215,35 Q323,70 430,25"
                    fill="none"
                    stroke="#12634d"
                    strokeWidth="2.5"
                  />
                  {/* White fill below curve */}
                  <path
                    d="M0,48 Q107,3 215,38 Q323,73 430,28 L430,80 L0,80 Z"
                    fill="#FAFAFA"
                  />
                </svg>

                {/* White bottom panel */}
                <div className="bg-[#FAFAFA]" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}>
                  <div className="flex flex-col items-center px-6 pb-2">
                    {/* Bottom text */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.4, duration: 0.5 }}
                      className="text-center mb-5"
                    >
                      <p className="text-[#1E293B] text-sm font-medium leading-relaxed">
                        The heart of <span className="text-[#12634d] font-bold">Ethiopia</span>.
                      </p>
                      <p className="text-[#1E293B] text-sm font-medium leading-relaxed">
                        The soul of nature and culture.
                      </p>
                    </motion.div>

                    {/* Pagination dots */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.6, duration: 0.4 }}
                      className="flex items-center gap-2"
                    >
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className={`rounded-full transition-all duration-500 ${
                            activeDot === i
                              ? "w-2.5 h-2.5 bg-[#12634d]"
                              : "w-2 h-2 bg-gray-300"
                          }`}
                        />
                      ))}
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ═══════════════════════════════════════════
               DESKTOP SPLASH (original fast loader)
            ═══════════════════════════════════════════ */
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#071120] text-white">
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
                  <span className="text-[#FF8C00]">
                    {Math.round(progress)}%
                  </span>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
