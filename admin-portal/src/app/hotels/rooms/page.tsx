"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Edit2, Loader2, BedDouble, Users, XCircle, ChevronDown, CheckCircle2, Building } from "lucide-react";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";

const API_BASE = apiClient.defaults.baseURL?.replace('/admin', '') || "http://localhost:5000/api";

export default function RoomTypesPage() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    pricePerNight: 0,
    capacity: 2,
    totalInventory: 10,
    imageUrl: "",
  });

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`${API_BASE}/hotels`);
      setHotels(data.data || []);
      if (data.data?.length > 0 && !selectedHotelId) {
        setSelectedHotelId(data.data[0]._id);
      }
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

  const selectedHotel = hotels.find((h) => h._id === selectedHotelId);
  const roomTypes = selectedHotel?.roomTypes || [];

  const openAddModal = () => {
    if (!selectedHotelId) {
      toast.error("Please select a hotel first");
      return;
    }
    setEditingRoom(null);
    setFormData({
      name: "",
      description: "",
      pricePerNight: 0,
      capacity: 2,
      totalInventory: 10,
      imageUrl: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (room: any) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      description: room.description || "",
      pricePerNight: room.pricePerNight,
      capacity: room.capacity,
      totalInventory: room.totalInventory,
      imageUrl: room.images?.[0] || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.pricePerNight <= 0 || formData.capacity <= 0 || formData.totalInventory <= 0) {
      toast.error("Please fill in all required fields with valid numbers");
      return;
    }

    setIsSaving(true);
    try {
      const newRoomType = {
        name: formData.name,
        description: formData.description,
        pricePerNight: formData.pricePerNight,
        capacity: formData.capacity,
        totalInventory: formData.totalInventory,
        images: formData.imageUrl ? [formData.imageUrl] : [],
      };

      let updatedRoomTypes = [...roomTypes];

      if (editingRoom) {
        updatedRoomTypes = updatedRoomTypes.map((rt) =>
          rt._id === editingRoom._id ? { ...newRoomType, _id: editingRoom._id } : rt
        );
      } else {
        updatedRoomTypes.push(newRoomType);
      }

      const payload = { roomTypes: updatedRoomTypes };

      await apiClient.put(`${API_BASE}/hotels/${selectedHotelId}`, payload);
      toast.success(editingRoom ? "Room updated successfully" : "Room added successfully");
      setIsModalOpen(false);
      fetchHotels(); // Refresh to get updated data with IDs
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save room type");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            Room Inventory
            {roomTypes.length > 0 && (
              <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                {roomTypes.length} Types
              </span>
            )}
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
            Manage pricing, capacity, and total inventory for hotel room types.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto">
          <div className="relative w-full sm:w-64 group">
            <select
              value={selectedHotelId}
              onChange={(e) => setSelectedHotelId(e.target.value)}
              className="w-full bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none shadow-sm cursor-pointer"
            >
              <option value="" disabled>Select a Hotel...</option>
              {hotels.map((h) => (
                <option key={h._id} value={h._id}>{h.name} - {h.location}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
          
          <button
            onClick={openAddModal}
            disabled={!selectedHotelId}
            className="shrink-0 w-full sm:w-auto bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-800 dark:hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} /> Add Room Type
          </button>
        </div>
      </div>

      {/* States & Grid */}
      {!selectedHotelId ? (
        <div className="bg-white dark:bg-[#0F172A] border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center mt-6">
          <Building className="text-gray-300 dark:text-gray-600 mb-4" size={48} />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Hotel Selected</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">Select a hotel from the dropdown above to view or manage its room types.</p>
        </div>
      ) : roomTypes.length === 0 ? (
        <div className="bg-white dark:bg-[#0F172A] border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center mt-6">
          <BedDouble className="text-gray-300 dark:text-gray-600 mb-4" size={48} />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Room Types Found</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">This hotel doesn't have any room configurations yet.</p>
          <button onClick={openAddModal} className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm">
            Add First Room Type
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {roomTypes.map((room: any) => (
            <div key={room._id} className="bg-white dark:bg-[#0F172A] rounded-[1.5rem] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
              <div className="flex justify-between items-start p-6 pb-4">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
                  <BedDouble size={20} />
                </div>
                <button onClick={() => openEditModal(room)} className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-500/20">
                  <Edit2 size={14} />
                </button>
              </div>
              
              <div className="px-6 flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">{room.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 h-10 leading-relaxed mb-6">
                  {room.description || "No description provided."}
                </p>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-gray-50 dark:bg-white/5 p-3.5 rounded-xl border border-gray-100 dark:border-white/5">
                    <Users size={14} className="text-gray-400 dark:text-gray-500 mb-1.5" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">Capacity</p>
                    <p className="text-sm font-black text-gray-900 dark:text-white">{room.capacity} Guests</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 p-3.5 rounded-xl border border-gray-100 dark:border-white/5">
                    <BedDouble size={14} className="text-gray-400 dark:text-gray-500 mb-1.5" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">Inventory</p>
                    <p className="text-sm font-black text-gray-900 dark:text-white">{room.totalInventory} Rooms</p>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-5 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Price Per Night</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-gray-900 dark:text-white">ETB {room.pricePerNight?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enterprise Modal (Portaled) */}
      {isModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-8 md:p-12 overflow-y-auto custom-scrollbar">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-2xl rounded-[2rem] shadow-2xl relative z-10 flex flex-col my-auto border border-gray-100 dark:border-white/10 overflow-hidden max-h-[90vh]">
            
            <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 shrink-0 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {editingRoom ? "Edit Room Type" : "Add Room Type"}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Configure pricing and inventory for {selectedHotel?.name}.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200/50 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                <XCircle size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Room Name *</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" placeholder="e.g. Presidential Suite" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Description</label>
                <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm resize-y min-h-[100px]" placeholder="Room details, bed sizes, views..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Price Per Night (ETB) *</label>
                  <input required type="number" min="0" value={formData.pricePerNight} onChange={(e) => setFormData({ ...formData, pricePerNight: Number(e.target.value) })} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Guest Capacity *</label>
                  <input required type="number" min="1" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Total Physical Rooms *</label>
                  <input required type="number" min="1" value={formData.totalInventory} onChange={(e) => setFormData({ ...formData, totalInventory: Number(e.target.value) })} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Cover Image URL</label>
                  <input type="text" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" placeholder="https://..." />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3 mt-4 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving && <Loader2 className="animate-spin" size={16} />}
                  Save Room Type
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
