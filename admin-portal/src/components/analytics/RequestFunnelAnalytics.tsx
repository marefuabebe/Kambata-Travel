import React, { useState, useEffect } from "react";
import apiClient from "@/utils/apiClient";
import { Loader2, TrendingUp, Clock, CreditCard, Users, Filter, BarChart2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function RequestFunnelAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("30D");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/analytics/request-funnel?timeframe=${timeframe}`);
        setData(res.data.data);
      } catch (error) {
        toast.error("Failed to load request analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [timeframe]);

  if (loading || !data) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-emerald-600" />
      </div>
    );
  }

  const { funnel, metrics } = data;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Controls */}
      <div className="flex justify-between items-center bg-white dark:bg-[#161B26] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <BarChart2 size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white">Request Funnel</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">Conversion Metrics</p>
          </div>
        </div>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm font-bold rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500/50 outline-none"
        >
          <option value="7D">Last 7 Days</option>
          <option value="30D">Last 30 Days</option>
          <option value="90D">Last 90 Days</option>
          <option value="YTD">Year to Date</option>
          <option value="ALL">All Time</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#161B26] rounded-[1.5rem] border border-gray-100 dark:border-white/5 p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Conversion Rate</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.conversionRate}%</p>
        </div>
        <div className="bg-white dark:bg-[#161B26] rounded-[1.5rem] border border-gray-100 dark:border-white/5 p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Acceptance Rate</p>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{metrics.acceptanceRate}%</p>
        </div>
        <div className="bg-white dark:bg-[#161B26] rounded-[1.5rem] border border-gray-100 dark:border-white/5 p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Avg Assignment Time</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{metrics.avgAssignmentHours}h</p>
        </div>
        <div className="bg-white dark:bg-[#161B26] rounded-[1.5rem] border border-gray-100 dark:border-white/5 p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Avg Payment Time</p>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{metrics.avgPaymentHours}h</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel Visualizer */}
        <div className="lg:col-span-2 bg-white dark:bg-[#161B26] rounded-[2rem] border border-gray-100 dark:border-white/5 p-6 shadow-sm">
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6">Pipeline Flow</h3>
          <div className="space-y-4">
            {[
              { label: "Submitted", value: funnel.submitted, color: "bg-gray-100 text-gray-800" },
              { label: "Guide Assigned", value: funnel.guideAssigned, color: "bg-blue-100 text-blue-800" },
              { label: "Guide Accepted", value: funnel.guideAccepted, color: "bg-indigo-100 text-indigo-800" },
              { label: "Payment Started", value: funnel.paymentStarted, color: "bg-amber-100 text-amber-800" },
              { label: "Payment Completed (Converted)", value: funnel.confirmed, color: "bg-emerald-100 text-emerald-800" },
            ].map((step, idx) => (
              <div key={idx} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{step.label}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${step.color}`}>
                    {step.value}
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${step.color.split(' ')[0].replace('100', '500')}`}
                    style={{ width: `${funnel.submitted > 0 ? (step.value / funnel.submitted) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Declined Guides */}
        <div className="bg-white dark:bg-[#161B26] rounded-[2rem] border border-gray-100 dark:border-white/5 p-6 shadow-sm">
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-red-500" />
            Most Declined By
          </h3>
          <div className="space-y-4">
            {metrics.mostDeclinedGuides?.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No declines in this period.</p>
            ) : (
              metrics.mostDeclinedGuides?.map((guide: any) => (
                <div key={guide._id} className="flex items-center justify-between bg-gray-50 dark:bg-[#0F172A] p-3 rounded-2xl border border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <img src={guide.profilePicture || `https://ui-avatars.com/api/?name=${guide.name}&background=random`} alt={guide.name} className="w-8 h-8 rounded-full" />
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{guide.name}</span>
                  </div>
                  <span className="text-xs font-black bg-red-100 text-red-600 px-2 py-1 rounded-lg">
                    {guide.count} declines
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
