"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, Plus, Loader2, Image as ImageIcon, Map, Pencil, Trash2 } from "lucide-react";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";

interface Destination {
  _id: string;
  name: { en: string; am: string };
  region: string;
  description: { en: string; am: string };
  images?: string[];
  isFeatured?: boolean;
  tourCount?: number;
}

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteConfirmDest, setDeleteConfirmDest] = useState<{id: string, name: string} | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDest, setEditingDest] = useState<Destination | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    nameEn: "", nameAm: "", descEn: "", descAm: "", woreda: "", imageUrl: "", category: "nature"
  });

  const openAddModal = () => {
    setEditingDest(null);
    setFormData({ nameEn: "", nameAm: "", descEn: "", descAm: "", woreda: "", imageUrl: "", category: "nature" });
    setIsModalOpen(true);
  };

  const openEditModal = (dest: Destination) => {
    setEditingDest(dest);
    setFormData({
      nameEn: dest.name?.en || "",
      nameAm: dest.name?.am || "",
      descEn: dest.description?.en || "",
      descAm: dest.description?.am || "",
      woreda: dest.region || "",
      imageUrl: dest.images?.[0] || "",
      category: "nature"
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        name: { en: formData.nameEn, am: formData.nameAm },
        description: { en: formData.descEn, am: formData.descAm },
        location: { woreda: formData.woreda, region: "Kambata Zone" },
        images: formData.imageUrl ? [formData.imageUrl] : [],
        category: [formData.category],
        isPublished: true
      };

      if (editingDest) {
        await apiClient.put(`/destinations/${editingDest._id}`, payload);
        toast.success("Destination updated");
      } else {
        await apiClient.post("/destinations", payload);
        toast.success("Destination created");
      }
      setIsModalOpen(false);
      fetchDestinations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save destination");
    } finally {
      setIsSaving(false);
    }
  };

  const fetchDestinations = async () => {
    try {
      const { data } = await apiClient.get("/destinations");
      setDestinations(data.data || []);
    } catch (error) {
      toast.error("Failed to load destinations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchDestinations();
  }, []);

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirmDest({ id, name });
  };

  const executeDelete = async () => {
    if (!deleteConfirmDest) return;
    
    try {
      setIsDeleting(deleteConfirmDest.id);
      await apiClient.delete(`/destinations/${deleteConfirmDest.id}`);
      toast.success("Destination deleted successfully");
      fetchDestinations();
      setDeleteConfirmDest(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete destination");
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredDestinations = destinations.filter(
    (d) =>
      d.name.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            Destinations Hub
            <span className="bg-orange-50 dark:bg-orange-500/10 text-[#FF8C00] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-orange-100 dark:border-orange-500/20">
              {destinations.length} Places
            </span>
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
            Manage the geographical regions and core tourist destinations available for guides to create tours in.
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
              placeholder="Search places..."
              className="w-full bg-white dark:bg-[#0A0F1C] border border-gray-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-gray-300 dark:focus:border-white/20 transition-all shadow-sm"
            />
          </div>
          <button onClick={openAddModal} className="flex items-center justify-center gap-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm flex-shrink-0">
            <Plus size={16} strokeWidth={2.5} /> Add Destination
          </button>
        </div>
      </div>

      {/* Destinations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDestinations.length === 0 ? (
          <div className="col-span-full border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl p-12 text-center flex flex-col items-center bg-gray-50/50 dark:bg-[#0F172A]/50">
            <div className="w-12 h-12 bg-white dark:bg-[#0A0F1C] border border-gray-200 dark:border-white/10 shadow-sm rounded-lg flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500">
              <Map size={24} />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">No destinations found</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Try adjusting your search or add a new place.</p>
          </div>
        ) : (
          filteredDestinations.map((dest) => (
            <div key={dest._id} className="bg-white dark:bg-[#0A0F1C] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden group shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-white/20 transition-all flex flex-col">
              
              {/* Image Area */}
              <div className="h-48 bg-gray-100 dark:bg-[#0F172A] relative overflow-hidden border-b border-gray-200 dark:border-white/10">
                {dest.images && dest.images.length > 0 ? (
                  <img src={dest.images[0]} alt={dest.name?.en} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                    <ImageIcon size={24} className="mb-2" />
                    <span className="text-[10px] font-semibold tracking-wider uppercase">No Image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  {dest.isFeatured && (
                    <span className="bg-[#FF8C00] text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">
                      Featured
                    </span>
                  )}
                  <span className="bg-white/90 dark:bg-black/80 backdrop-blur-sm text-gray-900 dark:text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-sm border border-gray-200 dark:border-white/10">
                    <MapPin size={10} /> {dest.region}
                  </span>
                </div>

                {/* Title overlay */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="text-lg font-bold tracking-tight leading-tight drop-shadow-md">
                    {dest.name.en}
                  </h3>
                  <p className="text-xs font-medium text-white/80 line-clamp-1">{dest.name.am}</p>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-5 flex-1 flex flex-col">
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 flex-1 mb-4">
                  {dest.description.en}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10 mt-auto">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <span className="text-gray-500 font-medium">Tours:</span> 
                    <span className="bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-md text-xs">{dest.tourCount || 0}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditModal(dest)} className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-500/20" title="Edit Destination">
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(dest._id, dest.name?.en || "Unknown")}
                      disabled={isDeleting === dest._id}
                      className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-500/20 disabled:opacity-50"
                      title="Delete Destination"
                    >
                      {isDeleting === dest._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[100px] overflow-y-auto custom-scrollbar">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-3xl w-full max-w-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative z-10 overflow-hidden border border-white dark:border-white/10 flex flex-col mb-10"
              >
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/20 rounded-full blur-[80px] pointer-events-none" />
                <div className="p-8 border-b border-gray-100 dark:border-white/5 relative z-10">
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                    {editingDest ? "Edit Destination" : "Add New Destination"}
                  </h2>
                </div>
                
                <form onSubmit={handleSave} className="p-4 md:p-8 space-y-4 md:space-y-6 relative z-10">
                  <div className="grid grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Name (English) *</label>
                      <input required type="text" value={formData.nameEn} onChange={e => setFormData({...formData, nameEn: e.target.value})} className="w-full bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Name (Amharic) *</label>
                      <input required type="text" value={formData.nameAm} onChange={e => setFormData({...formData, nameAm: e.target.value})} className="w-full bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Image URL</label>
                    <input type="url" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://example.com/image.jpg" className="w-full bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Woreda / City *</label>
                      <input required type="text" value={formData.woreda} onChange={e => setFormData({...formData, woreda: e.target.value})} className="w-full bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Category</label>
                      <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm appearance-none">
                        <option value="nature" className="bg-white dark:bg-slate-900">Nature</option>
                        <option value="culture" className="bg-white dark:bg-slate-900">Culture</option>
                        <option value="historical" className="bg-white dark:bg-slate-900">Historical</option>
                        <option value="adventure" className="bg-white dark:bg-slate-900">Adventure</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Description (English) *</label>
                    <textarea required rows={3} value={formData.descEn} onChange={e => setFormData({...formData, descEn: e.target.value})} className="w-full bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm resize-none custom-scrollbar" />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Description (Amharic) *</label>
                    <textarea required rows={3} value={formData.descAm} onChange={e => setFormData({...formData, descAm: e.target.value})} className="w-full bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm resize-none custom-scrollbar" />
                  </div>

                  <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex justify-end gap-4 mt-6">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-4 rounded-xl font-bold text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSaving} className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-8 py-4 rounded-xl font-black text-sm hover:scale-[1.02] hover:shadow-[0_10px_25px_-5px_rgba(249,115,22,0.6)] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none">
                      {isSaving && <Loader2 size={18} className="animate-spin" />}
                      {editingDest ? "Save Changes" : "Create New"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      , document.body)}

      {/* Modern Delete Confirmation Modal */}
      {deleteConfirmDest && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmDest(null)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#0F172A] w-full max-w-md rounded-[2rem] shadow-2xl relative z-10 overflow-hidden border border-gray-100 dark:border-white/10"
          >
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                <Trash2 size={32} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Delete Destination?</h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Are you sure you want to permanently delete <span className="text-gray-900 dark:text-white font-bold">"{deleteConfirmDest.name}"</span>? This action cannot be undone and will remove it from the system entirely.
              </p>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 flex gap-3">
              <button 
                onClick={() => setDeleteConfirmDest(null)}
                className="flex-1 py-4 rounded-xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                disabled={isDeleting === deleteConfirmDest.id}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-4 rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                {isDeleting === deleteConfirmDest.id ? <Loader2 size={18} className="animate-spin" /> : "Yes, Delete It"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
