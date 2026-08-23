"use client";

import React, { useState, useMemo } from "react";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, ChevronRight, MapPin, Users, Clock, CloudSun, 
  MessageCircle, Navigation, Play, MoreVertical, Phone, QrCode, 
  AlertCircle, Shield, Plus, Calendar as CalendarIcon, X 
} from "lucide-react";
import { useWeather } from "@/hooks/useWeather";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";

interface MobileCalendarViewProps {
  events: any[];
  loading: boolean;
  onBlockDatesClick: () => void;
}

export default function MobileCalendarView({ events, loading, onBlockDatesClick }: MobileCalendarViewProps) {
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(moment().startOf('day'));
  const [currentMonth, setCurrentMonth] = useState(moment().startOf('month'));
  const [selectedTour, setSelectedTour] = useState<any | null>(null);
  const weather = useWeather();
  const [fabOpen, setFabOpen] = useState(false);

  // Filter events for the selected date
  const todaysEvents = useMemo(() => {
    return events.filter(ev => {
      const evStart = moment(ev.start).startOf('day');
      const evEnd = moment(ev.end).startOf('day');
      return selectedDate.isBetween(evStart, evEnd, 'day', '[]');
    }).sort((a, b) => moment(a.start).valueOf() - moment(b.start).valueOf());
  }, [events, selectedDate]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const startDay = currentMonth.clone().startOf('month').startOf('week');
    const endDay = currentMonth.clone().endOf('month').endOf('week');
    const day = startDay.clone().subtract(1, 'day');
    const days = [];
    while (day.isBefore(endDay, 'day')) {
      days.push(day.add(1, 'day').clone());
    }
    return days;
  }, [currentMonth]);

  const handlePrevMonth = () => setCurrentMonth(prev => prev.clone().subtract(1, 'month'));
  const handleNextMonth = () => setCurrentMonth(prev => prev.clone().add(1, 'month'));

  // Status mapping
  const getEventColor = (event: any) => {
    if (event.type === "timeOff") return "bg-gray-400";
    if (event.isLocked) return "bg-slate-700";
    if (event.status === "cancelled") return "bg-red-500";
    if (event.status === "completed") return "bg-blue-500";
    if (event.assignmentStatus === "pending") return "bg-amber-500";
    return "bg-emerald-500"; // Assigned / Active
  };

  const getEventBadge = (event: any) => {
    if (event.type === "timeOff") return { label: "Unavailable", color: "text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-800" };
    if (event.isLocked) return { label: "Locked", color: "text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-700/10" };
    if (event.status === "cancelled") return { label: "Cancelled", color: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10" };
    if (event.status === "completed") return { label: "Completed", color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10" };
    if (event.assignmentStatus === "pending") return { label: "Pending", color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10" };
    return { label: "Assigned", color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10" };
  };

  const stats = useMemo(() => {
    const scheduled = todaysEvents.filter(e => e.type !== "timeOff").length;
    const active = todaysEvents.filter(e => e.status === "active").length;
    const completed = todaysEvents.filter(e => e.status === "completed").length;
    const nextTour = todaysEvents.find(e => e.type !== "timeOff" && moment(e.start).isAfter(moment()));
    return { scheduled, active, completed, nextTour };
  }, [todaysEvents]);

  if (loading) {
    return (
      <div className="lg:hidden flex flex-col gap-6 relative min-h-screen pb-24 px-2">
        {/* Calendar Skeleton */}
        <div className="bg-white dark:bg-[#1E293B] rounded-[20px] p-4 shadow-sm border border-gray-100 dark:border-white/5 animate-pulse">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-md mb-6" />
          <div className="grid grid-cols-7 gap-y-2">
             {Array.from({length: 35}).map((_, i) => (
                <div key={i} className="h-12 w-full flex items-center justify-center">
                   <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800" />
                </div>
             ))}
          </div>
        </div>

        {/* Weather Skeleton */}
        <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-[20px] animate-pulse" />

        {/* Summary Skeleton */}
        <div className="flex gap-3 overflow-hidden">
          <div className="h-24 w-[140px] bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse shrink-0" />
          <div className="h-24 w-[140px] bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse shrink-0" />
        </div>

        {/* Card Skeleton */}
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-[20px] animate-pulse mt-4" />
      </div>
    );
  }

  return (
    <div className="lg:hidden flex flex-col gap-6 relative min-h-[100vh] pb-24 pt-2">
      {/* Mobile Page Header */}
      <div className="px-4 mt-2">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{t("guidePages.calendar.title") || "My Calendar"}</h1>
        <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-1">{t("guidePages.calendar.subtitle") || "Manage your schedule and availability"}</p>
      </div>

      {/* 1. Mini Calendar */}
      <div className="bg-white dark:bg-[#1E293B] rounded-[20px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-white/5 mx-2">
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-lg font-black text-gray-900 dark:text-white">
            {currentMonth.format("MMMM YYYY")}
          </h2>
          <div className="flex gap-2">
            <button onClick={handlePrevMonth} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button onClick={handleNextMonth} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
            <div key={day} className="text-center text-[11px] font-black uppercase text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="overflow-hidden relative min-h-[260px]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={currentMonth.format("YYYY-MM")}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="grid grid-cols-7 gap-y-2 absolute w-full"
            >
              {calendarDays.map((day, i) => {
                const isCurrentMonth = day.isSame(currentMonth, 'month');
                const isSelected = day.isSame(selectedDate, 'day');
                const isToday = day.isSame(moment(), 'day');
                
                // Find events for this day to show dots
                const dayEvents = events.filter(ev => day.isBetween(moment(ev.start).startOf('day'), moment(ev.end).startOf('day'), 'day', '[]'));

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className={`relative h-12 w-full flex flex-col items-center justify-center rounded-xl transition-all min-h-[48px] min-w-[48px]
                      ${!isCurrentMonth ? "text-gray-300 dark:text-gray-600" : "text-gray-700 dark:text-gray-200"}
                      ${isSelected ? "bg-[#0F766E] text-white shadow-md shadow-[#0F766E]/20 font-bold" : "hover:bg-gray-50 dark:hover:bg-white/5"}
                    `}
                  >
                    <span className={`text-[15px] ${isToday && !isSelected ? "text-[#0F766E] dark:text-emerald-400 font-black" : ""}`}>
                      {day.format("D")}
                    </span>
                    
                    {/* Event Dots */}
                    {dayEvents.length > 0 && (
                      <div className="flex gap-1 mt-1 absolute bottom-2">
                        {dayEvents.slice(0, 3).map((ev, idx) => (
                          <div key={idx} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/90' : getEventColor(ev)}`} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Weather Widget */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/5 rounded-[20px] p-4 flex items-center justify-between shadow-sm mx-2"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-50 dark:bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-500 border border-sky-100 dark:border-sky-500/20">
            <CloudSun size={24} />
          </div>
          <div>
            <h4 className="text-[15px] font-black text-gray-900 dark:text-white mb-0.5">{weather.temp}, {weather.desc}</h4>
            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Humidity 64% • Perfect Touring</p>
          </div>
        </div>
      </motion.div>

      {/* 2. Quick Summary */}
      <div className="px-2">
        <h3 className="text-[17px] font-black text-center text-gray-900 dark:text-white mb-4">Today's Overview</h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/5 rounded-[1.25rem] p-3 shadow-sm flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform">
            <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mb-1">{stats.scheduled}</div>
            <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Scheduled</div>
          </div>
          <div className="bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-500/10 dark:to-[#1E293B] border border-emerald-100 dark:border-emerald-500/20 rounded-[1.25rem] p-3 shadow-sm flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500 rounded-t-full opacity-50"></div>
            <div className="text-xl sm:text-2xl font-black text-[#0F766E] dark:text-emerald-400 mb-1">{stats.active}</div>
            <div className="text-[10px] sm:text-xs font-bold text-[#0F766E]/70 dark:text-emerald-400/70 uppercase tracking-wider">Active</div>
          </div>
          <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/5 rounded-[1.25rem] p-3 shadow-sm flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform">
            <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mb-1">{stats.completed}</div>
            <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Completed</div>
          </div>
        </div>
        {stats.nextTour && (
          <div className="mt-3 bg-gray-900 dark:bg-emerald-900/30 border border-gray-800 dark:border-emerald-500/20 rounded-[1.25rem] p-4 shadow-sm flex items-center justify-between">
            <div className="flex-1 mr-4 overflow-hidden">
               <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Next Tour</div>
               <div className="text-sm font-black text-white truncate">{stats.nextTour.title}</div>
            </div>
            <div className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg shrink-0 border border-emerald-500/20">
              {moment(stats.nextTour.start).format("hh:mm A")}
            </div>
          </div>
        )}
      </div>

      {/* 3. Today's Schedule */}
      <div className="px-2 flex-1">
        <h3 className="text-[17px] font-black text-gray-900 dark:text-white mb-4">
          {selectedDate.isSame(moment(), 'day') ? "Today's Schedule" : selectedDate.format("MMMM D, YYYY")}
        </h3>
        
        <div className="flex flex-col gap-5">
          <AnimatePresence mode="popLayout">
            {todaysEvents.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/5 rounded-[20px] p-10 text-center flex flex-col items-center gap-4 shadow-sm"
              >
                <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-[1.25rem] flex items-center justify-center text-gray-300 dark:text-gray-600">
                  <CalendarIcon size={32} />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white font-black text-[17px] mb-1">No Tours Scheduled</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Enjoy your free day or update your availability.</p>
                </div>
                <button 
                  onClick={onBlockDatesClick}
                  className="mt-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl text-[13px] font-black tracking-wide uppercase transition-colors"
                >
                  Block Availability
                </button>
              </motion.div>
            ) : (
              todaysEvents.map((ev, i) => {
                const badge = getEventBadge(ev);
                return (
                  <motion.div
                    key={ev.id || i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    onClick={() => ev.type !== "timeOff" && setSelectedTour(ev)}
                    className={`bg-white dark:bg-[#1E293B] rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-white/5 overflow-hidden transition-all hover:-translate-y-1 active:scale-[0.98] ${ev.type !== "timeOff" ? "cursor-pointer" : ""}`}
                  >
                    {ev.type !== "timeOff" && (
                      <div className="h-40 w-full bg-gray-200 dark:bg-gray-800 relative overflow-hidden">
                        <img 
                          src={ev.image || "/images/Durame.png"} 
                          alt={ev.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute top-4 left-4 bg-white/95 dark:bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-[10px] text-[13px] font-black shadow-sm dark:text-white flex items-center gap-1.5">
                          <Clock size={14} className="text-[#0F766E] dark:text-emerald-400" />
                          {moment(ev.start).format("h:mm A")}
                        </div>
                        <div className={`absolute top-4 right-4 px-3.5 py-1.5 rounded-[10px] text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm ${badge.color}`}>
                          {badge.label}
                        </div>
                      </div>
                    )}
                    
                    <div className="p-5">
                      <h4 className="text-[19px] font-black text-gray-900 dark:text-white mb-4 leading-tight">{ev.title}</h4>
                      
                      {ev.type !== "timeOff" ? (
                        <>
                          <div className="flex flex-col gap-3 mb-6">
                            <div className="flex items-center gap-3 text-[14px] text-gray-600 dark:text-gray-300 font-medium">
                              <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center shrink-0 text-gray-400">
                                <MapPin size={16} />
                              </div>
                              <span className="truncate">{ev.location || "Meeting Point: Durame Hotel"}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[14px] text-gray-600 dark:text-gray-300 font-medium">
                              <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center shrink-0 text-gray-400">
                                <Users size={16} />
                              </div>
                              {ev.travelerCount || 4} Travelers · {moment(ev.end).diff(moment(ev.start), 'hours')} Hours
                            </div>
                          </div>

                          <div className="flex gap-3">
                            {ev.isLocked ? (
                              <button className="flex-1 bg-slate-700 text-white py-3.5 rounded-xl text-[14px] font-black flex items-center justify-center gap-2 shadow-lg shadow-slate-700/20 hover:bg-[#1E293B] transition-colors" onClick={(e) => { e.stopPropagation(); toast.success("Viewing details..."); }}>
                                View Details (Locked)
                              </button>
                            ) : ev.status === "completed" ? (
                              <button className="flex-1 bg-blue-600 text-white py-3.5 rounded-xl text-[14px] font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors" onClick={(e) => { e.stopPropagation(); toast.success("Viewing details..."); }}>
                                View Details
                              </button>
                            ) : ev.status === "cancelled" ? (
                              <button className="flex-1 bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white py-3.5 rounded-xl text-[14px] font-black flex items-center justify-center gap-2 transition-colors" onClick={(e) => { e.stopPropagation(); toast.success("Viewing details..."); }}>
                                View Details
                              </button>
                            ) : (
                              <>
                                <button className="flex-[1.5] bg-[#0F766E] text-white py-3.5 rounded-xl text-[14px] font-black flex items-center justify-center gap-2 shadow-lg shadow-teal-700/20 hover:bg-teal-800 transition-colors" onClick={(e) => { e.stopPropagation(); toast.success("Starting tour..."); }}>
                                  <Play size={16} className="fill-white" /> Start Tour
                                </button>
                                <button className="flex-1 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white py-3.5 rounded-xl text-[14px] font-black flex items-center justify-center gap-2 transition-colors" onClick={(e) => { e.stopPropagation(); toast.success("Opening maps..."); }}>
                                  <Navigation size={16} /> Navigate
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 font-medium bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                          <AlertCircle size={18} />
                          You are marked as unavailable.
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 4. Tour Bottom Sheet */}
      <AnimatePresence>
        {selectedTour && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedTour(null)}
              className="fixed inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0F172A] rounded-t-[2.5rem] z-[101] max-h-[90vh] overflow-y-auto shadow-2xl lg:hidden pb-safe"
            >
              <div className="sticky top-0 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl z-10 pb-4 pt-6 px-6 border-b border-gray-100 dark:border-white/5">
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6" />
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {(() => {
                        const getBadgeProps = (e: any) => {
                          if (e.isLocked) return { label: 'Locked', bg: 'bg-slate-100 dark:bg-slate-500/20', text: 'text-slate-800 dark:text-slate-400' };
                          if (e.status === 'completed') return { label: 'Completed', bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-800 dark:text-blue-400' };
                          if (e.status === 'cancelled') return { label: 'Cancelled', bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-800 dark:text-red-400' };
                          if (e.assignmentStatus === 'pending') return { label: 'Pending', bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-800 dark:text-amber-400' };
                          return { label: 'Assigned', bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-800 dark:text-emerald-400' };
                        };
                        const badge = getBadgeProps(selectedTour);
                        return (
                          <span className={`${badge.bg} ${badge.text} text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md`}>
                            {badge.label}
                          </span>
                        );
                      })()}
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{selectedTour.title}</h2>
                  </div>
                  <button onClick={() => setSelectedTour(null)} className="w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center text-gray-500 shrink-0 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-8">
                <img 
                  src={selectedTour.image || "/images/Durame.png"} 
                  alt="Tour" className="w-full h-56 object-cover rounded-[20px] shadow-sm" 
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-white/5 p-5 rounded-2xl border border-gray-100 dark:border-white/5">
                    <Clock size={24} className="text-[#0F766E] dark:text-emerald-400 mb-3" />
                    <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1">Meeting Time</p>
                    <p className="text-[15px] font-black text-gray-900 dark:text-white">{moment(selectedTour.start).format("h:mm A")}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 p-5 rounded-2xl border border-gray-100 dark:border-white/5">
                    <MapPin size={24} className="text-[#0F766E] dark:text-emerald-400 mb-3" />
                    <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1">Pickup Point</p>
                    <p className="text-[15px] font-black text-gray-900 dark:text-white truncate">{selectedTour.location || "Durame Hotel"}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-[13px] font-black uppercase tracking-widest text-gray-400 mb-4">Traveler Details</h4>
                  <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/5 rounded-[20px] p-5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-[14px] flex items-center justify-center text-[#0F766E] dark:text-emerald-400 font-black text-xl border border-emerald-100 dark:border-emerald-500/20">
                        {selectedTour.travelerCount || 4}
                      </div>
                      <div>
                        <p className="font-black text-[15px] text-gray-900 dark:text-white mb-0.5">Group Size</p>
                        <p className="text-[13px] font-medium text-gray-500">2 Adults, 2 Children</p>
                      </div>
                    </div>
                    <button className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                      <MessageCircle size={20} />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-[13px] font-black uppercase tracking-widest text-gray-400 mb-4">Logistics</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-[14px] font-bold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-white/5 p-5 rounded-[20px] border border-gray-100 dark:border-white/5">
                      <Shield size={20} className="text-[#0F766E]" /> Payment Verified via Platform
                    </div>
                    <div className="flex items-center gap-4 text-[14px] font-bold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-white/5 p-5 rounded-[20px] border border-gray-100 dark:border-white/5">
                      <QrCode size={20} className="text-gray-500" /> Needs QR Check-in
                    </div>
                  </div>
                </div>
                
                <div className="pb-8 pt-4 space-y-3">
                  {selectedTour.isLocked ? (
                    <button className="w-full bg-slate-700 hover:bg-[#1E293B] text-white py-4 rounded-2xl font-black text-[16px] shadow-lg shadow-slate-700/25 transition-colors">
                      View Details (Locked)
                    </button>
                  ) : selectedTour.status === "completed" ? (
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-[16px] shadow-lg shadow-blue-600/25 transition-colors">
                      View Tour Report
                    </button>
                  ) : selectedTour.status === "cancelled" ? (
                    <button className="w-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white py-4 rounded-2xl font-black text-[16px] transition-colors">
                      View Cancellation Details
                    </button>
                  ) : (
                    <>
                      <button className="w-full bg-[#0F766E] hover:bg-teal-800 text-white py-4 rounded-2xl font-black text-[16px] shadow-lg shadow-teal-700/25 transition-colors">
                        Start Tour Now
                      </button>
                      <button className="w-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white py-4 rounded-2xl font-black text-[16px] transition-colors">
                        View Full Details
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 5. Floating Action Button (FAB) */}
      <div className="fixed bottom-24 right-6 z-50 lg:hidden">
        <AnimatePresence>
          {fabOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute bottom-16 right-0 flex flex-col gap-3 items-end"
            >
              <button onClick={() => { setFabOpen(false); toast.error("SOS Triggered"); }} className="flex items-center gap-3 bg-white dark:bg-[#1E293B] shadow-xl p-2 rounded-full border border-gray-100 dark:border-white/10 group">
                <span className="font-bold text-sm text-gray-700 dark:text-gray-200 pl-3">Emergency SOS</span>
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <AlertCircle size={18} />
                </div>
              </button>
              <button onClick={() => { setFabOpen(false); onBlockDatesClick(); }} className="flex items-center gap-3 bg-white dark:bg-[#1E293B] shadow-xl p-2 rounded-full border border-gray-100 dark:border-white/10 group">
                <span className="font-bold text-sm text-gray-700 dark:text-gray-200 pl-3">Block Dates</span>
                <div className="w-10 h-10 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <Plus size={18} />
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className={`w-14 h-14 rounded-full shadow-xl shadow-[#0F766E]/30 flex items-center justify-center text-white transition-all transform ${fabOpen ? 'bg-gray-900 rotate-45' : 'bg-[#0F766E] hover:scale-105'}`}
        >
          <Plus size={24} />
        </button>
      </div>

    </div>
  );
}
