"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle, ShieldCheck, Calendar, Users, MapPin, Loader2, ArrowLeft, Minus, Plus, Compass, Clock } from "lucide-react";
import styles from "./Checkout.module.css";
import apiClient from "@/utils/apiClient";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion, AnimatePresence } from "framer-motion";
import PaymentExpiryTimer from "@/components/shared/PaymentExpiryTimer";
import toast from "react-hot-toast";

function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { tourId } = useParams<{ tourId: string }>();
  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    scheduleId: "",
    numPeople: 1,
    specialRequests: "",
  });

  const [error, setError] = useState("");
  // paymentExpiresAt is set after a booking is created and slots are reserved
  const [paymentExpiresAt, setPaymentExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?redirect=/checkout/${tourId}`);
      return;
    }
    const fetchTour = async () => {
      try {
        const res = await apiClient.get(`/tours/${tourId}`);
        if (res.data.success) {
          const data = res.data.data;
          const preselectedSchedule = searchParams.get("scheduleId");

          // If a specific schedule is pre-selected (e.g. from Pay Now on a custom request),
          // skip the public live-schedule filter and go straight to checkout with that schedule.
          // Request payment flow — no schedule required until after payment
          const requestIdParam = searchParams.get("requestId");
          if (requestIdParam) {
            setTour(data);
            setLoading(false);
            return;
          }

          if (preselectedSchedule) {
            setTour(data);
            setFormData((prev) => ({ ...prev, scheduleId: preselectedSchedule }));
            setLoading(false);
            return;
          }

          // For request-type tours with no pre-selected schedule, redirect to requests page
          if (data.bookingType === "request") {
            router.replace(`/explorer-dashboard/requests`);
            return;
          }

          setTour(data);
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const live = (data.schedules || []).filter(
            (s: any) => new Date(s.startDate) >= now && (s.remainingSlots ?? 0) > 0 && s.guide && s.status === "published"
          );

          if (live.length === 0) {
            router.replace(`/explorer-dashboard/explore-tours/${tourId}`);
            return;
          }

          const scheduleId = live[0]?._id || "";
          setFormData((prev) => ({ ...prev, scheduleId }));
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load tour details");
      } finally {
        setLoading(false);
      }
    };
    if (tourId) fetchTour();
  }, [tourId, user, authLoading, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const requestId = searchParams.get("requestId");
    if (!requestId && !formData.scheduleId) {
       setError("Please select a valid schedule.");
       return;
    }
    setError("");
    setIsSubmitting(true);
    console.log("Button clicked: Pay & Confirm Booking");
    
    try {
      const res = await apiClient.post("/bookings", {
        tourId: tourId,
        scheduleId: formData.scheduleId,
        numPeople: Number(formData.numPeople),
        specialRequests: formData.specialRequests || undefined,
        ...(requestId ? { requestId } : {}),
      });
      
      console.log("API Response:", res.data);
      console.log("checkoutUrl:", res.data.checkoutUrl);

      // If payment is required (checkoutUrl exists), store expiry then redirect
      if (res.data.checkoutUrl) {
        if (res.data.data?.paymentExpiresAt) {
          setPaymentExpiresAt(res.data.data.paymentExpiresAt);
        }
        window.location.href = res.data.checkoutUrl;
        return;
      } else if (res.data.data?.status === "waitlisted") {
        // Waitlisted bookings don't need immediate payment
        setSuccess(true);
        return;
      } else if (res.data.success !== undefined && !res.data.checkoutUrl) {
        toast.error("Payment initialization failed. Please try again.");
        setError("Payment initialization failed. Missing checkout URL.");
        return;
      }

      if (res.status === 201) {
        setSuccess(true);
      }
    } catch (err: any) {
      console.error("Booking Error:", err);
      toast.error(err.response?.data?.message || "Payment initialization failed. Please try again.");
      setError(err.response?.data?.message || "Booking failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6F2] flex flex-col">
      <Header theme="light" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-[#145A41] w-12 h-12" />
        </div>
      </div>
    );
  }

  if (error && !tour) {
    return (
      <div className="min-h-screen bg-[#F8F6F2] flex flex-col">
      <Header theme="light" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <ShieldCheck size={32} className="text-red-500" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4">Checkout Unavailable</h2>
          <p className="text-gray-500 font-medium max-w-md mx-auto mb-8">{error}</p>
          <button onClick={() => router.push('/tours')} className="bg-[#145A41] text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-green-900/20 hover:bg-[#0A3626] transition-all">Return to Expeditions</button>
        </div>
      </div>
    );
  }

  const preselectedScheduleId = searchParams.get("scheduleId");
  const requestId = searchParams.get("requestId");
  const isPrivateBooking = !!preselectedScheduleId;

  const selectedSchedule = tour?.schedules?.find((s: any) => s._id === formData.scheduleId);
  const basePrice = tour?.price || 0;
  const totalPrice = basePrice * formData.numPeople;

  const now = new Date();
  const bookableSchedules = (tour?.schedules || []).filter(
    (s: any) => new Date(s.startDate) >= now && (s.remainingSlots ?? 0) > 0
  );
  // For private bookings (Pay Now from request), always treat as having a valid schedule
  const hasSchedules = isPrivateBooking || bookableSchedules.length > 0;
  const maxCapacity = selectedSchedule?.remainingSlots || tour?.maxCapacity || 10;

  return (
    <div className={styles.page}>
      <Header theme="light" />

      <main className={styles.mainContent}>
        <div className={styles.checkoutLayout}>
          
          {/* LEFT: FORM */}
          <motion.div 
             initial={{ opacity: 0, x: -20 }} 
             animate={{ opacity: 1, x: 0 }} 
             className={styles.formSection}
          >
            <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#9CA3AF] hover:text-[#D97706] w-fit mb-2 transition-colors">
              <ArrowLeft size={16} /> Return
            </button>

            <div className={styles.sectionHeader}>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={16} className="text-[#D97706]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D97706]">Official Kambata Curator</span>
              </div>
              <h1 className={styles.sectionTitle}>Secure Reservation</h1>
              <p className={styles.sectionSubtitle}>Instant booking — pay securely via Chapa. Your spot is confirmed after payment.</p>
            </div>

            {error && (
               <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-bold flex items-center gap-3 shadow-sm">
                 <ShieldCheck size={18} /> {error}
               </div>
            )}

            {/* The "No Available Dates" state is practically unreachable now due to the redirect, but kept as a fallback */}
            {!hasSchedules && (
               <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex flex-col items-center text-center">
                 <Calendar size={32} className="text-amber-500 mb-4" />
                 <h3 className="text-lg font-black text-amber-900 mb-2">No Available Dates</h3>
                 <p className="text-amber-700 text-sm font-medium mb-6">This expedition currently has no scheduled departures. Please check back later or contact the guide.</p>
                 <button onClick={() => router.replace(`/explorer-dashboard/explore-tours/${tourId}`)} className="bg-amber-600 text-white px-6 py-3 rounded-full text-sm font-bold shadow-md hover:bg-amber-700 transition-colors">Return to Tour Details</button>
               </div>
            )}

            {hasSchedules && (
              <form onSubmit={handleSubmit} className={styles.formCard}>
                <h2 className="text-xl font-black text-[#1F2937] mb-6 flex items-center gap-2">
                  <Compass size={20} className="text-[#D97706]" /> Reservation Details
                </h2>
                
                <div className="space-y-8">
                  <div className={styles.inputGroupFull}>
                    {isPrivateBooking ? (
                      /* Private schedule — no picker needed, schedule is already confirmed by admin */
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                          <CheckCircle size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-1">Private Schedule Confirmed</p>
                          <p className="font-bold text-gray-900 text-sm mb-1">
                            Your guide has been assigned for this private tour.
                          </p>
                          <p className="text-xs text-gray-500">
                            Complete payment below to lock in your booking.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <label className={styles.label}>Available Expedition Dates</label>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select a slot</span>
                        </div>
                        
                        <div className={styles.schedulePicker}>
                          {bookableSchedules.map((schedule: any) => {
                            const isSelected = formData.scheduleId === schedule._id;
                            const isDisabled = schedule.remainingSlots < formData.numPeople;
                            const startDate = new Date(schedule.startDate);
                            
                            return (
                              <motion.div 
                                key={schedule._id}
                                whileHover={!isDisabled ? { scale: 1.02 } : {}}
                                whileTap={!isDisabled ? { scale: 0.98 } : {}}
                                onClick={() => !isDisabled && setFormData({...formData, scheduleId: schedule._id})}
                                className={`
                                  ${styles.scheduleCard} 
                                  ${isSelected ? styles.selectedCard : ""} 
                                  ${isDisabled ? styles.disabledCard : ""}
                                `}
                              >
                                <div className={styles.cardDate}>
                                  <span className={styles.cardDay}>{startDate.toLocaleDateString("en-US", { weekday: 'short' })}</span>
                                  <span className={styles.cardMonth}>{startDate.toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}</span>
                                </div>
                                <div className={styles.cardTime}>
                                  <Clock size={12} />
                                  <span>{startDate.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className={styles.cardSlots}>
                                  {schedule.remainingSlots} slots left
                                </div>
                                <div className={styles.guideInfo}>
                                  <img 
                                    src={schedule.guide?.profilePicture || `https://ui-avatars.com/api/?name=${schedule.guide?.name || "G"}&background=1E293B&color=fff`} 
                                    className={styles.guideAvatarMini} 
                                    alt="Guide" 
                                  />
                                  <span>{schedule.guide?.name?.split(' ')[0] || "Local Guide"}</span>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                        {!formData.scheduleId && (
                          <p className="text-[10px] text-[#D97706] font-bold mt-2 animate-pulse">
                            Please select an available date card above to proceed.
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className={styles.inputGroupFull}>
                    <label className={styles.label}>Expedition Party Size</label>
                    <div className={styles.counterWrapper}>
                      <button 
                        type="button" 
                        className={styles.counterBtn} 
                        onClick={() => setFormData(p => ({...p, numPeople: Math.max(1, p.numPeople - 1)}))}
                        disabled={formData.numPeople <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      <div className={styles.counterDisplay}>
                        <div className="w-10 h-10 bg-[#D97706]/10 rounded-xl flex items-center justify-center text-[#D97706]">
                           <Users size={20} />
                        </div>
                        <div className="flex flex-col">
                           <span className="font-black text-xl leading-none">{formData.numPeople}</span>
                           <span className="text-[9px] text-[#9CA3AF] font-black uppercase tracking-widest">Travelers</span>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        className={styles.counterBtn} 
                        onClick={() => setFormData(p => ({...p, numPeople: Math.min(maxCapacity, p.numPeople + 1)}))}
                        disabled={formData.numPeople >= maxCapacity}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.inputGroupFull}>
                    <label className={styles.label}>Custom Requests & Preferences</label>
                    <textarea 
                      className={styles.textarea} 
                      placeholder="Special dietary needs, physical limitations, or equipment requests..."
                      value={formData.specialRequests}
                      onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
                    ></textarea>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className={styles.confirmBtn}
                  disabled={isSubmitting || !formData.scheduleId}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Pay & Confirm Booking"}
                </button>

                {paymentExpiresAt && (
                  <PaymentExpiryTimer
                    expiresAt={paymentExpiresAt}
                    retryHref={`/checkout/${tourId}`}
                    returnHref="/tours"
                  />
                )}

                <div className={styles.secureNotice}>
                  <ShieldCheck size={16} className="text-[#D97706]" />
                  <span>Funds are held securely by Kambata Travel until your tour is completed, then released to your guide.</span>
                </div>
              </form>
            )}
          </motion.div>

          {/* RIGHT: SUMMARY */}
          <motion.aside 
             initial={{ opacity: 0, x: 20 }} 
             animate={{ opacity: 1, x: 0 }}
             className={styles.summarySection}
          >
            <div className={styles.summaryCard}>
              <div className={styles.summaryImageWrapper}>
                 <img 
                   src={tour?.images?.[0] || "/images/kambaata_hero_bg.png"} 
                   alt="Tour preview" 
                   className={styles.summaryImage} 
                 />
                 <div className={styles.summaryImageOverlay}></div>
                 <div className={styles.summaryBadge}>Verified Expedition</div>
              </div>
              <div className={styles.summaryContent}>
                <span className={styles.tourTag}>{tour?.category || "Cultural Expedition"}</span>
                <h3 className={styles.tourTitle}>{tour?.title?.en || tour?.title || "Loading Expedition..."}</h3>
                
                <div className={styles.metaRow}>
                  <div className={styles.metaItem}>
                    <MapPin size={16} className={styles.metaIcon} />
                    <span>{tour?.destination?.name?.en || tour?.destination?.name || "Heart of Kambata"}</span>
                  </div>
                </div>

                <div className={styles.priceBreakdown}>
                  {selectedSchedule?.guide && (
                    <div className="flex items-center gap-3 mb-6 p-4 bg-[#F8F6F2] rounded-xl border border-[#E5E7EB]">
                      <img src={selectedSchedule.guide.profilePicture || `https://ui-avatars.com/api/?name=${selectedSchedule.guide.name}&background=1E293B&color=fff`} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" alt="Guide" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9CA3AF] mb-0.5">Your Local Guide</p>
                        <p className="font-bold text-gray-900 text-sm leading-none">{selectedSchedule.guide.name}</p>
                      </div>
                    </div>
                  )}
                  <div className={styles.priceRow}>
                    <span>Base Fare (x{formData.numPeople})</span>
                    <span className="font-bold">${basePrice.toFixed(2)}</span>
                  </div>
                  <div className={styles.priceRow}>
                    <span>Platform Fee</span>
                    <span className="text-[#D97706] font-bold text-xs uppercase tracking-wider">Covered</span>
                  </div>
                  <div className={`${styles.priceRow} ${styles.total}`}>
                    <span>Total Investment</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>

        </div>
      </main>

      <Footer />

      {/* SUCCESS OVERLAY */}
      <AnimatePresence>
        {success && (
          <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             className={styles.successOverlay}
          >
            <motion.div 
               initial={{ scale: 0.9, y: 20 }} 
               animate={{ scale: 1, y: 0 }} 
               className={styles.successCard}
            >
              <div className={styles.successIcon}>
                <CheckCircle size={40} />
              </div>
              <h2 className={styles.successTitle}>Expedition Secured!</h2>
              <p className={styles.successText}>
                Your reservation for <strong>{tour?.title?.en || tour?.title}</strong> is confirmed. A local expert will be in touch shortly to finalize your itinerary.
              </p>
              <button onClick={() => router.push('/tours')} className={styles.dashboardBtn}>
                Discover More Tours
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CheckoutPageWrapper() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center">Loading...</div>}>
      <CheckoutPage />
    </React.Suspense>
  );
}
