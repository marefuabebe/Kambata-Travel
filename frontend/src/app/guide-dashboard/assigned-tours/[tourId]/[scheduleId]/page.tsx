"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import apiClient from "@/utils/apiClient";
import {
  PageHeader,
  StatusBadge,
  LoadingCenter,
  ContactActions,
  MESSAGE_TEMPLATES,
} from "@/components/guide/ui";
import toast from "react-hot-toast";
import { ArrowLeft, Megaphone, Send, Clock, Calendar, MapPin, Users, ShieldAlert, Camera, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function TourDetailPage() {
  const { tourId, scheduleId } = useParams<{ tourId: string; scheduleId: string }>();
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const load = () => {
    apiClient
      .get(`/guide-ops/assignments/${tourId}/${scheduleId}`)
      .then((res) => setDetail(res.data.data))
      .catch(() => toast.error("Failed to load tour"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tourId && scheduleId) load();
  }, [tourId, scheduleId]);

  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      
      scanner.render((decodedText) => {
        scanner.clear();
        setShowScanner(false);
        handleScan(decodedText);
      }, (error) => {
        // ignore fast frame errors
      });

      return () => {
        scanner.clear().catch(console.error);
      };
    }
  }, [showScanner]);

  const handleScan = async (token: string) => {
    try {
      const { data } = await apiClient.post("/guide-ops/attendance/scan", { token });
      toast.success(data.message || `Check-In Successful: ${data.data?.travelerName || 'Traveler'}`);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Invalid QR Code");
    }
  };

  const markAttendance = async (bookingId: string, status: string) => {
    await apiClient.patch("/guide-ops/attendance/bulk", {
      updates: [{ bookingId, status }],
    });
    toast.success("Attendance updated");
    load();
  };

  const sendAnnouncement = async () => {
    if (!announcement.trim()) return;
    try {
      await apiClient.post("/guide-ops/announcements", {
        tourId,
        scheduleId,
        message: announcement,
        title: "Tour Update",
      });
      toast.success("Announcement sent to all travelers on this tour");
      setAnnouncement("");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to send");
    }
  };

  if (loading) return <LoadingCenter />;
  if (!detail) return null;

  const { tour, travelers, attendance, incidents } = detail;

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-12">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <Link
          href="/guide-dashboard/assigned-tours"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#145A41] transition-colors mb-4 bg-white dark:bg-white/5 px-4 py-2 rounded-xl shadow-sm hover:shadow-md"
        >
          <ArrowLeft size={16} /> Back to assignments
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
          <PageHeader
            title={tour.name}
            subtitle={tour.description?.slice?.(0, 120)}
            action={<StatusBadge status={tour.status} />}
          />
          {!tour.isLocked && (
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-2 bg-[#FF8C00] text-white px-6 py-4 rounded-2xl font-black text-sm hover:bg-[#e67e00] transition-all shadow-xl shadow-[#FF8C00]/20 hover:-translate-y-1"
            >
              <Camera size={18} /> Scan Digital Pass
            </button>
          )}
        </div>
      </motion.div>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid md:grid-cols-2 gap-8">
        <motion.div variants={fadeUp} className="bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm hover:shadow-xl dark:shadow-none hover:bg-gray-50 dark:hover:bg-[#1E293B] transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
          <h3 className="font-black uppercase tracking-widest text-[10px] text-gray-400 dark:text-gray-500 mb-6">
            Tour Information
          </h3>
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Date</p>
                <p className="font-bold text-gray-900 dark:text-white">{new Date(tour.date).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Time</p>
                <p className="font-bold text-gray-900 dark:text-white">{tour.startTime} – {tour.endTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-[#FF8C00]/10 flex items-center justify-center text-[#FF8C00]">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Meeting point</p>
                <p className="font-bold text-gray-900 dark:text-white">{tour.meetingPoint}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Users size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Capacity</p>
                <p className="font-bold text-gray-900 dark:text-white">{tour.capacity} Travelers max</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm flex flex-col justify-between">
          <h3 className="font-black uppercase tracking-widest text-[10px] text-gray-400 dark:text-gray-500 mb-6">
            Attendance Summary
          </h3>
          <div className="grid grid-cols-2 gap-4 text-center flex-1">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl flex flex-col justify-center items-center shadow-inner">
              <p className="text-3xl font-black text-gray-900 dark:text-white">{attendance.total}</p>
              <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">TOTAL</p>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex flex-col justify-center items-center shadow-inner">
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{attendance.present}</p>
              <p className="text-[10px] font-black text-emerald-500 mt-1 uppercase tracking-widest">PRESENT</p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-2xl flex flex-col justify-center items-center shadow-inner">
              <p className="text-3xl font-black text-red-600 dark:text-red-400">{attendance.absent}</p>
              <p className="text-[10px] font-black text-red-500 mt-1 uppercase tracking-widest">ABSENT</p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-[#FF8C00]/10 rounded-2xl flex flex-col justify-center items-center shadow-inner">
              <p className="text-3xl font-black text-amber-600 dark:text-[#FF8C00]">{attendance.late}</p>
              <p className="text-[10px] font-black text-amber-500 mt-1 uppercase tracking-widest">LATE</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm">
        <h3 className="font-black uppercase tracking-widest text-[10px] text-gray-400 dark:text-gray-500 mb-6 flex items-center gap-2">
          <Megaphone size={14} /> Group Announcement
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {MESSAGE_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setAnnouncement(t.text)}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors shadow-sm"
            >
              {t.label}
            </button>
          ))}
        </div>
        <textarea
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 text-sm min-h-[100px] outline-none focus:border-[#145A41] dark:focus:border-[#10B981] transition-colors resize-none placeholder-gray-400"
          placeholder="Message all travelers on this tour…"
        />
        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={sendAnnouncement}
            className="flex items-center gap-2 bg-[#1A331B] text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-[#1A331B]/20 hover:-translate-y-0.5 transition-all"
          >
            <Send size={16} /> Send to all travelers
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm">
        <h3 className="font-black uppercase tracking-widest text-[10px] text-gray-400 dark:text-gray-500 mb-6">
          Travelers
        </h3>
        <div className="space-y-4">
          {travelers.map((t: any) => (
            <div
              key={t.bookingId}
              className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-colors"
            >
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-black text-gray-900 dark:text-white text-lg">{t.fullName}</p>
                  <StatusBadge status={t.attendanceStatus} />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Ref: {t.referenceNumber} · Party: {t.partySize}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <ContactActions phone={t.phone} email={t.email} />
                <Link
                  href="/guide-dashboard/messages"
                  className="text-xs font-bold px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/5 shadow-sm transition-all hover:-translate-y-0.5"
                >
                  Message
                </Link>
                {!tour.isLocked && (
                  <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm border border-gray-100 dark:border-gray-700">
                    {["present", "absent", "late"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => markAttendance(t.bookingId, s)}
                        className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-colors ${
                          t.attendanceStatus === s 
                            ? s === 'present' ? 'bg-emerald-500 text-white' 
                              : s === 'absent' ? 'bg-red-500 text-white' 
                              : 'bg-[#FF8C00] text-white'
                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {incidents?.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-red-50 dark:bg-red-500/10 rounded-[2.5rem] border border-red-100 dark:border-red-500/20 p-8">
            <h3 className="font-black text-red-900 dark:text-red-400 mb-4 flex items-center gap-2">
              <ShieldAlert size={18} /> Incidents on this tour
            </h3>
            <ul className="text-sm text-red-800 dark:text-red-300 space-y-3">
              {incidents.map((i: any) => (
                <li key={i._id} className="bg-white/50 dark:bg-white/5 p-4 rounded-xl font-medium flex items-center justify-between">
                  <span>{i.title}</span>
                  <span className="text-[10px] uppercase font-black px-2 py-1 bg-red-100 dark:bg-red-500/20 rounded-lg">{i.severity} · {i.status}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showScanner && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-[#1E293B] rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative">
              <button 
                onClick={() => setShowScanner(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <h3 className="font-black text-2xl mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                <Camera className="text-[#FF8C00]" /> Scan Pass
              </h3>
              <div id="qr-reader" className="w-full rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-800"></div>
              <p className="text-center text-sm font-bold text-gray-500 mt-6">
                Point your camera at the traveler's Digital Travel Pass
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
