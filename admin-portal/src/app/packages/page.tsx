"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Search, Plus, Loader2, MapPin, Pencil, Trash2, Package as PackageIcon, Tent, DollarSign, Clock, Calendar } from "lucide-react";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";
import { confirmAction } from "@/utils/confirmAlert";
import PackageScheduleDashboard from "@/components/admin/PackageScheduleDashboard";

const API_BASE = apiClient.defaults.baseURL?.replace('/admin', '') || "http://localhost:5000/api";

interface Tour {
  _id: string;
  title: { en: string; am: string } | string;
  price?: number;
}

interface RoomType {
  _id: string;
  name: string;
  pricePerNight?: number;
}

interface Hotel {
  _id: string;
  name: string;
  roomTypes?: RoomType[];
}

interface TravelPackage {
  _id: string;
  name: { en: string; am: string };
  tour: Tour;
  hotel: Hotel;
  roomTypeId?: string;
  basePrice: number;
  duration: { value: number; unit: string };
  status: string;
  images?: string[];
}

export default function ManagePackagesPage() {
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<TravelPackage | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Dashboard State
  const [isScheduleDashboardOpen, setIsScheduleDashboardOpen] = useState(false);
  const [managingPackage, setManagingPackage] = useState<TravelPackage | null>(null);

  const [tours, setTours] = useState<Tour[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);

  const [formData, setFormData] = useState({
    nameEn: "", nameAm: "", descEn: "", descAm: "", 
    tourId: "", hotelId: "", roomTypeId: "", basePrice: 0, 
    durationValue: 1, durationUnit: "days", status: "active", imageUri: ""
  });

  const calculateAutoPrice = (tId: string, hId: string, rId: string, dVal: number, dUnit: string) => {
    const selectedTour = tours.find(t => t._id === tId);
    const selectedHotel = hotels.find(h => h._id === hId);
    const selectedRoom = selectedHotel?.roomTypes?.find(r => r._id === rId);

    const tourPrice = selectedTour?.price || 0;
    const roomPrice = selectedRoom?.pricePerNight || 0;
    
    let nights = dVal;
    if (dUnit === "weeks") nights = dVal * 7;
    if (dUnit === "months") nights = dVal * 30;
    if (dUnit === "hours") nights = 1;

    return tourPrice + (roomPrice * nights);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const fetchData = async () => {
    try {
      const [pkgsRes, toursRes, hotelsRes] = await Promise.all([
        apiClient.get(`${API_BASE}/packages`),
        apiClient.get(`${API_BASE}/tours`),
        apiClient.get(`${API_BASE}/hotels`)
      ]);
      setPackages(pkgsRes.data.data || []);
      setTours(toursRes.data.data || []);
      setHotels(hotelsRes.data.data || []);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingPackage(null);
    setFormData({
      nameEn: "", nameAm: "", descEn: "", descAm: "", 
      tourId: tours[0]?._id || "", hotelId: hotels[0]?._id || "", 
      roomTypeId: hotels[0]?.roomTypes?.[0]?._id || "",
      basePrice: 0, durationValue: 1, durationUnit: "days", status: "active", imageUri: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: TravelPackage) => {
    setEditingPackage(pkg);
    setFormData({
      nameEn: pkg.name?.en || "",
      nameAm: pkg.name?.am || "",
      descEn: "See package description", 
      descAm: "", 
      tourId: pkg.tour?._id || "",
      hotelId: pkg.hotel?._id || "",
      roomTypeId: pkg.roomTypeId || "",
      basePrice: pkg.basePrice || 0,
      durationValue: pkg.duration?.value || 1,
      durationUnit: pkg.duration?.unit || "days",
      status: pkg.status || "active",
      imageUri: pkg.images?.[0] || ""
    });
    setIsModalOpen(true);
  };

  const openScheduleDashboard = (pkg: TravelPackage) => {
    setManagingPackage(pkg);
    setIsScheduleDashboardOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        name: { en: formData.nameEn, am: formData.nameAm },
        description: { en: formData.descEn, am: formData.descAm },
        tour: formData.tourId,
        hotel: formData.hotelId,
        roomTypeId: formData.roomTypeId,
        basePrice: formData.basePrice,
        duration: { value: formData.durationValue, unit: formData.durationUnit },
        status: formData.status,
        images: formData.imageUri ? [formData.imageUri] : []
      };

      if (editingPackage) {
        await apiClient.put(`${API_BASE}/packages/${editingPackage._id}`, payload);
        toast.success("Package updated successfully");
      } else {
        await apiClient.post(`${API_BASE}/packages`, payload);
        toast.success("Package created successfully");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save package");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = await confirmAction("Delete Package?", `Are you sure you want to completely delete the travel package "${name}"?`);
    if (!isConfirmed) return;
    
    try {
      setIsDeleting(id);
      await apiClient.delete(`${API_BASE}/packages/${id}`);
      toast.success("Package deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete package");
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredPackages = packages.filter((p) => {
    const nameEn = p.name?.en || "";
    return nameEn.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-[#FF8C00]" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            Travel Packages
            <span className="bg-orange-50 dark:bg-orange-500/10 text-[#FF8C00] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-orange-100 dark:border-orange-500/20">
              {packages.length} Active
            </span>
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
            Create and manage Travel Packages by bundling Tours with Accommodations.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 dark:group-focus-within:text-white transition-colors" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search packages..."
              className="w-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-gray-300 dark:focus:border-white/20 transition-all shadow-sm"
            />
          </div>
          <button onClick={openAddModal} className="flex items-center justify-center gap-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm flex-shrink-0">
            <Plus size={16} strokeWidth={2.5} /> Create Package
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filteredPackages.length === 0 ? (
          <div className="col-span-full border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl p-12 text-center flex flex-col items-center bg-gray-50/50 dark:bg-[#0F172A]/50">
            <div className="w-12 h-12 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 shadow-sm rounded-lg flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500">
              <PackageIcon size={24} />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">No packages found</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Try adjusting your search criteria.</p>
          </div>
        ) : (
          filteredPackages.map((pkg) => (
            <div key={pkg._id} className="bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-white/20 transition-all p-5 flex flex-col group">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight leading-tight mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{pkg.name?.en}</h3>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 flex flex-col gap-1 mt-2">
                    <span className="flex items-center gap-1.5"><Tent size={12} /> {(pkg.tour?.title as any)?.en || pkg.tour?.title}</span>
                    <span className="flex items-center gap-1.5"><MapPin size={12} /> {pkg.hotel?.name}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider flex-shrink-0 ${pkg.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20'}`}>
                  {pkg.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-auto py-3 border-t border-b border-gray-100 dark:border-white/5 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400">
                    <Clock size={12} />
                  </div>
                  <div>
                     <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</p>
                     <p className="text-xs font-bold text-gray-900 dark:text-white capitalize">{pkg.duration?.value} {pkg.duration?.unit}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400">
                    <DollarSign size={12} />
                  </div>
                  <div>
                     <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Base Price</p>
                     <p className="text-xs font-bold text-[#FF8C00]">${pkg.basePrice}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button onClick={() => openScheduleDashboard(pkg)} className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-[#FF8C00] hover:text-white hover:bg-[#FF8C00] transition-colors border border-transparent hover:border-orange-500/20" title="Manage Schedules">
                  <Calendar size={14} />
                </button>
                <button onClick={() => openEditModal(pkg)} className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-500/20" title="Edit Package">
                  <Pencil size={14} />
                </button>
                <button 
                  onClick={() => handleDelete(pkg._id, pkg.name?.en)} 
                  disabled={isDeleting === pkg._id} 
                  className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-500/20 disabled:opacity-50"
                  title="Delete Package"
                >
                  {isDeleting === pkg._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-8 md:p-12 overflow-y-auto custom-scrollbar">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-5xl rounded-[2rem] shadow-2xl relative z-10 flex flex-col my-auto border border-gray-100 dark:border-white/10 overflow-hidden max-h-[90vh]">
            <div className="px-10 py-8 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 shrink-0">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{editingPackage ? "Edit Travel Package" : "Create Travel Package"}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Configure package details, bundling tours and accommodations.</p>
            </div>
            
            <form onSubmit={handleSave} className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1 min-h-0">
              {/* Form Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">Package Name (En) *</label>
                  <input required value={formData.nameEn} onChange={e => setFormData({...formData, nameEn: e.target.value})} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-5 py-3.5 text-base font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" placeholder="e.g. Historic North Tour Package" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">Package Name (Am) *</label>
                  <input required value={formData.nameAm} onChange={e => setFormData({...formData, nameAm: e.target.value})} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-5 py-3.5 text-base font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" placeholder="ለምሳሌ፡ የታሪካዊው ሰሜን ጉብኝት ጥቅል" />
                </div>
              </div>

              {/* Form Row Image */}
              <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">Image URI</label>
                  <input value={formData.imageUri} onChange={e => setFormData({...formData, imageUri: e.target.value})} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-5 py-3.5 text-base font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" placeholder="https://res.cloudinary.com/..." />
              </div>

              {/* Form Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">Include Tour *</label>
                  <select required value={formData.tourId} onChange={e => {
                    const newTourId = e.target.value;
                    const autoPrice = calculateAutoPrice(newTourId, formData.hotelId, formData.roomTypeId, formData.durationValue, formData.durationUnit);
                    setFormData({...formData, tourId: newTourId, basePrice: autoPrice});
                  }} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-5 py-3.5 text-base font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm appearance-none">
                    <option value="" disabled>Select Tour to bundle</option>
                    {tours.map(t => <option key={t._id} value={t._id}>{typeof t.title === 'string' ? t.title : (t.title?.en || "Unnamed")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">Include Hotel *</label>
                  <select required value={formData.hotelId} onChange={e => {
                    const newHotelId = e.target.value;
                    const hotel = hotels.find(h => h._id === newHotelId);
                    const newRoomId = hotel?.roomTypes?.[0]?._id || "";
                    const autoPrice = calculateAutoPrice(formData.tourId, newHotelId, newRoomId, formData.durationValue, formData.durationUnit);
                    setFormData({...formData, hotelId: newHotelId, roomTypeId: newRoomId, basePrice: autoPrice});
                  }} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-5 py-3.5 text-base font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm appearance-none">
                    <option value="" disabled>Select Hotel</option>
                    {hotels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">Room Type *</label>
                  <select required value={formData.roomTypeId} onChange={e => {
                    const newRoomId = e.target.value;
                    const autoPrice = calculateAutoPrice(formData.tourId, formData.hotelId, newRoomId, formData.durationValue, formData.durationUnit);
                    setFormData({...formData, roomTypeId: newRoomId, basePrice: autoPrice});
                  }} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-5 py-3.5 text-base font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm appearance-none">
                    <option value="" disabled>Select Room Type</option>
                    {hotels.find(h => h._id === formData.hotelId)?.roomTypes?.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Form Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">Base Price ($) *</label>
                  <input required type="number" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: Number(e.target.value)})} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-5 py-3.5 text-base font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" placeholder="e.g. 1500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">Duration Value *</label>
                  <input required type="number" value={formData.durationValue} onChange={e => {
                    const newDuration = Number(e.target.value);
                    const autoPrice = calculateAutoPrice(formData.tourId, formData.hotelId, formData.roomTypeId, newDuration, formData.durationUnit);
                    setFormData({...formData, durationValue: newDuration, basePrice: autoPrice});
                  }} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-5 py-3.5 text-base font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" placeholder="e.g. 7" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">Unit</label>
                    <select value={formData.durationUnit} onChange={e => {
                      const newUnit = e.target.value;
                      const autoPrice = calculateAutoPrice(formData.tourId, formData.hotelId, formData.roomTypeId, formData.durationValue, newUnit);
                      setFormData({...formData, durationUnit: newUnit, basePrice: autoPrice});
                    }} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-5 py-3.5 text-base font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm appearance-none">
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-5 py-3.5 text-base font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm appearance-none">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Row 4 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">Description (En) *</label>
                    <textarea required value={formData.descEn} onChange={e => setFormData({...formData, descEn: e.target.value})} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-5 py-4 text-base font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm resize-y min-h-[120px]" placeholder="Detailed English description..." rows={4}></textarea>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">Description (Am) *</label>
                    <textarea required value={formData.descAm} onChange={e => setFormData({...formData, descAm: e.target.value})} className="w-full bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl px-5 py-4 text-base font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm resize-y min-h-[120px]" placeholder="የአማርኛ ማብራሪያ..." rows={4}></textarea>
                </div>
              </div>

              <div className="pt-8 mt-4 flex justify-end gap-4 border-t border-gray-100 dark:border-white/5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3.5 rounded-xl font-bold text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-3.5 rounded-xl font-bold text-base hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm disabled:opacity-50 min-w-[160px]">
                  {isSaving ? <Loader2 size={20} className="animate-spin" /> : "Save Package"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {isScheduleDashboardOpen && managingPackage && mounted && createPortal(
        <PackageScheduleDashboard 
          packageData={managingPackage} 
          onClose={() => setIsScheduleDashboardOpen(false)} 
        />,
        document.body
      )}
    </div>
  );
}
