"use client";

import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";
import { PageHeader, LoadingCenter } from "@/components/guide/ui";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Plus, X, Calendar as CalendarIcon, Clock, AlignLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import MobileCalendarView from "./MobileCalendarView";
import DesktopCalendarView from "./DesktopCalendarView";

const localizer = momentLocalizer(moment);

const customStyles = `
  .rbc-calendar { font-family: inherit; border: none; }
  .rbc-header { border: none !important; padding: 12px 0; font-weight: 900; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; font-size: 11px; }
  .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border: 1px solid #F3F4F6; border-radius: 24px; overflow: hidden; background: white; }
  .rbc-day-bg { border-left: 1px solid #F3F4F6 !important; }
  .rbc-month-row { border-top: 1px solid #F3F4F6 !important; }
  .rbc-off-range-bg { background: #F9FAFB; }
  .rbc-today { background: #F0FDF4; }
  .rbc-date-cell { padding: 8px; font-weight: 800; font-size: 14px; color: #374151; }
  .rbc-event { border-radius: 8px !important; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border: none !important; }
  .rbc-btn-group button { border-color: #F3F4F6; font-weight: 700; color: #374151; }
  .rbc-btn-group button.rbc-active { background: #F3F4F6; box-shadow: none; color: #111827; }
  .rbc-toolbar button:active, .rbc-toolbar button:hover, .rbc-toolbar button:focus { background-color: #F9FAFB; }
  
  .dark .rbc-month-view, .dark .rbc-time-view, .dark .rbc-agenda-view { border-color: rgba(255,255,255,0.05); background: #1E293B; }
  .dark .rbc-header { color: #9CA3AF; border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
  .dark .rbc-day-bg { border-color: rgba(255,255,255,0.05) !important; }
  .dark .rbc-month-row { border-color: rgba(255,255,255,0.05) !important; }
  .dark .rbc-off-range-bg { background: #0F172A; }
  .dark .rbc-today { background: rgba(16, 185, 129, 0.1); }
  .dark .rbc-date-cell { color: #F3F4F6; }
  .dark .rbc-btn-group button { border-color: rgba(255,255,255,0.1); color: #F3F4F6; }
  .dark .rbc-btn-group button.rbc-active { background: rgba(255,255,255,0.1); color: white; }
  .dark .rbc-toolbar button:active, .dark .rbc-toolbar button:hover, .dark .rbc-toolbar button:focus { background-color: rgba(255,255,255,0.05); }
  .dark .rbc-time-content { border-top-color: rgba(255,255,255,0.05); }
  .dark .rbc-timeslot-group { border-bottom-color: rgba(255,255,255,0.05); }
  .dark .rbc-time-gutter .rbc-timeslot-group { border-right-color: rgba(255,255,255,0.05); }
`;

export default function GuideCalendarPage() {
  const { t } = useLanguage();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    reason: "vacation",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/guide-ops/calendar");
      // Format dates for big-calendar
      const formatted = data.data.map((ev: any) => ({
        ...ev,
        start: new Date(ev.start),
        end: new Date(ev.end),
      }));
      setEvents(formatted);
    } catch (error) {
      toast.error("Failed to load calendar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
    // Real-time polling every 30 seconds
    const interval = setInterval(() => {
      apiClient.get("/guide-ops/calendar").then(({ data }) => {
        const formatted = data.data.map((ev: any) => ({
          ...ev,
          start: new Date(ev.start),
          end: new Date(ev.end),
        }));
        setEvents(formatted);
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleBlockDates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate) {
      return toast.error("Please select start and end dates");
    }
    
    // Make sure end is after start
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      return toast.error("End date cannot be before start date");
    }

    setSubmitting(true);
    try {
      await apiClient.post("/guide-ops/calendar/block", formData);
      toast.success("Time off blocked successfully");
      setShowModal(false);
      setFormData({ startDate: "", endDate: "", reason: "vacation", notes: "" });
      fetchCalendar();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to block dates");
    } finally {
      setSubmitting(false);
    }
  };

  const eventStyleGetter = (event: any) => {
    let backgroundColor = "#10B981"; // Emerald for assignments
    
    if (event.type === "timeOff") {
      backgroundColor = "#EF4444"; // Red for unavailable
    } else if (event.assignmentStatus === "pending") {
      backgroundColor = "#F59E0B"; // Amber for pending assignments
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: "8px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
        fontWeight: "bold",
        fontSize: "12px",
        padding: "4px 8px"
      }
    };
  };

  // We handle loading states within the UI now to prevent layout shifts
  // if (loading) return <LoadingCenter />;

  return (
    <div className="max-w-6xl mx-auto space-y-8 lg:pb-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="hidden lg:block">
        <PageHeader
          title={t("guidePages.calendar.title")}
          subtitle={t("guidePages.calendar.subtitle")}
          action={
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3.5 rounded-2xl font-black text-sm hover:-translate-y-0.5 transition-all shadow-sm"
            >
              <Plus size={18} /> {t("guidePages.calendar.manageTimeOff")}
            </button>
          }
        />
      </motion.div>

      <div className="hidden lg:block w-full">
         <DesktopCalendarView events={events} loading={loading} onBlockDates={() => setShowModal(true)} />
      </div>

      {/* Mobile View */}
      <MobileCalendarView 
        events={events} 
        loading={loading} 
        onBlockDatesClick={() => setShowModal(true)} 
      />

      {/* Block Dates Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[100px] bg-black/60 backdrop-blur-sm overflow-y-auto custom-scrollbar"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-[#0A0F1C] border border-gray-100 dark:border-white/10 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl relative mb-10"
            >
              
              <div className="p-8 relative">
                <button 
                  onClick={() => setShowModal(false)}
                  className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-2xl flex items-center justify-center">
                    <CalendarDays size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t("guidePages.calendar.blockDates")}</h2>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">{t("guidePages.calendar.blockDatesDesc")}</p>
                  </div>
                </div>

                <form onSubmit={handleBlockDates} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500">{t("guidePages.calendar.startDate")}</label>
                      <div className="relative">
                        <CalendarIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="date"
                          required
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 shadow-sm rounded-2xl py-4 pl-11 pr-4 text-[15px] font-bold outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500">{t("guidePages.calendar.endDate")}</label>
                      <div className="relative">
                        <CalendarIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="date"
                          required
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          className="w-full bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 shadow-sm rounded-2xl py-4 pl-11 pr-4 text-[15px] font-bold outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">{t("guidePages.calendar.reason")}</label>
                    <select
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 shadow-sm rounded-2xl py-4 px-4 text-[15px] font-bold outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors text-gray-900 dark:text-white appearance-none cursor-pointer"
                    >
                      <option value="vacation">{t("guidePages.calendar.vacation")}</option>
                      <option value="sick">{t("guidePages.calendar.sickLeave")}</option>
                      <option value="other_agency">{t("guidePages.calendar.bookedElsewhere")}</option>
                      <option value="personal">{t("guidePages.calendar.personal")}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">{t("guidePages.calendar.notesOptional")}</label>
                    <div className="relative">
                      <AlignLeft size={18} className="absolute left-4 top-4 text-gray-400" />
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        className="w-full bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 shadow-sm rounded-2xl py-4 pl-11 pr-4 text-[15px] font-medium outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none text-gray-900 dark:text-white"
                        placeholder={t("guidePages.calendar.notesPlaceholder")}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-2xl font-black text-[15px] hover:-translate-y-0.5 transition-all disabled:opacity-50 shadow-sm"
                  >
                    {submitting ? t("guidePages.calendar.submitting") : t("guidePages.calendar.confirmTimeOff")}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
