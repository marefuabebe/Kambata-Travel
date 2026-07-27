"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, Plus, Edit2, Loader2, MapPin, Building, Star, CheckCircle2, XCircle } from "lucide-react";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";

const API_BASE = apiClient.defaults.baseURL?.replace('/admin', '') || "http://localhost:5000/api";

export default function HotelsPage() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const [formData, setFormData] = useState({
    name: "",
    location: "Durame",
    description: "",
    contactNumber: "",
    amenities: "", // comma separated
    imageUrl: "",
    status: "active",
  });

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`${API_BASE}/hotels`);
      setHotels(data.data || []);
    } catch (err) {
      toast.error("Failed to load hotels");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const openAddModal = () => {
    setEditingHotel(null);
    setFormData({
      name: "",
      location: "Durame",
      description: "",
      contactNumber: "",
      amenities: "",
      imageUrl: "",
      status: "active",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (hotel: any) => {
    setEditingHotel(hotel);
    setFormData({
      name: hotel.name,
      location: hotel.location,
      description: hotel.description,
      contactNumber: hotel.contactNumber || "",
      amenities: hotel.amenities?.join(", ") || "",
      imageUrl: hotel.images?.[0] || "",
      status: hotel.status || "active",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location || !formData.description) {
      toast.error("Please fill in required fields: Name, Location, Description");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        location: formData.location,
        description: formData.description,
        contactNumber: formData.contactNumber,
        amenities: formData.amenities.split(",").map((a) => a.trim()).filter((a) => a),
        images: formData.imageUrl ? [formData.imageUrl] : [],
        status: formData.status,
      };

      if (editingHotel) {
        await apiClient.put(`${API_BASE}/hotels/${editingHotel._id}`, payload);
        toast.success("Hotel updated successfully");
      } else {
        await apiClient.post(`${API_BASE}/hotels`, payload);
        toast.success("Hotel created successfully");
      }
      setIsModalOpen(false);
      fetchHotels();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save hotel");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredHotels = hotels.filter((h) => 
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            Manage Hotels
            <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-500/20">
              {hotels.length} Properties
            </span>
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
            Create and update hotel profiles across locations.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 dark:group-focus-within:text-white transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search hotels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          
          <button
            onClick={openAddModal}
            className="shrink-0 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-800 dark:hover:bg-gray-100 flex items-center gap-2 transition-colors"
          >
            <Plus size={16} /> Add Hotel
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredHotels.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-[#0F172A] border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
            <Building size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No hotels found</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">Get started by adding your first accommodation partner.</p>
            <button onClick={openAddModal} className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm">
              Create First Hotel
            </button>
          </div>
        ) : (
          filteredHotels.map((hotel) => (
            <div key={hotel._id} className="bg-white dark:bg-[#0F172A] rounded-[1.5rem] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row group">
              <div className="w-full sm:w-48 h-48 sm:h-auto bg-gray-100 dark:bg-white/5 relative shrink-0">
                {hotel.images && hotel.images[0] ? (
                  <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                    <Building size={32} />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm backdrop-blur-md ${hotel.status === 'active' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                    {hotel.status}
                  </span>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2 gap-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{hotel.name}</h3>
                  <button onClick={() => openEditModal(hotel)} className="shrink-0 w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-500/20">
                    <Edit2 size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">
                  <MapPin size={14} className="text-blue-500" />
                  {hotel.location}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed flex-1">
                  {hotel.description}
                </p>
                
                <div className="flex flex-wrap gap-1.5 mt-auto pt-4 border-t border-gray-100 dark:border-white/5">
                  {hotel.amenities?.slice(0, 3).map((amenity: string, idx: number) => (
                    <span key={idx} className="bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-[10px] font-bold px-2 py-1 rounded-md">
                      {amenity}
                    </span>
                  ))}
                  {hotel.amenities?.length > 3 && (
                    <span className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-[10px] font-bold px-2 py-1 rounded-md">
                      +{hotel.amenities.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Enterprise Modal (Portaled) */}
      {isModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-8 md:p-12 overflow-y-auto custom-scrollbar">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-3xl rounded-[2rem] shadow-2xl relative z-10 flex flex-col my-auto border border-gray-100 dark:border-white/10 overflow-hidden max-h-[90vh]">
            
            <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 shrink-0 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {editingHotel ? "Edit Hotel Profile" : "Add New Hotel"}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Configure hotel details and amenities.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200/50 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                <XCircle size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Hotel Name *</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" placeholder="e.g. Kambata Grand Hotel" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Location *</label>
                  <select required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm appearance-none">
                    <option value="Durame">Durame</option>
                    <option value="Shinshcho">Shinshcho</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Description *</label>
                <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm resize-y min-h-[100px]" placeholder="Describe the hotel and its vibe..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Contact Number</label>
                  <input type="text" value={formData.contactNumber} onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" placeholder="+251 9..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm appearance-none">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Amenities</label>
                <input type="text" value={formData.amenities} onChange={(e) => setFormData({ ...formData, amenities: e.target.value })} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" placeholder="WiFi, Pool, Restaurant (comma separated)" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Cover Image URL</label>
                <input type="text" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" placeholder="https://example.com/image.jpg" />
              </div>
              
              <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3 mt-4 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving && <Loader2 className="animate-spin" size={16} />}
                  Save Hotel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
