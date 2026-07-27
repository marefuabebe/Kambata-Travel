"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Star,
  MapPin,
  Globe,
  Shield,
  Users,
  Clock,
  Search,
  ChevronRight,
  Loader2,
  Filter,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const SPECIALTIES_FILTER = [
  "All",
  "Hiking",
  "Cultural",
  "Photography",
  "Bird Watching",
  "Heritage",
  "Adventure",
  "Wildlife",
];

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={12} className={i < Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-200"} />
      ))}
    </div>
  );
}

function GuideCard({ guide, index }: { guide: any; index: number }) {
  const rating = guide.stats?.averageRating || 0;
  const reviews = guide.stats?.totalReviews || 0;
  const tours = guide.stats?.completedBookings || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5 }}
      whileHover={{ y: -4 }}
    >
      <Link href={`/guides/${guide._id}`} className="block h-full group">
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-[#1A331B]/8 transition-all duration-500 overflow-hidden h-full flex flex-col">
          {/* Card Top */}
          <div className="relative h-40 bg-gradient-to-br from-[#1A331B] to-[#145233] overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#FF8C00] rounded-full blur-[60px]" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-400 rounded-full blur-[50px]" />
            </div>
            {/* Profile pic centered */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden border-4 border-white/20 shadow-xl">
                  <img loading="lazy"
                    src={guide.profilePicture || `https://ui-avatars.com/api/?name=${guide.name}&background=1A331B&color=fff&size=128`}
                    alt={guide.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                {guide.isVerified && (
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md border-2 border-white">
                    <Shield size={12} className="text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 flex-1 flex flex-col">
            <div className="text-center mb-4">
              <h3 className="font-black text-gray-900 text-lg mb-1 group-hover:text-[#1A331B] transition-colors">
                {guide.name}
              </h3>
              {guide.isVerified && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                  <Shield size={9} /> Verified Guide
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: "Rating", value: rating > 0 ? rating.toFixed(1) : "New", icon: <Star size={12} className="text-amber-400" /> },
                { label: "Reviews", value: reviews, icon: <Users size={12} className="text-blue-400" /> },
                { label: "Tours", value: tours, icon: <Clock size={12} className="text-purple-400" /> },
              ].map((stat) => (
                <div key={stat.label} className="text-center bg-gray-50 rounded-xl p-2">
                  <div className="flex items-center justify-center gap-1 mb-0.5">{stat.icon}</div>
                  <p className="font-black text-gray-900 text-sm">{stat.value}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Rating stars */}
            {rating > 0 && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <StarRow rating={rating} />
                <span className="text-xs text-gray-500 font-medium">({reviews})</span>
              </div>
            )}

            {/* Bio preview */}
            {guide.bio && (
              <p className="text-xs text-gray-500 text-center line-clamp-2 mb-4 leading-relaxed flex-1">
                {guide.bio}
              </p>
            )}

            {/* Specialties */}
            {guide.specialties?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                {guide.specialties.slice(0, 3).map((s: string) => (
                  <span key={s} className="px-2 py-1 rounded-lg bg-[#1A331B]/8 text-[#1A331B] text-[10px] font-black border border-[#1A331B]/15">
                    {s}
                  </span>
                ))}
                {guide.specialties.length > 3 && (
                  <span className="px-2 py-1 rounded-lg bg-gray-50 text-gray-400 text-[10px] font-bold">
                    +{guide.specialties.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Languages */}
            {guide.languages?.length > 0 && (
              <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mb-4 font-medium">
                <Globe size={11} />
                <span>{guide.languages.slice(0, 2).join(" · ")}{guide.languages.length > 2 ? ` +${guide.languages.length - 2}` : ""}</span>
              </div>
            )}

            {/* CTA */}
            <div className="mt-auto">
              <div className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-[#1A331B] text-white text-sm font-black group-hover:bg-[#145233] transition-colors shadow-sm">
                View Profile <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function GuidesPage() {
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("All");

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/guides/public`);
        setGuides(data.data || []);
      } catch (err) {
        console.error("Failed to load guides", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGuides();
  }, []);

  const filtered = guides.filter((g) => {
    const matchesSearch =
      !search ||
      g.name?.toLowerCase().includes(search.toLowerCase()) ||
      g.bio?.toLowerCase().includes(search.toLowerCase());
    const matchesSpecialty =
      specialtyFilter === "All" ||
      g.specialties?.some((s: string) => s.toLowerCase().includes(specialtyFilter.toLowerCase()));
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-[#1A331B] via-[#145233] to-[#0d2918] pt-28 pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#FF8C00]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="container mx-auto px-6 relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/70 text-xs font-black uppercase tracking-widest mb-6">
              <Shield size={12} className="text-emerald-400" /> Verified Local Experts
            </span>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
              Meet Your<br />
              <span className="text-[#FF8C00]">Kambata Guides</span>
            </h1>
            <p className="text-white/60 text-lg font-medium mb-8">
              Handpicked, verified experts who know every trail, village, and story of the Ethiopian Highlands.
            </p>

            {/* Search */}
            <div className="relative max-w-lg mx-auto">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search by name or specialty…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-4 pl-12 text-white placeholder-white/40 font-medium text-sm focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-16">
        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
          {SPECIALTIES_FILTER.map((s) => (
            <button
              key={s}
              onClick={() => setSpecialtyFilter(s)}
              className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all ${
                specialtyFilter === s
                  ? "bg-[#1A331B] text-white shadow-md shadow-[#1A331B]/20"
                  : "bg-white text-gray-600 border border-gray-100 hover:border-[#1A331B]/30 hover:text-[#1A331B]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 size={40} className="animate-spin text-[#1A331B]" />
              <p className="text-sm font-bold text-gray-500">Loading guide profiles…</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users size={48} className="text-gray-200 mx-auto mb-4" />
            <h3 className="font-black text-gray-700 text-xl mb-2">
              {guides.length === 0 ? "No Guides Yet" : "No Matches Found"}
            </h3>
            <p className="text-gray-500 text-sm">
              {guides.length === 0
                ? "Our guide roster is growing — check back soon."
                : "Try adjusting your search or filter."}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm font-bold text-gray-500 mb-6 text-center">
              {filtered.length} guide{filtered.length !== 1 ? "s" : ""} available
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((guide, idx) => (
                <GuideCard key={guide._id} guide={guide} index={idx} />
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
