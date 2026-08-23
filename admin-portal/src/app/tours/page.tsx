"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Search, Plus, Loader2, Map, Calendar, Users, DollarSign, Clock, MapPin, Pencil, Trash2, Star, Tent, AlertTriangle, XCircle, CheckCircle, PlusCircle, MinusCircle } from "lucide-react";

const MapPicker = dynamic(() => import("@/components/shared/MapPicker"), { ssr: false });
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";
import { confirmAction } from "@/utils/confirmAlert";

interface Tour {
  _id: string;
  title: { en: string; am: string };
  price: number;
  duration: { value: number; unit: string };
  difficulty: string;
  images: string[];
  rating?: { average: number; numReviews: number };
  destinations: { _id: string; name: { en: string } }[];
  schedules: any[];
  itinerary?: any[];
}

export default function ToursPage() {
  const router = useRouter();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [destinations, setDestinations] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    titleEn: "", titleAm: "", descEn: "", descAm: "", 
    price: 0, durationValue: 1, durationUnit: "days", 
    difficulty: "moderate", maxCapacity: 10, imageUrl: "", destinationId: "",
    itinerary: [] as any[]
  });

  // Schedule Management State
  const [isScheduleListModalOpen, setIsScheduleListModalOpen] = useState(false);
  const [managingTour, setManagingTour] = useState<Tour | null>(null);
  const [isCancellingSchedule, setIsCancellingSchedule] = useState<string | null>(null);

  const fetchTours = async () => {
    try {
      const [toursRes, destsRes] = await Promise.all([
        apiClient.get("/tours"),
        apiClient.get("/destinations")
      ]);
      setTours(toursRes.data.data || []);
      setDestinations(destsRes.data.data || []);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, []);

  const openAddModal = () => {
    setEditingTour(null);
    setFormData({
      titleEn: "", titleAm: "", descEn: "", descAm: "", 
      price: 0, durationValue: 1, durationUnit: "days", 
      difficulty: "moderate", maxCapacity: 10, imageUrl: "", 
      destinationId: destinations[0]?._id || "",
      itinerary: []
    });
    setIsModalOpen(true);
  };

  const openEditModal = (tour: Tour) => {
    setEditingTour(tour);
    setFormData({
      titleEn: tour.title?.en || (typeof tour.title === 'string' ? tour.title : ""),
      titleAm: tour.title?.am || "",
      descEn: "", // Backend doesn't return full desc in list usually, but we'll try
      descAm: "", 
      price: tour.price || 0,
      durationValue: tour.duration?.value || 1,
      durationUnit: tour.duration?.unit || "days",
      difficulty: tour.difficulty || "moderate",
      maxCapacity: 10, // Default since it might not be in the list view
      imageUrl: tour.images?.[0] || "",
      destinationId: tour.destinations?.[0]?._id || destinations[0]?._id || "",
      itinerary: tour.itinerary || []
    });
    setIsModalOpen(true);
  };

  const openScheduleListModal = (tour: Tour) => {
    setManagingTour(tour);
    setIsScheduleListModalOpen(true);
  };

  const handleCancelSchedule = async (scheduleId: string) => {
    if (!managingTour) return;
    const isConfirmed = await confirmAction("Cancel Schedule?", "Are you sure you want to cancel this schedule? Any associated bookings will be marked as 'Refund Pending' and travelers will be notified.");
    if (!isConfirmed) return;

    try {
      setIsCancellingSchedule(scheduleId);
      await apiClient.delete(`/admin/tours/${managingTour._id}/schedules/${scheduleId}`);
      toast.success("Schedule cancelled successfully.");
      
      // Update local state without full reload
      setManagingTour(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          schedules: prev.schedules.map(s => s._id === scheduleId ? { ...s, status: "cancelled" } : s)
        };
      });
      fetchTours();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to cancel schedule");
    } finally {
      setIsCancellingSchedule(null);
    }
  };

  const addItineraryDay = () => {
    setFormData(prev => ({
      ...prev,
      itinerary: [
        ...prev.itinerary,
        { day: prev.itinerary.length + 1, title: { en: "", am: "" }, description: { en: "", am: "" }, startTime: "08:00", location: null }
      ]
    }));
  };

  const removeItineraryDay = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== index).map((stop, i) => ({ ...stop, day: i + 1 }))
    }));
  };

  const updateItineraryDay = (index: number, field: string, value: any, subfield?: string) => {
    setFormData(prev => {
      const newItin = [...prev.itinerary];
      if (subfield) {
        newItin[index][field] = { ...newItin[index][field], [subfield]: value };
      } else {
        newItin[index][field] = value;
      }
      return { ...prev, itinerary: newItin };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        title: { en: formData.titleEn, am: formData.titleAm },
        description: { en: formData.descEn || formData.titleEn, am: formData.descAm || formData.titleAm },
        price: formData.price,
        duration: { value: formData.durationValue, unit: formData.durationUnit },
        difficulty: formData.difficulty,
        maxCapacity: formData.maxCapacity,
        images: formData.imageUrl ? [formData.imageUrl] : [],
        destination: formData.destinationId,
        itinerary: formData.itinerary,
        isPublished: true
      };

      if (editingTour) {
        await apiClient.put(`/tours/${editingTour._id}`, payload);
        toast.success("Tour updated successfully");
      } else {
        await apiClient.post("/tours", payload);
        toast.success("Tour created successfully");
      }
      setIsModalOpen(false);
      fetchTours();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save tour");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const isConfirmed = await confirmAction("Delete Tour?", `Are you sure you want to completely delete the tour "${title}"? This will cancel all upcoming schedules.`);
    if (!isConfirmed) return;
    
    try {
      setIsDeleting(id);
      await apiClient.delete(`/tours/${id}`);
      toast.success("Tour deleted successfully");
      fetchTours();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete tour");
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredTours = tours.filter((t) => {
    const titleEn = typeof t.title === 'string' ? t.title : (t.title?.en || "");
    const diff = t.difficulty || "";
    return titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
           diff.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy": return "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
      case "medium": return "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "hard": return "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400";
      default: return "bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-[#FF8C00]" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            Tour Catalog
            <span className="bg-orange-50 dark:bg-orange-500/10 text-[#FF8C00] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-orange-100 dark:border-orange-500/20">
              {tours.length} Active
            </span>
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
            Oversee marketplace tour packages, pricing, and schedules.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64 group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 dark:group-focus-within:text-white transition-colors"
              size={16}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tours..."
              className="w-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-gray-300 dark:focus:border-white/20 transition-all shadow-sm"
            />
          </div>
          <button onClick={openAddModal} className="flex items-center justify-center gap-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm flex-shrink-0">
            <Plus size={16} strokeWidth={2.5} /> Create Tour
          </button>
        </div>
      </div>

      {/* Tours List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filteredTours.length === 0 ? (
          <div className="col-span-full border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl p-12 text-center flex flex-col items-center bg-gray-50/50 dark:bg-[#0F172A]/50">
            <div className="w-12 h-12 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 shadow-sm rounded-lg flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500">
              <Tent size={24} />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">No tours found</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Try adjusting your search criteria.</p>
          </div>
        ) : (
          filteredTours.map((tour) => (
            <div key={tour._id} className="bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-white/20 transition-all flex flex-col sm:flex-row overflow-hidden group">
              
              {/* Tour Image */}
              <div className="w-full sm:w-48 h-48 sm:h-auto bg-gray-100 dark:bg-[#0F172A] relative flex-shrink-0 overflow-hidden border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-white/10">
                {tour.images && tour.images.length > 0 ? (
                  <img src={tour.images[0]} alt={tour.title.en} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Tent size={32} />
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded flex items-center gap-1 text-xs font-bold text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-white/10">
                  <Star size={10} className="text-[#FF8C00]" fill="#FF8C00" />
                  {(tour.rating?.average || 0).toFixed(1)} <span className="text-gray-500 dark:text-gray-400 font-medium">({tour.rating?.numReviews || 0})</span>
                </div>
              </div>

              {/* Tour Content */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight leading-tight mb-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {typeof tour.title === 'string' ? tour.title : (tour.title?.en || "Untitled Tour")}
                    </h3>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <MapPin size={12} />
                      {tour.destinations?.map(d => d.name?.en).join(', ') || 'Multiple Locations'}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider flex-shrink-0 ${getDifficultyColor(tour.difficulty)}`}>
                    {tour.difficulty}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 my-2 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400">
                      <Clock size={12} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</p>
                      <p className="text-xs font-bold text-gray-900 dark:text-white capitalize">{tour.duration?.value || 0} {tour.duration?.unit || "Days"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400">
                      <DollarSign size={12} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</p>
                      <p className="text-xs font-bold text-[#FF8C00]">${tour.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400">
                      <Calendar size={12} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Schedules</p>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{tour.schedules?.length || 0} Upcoming</p>
                    </div>
                  </div>
                  {tour.schedules?.some((s: any) => s.incidentReport) && (
                    <div className="flex items-center gap-2 col-span-2 bg-red-50 dark:bg-red-500/10 p-2 rounded-lg mt-1 border border-red-100 dark:border-red-500/20">
                      <div className="w-7 h-7 rounded-md bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-500">
                        <AlertTriangle size={12} />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wider">Incidents</p>
                        <p className="text-xs font-bold text-red-700 dark:text-red-400">Action Required</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10 mt-auto">
                  <button onClick={() => openScheduleListModal(tour)} className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                    Manage Schedules
                  </button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditModal(tour)} className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-500/20" title="Edit Tour">
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(tour._id, tour.title.en)}
                      disabled={isDeleting === tour._id}
                      className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-500/20 disabled:opacity-50"
                      title="Delete Tour"
                    >
                      {isDeleting === tour._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tour Add/Edit Modal */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto custom-scrollbar pt-20 pb-20 pointer-events-auto">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md pointer-events-auto" onClick={() => setIsModalOpen(false)} />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-3xl w-full max-w-3xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative z-10 overflow-hidden border border-white dark:border-white/10 flex flex-col mb-10 pointer-events-auto"
              >
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/20 rounded-full blur-[80px] pointer-events-none" />
                <div className="p-8 border-b border-gray-100 dark:border-white/5 relative z-10">
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                    {editingTour ? "Edit Tour Blueprint" : "Create New Tour"}
                  </h2>
                </div>
                
                <form onSubmit={handleSave} className="p-8 space-y-6 relative z-10">
                  <div className="grid grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Title (English) *</label>
                      <input required type="text" value={formData.titleEn} onChange={e => setFormData({...formData, titleEn: e.target.value})} className="w-full bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Title (Amharic) *</label>
                      <input required type="text" value={formData.titleAm} onChange={e => setFormData({...formData, titleAm: e.target.value})} className="w-full bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Image URL</label>
                    <input type="url" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://example.com/image.jpg" className="w-full bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" />
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Price (USD) *</label>
                      <input required type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Duration Value *</label>
                      <input required type="number" min="1" value={formData.durationValue} onChange={e => setFormData({...formData, durationValue: Number(e.target.value)})} className="w-full bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" />
                    </div>
                    <div className="col-span-2 lg:col-span-1">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Unit</label>
                      <select value={formData.durationUnit} onChange={e => setFormData({...formData, durationUnit: e.target.value})} className="w-full bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm appearance-none">
                        <option value="hours" className="bg-white dark:bg-[#0F172A]">Hours</option>
                        <option value="days" className="bg-white dark:bg-[#0F172A]">Days</option>
                        <option value="weeks" className="bg-white dark:bg-[#0F172A]">Weeks</option>
                        <option value="months" className="bg-white dark:bg-[#0F172A]">Months</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Difficulty</label>
                      <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} className="w-full bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm appearance-none">
                        <option value="easy" className="bg-white dark:bg-[#0F172A]">Easy</option>
                        <option value="moderate" className="bg-white dark:bg-[#0F172A]">Moderate</option>
                        <option value="hard" className="bg-white dark:bg-[#0F172A]">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Max Capacity *</label>
                      <input required type="number" min="1" value={formData.maxCapacity} onChange={e => setFormData({...formData, maxCapacity: Number(e.target.value)})} className="w-full bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" />
                    </div>
                    <div className="col-span-2 lg:col-span-1">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Destination *</label>
                      <select required value={formData.destinationId} onChange={e => setFormData({...formData, destinationId: e.target.value})} className="w-full bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm appearance-none">
                        <option value="" disabled className="bg-white dark:bg-[#0F172A]">Select Destination</option>
                        {destinations.map(d => (
                          <option key={d._id} value={d._id} className="bg-white dark:bg-[#0F172A]">{d.name?.en || "Unknown"}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Itinerary Builder */}
                  <div className="pt-4 border-t border-gray-100 dark:border-white/5 mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                        <Map size={16} className="text-[#FF8C00]" /> Itinerary
                      </h3>
                      <button type="button" onClick={addItineraryDay} className="flex items-center gap-1 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors">
                        <PlusCircle size={14} /> Add Stop
                      </button>
                    </div>

                    <div className="space-y-6">
                      {formData.itinerary.map((stop, index) => (
                        <div key={index} className="p-4 bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl relative">
                          <button type="button" onClick={() => removeItineraryDay(index)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
                            <MinusCircle size={18} />
                          </button>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                              <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">Stop {index + 1} Title (EN) *</label>
                                <input required type="text" value={stop.title?.en} onChange={e => updateItineraryDay(index, 'title', e.target.value, 'en')} className="w-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-orange-500 transition-all" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">Description (EN) *</label>
                                <textarea required value={stop.description?.en} onChange={e => updateItineraryDay(index, 'description', e.target.value, 'en')} rows={2} className="w-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500 transition-all resize-none" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">Start Time</label>
                                <input type="time" value={stop.startTime} onChange={e => updateItineraryDay(index, 'startTime', e.target.value)} className="w-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-orange-500 transition-all" />
                              </div>
                            </div>
                            <div className="h-[200px] md:h-auto rounded-xl overflow-hidden border border-gray-200 dark:border-white/10">
                              <MapPicker 
                                initialLocation={stop.location} 
                                onLocationSelect={(lat, lng, placeName) => {
                                  updateItineraryDay(index, 'location', { lat, lng });
                                  if (placeName) {
                                    const shortName = placeName.split(',')[0].trim();
                                    const currentTitle = formData.itinerary[index].title?.en || "";
                                    if (!currentTitle) updateItineraryDay(index, 'title', shortName, 'en');
                                    
                                    const currentDesc = formData.itinerary[index].description?.en || "";
                                    if (!currentDesc) updateItineraryDay(index, 'description', `Visit to ${shortName}`, 'en');
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex flex-col-reverse sm:flex-row justify-end gap-3 md:gap-4 mt-6">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-6 py-4 rounded-xl font-bold text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-center">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSaving || !formData.destinationId} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-8 py-4 rounded-xl font-black text-sm hover:scale-[1.02] hover:shadow-[0_10px_25px_-5px_rgba(249,115,22,0.6)] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none">
                      {isSaving && <Loader2 size={18} className="animate-spin" />}
                      {editingTour ? "Save Changes" : "Create New"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Schedules List Modal */}
      {typeof document !== "undefined" && createPortal(
        <>
          {isScheduleListModalOpen && managingTour && (
            <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-[100px] overflow-y-auto custom-scrollbar pointer-events-auto">
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={() => setIsScheduleListModalOpen(false)} />
              <div className="bg-white dark:bg-[#0F172A] w-full max-w-4xl rounded-[2rem] shadow-2xl relative z-10 overflow-hidden border border-gray-100 dark:border-white/10 flex flex-col mb-10 pointer-events-auto">
                <div className="p-6 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                      <Calendar size={20} className="text-[#FF8C00]" />
                      Manage Schedules
                    </h2>
                    <p className="text-sm font-bold text-[#FF8C00] mt-1">{managingTour.title?.en || "Unnamed Tour"}</p>
                  </div>
                  <button 
                    onClick={() => router.push(`/tours/schedules?tourId=${managingTour._id}`)}
                    className="bg-[#FF8C00] hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-orange-500/20 flex items-center gap-2"
                  >
                    <Plus size={16} /> Create New Schedule
                  </button>
                </div>
                
                <div className="p-6 overflow-x-auto">
                  {!managingTour.schedules || managingTour.schedules.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                      <Calendar size={32} className="mx-auto mb-3 opacity-20" />
                      <p className="font-semibold">No schedules found for this tour.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {managingTour.schedules.map((schedule: any) => {
                        const isCancelled = schedule.status === "cancelled";
                        const isCompleted = schedule.status === "completed";
                        const isUpcoming = schedule.status === "upcoming";
                        
                        return (
                          <div key={schedule._id} className={`p-4 rounded-2xl border ${isCancelled ? 'border-red-100 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E293B]'} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Dates</p>
                                <p className={`text-sm font-semibold ${isCancelled ? 'text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                                  {new Date(schedule.startDate).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {schedule.startTime} - {schedule.endTime}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Type</p>
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${schedule.scheduleType === 'private' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'}`}>
                                  {schedule.scheduleType || 'Public'}
                                </span>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Status</p>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isCancelled ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : isCompleted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'}`}>
                                  {isCancelled ? <XCircle size={10} /> : <CheckCircle size={10} />}
                                  {schedule.status || 'upcoming'}
                                </span>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Guide</p>
                                <p className={`text-sm font-semibold truncate ${isCancelled ? 'text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                                  {schedule.guide?.name || "Unassigned"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-white/5 pt-3 md:pt-0 md:border-none">
                              {!isCancelled && !isCompleted && (
                                <button
                                  onClick={() => handleCancelSchedule(schedule._id)}
                                  disabled={isCancellingSchedule === schedule._id}
                                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  {isCancellingSchedule === schedule._id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-white/5 flex justify-end">
                  <button 
                    onClick={() => setIsScheduleListModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </>,
        document.body
      )}
    </div>
  );
}
