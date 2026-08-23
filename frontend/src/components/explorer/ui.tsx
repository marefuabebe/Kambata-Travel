"use client";

import React from "react";
import { Loader2, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function PageHeader({
  title,
  subtitle,
  action,
  showBackButton = false,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  showBackButton?: boolean;
}) {
  const router = useRouter();
  
  return (
    <div className="mb-8 mt-6 lg:mt-8 relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-white to-gray-50 dark:from-[#1E293B] dark:to-[#0F172A] border border-gray-100 dark:border-white/10 p-8 shadow-xl dark:shadow-2xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF8C00]/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          {showBackButton && (
            <div className="lg:hidden mb-4">
              <button onClick={() => router.back()} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-700 dark:text-white text-xs font-bold hover:bg-gray-200 dark:hover:bg-white/10 active:scale-95 transition-all w-fit backdrop-blur-md">
                <ChevronLeft size={16} />
                Back
              </button>
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">{title}</h1>
          {subtitle && <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium max-w-xl leading-relaxed">{subtitle}</p>}
        </div>
        
        {action && (
          <div className="shrink-0 relative z-20 mt-4 md:mt-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "emerald",
}: {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  accent?: "emerald" | "amber" | "blue" | "orange";
}) {
  const accents = {
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20",
    amber: "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20",
    blue: "bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20",
    orange: "bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20",
  };
  
  const iconColors = {
    emerald: "text-emerald-500",
    amber: "text-amber-500",
    blue: "text-blue-500",
    orange: "text-orange-500",
  };

  const bgColors = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    blue: "bg-blue-500",
    orange: "bg-orange-500",
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] backdrop-blur-xl p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl dark:shadow-none hover:bg-gray-50 dark:hover:bg-white/5 transition-all group relative overflow-hidden flex items-center gap-5">
      <div className={`p-4 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 border ${accents[accent]}`}>
        {Icon && <Icon size={24} className={iconColors[accent]} />}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">{label}</p>
        <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{value}</p>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl rounded-[3rem] border border-dashed border-gray-200 dark:border-white/10 p-16 text-center shadow-sm">
      <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">{description}</p>
      {action}
    </div>
  );
}

export function LoadingCenter() {
  return (
    <div className="flex justify-center items-center py-32">
      <div className="relative">
        <div className="absolute inset-0 bg-[#FF8C00] blur-xl opacity-20 rounded-full animate-pulse" />
        <Loader2 className="animate-spin text-[#FF8C00] relative z-10" size={48} />
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const s = status?.toLowerCase() || "";
  const cls =
    s.includes("confirm") || s.includes("paid") || s === "completed"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
      : s.includes("pending") || s.includes("wait")
        ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-[#FF8C00]/10 dark:text-[#FF8C00] dark:border-[#FF8C00]/20"
        : s.includes("cancel") || s.includes("fail") || s === "expired"
          ? "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
          : "bg-gray-50 text-gray-600 border-gray-100 dark:bg-white/5 dark:text-gray-400 dark:border-white/10";
  return (
    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${cls}`}>
      {status}
    </span>
  );
}
