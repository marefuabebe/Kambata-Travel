"use client";

import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar as CalendarIcon, Clock, MapPin, Users, ChevronLeft, ChevronRight, 
  Search, Map, CheckCircle2, AlertTriangle, CloudSun, X, Navigation, MessageSquare,
  PlayCircle, Download, FileText, FileSpreadsheet, Filter, CheckCircle
} from "lucide-react";
import { useWeather } from "@/hooks/useWeather";

const localizer = momentLocalizer(moment);

const customStyles = `
  .rbc-calendar { font-family: inherit; border: none; }
  .rbc-header { border: none !important; padding: 12px 0; font-weight: 900; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; font-size: 11px; }
  .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border: 1px solid #F3F4F6; border-radius: 20px; overflow: hidden; background: white; border-top: none; }
  .rbc-day-bg { border-left: 1px solid #F3F4F6 !important; }
  .rbc-month-row { border-top: 1px solid #F3F4F6 !important; }
  .rbc-off-range-bg { background: #F9FAFB; }
  .rbc-today { background: #F0FDF4; }
  .rbc-date-cell { padding: 12px; font-weight: 800; font-size: 14px; color: #374151; }
  .rbc-event { border-radius: 12px !important; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: none !important; background: transparent !important; padding: 0 !important; }
  .rbc-row-segment { padding: 2px 6px; }
  .rbc-month-row { border-top: 1px solid #F3F4F6 !important; }
  .rbc-show-more { color: #0F766E; font-weight: 800; font-size: 12px; margin-top: 4px; display: block; text-align: center; background: #F0FDFA; border-radius: 8px; padding: 6px; transition: all 0.2s; cursor: pointer; }
  .rbc-show-more:hover { background: #CCFBF1; }
  
  .dark .rbc-month-view, .dark .rbc-time-view, .dark .rbc-agenda-view { border-color: rgba(255,255,255,0.05); background: #1E293B; }
  .dark .rbc-month-view, .dark .rbc-time-view, .dark .rbc-agenda-view { border-color: rgba(255,255,255,0.05); background: transparent; }
  .dark .rbc-header { color: #9CA3AF; border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
  .dark .rbc-day-bg { border-color: rgba(255,255,255,0.02) !important; }
  .dark .rbc-month-row { border-color: rgba(255,255,255,0.05) !important; }
  .dark .rbc-off-range-bg { background: rgba(0,0,0,0.2); }
  .dark .rbc-today { background: rgba(16, 185, 129, 0.05); }
  .dark .rbc-date-cell { color: #F3F4F6; }
  .dark .rbc-show-more { background: rgba(15,118,110,0.2); color: #2DD4BF; }
  .dark .rbc-show-more:hover { background: rgba(15,118,110,0.3); }
  
  /* Refined Week/Day View styling */
  .rbc-time-view { border-radius: 16px; border: none; }
  .rbc-time-header { border-bottom: 1px solid rgba(0,0,0,0.05) !important; }
  .rbc-time-content { border-top: none; }
  .rbc-timeslot-group { border-bottom: 1px solid rgba(0,0,0,0.03); min-height: 50px; }
  .rbc-time-gutter .rbc-timeslot-group { border-right: 1px solid rgba(0,0,0,0.05); font-size: 11px; font-weight: 800; color: #9CA3AF; }
  .rbc-day-slot .rbc-time-slot { border-top: 1px dashed rgba(0,0,0,0.02); }
  
  .dark .rbc-time-header { border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
  .dark .rbc-timeslot-group { border-bottom: 1px solid rgba(255,255,255,0.02); }
  .dark .rbc-time-gutter .rbc-timeslot-group { border-right: 1px solid rgba(255,255,255,0.05); }
  .dark .rbc-day-slot .rbc-time-slot { border-top: 1px dashed rgba(255,255,255,0.01); }
  .dark .rbc-allday-cell { border-bottom: 1px solid rgba(255,255,255,0.05); }
`;

