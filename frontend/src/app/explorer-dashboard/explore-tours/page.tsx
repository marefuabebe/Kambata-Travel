"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Star,
  Clock,
  Calendar,
  Compass,
  ArrowRight,
  TrendingUp,
  Loader2,
  Heart,
  SlidersHorizontal,
} from "lucide-react";
import apiClient from "@/utils/apiClient";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { PageHeader, LoadingCenter } from "@/components/explorer/ui";
import { tourTitle } from "@/utils/dashboardHelpers";
import RequestCustomDateModal from "@/components/explorer/RequestCustomDateModal";
import { useLanguage } from "@/context/LanguageContext";

function ExploreToursContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = (searchParams.get("search") || "").toLowerCase().trim();
  const { user } = useAuth();
  const [tours, setTours] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [destinationFilter, setDestinationFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [durationFilter, setDurationFilter] = useState("");
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  const [requestModal, setRequestModal] = useState<{ show: boolean; tour: any }>({
    show: false,
    tour: null,
  });

  const filteredTours = useMemo(() => {
    return tours.filter((t) => {
      const title = (typeof t.title === "string" ? t.title : t.title?.en || "").toLowerCase();
      const cat = (t.category || "").toLowerCase();
      const destName =
        typeof t.destination?.name === "string"
          ? t.destination.name
          : t.destination?.name?.en || "";
      if (query && !title.includes(query) && !cat.includes(query)) return false;
      if (destinationFilter && destName !== destinationFilter) return false;
      if (maxPrice && t.price > Number(maxPrice)) return false;
      if (durationFilter) {
        const val = t.duration?.value || 0;
        if (durationFilter === "short" && val > 1) return false;
        if (durationFilter === "medium" && (val < 2 || val > 3)) return false;
        if (durationFilter === "long" && val < 4) return false;
      }
      return true;
    });
  }, [tours, query, destinationFilter, maxPrice, durationFilter]);

  const requireVerifiedAuth = () => {
    if (!user) {
      toast.error(t("exploreTours.toast.loginToContinue"));
      router.push("/login");
      return false;
    }
    return true;
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (user?._id) {
      apiClient
        .get("/wishlist")
        .then((res) => {
          const ids = new Set<string>(
            (res.data.data || [])
              .filter((w: any) => w.itemType === "tour" && w.tour?._id)
              .map((w: any) => w.tour._id)
          );
          setWishlistIds(ids);
        })
        .catch(() => {});
    }
  }, [user?._id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [toursRes, destsRes] = await Promise.all([
        apiClient.get(`/tours?limit=50&lang=en&t=${Date.now()}`),
        apiClient.get(`/destinations?lang=en&t=${Date.now()}`),
      ]);
      setTours(toursRes.data.data);
      setDestinations(destsRes.data.data.filter((d: any) => d.isPublished));
    } catch (err) {
      console.error("Failed to fetch tours", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (tourId: string) => {
    if (!requireVerifiedAuth()) return;
    try {
      if (wishlistIds.has(tourId)) {
        const { data } = await apiClient.get("/wishlist");
        const item = (data.data || []).find((w: any) => w.tour?._id === tourId);
        if (item) {
          await apiClient.delete(`/wishlist/${item._id}`);
          setWishlistIds((prev) => {
            const next = new Set(prev);
            next.delete(tourId);
            return next;
          });
          toast.success(t("exploreTours.toast.removedWishlist"));
        }
      } else {
        await apiClient.post("/wishlist", { itemType: "tour", tourId });
        setWishlistIds((prev) => new Set(prev).add(tourId));
        toast.success(t("exploreTours.toast.savedWishlist"));
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || t("exploreTours.toast.wishlistFailed"));
    }
  };

  const handleRequestDate = async (tour: any) => {
    if (!requireVerifiedAuth()) return;
    setRequestModal({ show: true, tour });
  };

  const handleBookNow = (tourId: string) => {
    if (!requireVerifiedAuth()) return;
    router.push(`/checkout/${tourId}`);
  };


  const destinationOptions = useMemo(() => {
    const names = new Set<string>();
    tours.forEach((t) => {
      const n =
        typeof t.destination?.name === "string"
          ? t.destination.name
          : t.destination?.name?.en;
      if (n) names.add(n);
    });
    return Array.from(names);
  }, [tours]);

  if (loading) return <LoadingCenter />;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <PageHeader
          title={t("exploreTours.header.title")}
          subtitle={t("exploreTours.header.subtitle")}
        />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-[#1E293B] backdrop-blur-xl rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 dark:border-white/5 p-4 md:p-4 flex flex-col md:flex-row gap-4 md:items-center shadow-sm"
      >
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-black uppercase tracking-widest px-2">
          <SlidersHorizontal size={16} /> {t("exploreTours.filters.title")}
        </div>
        <select
          value={destinationFilter}
          onChange={(e) => setDestinationFilter(e.target.value)}
          className="text-sm border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 bg-gray-50 dark:bg-[#0F172A] text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-colors cursor-pointer appearance-none w-full md:w-auto md:min-w-[160px]"
        >
          <option value="">{t("exploreTours.filters.allDestinations")}</option>
          {destinationOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder={t("exploreTours.filters.maxPrice")}
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="text-sm border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 w-full md:w-36 bg-gray-50 dark:bg-[#0F172A] text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
        />
        <select
          value={durationFilter}
          onChange={(e) => setDurationFilter(e.target.value)}
          className="text-sm border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 bg-gray-50 dark:bg-[#0F172A] text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-colors cursor-pointer appearance-none w-full md:w-auto md:min-w-[160px]"
        >
          <option value="">{t("exploreTours.filters.anyDuration")}</option>
          <option value="short">{t("exploreTours.filters.upTo1Day")}</option>
          <option value="medium">{t("exploreTours.filters.days2to3")}</option>
          <option value="long">{t("exploreTours.filters.days4Plus")}</option>
        </select>
        {(destinationFilter || maxPrice || durationFilter) && (
          <button
            type="button"
            onClick={() => {
              setDestinationFilter("");
              setMaxPrice("");
              setDurationFilter("");
            }}
            className="text-xs font-bold text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors ml-auto px-4"
          >
            {t("exploreTours.filters.clearFilters")}
          </button>
        )}
      </motion.div>

      {requestModal.show && (
        <RequestCustomDateModal
          isOpen={requestModal.show}
          onClose={() => setRequestModal({ show: false, tour: null })}
          itemId={requestModal.tour?._id || ""}
          itemType="tourId"
          title={requestModal.tour ? tourTitle(requestModal.tour) : ""}
          requestType="custom_date"
        />
      )}

      {query && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-bold text-gray-500 dark:text-gray-400 px-4" dangerouslySetInnerHTML={{ __html: t("exploreTours.results.found").replace("{query}", `<span class="text-gray-900 dark:text-white">${searchParams.get("search")}</span>`).replace("{count}", filteredTours.length.toString()) }} />
      )}

      {filteredTours.length === 0 ? (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 text-gray-400 dark:text-gray-500 font-bold text-lg">
          {t("exploreTours.results.noMatch")}
        </motion.p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredTours.map((tour, idx) => {
              const dest =
                typeof tour.destination?.name === "string"
                  ? tour.destination.name
                  : tour.destination?.name?.en || t("exploreTours.destKambata");
              return (
                <motion.div
                  key={tour._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white dark:bg-[#1E293B] backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col group hover:shadow-2xl dark:shadow-none hover:-translate-y-1 transition-all relative"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-[0.03] dark:opacity-10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  
                  <div className="relative h-56 m-2 rounded-[2rem] overflow-hidden">
                    <img loading="lazy"
                      src={tour.images?.[0] || "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037994/kambata/xbsw2ajsabbtz4tuwjvl.jpg"}
                      alt="Image"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                    
                    <button
                      type="button"
                      onClick={() => toggleWishlist(tour._id)}
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-white/40 transition-colors"
                    >
                      <Heart
                        size={18}
                        className={wishlistIds.has(tour._id) ? "fill-red-500 text-red-500" : "text-white"}
                      />
                    </button>
                    
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-1 drop-shadow-md">{dest}</p>
                      <h3 className="font-black text-xl text-white tracking-tight leading-tight drop-shadow-md">{tourTitle(tour)}</h3>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col relative z-10">
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-500 dark:text-gray-400 mb-6">
                      <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-lg">
                        <Clock size={14} className="text-[#FF8C00]" /> {tour.duration?.value} {tour.duration?.unit}
                      </span>
                      {tour.rating?.average > 0 && (
                        <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-lg">
                          <Star size={14} className="text-amber-500 fill-amber-500" />{" "}
                          {tour.rating.average.toFixed(1)}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 capitalize bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-lg">
                        <TrendingUp size={14} className="text-emerald-500" /> {tour.difficulty}
                      </span>
                    </div>
                    
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
                      <div>
                        <span className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{t("exploreTours.tourCard.from")}</span>
                        <span className="text-xl font-black text-gray-900 dark:text-white">ETB {tour.price?.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link
                          href={`/explorer-dashboard/explore-tours/${tour._id}`}
                          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/5 transition-colors"
                        >
                          {t("exploreTours.tourCard.btnDetails")}
                        </Link>
                        {(() => {
                          const canInst = tour.bookingType === "instant" || tour.bookingType === "both" || tour.canInstantBook === true;
                          const canReq = tour.bookingType === "request" || tour.bookingType === "both" || tour.canRequestDate !== false;
                          const hasActiveSchedules = tour.hasLiveSchedule;

                          return (
                            <>
                              {canInst && hasActiveSchedules && (
                                <button
                                  type="button"
                                  onClick={() => handleBookNow(tour._id)}
                                  className="text-xs font-black text-white bg-[#1A331B] px-4 py-2.5 rounded-xl hover:-translate-y-0.5 transition-transform shadow-lg"
                                >
                                  {t("exploreTours.tourCard.btnBook")}
                                </button>
                              )}
                              {canReq && (
                                <button
                                  type="button"
                                  onClick={() => handleRequestDate(tour)}
                                  className="text-xs font-black text-[#FF8C00] bg-[#FF8C00]/10 border border-[#FF8C00]/20 px-4 py-2.5 rounded-xl hover:bg-[#FF8C00]/20 transition-colors"
                                >
                                  {t("exploreTours.tourCard.btnRequest")}
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default function ExploreToursPage() {
  return (
    <Suspense fallback={<LoadingCenter />}>
      <ExploreToursContent />
    </Suspense>
  );
}
