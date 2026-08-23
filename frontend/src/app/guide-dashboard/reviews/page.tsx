"use client";

import React, { useState, useEffect } from "react";
import apiClient from "@/utils/apiClient";
import { PageHeader } from "@/components/guide/ui";
import { motion } from "framer-motion";
import { Star, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function GuideReviewsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data } = await apiClient.get("/reviews/guide/my-reviews");
      // Filter out non-guide reviews just in case, though backend should only return relevant ones
      const guideReviews = data.data.filter((r: any) => r.reviewType === "guide" && r.guide === user?._id);
      setReviews(guideReviews);
    } catch (error) {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const calculateAverages = () => {
    if (reviews.length === 0) return { overall: 0, knowledge: 0, communication: 0, professionalism: 0, friendliness: 0 };
    
    let sums = { overall: 0, knowledge: 0, communication: 0, professionalism: 0, friendliness: 0 };
    let counts = { overall: 0, knowledge: 0, communication: 0, professionalism: 0, friendliness: 0 };

    reviews.forEach(r => {
      if (r.rating) { sums.overall += r.rating; counts.overall++; }
      if (r.detailedRatings) {
        if (r.detailedRatings.knowledge) { sums.knowledge += r.detailedRatings.knowledge; counts.knowledge++; }
        if (r.detailedRatings.communication) { sums.communication += r.detailedRatings.communication; counts.communication++; }
        if (r.detailedRatings.professionalism) { sums.professionalism += r.detailedRatings.professionalism; counts.professionalism++; }
        if (r.detailedRatings.friendliness) { sums.friendliness += r.detailedRatings.friendliness; counts.friendliness++; }
      }
    });

    return {
      overall: counts.overall ? (sums.overall / counts.overall).toFixed(1) : 0,
      knowledge: counts.knowledge ? (sums.knowledge / counts.knowledge).toFixed(1) : 0,
      communication: counts.communication ? (sums.communication / counts.communication).toFixed(1) : 0,
      professionalism: counts.professionalism ? (sums.professionalism / counts.professionalism).toFixed(1) : 0,
      friendliness: counts.friendliness ? (sums.friendliness / counts.friendliness).toFixed(1) : 0,
    };
  };

  const stats = calculateAverages();

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <PageHeader
        title={t("guidePages.reviews.title")}
        subtitle={t("guidePages.reviews.subtitle")}
      />

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#1A331B] border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-[#1A331B] dark:bg-[#0F172A] rounded-3xl p-8 text-white flex flex-col items-center justify-center text-center shadow-lg border border-transparent dark:border-white/5">
              <span className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-2">{t("guidePages.reviews.overallRating")}</span>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-6xl font-black text-[#FF8C00]">{stats.overall}</span>
                <Star size={32} className="text-[#FF8C00] fill-current" />
              </div>
              <span className="text-sm font-medium text-gray-400">{t("guidePages.reviews.basedOn").replace("{n}", String(reviews.length))}</span>
            </div>

            <div className="md:col-span-2 bg-white dark:bg-[#161B26] rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-white/5 grid grid-cols-2 gap-x-8 gap-y-6">
               <h3 className="col-span-2 text-sm font-black uppercase tracking-widest text-gray-400">{t("guidePages.reviews.categoryBreakdown")}</h3>
               {[
                 { label: t("guidePages.reviews.knowledge"), value: stats.knowledge },
                 { label: t("guidePages.reviews.communication"), value: stats.communication },
                 { label: t("guidePages.reviews.professionalism"), value: stats.professionalism },
                 { label: t("guidePages.reviews.friendliness"), value: stats.friendliness }
               ].map((cat, i) => (
                 <div key={i} className="space-y-2">
                   <div className="flex justify-between items-end">
                     <span className="text-sm font-bold text-gray-900 dark:text-white">{cat.label}</span>
                     <span className="text-xs font-black text-emerald-500">{cat.value}</span>
                   </div>
                   <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-emerald-500 rounded-full" 
                       style={{ width: `${(Number(cat.value) / 5) * 100}%` }}
                     />
                   </div>
                 </div>
               ))}
            </div>
          </div>

          {/* Recent Reviews List */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-gray-900 dark:text-white">{t("guidePages.reviews.recentFeedback")}</h3>
            
            {reviews.length === 0 ? (
              <div className="bg-white dark:bg-[#161B26] rounded-3xl p-12 text-center border border-gray-100 dark:border-white/5">
                <MessageSquare size={32} className="mx-auto text-gray-300 mb-4" />
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t("guidePages.reviews.emptyTitle")}</h4>
                <p className="text-sm text-gray-500">{t("guidePages.reviews.emptyDesc")}</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {reviews.map((review, i) => (
                  <motion.div 
                    key={review._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white dark:bg-[#161B26] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                          {review.user?.profilePicture ? (
                            <img loading="lazy" src={review.user.profilePicture} alt="Image" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                              {review.user?.name?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white text-sm">{review.user?.name}</h4>
                          <span className="text-xs text-gray-500">{format(new Date(review.createdAt), "MMMM d, yyyy")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg">
                        <Star size={14} className="text-amber-500 fill-current" />
                        <span className="text-sm font-black text-amber-500">{review.rating}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{review.comment}"</p>
                    
                    {/* Only show detailed breakdown if present */}
                    {review.detailedRatings && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                         {["knowledge", "communication", "professionalism", "friendliness"].map(cat => (
                           review.detailedRatings[cat] ? (
                             <div key={cat} className="flex flex-col gap-1">
                               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{cat}</span>
                               <div className="flex items-center gap-1">
                                 <Star size={12} className="text-emerald-500 fill-current" />
                                 <span className="text-xs font-bold text-gray-900 dark:text-white">{review.detailedRatings[cat]}</span>
                               </div>
                             </div>
                           ) : null
                         ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
