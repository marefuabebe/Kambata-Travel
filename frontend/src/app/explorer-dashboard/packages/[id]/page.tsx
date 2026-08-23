"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Clock, MapPin, Star, Calendar, ArrowRight,
  Map, Shield, Coffee, Bed, Bus, CheckCircle2, Package, Compass
} from "lucide-react";
import { motion } from "framer-motion";
import apiClient from "@/utils/apiClient";
import { PageHeader, LoadingCenter } from "@/components/explorer/ui";
import { tourTitle } from "@/utils/dashboardHelpers";
import RequestCustomDateModal from "@/components/explorer/RequestCustomDateModal";

export default function PackageDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"custom_date" | "private_tour" | "waitlist">("custom_date");
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);

  const openModal = (type: "custom_date" | "private_tour" | "waitlist") => {
    setModalType(type);
    setModalOpen(true);
  };

  useEffect(() => {
    if (!params.id) return;
    Promise.all([
      apiClient.get(`/packages/${params.id}?t=${Date.now()}`),
      apiClient.get(`/packages/${params.id}/schedules?t=${Date.now()}`)
    ]).then(([pkgRes, schedRes]) => {
      const p = pkgRes.data.data;
      p.schedules = schedRes.data.data || [];
      setPkg(p);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (pkg && pkg.schedules && !selectedScheduleId) {
      const activeSchedules = pkg.schedules || [];
      const availableSchedules = activeSchedules.filter((s: any) => (s.remainingSlots !== undefined ? s.remainingSlots : s.availableSeats) > 0);
      if (availableSchedules.length > 0) {
        availableSchedules.sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        setSelectedScheduleId(availableSchedules[0]._id);
      }
    }
  }, [pkg, selectedScheduleId]);

  if (loading) return <LoadingCenter />;
  if (!pkg) return <div className="p-12 text-center">Package not found</div>;

  const title = pkg.name?.en || pkg.title || `${tourTitle(pkg.tour)} + ${pkg.hotel?.name || "Hotel"} Package`;
  const price = pkg.basePrice || pkg.price || 12500;
  const dest = pkg.destination || typeof pkg.tour?.destination?.name === "string" ? pkg.tour.destination.name : "Ethiopia";

  const canInstantBook = true; // Packages always allow instant booking if schedules exist
  const canRequestDate = true; // Packages always allow requesting dates

  const activeSchedules = pkg.schedules || [];
  
  let heroState: "AVAILABLE" | "NO_SCHEDULE" | "SOLD_OUT" | "REQUEST_ONLY" = "NO_SCHEDULE";
  let earliestAvailableSchedule: any = null;

  if (canInstantBook && activeSchedules.length > 0) {
    const availableSchedules = activeSchedules.filter((s: any) => (s.remainingSlots !== undefined ? s.remainingSlots : s.availableSeats) > 0);
    if (availableSchedules.length > 0) {
      heroState = "AVAILABLE";
      availableSchedules.sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      earliestAvailableSchedule = availableSchedules[0];
    } else {
      heroState = "SOLD_OUT";
    }
  } else {
    heroState = "NO_SCHEDULE";
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto pb-12 space-y-8"
    >
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold text-sm transition-colors"
      >
        <ArrowLeft size={16} /> Back to Packages
      </button>

      {/* ── Hero Gallery ── */}
      <div className="relative min-h-[500px] md:h-[500px] rounded-3xl md:rounded-[3rem] overflow-hidden group shadow-2xl border border-amber-500/20">
        <img loading="lazy" 
          src={pkg.tour?.images?.[0] || pkg.hotel?.images?.[0] || "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&q=80&w=1200&h=600"} 
          alt={title} 
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 md:via-black/20 to-transparent" />
        
        <div className="relative h-full w-full p-6 md:p-10 flex flex-col justify-end min-h-[500px] md:min-h-full pt-32">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 md:gap-6">
            <div className="max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1.5 bg-amber-500/20 backdrop-blur-md border border-amber-500/30 text-amber-300 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Package size={12} /> Curated Package
              </span>
              <span className="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <MapPin size={12} /> {dest}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 drop-shadow-lg">{title}</h1>
            <p className="text-white/80 font-medium text-sm md:text-base line-clamp-2 md:line-clamp-none">{typeof pkg.description === 'string' ? pkg.description : pkg.description?.en || "The ultimate combination of a curated tour experience with premium hotel accommodations."}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[2rem] text-white shrink-0 shadow-2xl w-full lg:min-w-[320px] lg:max-w-sm pointer-events-auto">
            
            {heroState === "AVAILABLE" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black mb-4 flex items-center gap-2"><Calendar size={20} className="text-emerald-400"/> Join a Scheduled Package</h3>
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                    {activeSchedules.filter((s: any) => (s.remainingSlots !== undefined ? s.remainingSlots : s.availableSeats) > 0).sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map((s: any) => (
                      <button
                        key={s._id}
                        onClick={() => setSelectedScheduleId(s._id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          selectedScheduleId === s._id 
                            ? "bg-emerald-500/20 border-emerald-500/50 ring-2 ring-emerald-500/30" 
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-bold text-white">
                            {new Date(s.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(s.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                          <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            {s.remainingSlots !== undefined ? s.remainingSlots : s.availableSeats} Left
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-300 flex items-center gap-1"><Clock size={12}/> {pkg.duration?.value} {pkg.duration?.unit}</p>
                          <p className="text-sm font-black text-white">ETB {price.toLocaleString()}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Link
                  href={`/checkout-package/${pkg._id}?scheduleId=${selectedScheduleId}`}
                  className={`flex items-center justify-center gap-2 w-full px-8 py-4 rounded-xl font-black text-sm transition-transform shadow-lg ${
                    selectedScheduleId 
                      ? "bg-amber-500 hover:bg-amber-600 text-white hover:-translate-y-0.5 shadow-amber-500/20" 
                      : "bg-gray-500/50 text-gray-300 cursor-not-allowed pointer-events-none"
                  }`}
                >
                  Book Package <ArrowRight size={16} />
                </Link>

                {canRequestDate && (
                  <>
                    <div className="flex items-center gap-4 py-2">
                      <div className="h-px bg-white/10 flex-1"></div>
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">OR</span>
                      <div className="h-px bg-white/10 flex-1"></div>
                    </div>
                    <div>
                      <h3 className="text-lg font-black mb-3 flex items-center gap-2 text-white/90"><Compass size={18} className="text-amber-500"/> Request a Private Package</h3>
                      <button
                        onClick={() => openModal("custom_date")}
                        className="flex items-center justify-center gap-2 w-full px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-xs transition-colors border border-white/20"
                      >
                        Request Custom Date
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {heroState === "NO_SCHEDULE" && canRequestDate && (
              <div className="space-y-6">
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Compass size={28} className="text-amber-500" />
                  </div>
                  <h3 className="text-xl font-black mb-2">Request a Private Package</h3>
                  <p className="text-sm text-gray-300 font-medium">No public schedules are currently available. Choose your own date and travel privately!</p>
                </div>
                <button
                  onClick={() => openModal("custom_date")}
                  className="flex items-center justify-center gap-2 w-full px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-sm transition-transform hover:-translate-y-0.5 shadow-lg shadow-amber-500/20"
                >
                  Request Custom Date
                </button>
              </div>
            )}

            {heroState === "SOLD_OUT" && canRequestDate && (
              <div className="space-y-6">
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={28} className="text-red-400" />
                  </div>
                  <h3 className="text-xl font-black mb-2">Fully Booked</h3>
                  <p className="text-sm text-gray-300 font-medium">All public schedules are currently sold out.</p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => openModal("waitlist")}
                    className="flex items-center justify-center gap-2 w-full px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-sm transition-transform hover:-translate-y-0.5 border border-white/20"
                  >
                    Join Waitlist
                  </button>
                  <div className="flex items-center gap-4 py-2">
                    <div className="h-px bg-white/10 flex-1"></div>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">OR</span>
                    <div className="h-px bg-white/10 flex-1"></div>
                  </div>
                  <h3 className="text-lg font-black mb-3 flex items-center gap-2 text-white/90 justify-center"><Compass size={18} className="text-amber-500"/> Request a Private Package</h3>
                  <button
                    onClick={() => openModal("private_tour")}
                    className="flex items-center justify-center gap-2 w-full px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-sm transition-transform hover:-translate-y-0.5 shadow-lg shadow-amber-500/20"
                  >
                    Request Custom Date
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10 mt-12">
        <div className="lg:col-span-8 space-y-10">
          
          <section>
             <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">What's Included in this Package</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="flex items-start gap-4 p-6 bg-white dark:bg-[#0A0F1C] backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                   <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-xl shrink-0"><Map size={24} /></div>
                   <div>
                     <h4 className="font-black text-gray-900 dark:text-white mb-1">Guided Tour</h4>
                     <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{tourTitle(pkg.tour) || "Comprehensive sightseeing with a certified local guide."}</p>
                   </div>
                 </div>
                 <div className="flex items-start gap-4 p-6 bg-white dark:bg-[#0A0F1C] backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                   <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-xl shrink-0"><Bed size={24} /></div>
                   <div>
                     <h4 className="font-black text-gray-900 dark:text-white mb-1">Premium Hotel</h4>
                     <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{pkg.hotel?.name || "Comfortable accommodation with breakfast included."}</p>
                   </div>
                 </div>
             </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Package Reviews</h2>
            <div className="bg-white dark:bg-[#0A0F1C] backdrop-blur-xl p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white font-black text-lg">M</div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Maria G.</h4>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star size={12} className="fill-amber-400" /><Star size={12} className="fill-amber-400" /><Star size={12} className="fill-amber-400" /><Star size={12} className="fill-amber-400" /><Star size={12} className="fill-amber-400" />
                  </div>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">"Getting the tour and hotel together in this package was so convenient. The guide was fantastic and the hotel was right in the center of the city."</p>
            </div>
          </section>

        </div>

        <div className="lg:col-span-4 space-y-8">
          
          <div className="bg-white dark:bg-[#0A0F1C] backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm sticky top-8">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">Package Schedules</h3>
            
            {(pkg.schedules?.length > 0) ? (
              <div className="space-y-4">
                {pkg.schedules.map((s: any, idx: number) => {
                  const startDate = new Date(s.startDate);
                  const isAvailable = s.remainingSlots > 0;
                  
                  return (
                    <div key={s._id || idx} className={`group border border-gray-100 dark:border-white/10 rounded-2xl p-4 transition-colors ${isAvailable ? 'hover:border-amber-500 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Calendar size={14} className={isAvailable ? "text-amber-500" : "text-gray-400"} /> 
                          {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${isAvailable ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
                          {isAvailable ? 'Available' : 'Sold Out'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{s.remainingSlots || 0} Spots left</span>
                        {isAvailable && (
                          <Link href={`/checkout-package/${pkg._id}?scheduleId=${s._id}`} className="text-[#FF8C00] font-black text-xs uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                            Select <ArrowRight size={14} />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">No active schedules right now.</p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5">
              <button 
                onClick={() => openModal("custom_date")}
                className="w-full py-4 bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Request Custom Date
              </button>
            </div>
          </div>

        </div>
      </div>

      <RequestCustomDateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        itemId={pkg._id}
        itemType="packageId"
        title={title}
        requestType={modalType}
      />
    </motion.div>
  );
}
