"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, 
  MapPin, 
  Search, 
  Download, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Wifi,
  WifiOff,
  Edit3,
  Smartphone
} from "lucide-react";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";

type CheckInLog = {
  _id: string;
  bookingId: string;
  bookingType: string;
  travelerId: { _id: string; name: string; email: string };
  guideId: { _id: string; name: string };
  action: string;
  method: string;
  location: { latitude: number; longitude: number };
  deviceInfo: { userAgent: string; ipAddress: string };
  status: string;
  createdAt: string;
};

export default function CheckInsPage() {
  const [logs, setLogs] = useState<CheckInLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // In the admin portal, the API base URL is typically configured
      const { data: res } = await apiClient.get(`/qr/audit?page=${page}&limit=10&search=${search}&status=${statusFilter}`);
      setLogs(res.data);
      setTotalPages(res.meta.pages);
    } catch (error) {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, search, statusFilter]);

  const handleExport = () => {
    // Generate CSV
    const headers = ["Date,Action,Method,Status,Traveler,Guide,Coordinates,IP"];
    const csvRows = logs.map(log => {
      const date = new Date(log.createdAt).toISOString();
      const action = log.action;
      const method = log.method;
      const status = log.status;
      const traveler = log.travelerId?.name || "Unknown";
      const guide = log.guideId?.name || "Unknown";
      const coords = log.location ? `${log.location.latitude},${log.location.longitude}` : "N/A";
      const ip = log.deviceInfo?.ipAddress || "N/A";
      return `"${date}","${action}","${method}","${status}","${traveler}","${guide}","${coords}","${ip}"`;
    });
    const csvContent = headers.concat(csvRows).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `CheckIn_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIcon = (action: string) => {
    if (action.includes("SUCCESS")) return <CheckCircle2 size={16} className="text-emerald-500" />;
    if (action.includes("FAILED")) return <XCircle size={16} className="text-red-500" />;
    if (action.includes("OVERRIDE")) return <AlertTriangle size={16} className="text-amber-500" />;
    return <Clock size={16} className="text-blue-500" />;
  };

  const getStatusColor = (action: string) => {
    if (action.includes("SUCCESS")) return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
    if (action.includes("FAILED")) return "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
    if (action.includes("OVERRIDE")) return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
    return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
  };

  const getMethodDisplay = (method: string) => {
    switch (method) {
      case "QR":
        return <span className="flex items-center gap-1"><Wifi size={12} className="text-emerald-500"/> QR Online</span>;
      case "OFFLINE_SYNC":
        return <span className="flex items-center gap-1"><WifiOff size={12} className="text-amber-500"/> QR Offline Synced</span>;
      case "MANUAL":
        return <span className="flex items-center gap-1"><Edit3 size={12} className="text-blue-500"/> Manual Entry</span>;
      default:
        return <span>{method}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
            Check-In Audit Logs
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <Smartphone size={16} /> Monitor QR scans, manual overrides, and GPS coordinates
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-[#0A0F1C] border border-gray-200 dark:border-white/10 font-bold text-sm text-gray-900 dark:text-white hover:border-[#1A331B] dark:hover:border-emerald-500 transition-colors shadow-sm"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#0A0F1C] backdrop-blur-xl rounded-[2rem] border border-gray-100 dark:border-white/5 p-6 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search action or method (e.g. QR, MANUAL)..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#1A331B] dark:focus:ring-emerald-500 outline-none"
          />
        </div>
        <div className="w-full md:w-64 relative">
          <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm font-medium text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-[#1A331B] dark:focus:ring-emerald-500 outline-none"
          >
            <option value="" className="dark:bg-slate-900 dark:text-white">All Statuses</option>
            <option value="SUCCESS" className="dark:bg-slate-900 dark:text-white">Success</option>
            <option value="FAILED" className="dark:bg-slate-900 dark:text-white">Failed</option>
            <option value="OVERRIDE" className="dark:bg-slate-900 dark:text-white">Override</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-[#0A0F1C] backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-responsive">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Time & Status</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Action</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Traveler</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Guide</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Location</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm font-bold text-gray-500">Loading audit logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm font-bold text-gray-500">No logs found matching your criteria.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6" data-label="Time & Status">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border w-max ${getStatusColor(log.action)}`}>
                          {getStatusIcon(log.action)}
                          {log.status}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6" data-label="Action">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">{log.action}</span>
                        <span className="text-xs font-bold text-gray-500">{getMethodDisplay(log.method)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6" data-label="Traveler">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {log.travelerId?.name?.charAt(0) || "U"}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{log.travelerId?.name || "Unknown"}</span>
                          <span className="text-xs text-gray-500">{log.travelerId?.email || "N/A"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6" data-label="Guide">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1A331B] text-emerald-400 flex items-center justify-center font-bold text-xs">
                          {log.guideId?.name?.charAt(0) || "G"}
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{log.guideId?.name || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6" data-label="Location">
                      {log.location && log.location.latitude ? (
                        <a 
                          href={`https://www.google.com/maps?q=${log.location.latitude},${log.location.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <MapPin size={14} /> Map View
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">No GPS</span>
                      )}
                      <div className="text-[10px] text-gray-400 mt-1">IP: {log.deviceInfo?.ipAddress || "N/A"}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
