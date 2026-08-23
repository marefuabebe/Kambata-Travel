"use client";

import React, { useState, useEffect } from "react";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  CreditCard, 
  Building2, 
  User, 
  Landmark,
  Wallet,
  Search,
  Filter,
  ArrowRightCircle,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";

export default function PayoutsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Modal State
  const [modalState, setModalState] = useState<{ id: string; type: "approve" | "complete" | "reject" } | null>(null);
  const [inputValue, setInputValue] = useState("");

  // Client-side filtering and searching
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "completed" | "rejected">("all");

  const fetchPayouts = async () => {
    try {
      const { data } = await apiClient.get("/payouts");
      setRequests(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payout requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchPayouts();
  }, []);

  const executeProcess = async () => {
    if (!modalState) return;
    const { id, type } = modalState;
    let status = type === "approve" ? "approved" : type === "complete" ? "completed" : "rejected";
    let transactionReference: string | undefined = undefined;
    let adminNote: string | undefined = undefined;

    if (type === "complete") {
      if (!inputValue.trim()) {
        toast.error("Transaction Reference is required to complete payout.");
        return;
      }
      transactionReference = inputValue.trim();
    } else if (type === "reject") {
      adminNote = inputValue.trim() || undefined;
    }

    setProcessingId(id);
    try {
      await apiClient.patch(`/payouts/${id}`, { status, adminNote, transactionReference });
      toast.success(`Payout ${status}`);
      setModalState(null);
      setInputValue("");
      fetchPayouts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to process payout");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = (req.guide?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (req.guide?.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-3 py-1 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">Pending</span>;
      case "approved":
        return <span className="px-3 py-1 bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">Approved</span>;
      case "completed":
        return <span className="px-3 py-1 bg-[#FF8C00]/10 text-[#FF8C00] border border-[#FF8C00]/20 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">Completed</span>;
      case "rejected":
        return <span className="px-3 py-1 bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">Rejected</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 dark:bg-[#0A0F1C] text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-[#F8FAFC] pb-24 md:pb-12 font-sans overflow-x-hidden">
      
      {/* Sticky Header & Filters */}
      <div className="sticky top-0 z-40 bg-slate-50/90 dark:bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-200 dark:border-[#334155] px-4 py-4 md:px-8 shadow-sm">
        <div className="max-w-[1400px] mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm flex items-center gap-3">
                <Wallet className="text-[#FF8C00]" size={28} />
                Guide Payouts
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                Review and process guide withdrawal requests instantly.
              </p>
            </div>
            
            {/* Stats/Summary Mini-Badge */}
            {!loading && (
              <div className="hidden md:flex items-center gap-4 bg-white dark:bg-[#0A0F1C] px-4 py-2 rounded-xl border border-slate-200 dark:border-[#334155] shadow-sm">
                <div className="text-center px-2 border-r border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Total</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{requests.length}</p>
                </div>
                <div className="text-center px-2 border-r border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Pending</p>
                  <p className="text-sm font-bold text-amber-500">{requests.filter(r => r.status === 'pending').length}</p>
                </div>
                <div className="text-center px-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Approved</p>
                  <p className="text-sm font-bold text-blue-500">{requests.filter(r => r.status === 'approved').length}</p>
                </div>
              </div>
            )}
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
              <input 
                type="text" 
                placeholder="Search by guide name or email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-[#0A0F1C] border border-slate-200 dark:border-[#334155] rounded-xl px-4 pl-10 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] transition-all min-h-[44px] shadow-sm"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF8C00] transition-colors" size={18} />
            </div>
            
            <div className="relative min-w-[160px]">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full bg-white dark:bg-[#0A0F1C] border border-slate-200 dark:border-[#334155] rounded-xl px-4 pl-10 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] transition-all min-h-[44px] appearance-none shadow-sm cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 border-b-2 border-r-2 border-slate-400 transform rotate-45 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-4 md:p-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-[#0A0F1C] rounded-[24px] p-6 md:p-8 border border-slate-200 dark:border-[#334155] animate-pulse">
                <div className="flex flex-col xl:flex-row gap-8">
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <div className="space-y-2">
                        <div className="w-40 h-6 bg-slate-200 dark:bg-slate-700 rounded-md" />
                        <div className="w-32 h-4 bg-slate-200 dark:bg-slate-700 rounded-md" />
                      </div>
                    </div>
                    <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-2xl w-full" />
                  </div>
                  <div className="flex flex-col xl:items-end gap-4 min-w-[280px]">
                    <div className="w-32 h-10 bg-slate-200 dark:bg-slate-700 rounded-md hidden xl:block" />
                    <div className="w-full h-14 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-[24px] p-12 md:p-20 text-center border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#0A0F1C] shadow-sm flex flex-col items-center justify-center mt-8"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF8C00]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <div className="w-24 h-24 bg-slate-50 dark:bg-[#0A0F1C] rounded-full flex items-center justify-center mb-6 border-4 border-white dark:border-[#0F172A] shadow-md relative z-10">
              <Wallet className="text-slate-400" size={40} />
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight relative z-10">No Payouts Found</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base max-w-md relative z-10">
              {searchQuery || statusFilter !== "all" 
                ? "We couldn't find any payout requests matching your current filters." 
                : "You're all caught up! There are no pending payout requests at this time."}
            </p>
            {(searchQuery || statusFilter !== "all") && (
              <button 
                onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
                className="mt-6 px-6 py-2.5 bg-slate-100 dark:bg-[#0A0F1C] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm font-bold transition-colors relative z-10"
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:gap-8">
            <AnimatePresence>
              {filteredRequests.map((req, i) => (
                <motion.div
                  key={req._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative overflow-hidden bg-white dark:bg-[#0A0F1C] rounded-[24px] border border-slate-200 dark:border-[#334155] p-6 md:p-8 flex flex-col xl:flex-row xl:items-stretch gap-6 md:gap-8 shadow-sm hover:shadow-lg hover:border-[#FF8C00]/30 transition-all duration-300 pb-24 md:pb-8 xl:pb-8"
                >
                  {/* Decorative Glow */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF8C00]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Left Column: Info & Details */}
                  <div className="flex-1 flex flex-col justify-between space-y-6 relative z-10">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-100 dark:bg-[#0A0F1C] border-2 border-white dark:border-[#1E293B] flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
                          {req.guide?.profilePicture ? (
                            <img src={req.guide.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User size={20} className="text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                              {req.guide?.name || "Unknown Guide"}
                            </h3>
                            {getStatusBadge(req.status)}
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                            {req.guide?.email}
                          </p>
                        </div>
                      </div>
                      
                      {/* Amount Mobile Badge (Hidden on XL) */}
                      <div className="xl:hidden text-right bg-slate-50 dark:bg-[#0F172A] py-2 px-3 md:px-4 rounded-xl border border-slate-200 dark:border-[#334155] shadow-sm shrink-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5 block">Amount</span>
                        <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white flex items-baseline gap-1 justify-end">
                          <span className="text-xs text-[#FF8C00] font-bold">ETB</span>
                          {req.amount?.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Bank Details Card */}
                    {req.bankInfo ? (
                      <div className="bg-slate-50 dark:bg-[#0F172A] rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-[#334155] shadow-inner grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
                        <div className="flex items-center gap-3 md:border-r border-slate-200 dark:border-slate-700 md:pr-4">
                          <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                            <Landmark size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Bank Name</p>
                            <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white truncate">{req.bankInfo.bankName}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 md:border-r border-slate-200 dark:border-slate-700 md:pr-4">
                          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <CreditCard size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Account Number</p>
                            <p className="text-xs md:text-sm font-black text-slate-900 dark:text-white tracking-wider font-mono truncate">{req.bankInfo.accountNumber}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                            <Building2 size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Account Holder</p>
                            <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white truncate">{req.bankInfo.accountHolder}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 dark:bg-[#0F172A] rounded-2xl p-5 border border-dashed border-slate-200 dark:border-[#334155] flex items-center justify-center text-slate-400 text-sm font-medium">
                        No bank details provided
                      </div>
                    )}
                  </div>

                  {/* Right Column: Amount Desktop & Actions */}
                  <div className="flex flex-col xl:items-end justify-between gap-6 relative z-10 border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-slate-700 pt-6 xl:pt-0 xl:pl-8 min-w-[280px]">
                    <div className="hidden xl:block text-right">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Requested Amount</span>
                      <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline justify-end gap-1.5">
                        <span className="text-xl text-[#FF8C00] font-bold">ETB</span>
                        {req.amount?.toLocaleString()}
                      </p>
                    </div>

                    {/* Actions container */}
                    <div className="mt-6 md:mt-0 flex justify-end w-full">
                      <div className="flex gap-3 w-full xl:max-w-none">
                        {req.status === "pending" && (
                          <>
                            <button
                              disabled={processingId === req._id}
                              onClick={() => { setInputValue(""); setModalState({ id: req._id, type: "reject" }); }}
                              className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0A0F1C] text-slate-600 dark:text-slate-300 font-bold hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center gap-2 transition-all disabled:opacity-50 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-500/30 min-h-[44px] text-sm"
                            >
                              {processingId === req._id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} 
                              Reject
                            </button>
                            <button
                              disabled={processingId === req._id}
                              onClick={() => { setInputValue(""); setModalState({ id: req._id, type: "approve" }); }}
                              className="flex-[2] px-6 py-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black hover:bg-slate-800 dark:hover:bg-white shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[44px] text-sm"
                            >
                              {processingId === req._id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} 
                              Approve
                            </button>
                          </>
                        )}
                        {req.status === "approved" && (
                          <>
                            <button
                              disabled={processingId === req._id}
                              onClick={() => { setInputValue(""); setModalState({ id: req._id, type: "reject" }); }}
                              className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0A0F1C] text-slate-600 dark:text-slate-300 font-bold hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center gap-2 transition-all disabled:opacity-50 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-500/30 min-h-[44px] text-sm"
                            >
                              {processingId === req._id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} 
                              Reject
                            </button>
                            <button
                              disabled={processingId === req._id}
                              onClick={() => { setInputValue(""); setModalState({ id: req._id, type: "complete" }); }}
                              className="flex-[2] px-6 py-3 rounded-xl bg-[#FF8C00] hover:bg-[#E67E00] text-white font-black shadow-lg shadow-[#FF8C00]/20 hover:shadow-[#FF8C00]/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[44px] text-sm"
                            >
                              {processingId === req._id ? <Loader2 size={16} className="animate-spin" /> : <ArrowRightCircle size={16} />} 
                              Complete Payment
                            </button>
                          </>
                        )}
                        {(req.status === "completed" || req.status === "rejected") && (
                           <div className="w-full flex items-center justify-center py-3 bg-slate-50 dark:bg-[#0A0F1C] border border-slate-200 dark:border-slate-700 rounded-xl min-h-[44px] text-slate-500 dark:text-slate-400 text-sm font-bold">
                             {req.status === "completed" ? "Payment Completed" : "Payout Rejected"}
                           </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Custom Modals */}
      {mounted && createPortal(
        <AnimatePresence>
          {modalState && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0A0F1C] border border-slate-200 dark:border-[#334155] rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              {modalState.type === "approve" && (
                <>
                  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <CheckCircle2 size={36} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center">Approve Payout?</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed text-center">
                    Are you sure you want to approve this request? The guide will be notified that their payment is being processed.
                  </p>
                </>
              )}

              {modalState.type === "complete" && (
                <>
                  <div className="w-20 h-20 bg-[#FF8C00]/10 text-[#FF8C00] rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <ArrowRightCircle size={36} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center">Complete Payment</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed text-center">
                    Enter the Bank or Telebirr Transaction Reference Number to confirm the transfer.
                  </p>
                  <input
                    type="text"
                    placeholder="e.g. FT2312345678"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] transition-all mb-8 shadow-sm text-center"
                    autoFocus
                  />
                </>
              )}

              {modalState.type === "reject" && (
                <>
                  <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <AlertTriangle size={36} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center">Reject Payout</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed text-center">
                    Provide a reason for rejecting this payout request. This will be visible to the guide.
                  </p>
                  <textarea
                    placeholder="Reason for rejection (optional)"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all mb-8 shadow-sm resize-none h-24"
                    autoFocus
                  />
                </>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => { setModalState(null); setInputValue(""); }}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeProcess}
                  disabled={processingId !== null || (modalState.type === "complete" && !inputValue.trim())}
                  className={`flex-1 py-3.5 rounded-2xl font-black text-white transition-colors disabled:opacity-50 shadow-lg ${
                    modalState.type === "approve" ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20" :
                    modalState.type === "complete" ? "bg-[#FF8C00] hover:bg-[#E67E00] shadow-[#FF8C00]/20" :
                    "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                  }`}
                >
                  {processingId !== null ? "Processing…" : "Confirm"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
