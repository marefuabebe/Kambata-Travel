"use client";

import React, { useState, useEffect } from "react";
import apiClient from "@/utils/apiClient";
import { toast } from "react-hot-toast";
import { PageHeader, LoadingCenter } from "@/components/explorer/ui";
import { Calendar, ArrowRight, Clock, Users, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiClient.get("/requests/my-requests")
      .then(res => setRequests(res.data.data || []))
      .catch(err => toast.error(err.response?.data?.message || "Failed to load your requests"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingCenter />;

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-8">
      <PageHeader 
        title="My Custom Requests" 
        subtitle="Track the status of your private tour requests."
        showBackButton={true}
      />

      {requests.length === 0 ? (
        <div className="bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-16 text-center shadow-sm">
          <Calendar size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">No Requests Yet</h3>
          <p className="text-gray-500 font-medium">When you request custom dates for tours or packages, they will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map(req => {
            const title = req.itemType === "tour" ? (req.tourId?.title?.en || req.tourId?.title) : (req.packageId?.name?.en || req.packageId?.name);
            const image = req.itemType === "tour" ? req.tourId?.images?.[0] : req.packageId?.images?.[0];
            const isReady = req.status === "converted_to_schedule";

            return (
              <div key={req._id} className="bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl border border-gray-100 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center">
                <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shrink-0 bg-gray-100">
                  <img loading="lazy" src={image || "https://images.unsplash.com/photo-1549488344-c10ba3ebaa61"} alt={title} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      req.status === 'converted_to_schedule' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {req.status === "converted_to_schedule" ? "Ready to Book" : req.status}
                    </span>
                    <span className="text-xs font-bold text-gray-400 capitalize">{req.itemType}</span>
                  </div>
                  
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4">{title}</h3>
                  
                  <div className="flex flex-wrap gap-4 text-sm font-bold text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-lg">
                      <Calendar size={14} className="text-[#FF8C00]" /> {new Date(req.requestedDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-lg">
                      <Users size={14} className="text-emerald-500" /> {req.numberOfTravelers} Travelers
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto shrink-0 mt-4 md:mt-0 flex flex-col gap-3 justify-center">
                  {req.status === "pending" && (
                    <div className="text-center px-4 py-3 bg-amber-50 rounded-xl text-amber-700 text-sm font-bold flex items-center gap-2">
                      <Clock size={16} /> Under Review
                    </div>
                  )}
                  {req.status === "approved" && (
                    <div className="text-center px-4 py-3 bg-emerald-50 rounded-xl text-emerald-700 text-sm font-bold flex items-center gap-2">
                      <Clock size={16} /> Preparing Schedule...
                    </div>
                  )}
                  {isReady && (
                    <button 
                      onClick={() => router.push(`/checkout/${req.tourId?._id || req.packageId?._id}?scheduleId=${req.assignedScheduleId}`)}
                      className="w-full md:w-auto px-8 py-4 bg-[#FF8C00] hover:bg-[#e67e22] text-white rounded-xl font-black text-sm transition-transform hover:-translate-y-0.5 shadow-lg shadow-[#FF8C00]/20 flex items-center justify-center gap-2"
                    >
                      Complete Booking <ArrowRight size={16} />
                    </button>
                  )}
                  {req.status === "rejected" && (
                    <div className="text-center px-4 py-3 bg-red-50 rounded-xl text-red-700 text-sm font-bold flex items-center gap-2">
                      <ShieldAlert size={16} /> Cannot Accommodate
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
