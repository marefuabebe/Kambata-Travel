"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home, Compass } from "lucide-react";

export default function ExplorerDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Explorer Dashboard Runtime Error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-[#1E293B] rounded-[2rem] border border-gray-100 dark:border-white/10 p-8 shadow-2xl text-center relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={32} />
        </div>

        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
          Unable to Load Explorer Dashboard
        </h2>

        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          We encountered an unexpected issue while preparing your travel dashboard. You can reload the view or head back to explore tours.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#FF8C00] hover:bg-[#FF8C00]/90 text-white py-3.5 px-6 rounded-xl font-bold text-sm shadow-lg shadow-[#FF8C00]/20 transition-all active:scale-95"
          >
            <RefreshCw size={16} /> Reload View
          </button>
          <Link
            href="/explorer-dashboard/explore-tours"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 py-3.5 px-6 rounded-xl font-bold text-sm border border-gray-200 dark:border-white/10 transition-all active:scale-95"
          >
            <Compass size={16} /> Explore Tours
          </Link>
        </div>
      </div>
    </div>
  );
}
