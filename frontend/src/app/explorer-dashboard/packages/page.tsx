"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Package, MapPin, Clock, Loader2, Calendar, ArrowRight, X } from "lucide-react";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, LoadingCenter, EmptyState } from "@/components/explorer/ui";
import { tourTitle } from "@/utils/dashboardHelpers";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export default function PackagesPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user } = useAuth();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookPkg, setBookPkg] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [form, setForm] = useState({
    scheduleId: "",
    travelersCount: 2,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiClient
      .get("/packages")
      .then((res) => setPackages(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openBook = async (pkg: any) => {
    if (!user) {
      router.push("/login");
      return;
    }
    setBookPkg(pkg);
    try {
      const { data } = await apiClient.get(`/packages/${pkg._id}/schedules?t=${Date.now()}`);
      const availableSchedules = data.data || [];
      setSchedules(availableSchedules);
      if (availableSchedules.length > 0) {
        setForm({
          scheduleId: availableSchedules[0]._id,
          travelersCount: 2,
        });
      } else {
        setForm({ scheduleId: "", travelersCount: 2 });
      }
    } catch {
      toast.error(t("packagesPage.toast.loadSchedulesFailed"));
    }
  };

  const submitBook = async () => {
    if (!bookPkg || !form.scheduleId || form.travelersCount < 1) {
      toast.error(t("packagesPage.toast.invalidSelection"));
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await apiClient.post(`/packages/${bookPkg._id}/schedules/${form.scheduleId}/book`, {
        travelersCount: form.travelersCount,
      });
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.success(t("packagesPage.toast.reserved"));
        router.push("/explorer-dashboard/bookings");
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || t("packagesPage.toast.bookingFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingCenter />;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <PageHeader
          title={t("packagesPage.header.title")}
          subtitle={t("packagesPage.header.subtitle")}
          showBackButton={true}
        />
      </motion.div>

      {packages.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <EmptyState
            title={t("packagesPage.empty.title")}
            description={t("packagesPage.empty.desc")}
          />
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {packages.map((pkg, idx) => (
              <motion.div
                key={pkg._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-[#1E293B] rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col group hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300"
              >
                {/* Image Header */}
                <div className="w-full h-64 relative overflow-hidden shrink-0 bg-gray-100 dark:bg-white/5">
                  <img loading="lazy"
                    src={pkg.tour?.images?.[0] || pkg.hotel?.images?.[0] || "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037994/kambata/xbsw2ajsabbtz4tuwjvl.jpg"}
                    alt={pkg.name?.en || "Package"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md border border-white/20 text-[#FF8C00] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                      <Package size={12} /> {t("packagesPage.card.badge")}
                    </span>
                  </div>

                  {/* Price Tag */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                     <div>
                       <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider mb-0.5">{t("packagesPage.card.from")}</p>
                       <p className="text-2xl font-black text-white leading-none">
                         ETB {pkg.basePrice?.toLocaleString()}
                       </p>
                     </div>
                     <div className="bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5">
                       <Clock size={12} className="text-white" />
                       <span className="text-xs font-bold text-white tracking-wide">{pkg.duration?.value} {pkg.duration?.unit}</span>
                     </div>
                  </div>
                </div>
                
                {/* Content Body */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-3 tracking-tight line-clamp-2">
                    {pkg.name?.en || tourTitle(pkg.tour)}
                  </h3>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                      <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                      <span className="font-medium leading-relaxed">{pkg.hotel?.name} <span className="text-gray-400 mx-1">•</span> {pkg.hotel?.location}</span>
                    </div>
                  </div>
                  
                  {/* Footer Actions */}
                  <div className="mt-auto pt-5 flex items-center gap-3 border-t border-gray-100 dark:border-white/5">
                    <Link
                      href={`/explorer-dashboard/packages/${pkg._id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                      {t("packagesPage.card.btnDetails")}
                    </Link>
                    <button
                      type="button"
                      onClick={() => openBook(pkg)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm"
                    >
                      Book Now <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {bookPkg && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setBookPkg(null); setSchedules([]); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-white/10 rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 text-[#FF8C00] text-xs font-black uppercase tracking-widest mb-2">
                    <Package size={14} /> {t("packagesPage.modal.title")}
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                    {bookPkg.name?.en || tourTitle(bookPkg.tour)}
                  </h2>
                </div>
                <button 
                  onClick={() => { setBookPkg(null); setSchedules([]); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {schedules.length === 0 ? (
                <div className="bg-[#FF8C00]/10 border border-[#FF8C00]/20 text-[#FF8C00] p-6 rounded-2xl text-sm font-bold flex items-start gap-3">
                  <Calendar size={20} className="shrink-0" />
                  {t("packagesPage.modal.noSchedules")}
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">{t("packagesPage.modal.selectSchedule")}</label>
                    <select
                      className="w-full border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-colors appearance-none"
                      value={form.scheduleId}
                      onChange={(e) => setForm({ ...form, scheduleId: e.target.value })}
                    >
                      {schedules.map((s: any) => (
                        <option key={s._id} value={s._id}>
                          {new Date(s.date).toLocaleDateString()} — {s.availableSeats} {t("packagesPage.modal.seatsRemaining")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">{t("packagesPage.modal.travelers")}</label>
                    <input
                      type="number"
                      min={1}
                      className="w-full border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
                      value={form.travelersCount}
                      onChange={(e) => setForm({ ...form, travelersCount: parseInt(e.target.value) || 1 })}
                      placeholder={t("packagesPage.modal.travelersPlaceholder")}
                    />
                  </div>
                  
                  <div className="bg-white-[#1E293B] border border-gray-100 dark:border-white/5 p-6 rounded-2xl flex justify-between items-center mt-6">
                     <span className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">{t("packagesPage.modal.totalPrice")}</span>
                     <span className="text-2xl font-black text-[#1A331B] dark:text-emerald-400">
                       ETB {(bookPkg.basePrice * form.travelersCount).toLocaleString()}
                     </span>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-6 mt-6 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setBookPkg(null);
                    setSchedules([]);
                  }}
                  className="flex-1 py-4 rounded-2xl font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  {t("packagesPage.modal.cancel")}
                </button>
                <button
                  type="button"
                  onClick={submitBook}
                  disabled={submitting || schedules.length === 0}
                  className="flex-[2] py-4 rounded-2xl font-black bg-[#1A331B] hover:bg-[#122413] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                  {t("packagesPage.modal.confirmBooking")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
