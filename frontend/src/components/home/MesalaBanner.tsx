"use client";

import React, { useState, useEffect } from "react";
import { Flame, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const MesalaBanner = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Mesala typically falls around late September (Sept 27 for this example)
    const targetDate = new Date("2026-09-27T00:00:00").getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      setTimeLeft({
        days: Math.max(0, Math.floor(distance / (1000 * 60 * 60 * 24))),
        hours: Math.max(0, Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))),
        mins: Math.max(0, Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))),
        secs: Math.max(0, Math.floor((distance % (1000 * 60)) / 1000))
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="bg-[#145A41] py-16 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#D97706] rounded-full blur-[120px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-[100px] opacity-10 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          
          {/* Left Text */}
          <div className="text-center lg:text-left flex-1">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
              <Flame className="text-[#D97706] w-6 h-6 animate-pulse" />
              <span className="text-[#D97706] font-black uppercase tracking-[0.3em] text-xs">Cultural Heritage</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              Countdown to <span className="text-[#D97706]">Mesala 2026</span>
            </h2>
            <p className="text-white/80 max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed">
              Experience Kambata's vibrant New Year celebration. Join thousands in welcoming the new harvest with traditional dancing, bonfires, and indigenous cuisine.
            </p>
            <Link href="/heritage" className="inline-flex items-center gap-2 mt-8 text-white font-bold uppercase tracking-widest text-xs hover:text-[#D97706] transition-colors">
              Read the Heritage Story <ArrowRight size={14} />
            </Link>
          </div>

          {/* Right Countdown Boxes */}
          {isClient && (
            <div className="flex gap-4 md:gap-6 shrink-0">
              {[
                { label: "Days", val: timeLeft.days },
                { label: "Hours", val: timeLeft.hours },
                { label: "Mins", val: timeLeft.mins },
                { label: "Secs", val: timeLeft.secs }
              ].map((item) => (
                <div key={item.label} className="bg-white backdrop-blur-md border border-white/20 w-20 h-24 md:w-28 md:h-32 rounded-2xl flex flex-col items-center justify-center shadow-2xl">
                  <span className="text-3xl md:text-5xl font-black text-white mb-1">
                    {String(item.val).padStart(2, '0')}
                  </span>
                  <span className="text-[#D97706] text-[10px] md:text-xs font-bold uppercase tracking-widest">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </section>
  );
};

export default MesalaBanner;
