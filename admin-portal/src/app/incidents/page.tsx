"use client";

import React, { useState, useEffect } from "react";
import { Loader2, AlertOctagon, Calendar as CalendarIcon, MessageSquare, AlertTriangle, ShieldAlert } from "lucide-react";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/incidents");
      setIncidents(data.data || []);
    } catch (err) {
      toast.error("Failed to load incident reports");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-red-500" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <AlertOctagon className="text-red-500" size={28} />
            Incident Reports
            {incidents.length > 0 && (
              <span className="bg-red-50 dark:bg-red-500/10 text-red-600 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-red-100 dark:border-red-500/20">
                {incidents.length} Issues
              </span>
            )}
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">
            Review critical issues and emergencies logged by guides during active expeditions.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={fetchIncidents}
            className="shrink-0 bg-white dark:bg-[#161B26] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:border-gray-300 dark:hover:border-white/20 flex items-center gap-2 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {incidents.length === 0 ? (
        <div className="bg-white dark:bg-[#0F172A] border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[2rem] p-16 flex flex-col items-center justify-center text-center mt-6 shadow-sm">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon size={40} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">All Clear!</h3>
          <p className="text-gray-500 dark:text-gray-400 font-medium max-w-md mx-auto">
            There are no incident reports logged for any recent tours. Everything is running smoothly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {incidents.map((incident, idx) => (
            <div key={`${incident.scheduleId}-${idx}`} className="bg-white dark:bg-[#161B26] rounded-[2rem] border border-red-100 dark:border-red-500/10 shadow-sm overflow-hidden flex flex-col group hover:shadow-md hover:border-red-200 dark:hover:border-red-500/30 transition-all relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
              
              <div className="p-6 bg-red-50/50 dark:bg-red-500/5 border-b border-red-100/50 dark:border-red-500/10 flex justify-between items-start gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#0F172A] border border-red-100 dark:border-red-500/20 shadow-sm flex items-center justify-center text-red-500 shrink-0">
                    <ShieldAlert size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-red-900 dark:text-red-400 line-clamp-1">{incident.tourTitle}</h3>
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1">Reported Issue</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-white dark:bg-[#0F172A] rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-white/10 shadow-sm shrink-0">
                  {incident.status}
                </div>
              </div>
              
              <div className="p-8 flex-1">
                <div className="flex gap-4">
                  <MessageSquare className="text-gray-300 dark:text-gray-600 shrink-0 mt-1" size={20} />
                  <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic border-l-2 border-red-200 dark:border-red-500/30 pl-4 py-0.5">
                    "{incident.incidentReport}"
                  </p>
                </div>
              </div>

              <div className="p-6 bg-gray-50/80 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/5 flex flex-wrap gap-6 items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 font-black text-xs shrink-0">
                    {incident.guideName?.charAt(0) || "G"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{incident.guideName || "Unknown Guide"}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Assigned Guide</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 bg-white dark:bg-[#0F172A] px-3 py-2 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                  <CalendarIcon size={14} className="text-red-400" />
                  <span className="text-xs font-bold">
                    {new Date(incident.startDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckCircleIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}
