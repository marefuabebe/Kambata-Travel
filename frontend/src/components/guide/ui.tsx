"use client";

import React from "react";
import { Loader2, Star } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export const MESSAGE_TEMPLATES = [
  { id: 1, label: "Welcome", text: "Welcome to the tour! I am your guide and I'm excited to meet you all." },
  { id: 2, label: "Meeting Point", text: "Just a reminder: we are meeting at the designated meeting point in 30 minutes." },
  { id: 3, label: "Running Late", text: "Please let me know if you are running late so we can coordinate." },
];

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-2 max-w-xl">{subtitle}</p>}
      </div>
      {action && (
        <div className="flex gap-3">
          {action}
        </div>
      )}
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
  accent?: "emerald" | "amber" | "blue" | "red" | "slate";
}) {
  const accents = {
    emerald: "bg-emerald-500",
    amber: "bg-[#FF8C00]",
    blue: "bg-blue-500",
    red: "bg-red-500",
    slate: "bg-slate-500",
  };
  
  const textAccents = {
    emerald: "text-emerald-500",
    amber: "text-[#FF8C00]",
    blue: "text-blue-500",
    red: "text-red-500",
    slate: "text-slate-500",
  };

  return (
    <div className="bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl dark:shadow-none hover:bg-gray-50 dark:hover:bg-white/5 transition-all group relative overflow-hidden flex items-center gap-5">
      {/* Background ambient glow */}
      <div className={`absolute top-1/2 right-0 w-32 h-32 ${accents[accent]} opacity-5 dark:opacity-10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/4 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity`} />
      
      {/* Icon block */}
      {Icon && (
        <div className={`w-14 h-14 ${accents[accent]} rounded-[1.25rem] flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-all relative z-10 shrink-0`}>
          <Icon width={26} height={26} />
        </div>
      )}
      
      {/* Text content */}
      <div className="flex-1 relative z-10 flex flex-col justify-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
        <div className="flex items-end gap-3">
           <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none">{value}</p>
           {/* Decorative trend or status dot depending on value */}
           {Number(value) > 0 && accent === 'amber' && (
              <span className="relative flex h-2 w-2 mb-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF8C00] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF8C00]"></span>
              </span>
           )}
        </div>
      </div>
      
      {/* Subtle hover border glow */}
      <div className={`absolute inset-0 border-2 border-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] pointer-events-none ${textAccents[accent].replace('text-', 'border-')}/10`} />
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
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-gray-50 dark:bg-[#0F172A]/50 rounded-[3rem] border border-dashed border-gray-200 dark:border-white/10">
      <div className="w-20 h-20 bg-white dark:bg-white/5 shadow-sm rounded-3xl flex items-center justify-center text-gray-300 dark:text-gray-600 mb-6">
        <Loader2 size={32} className="opacity-40" />
      </div>
      <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">{description}</p>
      {action}
    </div>
  );
}

export function LoadingCenter() {
  return (
    <div className="flex justify-center items-center py-32">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gray-100 dark:border-white/5 rounded-full"></div>
        <div className="w-16 h-16 border-4 border-[#145A41] dark:border-[#10B981] rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Scheduled: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
    "In Progress": "bg-orange-50 text-orange-700 border-orange-100 dark:bg-[#FF8C00]/10 dark:text-[#FF8C00] dark:border-[#FF8C00]/20",
    Completed: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    Locked: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30",
    open: "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    under_review: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    resolved: "bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
  };
  const key = status in styles ? status : "Scheduled";
  return (
    <span
      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${styles[key]}`}
    >
      {status}
    </span>
  );
}

export function ContactActions({
  phone,
  email,
}: {
  phone?: string;
  email?: string;
}) {
  const { t } = useLanguage();
  if (!phone && !email) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {phone && (
        <>
          <a
            href={`tel:${phone}`}
            className="text-xs font-bold px-4 py-2.5 rounded-xl bg-[#145A41] text-white hover:bg-[#0d3d2c] shadow-md shadow-[#145A41]/20 transition-all hover:-translate-y-0.5"
          >
            {t("guidePages.common.call")}
          </a>
          <a
            href={`https://wa.me/${phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold px-4 py-2.5 rounded-xl bg-[#25D366] text-white shadow-md shadow-[#25D366]/20 transition-all hover:-translate-y-0.5"
          >
            {t("guidePages.common.whatsapp")}
          </a>
        </>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className="text-xs font-bold px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all hover:-translate-y-0.5"
        >
          {t("guidePages.common.email")}
        </a>
      )}
    </div>
  );
}

export function getMessageTemplates(t: (key: string) => string) {
  return [
    { id: "meeting", label: t("guidePages.messageTemplates.meeting"), text: t("guidePages.messageTemplates.meetingText") },
    { id: "delay", label: t("guidePages.messageTemplates.delay"), text: t("guidePages.messageTemplates.delayText") },
    { id: "emergency", label: t("guidePages.messageTemplates.emergency"), text: t("guidePages.messageTemplates.emergencyText") },
    { id: "thanks", label: t("guidePages.messageTemplates.thanks"), text: t("guidePages.messageTemplates.thanksText") },
  ];
}

export function MobileWelcomeHeader({
  guideName,
  rating,
  toursThisMonth,
}: {
  guideName: string;
  rating: string | number;
  toursThisMonth: number;
}) {
  const { t } = useLanguage();
  return (
    <div className="mx-4 mt-4 mb-2 px-6 py-8 bg-gradient-to-br from-white to-[#DBEAFE] dark:from-[#0F172A] dark:to-[#1E293B] text-slate-900 dark:text-white rounded-3xl relative overflow-hidden shadow-2xl border border-white/50 dark:border-white/5">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/50 dark:bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="relative z-10">
        <h1 className="text-3xl font-black tracking-tight mb-3">
          {t("guideDashboard.mobileWelcome.greeting").replace("{name}", guideName)}
        </h1>
        <div className="flex gap-4 text-sm font-semibold text-slate-600 dark:text-gray-300">
          <div className="flex items-center gap-1">
            <span className="text-[#0284C7] dark:text-[#38BDF8] inline-flex items-center"><Star size={12} className="fill-current mr-0.5" /></span> {t("guideDashboard.mobileWelcome.rating").replace("{rating}", String(rating))}
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/30 self-center"></div>
          <div>{t("guideDashboard.mobileWelcome.toursThisMonth").replace("{n}", String(toursThisMonth))}</div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Skeletons & Empty State
// -----------------------------------------------------------------------------

export function SkeletonHeader() {
  return (
    <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse mb-6"></div>
  );
}

export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
      <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse mb-6"></div>
  );
}

export function SkeletonTimeline() {
  return (
    <div className="space-y-4">
      <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
      <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
      <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
    </div>
  );
}

