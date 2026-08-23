"use client";

import React, { useState, useEffect } from "react";
import apiClient from "@/utils/apiClient";
import { PageHeader } from "@/components/admin/ui";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { EyeOff, Eye, Search, AlertOctagon, Star, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "tour" | "package" | "guide" | "hidden">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data } = await apiClient.get("/reviews/admin");
      setReviews(data.data);
    } catch (error) {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (id: string, currentHidden: boolean) => {
    try {
      await apiClient.patch(`/reviews/${id}/moderate`, { isHidden: !currentHidden });
      toast.success(currentHidden ? "Review restored and published" : "Review hidden from public");
      fetchReviews();
    } catch (error) {
      toast.error("Failed to update review visibility");
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (activeTab !== "all" && activeTab !== "hidden") {
      if (r.reviewType !== activeTab) return false;
      if (r.isHidden) return false;
    }
    if (activeTab === "hidden" && !r.isHidden) return false;
    if (activeTab === "all" && r.isHidden) return false;
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        r.comment?.toLowerCase().includes(search) ||
        r.user?.name?.toLowerCase().includes(search) ||
        r.tour?.title?.toLowerCase().includes(search) ||
        r.guide?.name?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Reviews Management"
        subtitle="Monitor, moderate, and analyze traveler feedback across the platform."
      />

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white dark:bg-[#161B26] p-2 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
        <div className="flex overflow-x-auto custom-scrollbar w-full md:w-auto">
          {[
            { id: "all", label: "Published Reviews" },
            { id: "tour", label: "Tour" },
            { id: "package", label: "Package" },
            { id: "guide", label: "Guide" },
            { id: "hidden", label: "Hidden/Flagged" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-bold rounded-xl whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? (tab.id === "hidden" ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" : "bg-[#FF8C00] text-white")
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-72 shrink-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#0B1120] border border-gray-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm font-medium outline-none focus:border-[#FF8C00]"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#FF8C00] border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white dark:bg-[#161B26] rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse table-responsive">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-[#0B1120]/50 border-b border-gray-100 dark:border-white/5">
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Reviewer</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Subject</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Rating</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Comment</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Date</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredReviews.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                        No reviews found for this category.
                      </td>
                    </tr>
                  ) : (
                    filteredReviews.map((review) => (
                      <motion.tr 
                        key={review._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap" data-label="Reviewer">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 dark:text-white text-sm">{review.user?.name}</span>
                            <span className="text-xs text-gray-500">{review.user?.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4" data-label="Subject">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF8C00] mb-0.5">
                              {review.reviewType}
                            </span>
                            <span className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">
                              {review.reviewType === "tour" ? review.tour?.title?.en : review.reviewType === "package" ? review.package?.name?.en : review.guide?.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap" data-label="Rating">
                          <div className="flex items-center gap-1.5 bg-[#FF8C00]/10 text-[#FF8C00] px-2 py-1 rounded-lg w-fit">
                            <Star size={14} className="fill-current" />
                            <span className="font-black text-sm">{review.rating}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 min-w-[200px] max-w-[400px]" data-label="Comment">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 line-clamp-2" title={review.comment}>
                            {review.comment}
                          </p>
                          {review.detailedRatings && (
                            <div className="flex gap-2 mt-1 text-[10px] text-gray-400">
                              <span>+ Detailed breakdown provided</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium" data-label="Date">
                          {format(new Date(review.createdAt), "MMM dd, yyyy")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right" data-label="Actions">
                          <button
                            onClick={() => toggleVisibility(review._id, review.isHidden)}
                            className={`p-2 rounded-xl border transition-colors flex items-center gap-2 ml-auto ${
                              review.isHidden 
                                ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                                : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20"
                            }`}
                            title={review.isHidden ? "Restore Review" : "Hide Review"}
                          >
                            {review.isHidden ? (
                              <><Eye size={16} /> <span className="text-xs font-bold">Restore</span></>
                            ) : (
                              <><EyeOff size={16} /> <span className="text-xs font-bold">Hide</span></>
                            )}
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
