"use client";

import { useState, useEffect } from "react";
import { Star, Clock, MapPin, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import apiClient from "@/utils/apiClient";
import { useLanguage } from "@/context/LanguageContext";

const PopularTours = () => {
  const { language, t } = useLanguage();
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const res = await apiClient.get("/tours/trending");
        if (res.data.success) {
          setTours(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching trending tours:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTours();
  }, []);

  if (loading) {
    return (
      <section className="py-16 md:py-24 bg-gray-50/50 overflow-hidden">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-xl mx-auto mb-12">
            <div className="h-4 w-32 bg-gray-200 animate-pulse mx-auto rounded-full mb-4"></div>
            <div className="h-10 w-64 bg-gray-200 animate-pulse mx-auto rounded-full mb-4"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-[24px] overflow-hidden shadow-sm flex flex-col h-[480px]">
                <div className="aspect-[16/10] bg-gray-100 animate-pulse w-full"></div>
                <div className="p-6 md:p-8 flex flex-col flex-1">
                  <div className="h-6 w-3/4 bg-gray-200 animate-pulse rounded-full mb-4"></div>
                  <div className="h-3 w-1/2 bg-gray-100 animate-pulse rounded-full mb-6"></div>
                  <div className="h-4 w-full bg-gray-100 animate-pulse rounded-full mb-2"></div>
                  <div className="h-4 w-5/6 bg-gray-100 animate-pulse rounded-full mb-8"></div>
                  <div className="mt-auto flex justify-between items-end">
                    <div className="h-8 w-24 bg-gray-200 animate-pulse rounded-full"></div>
                    <div className="h-12 w-32 bg-gray-200 animate-pulse rounded-2xl"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-[#FAFAFA] overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center"
          >
            <span className="text-[#1A331B] font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs mb-3 block">
              {t('home.popularTours.tag') || "Explore Amazing Destinations"}
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
              {t('home.popularTours.title') || "Popular Tours"}
            </h2>
            <p className="text-gray-500 font-medium text-sm sm:text-base leading-relaxed">
              {t('home.popularTours.desc') || "Discover the most loved destinations and unforgettable experiences handpicked by our travel experts."}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {tours.map((tour, index) => {
            const titleMap: Record<string, string> = {
              "Gamosha Hot Spring Retreat": "የጋሞሻ ሙቅ ውሃ መዝናኛ",
              "The Majestic Doje'e Waterfall": "ታላቁ የዶጄ ፏፏቴ",
              "Durame Town": "ዱራሜ ከተማ",
              "Mount Hambarcho": "ሀምበሪቾ ተራራ",
              "Sarobira Highlands": "ሳሮቢራ ደጋማ ቦታዎች",
              "Kambata Village": "ከምባታ መንደር",
              "Wanchi Crater Lake": "ወንጪ ሀይቅ",
              "Ajora Falls": "አጆራ ፏፏቴ"
            };
            
            const catMap: Record<string, string> = {
              "Retreat": "መዝናኛ", "Waterfall": "ፏፏቴ", "Town": "ከተማ", "Mountain": "ተራራ", "Highland": "ደጋማ ቦታ", "Culture": "ባህል", "Lake": "ሀይቅ", "Adventure": "ጀብዱ"
            };

            const getTitle = () => {
              if (language === 'am') return tour.title?.am || titleMap[tour.title?.en || tour.title] || tour.title?.en || tour.title;
              return tour.title?.en || tour.title;
            };

            const getCat = () => {
              let cat = tour.category?.en || tour.category || "Adventure";
              if (language === 'am') return tour.category?.am || catMap[cat] || catMap[cat.trim()] || "ጀብዱ";
              return cat;
            };

            return (
            <motion.div 
              key={tour._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-white rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col group hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300"
            >
              <div className="relative w-full aspect-[16/10] overflow-hidden shrink-0">
                <Image
                  src={(tour.images?.[0] || "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037994/kambata/xbsw2ajsabbtz4tuwjvl.jpg").replace('/upload/', '/upload/f_auto,q_auto,w_800/')}
                  alt={getTitle()}
                  fill
                  unoptimized={true}
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="absolute top-4 right-4 bg-white backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-white/20">
                   <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                   <span className="text-sm font-black text-gray-900">
                     {(!tour.rating?.average || Number.isNaN(Number(tour.rating?.average))) ? "5.0" : tour.rating.average.toFixed(1)}
                   </span>
                </div>
              </div>

              <div className="p-6 md:p-8 flex flex-col flex-1 text-left">
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2 line-clamp-1 group-hover:text-[#1A331B] transition-colors tracking-tight">
                  {getTitle()}
                </h3>
                
                <div className="flex items-center gap-3 text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {tour.duration?.value ? `${tour.duration.value} ${tour.duration.unit}` : tour.duration}
                    </span>
                  </div>
                  <span className="opacity-50">•</span>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[120px]">{getCat()}</span>
                  </div>
                </div>

                <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-8">
                  {tour.shortDescription?.[language] || tour.shortDescription?.en || tour.description?.[language] || tour.description?.en || t('home.popularTours.descShort') || "Explore the breathtaking highlights and experience the rich culture of the local people."}
                </p>

                <div className="mt-auto flex items-end justify-between gap-4 pt-2">
                   <div className="flex flex-col">
                     <p className="text-2xl font-black text-[#1A331B] leading-none mb-1">
                       ${(!tour.price || Number.isNaN(Number(tour.price))) ? "0.00" : Number(tour.price).toFixed(2)}
                     </p>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('tours.card.perPerson') || "per person"}</p>
                   </div>
                   <button className="bg-gradient-to-r from-[#1A331B] to-[#2C522D] hover:from-[#132614] hover:to-[#1A331B] text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 group/btn">
                      {t('tours.card.bookBtn') || "Book Now"} <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                   </button>
                </div>
              </div>
            </motion.div>
          )})}
        </div>
        
        <div className="mt-12 md:mt-16 flex justify-center">
          <button className="bg-white border border-gray-200 text-[#1A331B] px-8 py-3.5 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm text-sm hover:border-[#1A331B]/30 group">
            {t('home.popularTours.viewAll') || "View All Tours"} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default PopularTours;
