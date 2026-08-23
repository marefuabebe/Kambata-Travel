"use client";

import React, { useState, useEffect } from "react";
import apiClient from "@/utils/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare, Map, User as UserIcon, Calendar, CheckCircle2, ChevronDown, ChevronLeft, Package as PackageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { format } from "date-fns";
import toast from "react-hot-toast";

// Types
interface Booking {
  _id: string;
  referenceNumber: string;
  tour?: { _id: string; title: { en: string }; images: string[] };
  packageId?: { _id: string; name: { en: string }; images: string[] };
  guide?: { _id: string; name: string; profilePicture?: string };
  packageScheduleId?: { guide?: { _id: string; name: string; profilePicture?: string } };
  status?: string;
  bookingStatus?: string;
  attendanceStatus: string;
  isReviewed: boolean;
  updatedAt: string;
}

interface Review {
  _id: string;
  reviewType: "tour" | "package" | "guide";
  rating: number;
  detailedRatings?: any;
  comment: string;
  reply?: string;
  createdAt: string;
  booking?: any;
  tour?: { title: { en: string }; images: string[] };
  package?: { name: { en: string }; images: string[] };
  guide?: { name: string; profilePicture?: string };
}

export default function ExplorerReviewsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"pending" | "submitted">("pending");
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [submittedReviews, setSubmittedReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ type: "tour"|"package"|"guide", booking: Booking } | null>(null);
  
  // Form State
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [detailedRatings, setDetailedRatings] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch user bookings to find pending reviews
      const [tourRes, pkgRes, revRes] = await Promise.all([
        apiClient.get("/bookings/my-bookings"),
        apiClient.get("/package-bookings/my-bookings").catch(() => ({ data: { data: [] } })),
        apiClient.get("/reviews/my-reviews")
      ]);

      const tours: Booking[] = tourRes.data.data || [];
      const pkgs: Booking[] = pkgRes.data.data || [];
      const reviews: Review[] = revRes.data.data || [];

      // Filter pending: A booking is pending if either its tour/package is unreviewed, or its guide is unreviewed (if it has a guide).
      const pendingTours = tours.filter(b => {
        if (b.status !== "completed" || !["present", "late"].includes(b.attendanceStatus)) return false;
        const hasTourReview = reviews.some(r => (r.booking?._id || r.booking) === b._id && r.reviewType === "tour");
        const hasGuideReview = b.guide ? reviews.some(r => (r.booking?._id || r.booking) === b._id && r.reviewType === "guide") : true;
        return !(hasTourReview && hasGuideReview);
      });
      
      const pendingPkgs = pkgs.filter(b => {
        if (b.bookingStatus !== "completed" || !["present", "late"].includes(b.attendanceStatus)) return false;
        const hasPkgReview = reviews.some(r => (r.booking?._id || r.booking) === b._id && r.reviewType === "package");
        const hasGuideReview = b.packageScheduleId?.guide ? reviews.some(r => (r.booking?._id || r.booking) === b._id && r.reviewType === "guide") : true;
        return !(hasPkgReview && hasGuideReview);
      });

      setPendingBookings([...pendingTours, ...pendingPkgs]);
      setSubmittedReviews(reviews);

    } catch (error) {
      console.error(error);
      toast.error("Failed to load reviews data");
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (booking: Booking, type: "tour"|"package"|"guide") => {
    setReviewTarget({ type, booking });
    setRating(0);
    setHoveredRating(0);
    setComment("");
    
    // Init detailed categories
    if (type === "tour" || type === "package") {
      const details: Record<string, number> = { valueForMoney: 0, organization: 0 };
      if (type === "package") details.accommodation = 0;
      setDetailedRatings(details);
    } else {
      setDetailedRatings({ knowledge: 0, communication: 0, professionalism: 0, friendliness: 0 });
    }
    
    setIsModalOpen(true);
  };

  const handleStarClick = (category: string, value: number) => {
    if (category === "overall") {
      setRating(value);
    } else {
      setDetailedRatings(prev => ({ ...prev, [category]: value }));
    }
  };

  const submitReview = async () => {
    if (!rating) return toast.error("Please provide an overall rating");
    if (!comment.trim()) return toast.error("Please provide a comment");
    
    // Check detailed
    const unrated = Object.entries(detailedRatings).filter(([_, val]) => val === 0);
    if (unrated.length > 0) return toast.error("Please rate all categories");

    setIsSubmitting(true);
    try {
      const { type, booking } = reviewTarget!;
      const payload: any = {
        reviewType: type,
        rating,
        detailedRatings,
        comment,
        bookingId: booking._id
      };

      if (type === "tour") payload.tourId = booking.tour?._id;
      if (type === "package") payload.packageId = booking.packageId?._id;
      if (type === "guide") {
        payload.guideId = booking.guide?._id || booking.packageScheduleId?.guide?._id;
        if (booking.tour) payload.tourId = booking.tour._id;
        if (booking.packageId) payload.packageId = booking.packageId._id;
      }

      await apiClient.post("/reviews", payload);
      toast.success("Review submitted successfully!");
      setIsModalOpen(false);
      fetchData(); // Refresh lists
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGuideFromBooking = (b: Booking) => {
    return b.guide || b.packageScheduleId?.guide;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* ── Mobile Back Button ── */}
      <div className="lg:hidden mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0A0F1C] border border-gray-200 dark:border-white/10 rounded-xl text-gray-600 dark:text-gray-300 font-bold shadow-sm active:scale-95 transition-transform w-fit">
          <ChevronLeft size={18} />
          Back
        </button>
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pt-4 mb-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400 mb-2">Your Experience</p>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">{t("reviews.title")}</h1>
          <p className="text-sm font-medium text-gray-400 dark:text-gray-500 mt-2">
            Share your experiences to help other travelers and support our local guides.
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-white/10 pb-4 mb-6">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
            activeTab === "pending"
              ? "bg-[#FF8C00] text-white shadow-md shadow-[#FF8C00]/20"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
          }`}
        >
          Pending Reviews
          {pendingBookings.length > 0 && (
            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'pending' ? 'bg-white/20 text-white' : 'bg-[#FF8C00]/10 text-[#FF8C00]'}`}>
              {pendingBookings.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("submitted")}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
            activeTab === "submitted"
              ? "bg-[#1A331B] text-white shadow-md"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
          }`}
        >
          Submitted Reviews
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-[#FF8C00] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === "pending" ? (
        <div className="grid gap-6">
          {pendingBookings.length === 0 ? (
            <div className="bg-white dark:bg-[#0A0F1C] rounded-3xl p-12 text-center border border-gray-100 dark:border-white/5 shadow-sm">
               <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                 <CheckCircle2 size={32} className="text-gray-400" />
               </div>
               <h3 className="text-lg font-black text-gray-900 dark:text-white">{t("reviews.caughtUp")}</h3>
               <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto mt-2">
                 You have no pending reviews. Complete more adventures to unlock new review opportunities!
               </p>
            </div>
          ) : (
            pendingBookings.map((booking) => {
              const isTour = !!booking.tour;
              const title = isTour ? booking.tour?.title?.en : booking.packageId?.name?.en;
              const image = isTour ? booking.tour?.images?.[0] : booking.packageId?.images?.[0];
              const guide = getGuideFromBooking(booking);

              return (
                <motion.div 
                  key={booking._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-[#0A0F1C] rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-sm flex flex-col md:flex-row gap-6 items-center"
                >
                  <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shrink-0 bg-gray-100 relative group">
                    {image ? (
                      <img loading="lazy" src={image} alt="Image" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {isTour ? <Map size={32} className="text-gray-300" /> : <PackageIcon size={32} className="text-gray-300" />}
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-[#1A331B]">
                      {isTour ? "Tour" : "Package"}
                    </div>
                  </div>

                  <div className="flex-1 w-full space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 dark:text-white">{title}</h3>
                      <div className="flex items-center gap-4 text-xs font-bold text-gray-500 mt-2">
                        <span className="flex items-center gap-1.5"><Calendar size={14} /> Completed {format(new Date(booking.updatedAt), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      {!submittedReviews.some(r => (r.booking?._id || r.booking) === booking._id && r.reviewType === (isTour ? "tour" : "package")) && (
                        <button
                          onClick={() => openReviewModal(booking, isTour ? "tour" : "package")}
                          className="px-5 py-2.5 bg-[#FF8C00] hover:bg-[#e67e22] text-white rounded-xl text-sm font-bold shadow-md shadow-[#FF8C00]/20 transition-all flex items-center gap-2"
                        >
                          <Star size={16} className="fill-current" /> Rate {isTour ? "Tour" : "Package"}
                        </button>
                      )}
                      
                      {guide && !submittedReviews.some(r => (r.booking?._id || r.booking) === booking._id && r.reviewType === "guide") && (
                        <button
                          onClick={() => openReviewModal(booking, "guide")}
                          className="px-5 py-2.5 bg-[#1A331B] hover:bg-[#142815] text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
                        >
                          <UserIcon size={16} /> Rate Guide ({guide.name.split(" ")[0]})
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {submittedReviews.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-[#0A0F1C] rounded-3xl p-12 text-center border border-gray-100 dark:border-white/5 shadow-sm">
               <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                 <MessageSquare size={32} className="text-gray-400" />
               </div>
               <h3 className="text-lg font-black text-gray-900 dark:text-white">{t("reviews.noReviewsSubmitted")}</h3>
            </div>
          ) : (
            submittedReviews.map(review => {
              const isTour = review.reviewType === "tour";
              const isPkg = review.reviewType === "package";
              const isGuide = review.reviewType === "guide";
              
              const title = isTour ? review.tour?.title?.en : isPkg ? review.package?.name?.en : `Guide: ${review.guide?.name}`;
              
              return (
                <div key={review._id} className="bg-white dark:bg-[#0A0F1C] rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#FF8C00] mb-1 block">
                        {review.reviewType} Review
                      </span>
                      <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{title}</h3>
                      <span className="text-xs text-gray-500">{format(new Date(review.createdAt), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-[#FF8C00]/10 px-2.5 py-1 rounded-lg">
                      <Star size={14} className="text-[#FF8C00] fill-current" />
                      <span className="text-sm font-black text-[#FF8C00]">{review.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 italic mb-4">"{review.comment}"</p>
                  
                  {review.detailedRatings && (
                    <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-gray-50 dark:border-white/5">
                      {Object.entries(review.detailedRatings).map(([key, val]: any) => (
                        <div key={key} className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="flex items-center gap-0.5 text-gray-900 dark:text-white">
                            <Star size={10} className="text-amber-400 fill-current" /> {val}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {review.reply && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border-l-2 border-[#1A331B]">
                      <span className="text-[10px] font-black uppercase text-[#1A331B] dark:text-emerald-500 block mb-1">{t("reviews.responseFromGuide")}</span>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{review.reply}</p>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Review Modal */}
      <AnimatePresence>
        {isModalOpen && reviewTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#0F172A] w-full max-w-lg rounded-[2rem] shadow-2xl relative z-10 overflow-hidden border border-gray-100 dark:border-white/10 flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 dark:border-white/10 text-center relative shrink-0">
                <span className="inline-block px-3 py-1 bg-[#FF8C00]/10 text-[#FF8C00] rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                  Rate {reviewTarget.type}
                </span>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                  {reviewTarget.type === "guide" ? getGuideFromBooking(reviewTarget.booking)?.name : reviewTarget.type === "tour" ? reviewTarget.booking.tour?.title.en : reviewTarget.booking.packageId?.name.en}
                </h2>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 flex-1">
                {/* Overall Rating */}
                <div className="flex flex-col items-center">
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3">{t("reviews.overallExperience")}</span>
                  <div className="flex gap-2" onMouseLeave={() => setHoveredRating(0)}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleStarClick("overall", star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        className={`transition-all transform hover:scale-110 ${
                          star <= (hoveredRating || rating) ? "text-[#FF8C00]" : "text-gray-200 dark:text-gray-700"
                        }`}
                      >
                        <Star size={40} className={star <= (hoveredRating || rating) ? "fill-current" : ""} strokeWidth={1.5} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Detailed Ratings */}
                <div className="bg-gray-50 dark:bg-[#0A0F1C] rounded-2xl p-5 space-y-4 border border-gray-100 dark:border-white/5">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 text-center mb-2">{t("reviews.categoryBreakdown")}</h4>
                  {Object.keys(detailedRatings).map(cat => (
                    <div key={cat} className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 capitalize">
                        {cat.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleStarClick(cat, star)}
                            className={`transition-colors ${
                              star <= detailedRatings[cat] ? "text-amber-400" : "text-gray-300 dark:text-gray-600"
                            }`}
                          >
                            <Star size={20} className={star <= detailedRatings[cat] ? "fill-current" : ""} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comment */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-900 dark:text-white">{t("reviews.shareYourThoughts")}</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t("reviews.tellUsWhatYouLoved")}
                    rows={4}
                    className="w-full bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:border-[#FF8C00] dark:focus:border-[#FF8C00] resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-white/10 flex gap-3 shrink-0 bg-gray-50/50 dark:bg-[#0B1120]/50">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 rounded-xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReview}
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 rounded-xl font-bold text-white bg-[#FF8C00] hover:bg-[#e67e22] shadow-lg shadow-[#FF8C00]/20 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? t("reviews.submitting") : t("reviews.submitReview")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
