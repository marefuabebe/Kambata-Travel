"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  MapPin,
  Globe,
  Award,
  CheckCircle2,
  Clock,
  Users,
  ArrowLeft,
  ChevronRight,
  MessageSquare,
  Shield,
  TrendingUp,
  Loader2,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function StarRow({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-200"}
        />
      ))}
    </div>
  );
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-black text-gray-500 w-4 text-right">{star}</span>
      <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="h-full bg-amber-400 rounded-full"
        />
      </div>
      <span className="text-xs font-bold text-gray-400 w-6">{count}</span>
    </div>
  );
}

export default function PublicGuideProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [guide, setGuide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"reviews" | "tours">("reviews");

  useEffect(() => {
    if (!id) return;
    const fetchGuide = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/guides/public/${id}`);
        setGuide(data.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Guide not found");
      } finally {
        setLoading(false);
      }
    };
    fetchGuide();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-[#1A331B]" />
          <p className="text-sm font-bold text-gray-500">Loading guide profile…</p>
        </div>
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <Users size={32} className="text-gray-300" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Guide Not Found</h1>
          <p className="text-gray-500 text-sm mb-6">{error || "This guide profile is not available."}</p>
          <button onClick={() => router.back()} className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-2xl bg-[#1A331B] text-white text-sm font-bold hover:-translate-y-0.5 transition-all">
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const totalReviews = guide.stats.totalReviews || guide.reviews.length;
  const avgRating = guide.stats.averageRating || 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── Hero Section ── */}
      <div className="relative bg-gradient-to-br from-[#1A331B] via-[#145233] to-[#0d2918] overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF8C00]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 pt-8 pb-16">
          {/* Back */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm font-bold mb-8 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back
          </button>

          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 20 }}
              className="relative shrink-0"
            >
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] overflow-hidden border-4 border-white/20 shadow-2xl">
                <img loading="lazy"
                  src={guide.profilePicture || `https://ui-avatars.com/api/?name=${guide.name}&background=1A331B&color=fff&size=256`}
                  alt={guide.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {guide.isVerified && (
                <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 border-2 border-white">
                  <Shield size={18} className="text-white" />
                </div>
              )}
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 min-w-0"
            >
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-3xl md:text-4xl font-black text-white">{guide.name}</h1>
                {guide.isVerified && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-black">
                    <CheckCircle2 size={12} className="text-emerald-400" /> Verified Guide
                  </span>
                )}
              </div>

              {guide.location && (
                <p className="flex items-center gap-1.5 text-white/60 text-sm font-medium mb-4">
                  <MapPin size={14} /> {guide.location}
                </p>
              )}

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-6 mb-5">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={16} className={i < Math.round(avgRating) ? "text-amber-400 fill-amber-400" : "text-white/20"} />
                    ))}
                  </div>
                  <span className="text-white font-black">{avgRating.toFixed(1)}</span>
                  <span className="text-white/50 text-sm font-medium">({totalReviews} reviews)</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/60 text-sm font-medium">
                  <Clock size={14} />
                  <span>{guide.experienceYears} yrs experience</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/60 text-sm font-medium">
                  <Users size={14} />
                  <span>{guide.stats.completedBookings} tours led</span>
                </div>
              </div>

              {/* Languages */}
              {guide.languages?.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Globe size={14} className="text-white/40" />
                  {guide.languages.map((lang: string) => (
                    <span key={lang} className="px-2.5 py-1 rounded-lg bg-white/10 text-white/80 text-xs font-bold border border-white/10">
                      {lang}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-6 -mt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left Column ── */}
          <div className="lg:col-span-1 space-y-5">

            {/* Bio */}
            {guide.bio && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
                <h2 className="font-black text-gray-900 text-sm uppercase tracking-widest mb-3">About</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{guide.bio}</p>
              </motion.div>
            )}

            {/* Specialties */}
            {guide.specialties?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
                <h2 className="font-black text-gray-900 text-sm uppercase tracking-widest mb-3">Specialties</h2>
                <div className="flex flex-wrap gap-2">
                  {guide.specialties.map((s: string) => (
                    <span key={s} className="px-3 py-1.5 rounded-xl bg-[#1A331B]/10 text-[#1A331B] text-xs font-black border border-[#1A331B]/20">
                      {s}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Rating Breakdown */}
            {totalReviews > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
                <h2 className="font-black text-gray-900 text-sm uppercase tracking-widest mb-4">Rating Breakdown</h2>
                <div className="flex items-center gap-4 mb-5">
                  <p className="text-5xl font-black text-gray-900">{avgRating.toFixed(1)}</p>
                  <div>
                    <StarRow rating={avgRating} />
                    <p className="text-xs text-gray-400 font-medium mt-1">{totalReviews} reviews</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {guide.ratingDistribution.map((r: any) => (
                    <RatingBar key={r.star} star={r.star} count={r.count} total={totalReviews} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Badges */}
            {guide.badges?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
                <h2 className="font-black text-gray-900 text-sm uppercase tracking-widest mb-3">Badges</h2>
                <div className="flex flex-wrap gap-3">
                  {guide.badges.map((badge: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-amber-50 border border-amber-100">
                      {badge.iconUrl ? (
                        <img loading="lazy" src={badge.iconUrl} alt={badge.name} className="w-6 h-6 rounded-full" />
                      ) : (
                        <Award size={16} className="text-amber-500" />
                      )}
                      <span className="text-xs font-black text-amber-700">{badge.name?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Stats Card */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="bg-gradient-to-br from-[#1A331B] to-[#145233] rounded-[2rem] shadow-xl shadow-[#1A331B]/20 p-6">
              <h2 className="font-black text-white/70 text-xs uppercase tracking-widest mb-4">Impact Stats</h2>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: "Tours Completed", value: guide.stats.completedBookings, icon: <TrendingUp size={16} /> },
                  { label: "Average Rating", value: `${avgRating.toFixed(1)} / 5.0`, icon: <Star size={16} /> },
                  { label: "Traveler Reviews", value: totalReviews, icon: <MessageSquare size={16} /> },
                  { label: "Experience", value: `${guide.experienceYears} years`, icon: <Clock size={16} /> },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#FF8C00] shrink-0">{stat.icon}</div>
                    <div>
                      <p className="text-white font-black">{stat.value}</p>
                      <p className="text-white/50 text-xs font-medium">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Right Column ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Tabs */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                {/* Tab Header */}
                <div className="flex border-b border-gray-100">
                  {[
                    { id: "reviews", label: `Reviews (${totalReviews})`, icon: <Star size={14} /> },
                    { id: "tours", label: `Tours Led (${guide.toursLed.length})`, icon: <Globe size={14} /> },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-bold transition-all border-b-2 ${
                        activeTab === tab.id
                          ? "border-[#1A331B] text-[#1A331B]"
                          : "border-transparent text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {activeTab === "reviews" && (
                      <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {guide.reviews.length === 0 ? (
                          <div className="py-12 text-center">
                            <Star size={32} className="text-gray-200 mx-auto mb-3" />
                            <p className="font-black text-gray-700 mb-1">No reviews yet</p>
                            <p className="text-sm text-gray-400">Be the first to review this guide!</p>
                          </div>
                        ) : (
                          <div className="space-y-5">
                            {guide.reviews.map((review: any, idx: number) => (
                              <motion.div
                                key={review._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.06 }}
                                className="flex gap-4 pb-5 border-b border-gray-50 last:border-0 last:pb-0"
                              >
                                <img loading="lazy"
                                  src={review.user?.profilePicture || `https://ui-avatars.com/api/?name=${review.user?.name || "T"}&background=1A331B&color=fff`}
                                  alt="Image"
                                  className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-gray-100"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                    <p className="font-black text-gray-900 text-sm">{review.user?.name || "Traveler"}</p>
                                    <StarRow rating={review.rating} />
                                    <span className="text-xs text-gray-400 font-medium ml-auto">{new Date(review.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeTab === "tours" && (
                      <motion.div key="tours" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {guide.toursLed.length === 0 ? (
                          <div className="py-12 text-center">
                            <Globe size={32} className="text-gray-200 mx-auto mb-3" />
                            <p className="font-black text-gray-700 mb-1">No tours yet</p>
                            <p className="text-sm text-gray-400">This guide hasn't led any tours yet.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {guide.toursLed.map((tour: any, idx: number) => {
                              const title = tour.title?.en || tour.title || "Tour";
                              const image = tour.images?.[0];
                              const rating = tour.rating?.average || 0;
                              return (
                                <motion.div
                                  key={tour._id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                >
                                  <Link
                                    href={`/tours/${tour._id}`}
                                    className="group flex flex-col rounded-2xl overflow-hidden border border-gray-100 hover:border-[#1A331B]/30 transition-all hover:shadow-md"
                                  >
                                    <div className="relative h-32 bg-gray-100 overflow-hidden">
                                      {image ? (
                                        <img loading="lazy" src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1A331B]/10 to-emerald-500/10">
                                          <Globe size={32} className="text-[#1A331B]/30" />
                                        </div>
                                      )}
                                      {rating > 0 && (
                                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                                          <Star size={10} className="text-amber-400 fill-amber-400" />
                                          <span className="text-[10px] font-black text-gray-900">{rating.toFixed(1)}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="p-3">
                                      <p className="font-black text-gray-900 text-sm line-clamp-1 group-hover:text-[#1A331B] transition-colors">
                                        {title}
                                      </p>
                                      <div className="flex items-center gap-3 mt-1">
                                        {tour.destination && (
                                          <span className="text-xs text-gray-400 font-medium flex items-center gap-0.5">
                                            <MapPin size={10} /> {tour.destination.name}
                                          </span>
                                        )}
                                        {tour.duration && (
                                          <span className="text-xs text-gray-400 font-medium flex items-center gap-0.5">
                                            <Clock size={10} /> {tour.duration}d
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </Link>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
