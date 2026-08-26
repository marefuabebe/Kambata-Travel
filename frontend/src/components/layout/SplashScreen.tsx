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

    // Cinematic splash for both mobile and desktop (2.5s)
    const duration = 2500;
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
                  src="https://res.cloudinary.com/dzf4st3t2/image/upload/f_auto,q_auto,w_800/v1787784033/ChatGPT_Image_Aug_27_2026_01_36_23_AM_ebnr7a.png"
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
               DESKTOP CINEMATIC SPLASH (1366px+)
            ═══════════════════════════════════════════ */
            <div className="fixed inset-0 w-[100vw] h-[100dvh] overflow-hidden">
              {/* ── Full-screen Background ── */}
              <motion.div
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <img
                  src="https://res.cloudinary.com/dzf4st3t2/image/upload/f_auto,q_auto,w_1920/v1787784033/ChatGPT_Image_Aug_27_2026_01_36_23_AM_ebnr7a.png"
                  alt="Kambata Landscape"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: "50% 30%" }}
                />
                {/* Cinematic overlays */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/15 to-black/70" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
              </motion.div>

              {/* ── Top Bar: brand mark + version ── */}
              <div className="relative z-10 flex justify-between items-start px-10 pt-8">
                {/* Brand mark - top left */}
                <motion.div
                  initial={{ opacity: 0, y: -15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="flex flex-col items-start"
                >
                  <span className="font-allura text-sm text-[#3CB371] leading-none" style={{ WebkitTextStroke: '0.3px currentColor' }}>visit</span>
                  <span className="font-great-vibes text-xl text-white leading-none -mt-0.5" style={{ WebkitTextStroke: '0.3px currentColor' }}>Kambata</span>
                </motion.div>

                {/* Version - top right */}
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="text-white/40 text-xs font-mono tracking-widest mt-2"
                >
                  v1.0.0
                </motion.span>
              </div>

              {/* ── Center Content ── */}
              <div className="relative z-10 flex flex-col items-center justify-center" style={{ height: "calc(100dvh - 140px)", marginTop: "-40px" }}>
                {/* "visit" */}
                <motion.span
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
                  className="font-allura text-5xl xl:text-6xl leading-none text-[#3CB371] drop-shadow-lg"
                  style={{ WebkitTextStroke: "0.4px currentColor" }}
                >
                  visit
                </motion.span>

                {/* "Kambata" */}
                <motion.span
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.7, ease: "easeOut" }}
                  className="font-great-vibes text-8xl xl:text-9xl leading-none text-white drop-shadow-2xl -mt-2"
                  style={{ WebkitTextStroke: "0.6px currentColor", textShadow: "0 4px 30px rgba(0,0,0,0.4)" }}
                >
                  Kambata
                </motion.span>

                {/* Green swoosh/underline */}
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ delay: 1.1, duration: 0.5, ease: "easeOut" }}
                  className="mt-1 origin-left"
                >
                  <svg width="160" height="12" viewBox="0 0 160 12" fill="none">
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
                  transition={{ delay: 1.3, duration: 0.5 }}
                  className="text-white/60 text-sm xl:text-base tracking-[0.4em] uppercase mt-8 font-medium"
                >
                  Explore &nbsp;·&nbsp; Discover &nbsp;·&nbsp; Experience
                </motion.p>

                {/* Location icon */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.5, duration: 0.5 }}
                  className="mt-10"
                >
                  <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-50"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* ── Bottom: gradient fade + green progress bar ── */}
              <div className="absolute bottom-0 left-0 right-0 z-10">
                {/* Subtle dark-to-transparent gradient */}
                <div className="h-32 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Green progress bar */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.7, duration: 0.4 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-32 h-[3px] bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[#3CB371] rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
