"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface PaymentExpiryTimerProps {
  /** ISO string or Date of when the payment session expires */
  expiresAt: string | Date;
  /** Called when the timer reaches zero (before the expired UI is shown) */
  onExpired?: () => void;
  /** Where to go if user clicks "Return to Tours" */
  returnHref?: string;
  /** Where to go if user clicks "Try Again" */
  retryHref?: string;
}

/**
 * PaymentExpiryTimer
 *
 * Displays a countdown for the 30-minute payment hold window.
 * - Shows mm:ss in green while > 5 min remain
 * - Pulses amber at 5 min, red at 2 min
 * - Shows a full expired overlay with actionable buttons when time is up
 * - Slot-release is handled server-side; this is purely a UX signal
 */
export default function PaymentExpiryTimer({
  expiresAt,
  onExpired,
  returnHref = "/tours",
  retryHref,
}: PaymentExpiryTimerProps) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const expiry = new Date(expiresAt).getTime();
    return Math.max(0, Math.floor((expiry - Date.now()) / 1000));
  });
  const [expired, setExpired] = useState(secondsLeft <= 0);

  const handleExpiry = useCallback(() => {
    setExpired(true);
    onExpired?.();
  }, [onExpired]);

  useEffect(() => {
    if (expired) return;

    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          handleExpiry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [expired, handleExpiry]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const isUrgent = secondsLeft <= 120;   // under 2 min — red
  const isWarning = secondsLeft <= 300;  // under 5 min — amber

  const colorClass = isUrgent
    ? "text-red-600"
    : isWarning
    ? "text-amber-600"
    : "text-emerald-600";

  const bgClass = isUrgent
    ? "bg-red-50 border-red-200"
    : isWarning
    ? "bg-amber-50 border-amber-200"
    : "bg-emerald-50 border-emerald-200";

  const iconClass = isUrgent
    ? "text-red-500"
    : isWarning
    ? "text-amber-500"
    : "text-emerald-500";

  if (expired) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white rounded-[2rem] p-10 max-w-md w-full text-center shadow-2xl border border-gray-100"
          >
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
              <Clock size={36} className="text-red-500" />
            </div>

            <h2 className="text-2xl font-black text-gray-900 mb-3">
              Payment Session Expired
            </h2>
            <p className="text-gray-500 font-medium mb-8 leading-relaxed">
              Your 30-minute payment hold has expired and your reserved slots
              have been released. Please start a new booking to continue.
            </p>

            <div className="flex flex-col gap-3">
              {retryHref && (
                <button
                  onClick={() => router.push(retryHref)}
                  className="
                    w-full py-4 rounded-2xl font-black text-white text-sm uppercase tracking-widest
                    bg-gradient-to-r from-[#145A41] to-[#1E7A5A]
                    shadow-lg shadow-green-900/20
                    hover:shadow-xl hover:shadow-green-900/30 hover:-translate-y-0.5
                    transition-all duration-200
                    flex items-center justify-center gap-2
                  "
                >
                  <RefreshCw size={16} />
                  Try Again
                </button>
              )}
              <button
                onClick={() => router.push(returnHref)}
                className="
                  w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest
                  border-2 border-gray-200 text-gray-600
                  hover:border-[#145A41] hover:text-[#145A41]
                  transition-all duration-200
                  flex items-center justify-center gap-2
                "
              >
                <ArrowLeft size={16} />
                Return to Tours
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${bgClass} transition-colors duration-1000`}
      animate={isUrgent ? { scale: [1, 1.02, 1] } : {}}
      transition={{ repeat: Infinity, duration: 1.5 }}
    >
      {isWarning ? (
        <AlertTriangle size={16} className={iconClass} />
      ) : (
        <Clock size={16} className={iconClass} />
      )}

      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          Complete payment within
        </span>
        <span className={`text-xl font-black tabular-nums leading-none ${colorClass}`}>
          {formatted}
        </span>
      </div>

      {isWarning && (
        <span className={`text-[10px] font-bold ml-auto ${colorClass}`}>
          {isUrgent ? "Expiring soon!" : "Almost out of time"}
        </span>
      )}
    </motion.div>
  );
}
