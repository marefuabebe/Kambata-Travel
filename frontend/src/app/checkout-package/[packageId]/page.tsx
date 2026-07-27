"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  CheckCircle,
  ShieldCheck,
  Calendar,
  Users,
  MapPin,
  Hotel,
  Loader2,
  ArrowLeft,
  Minus,
  Plus,
  Package,
  Clock,
  Star,
  CreditCard,
  Lock,
  XCircle,
} from "lucide-react";
import apiClient from "@/utils/apiClient";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion, AnimatePresence } from "framer-motion";
import PaymentExpiryTimer from "@/components/shared/PaymentExpiryTimer";
import toast from "react-hot-toast";

function PackageCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { packageId } = useParams<{ packageId: string }>();

  const [pkg, setPkg] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    scheduleId: "",
    travelersCount: 1,
  });

  const [paymentExpiresAt, setPaymentExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?redirect=/checkout-package/${packageId}`);
      return;
    }

    const load = async () => {
      try {
        const [pkgRes, schedRes] = await Promise.all([
          apiClient.get(`/packages/${packageId}`),
          apiClient.get(`/packages/${packageId}/schedules`),
        ]);

        const pkgData = pkgRes.data.data;
        const schedData: any[] = schedRes.data.data || [];

        setPkg(pkgData);

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const live = schedData.filter(
          (s: any) => new Date(s.startDate) >= now && (s.availableSeats ?? 0) > 0 && s.status === "published"
        );

        if (live.length === 0) {
          router.replace(`/explore`);
          return;
        }

        setSchedules(live);

        const preselected = searchParams.get("scheduleId");
        const matched = preselected && live.find((s: any) => s._id === preselected);
        setFormData((prev) => ({
          ...prev,
          scheduleId: matched ? preselected! : live[0]?._id || "",
        }));
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load package details");
      } finally {
        setLoading(false);
      }
    };

    if (packageId) load();
  }, [packageId, user, authLoading, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.scheduleId) {
      setError("Please select an available date.");
      return;
    }
    setError("");
    setIsSubmitting(true);

    try {
      const res = await apiClient.post(
        `/packages/${packageId}/schedules/${formData.scheduleId}/book`,
        { travelersCount: Number(formData.travelersCount) }
      );

      if (res.data.checkoutUrl) {
        if (res.data.data?.paymentExpiresAt) {
          setPaymentExpiresAt(res.data.data.paymentExpiresAt);
        }
        window.location.href = res.data.checkoutUrl;
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
      toast.error(err.response?.data?.message || "Payment initialization failed. Please try again.");
      setError(err.response?.data?.message || "Booking failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] animate-pulse"></div>
          <Loader2 className="animate-spin text-emerald-400 w-14 h-14 relative z-10" />
        </div>
      </div>
    );
  }

  if (error && !pkg) {
    return (
      <div className="min-h-screen bg-[#F8F6F2] flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white border border-gray-100 p-12 rounded-3xl max-w-lg w-full shadow-xl">
            <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-rose-100">
              <Package size={40} className="text-rose-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Package Unavailable</h2>
            <p className="text-gray-500 text-lg mb-10">{error}</p>
            <button onClick={() => router.push('/explore')} className="w-full bg-[#1A331B] hover:bg-[#2A4A2B] text-white px-8 py-4 rounded-2xl font-bold transition-colors">
              Browse Packages
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  const selectedSchedule = schedules.find((s) => s._id === formData.scheduleId);
  const basePrice = pkg?.basePrice || 0;
  const totalPrice = basePrice * formData.travelersCount;
  const maxSeats = selectedSchedule?.availableSeats || 10;
  const pkgName = typeof pkg?.name === "object" ? pkg.name?.en || pkg.name?.am : pkg?.name;
  const tourTitle = typeof pkg?.tour?.title === "object" ? pkg.tour.title?.en || pkg.tour.title?.am : pkg?.tour?.title;
  const hotelName = pkg?.hotel?.name;
  const coverImage = pkg?.images?.[0] || pkg?.tour?.images?.[0] || "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037994/kambata/xbsw2ajsabbtz4tuwjvl.jpg";

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F6F2] transition-colors relative overflow-hidden font-sans">
      <div className="relative z-50"><Header theme="light" /></div>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 pt-[120px] pb-12 lg:pb-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          {/* LEFT: Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 flex flex-col gap-8"
          >
            <button onClick={() => router.back()} className="group flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#145A41] hover:text-[#0A3626] w-fit transition-colors">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back
            </button>

            <div>
              <div className="flex items-center gap-2 mb-4 inline-flex bg-[#145A41]/10 border border-[#145A41]/20 px-3 py-1.5 rounded-full">
                <ShieldCheck size={14} className="text-[#145A41]" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#145A41]">
                  Kambata Verified Package
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-[#1A331B] tracking-tight mb-4 transition-colors">Secure Checkout</h1>
              <p className="text-gray-600 text-lg max-w-xl transition-colors">
                Instant booking powered by Chapa. Your package reservation is confirmed securely.
              </p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-50 border border-rose-100 text-rose-600 p-5 rounded-2xl text-sm font-semibold flex items-center gap-4">
                 <XCircle size={20} className="shrink-0" /> <p>{error}</p>
              </motion.div>
            )}

            <form
              onSubmit={handleSubmit}
              className="bg-white border border-gray-100 p-8 md:p-10 rounded-[2rem] shadow-xl relative overflow-hidden space-y-10 transition-colors"
            >
              
              <h2 className="text-2xl font-bold text-[#1A331B] mb-8 flex items-center gap-3 transition-colors">
                <Package size={24} className="text-[#FF8C00]" /> Booking Details
              </h2>

              {/* Schedule Picker */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-bold text-gray-900">Available Departure Dates</label>
                  <span className="text-[10px] font-bold text-[#FF8C00] uppercase tracking-widest bg-[#FF8C00]/10 px-2 py-1 rounded-md">Select a date</span>
                </div>
                
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
                  {schedules.map((schedule) => {
                    const isSelected = formData.scheduleId === schedule._id;
                    const isDisabled = schedule.availableSeats < formData.travelersCount;
                    const date = new Date(schedule.startDate);

                    return (
                      <motion.div
                        key={schedule._id}
                        whileHover={!isDisabled ? { scale: 1.02 } : {}}
                        whileTap={!isDisabled ? { scale: 0.98 } : {}}
                        onClick={() => !isDisabled && setFormData({ ...formData, scheduleId: schedule._id })}
                        className={`
                          shrink-0 w-[200px] snap-start rounded-2xl p-5 cursor-pointer border-2 transition-all duration-300 relative
                          ${isSelected 
                            ? "bg-[#145A41]/5 border-[#145A41] shadow-lg" 
                            : "bg-white border-gray-100 hover:border-gray-300"} 
                          ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}
                        `}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-5 h-5 bg-[#145A41] rounded-full flex items-center justify-center">
                            <CheckCircle size={12} className="text-white" strokeWidth={3} />
                          </div>
                        )}
                        <div className="mb-4">
                          <span className="block text-xs font-bold uppercase tracking-widest text-[#FF8C00] mb-1">{date.toLocaleDateString("en-US", { month: "short" })}</span>
                          <span className="block text-3xl font-black text-gray-900 transition-colors">{date.getDate()}</span>
                        </div>
                        <p className="font-bold text-gray-600 text-sm mb-2 transition-colors">
                          {date.toLocaleDateString("en-US", { weekday: "long", year: "numeric" })}
                        </p>
                        {(schedule.startTime || schedule.endTime) && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mb-3 font-semibold transition-colors">
                            <Clock size={12} /> {schedule.startTime} {schedule.endTime ? ` – ${schedule.endTime}` : ""}
                          </p>
                        )}
                        <div className={`inline-block text-xs font-bold px-3 py-1 rounded-lg border ${schedule.availableSeats <= 3 ? "text-rose-600 bg-rose-50 border-rose-100" : "text-emerald-600 bg-emerald-50 border-emerald-100"}`}>
                          {schedule.availableSeats} seats left
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                {!formData.scheduleId && (
                  <p className="text-xs text-amber-400 font-semibold mt-2 animate-pulse">
                    Please select a departure date to continue.
                  </p>
                )}
              </div>

              {/* Party Size */}
              <div className="space-y-4">
                <label className="text-sm font-bold text-gray-900 transition-colors">Party Size</label>
                <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-2xl w-full max-w-xs transition-colors">
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, travelersCount: Math.max(1, p.travelersCount - 1) }))}
                    disabled={formData.travelersCount <= 1}
                    className="w-12 h-12 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 flex items-center justify-center transition-all shadow-sm"
                  >
                    <Minus size={20} />
                  </button>

                  <div className="flex items-center gap-4">
                    <Users size={24} className="text-[#FF8C00]" />
                    <div className="flex flex-col items-center">
                      <span className="font-black text-2xl text-[#1A331B] leading-none transition-colors">
                        {formData.travelersCount}
                      </span>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest transition-colors">
                        Travelers
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, travelersCount: Math.min(maxSeats, p.travelersCount + 1) }))}
                    disabled={formData.travelersCount >= maxSeats}
                    className="w-12 h-12 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 flex items-center justify-center transition-all shadow-sm"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="mt-10 pt-10 border-t border-gray-100 transition-colors">
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.scheduleId}
                  className="group relative w-full flex items-center justify-center gap-3 bg-[#1A331B] hover:bg-[#2A4A2B] text-white px-8 py-5 rounded-2xl font-extrabold text-lg transition-all shadow-[0_10px_30px_rgba(26,51,27,0.3)]_10px_30px_rgba(16,185,129,0.2)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <>
                      <CreditCard size={24} className="text-[#FF8C00]" />
                      <span>Pay & Confirm</span>
                      <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    </>
                  )}
                </button>

                <div className="mt-6 flex items-center justify-center gap-3 text-xs font-semibold text-gray-500 transition-colors">
                  <Lock size={14} className="text-[#145A41]" />
                  <span>256-bit encrypted checkout via Chapa</span>
                </div>
              </div>

              {paymentExpiresAt && (
                <div className="mt-4">
                  <PaymentExpiryTimer expiresAt={paymentExpiresAt} retryHref={`/checkout-package/${packageId}`} returnHref="/explore" />
                </div>
              )}

              <div className="flex items-start gap-4 p-5 bg-[#145A41]/5 rounded-2xl border border-[#145A41]/10 transition-colors">
                <ShieldCheck size={20} className="text-[#145A41] shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600 font-medium leading-relaxed transition-colors">
                  Funds are held securely by Kambata Travel until your package experience is completed, then released to your guide and hotel partner.
                </p>
              </div>
            </form>
          </motion.div>

          {/* RIGHT: Summary */}
          <motion.aside
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 lg:sticky top-32"
          >
            <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl relative mb-8 transition-colors">
              
              <div className="relative h-[240px] w-full">
                <img loading="lazy" src={coverImage} alt={pkgName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-md border border-white/40 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">
                  Package
                </div>
              </div>

              <div className="p-8 relative -mt-16">
                <h3 className="text-2xl font-extrabold text-white leading-tight mb-8 drop-shadow-md">{pkgName}</h3>

                <div className="space-y-4">
                  {tourTitle && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-200 transition-colors">
                        <MapPin size={16} className="text-[#145A41]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Tour</p>
                        <p className="text-sm font-bold text-[#1A331B] transition-colors">{tourTitle}</p>
                      </div>
                    </div>
                  )}
                  {hotelName && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-200 transition-colors">
                        <Hotel size={16} className="text-[#FF8C00]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Hotel</p>
                        <p className="text-sm font-bold text-[#1A331B] transition-colors">{hotelName}</p>
                      </div>
                    </div>
                  )}
                  {pkg?.duration && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-200 transition-colors">
                        <Calendar size={16} className="text-[#145A41]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Duration</p>
                        <p className="text-sm font-bold text-[#1A331B] transition-colors">
                          {pkg.duration.value} {pkg.duration.unit}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {pkg?.includedServices?.length > 0 && (
                  <div className="pt-6 mt-6 border-t border-gray-100 transition-colors">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
                      What's Included
                    </p>
                    <ul className="space-y-2">
                      {pkg.includedServices.slice(0, 5).map((s: any, i: number) => (
                        <li key={i} className="flex items-center gap-3 text-xs font-semibold text-gray-600 transition-colors">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#145A41] shrink-0" />
                          {typeof s === "object" ? s.en || s.am : s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-xl relative transition-colors">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-6">
                Price Breakdown
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium transition-colors">
                    Base Fare × {formData.travelersCount}
                  </span>
                  <span className="font-bold text-[#1A331B] transition-colors">
                    {(basePrice * formData.travelersCount).toLocaleString()} ETB
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium transition-colors">Platform Fee</span>
                  <span className="text-[10px] font-black tracking-widest text-[#145A41] bg-[#145A41]/10 px-2 py-1 rounded transition-colors">
                    COVERED
                  </span>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100 flex items-end justify-between transition-colors">
                <span className="font-black text-[#1A331B] transition-colors">Total Investment</span>
                <span className="text-3xl font-extrabold text-[#145A41] transition-colors">
                  {totalPrice.toLocaleString()} ETB
                </span>
              </div>
            </div>
          </motion.aside>
        </div>
      </main>

      <Footer />

      {/* Success Overlay */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-slate-800 border border-slate-700/50 rounded-[2.5rem] p-12 w-full max-w-lg text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-8 border border-emerald-500/30">
                <CheckCircle size={48} className="text-emerald-400" />
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Package Reserved!</h2>
              <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                Your reservation for <strong>{pkgName}</strong> is confirmed. We'll be in touch with final details shortly.
              </p>
              <button
                onClick={() => router.push("/explorer-dashboard/bookings")}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-8 py-5 rounded-2xl font-bold text-lg transition-colors"
              >
                View My Bookings
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default function PackageCheckoutWrapper() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <Loader2 className="animate-spin text-emerald-500 w-12 h-12" />
        </div>
      }
    >
      <PackageCheckoutPage />
    </React.Suspense>
  );
}
