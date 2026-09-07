"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [activeDot, setActiveDot] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const dismiss = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
    }
    setVisible(false);
    sessionStorage.setItem("hasSeenSplash", "true");
  }, []);

  // Ambient sound synthesizer (gentle birdsong & mountain breeze)
  const toggleAudio = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (isPlayingAudio) {
      if (audioContextRef.current) {
        try {
          audioContextRef.current.suspend();
        } catch {
          // ignore
        }
      }
      setIsPlayingAudio(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioContextRef.current) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        // Soft mountain breeze pink noise generator
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99 * b0 + white * 0.05;
          b1 = 0.96 * b1 + white * 0.08;
          b2 = 0.86 * b2 + white * 0.15;
          output[i] = (b0 + b1 + b2) * 0.06;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 450;

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNodeRef.current = masterGain;

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        masterGain.connect(ctx.destination);
        whiteNoise.start();

        // Subtle bird chirps interval
        const playBirdChirp = () => {
          if (!audioContextRef.current || audioContextRef.current.state !== "running") return;
          const osc = ctx.createOscillator();
          const chirpGain = ctx.createGain();
          const t = ctx.currentTime;
          osc.type = "sine";
          osc.frequency.setValueAtTime(2400 + Math.random() * 800, t);
          osc.frequency.exponentialRampToValueAtTime(3200 + Math.random() * 600, t + 0.08);
          osc.frequency.exponentialRampToValueAtTime(2000, t + 0.16);

          chirpGain.gain.setValueAtTime(0, t);
          chirpGain.gain.linearRampToValueAtTime(0.08, t + 0.03);
          chirpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

          osc.connect(chirpGain);
          chirpGain.connect(masterGain);
          osc.start(t);
          osc.stop(t + 0.2);
        };

        const chirpTimer = setInterval(() => {
          if (audioContextRef.current?.state === "running") {
            if (Math.random() > 0.4) playBirdChirp();
          }
        }, 3200);

        // Store timer to cleanup
        (ctx as unknown as { _chirpTimer: NodeJS.Timeout })._chirpTimer = chirpTimer;
      } else if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }
      setIsPlayingAudio(true);
    } catch (err) {
      console.warn("Audio Context could not be initiated:", err);
    }
  };

  useEffect(() => {
    // Skip if already shown this session
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    if (hasSeenSplash) {
      setVisible(false);
      return;
    }

    // Progress dots for mobile
    const interval = setInterval(() => {
      setActiveDot((prev) => (prev < 2 ? prev + 1 : prev));
    }, 3333);

    // Auto dismiss after 10s
    const timer = setTimeout(() => {
      dismiss();
    }, 10000);

    // Desktop scroll / keys
    const handleWheel = () => dismiss();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["Escape", "Enter", " ", "ArrowDown"].includes(e.key)) dismiss();
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
          exit={{ opacity: 0, transition: { duration: 0.7, ease: "easeInOut" } }}
          className="fixed inset-0 z-[99999] w-[100vw] h-[100dvh] overflow-hidden bg-[#0A1110] select-none"
          style={{ touchAction: "none" }}
        >
          {/* ══════════════════════════════════════════════════════════
              DESKTOP SPLASH VIEW (sm screens and above)
              Clean background + high-fidelity React UI layout
             ══════════════════════════════════════════════════════════ */}
          <div
            className="hidden sm:block absolute inset-0 w-full h-full cursor-default"
            onClick={dismiss}
          >
            {/* 1. RAW CLEAN BACKGROUND IMAGE (No pre-baked text) */}
            <motion.div
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src="https://res.cloudinary.com/dzf4st3t2/image/upload/f_auto,q_auto,w_1920/v1788768454/ChatGPT_Image_Sep_7_2026_11_07_10_AM_dfwpt6.png"
                alt="Hambaricho Mountain Landscape"
                className="w-full h-full object-cover object-center pointer-events-none"
                loading="eager"
              />

              {/* Cinema Left Vignette Gradient for Text Readability */}
              <div className="absolute inset-y-0 left-0 w-[55%] bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none" />

              {/* Top & Bottom Subtle Vignettes */}
              <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/50 via-black/15 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
            </motion.div>

            {/* 2. TOP BAR (Brand Logo on Left + Nature Sounds Widget on Right) */}
            <div className="relative z-20 flex justify-between items-center px-10 xl:px-14 pt-8">
              {/* Brand Logo */}
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  <svg width="40" height="34" viewBox="0 0 40 34" fill="none" className="drop-shadow-lg">
                    <path
                      d="M11 27L20 9L29 27H11Z"
                      stroke="white"
                      strokeWidth="2.75"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 27L10 13L16.5 24"
                      stroke="white"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="20" cy="8" r="4" fill="#3CB371" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-heading font-bold text-2xl text-white tracking-wide leading-tight drop-shadow-md">
                    Kambata
                  </span>
                  <span className="font-sans text-[11px] text-white/85 tracking-[0.25em] uppercase font-medium">
                    Travel & Tours
                  </span>
                </div>
              </motion.div>

              {/* Right Side: Nature Sounds Widget & Skip Button */}
              <div className="flex items-center gap-4">
                {/* Nature Sounds Glass Pill */}
                <motion.div
                  initial={{ opacity: 0, y: -15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  onClick={toggleAudio}
                  className="bg-white/90 hover:bg-white backdrop-blur-md rounded-full pl-2 pr-5 py-2 shadow-2xl flex items-center gap-3 border border-white/50 cursor-pointer transition-all hover:scale-105"
                  title="Click to toggle ambient nature sounds"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-colors ${
                      isPlayingAudio ? "bg-emerald-600 animate-pulse" : "bg-[#155E42]"
                    }`}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      {isPlayingAudio && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
                    </svg>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-800 leading-tight">
                      Nature Sounds
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Birds & Mountain Breeze
                    </span>
                  </div>
                  {/* Animated Waveform Bars */}
                  <div className="flex items-center gap-[2.5px] ml-2 h-4">
                    {[10, 16, 8, 14, 11].map((h, idx) => (
                      <span
                        key={idx}
                        className={`w-[2.5px] rounded-full bg-slate-400 ${
                          isPlayingAudio ? "animate-pulse bg-emerald-600" : ""
                        }`}
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                </motion.div>

                {/* Skip Button */}
                <motion.button
                  initial={{ opacity: 0, y: -15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    dismiss();
                  }}
                  className="px-4 py-2 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white text-xs font-medium tracking-wider uppercase backdrop-blur-md border border-white/15 transition-all shadow-lg hover:scale-105 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Skip</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* 3. FLOATING MOUNTAIN SUMMIT CALLOUT PIN (Above Peak) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.7 }}
              className="absolute top-[21%] right-[27%] z-20 pointer-events-none hidden xl:flex flex-col items-start"
            >
              <div className="flex items-center gap-2 drop-shadow-md">
                <span className="w-5 h-5 rounded-full bg-[#105E42] text-white flex items-center justify-center text-[10px] shadow">
                  📍
                </span>
                <div className="flex flex-col">
                  <span className="font-great-vibes text-xl text-white drop-shadow leading-none">
                    Hambaricho Mountain
                  </span>
                  <span className="text-[8.5px] font-mono tracking-[0.25em] text-white/80 uppercase font-semibold">
                    Kambata Zone
                  </span>
                </div>
              </div>
              {/* Little curved pointer arrow */}
              <svg width="24" height="20" viewBox="0 0 24 20" fill="none" className="ml-2 mt-1 text-white/80">
                <path
                  d="M4 2 C12 6, 16 12, 18 18 M14 18 L18 18 L18 14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>

            {/* 4. MAIN HERO CONTENT (Left Column) */}
            <div className="relative z-20 flex flex-col justify-center h-[calc(100dvh-170px)] px-10 xl:px-14 max-w-2xl">
              {/* "DISCOVER —" */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex items-center gap-3 mb-2"
              >
                <span className="font-sans text-xs uppercase tracking-[0.35em] text-white/95 font-bold drop-shadow">
                  DISCOVER
                </span>
                <span className="w-9 h-[2px] bg-[#3CB371] rounded-full shadow-[0_0_8px_#3cb371]" />
              </motion.div>

              {/* Title: Hambaricho */}
              <motion.h1
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.7 }}
                className="font-display text-6xl xl:text-7xl font-bold text-white tracking-tight leading-[1.02] drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
              >
                Hambaricho
              </motion.h1>

              {/* Title: Mountain 🌿 */}
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.7 }}
                className="flex items-center gap-3.5 mb-5"
              >
                <span className="font-display text-6xl xl:text-7xl font-bold text-[#3CB371] tracking-tight leading-[1.02] drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                  Mountain
                </span>
                <svg
                  width="38"
                  height="38"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-[#3CB371] drop-shadow-lg -rotate-12 transform origin-bottom-left"
                >
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
                </svg>
              </motion.div>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="text-white/90 text-sm xl:text-base font-normal max-w-md leading-relaxed drop-shadow-md mb-8"
              >
                Stand at the heart of Kambata, where nature, culture and adventure come together.
              </motion.p>

              {/* Three Feature Pillars */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85, duration: 0.6 }}
                className="flex items-center gap-6 xl:gap-8 mb-6"
              >
                {/* 1. Breathtaking Views */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-emerald-400/50 flex items-center justify-center text-emerald-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
                    </svg>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-white text-xs font-semibold leading-tight drop-shadow">
                      Breathtaking
                    </span>
                    <span className="text-white/75 text-[11px] font-medium leading-tight">
                      Views
                    </span>
                  </div>
                </div>

                <div className="w-[1px] h-8 bg-white/25" />

                {/* 2. Rich Culture */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-emerald-400/50 flex items-center justify-center text-emerald-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22v-7" />
                      <path d="M9 9c0-3.5 3-7 3-7s3 3.5 3 7a4 4 0 0 1-6 0z" />
                      <path d="M12 15c-3 0-5.5-1.5-6.5-4" />
                      <path d="M12 15c3 0 5.5-1.5 6.5-4" />
                    </svg>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-white text-xs font-semibold leading-tight drop-shadow">
                      Rich
                    </span>
                    <span className="text-white/75 text-[11px] font-medium leading-tight">
                      Culture
                    </span>
                  </div>
                </div>

                <div className="w-[1px] h-8 bg-white/25" />

                {/* 3. Unforgettable Adventures */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-emerald-400/50 flex items-center justify-center text-emerald-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                    </svg>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-white text-xs font-semibold leading-tight drop-shadow">
                      Unforgettable
                    </span>
                    <span className="text-white/75 text-[11px] font-medium leading-tight">
                      Adventures
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* "Explore Kambata ->" handwritten script */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0, duration: 0.6 }}
                onClick={(e) => {
                  e.stopPropagation();
                  dismiss();
                }}
                className="flex items-center gap-2 cursor-pointer group mt-2 w-fit"
              >
                <span className="font-great-vibes text-3xl xl:text-4xl text-[#3CB371] drop-shadow-md group-hover:text-emerald-300 transition-colors">
                  Explore Kambata
                </span>
                <span className="text-[#3CB371] text-xl group-hover:translate-x-1.5 transition-transform">
                  →
                </span>
              </motion.div>
            </div>

            {/* 5. TRADITIONAL GEOMETRIC ETHNIC EMBROIDERY BORDER (Bottom-Left) */}
            <div className="absolute bottom-0 left-0 z-10 pointer-events-none opacity-40">
              <svg width="220" height="90" viewBox="0 0 220 90" fill="none" className="text-emerald-300">
                <path
                  d="M0 80 L20 60 L40 80 L60 60 L80 80 L100 60 L120 80 L140 60 L160 80 L180 60 L200 80 L220 60"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M0 65 L20 45 L40 65 L60 45 L80 65 L100 45 L120 65 L140 45 L160 65 L180 45 L200 65 L220 45"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M10 55 L20 45 L30 55 L20 65 Z M50 55 L60 45 L70 55 L60 65 Z M90 55 L100 45 L110 55 L100 65 Z M130 55 L140 45 L150 55 L140 65 Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
            </div>

            {/* 6. BOTTOM RIGHT: AMBIENT CARD WITH ETHIOPIAN BIRD */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.6 }}
              onClick={toggleAudio}
              className="absolute bottom-8 right-10 xl:right-14 z-20 flex items-center gap-3 bg-black/60 hover:bg-black/80 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/15 cursor-pointer shadow-2xl transition-all hover:scale-105"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-600/80 text-white flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              </div>
              <span className="text-xs text-white/90 font-medium italic">
                Feel the rhythm of Kambata...
              </span>
              {/* Cute singing bird icon & musical notes */}
              <div className="flex items-center gap-1 text-emerald-400">
                <span className="text-base animate-bounce">🐦</span>
                <span className="text-[10px] animate-pulse">♪</span>
              </div>
            </motion.div>

            {/* 7. BOTTOM CENTER: SCROLL TO EXPLORE */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              onClick={dismiss}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              {/* Mouse Pill */}
              <div className="w-5 h-8 rounded-full border-2 border-white/70 group-hover:border-emerald-400 flex items-start justify-center pt-1.5 transition-colors">
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-1 h-1.5 rounded-full bg-white group-hover:bg-emerald-400 transition-colors"
                />
              </div>
              <span className="text-[9.5px] font-sans font-bold tracking-[0.25em] text-white/80 group-hover:text-white uppercase transition-colors">
                SCROLL TO EXPLORE
              </span>
              <motion.span
                animate={{ y: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-[#3CB371] text-xs font-bold -mt-0.5"
              >
                ∨
              </motion.span>
            </motion.div>

            {/* 8. SUBTLE PROGRESS BAR (Bottom Edge) */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10 z-30">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 10, ease: "linear" }}
                className="h-full bg-[#3CB371] shadow-[0_0_10px_#3cb371]"
              />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              MOBILE SPLASH VIEW (portrait below sm screen width)
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
                src="https://res.cloudinary.com/dzf4st3t2/image/upload/f_auto,q_auto,w_1920/v1788768454/ChatGPT_Image_Sep_7_2026_11_07_10_AM_dfwpt6.png"
                alt="Kambata Landscape"
                className="w-full h-full object-cover"
                style={{ objectPosition: "45% 30%" }}
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/70" />
            </motion.div>

            {/* Mobile Top Bar */}
            <div
              className="relative z-10 flex justify-between items-start px-5 pt-4"
              style={{ paddingTop: "max(env(safe-area-inset-top), 16px)" }}
            >
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

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                onClick={dismiss}
                className="text-white/60 text-[11px] font-medium tracking-wider uppercase px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 cursor-pointer"
              >
                Skip
              </motion.button>
            </div>

            {/* Mobile Center Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-[calc(100dvh-220px)] -mt-2 px-4">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
                className="font-allura text-4xl leading-none text-[#3CB371] drop-shadow-lg"
                style={{ WebkitTextStroke: "0.4px currentColor" }}
              >
                visit
              </motion.span>

              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.7, ease: "easeOut" }}
                className="font-great-vibes text-7xl leading-none text-white drop-shadow-2xl -mt-2"
                style={{ WebkitTextStroke: "0.5px currentColor", textShadow: "0 4px 30px rgba(0,0,0,0.4)" }}
              >
                Kambata
              </motion.span>

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

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="text-white/80 text-[10px] tracking-[0.3em] uppercase mt-6 font-medium text-center"
              >
                Explore &nbsp;·&nbsp; Discover &nbsp;·&nbsp; Experience
              </motion.p>

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

            {/* Mobile Bottom: White Curved Card */}
            <div className="absolute bottom-0 left-0 right-0 z-10">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                className="flex flex-col w-full"
              >
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

                <div className="bg-[#F8FAFC] w-full pb-10 pt-4 flex flex-col items-center justify-center">
                  <div className="text-center text-[13px] text-slate-800 font-medium mb-6 leading-relaxed px-6">
                    The heart of <span className="text-[#059669]">Ethiopia</span>.<br />
                    The soul of nature and culture.
                  </div>

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
