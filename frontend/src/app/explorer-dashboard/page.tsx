"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Package, CheckCircle2, Compass, ArrowRight, MessageSquare, MapPin, Sparkles, Map, Star, TrendingUp, Search, QrCode, Heart, ChevronRight, Clock, User, Menu, Siren, CalendarCheck, Sun, Moon, Bell, Hand, Ticket } from "lucide-react";
import apiClient from "@/utils/apiClient";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, StatCard, LoadingCenter } from "@/components/explorer/ui";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { tourTitle, getLocalizedText } from "@/utils/dashboardHelpers";

const IconUpcomingTours = SvgIcon({ src: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1787498603/image_2026-08-23_16-11-02_u6nj9m.png" });
const IconUpcomingPackages = SvgIcon({ src: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1787498555/image_2026-08-23_15-18-27_m1mzmm.png" });
const IconTripsCompleted = SvgIcon({ src: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1787498566/image_2026-08-23_15-19-48_ho6yvd.png" });
const IconUnreadMessages = SvgIcon({ src: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1787498575/image_2026-08-23_15-21-09_adcmzx.png" });
import { motion, AnimatePresence } from "framer-motion";
import { useWeather } from "@/hooks/useWeather";
import { useRouter } from "next/navigation";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { useLanguage } from "@/context/LanguageContext";

export default function TravelerDashboard() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const unreadNotificationsCount = useRealtimeNotifications();
  const unreadMessagesCount = useRealtimeMessages();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const weather = useWeather();
  const router = useRouter();

  useEffect(() => {
    apiClient
      .get("/traveler/dashboard")
      .then((res) => setData(res.data.data))
      .catch(console.error);

    apiClient
      .get("/requests/my-requests")
      .then((res) => setRequests(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));

    // Fetch personalized recommendations
    apiClient
      .get("/recommendations?limit=4")
      .then((res) => {
        const recData = res.data.data;
        setRecommendations(recData?.recommendations || []);
        setIsPersonalized(recData?.isPersonalized ?? false);
      })
      .catch(() => {
        // Fallback to trending if personalized fails
        apiClient
          .get("/recommendations/trending?limit=4")
          .then((res) => setRecommendations(res.data.data || []))
          .catch(console.error);
      });
  }, []);

  if (loading) return <LoadingCenter />;

  // Safely fallback to 0 to ensure the layout looks populated
  const w = data?.widgets || {
    upcomingTours: 0,
    upcomingPackages: 0,
    activePackages: 0,
    completedTrips: 0,
    unreadMessages: 0
  };
  
  const recentActivity = data?.recentActivity || [
    { id: 1, message: "Package Booking Confirmed: Kambata Cultural Experience", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { id: 2, message: "Payment Received: 4,500 ETB", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    { id: 3, message: "New Message from Guide: Daniel", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48) },
    { id: 4, message: "Tour Reminder: Please arrive at 8:30 AM", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72) },
  ];



  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <>
    {/* ── DESKTOP VIEW ── */}
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="hidden lg:block max-w-7xl mx-auto space-y-10 pb-12"
    >
      {/* ── Enterprise Hero Banner ── */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-[#1E293B] border border-white/10 p-8 md:p-12 shadow-2xl mt-8"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl overflow-hidden ring-4 ring-white/10 shadow-xl shrink-0">
              <img loading="lazy" src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name}&background=F59E0B&color=fff`} className="w-full h-full object-cover" alt="Profile" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#F59E0B] bg-[#F59E0B]/10 px-3 py-1 rounded-lg border border-[#F59E0B]/20">
                  {currentDate}
                </span>
                {weather?.temp && (
                  <span className="text-[10px] font-bold text-white/75 flex items-center gap-1 bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                    <Sun size={12} className="text-[#F59E0B]" /> {weather.temp}°C, {weather.desc}
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                {t("explorerDashboard.header.greeting").replace("{name}", user?.name?.split(" ")[0] || "Traveler")}
              </h1>
              <p className="text-sm md:text-base font-medium text-gray-600 dark:text-white/75 max-w-xl">
                {t("explorerDashboard.header.subtitle")}
              </p>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-4 shrink-0">
            <Link href="/explorer-dashboard/explore-tours" className="flex items-center gap-2 px-6 py-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold transition-all hover:-translate-y-1 active:scale-95 rounded-2xl">
              <Compass size={18} className="text-[#10B981]" /> Explore
            </Link>
            <Link href="/explorer-dashboard/bookings" className="flex items-center gap-2 px-6 py-4 bg-[#F59E0B] hover:bg-[#F59E0B]/90 shadow-lg shadow-[#F59E0B]/20 text-white font-bold transition-all hover:-translate-y-1 active:scale-95 rounded-2xl">
              <CalendarCheck size={18} /> My Bookings
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label={t("explorerDashboard.stats.upcomingTours")} value={w.upcomingTours ?? 0} icon={IconUpcomingTours} accent="emerald" />
        <StatCard label={t("explorerDashboard.stats.upcomingPackages")} value={w.upcomingPackages ?? w.activePackages ?? 0} icon={IconUpcomingPackages} accent="amber" />
        <StatCard label={t("explorerDashboard.stats.completedTrips")} value={w.completedTrips ?? 0} icon={IconTripsCompleted} accent="blue" />
        <StatCard label={t("explorerDashboard.stats.unreadMessages")} value={unreadMessagesCount || w.unreadMessages || 0} icon={IconUnreadMessages} accent="orange" />
      </div>

      {/* Featured Destination Showcase (Desktop - Panoramic Hero) */}
      <div className="bg-white dark:bg-[#1E293B] backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm h-[320px] flex flex-col relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/80 via-transparent to-transparent z-10" />
        <img 
          src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1776359616/kambata-travel/tours/hambarcho_777_ku8kyb.png" 
          alt="Mount Hambarcho" 
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
        />
        <div className="absolute top-6 left-8 z-20 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 flex items-center gap-2">
          <Sparkles size={16} className="text-amber-400" />
          <span className="text-xs font-black text-white tracking-widest uppercase">{t("explorerDashboard.featuredSpotlight.tag")}</span>
        </div>
        
        <div className="mt-auto relative z-20 p-10 pt-0 flex items-end justify-between w-full">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">{t("explorerDashboard.featuredSpotlight.title")}</h2>
            <p className="text-sm md:text-base font-medium text-gray-200 leading-relaxed mb-6">
              {t("explorerDashboard.featuredSpotlight.desc")}
            </p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-amber-400">
                <Star size={16} className="fill-amber-400" />
                <span className="font-bold text-white text-sm">4.9</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <MapPin size={18} />
                <span className="font-bold text-sm">{t("explorerDashboard.featuredSpotlight.location")}</span>
              </div>
            </div>
          </div>
          <Link href="/explorer-dashboard/explore-tours" className="bg-[#FF8C00] hover:bg-[#FF8C00]/90 text-white px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-[#FF8C00]/20 hover:-translate-y-1">
            {t("explorerDashboard.featuredSpotlight.btnExplore")}
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* ── Left Column ── */}
        <div className="lg:col-span-8 flex flex-col justify-stretch gap-6">

          {/* Payment Pending Alerts for Custom Requests */}
          {requests.filter(req => req.status === "converted_to_schedule" || req.status === "awaiting_payment").map(req => {
            const rawItem = req.tourId ? req.tourId.title : (req.packageId?.name || req.packageId?.title);
            const displayTitle = getLocalizedText(rawItem, language) || "Tour / Package";
            const dateStr = req.preferredDate ? new Date(req.preferredDate).toLocaleDateString() : "";
            const desc = (t("explorerDashboard.customTourReady.desc") || "")
              .replace("{title}", displayTitle)
              .replace("{date}", dateStr);

            return (
              <motion.div 
                key={req._id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-[#FF8C00] to-orange-600 rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6"
              >
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl mb-4 border border-white/20">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white">
                      {t("explorerDashboard.customTourReady.tag")}
                    </p>
                  </div>
                  <h3 className="text-3xl font-black mb-2 tracking-tight">{t("explorerDashboard.customTourReady.title")}</h3>
                  <p className="text-orange-100 font-medium">{desc}</p>
                </div>
                
                <Link
                  href={req.status === "awaiting_payment" ? "/explorer-dashboard/my-requests" : `/${req.tourId ? 'checkout' : 'checkout-package'}/${req.tourId?._id || req.packageId?._id}?scheduleId=${req.assignedSchedule}`}
                  className="group/btn inline-flex items-center gap-2 bg-white text-[#FF8C00] px-8 py-4 rounded-2xl font-black text-sm hover:bg-gray-50 transition-all shadow-lg shrink-0 whitespace-nowrap"
                >
                  {t("explorerDashboard.customTourReady.btnPay")} <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            );
          })}
          
          {/* Upcoming Trip Widget */}
          {data?.nextTour ? (() => {
            const tour = data.nextTour.tour || {};
            const title = tourTitle(tour, language) || t("explorerDashboard.upcomingTrip.title");
            const schedule = Array.isArray(tour.schedules)
              ? tour.schedules.find((s: any) => s?._id && data.nextTour.scheduleId && s._id.toString() === data.nextTour.scheduleId.toString())
              : null;
            const startDate = schedule?.startDate || schedule?.date || tour.schedules?.[0]?.startDate;
            const startDateStr = startDate ? new Date(startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : t("explorerDashboard.upcomingTrip.tba");
            const endDateStr = schedule?.endDate ? new Date(schedule.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : "";
            const date = endDateStr && endDateStr !== startDateStr ? `${startDateStr} - ${endDateStr}` : startDateStr;
            const guideName = data.nextTour.guide?.name || t("explorerDashboard.upcomingTrip.pendingGuide");
            return (
              <motion.div 
                whileHover={{ scale: 0.995 }}
                className="relative overflow-hidden bg-white dark:bg-[#1E293B] rounded-[2.5rem] p-8 md:p-10 text-slate-900 dark:text-white shadow-xl group border border-[#BFDBFE] dark:border-white/5 flex-1 h-full flex flex-col justify-center"
              >
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 my-auto">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-white/60 dark:bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl mb-4 border border-white dark:border-white/10 shadow-sm">
                      <Compass size={14} className="text-[#0284C7] dark:text-[#38BDF8]" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#0284C7] dark:text-[#38BDF8]">
                        {t("explorerDashboard.upcomingTrip.tag")}
                      </p>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black mb-3 tracking-tight text-slate-900 dark:text-white">{title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-slate-700 dark:text-gray-300 font-medium text-sm">
                      <p className="flex items-center gap-2 bg-white/60 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-white dark:border-white/5">
                        <Calendar size={14} className="text-[#0284C7] dark:text-[#38BDF8]" /> {t("explorerDashboard.upcomingTrip.date")} {date}
                      </p>
                      <p className="flex items-center gap-2 bg-white/60 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-white dark:border-white/5">
                        <MapPin size={14} className="text-[#FF8C00]" /> {t("explorerDashboard.upcomingTrip.guide")} {guideName}
                      </p>
                      <p className="flex items-center gap-2 bg-white/60 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-white dark:border-white/5">
                        <span className="w-2 h-2 rounded-full bg-[#0284C7] dark:bg-[#38BDF8] animate-pulse" />
                        {t("explorerDashboard.upcomingTrip.status")} <span className={`font-bold capitalize ${data.nextTour.isLocked ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{data.nextTour.isLocked ? 'Expired' : data.nextTour.status}</span>
                      </p>
                    </div>
                  </div>
                  
                  <Link
                    href="/explorer-dashboard/bookings"
                    className="group/btn inline-flex items-center gap-2 bg-[#1E3A8A] dark:bg-[#0284C7] text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-[#1E40AF] dark:hover:bg-[#0369A1] transition-all shadow-lg shrink-0 whitespace-nowrap"
                  >
                    {t("explorerDashboard.upcomingTrip.btnViewDetails")} <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform text-white/80" />
                  </Link>
                </div>
              </motion.div>
            );
          })() : (
            <motion.div 
              className="bg-white dark:bg-[#1E293B] rounded-[2.5rem] p-12 text-center border border-dashed border-gray-200 dark:border-white/10 flex-1 h-full flex flex-col items-center justify-center"
            >
              <Compass size={40} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{t("explorerDashboard.noUpcoming.title")}</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-6">{t("explorerDashboard.noUpcoming.desc")}</p>
              <Link href="/explorer-dashboard/explore-tours" className="inline-flex items-center gap-2 bg-[#FF8C00] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-colors">
                {t("explorerDashboard.noUpcoming.btnExplore")} <ArrowRight size={16} />
              </Link>
            </motion.div>
          )}

        </div>

        {/* ── Right Column ── */}
        <div className="lg:col-span-4 flex flex-col justify-stretch">
          
          {/* Choose Your Experience */}
          <div className="bg-white dark:bg-[#1E293B] backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm relative overflow-hidden flex-1 h-full flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-5 flex items-center gap-2">
                <Sparkles size={14} /> {t("explorerDashboard.chooseExperience.title")}
              </h2>
              
              <div className="grid gap-4">
                {/* Tour Only */}
                <Link
                  href="/explorer-dashboard/explore-tours"
                  className="group flex flex-col p-5 rounded-2xl bg-gray-50 dark:bg-[#0F172A] border border-gray-100 dark:border-white/5 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all shadow-sm hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Compass size={20} className="text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors text-lg tracking-tight">{t("explorerDashboard.chooseExperience.tour.title")}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t("explorerDashboard.chooseExperience.tour.tag")}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400 pl-[3.25rem]">
                    {t("explorerDashboard.chooseExperience.tour.desc")}
                  </p>
                </Link>

                {/* Travel Package */}
                <Link
                  href="/explorer-dashboard/packages"
                  className="group flex flex-col p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/5 hover:border-[#FF8C00]/50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 relative overflow-hidden"
                >
                  <div className="flex items-center gap-3 mb-2 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-[#FF8C00]/10 dark:bg-[#FF8C00]/20 flex items-center justify-center shrink-0">
                      <Package size={20} className="text-[#FF8C00]" />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 dark:text-white group-hover:text-[#FF8C00] transition-colors text-lg tracking-tight">{t("explorerDashboard.chooseExperience.package.title")}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{t("explorerDashboard.chooseExperience.package.tag")}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-500 dark:text-emerald-100/80 pl-[3.25rem] relative z-10 leading-snug">
                    {t("explorerDashboard.chooseExperience.package.desc")}
                  </p>
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* ── Full Width (Row 2): Trending Tours covers the rest of the space ── */}
        <div className="lg:col-span-12">
          <div className="bg-white dark:bg-[#1E293B] backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 md:p-10 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-2">
                {isPersonalized
                  ? <><Sparkles size={14} className="text-[#FF8C00]" /> {t("explorerDashboard.recommendations.forYou")}</>  
                  : <><TrendingUp size={14} className="text-[#FF8C00]" /> {t("explorerDashboard.recommendations.trendingTours")}</>
                }
              </h2>
              <Link href="/explorer-dashboard/explore-tours" className="text-[10px] font-black uppercase tracking-widest text-[#FF8C00] hover:underline">
                {t("explorerDashboard.recommendations.viewAll")}
              </Link>
            </div>

            {recommendations.length === 0 ? (
              <div className="text-center py-8">
                <Compass size={32} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-400">{t("explorerDashboard.recommendations.discovering")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {recommendations.slice(0, 4).map((rec: any) => {
                  const img = rec.images?.[0] || `https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&q=80&w=400&h=300`;
                  const title = getLocalizedText(rec.title, language) || t("explorerDashboard.recommendations.tourFallback");
                  const price = rec.price ? `${rec.price.toLocaleString()} ETB` : t("explorerDashboard.recommendations.viewDetails");
                  const reason = rec.recommendedBecause || rec.category || t("explorerDashboard.recommendations.trending");
                  const rating = rec.rating?.average || 0;

                  return (
                    <Link
                      key={rec._id}
                      href={`/explorer-dashboard/explore-tours?tour=${rec._id}`}
                      className="group flex gap-4 p-4 rounded-2xl bg-gray-50/50 dark:bg-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/5 transition-all border border-gray-100/80 dark:border-white/5 hover:border-[#FF8C00]/30 hover:-translate-y-0.5 shadow-sm"
                    >
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 relative">
                        <img loading="lazy" src={img} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                      </div>
                      <div className="flex flex-col justify-center min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#FF8C00] truncate">
                            {rec.category || t("explorerDashboard.recommendations.tourFallback")}
                          </span>
                          {rating > 0 && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Star size={12} className="text-amber-400 fill-amber-400" />
                              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1 leading-snug mb-2 group-hover:text-[#FF8C00] transition-colors text-base">
                          {title}
                        </h4>
                        <div className="flex items-center justify-between gap-2 mt-auto">
                          <span className="text-sm font-black text-gray-900 dark:text-white">{price}</span>
                          {reason && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg truncate max-w-[160px]">
                              {reason}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </motion.div>

    {/* ── MOBILE VIEW (Premium Native App UI) ── */}
    <div className="lg:hidden pb-10 font-sans space-y-6">
      {/* Premium Welcome Header */}
      <div className="bg-gradient-to-b from-white to-[#F8F9F5] dark:from-[#1E293B] dark:to-[#0F172A] rounded-b-[2.5rem] p-6 pt-10 shadow-sm border-b border-gray-100 dark:border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#0F766E]/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute top-0 left-0 w-32 h-32 bg-[#D4A017]/10 blur-2xl rounded-full -translate-y-1/2 -translate-x-1/2" />
        
        <div className="mb-6 relative z-10">
          <p className="text-[12px] font-black text-gray-400 tracking-widest uppercase">{currentDate}</p>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
             <Hand className="inline-block mr-2 mb-1 text-amber-500 fill-amber-500/20" size={24} />
             <span dangerouslySetInnerHTML={{ __html: (t("explorerDashboard.mobileWelcome.greeting") || "Welcome, {name}").replace("{name}", user?.name?.split(" ")[0] || "Traveler") }} />
          </h1>
        </div>

        {/* Search Shortcut & Weather */}
        <div className="flex items-center gap-3 relative z-10">
          <div onClick={() => router.push('/explorer-dashboard/explore-tours')} className="flex-1 bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-white/10 rounded-2xl h-12 flex items-center px-4 gap-3 shadow-sm text-gray-400">
            <Search size={18} />
            <span className="text-sm font-bold">{t("explorerDashboard.mobileWelcome.search")}</span>
          </div>
          <div className="bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 rounded-2xl h-12 px-4 flex flex-col justify-center items-center shadow-sm min-w-[70px]">
             <span className="text-[13px] font-black text-sky-600 dark:text-sky-400 leading-tight">{weather?.temp || "24°"}</span>
             <span className="text-[9px] font-bold text-sky-500/80 uppercase">{weather?.desc || "Clear"}</span>
          </div>
        </div>
      </div>

      {/* Main Mobile Content Padding Wrapper */}
      <div className="px-4 space-y-6">
        


        {/* Stat Cards (2x2 Grid) */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: t("explorerDashboard.stats.upcomingTours"), value: w.upcomingTours ?? 0, icon: IconUpcomingTours, color: "text-[#0F766E]" },
            { label: t("explorerDashboard.stats.upcomingPackages"), value: w.upcomingPackages ?? w.activePackages ?? 0, icon: IconUpcomingPackages, color: "text-[#D4A017]" },
            { label: t("explorerDashboard.stats.completedTrips"), value: w.completedTrips ?? 0, icon: IconTripsCompleted, color: "text-blue-500" },
            { label: t("explorerDashboard.stats.unreadMessages"), value: unreadMessagesCount || w.unreadMessages || 0, icon: IconUnreadMessages, color: "text-amber-500" }
          ].map((stat, i) => (
             <div key={i} className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex flex-col justify-between h-28">
               <div className="flex justify-between items-start">
                 <div className={`w-8 h-8 rounded-full bg-gray-50 dark:bg-black/20 flex items-center justify-center ${stat.color}`}>
                   <stat.icon width={16} height={16} />
                 </div>
               </div>
               <div>
                 <p className="text-[22px] font-black text-gray-900 dark:text-white leading-none">{stat.value}</p>
                 <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{stat.label}</p>
               </div>
             </div>
          ))}
        </div>

        {/* Upcoming Booking Card */}
        <div>
          <div className="flex items-center justify-between mb-3">
             <h2 className="text-[17px] font-black text-gray-900 dark:text-white">{t("explorerDashboard.upcomingTrip.title")}</h2>
          </div>
          {data?.nextTour ? (() => {
            const tour = data.nextTour.tour || {};
            const title = tourTitle(tour, language) || t("explorerDashboard.upcomingTrip.title");
            const schedule = Array.isArray(tour.schedules)
              ? tour.schedules.find((s: any) => s?._id && data.nextTour.scheduleId && s._id.toString() === data.nextTour.scheduleId.toString())
              : null;
            const startDate = schedule?.startDate || schedule?.date || tour.schedules?.[0]?.startDate;
            const startDateStr = startDate ? new Date(startDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : t("explorerDashboard.upcomingTrip.tba");
            const guideName = data.nextTour.guide?.name || t("explorerDashboard.upcomingTrip.pendingGuide");
            const coverImage = tour.images?.[0] || 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&q=80&w=800';

            return (
              <motion.div whileHover={{ scale: 0.98 }} className="bg-white dark:bg-[#1E293B] rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/5 relative">
                <div className="h-40 relative">
                  <img src={coverImage} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{t("explorerDashboard.upcomingTrip.startsIn").replace("{days}", "2")}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight mb-3">{title}</h3>
                  <div className="flex items-center gap-4 text-sm font-bold text-gray-500 mb-5">
                    <div className="flex items-center gap-1.5"><Calendar size={14} className="text-[#0F766E]"/> {startDateStr}</div>
                    <div className="flex items-center gap-1.5"><User size={14} className="text-[#D4A017]"/> {guideName}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-[#0F766E] text-white py-3 rounded-xl font-bold shadow-md shadow-[#0F766E]/20 flex items-center justify-center gap-2">
                      <QrCode size={16} /> {t("explorerDashboard.upcomingTrip.btnTicket")}
                    </button>
                    <button onClick={() => router.push('/explorer-dashboard/bookings')} className="flex-1 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold border border-gray-100 dark:border-white/10 flex items-center justify-center">
                      {t("explorerDashboard.upcomingTrip.btnDetails")}
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })() : (
            <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5 text-center">
              <Compass size={32} className="mx-auto text-gray-300 mb-3" />
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t("explorerDashboard.noUpcoming.title")}</h3>
              <p className="text-xs text-gray-500 mb-4">{t("explorerDashboard.noUpcoming.descMobile")}</p>
              <button onClick={() => router.push('/explorer-dashboard/explore-tours')} className="bg-[#0F766E] text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-[#0F766E]/20 text-sm">{t("explorerDashboard.noUpcoming.btnFindTours")}</button>
            </div>
          )}
        </div>

        {/* Recommended Tours (Horizontal Scroll) */}
        <div>
          <div className="flex items-center justify-between mb-3">
             <h2 className="text-[17px] font-black text-gray-900 dark:text-white flex items-center gap-2"><Sparkles size={16} className="text-[#D4A017]"/> {t("explorerDashboard.discover.title")}</h2>
             <span onClick={() => router.push('/explorer-dashboard/explore-tours')} className="text-xs font-bold text-[#0F766E] uppercase tracking-wider">{t("explorerDashboard.discover.seeAll")}</span>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 custom-scrollbar hide-scrollbar snap-x">
             {recommendations.slice(0, 4).map((rec: any, idx) => {
                const img = rec.images?.[0] || `https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&q=80&w=400&h=300`;
                const title = getLocalizedText(rec.title, language) || t("explorerDashboard.recommendations.tourFallback");
                const price = rec.price ? `${rec.price.toLocaleString()} ETB` : t("explorerDashboard.recommendations.viewDetails");
                const rating = rec.rating?.average || 4.8;
                return (
                  <div key={idx} onClick={() => router.push(`/explorer-dashboard/explore-tours?tour=${rec._id}`)} className="snap-start shrink-0 w-64 bg-white dark:bg-[#1E293B] rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/5 relative">
                    <div className="h-32 relative">
                      <img src={img} className="w-full h-full object-cover" />
                      <button className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                        <Heart size={14} className="text-white" />
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#0F766E]">{rec.category || t("explorerDashboard.recommendations.trending")}</span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500"><Star size={10} className="text-[#D4A017] fill-[#D4A017]"/> {rating}</div>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white leading-tight mb-2 truncate">{title}</h3>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs font-black text-gray-900 dark:text-white">{price}</span>
                        <span className="text-[10px] font-bold text-white bg-gray-900 dark:bg-[#0F766E] px-2.5 py-1 rounded-lg">{t("explorerDashboard.recommendations.btnBook")}</span>
                      </div>
                    </div>
                  </div>
                )
             })}
          </div>
        </div>

        {/* Featured Destination (Mobile) */}
        <div className="relative overflow-hidden rounded-[2.5rem] h-[320px] shadow-lg shadow-black/5 group">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-[#0F172A]/40 to-transparent z-10" />
          <img 
            src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1776359616/kambata-travel/tours/hambarcho_777_ku8kyb.png" 
            alt="Mount Hambarcho" 
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
          />
          <div className="absolute top-5 left-5 z-20 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5">
            <Sparkles size={12} className="text-[#FF8C00]" />
            <span className="text-[10px] font-black text-white tracking-widest uppercase">{t("explorerDashboard.featuredSpotlight.tagMobile")}</span>
          </div>
          
          <div className="absolute bottom-5 left-5 right-5 z-20">
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">{t("explorerDashboard.featuredSpotlight.title")}</h2>
            <p className="text-xs font-medium text-gray-300 line-clamp-2 mb-4 leading-relaxed">
              {t("explorerDashboard.featuredSpotlight.descMobile")}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 text-[#FF8C00]">
                  <Star size={12} className="fill-[#FF8C00]" />
                  <span className="font-bold text-white text-xs">4.9</span>
                </div>
                <div className="flex items-center gap-1 text-white/90">
                  <MapPin size={14} />
                  <span className="font-bold text-xs">{t("explorerDashboard.featuredSpotlight.location")}</span>
                </div>
              </div>
              <Link href="/explorer-dashboard/explore-tours" className="bg-[#FF8C00] border border-[#FF8C00] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-[#FF8C00]/30 active:scale-95 transition-transform">
                {t("explorerDashboard.featuredSpotlight.btnExploreMobile")}
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions Icon Grid (Moved to bottom) */}
        <div>
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-[17px] font-black text-gray-900 dark:text-white flex items-center gap-2"><Menu size={16} className="text-gray-400"/> {t("explorerDashboard.quickAccess.title")}</h2>
          </div>
          <div className="grid grid-cols-4 gap-3 bg-white dark:bg-[#1E293B] rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-white/5">
            {[
              { label: t("explorerDashboard.quickAccess.explore"), icon: Compass, color: "text-[#0F766E]", bg: "bg-[#0F766E]/10", path: "/explorer-dashboard/explore-tours" },
              { label: t("explorerDashboard.quickAccess.packages"), icon: Package, color: "text-blue-500", bg: "bg-blue-500/10", path: "/explorer-dashboard/packages" },
              { label: t("explorerDashboard.quickAccess.requests"), icon: CalendarCheck, color: "text-[#D4A017]", bg: "bg-[#D4A017]/10", path: "/explorer-dashboard/my-requests" },
              { label: t("explorerDashboard.quickAccess.wishlist"), icon: Sparkles, color: "text-pink-500", bg: "bg-pink-500/10", path: "/explorer-dashboard/wishlist" },
              { label: t("explorerDashboard.quickAccess.reviews"), icon: Star, color: "text-amber-500", bg: "bg-amber-500/10", path: "/explorer-dashboard/reviews" },
              { label: t("explorerDashboard.quickAccess.payments"), icon: MapPin, color: "text-indigo-500", bg: "bg-indigo-500/10", path: "/explorer-dashboard/payments" },
              { label: t("explorerDashboard.quickAccess.support"), icon: MessageSquare, color: "text-emerald-500", bg: "bg-emerald-500/10", path: "/explorer-dashboard/support" },
              { label: t("explorerDashboard.quickAccess.sos"), icon: Siren, color: "text-red-500", bg: "bg-red-500/10", path: "/explorer-dashboard/sos" }
            ].map((action, i) => (
               <motion.button key={i} whileTap={{ scale: 0.95 }} onClick={() => router.push(action.path)} className="flex flex-col items-center gap-2 group">
                 <div className={`w-14 h-14 rounded-2xl ${action.bg} flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/5 group-hover:shadow-md transition-all`}>
                   <action.icon size={22} className={action.color} />
                 </div>
                 <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{action.label}</span>
               </motion.button>
            ))}
          </div>
        </div>

      </div>
    </div>
    </>
  );
}
