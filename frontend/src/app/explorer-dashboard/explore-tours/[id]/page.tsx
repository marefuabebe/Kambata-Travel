"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Clock, MapPin, Star, Calendar, ArrowRight,
  Map as MapIcon, Shield, Coffee, Bed, Bus, CheckCircle2, ChevronRight, Compass, Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "@/utils/apiClient";
import { PageHeader, LoadingCenter } from "@/components/explorer/ui";
import { tourTitle } from "@/utils/dashboardHelpers";
import RequestCustomDateModal from "@/components/explorer/RequestCustomDateModal";
import dynamic from "next/dynamic";

const ItineraryMap = dynamic(() => import("@/components/shared/ItineraryMap"), { ssr: false });

export default function TourDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [tour, setTour] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
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
      apiClient.get(`/tours/${params.id}?t=${Date.now()}`),
      apiClient.get(`/reviews/tour/${params.id}`).catch(() => ({ data: { reviews: [] } }))
    ])
      .then(([tourRes, reviewsRes]) => {
        setTour(tourRes.data.data);
        setReviews(reviewsRes.data.reviews || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  const bookingType = tour?.bookingType || "both";
  const canInstantBook = bookingType === "instant" || bookingType === "both";
  const canRequestDate = bookingType === "request" || bookingType === "both";

  const activeSchedules = tour?.schedules || [];
  
  let heroState: "AVAILABLE" | "NO_SCHEDULE" | "SOLD_OUT" | "REQUEST_ONLY" = "NO_SCHEDULE";
  let earliestAvailableSchedule: any = null;

  if (canInstantBook && activeSchedules.length > 0) {
    const availableSchedules = activeSchedules.filter((s: any) => s.remainingSlots > 0);
    if (availableSchedules.length > 0) {
      heroState = "AVAILABLE";
      availableSchedules.sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      earliestAvailableSchedule = availableSchedules[0];
    } else if (canRequestDate) {
      heroState = "SOLD_OUT";
    } else {
      heroState = "SOLD_OUT";
    }
  } else if (canRequestDate && !canInstantBook) {
    heroState = "REQUEST_ONLY";
  } else if (!canInstantBook && !canRequestDate) {
    heroState = "NO_SCHEDULE";
  }

  useEffect(() => {
    if (earliestAvailableSchedule && !selectedScheduleId) {
      setSelectedScheduleId(earliestAvailableSchedule._id);
    }
  }, [earliestAvailableSchedule, selectedScheduleId]);

  if (loading) return <LoadingCenter />;
  if (!tour) return <div className="p-12 text-center">Tour not found</div>;

  const dest = typeof tour.destination?.name === "string" ? tour.destination.name : (tour.destination?.name?.en || "Ethiopia");
  const price = tour.price || 4500;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto pb-12 space-y-8"
    >
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold text-sm transition-colors"
      >
        <ArrowLeft size={16} /> Back to Tours
      </button>

      {/* ── Hero Gallery ── */}
      <div className="relative h-[400px] md:h-[500px] rounded-[3rem] overflow-hidden group shadow-2xl">
        <img 
          src={tour.images?.[0] || "https://images.unsplash.com/photo-1549488344-c10ba3ebaa61?auto=format&fit=crop&q=80&w=1200&h=600"} 
          alt={tourTitle(tour)} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute bottom-10 left-10 right-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1.5 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-300 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <MapPin size={12} /> {dest}
              </span>
              <span className="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Clock size={12} /> {tour.duration?.value} {tour.duration?.unit}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 drop-shadow-lg">{tourTitle(tour)}</h1>
            <p className="text-white/80 font-medium text-sm md:text-base line-clamp-2 md:line-clamp-none">{tour.description?.en || tour.description}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[2rem] text-white shrink-0 shadow-2xl min-w-[320px] max-w-sm">
            
            {heroState === "AVAILABLE" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black mb-4 flex items-center gap-2"><Calendar size={20} className="text-emerald-400"/> Join a Scheduled Tour</h3>
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                    {activeSchedules.filter((s: any) => s.remainingSlots > 0).sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map((s: any) => (
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
                            {s.remainingSlots} Left
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-300 flex items-center gap-1"><Clock size={12}/> {tour.duration?.value} {tour.duration?.unit}</p>
                          <p className="text-sm font-black text-white">ETB {price.toLocaleString()}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Link
                  href={`/checkout/${tour._id}?scheduleId=${selectedScheduleId}`}
                  className={`flex items-center justify-center gap-2 w-full px-8 py-4 rounded-xl font-black text-sm transition-transform shadow-lg ${
                    selectedScheduleId 
                      ? "bg-[#FF8C00] hover:bg-[#e67e00] text-white hover:-translate-y-0.5 shadow-[#FF8C00]/20" 
                      : "bg-gray-500/50 text-gray-300 cursor-not-allowed pointer-events-none"
                  }`}
                >
                  Book Now <ArrowRight size={16} />
                </Link>

                {canRequestDate && (
                  <>
                    <div className="flex items-center gap-4 py-2">
                      <div className="h-px bg-white/10 flex-1"></div>
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">OR</span>
                      <div className="h-px bg-white/10 flex-1"></div>
                    </div>
                    <div>
                      <h3 className="text-lg font-black mb-3 flex items-center gap-2 text-white/90"><Compass size={18} className="text-[#FF8C00]"/> Request a Private Tour</h3>
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

            {heroState === "REQUEST_ONLY" && (
              <div className="space-y-6">
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Compass size={28} className="text-[#FF8C00]" />
                  </div>
                  <h3 className="text-xl font-black mb-2">Request a Private Tour</h3>
                  <p className="text-sm text-gray-300 font-medium">Custom dates are available for this experience. Request your preferred date!</p>
                </div>
                <button
                  onClick={() => openModal("custom_date")}
                  className="flex items-center justify-center gap-2 w-full px-8 py-4 bg-[#FF8C00] hover:bg-[#e67e00] text-white rounded-xl font-black text-sm transition-transform hover:-translate-y-0.5 shadow-lg shadow-[#FF8C00]/20"
                >
                  Request Custom Date
                </button>
              </div>
            )}

            {heroState === "NO_SCHEDULE" && canRequestDate && (
              <div className="space-y-6">
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Compass size={28} className="text-[#FF8C00]" />
                  </div>
                  <h3 className="text-xl font-black mb-2">Request a Private Tour</h3>
                  <p className="text-sm text-gray-300 font-medium">No public schedules are currently available. Choose your own date and travel privately!</p>
                </div>
                <button
                  onClick={() => openModal("custom_date")}
                  className="flex items-center justify-center gap-2 w-full px-8 py-4 bg-[#FF8C00] hover:bg-[#e67e00] text-white rounded-xl font-black text-sm transition-transform hover:-translate-y-0.5 shadow-lg shadow-[#FF8C00]/20"
                >
                  Request Custom Date
                </button>
              </div>
            )}

            {heroState === "NO_SCHEDULE" && !canRequestDate && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4 bg-white/5 border border-white/10 px-3 py-2 rounded-xl">
                  <Calendar size={16} className="text-gray-300" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">No Scheduled Departures</p>
                  </div>
                </div>
                <button
                  onClick={() => openModal("waitlist")}
                  className="flex items-center justify-center gap-2 w-full px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-sm transition-transform hover:-translate-y-0.5 border border-white/20"
                >
                  Join Waitlist
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
                  <h3 className="text-lg font-black mb-3 flex items-center gap-2 text-white/90 justify-center"><Compass size={18} className="text-[#FF8C00]"/> Request a Private Tour</h3>
                  <button
                    onClick={() => openModal("private_tour")}
                    className="flex items-center justify-center gap-2 w-full px-8 py-4 bg-[#FF8C00] hover:bg-[#e67e00] text-white rounded-xl font-black text-sm transition-transform hover:-translate-y-0.5 shadow-lg shadow-[#FF8C00]/20"
                  >
                    Request Custom Date
                  </button>
                </div>
              </div>
            )}

            {heroState === "SOLD_OUT" && !canRequestDate && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4 bg-red-500/20 border border-red-500/30 px-3 py-2 rounded-xl">
                  <Calendar size={16} className="text-red-400" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Sold Out</p>
                    <p className="text-xs font-medium text-red-100">All dates are full</p>
                  </div>
                </div>
                <button
                  onClick={() => openModal("waitlist")}
                  className="flex items-center justify-center gap-2 w-full px-8 py-4 bg-[#FF8C00] hover:bg-[#e67e00] text-white rounded-xl font-black text-sm transition-transform hover:-translate-y-0.5 shadow-lg shadow-[#FF8C00]/20"
                >
                  Join Waitlist
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10 mt-12">
        
        {/* ── Main Content ── */}
        <div className="lg:col-span-8 space-y-10">
          
          <section>
             <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Included Services</h2>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { icon: MapIcon, label: "Guided Tour" },
                 { icon: Bus, label: "Transportation" },
                 { icon: Coffee, label: "Breakfast" },
                 { icon: Shield, label: "Insurance" }
               ].map((inc, i) => (
                 <div key={i} className="flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-[#1E293B] backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                   <inc.icon size={24} className="text-[#FF8C00] mb-3" />
                   <span className="font-bold text-sm text-gray-900 dark:text-white">{inc.label}</span>
                 </div>
               ))}
             </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <Compass className="text-[#FF8C00]" /> Itinerary Preview
            </h2>
            
            {tour.itinerary && tour.itinerary.length > 0 ? (
              <>
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-gray-800 before:to-transparent mb-12">
                   {tour.itinerary.map((stop: any, index: number) => (
                     <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                       <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-[#0F172A] bg-[#FF8C00] text-white font-black text-xs shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-md z-10">
                         D{stop.day || index + 1}
                       </div>
                       <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-[#1E293B] backdrop-blur-xl p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
                         <h4 className="font-black text-lg text-gray-900 dark:text-white mb-2">{stop.title?.en || "Exploration"}</h4>
                         <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stop.description?.en || ""}</p>
                         {stop.startTime && (
                           <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 dark:bg-black/20 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300">
                             <Clock size={12} /> {stop.startTime}
                           </div>
                         )}
                       </div>
                     </div>
                   ))}
                </div>
                
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <MapIcon className="text-[#FF8C00]" /> Interactive Route Map
                </h3>
                <ItineraryMap itinerary={tour.itinerary} />
              </>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-gray-800 before:to-transparent">
                 {[1, 2, 3].map((day) => (
                   <div key={day} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                     <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-[#0F172A] bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-black text-xs shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-md z-10">
                       D{day}
                     </div>
                     <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-[#1E293B] backdrop-blur-xl p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
                       <h4 className="font-black text-lg text-gray-900 dark:text-white mb-2">Day {day} Exploration</h4>
                       <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Discover local landmarks, engage with the community, and experience breathtaking landscapes.</p>
                     </div>
                   </div>
                 ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Traveler Reviews ({tour.rating?.numReviews || 0})</h2>
            <div className="grid gap-6">
               {reviews.length > 0 ? reviews.map((r: any) => (
                 <div key={r._id} className="bg-white dark:bg-[#1E293B] backdrop-blur-xl p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                   <div className="flex items-center gap-4 mb-4">
                     <div className="w-12 h-12 rounded-full bg-[#1A331B] flex items-center justify-center text-white font-black text-lg overflow-hidden">
                       {r.user?.profilePicture ? <img src={r.user.profilePicture} className="w-full h-full object-cover" /> : r.user?.name?.charAt(0) || "U"}
                     </div>
                     <div>
                       <h4 className="font-bold text-gray-900 dark:text-white">{r.user?.name || "Traveler"}</h4>
                       <div className="flex items-center gap-1 text-amber-400">
                         {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={12} className={i < Math.round(r.rating) ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"} />
                         ))}
                       </div>
                     </div>
                   </div>
                   <p className="text-sm font-medium text-gray-600 dark:text-gray-300">"{r.comment}"</p>
                 </div>
               )) : (
                 <div className="text-gray-500 font-medium">No reviews yet. Be the first to review this tour!</div>
               )}
            </div>
          </section>

        </div>

        {/* ── Right Column ── */}
        <div className="lg:col-span-4">
          <div className="sticky top-8 space-y-8">
          
          {canInstantBook && tour.schedules?.length > 0 ? (
            <div className="bg-white dark:bg-[#1E293B] backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm">
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Calendar className="text-[#FF8C00]" size={20} />
                Join a Scheduled Tour
              </h3>
              
              <div className="space-y-4 mb-8">
                {tour.schedules.map((s: any, idx: number) => {
                  const startDate = new Date(s.startDate);
                  const isAvailable = s.remainingSlots > 0;
                  
                  return (
                    <motion.div 
                      key={s._id || idx}
                      whileHover={isAvailable ? { scale: 1.02 } : {}}
                      className={`group border ${isAvailable ? 'border-gray-200 dark:border-white/10 hover:border-[#FF8C00] dark:hover:border-[#FF8C00]' : 'border-gray-100 dark:border-white/5 opacity-60'} rounded-2xl p-5 transition-all bg-white dark:bg-[#0F172A] shadow-sm overflow-hidden relative`}
                    >

                      
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-lg">
                            {startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </p>
                          <p className="text-xs font-medium text-gray-500 mt-1">
                            <Clock size={12} className="inline mr-1" />
                            {s.startTime} - {s.endTime}
                          </p>
                        </div>
                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${isAvailable ? 'bg-[#FF8C00]/10 text-[#FF8C00]' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
                          {isAvailable ? 'Available' : 'Sold Out'}
                        </span>
                      </div>
                      
                      <div className="flex items-end justify-between mt-5 relative z-10">
                        <div>
                          <span className="text-2xl font-black text-[#1A331B] dark:text-white">${s.priceOverride || tour.price}</span>
                          <span className="text-xs font-bold text-gray-400 ml-1">/ person</span>
                          <div className="mt-1 flex items-center gap-1.5">
                            <Users size={12} className={isAvailable ? "text-emerald-500" : "text-gray-400"} />
                            <span className="text-[11px] font-bold text-gray-500">{s.remainingSlots || 0} spots left</span>
                          </div>
                        </div>
                        
                        {isAvailable && (
                          <Link href={`/checkout/${tour._id}?scheduleId=${s._id}`} className="bg-[#1A331B] hover:bg-[#2A4A2B] text-white font-bold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-[#1A331B]/20 transition-all group-hover:shadow-xl group-hover:scale-105">
                            Book Now
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Permanent Request Private Tour Section */}
              <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                <div className="bg-gradient-to-r from-gray-50 to-white dark:from-[#0F172A] dark:to-[#1E293B] rounded-2xl p-5 border border-gray-100 dark:border-white/5">
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">None of these dates work?</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Request a private tour on your own schedule.</p>
                  <button 
                    onClick={() => openModal("custom_date")}
                    className="w-full py-3 bg-white dark:bg-[#1E293B] border-2 border-gray-200 dark:border-gray-700 rounded-xl font-bold text-sm text-gray-900 dark:text-white hover:border-[#FF8C00] dark:hover:border-[#FF8C00] hover:text-[#FF8C00] transition-colors"
                  >
                    Request a Private Tour
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1E293B] backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm text-center relative overflow-hidden">
              <div className="absolute -left-10 -top-10 w-40 h-40 bg-[#FF8C00]/10 rounded-full blur-3xl" />
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#1A331B]/10 rounded-full blur-3xl" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#FF8C00]/20 to-[#FF8C00]/5 rounded-2xl flex items-center justify-center mb-6 transform rotate-3">
                  <Calendar size={36} className="text-[#FF8C00]" />
                </div>
                
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                  Request a Private Tour
                </h3>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-8 max-w-xs leading-relaxed">
                  There are no scheduled public departures right now. Request a custom date and we'll arrange a verified local guide just for you!
                </p>
                
                <button 
                  onClick={() => openModal("custom_date")}
                  className="w-full py-4 bg-[#FF8C00] hover:bg-[#E67E00] text-white rounded-xl font-black text-[15px] shadow-lg shadow-[#FF8C00]/25 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                  <Calendar size={18} /> Request Custom Date
                </button>
                
                <p className="text-[11px] font-bold text-gray-400 mt-4 uppercase tracking-widest">
                  Quick approval • Flexible times • Personal Guide
                </p>
              </div>
            </div>
          )}

          {/* Assigned Guides Profile */}
          {tour.schedules?.length > 0 && (
            <div className="bg-gradient-to-br from-[#1A331B] to-[#0F1F10] rounded-[2.5rem] border border-[#1A331B] p-8 shadow-xl text-white">
              <h3 className="text-xl font-black mb-6 text-emerald-400">Meet Your Local Experts</h3>
              <div className="space-y-6">
                {Array.from(new Map(tour.schedules.filter((s: any) => s.guide).map((s: any) => [s.guide._id, s.guide])).values()).map((guide: any) => (
                  <div key={guide._id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#FF8C00] shrink-0 bg-gray-800">
                        <img 
                          src={guide.profilePicture || `https://ui-avatars.com/api/?name=${guide.name || "G"}&background=145A41&color=fff`} 
                          alt={guide.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div>
                        <h4 className="font-black text-lg tracking-tight">{guide.name}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Shield size={12} className="text-emerald-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Verified Guide</span>
                        </div>
                      </div>
                    </div>
                    
                    {guide.rating?.average > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={12} className={i < Math.round(guide.rating.average) ? "fill-[#FF8C00] text-[#FF8C00]" : "text-white/20"} />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-gray-300">{guide.rating.average.toFixed(1)} ({guide.rating.numReviews || 0} reviews)</span>
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-300 font-medium leading-relaxed italic border-l-2 border-[#FF8C00] pl-3">
                      "An absolutely exceptional guide who knows the Kambata region better than anyone. Highly recommended for an authentic experience!"
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">— Guide Review</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          </div>
        </div>
      </div>

      <RequestCustomDateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        itemId={tour._id}
        itemType="tourId"
        title={tourTitle(tour)}
        requestType={modalType}
      />
    </motion.div>
  );
}