const SkeletonLoader = () => (
  <div className="absolute inset-0 z-50 bg-white dark:bg-[#1E293B] rounded-[20px] p-6 flex flex-col gap-4">
    <div className="h-16 w-full bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse"></div>
    <div className="flex-1 w-full bg-gray-50 dark:bg-black/20 rounded-2xl animate-pulse grid grid-cols-7 gap-4 p-4">
      {Array.from({ length: 35 }).map((_, i) => (
        <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl"></div>
      ))}
    </div>
  </div>
);

export default function DesktopCalendarView({ events, loading, onBlockDates }: { events: any[], loading: boolean, onBlockDates: () => void }) {
  const [view, setView] = useState<"month" | "week" | "day" | "agenda">("month");
  const [date, setDate] = useState(new Date());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const weather = useWeather();
  
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const filteredEvents = events.filter(e => {
    if (search && !e.title?.toLowerCase().includes(search.toLowerCase())) return false;
    
    if (statusFilter !== "all") {
      if (statusFilter === "assigned") {
        if (e.status !== "confirmed" && e.assignmentStatus !== "confirmed") return false;
      } else {
        if (e.status !== statusFilter && e.assignmentStatus !== statusFilter) return false;
      }
    }
    
    if (districtFilter !== "all") {
      const destMatch = e.destination && e.destination.toLowerCase().includes(districtFilter.toLowerCase());
      const titleMatch = e.title && e.title.toLowerCase().includes(districtFilter.toLowerCase());
      if (!destMatch && !titleMatch) return false;
    }
    
    return true;
  });

  const todayTours = events.filter(e => moment(e.start).isSame(moment(), 'day') && e.type !== 'timeOff');
  const upcomingTours = events.filter(e => moment(e.start).isAfter(moment(), 'day') && e.type !== 'timeOff').sort((a,b) => a.start.getTime() - b.start.getTime()).slice(0, 5);

  const handleNavigate = (action: "PREV" | "NEXT" | "TODAY") => {
    let newDate = new Date(date);
    if (action === "TODAY") newDate = new Date();
    else if (action === "PREV") {
      if (view === "month") newDate.setMonth(newDate.getMonth() - 1);
      if (view === "week") newDate.setDate(newDate.getDate() - 7);
      if (view === "day") newDate.setDate(newDate.getDate() - 1);
    } else if (action === "NEXT") {
      if (view === "month") newDate.setMonth(newDate.getMonth() + 1);
      if (view === "week") newDate.setDate(newDate.getDate() + 7);
      if (view === "day") newDate.setDate(newDate.getDate() + 1);
    }
    setDate(newDate);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return; // Don't trigger when typing
      if (e.key === 't') handleNavigate("TODAY");
      if (e.key === 'm') setView("month");
      if (e.key === 'w') setView("week");
      if (e.key === 'd') setView("day");
      if (e.key === 'ArrowLeft') handleNavigate("PREV");
      if (e.key === 'ArrowRight') handleNavigate("NEXT");
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [date, view]);

  const renderToolbar = () => (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1E293B] border-b border-gray-100 dark:border-white/5 rounded-t-[20px] relative z-10">
      <div className="flex items-center gap-4">
        <div className="flex bg-[#F8F9F5] dark:bg-black/20 p-1 rounded-xl border border-gray-100 dark:border-white/5">
          <button onClick={() => handleNavigate("PREV")} className="p-2 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#1E293B] rounded-lg transition-colors"><ChevronLeft size={18} /></button>
          <button onClick={() => handleNavigate("TODAY")} className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#1E293B] rounded-lg transition-colors">Today</button>
          <button onClick={() => handleNavigate("NEXT")} className="p-2 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#1E293B] rounded-lg transition-colors"><ChevronRight size={18} /></button>
        </div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white capitalize min-w-[180px]">
          {view === "month" ? moment(date).format("MMMM YYYY") : 
           view === "week" ? `${moment(date).startOf('week').format("MMM D")} - ${moment(date).endOf('week').format("MMM D, YYYY")}` :
           moment(date).format("MMMM D, YYYY")}
        </h2>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search tours (Ctrl+K)..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 bg-[#F8F9F5] dark:bg-black/20 border border-gray-100 dark:border-white/5 rounded-xl text-sm font-bold focus:outline-none focus:border-[#0F766E] transition-colors text-gray-900 dark:text-white w-[200px]"
          />
        </div>
        
        <div className="flex bg-[#F8F9F5] dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5 p-1">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 bg-transparent text-sm font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer">
            <option value="all" className="bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white">All Status</option>
            <option value="assigned" className="bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white">Assigned</option>
            <option value="pending" className="bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white">Pending</option>
            <option value="completed" className="bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white">Completed</option>
            <option value="cancelled" className="bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white">Cancelled</option>
          </select>
          <div className="w-px bg-gray-200 dark:bg-white/10 mx-1"></div>
          <select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} className="px-3 py-1.5 bg-transparent text-sm font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer">
            <option value="all" className="bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white">All Districts</option>
            <option value="durame" className="bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white">Durame</option>
            <option value="hadero" className="bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white">Hadero</option>
            <option value="ajora" className="bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white">Ajora</option>
          </select>
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="p-2.5 bg-[#F8F9F5] dark:bg-black/20 border border-gray-100 dark:border-white/5 rounded-xl text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <Download size={18} />
          </button>
          <AnimatePresence>
            {showExportMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
              >
                <div className="p-1">
                  <button onClick={() => { setShowExportMenu(false); alert("Exporting PDF..."); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-[#F8F9F5] dark:hover:bg-white/5 rounded-lg transition-colors"><FileText size={16} className="text-red-500"/> Export PDF</button>
                  <button onClick={() => { setShowExportMenu(false); alert("Exporting Excel..."); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-[#F8F9F5] dark:hover:bg-white/5 rounded-lg transition-colors"><FileSpreadsheet size={16} className="text-green-600"/> Export Excel</button>
                  <button onClick={() => { setShowExportMenu(false); alert("Exporting ICS..."); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-[#F8F9F5] dark:hover:bg-white/5 rounded-lg transition-colors"><CalendarIcon size={16} className="text-blue-500"/> Add to Calendar</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );

  const CustomEvent = ({ event }: any) => {
    let bgColor = "bg-emerald-500/90";
    let textColor = "text-emerald-100";
    let borderColor = "border-emerald-500/30";
    
    if (event.type === "timeOff") {
      bgColor = "bg-gray-500/90";
      textColor = "text-gray-100";
      borderColor = "border-gray-500/30";
    } else if (event.isLocked) {
      bgColor = "bg-slate-700/90";
      textColor = "text-slate-100";
      borderColor = "border-slate-700/30";
    } else if (event.status === "cancelled") {
      bgColor = "bg-red-500/90";
      textColor = "text-red-100";
      borderColor = "border-red-500/30";
    } else if (event.status === "completed") {
      bgColor = "bg-blue-500/90";
      textColor = "text-blue-100";
      borderColor = "border-blue-500/30";
    } else if (event.assignmentStatus === "pending") {
      bgColor = "bg-amber-500/90";
      textColor = "text-amber-100";
      borderColor = "border-amber-500/30";
    }

    return (
      <div 
        onClick={() => setSelectedEvent(event)}
        className={`w-full h-full px-2 py-1 sm:px-2.5 sm:py-1 ${bgColor} border ${borderColor} rounded sm:rounded-md flex items-center gap-2 overflow-hidden shadow-sm hover:opacity-80 transition-opacity cursor-pointer`}
      >
        <h4 className={`text-[10px] sm:text-xs font-bold ${textColor} leading-tight truncate shrink-0`}>{event.title}</h4>
        {view === 'month' && (
          <p className={`text-[9px] font-medium ${textColor} opacity-80 truncate`}>
            {moment(event.start).isSame(moment(event.end), 'day') 
              ? `${moment(event.start).format("h:mm A")}`
              : `${moment(event.start).format("MMM D")} - ${moment(event.end).format("MMM D")}`}
          </p>
        )}
      </div>
    );
  };

  const eventStyleGetter = () => {
    return {
      style: {
        backgroundColor: "transparent",
        border: "none",
        padding: 0,
      }
    };
  };

  const getTourProgress = (event: any) => {
    if (!event) return 0;
    if (event.status === 'completed' || event.assignmentStatus === 'completed') return 100;
    
    const now = moment();
    const start = moment(event.start);
    const end = moment(event.end);
    
    if (now.isBefore(start, 'day')) return 0;
    if (now.isAfter(end, 'day')) return 100;
    
    const totalDuration = end.diff(start);
    if (totalDuration === 0) return 50;
    
    const elapsed = now.diff(start);
    const progress = Math.round((elapsed / totalDuration) * 100);
    return Math.max(0, Math.min(100, progress));
  };

  return (
    <div className="hidden lg:flex flex-col w-full gap-6 max-w-[1400px] mx-auto min-h-[calc(100vh-140px)]">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      
      {/* Premium Dashboard Summary Cards - Full Width Top Row */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: "Tours", value: events.filter(e => e.type !== 'timeOff').length, icon: CalendarIcon, color: "text-[#0F766E]", bg: "bg-[#0F766E]/10", border: "border-[#0F766E]/20" },
          { label: "Travelers", value: events.reduce((acc, curr) => acc + (curr.travelers || 0), 0), icon: Users, color: "text-[#D4A017]", bg: "bg-[#D4A017]/10", border: "border-[#D4A017]/20" },
          { label: "Rating", value: (events.length > 0 ? "4.9" : "N/A"), icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          { label: "Estimated Revenue", value: (events.filter(e => e.type !== 'timeOff').length * 4500).toLocaleString(), icon: FileText, color: "text-purple-600", bg: "bg-purple-500/10", border: "border-purple-500/20", sub: "ETB" },
          { label: "Weather", value: weather.temp, icon: CloudSun, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", sub: weather.desc }
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white dark:bg-[#1E293B] rounded-[20px] p-5 shadow-sm border border-gray-100 dark:border-white/5 hover:border-b-4 hover:-translate-y-1 transition-all flex flex-col justify-between" style={{ borderBottomColor: `var(--${stat.color.split('-')[1]})` }}>
            <div className="flex justify-between items-start mb-2">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} border ${stat.border}`}>
                 <stat.icon size={18} />
               </div>
            </div>
            <div>
              <div className="flex items-end gap-1 mb-0.5">
                <h3 className="text-[28px] font-black text-gray-900 dark:text-white leading-none tracking-tight">{stat.value}</h3>
                {stat.sub && <span className="text-xs font-black text-gray-400 pb-1">{stat.sub}</span>}
              </div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-1 gap-6">
        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col gap-6 w-0">
          
          {/* Legend */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-wrap items-center gap-4 md:gap-6 px-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-xs font-black uppercase tracking-widest text-gray-500">Assigned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
              <span className="text-xs font-black uppercase tracking-widest text-gray-500">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
              <span className="text-xs font-black uppercase tracking-widest text-gray-500">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
              <span className="text-xs font-black uppercase tracking-widest text-gray-500">Cancelled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.5)]"></div>
              <span className="text-xs font-black uppercase tracking-widest text-gray-500">Time Off</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-700 shadow-[0_0_8px_rgba(51,65,85,0.5)]"></div>
              <span className="text-xs font-black uppercase tracking-widest text-gray-500">Locked</span>
            </div>
            <div className="flex-1"></div>
            <button onClick={onBlockDates} className="text-sm font-black text-[#0F766E] hover:underline px-4 py-2 bg-[#0F766E]/10 rounded-xl transition-colors">Manage Time Off</button>
          </motion.div>

        {/* Calendar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex-1 flex flex-col bg-white dark:bg-[#1E293B] rounded-[20px] border border-gray-100 dark:border-white/5 shadow-sm relative">
          {loading && <SkeletonLoader />}
          
          {renderToolbar()}
          
          <div className="flex-1 p-4 pt-0 min-w-[600px] overflow-auto relative z-0">
            <div className="min-w-[600px] h-full min-h-[600px]">
              <Calendar
                localizer={localizer}
                events={filteredEvents}
                startAccessor="start"
                endAccessor="end"
                date={date}
                view={view}
                views={['month', 'week', 'day']}
                onNavigate={(d) => setDate(d)}
                onView={(v: any) => setView(v)}
                eventPropGetter={eventStyleGetter}
                style={{ height: '100%', fontFamily: 'inherit' }}
                toolbar={false}
                step={60}
                timeslots={1}
                min={new Date(1970, 1, 1, 7, 0, 0)}
                max={new Date(1970, 1, 1, 19, 0, 0)}
                components={{
                  event: CustomEvent
                }}
                className="dark:text-white"
                popup={true} 
                onSelectEvent={(e) => setSelectedEvent(e)}
                messages={{
                  showMore: (count) => `+${count} More`
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>

      {/* Right Drawer */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-[480px] bg-white dark:bg-[#0F172A] shadow-2xl z-50 border-l border-gray-200 dark:border-white/10 flex flex-col overflow-hidden"
            >
              {selectedEvent.type === "timeOff" ? (
                <div className="p-8 h-full flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">Time Off</h2>
                    <button onClick={() => setSelectedEvent(null)} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"><X size={20}/></button>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
                    <div className="w-24 h-24 bg-red-50 dark:bg-red-500/10 rounded-[20px] flex items-center justify-center text-red-500 mb-6"><AlertTriangle size={40} /></div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{selectedEvent.title}</h3>
                    <p className="text-gray-500">From: {moment(selectedEvent.start).format("MMM D, YYYY")}</p>
                    <p className="text-gray-500">To: {moment(selectedEvent.end).format("MMM D, YYYY")}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="h-72 bg-gray-900 relative shrink-0">
                    <img loading="lazy" src={selectedEvent.image?.url || selectedEvent.image || "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1000&q=80"} className="w-full h-full object-cover opacity-60" alt="Tour" />
                    <button onClick={() => setSelectedEvent(null)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/60 transition-colors"><X size={20}/></button>
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="flex gap-2 mb-3">
                        {(() => {
                          const getBadgeProps = (e: any) => {
                            if (e.isLocked) return { label: 'Locked', bg: 'bg-slate-800/90', border: 'border-slate-500/30', text: 'text-slate-300' };
                            if (e.status === 'completed') return { label: 'Completed', bg: 'bg-blue-900/90', border: 'border-blue-500/30', text: 'text-blue-300' };
                            if (e.status === 'cancelled') return { label: 'Cancelled', bg: 'bg-red-900/90', border: 'border-red-500/30', text: 'text-red-300' };
                            if (e.assignmentStatus === 'pending') return { label: 'Pending', bg: 'bg-amber-900/90', border: 'border-amber-500/30', text: 'text-amber-300' };
                            return { label: 'Assigned', bg: 'bg-[#14532D]/90', border: 'border-emerald-500/30', text: 'text-emerald-300' };
                          };
                          const badge = getBadgeProps(selectedEvent);
                          return (
                            <span className={`px-3 py-1 ${badge.bg} backdrop-blur-md border ${badge.border} rounded-full text-[10px] font-black uppercase tracking-widest ${badge.text}`}>
                              {badge.label}
                            </span>
                          );
                        })()}
                      </div>
                      <h2 className="text-3xl font-black text-white leading-tight">{selectedEvent.title}</h2>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-8 space-y-8">
                      {/* Tour Progress */}
                      <div>
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-[11px] font-black uppercase text-gray-500">Tour Progress</span>
                            <span className="text-[11px] font-black text-[#0F766E]">{getTourProgress(selectedEvent)}%</span>
                         </div>
                         <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#0F766E] to-[#14532D] rounded-full" style={{ width: `${getTourProgress(selectedEvent)}%` }}></div>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#F8F9F5] dark:bg-white/5 p-5 rounded-[20px] border border-gray-100 dark:border-white/5">
                          <Clock size={20} className="text-[#0F766E] mb-3" />
                          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Schedule</p>
                          <p className="text-base font-black text-gray-900 dark:text-white">{moment(selectedEvent.start).format("h:mm A")}</p>
                          <p className="text-xs font-medium text-gray-500 mt-1">{moment(selectedEvent.start).format("MMM D, YYYY")}</p>
                        </div>
                        <div className="bg-[#F8F9F5] dark:bg-white/5 p-5 rounded-[20px] border border-gray-100 dark:border-white/5 relative overflow-hidden">
                          <Users size={20} className="text-[#D4A017] mb-3" />
                          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Travelers</p>
                          <p className="text-base font-black text-gray-900 dark:text-white">{selectedEvent.travelers || 0} People</p>
                          <div className="flex -space-x-2 mt-2">
                             {[...Array(Math.min(4, selectedEvent.travelers || 4))].map((_, i) => (
                                <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-6 h-6 rounded-full border-2 border-white dark:border-[#1E293B]" />
                             ))}
                          </div>
                        </div>
                      </div>

                      {/* Mini Map & Meeting Point */}
                      <div>
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2"><MapPin size={16} className="text-[#0F766E]"/> Location</h3>
                        <div className="bg-gray-200 dark:bg-white/5 rounded-[20px] h-60 w-full relative overflow-hidden border border-gray-100 dark:border-white/5">
                           <iframe 
                             width="100%" 
                             height="100%" 
                             style={{ border: 0 }} 
                             loading="lazy" 
                             allowFullScreen 
                             referrerPolicy="no-referrer-when-downgrade" 
                             src={`https://maps.google.com/maps?q=${selectedEvent.coordinates?.lat || 9.0320},${selectedEvent.coordinates?.lng || 38.7578}&z=13&output=embed`}
                             className="w-full h-full opacity-90 dark:opacity-80 dark:invert dark:hue-rotate-180 dark:contrast-125"
                           />
                           
                           {/* Contact Page Style Floating Card */}
                           <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/20 dark:border-white/10 flex items-center justify-between" style={{ pointerEvents: 'auto' }}>
                             <div>
                               <p className="text-[#1a1a1a] dark:text-white text-sm font-bold mb-1">{selectedEvent.meetingPoint || "TBA"}</p>
                               <p className="text-gray-600 dark:text-gray-400 text-xs">{selectedEvent.destination || "Kambata Zone"}</p>
                             </div>
                             <a href="https://maps.google.com/?q=Kambata+Zone,Ethiopia" target="_blank" rel="noopener noreferrer" className="bg-[#14532D] text-white px-3 py-2 rounded-full text-[10px] uppercase tracking-widest font-black inline-flex items-center gap-2 hover:bg-[#0f3d21] transition-colors whitespace-nowrap shadow-md shadow-[#14532D]/20">
                               <MapPin size={12} /> View Map
                             </a>
                           </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2"><CloudSun size={16} className="text-[#F59E0B]"/> Weather Forecast</h3>
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-[20px] p-5 border border-blue-100 dark:border-blue-500/10 flex items-center justify-between">
                          <div>
                            <p className="text-[32px] font-black text-blue-900 dark:text-blue-100 leading-none">{weather.temp}</p>
                            <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mt-2">{weather.desc}</p>
                          </div>
                          <CloudSun size={48} className="text-blue-500 opacity-80" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fixed Bottom Action Bar */}
                  <div className="p-6 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#0F172A] shrink-0 flex gap-4">
                    <button className="w-14 h-14 bg-[#F8F9F5] dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-[16px] flex items-center justify-center text-[#D4A017] hover:scale-105 transition-transform shadow-sm">
                      <MessageSquare size={20} />
                    </button>
                    {selectedEvent.isLocked ? (
                      <button disabled className="flex-1 h-14 bg-slate-200 dark:bg-slate-800/50 rounded-[16px] text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2 cursor-not-allowed">
                        <AlertTriangle size={20} /> Locked
                      </button>
                    ) : moment().isAfter(moment(selectedEvent.end), 'day') ? (
                      <button disabled className="flex-1 h-14 bg-gray-200 dark:bg-white/5 rounded-[16px] text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2 cursor-not-allowed">
                        <CheckCircle size={20} /> Tour Completed
                      </button>
                    ) : moment().isBefore(moment(selectedEvent.start), 'day') ? (
                      <button disabled className="flex-1 h-14 bg-gray-200 dark:bg-white/5 rounded-[16px] text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2 cursor-not-allowed">
                        <Clock size={20} /> Upcoming Tour
                      </button>
                    ) : (
                      <button className="flex-1 h-14 bg-[#14532D] rounded-[16px] text-sm font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 shadow-lg shadow-[#14532D]/20 hover:-translate-y-0.5 transition-transform">
                        <PlayCircle size={20} /> Start Tour
                      </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
