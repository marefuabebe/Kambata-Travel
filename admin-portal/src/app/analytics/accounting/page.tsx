"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, Download, PieChart, TrendingUp, AlertTriangle } from "lucide-react";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";

export default function AccountingReports() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });

  useEffect(() => {
    fetchAccounting();
  }, [dateRange]);

  const fetchAccounting = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = dateRange;
      let url = "/accounting";
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const { data } = await apiClient.get(url);
      setStats(data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load accounting data");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const { startDate, endDate } = dateRange;
      let url = `${apiClient.defaults.baseURL}/accounting/export`;
      
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (queryParams.toString()) url += `?${queryParams.toString()}`;

      const response = await apiClient.get(url, {
        responseType: "blob"
      });
      
      const blob = new Blob([response.data], { type: "text/csv" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `accounting_report.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Export downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download CSV");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Accounting & Financials</h1>
          <p className="text-gray-500 mt-1">Detailed breakdown of platform revenue, fees, and guide payouts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm"
          />
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#FF8C00] text-white rounded-xl font-bold text-sm hover:bg-[#e67e22] transition-colors"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1A331B] border-t-transparent" />
        </div>
      ) : stats ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm"
            >
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                <DollarSign size={24} />
              </div>
              <p className="text-sm font-bold text-gray-500 mb-1">Gross Revenue</p>
              <h3 className="text-3xl font-black text-gray-900">ETB {stats.grossRevenue.toLocaleString()}</h3>
              <p className="text-xs text-gray-400 mt-2">Total payments collected from travelers</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#1A331B]/5 rounded-bl-full -mr-16 -mt-16" />
              <div className="w-12 h-12 bg-[#1A331B]/10 text-[#1A331B] rounded-2xl flex items-center justify-center mb-4">
                <PieChart size={24} />
              </div>
              <p className="text-sm font-bold text-gray-500 mb-1">Platform Fees (15%)</p>
              <h3 className="text-3xl font-black text-[#1A331B]">ETB {stats.platformFees.toLocaleString()}</h3>
              <p className="text-xs text-gray-400 mt-2">Net platform revenue</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm"
            >
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <TrendingUp size={24} />
              </div>
              <p className="text-sm font-bold text-gray-500 mb-1">Guide Earnings</p>
              <h3 className="text-3xl font-black text-gray-900">ETB {stats.guideEarnings.toLocaleString()}</h3>
              <p className="text-xs text-gray-400 mt-2">Total accrued to guides (85%)</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm"
            >
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
                <DollarSign size={24} />
              </div>
              <p className="text-sm font-bold text-gray-500 mb-1">Total Paid Out</p>
              <h3 className="text-3xl font-black text-gray-900">ETB {stats.paidOut.toLocaleString()}</h3>
              <p className="text-xs text-gray-400 mt-2">Successfully withdrawn by guides</p>
            </motion.div>
          </div>

          <div>
            <h2 className="text-xl font-black text-gray-900 mb-6">Outstanding Balances (System-wide)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Pending Clearance</p>
                  <p className="text-2xl font-black text-amber-600">ETB {stats.outstandingBalances.pendingClearance.toLocaleString()}</p>
                </div>
                <AlertTriangle className="text-amber-200" size={32} />
              </div>
              
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Available to Withdraw</p>
                  <p className="text-2xl font-black text-emerald-600">ETB {stats.outstandingBalances.availableToWithdraw.toLocaleString()}</p>
                </div>
                <DollarSign className="text-emerald-200" size={32} />
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Processing Withdrawals</p>
                  <p className="text-2xl font-black text-blue-600">ETB {stats.outstandingBalances.withdrawalProcessing.toLocaleString()}</p>
                </div>
                <TrendingUp className="text-blue-200" size={32} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
