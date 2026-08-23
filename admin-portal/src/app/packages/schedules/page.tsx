"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, CheckCircle, XCircle, Loader2,
  ChevronDown, Sparkles, ArrowRight, AlertCircle, DollarSign,
  Calendar, Clock, MapPin, Star, Award, Search, X, Check, ChevronRight
} from "lucide-react";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";

const API_BASE = apiClient.defaults.baseURL?.replace('/admin', '') || "http://localhost:5000/api";

interface Package {
  _id: string;
  name: { en: string; am: string };
}

interface Guide {
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
}

export default function ManagePackageSchedulesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [loading, setLoading] = useState(true);

  // Form State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00 AM");
  const [endTime, setEndTime] = useState("05:00 PM");
  const [capacity, setCapacity] = useState("20");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [priceOverride, setPriceOverride] = useState("");

  // Guide State
  const [guides, setGuides] = useState<Guide[]>([]);
  const [alternatives, setAlternatives] = useState<AlternativeSlot[]>([]);
  const [hasAvailableGuides, setHasAvailableGuides] = useState<boolean | null>(null);
  const [searchingGuides, setSearchingGuides] = useState(false);
  const [selectedGuideId, setSelectedGuideId] = useState("");
  const [assigning, setAssigning] = useState(false);

  // UI State
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [showGuidePanel, setShowGuidePanel] = useState(false);
  const [guideSearchTerm, setGuideSearchTerm] = useState("");
  const [guidesPage, setGuidesPage] = useState(1);
  const GUIDES_PER_PAGE = 5;

  useEffect(() => {
    setGuidesPage(1);
  }, [guideSearchTerm, guides]);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { data } = await apiClient.get(`${API_BASE}/packages`);
        setPackages(data.data || []);
      } catch {
        toast.error("Failed to load travel packages");
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const triggerGuideSearch = useCallback(async (sd: string, ed: string, st: string, et: string) => {
    if (!sd || !ed) return;
    try {
      setSearchingGuides(true);
      setAlternatives([]);
      const { data } = await apiClient.post(`${API_BASE}/tours/guides/availability`, {
        startDate: sd,
        endDate: ed,
        startTime: st,
        endTime: et,
      });
      setGuides(data.data || []);
      setHasAvailableGuides(data.hasAvailableGuides ?? true);
      setAlternatives(data.alternatives || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to search guides");
    } finally {
      setSearchingGuides(false);
    }
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      const timer = setTimeout(() => triggerGuideSearch(startDate, endDate, startTime, endTime), 400);
      return () => clearTimeout(timer);
    }
  }, [startDate, endDate, startTime, endTime, triggerGuideSearch]);

  const handleNextToGuide = () => {
    if (!selectedPackageId || !startDate || !endDate || !startTime || !endTime || !capacity || !meetingPoint) {
      toast.error("Please fill in all required fields first.");
      return;
    }
    setWizardStep(2);
    setShowGuidePanel(true);
  };

  const handleSelectGuide = (guideId: string) => {
    setSelectedGuideId(guideId);
    setShowGuidePanel(false);
    setWizardStep(3);
  };

  const handleClosePanel = () => {
    setShowGuidePanel(false);
    if (!selectedGuideId) {
      setWizardStep(1);
    }
  };

  const applyAlternative = (alt: AlternativeSlot) => {
    setStartDate(alt.startDate);
    setEndDate(alt.endDate);
    setStartTime(alt.startTime);
    setEndTime(alt.endTime);
    setSelectedGuideId(alt.guideId);
    toast.success(`Dates automatically adjusted for ${alt.guideName}`);
    setShowGuidePanel(false);
    setWizardStep(3);
  };

  const handleAssignSchedule = async () => {
    if (!selectedPackageId || !selectedGuideId || !startDate || !endDate || !capacity || !meetingPoint) {
      toast.error("Package, Guide, dates, capacity, and meeting point are required");
      return;
    }
    try {
      setAssigning(true);
      await apiClient.post(`${API_BASE}/packages/${selectedPackageId}/schedules`, {
        assignedGuide: selectedGuideId,
        startDate,
        endDate,
        startTime,
        endTime,
        capacity: parseInt(capacity),
        meetingPoint,
        priceOverride: priceOverride ? parseFloat(priceOverride) : undefined,
      });
      toast.success("Schedule created successfully!");
      setGuides([]); setSelectedGuideId(""); setStartDate(""); setEndDate("");
      setCapacity("20"); setMeetingPoint(""); setPriceOverride(""); setAlternatives([]); setHasAvailableGuides(null);
      setWizardStep(1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to assign schedule. A conflict may have occurred.");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-[#0B1120]">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  const filteredGuides = guides.filter(g => g.name.toLowerCase().includes(guideSearchTerm.toLowerCase()));
  const availableGuides = filteredGuides.filter(g => !g.hasConflict);
  const busyGuides = filteredGuides.filter(g => g.hasConflict);

  const totalGuidePages = Math.ceil(availableGuides.length / GUIDES_PER_PAGE) || 1;
  const paginatedGuides = availableGuides.slice((guidesPage - 1) * GUIDES_PER_PAGE, guidesPage * GUIDES_PER_PAGE);

  const selectedPackage = packages.find(p => p._id === selectedPackageId);
  const selectedGuide = guides.find(g => g._id === selectedGuideId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-50 pb-24 md:pb-12 pt-8 px-4 md:px-8 font-sans">
      <div className="max-w-[1000px] mx-auto">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">
          <span>Schedules</span>
          <ChevronRight size={14} />
          <span className="text-slate-900 dark:text-slate-200">Create Schedule</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-6">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">Create Schedule</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Configure logistics with our smart engine. We automatically secure available guides and prevent double-booking instantly.
            </p>
          </div>
          <div className="hidden sm:flex w-[68px] h-[68px] rounded-[18px] bg-white dark:bg-[#1A2235] border border-slate-200 dark:border-white/5 items-center justify-center shadow-sm flex-shrink-0">
            <Calendar size={28} className="text-[#FF8C00]" />
          </div>
        </div>

        {/* Wizard Indicator Card */}
        <div className="bg-white dark:bg-[#131B2C] rounded-[24px] p-4 sm:p-6 md:px-10 border border-slate-200 dark:border-white/5 mb-6 flex flex-row items-center justify-between shadow-sm gap-4 overflow-x-auto custom-scrollbar">
          {/* Step 1 */}
          <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${wizardStep >= 1 ? 'bg-[#FF8C00] text-white shadow-lg shadow-orange-500/20' : 'bg-slate-100 dark:bg-[#232D45] text-slate-500'}`}>1</div>
            <div>
              <p className={`font-bold text-xs md:text-sm ${wizardStep >= 1 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Schedule Details</p>
              <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5">When & what</p>
            </div>
          </div>
          
          <ArrowRight size={16} className={`hidden sm:block flex-shrink-0 ${wizardStep > 1 ? "text-[#FF8C00]" : "text-slate-300 dark:text-slate-700"}`} />

          {/* Step 2 */}
          <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${wizardStep >= 2 ? 'bg-[#FF8C00] text-white shadow-lg shadow-orange-500/20' : 'bg-slate-100 dark:bg-[#2A344A] text-slate-500'}`}>2</div>
            <div>
              <p className={`font-bold text-xs md:text-sm ${wizardStep >= 2 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Select Guide</p>
              <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Who is available</p>
            </div>
          </div>

          <ArrowRight size={16} className={`hidden sm:block flex-shrink-0 ${wizardStep > 2 ? "text-[#FF8C00]" : "text-slate-300 dark:text-slate-700"}`} />

          {/* Step 3 */}
          <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${wizardStep >= 3 ? 'bg-[#FF8C00] text-white shadow-lg shadow-orange-500/20' : 'bg-slate-100 dark:bg-[#2A344A] text-slate-500'}`}>3</div>
            <div>
              <p className={`font-bold text-xs md:text-sm ${wizardStep >= 3 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Review & Confirm</p>
              <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Confirm & publish</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          {wizardStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white dark:bg-[#131B2C] rounded-[24px] p-6 md:p-8 border border-slate-200 dark:border-white/5 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-[16px] bg-slate-50 dark:bg-[#1A2235] border border-slate-200 dark:border-white/5 flex items-center justify-center">
                  <Calendar size={20} className="text-[#FF8C00]" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Schedule Details</h2>
              </div>

              <div className="space-y-6">
                
                {/* Select Tour Blueprint */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-2 font-medium">Select Tour Blueprint</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={selectedPackageId}
                      onChange={(e) => setSelectedPackageId(e.target.value)}
                      className="w-full bg-transparent border border-slate-200 dark:border-white/10 rounded-[12px] pl-11 pr-10 py-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-[#FF8C00] appearance-none font-medium transition-colors cursor-pointer"
                    >
                      <option value="" disabled className="dark:bg-[#131B2C]">Select a tour...</option>
                      {packages.map(p => (
                        <option key={p._id} value={p._id} className="dark:bg-[#131B2C]">{p.name.en}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 md:gap-8">
                  {/* Start Date */}
                  <div>
                    <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-2 font-medium truncate">Start Date</label>
                    <div className="relative">
                      <Clock size={16} className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input 
                        type="date" 
                        value={startDate} 
                        onChange={e => setStartDate(e.target.value)} 
                        className="w-full bg-transparent border border-slate-200 dark:border-white/10 rounded-[12px] pl-9 md:pl-11 pr-2 py-3.5 text-[13px] md:text-sm text-slate-900 dark:text-white outline-none focus:border-[#FF8C00] font-medium transition-colors dark:[color-scheme:dark]"
                      />
                    </div>
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-2 font-medium truncate">End Date</label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input 
                        type="date" 
                        value={endDate} 
                        onChange={e => setEndDate(e.target.value)} 
                        className="w-full bg-transparent border border-slate-200 dark:border-white/10 rounded-[12px] pl-9 md:pl-11 pr-2 py-3.5 text-[13px] md:text-sm text-slate-900 dark:text-white outline-none focus:border-[#FF8C00] font-medium transition-colors dark:[color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:gap-8">
                  {/* Start Time */}
                  <div>
                    <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-2 font-medium truncate">Start Time</label>
                    <div className="relative">
                      <Clock size={16} className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input 
                        type="text" 
                        placeholder="09:00 AM" 
                        value={startTime} 
                        onChange={e => setStartTime(e.target.value)} 
                        className="w-full bg-transparent border border-slate-200 dark:border-white/10 rounded-[12px] pl-9 md:pl-11 pr-2 py-3.5 text-[13px] md:text-sm text-slate-900 dark:text-white outline-none focus:border-[#FF8C00] font-medium transition-colors"
                      />
                    </div>
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-2 font-medium truncate">End Time</label>
                    <div className="relative">
                      <Clock size={16} className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input 
                        type="text" 
                        placeholder="05:00 PM" 
                        value={endTime} 
                        onChange={e => setEndTime(e.target.value)} 
                        className="w-full bg-transparent border border-slate-200 dark:border-white/10 rounded-[12px] pl-9 md:pl-11 pr-2 py-3.5 text-[13px] md:text-sm text-slate-900 dark:text-white outline-none focus:border-[#FF8C00] font-medium transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:gap-8">
                  {/* Capacity */}
                  <div>
                    <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-2 font-medium truncate">Capacity</label>
                    <div className="relative">
                      <Users size={16} className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input 
                        type="number" 
                        value={capacity} 
                        onChange={e => setCapacity(e.target.value)} 
                        className="w-full bg-transparent border border-slate-200 dark:border-white/10 rounded-[12px] pl-9 md:pl-11 pr-2 py-3.5 text-[13px] md:text-sm text-slate-900 dark:text-white outline-none focus:border-[#FF8C00] font-medium transition-colors"
                      />
                    </div>
                  </div>

                  {/* Custom Price */}
                  <div>
                    <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-2 font-medium truncate">Price Override</label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input 
                        type="number" 
                        placeholder="Leave blank"
                        value={priceOverride} 
                        onChange={e => setPriceOverride(e.target.value)} 
                        className="w-full bg-transparent border border-slate-200 dark:border-white/10 rounded-[12px] pl-9 md:pl-11 pr-2 py-3.5 text-[13px] md:text-sm text-slate-900 dark:text-white outline-none focus:border-[#FF8C00] font-medium transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Meeting Point */}
                <div>
                  <label className="block text-[13px] text-slate-700 dark:text-slate-300 mb-2 font-medium truncate">Meeting Point *</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input 
                      type="text" 
                      placeholder="e.g. Hotel Lobby, Durame Town Square..."
                      value={meetingPoint} 
                      onChange={e => setMeetingPoint(e.target.value)} 
                      className="w-full bg-transparent border border-slate-200 dark:border-white/10 rounded-[12px] pl-9 md:pl-11 pr-2 py-3.5 text-[13px] md:text-sm text-slate-900 dark:text-white outline-none focus:border-[#FF8C00] font-medium transition-colors"
                    />
                  </div>
                </div>

              </div>
              
              <div className="flex justify-end mt-8">
                <button 
                  onClick={handleNextToGuide} 
                  className="w-full sm:w-auto bg-[#FF8C00] hover:bg-orange-600 text-white font-bold text-[15px] px-8 py-3.5 rounded-[14px] flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-500/20 active:scale-[0.98]"
                >
                  Next: Select Guide <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {wizardStep === 3 && selectedPackage && selectedGuide && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white dark:bg-[#131B2C] rounded-[24px] p-6 md:p-8 border border-slate-200 dark:border-white/5 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Schedule Details Summary */}
                <div className="bg-slate-50 dark:bg-[#1A2235] rounded-[20px] p-6 border border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-[12px] bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <MapPin size={20} />
                    </div>
                    <h3 className="font-bold text-lg">Schedule Summary</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Package</p>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{selectedPackage.name.en}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date Range</p>
                        <p className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5"><Calendar size={14} className="text-slate-400" /> {startDate}</p>
                        <p className="font-bold text-sm text-slate-500 flex items-center gap-1.5 mt-1"><Calendar size={14} className="text-slate-400" /> {endDate}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Time</p>
                        <p className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> {startTime}</p>
                        <p className="font-bold text-sm text-slate-500 flex items-center gap-1.5 mt-1"><Clock size={14} className="text-slate-400" /> {endTime}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-white/10">
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Capacity</p>
                        <p className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5"><Users size={14} className="text-slate-400" /> {capacity} Guests</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Custom Price</p>
                        <p className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5"><DollarSign size={14} className="text-slate-400" /> {priceOverride ? `$${priceOverride}` : 'Default'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selected Guide Summary */}
                <div className="bg-slate-50 dark:bg-[#1A2235] rounded-[20px] p-6 border border-slate-200 dark:border-white/5 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[12px] bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center">
                        <CheckCircle size={20} />
                      </div>
                      <h3 className="font-bold text-lg">Assigned Guide</h3>
                    </div>
                    <button onClick={() => { setWizardStep(2); setShowGuidePanel(true); }} className="text-sm font-bold text-[#FF8C00] hover:text-orange-600 transition-colors">
                      Change
                    </button>
                  </div>

                  <div className="bg-white dark:bg-[#131B2C] rounded-[16px] p-4 border border-slate-200 dark:border-white/5 shadow-sm flex items-center gap-4">
                    {selectedGuide.profilePicture ? (
                      <img src={selectedGuide.profilePicture} className="w-14 h-14 rounded-[12px] object-cover border border-slate-100 dark:border-white/5 shadow-sm" alt={selectedGuide.name} />
                    ) : (
                      <div className="w-14 h-14 rounded-[12px] bg-slate-200 dark:bg-[#1A2235] flex items-center justify-center text-slate-500 font-bold text-xl">
                        {selectedGuide.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-sm">{selectedGuide.name}</h4>
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-500 px-2 py-0.5 rounded-md uppercase tracking-wider mt-1 border border-green-200 dark:border-green-500/20">
                        <CheckCircle size={10}/> Available
                      </span>
                      <div className="mt-2 flex items-center gap-3 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1"><Award size={12}/> 5+ Yrs Exp</span>
                        <span className="flex items-center gap-1"><Star size={12} className="text-amber-500 fill-amber-500"/> 4.9</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-6">
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
                        <AlertCircle size={14} /> Review all details carefully before finalizing.
                      </p>
                  </div>
                </div>

              </div>

              <div className="flex flex-col sm:flex-row justify-end mt-8 gap-4">
                <button onClick={() => setWizardStep(1)} className="w-full sm:w-auto bg-slate-100 dark:bg-[#1A2235] hover:bg-slate-200 dark:hover:bg-[#232D45] text-slate-700 dark:text-slate-300 font-bold text-[15px] px-8 py-3.5 rounded-[14px] transition-colors">
                  Back
                </button>
                <button onClick={handleAssignSchedule} disabled={assigning} className="w-full sm:w-auto bg-[#FF8C00] hover:bg-orange-600 text-white font-bold text-[15px] px-8 py-3.5 rounded-[14px] flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-500/20 disabled:opacity-50">
                  {assigning ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  Confirm & Create Schedule
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Guide Selection Panel (Modal / Side Panel) */}
      <AnimatePresence>
        {showGuidePanel && (
          <>
            {/* Backdrop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClosePanel} className="fixed inset-0 bg-[#0F172A] dark:bg-black/60 backdrop-blur-sm z-[100]" />
            
            {/* Panel container */}
            <motion.div 
              initial={{ y: "100%", md: { y: 0, x: "100%" } } as any} 
              animate={{ y: 0, x: 0 }} 
              exit={{ y: "100%", md: { y: 0, x: "100%" } } as any}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 md:inset-x-auto md:right-0 md:top-0 md:bottom-0 md:w-[480px] bg-white dark:bg-[#0B1120] rounded-t-[32px] md:rounded-none shadow-2xl z-[110] flex flex-col h-[85vh] md:h-full border-t md:border-t-0 md:border-l border-slate-200 dark:border-white/10 overflow-hidden"
            >
              {/* Panel Header */}
              <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#131B2C] z-20">
                <div>
                  <h2 className="text-xl font-bold">Select Guide</h2>
                  <p className="text-xs font-medium text-slate-500 mt-1">Found {availableGuides.length} available guides</p>
                </div>
                <button onClick={handleClosePanel} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#1A2235] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Panel Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-[#0B1120] custom-scrollbar relative">
                
                {/* Search */}
                <div className="relative sticky top-0 z-10 bg-slate-50 dark:bg-[#0B1120] pt-2 pb-4">
                  <input 
                    type="text" 
                    placeholder="Search by name or language..." 
                    value={guideSearchTerm}
                    onChange={(e) => setGuideSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-[#131B2C] border border-slate-200 dark:border-white/10 rounded-[14px] pl-11 pr-4 py-3.5 text-sm font-medium outline-none focus:border-[#FF8C00] shadow-sm transition-all" 
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>

                {searchingGuides ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-[90px] rounded-[16px] bg-slate-200 dark:bg-[#1A2235] animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Conflict & Alternatives Section */}
                    {hasAvailableGuides === false && (
                      <div className="space-y-6 mb-8">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-[16px] p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                            <p className="font-bold text-red-700 dark:text-red-400 text-sm">No guides available for these exact dates</p>
                          </div>
                          <div className="space-y-3">
                            {busyGuides.slice(0, 3).map(g => (
                              <div key={g._id} className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-800/30 flex items-center justify-center text-red-500 font-bold text-[10px] flex-shrink-0 mt-0.5">
                                  {g.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{g.name}</span>
                                  {g.allConflicts?.[0] && <p className="text-xs font-medium text-red-600 dark:text-red-400 truncate">{g.allConflicts[0]}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {alternatives.length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Sparkles size={16} className="text-[#FF8C00]" />
                              <p className="font-bold text-sm">Suggested Alternative Slots</p>
                            </div>
                            {alternatives.map((alt, idx) => (
                              <div key={idx} className="bg-white dark:bg-[#131B2C] p-4 rounded-[16px] border border-orange-200 dark:border-orange-500/30 shadow-sm">
                                <div className="flex items-center justify-between gap-4">
                                  <div>
                                    <p className="font-bold text-sm">{alt.guideName}</p>
                                    <p className="text-[11px] font-medium text-[#FF8C00] mt-1 flex items-center gap-1.5">
                                      <Calendar size={12}/> {alt.startDate} – {alt.endDate}
                                    </p>
                                  </div>
                                  <button onClick={() => applyAlternative(alt)} className="px-4 py-2 rounded-[10px] bg-orange-50 dark:bg-orange-500/10 text-[#FF8C00] font-bold text-xs hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors">
                                    Use This
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Available Guides List */}
                    <div className="space-y-4 pb-20">
                      {paginatedGuides.map(guide => (
                        <div 
                          key={guide._id} 
                          onClick={() => handleSelectGuide(guide._id)} 
                          className="bg-white dark:bg-[#131B2C] rounded-[16px] p-4 border border-slate-200 dark:border-white/5 hover:border-[#FF8C00] dark:hover:border-[#FF8C00] cursor-pointer transition-all shadow-sm group relative overflow-hidden"
                        >
                          <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-[12px] bg-slate-100 dark:bg-[#1A2235] border border-slate-200 dark:border-white/5 overflow-hidden flex-shrink-0 shadow-sm">
                              {guide.profilePicture ? (
                                <img src={guide.profilePicture} alt={guide.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-xl">{guide.name.charAt(0)}</div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                  <h4 className="font-bold text-sm truncate">{guide.name}</h4>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400 px-2 py-0.5 rounded-md uppercase tracking-wider border border-green-200 dark:border-green-500/20">
                                      <CheckCircle size={10}/> Available
                                    </span>
                                  </div>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selectedGuideId === guide._id ? "border-[#FF8C00] bg-[#FF8C00]" : "border-slate-300 dark:border-slate-600 group-hover:border-[#FF8C00]/50"}`}>
                                  {selectedGuideId === guide._id && <Check size={14} className="text-white" />}
                                </div>
                              </div>
                              <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-500">
                                <span className="flex items-center gap-1"><Star size={12} className="text-amber-500 fill-amber-500"/> 4.9</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                <span className="flex items-center gap-1"><Award size={12}/> 5+ Yrs</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                <span className="truncate flex-1">{guide.languages?.join(", ")}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Pagination Controls */}
                      {totalGuidePages > 1 && (
                        <div className="flex items-center justify-between pt-4 mt-6 border-t border-slate-200 dark:border-white/10">
                          <button 
                            disabled={guidesPage === 1}
                            onClick={() => setGuidesPage(p => p - 1)}
                            className="px-4 py-2 text-xs font-bold rounded-[10px] bg-white dark:bg-[#1A2235] text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-[#232D45] border border-slate-200 dark:border-white/5 transition-colors shadow-sm"
                          >
                            Previous
                          </button>
                          <span className="text-xs font-medium text-slate-500">
                            Page {guidesPage} of {totalGuidePages}
                          </span>
                          <button 
                            disabled={guidesPage === totalGuidePages}
                            onClick={() => setGuidesPage(p => p + 1)}
                            className="px-4 py-2 text-xs font-bold rounded-[10px] bg-white dark:bg-[#1A2235] text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-[#232D45] border border-slate-200 dark:border-white/5 transition-colors shadow-sm"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
