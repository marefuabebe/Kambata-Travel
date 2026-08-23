"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "@/utils/apiClient";
import { toast } from "react-hot-toast";
import {
  Check, X, ArrowRight, Loader2, Calendar,
  CheckCircle, XCircle, Sparkles, AlertCircle, Users, Star
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GuideAvailability {
  _id: string;
  name: string;
  profilePicture?: string;
  languages: string[];
  hasConflict: boolean;
  conflictReason?: string;
  allConflicts?: string[];
}

interface AlternativeSlot {
  guideId: string;
  guideName: string;
  guideProfilePicture?: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  /** "near_requested_date" (±3 days) or "future_available" (+4–14 days) */
  priority?: "near_requested_date" | "future_available";
  /** Signed day offset from the traveler's preferred start date */
  dayOffset?: number;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [convertingRequest, setConvertingRequest] = useState<any>(null);
  const [assigningRequest, setAssigningRequest] = useState<any>(null);
  const [rankedGuides, setRankedGuides] = useState<any[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [activeTab, setActiveTab] = useState("pending_admin");

  const fetchRequests = async () => {
    try {
      const res = await apiClient.get("/requests");
      setRequests(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAssignGuide = async (requestId: string) => {
    if (!selectedGuideId) return toast.error("Select a guide");
    try {
      await apiClient.post(`/requests/${requestId}/assign-guide`, {
        guideId: selectedGuideId,
        customPrice: customPrice ? Number(customPrice) : undefined,
      });
      toast.success("Guide assigned successfully");
      setAssigningRequest(null);
      setSelectedGuideId("");
      setCustomPrice("");
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to assign guide");
    }
  };

  const openAssignModal = async (req: any) => {
    setAssigningRequest(req);
    setCustomPrice("");
    setSelectedGuideId("");
    try {
      const res = await apiClient.get(`/requests/${req._id}/ranked-guides`);
      setRankedGuides(res.data.data || []);
    } catch {
      setRankedGuides([]);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiClient.patch(`/requests/${id}/status`, { status: "rejected" });
      toast.success("Request rejected");
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reject");
    }
  };

  const handleConvert = async (guideId: string, adminNotes: string, customPrice: string, overrideDate?: string, overrideEndDate?: string) => {
    if (!guideId) return toast.error("Please select a guide");
    try {
      await apiClient.post(`/requests/${convertingRequest._id}/convert`, {
        guideId,
        adminNotes,
        customPrice: customPrice ? Number(customPrice) : undefined,
        overrideDate: overrideDate || undefined,
        overrideEndDate: overrideEndDate || undefined,
      });
      toast.success("Request converted to Private Schedule successfully!");
      setConvertingRequest(null);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to convert request");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_admin":
      case "guide_pending":
        return <span className="px-3 py-1 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-100 dark:border-amber-500/20">{status.replace('_', ' ')}</span>;
      case "awaiting_payment":
        return <span className="px-3 py-1 bg-[#FF8C00]/10 text-[#FF8C00] dark:bg-[#FF8C00]/10 dark:text-[#FF8C00] rounded-full text-[10px] font-black uppercase tracking-wider border border-[#FF8C00]/20 dark:border-[#FF8C00]/20">Awaiting Payment</span>;
      case "confirmed":
      case "assigned":
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-emerald-100 dark:border-emerald-500/20"><CheckCircle size={10} /> {status}</span>;
      case "declined_by_guide":
      case "expired":
      case "payment_expired":
      case "rejected":
      case "cancelled":
        return <span className="px-3 py-1 bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-slate-200 dark:border-slate-500/20"><XCircle size={10} /> {status.replace(/_/g, ' ')}</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-full text-[10px] font-black uppercase tracking-wider border border-slate-200 dark:border-slate-700">{status}</span>;
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] flex justify-center py-32">
      <div className="w-10 h-10 border-4 border-slate-200 dark:border-[#334155] border-t-[#FF8C00] rounded-full animate-spin" />
    </div>
  );

  const filteredRequests = requests.filter(req => req.status === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-[#F8FAFC] p-4 md:p-8 space-y-8 font-sans pb-20">
      
      {/* Header (Sticky) */}
      <div className="sticky top-0 z-40 bg-slate-50/90 dark:bg-[#0F172A]/90 backdrop-blur-md pt-4 pb-4 border-b border-slate-200 dark:border-[#334155] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm">Request Management</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Review, assign, and manage incoming travel requests.</p>
        </div>
        
        {/* Dropdown Filter */}
        <div className="relative w-full md:w-64">
          <select
            id="status-filter"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full appearance-none bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] text-slate-900 dark:text-white text-sm font-bold py-3 pl-4 pr-10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF8C00]/50 transition-shadow cursor-pointer"
          >
            {["pending_admin", "guide_pending", "awaiting_payment", "declined_by_guide", "expired", "payment_expired", "confirmed", "rejected", "cancelled"].map(tab => (
              <option key={tab} value={tab} className="font-medium">
                {tab.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} ({requests.filter(r => r.status === tab).length})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 dark:text-slate-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>

      <div className="w-full">
        {filteredRequests.length === 0 ? (
          <div className="bg-white dark:bg-[#1E293B] flex flex-col items-center justify-center py-32 rounded-3xl border border-slate-200 dark:border-[#334155] shadow-sm">
            <div className="w-16 h-16 bg-slate-50 dark:bg-[#0F172A] rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-semibold">No requests found for this status.</p>
          </div>
        ) : (
          <motion.div 
            initial="hidden" 
            animate="show" 
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.05 } }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredRequests.map((req, idx) => (
              <motion.div 
                key={req._id}
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                className="bg-white dark:bg-[#1E293B] rounded-[20px] p-6 border border-slate-200 dark:border-[#334155] shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Top Row: Badge & Date */}
                <div className="flex justify-between items-start mb-4">
                  {getStatusBadge(req.status)}
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                {/* Title */}
                <div className="mb-4 flex-1">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug line-clamp-2">
                    {req.tourId ? req.tourId?.title?.en : req.packageId?.title}
                  </h3>
                  <p className="text-xs font-bold text-[#FF8C00] mt-1 tracking-wide uppercase">
                    {req.requestType?.replace('_', ' ')}
                  </p>
                </div>

                {/* Traveler Info */}
                <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-100 dark:border-[#334155]/50">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs flex-shrink-0">
                    {req.user?.name?.charAt(0) || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{req.user?.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{req.user?.email}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <Calendar size={12} className="text-slate-400" />
                      {req.preferredDate ? new Date(req.preferredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "N/A"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pax</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <Users size={12} className="text-slate-400" />
                      {req.travelers || 0}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {req.preferredTime || "Any"}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {req.notes && (
                  <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl text-xs font-medium italic text-slate-600 dark:text-slate-400 mb-5 border border-slate-100 dark:border-white/5 line-clamp-2">
                    "{req.notes}"
                  </div>
                )}

                {/* Actions */}
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-[#334155] flex flex-col gap-2">
                  {req.status === "pending_admin" && (
                    <div className="flex gap-2">
                      <button onClick={() => openAssignModal(req)} className="flex-1 bg-[#FF8C00] text-white font-bold py-2.5 px-4 rounded-xl hover:bg-[#E67E00] flex items-center justify-center gap-2 transition-colors">
                        <Users size={14} /> Assign
                      </button>
                      <button onClick={() => handleReject(req._id)} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-4 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors">
                        <X size={14} /> Reject
                      </button>
                    </div>
                  )}
                  {["declined_by_guide", "expired", "payment_expired"].includes(req.status) && (
                    <button onClick={() => openAssignModal(req)} className="w-full bg-[#FF8C00] text-white font-bold py-2.5 px-4 rounded-xl hover:bg-[#E67E00] flex items-center justify-center gap-2 transition-colors">
                      Reassign Guide <ArrowRight size={14} />
                    </button>
                  )}
                  {req.status === "guide_pending" && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-500/20">
                      Awaiting Guide Response
                    </div>
                  )}
                  {req.status === "awaiting_payment" && (
                    <div className="bg-[#FF8C00]/10 text-[#FF8C00] text-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#FF8C00]/20">
                      Awaiting Traveler Payment
                    </div>
                  )}
                  {req.status === "confirmed" && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20">
                      Confirmed & Paid
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Assign Guide Modal */}
      <AnimatePresence>
      {assigningRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            className="bg-white dark:bg-[#1E293B] rounded-[24px] max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-[#334155]"
          >
            <div className="p-6 border-b border-slate-100 dark:border-[#334155]">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Assign Guide</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    Ranked by availability (40%), rating (30%), workload (20%), completion rate (10%)
                  </p>
                </div>
                <button onClick={() => setAssigningRequest(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {rankedGuides.length === 0 ? (
                <p className="text-sm font-medium text-slate-500 text-center py-8">No available guides for this date.</p>
              ) : rankedGuides.map((g) => (
                <button
                  key={g.guideId}
                  type="button"
                  onClick={() => setSelectedGuideId(g.guideId)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    selectedGuideId === g.guideId
                      ? "border-[#FF8C00] bg-[#FF8C00]/5 dark:bg-[#FF8C00]/10"
                      : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-800/50"
                  }`}
                >
                  {g.profilePicture ? (
                    <img src={g.profilePicture} alt={g.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                      {g.name?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{g.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">{g.languages?.join(", ")} · Score: {g.totalScore}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                      <Star size={10} className="fill-slate-400 dark:fill-slate-500" /> {g.rating?.toFixed(1)} · {g.toursThisMonth} tours this month
                    </p>
                  </div>
                  {selectedGuideId === g.guideId && (
                    <div className="w-5 h-5 rounded-full bg-[#FF8C00] text-white flex items-center justify-center flex-shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-[#334155] space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Price per person (Optional Override)</label>
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="Leave blank for tour base price"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0F172A] text-sm text-slate-900 dark:text-white font-medium outline-none focus:border-[#FF8C00] transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setAssigningRequest(null)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAssignGuide(assigningRequest._id)}
                  disabled={!selectedGuideId}
                  className="flex-1 py-3 rounded-xl bg-[#FF8C00] text-white font-bold text-sm hover:bg-[#E67E00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign Guide
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Convert Modal (legacy) */}
      <AnimatePresence>
      {convertingRequest && (
        <ConvertModal
          request={convertingRequest}
          onClose={() => setConvertingRequest(null)}
          onConvert={handleConvert}
        />
      )}
      </AnimatePresence>
    </div>
  );
}

// ─── Convert Modal ────────────────────────────────────────────────────────────

function ConvertModal({ request, onClose, onConvert }: any) {
  const [guides, setGuides] = useState<GuideAvailability[]>([]);
  const [alternatives, setAlternatives] = useState<AlternativeSlot[]>([]);
  const [hasAvailableGuides, setHasAvailableGuides] = useState<boolean | null>(null);
  const [selectedGuide, setSelectedGuide] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);

  // Override date fields — pre-populated from the request but admin can change
  const rawDate = request.preferredDate ? request.preferredDate.split("T")[0] : "";
  const [overrideDate, setOverrideDate] = useState(rawDate);
  const [overrideEndDate, setOverrideEndDate] = useState(rawDate);
  const [overrideTime, setOverrideTime] = useState(request.preferredTime || "09:00 AM");
  const [overrideEndTime, setOverrideEndTime] = useState("05:00 PM");

  const checkAvailability = useCallback(async (sd: string, ed: string, st: string, et: string) => {
    if (!sd) return;
    setLoading(true);
    setSelectedGuide("");
    setAlternatives([]);
    try {
      const res = await apiClient.post("/tours/guides/availability", {
        startDate: sd,
        endDate: ed || sd,
        startTime: st,
        endTime: et,
      });
      setGuides(res.data.data || []);
      setHasAvailableGuides(res.data.hasAvailableGuides ?? true);
      setAlternatives(res.data.alternatives || []);
    } catch {
      // silently handle — user will see no guides
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount with request's preferred date
  useEffect(() => {
    if (overrideDate) {
      checkAvailability(overrideDate, overrideEndDate || overrideDate, overrideTime, overrideEndTime);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-query with debounce whenever any scheduling field changes
  useEffect(() => {
    if (!overrideDate) return;
    const timer = setTimeout(() => {
      checkAvailability(overrideDate, overrideEndDate || overrideDate, overrideTime, overrideEndTime);
    }, 400);
    return () => clearTimeout(timer);
  }, [overrideDate, overrideEndDate, overrideTime, overrideEndTime, checkAvailability]);

  const applyAlternative = (alt: AlternativeSlot) => {
    setOverrideDate(alt.startDate);
    setOverrideEndDate(alt.endDate);
    setOverrideTime(alt.startTime);
    setOverrideEndTime(alt.endTime);
    setSelectedGuide(alt.guideId);
    toast.success(`Slot updated to ${alt.startDate} for ${alt.guideName}`);
  };

  const handleSubmit = async () => {
    setConverting(true);
    try {
      await onConvert(selectedGuide, adminNotes, customPrice, overrideDate, overrideEndDate);
    } finally {
      setConverting(false);
    }
  };

  const availableGuides = guides.filter(g => !g.hasConflict);
  const busyGuides = guides.filter(g => g.hasConflict);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="bg-white dark:bg-[#1E293B] rounded-[24px] w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-[#334155]"
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-[#334155] flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Assign Guide & Convert</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Creating a Private Schedule for <strong className="text-slate-900 dark:text-white">{request.user?.name}</strong>
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
              <X size={18} />
            </button>
          </div>

          {/* Request summary chip */}
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-1.5 text-xs font-bold bg-[#FF8C00]/10 text-[#FF8C00] px-3 py-1.5 rounded-full border border-[#FF8C00]/20">
              <Calendar size={12} />
              {request.preferredDate ? new Date(request.preferredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No date"}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
              <Users size={12} />
              {request.travelers || 1} traveler{(request.travelers || 1) !== 1 ? "s" : ""}
            </span>
            {request.preferredTime && (
              <span className="flex items-center gap-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                {request.preferredTime}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Schedule Override Section */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Schedule Window</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Start Date</label>
                <input type="date" id="modal-start-date" value={overrideDate} onChange={e => setOverrideDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#FF8C00] transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">End Date</label>
                <input type="date" id="modal-end-date" value={overrideEndDate} onChange={e => setOverrideEndDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#FF8C00] transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Start Time</label>
                <input type="text" id="modal-start-time" value={overrideTime} onChange={e => setOverrideTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#FF8C00] transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">End Time</label>
                <input type="text" id="modal-end-time" value={overrideEndTime} onChange={e => setOverrideEndTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#FF8C00] transition-colors" />
              </div>
            </div>
          </div>

          {/* Guide availability section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Guide Availability</p>
              {loading && <Loader2 size={14} className="animate-spin text-[#FF8C00]" />}
            </div>

            {/* Loading shimmer */}
            {loading && (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700" />
                ))}
              </div>
            )}

            {/* All guides busy */}
            <AnimatePresence>
              {!loading && guides.length > 0 && hasAvailableGuides === false && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Conflict banner */}
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-xl p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black text-red-700 dark:text-red-400 text-xs leading-snug">
                          Requested date unavailable. Here are the closest available options.
                        </p>
                        <p className="text-[11px] text-red-500/80 dark:text-red-400/70 font-medium mt-0.5">
                          Busy guides for this window:
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {busyGuides.map(g => (
                        <div key={g._id} className="flex items-start gap-2 text-xs">
                          <div className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-800/30 flex items-center justify-center text-red-500 font-bold flex-shrink-0 mt-0.5 text-[9px]">
                            {g.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{g.name}</span>
                            {g.allConflicts && g.allConflicts.map((c, i) => (
                              <p key={i} className="text-red-600 dark:text-red-400 text-[11px]">{c}</p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Alternatives */}
                  {alternatives.length > 0 && (() => {
                    const nearSlots = alternatives.filter(a => a.priority === "near_requested_date");
                    const farSlots  = alternatives.filter(a => a.priority === "future_available" || !a.priority);

                    const SlotCard = ({ alt, idx }: { alt: AlternativeSlot; idx: number }) => {
                      const isNear = alt.priority === "near_requested_date";
                      const offsetLabel = alt.dayOffset !== undefined
                        ? alt.dayOffset === 0 ? "Same day"
                          : alt.dayOffset > 0 ? `+${alt.dayOffset} day${Math.abs(alt.dayOffset) !== 1 ? "s" : ""}`
                          : `${alt.dayOffset} day${Math.abs(alt.dayOffset) !== 1 ? "s" : ""}`
                        : null;

                      return (
                        <motion.div
                          key={`${alt.guideId}-${idx}`}
                          initial={{ opacity: 0, x: 6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.06 }}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 ${
                            isNear
                              ? "border-[#FF8C00]/30 bg-[#FF8C00]/5"
                              : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                          }`}
                        >
                          {/* Avatar */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 border border-[#FF8C00]/20 ${
                            isNear
                              ? "bg-[#FF8C00]/10 text-[#FF8C00]"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                          }`}>
                            {alt.guideProfilePicture
                              ? <img src={alt.guideProfilePicture} alt={alt.guideName} className="w-full h-full rounded-full object-cover" />
                              : alt.guideName.charAt(0)
                            }
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-black text-slate-900 dark:text-white text-xs">{alt.guideName}</p>
                              {offsetLabel && (
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                                  isNear
                                    ? "bg-[#FF8C00]/20 text-[#FF8C00]"
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                                }`}>{offsetLabel}</span>
                              )}
                            </div>
                            <p className={`text-[11px] font-medium flex items-center gap-1 mt-0.5 ${
                              isNear ? "text-[#FF8C00]" : "text-slate-600 dark:text-slate-400"
                            }`}>
                              <CheckCircle size={10} />
                              {alt.startDate} – {alt.endDate} &nbsp;·&nbsp; {alt.startTime} – {alt.endTime}
                            </p>
                          </div>

                          {/* CTA */}
                          <button
                            id={`modal-use-slot-${idx}`}
                            onClick={() => applyAlternative(alt)}
                            className={`flex items-center gap-1 text-[11px] font-black text-white px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0 ${
                              isNear
                                ? "bg-[#FF8C00] hover:bg-[#E67E00]"
                                : "bg-slate-800 hover:bg-slate-900 dark:bg-slate-600 dark:hover:bg-slate-500"
                            }`}
                          >
                            Use This <ArrowRight size={10} />
                          </button>
                        </motion.div>
                      );
                    };

                    return (
                      <div className="space-y-4">
                        {nearSlots.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles size={12} className="text-[#FF8C00]" />
                              <p className="text-[11px] font-black uppercase tracking-wider text-[#FF8C00]">
                                Near Requested Date
                              </p>
                            </div>
                            <div className="space-y-2">
                              {nearSlots.map((alt, idx) => <SlotCard key={`near-${idx}`} alt={alt} idx={idx} />)}
                            </div>
                          </div>
                        )}

                        {farSlots.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles size={12} className="text-slate-500" />
                              <p className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                Future Available
                              </p>
                            </div>
                            <div className="space-y-2">
                              {farSlots.map((alt, idx) => <SlotCard key={`far-${idx}`} alt={alt} idx={idx} />)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {alternatives.length === 0 && (
                    <p className="text-center text-xs text-slate-500 font-medium py-2">No alternative slots found within ±3 days or the next 14 days.</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Available + busy guides list */}
            {!loading && guides.length > 0 && hasAvailableGuides !== false && (
              <div className="space-y-2">
                {availableGuides.map(g => (
                  <div
                    key={g._id}
                    id={`modal-guide-${g._id}`}
                    onClick={() => setSelectedGuide(g._id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer
                      ${selectedGuide === g._id
                        ? "border-[#FF8C00] bg-[#FF8C00]/5 dark:bg-[#FF8C00]/10"
                        : "border-transparent bg-slate-50 dark:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700"}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-600">
                      {g.profilePicture
                        ? <img src={g.profilePicture} alt={g.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-xs">{g.name.charAt(0)}</div>
                      }
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-slate-900 dark:text-white text-sm">{g.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{g.languages?.join(", ")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-500/30">
                        <CheckCircle size={10} /> Free
                      </span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedGuide === g._id ? "border-[#FF8C00] bg-[#FF8C00]" : "border-slate-300 dark:border-slate-600"}`}>
                        {selectedGuide === g._id && <CheckCircle size={12} className="text-white" />}
                      </div>
                    </div>
                  </div>
                ))}

                {busyGuides.map(g => (
                  <div key={g._id} className="flex items-start gap-3 p-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 opacity-60 cursor-not-allowed">
                    <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0 grayscale">
                      {g.profilePicture
                        ? <img src={g.profilePicture} alt={g.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs">{g.name.charAt(0)}</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-black text-slate-700 dark:text-slate-300 text-sm">{g.name}</p>
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-1 rounded-md whitespace-nowrap flex-shrink-0 border border-red-200 dark:border-red-500/30">
                          <XCircle size={10} /> Busy
                        </span>
                      </div>
                      {g.allConflicts && g.allConflicts.map((c, i) => (
                        <p key={i} className="text-[11px] text-red-500/80 font-medium mt-0.5">{c}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && guides.length === 0 && (
              <p className="text-center text-xs text-slate-500 font-medium py-4">Set a date above to check guide availability.</p>
            )}
          </div>

          {/* Admin Notes */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Admin Notes (Visible to Traveler)</label>
            <textarea
              id="modal-admin-notes"
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              rows={2}
              placeholder="Special arrangements, pickup details, etc."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0F172A] text-sm text-slate-900 dark:text-white font-medium outline-none focus:border-[#FF8C00] transition-colors resize-none"
            />
          </div>

          {/* Custom Price */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Custom Price / Total (Optional)</label>
            <input
              id="modal-custom-price"
              type="number"
              value={customPrice}
              onChange={e => setCustomPrice(e.target.value)}
              placeholder="Override standard price"
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0F172A] text-sm text-slate-900 dark:text-white font-medium outline-none focus:border-[#FF8C00] transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex-shrink-0 border-t border-slate-100 dark:border-[#334155] flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          >
            Cancel
          </button>
          <button
            id="modal-convert-btn"
            onClick={handleSubmit}
            disabled={!selectedGuide || converting}
            className="flex-1 py-3 bg-[#FF8C00] hover:bg-[#E67E00] disabled:opacity-50 text-white font-black rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {converting && <Loader2 size={16} className="animate-spin" />}
            Create Schedule
          </button>
        </div>
      </motion.div>
    </div>
  );
}
