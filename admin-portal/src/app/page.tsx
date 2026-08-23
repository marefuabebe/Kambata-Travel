"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Map, 
  CreditCard, 
  Award, 
  ArrowUpRight, 
  ArrowDownRight, 
  Loader2, 
  Calendar, 
  ChevronRight, 
  ShieldCheck,
  Clock,
  Banknote
} from "lucide-react";
import apiClient from "../utils/apiClient";
import Link from "next/link";

export default function AdminAnalytics() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await apiClient.get("/analytics");
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch admin stats", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="animate-spin text-[#1A331B]" size={40} />
    </div>
  );

  const statCards = [
    { label: "Total Revenue", value: `ETB ${stats?.total_revenue?.toLocaleString()}`, icon: CreditCard, color: "bg-emerald-500", trend: "+12.5%", isUp: true, href: "/bookings", desc: "Platform earnings from successfully completed tours and hotel stays." },
    { label: "Total Bookings", value: stats?.total_bookings, icon: Calendar, color: "bg-[#FF8C00]", trend: "+8.2%", isUp: true, href: "/bookings", desc: "Cumulative reservations made by explorers across all services." },
    { label: "Active Guides", value: stats?.total_guides, icon: Award, color: "bg-blue-500", trend: "+2 new", isUp: true, href: "/guides", desc: "Verified local experts currently approved to host expeditions." },
    { label: "Total Explorers", value: stats?.total_users, icon: Users, color: "bg-purple-500", trend: "+24", isUp: true, href: "/customers", desc: "Registered travelers exploring the Kambaata Highland." },
  ];

  return (
    <div className="space-y-8 pb-12">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col sm:flex-row justify-between sm:items-center gap-4"
      >
        <div className="space-y-1">
          <motion.h1 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight"
          >
            Command Center
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-sm text-gray-500 dark:text-gray-400 font-medium max-w-xl"
          >
            Monitor revenue, guides, and explorers in real-time.
          </motion.p>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex shrink-0"
        >
          <Link href="/guides" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2 rounded-lg font-semibold text-sm shadow-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200">
            Review Applications
          </Link>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, idx) => (
          <Link key={stat.label} href={stat.href} className="group">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              className="bg-white dark:bg-[#0A0F1C] p-5 md:p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md dark:shadow-none hover:border-gray-300 dark:hover:border-white/20 transition-all flex flex-col justify-between relative overflow-hidden h-full"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    <stat.icon size={18} strokeWidth={2.5} />
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold ${stat.isUp ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10" : "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10"}`}>
                    {stat.isUp ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
                    {stat.trend}
                  </div>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{stat.value}</h3>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#0A0F1C] rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm relative overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Trending Expeditions</h3>
          </div>
          
          <div className="flex-1">
            {stats?.top_5_popular_tours?.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {stats.top_5_popular_tours.map((tour: any, idx: number) => (
                  <Link key={tour._id} href="/tours" className="group flex flex-col sm:flex-row sm:items-center gap-4 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors -mx-6 px-6">
                    <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-[#0F172A] border border-gray-200 dark:border-white/10">
                      {tour.image ? (
                        <img src={tour.image} alt={tour.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Map size={16} />
                        </div>
                      )}
                      <div className="absolute top-1 left-1 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-bold text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-white/10">
                        #{idx + 1}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={tour.title}>{tour.title}</h4>
                      <div className="flex items-center gap-3 text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                        {tour.duration && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {tour.duration}h
                          </span>
                        )}
                        {tour.price && (
                          <span className="flex items-center gap-1">
                            <Banknote size={12} /> {tour.price.toLocaleString()} ETB
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-0.5">Bookings</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">{tour.bookingCount}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-[#0F172A]/50">
                <div className="w-12 h-12 bg-white dark:bg-[#0A0F1C] border border-gray-200 dark:border-white/10 shadow-sm rounded-lg flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500">
                  <Map size={24} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Awaiting Explorers</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[250px]">
                  When travelers book adventures, popular expeditions will dynamically surface here.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#0F172A] dark:bg-[#0A0F1C] border border-transparent dark:border-white/5 rounded-2xl p-6 text-white shadow-xl flex flex-col relative overflow-hidden">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
          
          <div className="relative z-10 flex-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white/10 border border-white/10 rounded-lg flex items-center justify-center text-blue-400 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight">Security Hub</h3>
                <p className="text-gray-400 text-xs font-medium">Isolated Admin API Access.</p>
              </div>
            </div>
            
            <div className="space-y-2 mt-8">
              <Link href="/guides" className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 font-semibold text-sm transition-all group">
                <span className="text-gray-200 group-hover:text-white">Guide Vetting Queue</span>
                <ChevronRight size={16} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
              </Link>
              <Link href="/payouts" className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 font-semibold text-sm transition-all group">
                <span className="text-gray-200 group-hover:text-white">Process Payouts</span>
                <ChevronRight size={16} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
              </Link>
              <Link href="/audit" className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 font-semibold text-sm transition-all group">
                <span className="text-gray-200 group-hover:text-white">Audit Logs</span>
                <ChevronRight size={16} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
