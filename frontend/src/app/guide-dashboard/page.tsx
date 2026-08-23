"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Clock,
  ArrowRight,
  Activity,
  CloudSun,
  Navigation,
  Phone,
  ShieldAlert,
  ClipboardCheck,
  CreditCard,
  BarChart,
  Map,
  MoreHorizontal,
  Siren
} from "lucide-react";
import apiClient from "@/utils/apiClient";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { PageHeader, StatCard, LoadingCenter, MobileWelcomeHeader, SkeletonHeader, SkeletonGrid, SkeletonCard, SkeletonTimeline, EmptyState } from "@/components/guide/ui";
import { useWeather } from "@/hooks/useWeather";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";

export default function GuideDashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const weather = useWeather();
  const unreadMessagesCount = useRealtimeMessages();

  useEffect(() => {
    apiClient
      .get("/guide-ops/dashboard")
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <div className="hidden lg:block"><LoadingCenter /></div>
        <div className="lg:hidden px-4 pt-4">
          <SkeletonHeader />
          <SkeletonGrid />
          <SkeletonCard />
          <SkeletonTimeline />
        </div>
      </>
    );
  }

  const w = data?.widgets || {};

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <>
      {/* ────────────────────────────────────────────────────────────────────────
          DESKTOP VIEW (UNTOUCHED) 
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="hidden lg:block max-w-7xl mx-auto space-y-10 pb-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <PageHeader
            title={t("guideDashboard.header.greeting").replace("{name}", user?.name?.split(" ")[0] || t("guideDashboard.header.guideFallback"))}
            subtitle={t("guideDashboard.header.subtitle")}
          />
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <motion.div variants={itemVariants} className="h-full"><StatCard label={t("guideDashboard.stats.todaysTours")} value={w.todaysTours ?? 0} icon={Calendar} accent="emerald" /></motion.div>
          <motion.div variants={itemVariants} className="h-full"><StatCard label={t("guideDashboard.stats.upcomingTours")} value={w.upcomingTours ?? 0} icon={Clock} accent="blue" /></motion.div>
          <motion.div variants={itemVariants} className="h-full"><StatCard label={t("guideDashboard.stats.unreadMessages")} value={unreadMessagesCount} icon={MessageSquare} accent="amber" /></motion.div>
        </motion.div>

        {user?.guideStatus === "pending" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-3xl p-6 md:p-8 flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-2">Verification Pending</h3>
              <p className="text-amber-800 dark:text-amber-200/80 mb-4 text-sm md:text-base">
                Your guide profile is created but you cannot receive assignments yet. Please ensure your <strong>National ID</strong> and <strong>Tour Guide License</strong> are uploaded in your profile so our team can verify you.
              </p>
              <Link href="/guide-dashboard/profile" className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm">
                Complete Profile
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="lg:col-span-2"
          >
            {data?.upcomingSchedule ? (
              <div className="bg-gradient-to-br from-white to-[#DBEAFE] dark:from-[#0F172A] dark:to-[#1E293B] rounded-[3rem] p-10 text-slate-900 dark:text-white shadow-2xl relative overflow-hidden h-full flex flex-col justify-between group border border-[#BFDBFE] dark:border-white/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#BFDBFE]/40 dark:bg-[#38BDF8]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-[#FF8C00] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#FF8C00]/20">
                      <Clock size={20} />
                    </div>
                    <h2 className="text-xs font-black uppercase tracking-widest text-[#0284C7] dark:text-[#38BDF8]">
                      {t("guideDashboard.nextAssignment.tag")}
                    </h2>
                  </div>
                  
                  <p className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-8 leading-tight">
                    {data.upcomingSchedule.tourName}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-6 mb-10">
                    <div className="bg-white/60 dark:bg-white/5 rounded-2xl p-4 backdrop-blur-md border border-white dark:border-white/10">
                      <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-gray-400 mb-1">{t("guideDashboard.nextAssignment.dateTime")}</p>
                      <p className="font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                        <Calendar size={14} className="text-[#0284C7] dark:text-[#38BDF8]" /> 
                        {new Date(data.upcomingSchedule.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    <div className="bg-white/60 dark:bg-white/5 rounded-2xl p-4 backdrop-blur-md border border-white dark:border-white/10">
                      <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-gray-400 mb-1">{t("guideDashboard.nextAssignment.location")}</p>
                      <p className="font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                        <MapPin size={14} className="text-[#0284C7] dark:text-[#38BDF8]" /> 
                        {data.upcomingSchedule.destination}
                      </p>
                    </div>
                    <div className="bg-white/60 dark:bg-white/5 rounded-2xl p-4 backdrop-blur-md border border-white dark:border-white/10">
                      <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-gray-400 mb-1">{t("guideDashboard.nextAssignment.meetingPoint")}</p>
                      <p className="font-bold truncate text-slate-800 dark:text-white" title={data.upcomingSchedule.meetingPoint}>{data.upcomingSchedule.meetingPoint}</p>
                    </div>
                    <div className="bg-white/60 dark:bg-white/5 rounded-2xl p-4 backdrop-blur-md border border-white dark:border-white/10">
                      <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-gray-400 mb-1">{t("guideDashboard.nextAssignment.travelers")}</p>
                      <p className="font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                        <Users size={14} className="text-[#0284C7] dark:text-[#38BDF8]" />
                        {data.upcomingSchedule.travelerCount > 0 
                          ? t("guideDashboard.nextAssignment.guests").replace("{n}", String(data.upcomingSchedule.travelerCount))
                          : "No Bookings Yet"}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Link
                  href={`/guide-dashboard/assigned-tours/${data.upcomingSchedule.tourId}/${data.upcomingSchedule.scheduleId}`}
                  className="relative z-10 inline-flex items-center justify-between w-full bg-[#1E3A8A] dark:bg-[#0284C7] text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-[#1E40AF] dark:hover:bg-[#0369A1] transition-colors shadow-lg"
                >
                  <span>{t("guideDashboard.nextAssignment.btnOpen")}</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl rounded-[3rem] border border-dashed border-gray-200 dark:border-white/10 p-16 text-center h-full flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gray-50 dark:bg-[#0F172A] rounded-3xl flex items-center justify-center text-gray-300 dark:text-gray-600 mb-6">
                  <MapPin size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{t("guideDashboard.noUpcoming.title")}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">{t("guideDashboard.noUpcoming.desc")}</p>
              </div>
            )}
          </motion.div>


          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-4"
          >
            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{t("guideDashboard.quickActions.title")}</h3>
            
            <Link href="/guide-dashboard/assigned-tours" className="flex items-center gap-4 p-4 bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl border border-gray-100 dark:border-white/5 rounded-[1.5rem] hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer">
               <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
                  <Map size={24} />
               </div>
               <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">{t("guideDashboard.quickActions.assignedTours")}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t("guideDashboard.quickActions.assignedToursDesc")}</p>
               </div>
            </Link>

            <Link href="/guide-dashboard/attendance" className="flex items-center gap-4 p-4 bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl border border-gray-100 dark:border-white/5 rounded-[1.5rem] hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer">
               <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform shrink-0">
                  <ClipboardCheck size={24} />
               </div>
               <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">{t("guideDashboard.quickActions.markAttendance")}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t("guideDashboard.quickActions.markAttendanceDesc")}</p>
               </div>
            </Link>

            <Link href="/guide-dashboard/incidents" className="flex items-center gap-4 p-4 bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl border border-gray-100 dark:border-white/5 rounded-[1.5rem] hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer">
               <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform shrink-0">
                  <ShieldAlert size={24} />
               </div>
               <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">{t("guideDashboard.quickActions.reportIncident")}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t("guideDashboard.quickActions.reportIncidentDesc")}</p>
               </div>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          MOBILE VIEW (PREMIUM NATIVE TOURISM APP)
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="lg:hidden font-sans pb-10">
        <MobileWelcomeHeader guideName={user?.name?.split(" ")[0] || "Guide"} rating="4.9" toursThisMonth={w.todaysTours || 8} />

        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 px-4">
          
          {/* Weather & Earnings Grid */}
          <div className="grid grid-cols-2 gap-4">
             <motion.div variants={itemVariants} className="bg-white dark:bg-[#1E293B] rounded-[20px] p-4 shadow-sm border border-gray-100 dark:border-white/5">
               <div className="flex items-center gap-2 mb-2 text-gray-500">
                 <CloudSun size={18} className="text-[#F59E0B]" />
                 <span className="text-[13px] font-bold">{weather.temp} {weather.desc}</span>
               </div>
               <p className="text-[12px] text-gray-400 font-medium">{t("guideDashboard.mobile.kambataArea")}</p>
             </motion.div>
             <motion.div variants={itemVariants} className="bg-white dark:bg-[#1E293B] rounded-[20px] p-4 shadow-sm border border-gray-100 dark:border-white/5">
               <p className="text-[13px] font-bold text-gray-500 mb-1">{t("guideDashboard.stats.todaysEarnings")}</p>
               <p className="text-[20px] font-black text-[#16A34A]">450 ETB</p>
             </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div variants={itemVariants} className="bg-white dark:bg-[#1E293B] rounded-[20px] p-4 shadow-sm border border-gray-100 dark:border-white/5 hover:-translate-y-1 transition-transform">
               <div className="flex justify-between items-start mb-2">
                 <div className="w-8 h-8 rounded-full bg-[#0F766E]/10 flex items-center justify-center text-[#0F766E]"><Map size={16}/></div>
                 <span className="text-[12px] font-bold text-[#16A34A]">↑ 12%</span>
               </div>
               <h3 className="text-[20px] font-black text-gray-900 dark:text-white leading-none mb-1">{w.todaysTours || 0}</h3>
               <p className="text-[13px] text-gray-500 font-medium">{t("guideDashboard.stats.toursToday")}</p>
               <div className="w-full bg-gray-100 h-1 rounded-full mt-3"><div className="bg-[#0F766E] h-1 rounded-full" style={{ width: '65%' }}></div></div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="bg-white dark:bg-[#1E293B] rounded-[20px] p-4 shadow-sm border border-gray-100 dark:border-white/5 hover:-translate-y-1 transition-transform">
               <div className="flex justify-between items-start mb-2">
                 <div className="w-8 h-8 rounded-full bg-[#D4A017]/10 flex items-center justify-center text-[#D4A017]"><Users size={16}/></div>
                 <span className="text-[12px] font-bold text-[#16A34A]">+2</span>
               </div>
               <h3 className="text-[20px] font-black text-gray-900 dark:text-white leading-none mb-1">{w.travelersToday || 0}</h3>
               <p className="text-[13px] text-gray-500 font-medium">{t("guideDashboard.stats.travelers")}</p>
               <div className="w-full bg-gray-100 h-1 rounded-full mt-3"><div className="bg-[#D4A017] h-1 rounded-full w-1/2"></div></div>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div variants={itemVariants} className="bg-white dark:bg-[#1E293B] rounded-[20px] p-4 shadow-sm border border-gray-100 dark:border-white/5 hover:-translate-y-1 transition-transform">
               <div className="flex justify-between items-start mb-2">
                 <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600"><Clock size={16}/></div>
               </div>
               <h3 className="text-[20px] font-black text-gray-900 dark:text-white leading-none mb-1">{w.upcomingTours || 0}</h3>
               <p className="text-[13px] text-gray-500 font-medium">{t("guideDashboard.stats.upcomingTours")}</p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="bg-white dark:bg-[#1E293B] rounded-[20px] p-4 shadow-sm border border-gray-100 dark:border-white/5 hover:-translate-y-1 transition-transform">
               <div className="flex justify-between items-start mb-2">
                 <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500"><MessageSquare size={16}/></div>
               </div>
               <h3 className="text-[20px] font-black text-gray-900 dark:text-white leading-none mb-1">{unreadMessagesCount}</h3>
               <p className="text-[13px] text-gray-500 font-medium">{t("guideDashboard.stats.unreadMessages")}</p>
            </motion.div>
          </div>

          {user?.guideStatus === "pending" && (
            <motion.div variants={itemVariants} className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-[20px] p-5 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3">
                <ShieldAlert size={24} />
              </div>
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-2">Verification Pending</h3>
              <p className="text-amber-800 dark:text-amber-200/80 mb-4 text-[13px]">
                Your profile is created but you cannot receive assignments yet. Ensure your National ID and Tour Guide License are uploaded.
              </p>
              <Link href="/guide-dashboard/profile" className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl font-bold text-sm w-full justify-center">
                Complete Profile
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          )}

          {/* Live Tour Progress & Assignment */}
          <motion.div variants={itemVariants}>
            <h2 className="text-[20px] font-black text-gray-900 dark:text-white mb-4 px-1">{t("guideDashboard.mobile.todaysAssignment")}</h2>
            
            {data?.upcomingSchedule ? (
              <div className="bg-white dark:bg-[#0F172A] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-slate-800 overflow-hidden relative group">
                 {/* Premium Header Image Area */}
                 <div className="h-48 bg-gray-900 relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                   <img 
                     loading="lazy" 
                     src={data.upcomingSchedule.image || "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&q=80&w=800"} 
                     alt="Tour" 
                     className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" 
                   />
                   <div className="absolute top-4 left-4 z-20 flex gap-2">
                     <div className="bg-emerald-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-black shadow-lg uppercase tracking-wider flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                       {t("guideDashboard.mobile.inProgress")}
                     </div>
                   </div>
                   <div className="absolute bottom-4 left-5 right-5 z-20">
                     <h3 className="text-2xl font-black text-white leading-tight mb-1 drop-shadow-md">{data.upcomingSchedule.tourName}</h3>
                     <p className="text-sm font-medium text-white/80 flex items-center gap-2">
                       <Clock size={14} /> 08:30 AM - 4:30 PM • {data.upcomingSchedule.destination}
                     </p>
                   </div>
                 </div>
                 
                 <div className="p-5">
                    {/* Live Progress */}
                    <div className="bg-slate-50 dark:bg-[#1E293B] rounded-2xl p-4 mb-5 border border-slate-100 dark:border-slate-800">
                       <div className="flex justify-between items-center mb-3">
                         <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{t("guideDashboard.mobile.tourProgress")}</span>
                         <span className="text-sm font-black text-[#D97706]">65%</span>
                       </div>
                       <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mb-4 overflow-hidden">
                         <div className="bg-gradient-to-r from-[#D97706] to-amber-500 h-2 rounded-full relative" style={{ width: '65%' }}>
                            <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/30" />
                         </div>
                       </div>
                       <ul className="space-y-2.5">
                         <li className="flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                           <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={12} className="stroke-[3]" /></div>
                           {t("guideDashboard.mobile.guideCheckedIn")}
                         </li>
                         <li className="flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                           <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={12} className="stroke-[3]" /></div>
                           {t("guideDashboard.mobile.travelersVerified")}
                         </li>
                         <li className="flex items-center gap-3 text-xs font-medium text-slate-400 dark:text-slate-500">
                           <div className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-700" /> 
                           {t("guideDashboard.mobile.lunchBreak")}
                         </li>
                       </ul>
                    </div>

                    {/* Traveler Preview */}
                    <div className="flex justify-between items-center bg-white dark:bg-[#0F172A] rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm mb-5">
                      <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 tracking-wide uppercase">{t("guideDashboard.mobile.todaysTravelers")}</p>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-200">John, Sarah +10 more</p>
                      </div>
                      <div className="flex -space-x-2">
                        <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/20 border-2 border-white dark:border-slate-900 flex justify-center items-center text-xs shadow-sm font-bold">US</div>
                        <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-900/20 border-2 border-white dark:border-slate-900 flex justify-center items-center text-xs shadow-sm font-bold">UK</div>
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#1E293B] border-2 border-white dark:border-slate-900 flex justify-center items-center text-[10px] font-black text-slate-600 dark:text-slate-300 shadow-sm">+10</div>
                      </div>
                    </div>

                    {/* Navigation Card */}
                    <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20 mb-5">
                       <div>
                         <p className="text-xs font-bold text-amber-600/70 dark:text-amber-500/70 mb-1 uppercase tracking-wide">{t("guideDashboard.mobile.nextMeetingPoint")}</p>
                         <p className="text-base font-black text-amber-900 dark:text-amber-400">{data.upcomingSchedule.meetingPoint}</p>
                         <p className="text-xs font-bold text-amber-600 dark:text-amber-500 mt-1 flex items-center gap-1"><Navigation size={12} /> {t("guideDashboard.mobile.minutesAway")}</p>
                       </div>
                       <button className="w-12 h-12 bg-white dark:bg-[#1E293B] rounded-full flex items-center justify-center shadow-md text-amber-600 dark:text-amber-500 hover:scale-105 active:scale-95 transition-all">
                          <Map size={20} className="stroke-[2.5]" />
                       </button>
                    </div>
                 </div>
                 
                 <div className="px-5 pb-5 flex gap-3">
                    <Link href={`/guide-dashboard/assigned-tours/${data.upcomingSchedule.tourId}/${data.upcomingSchedule.scheduleId}`} className="flex-1 bg-white dark:bg-[#1E293B] border-2 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 py-3.5 rounded-xl text-sm font-black text-center active:scale-95 transition-all">
                      {t("guideDashboard.mobile.viewDetails")}
                    </Link>
                    <button className="flex-1 bg-gradient-to-r from-[#D97706] to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white py-3.5 rounded-xl text-sm font-black text-center active:scale-95 transition-all shadow-[0_8px_20px_rgba(217,119,6,0.3)]">
                      {t("guideDashboard.mobile.continueTour")}
                    </button>
                 </div>
              </div>
            ) : (
              <EmptyState title={t("guideDashboard.mobile.noToursToday")} description={t("guideDashboard.mobile.noToursTodayDesc")} action={<button className="text-[13px] font-bold text-[#0F766E] bg-[#0F766E]/10 px-4 py-2 rounded-full">{t("guideDashboard.mobile.refresh")}</button>} />
            )}
          </motion.div>
          
          {/* Today's Schedule Timeline */}
          {data?.upcomingSchedule && (
            <motion.div variants={itemVariants}>
               <h2 className="text-[20px] font-black text-gray-900 dark:text-white mb-4 px-1">{t("guideDashboard.mobile.todaysSchedule")}</h2>
               <div className="bg-white dark:bg-[#1E293B] rounded-[20px] p-5 shadow-sm border border-gray-100 dark:border-white/5">
                  <div className="relative pl-6 border-l-2 border-gray-100 dark:border-white/10 space-y-6">
                     <div className="relative">
                        <div className="absolute -left-[31px] bg-white dark:bg-[#1E293B] p-1"><div className="w-3 h-3 rounded-full bg-[#16A34A]"></div></div>
                        <p className="text-[12px] font-bold text-[#16A34A]">08:30</p>
                        <p className="text-[16px] font-medium text-gray-900 dark:text-white">{t("guideDashboard.mobile.meetTravelers")}</p>
                     </div>
                     <div className="relative">
                        <div className="absolute -left-[31px] bg-white dark:bg-[#1E293B] p-1"><div className="w-3 h-3 rounded-full bg-[#0EA5E9]"></div></div>
                        <p className="text-[12px] font-bold text-[#0EA5E9]">09:00</p>
                        <p className="text-[16px] font-medium text-gray-900 dark:text-white">{t("guideDashboard.mobile.startNavigation")}</p>
                     </div>
                     <div className="relative">
                        <div className="absolute -left-[31px] bg-white dark:bg-[#1E293B] p-1"><div className="w-3 h-3 rounded-full border-2 border-gray-300 dark:border-gray-600"></div></div>
                        <p className="text-[12px] font-bold text-gray-400">12:00</p>
                        <p className="text-[16px] font-medium text-gray-400">{t("guideDashboard.mobile.lunchBreak")}</p>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {/* Quick Actions Grid */}
          <motion.div variants={itemVariants}>
            <h2 className="text-[20px] font-black text-gray-900 dark:text-white mb-4 px-1">{t("guideDashboard.quickActions.title")}</h2>
            <div className="grid grid-cols-4 gap-3">
               {[
                 { name: t("guideDashboard.mobile.tours"), icon: Map, color: "text-[#0F766E]", bg: "bg-[#0F766E]/10", link: "/guide-dashboard/assigned-tours" },
                 { name: t("guideDashboard.mobile.attendance"), icon: ClipboardCheck, color: "text-[#D4A017]", bg: "bg-[#D4A017]/10", link: "/guide-dashboard/attendance" },
                 { name: t("guideDashboard.mobile.calendar"), icon: Calendar, color: "text-purple-600", bg: "bg-purple-100", link: "/guide-dashboard/calendar" },
                 { name: t("guideDashboard.mobile.payments"), icon: CreditCard, color: "text-blue-600", bg: "bg-blue-100", link: "/guide-dashboard/payments" },
               ].map((action, i) => (
                 <Link key={i} href={action.link} className="flex flex-col items-center gap-2 active:scale-95 hover:scale-[1.02] transition-transform">
                   <div className={`w-14 h-14 ${action.bg} rounded-[18px] flex items-center justify-center ${action.color} shadow-sm`}>
                     <action.icon size={24} />
                   </div>
                   <span className="text-[12px] font-bold text-gray-700 dark:text-gray-300">{action.name}</span>
                 </Link>
               ))}
            </div>
          </motion.div>
          
          {/* Emergency Section */}
          <motion.div variants={itemVariants}>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-[20px] p-4 shadow-sm border border-red-100 dark:border-red-500/20 flex items-center justify-between">
               <div>
                 <h3 className="text-[16px] font-black text-red-700 dark:text-red-400 flex items-center gap-2"><ShieldAlert size={18}/> {t("guideDashboard.mobile.emergency")}</h3>
                 <p className="text-[12px] font-medium text-red-600 dark:text-red-500 mt-0.5">{t("guideDashboard.mobile.emergencyDesc")}</p>
               </div>
               <div className="flex gap-2">
                 <button className="w-10 h-10 bg-white dark:bg-red-500/10 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm active:scale-95"><Phone size={18}/></button>
                 <Link href="/guide-dashboard/sos" className="w-10 h-10 bg-red-600 dark:bg-red-500 rounded-full flex items-center justify-center text-white shadow-sm shadow-red-600/30 active:scale-95"><Siren size={18}/></Link>
               </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </>
  );
}
