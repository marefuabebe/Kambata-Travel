"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, MapPin, Clock, Trash2, Compass, Hotel, Package } from "lucide-react";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";
import { PageHeader, LoadingCenter, EmptyState } from "@/components/explorer/ui";
import { tourTitle } from "@/utils/dashboardHelpers";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

type Tab = "tours" | "packages";

export default function WishlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("tours");
  const { t } = useLanguage();

  const fetchList = () => {
    apiClient
      .get("/wishlist")
      .then((res) => {
        let fetched = res.data.data || [];
        setItems(fetched);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  const remove = async (id: string) => {
    try {
      await apiClient.delete(`/wishlist/${id}`);
      setItems((prev) => prev.filter((i) => i._id !== id));
      toast.success("Removed from wishlist");
    } catch {
      toast.error("Could not remove item");
    }
  };

  if (loading) return <LoadingCenter />;

  const filteredItems = items.filter(i => i.itemType === tab || (tab === "tours" && !i.itemType)); // fallback for old data

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <PageHeader
          title={t("wishlist.title")}
          subtitle={t("wishlist.subtitle")}
          showBackButton={true}
        />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-2 bg-white dark:bg-[#0A0F1C] backdrop-blur-xl p-2 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm w-fit"
      >
        <button
          onClick={() => setTab("tours")}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all relative overflow-hidden ${
            tab === "tours" ? "bg-[#1A331B] text-white shadow-md" : "text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"
          }`}
        >
          <Compass size={16} className={tab === "tours" ? "text-emerald-400" : ""} />
          <span className="relative z-10">{t("wishlist.savedTours")}</span>
        </button>
        <button
          onClick={() => setTab("packages")}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all relative overflow-hidden ${
            tab === "packages" ? "bg-[#1A331B] text-white shadow-md" : "text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"
          }`}
        >
          <Package size={16} className={tab === "packages" ? "text-amber-400" : ""} />
          <span className="relative z-10">{t("wishlist.savedPackages")}</span>
        </button>
      </motion.div>

      {filteredItems.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <EmptyState
            title={tab === "tours" ? t("wishlist.noSavedTours") : t("wishlist.noSavedPackages")}
            description={tab === "tours" ? t("wishlist.noSavedToursDesc") : t("wishlist.noSavedPackagesDesc")}
            action={
              <Link
                href={tab === "tours" ? "/explorer-dashboard/explore-tours" : "/explorer-dashboard/packages"}
                className="inline-flex items-center gap-2 bg-[#FF8C00] hover:bg-[#e67e22] text-white px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-[#FF8C00]/20 hover:-translate-y-0.5 mt-4"
              >
                {tab === "tours" ? <Compass size={18} /> : <Package size={18} />} {t("wishlist.startExploring")}
              </Link>
            }
          />
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredItems.map((item, idx) => {
              const isTour = item.itemType === "tour" || !item.itemType;
              const isPackage = item.itemType === "package";
              
              let title = "";
              let image = "";
              let href = "";
              let duration = "";
              
              if (isTour) {
                title = tourTitle(item.tour);
                image = item.tour?.images?.[0];
                href = `/explorer-dashboard/explore-tours/${item.tour?._id}`;
                duration = `${item.tour?.duration?.value} ${item.tour?.duration?.unit}`;
              } else if (isPackage) {
                title = item.package?.name?.en || "Package";
                image = item.package?.images?.[0];
                href = `/explorer-dashboard/packages/${item.package?._id}`;
                duration = `${item.package?.duration?.value} ${item.package?.duration?.unit}`;
              } else {
                title = item.hotel?.name;
                image = item.hotel?.images?.[0];
                href = `/explorer-dashboard/hotels`;
              }

              return (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white dark:bg-[#0A0F1C] backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col group hover:shadow-2xl dark:shadow-none hover:-translate-y-1 transition-all relative"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 ${isPackage ? 'bg-amber-500' : 'bg-red-500'} opacity-[0.03] dark:opacity-10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none`} />
                  
                  <div className="relative h-56 m-2 rounded-[2rem] overflow-hidden">
                    <img loading="lazy"
                      src={image || "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037994/kambata/xbsw2ajsabbtz4tuwjvl.jpg"}
                      alt="Image"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                    
                    <span className="absolute top-4 left-4 bg-white/20 backdrop-blur-md border border-white/20 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg">
                      {isTour ? <Compass size={12} className="text-emerald-400" /> : <Package size={12} className="text-amber-400" />}
                      {isTour ? "Tour" : "Package"}
                    </span>
                    
                    <button
                      type="button"
                      onClick={() => remove(item._id)}
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-red-500/80 transition-colors group/btn"
                    >
                      <Trash2 size={16} className="text-white group-hover/btn:scale-110 transition-transform" />
                    </button>

                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-black text-xl text-white tracking-tight leading-tight drop-shadow-md line-clamp-2">{title}</h3>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col relative z-10">
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-500 dark:text-gray-400 mb-6">
                      <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-xl">
                        <Clock size={14} className={isPackage ? "text-amber-500" : "text-emerald-500"} />
                        {duration}
                      </span>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5">
                      <Link
                        href={href}
                        className={`flex w-full items-center justify-center gap-2 text-sm font-black ${isPackage ? "bg-amber-500 hover:bg-amber-600" : "bg-[#1A331B] hover:bg-[#122413] dark:bg-emerald-600 dark:hover:bg-emerald-500"} text-white px-4 py-3.5 rounded-xl transition-all shadow-lg`}
                      >
                        {t("wishlist.viewDetails")}
                      </Link>
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
