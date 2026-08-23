"use client";

import React, { useState, useEffect } from "react";
import { Loader2, RefreshCw, CheckCircle2, XCircle, Search, CreditCard, Clock, Receipt } from "lucide-react";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";
import { confirmAction, promptAction } from "@/utils/confirmAlert";

interface Transaction {
  _id: string;
  tx_ref: string;
  amount: number;
  status: "pending" | "success" | "failed" | "refunded";
  createdAt: string;
  user?: { name?: string; email?: string };
  refundAmount?: number;
  refundReason?: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      const { data } = await apiClient.get("/transactions");
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleRefund = async (tx: Transaction) => {
    const reason = await promptAction(`Reason for refunding TX ${tx.tx_ref}:`, "Enter reason...");
    if (!reason) return; 

    const isConfirmed = await confirmAction("Process Refund?", `Are you sure you want to refund ETB ${tx.amount.toLocaleString()}?`);
    if (!isConfirmed) return;

    setRefundingId(tx._id);
    try {
      await apiClient.post(`/payments/refund/${tx.tx_ref}`, { reason, amount: tx.amount });
      toast.success("Refund processed successfully");
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to process refund");
    } finally {
      setRefundingId(null);
    }
  };

  const filtered = transactions.filter(t => 
    t.tx_ref.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.user?.email && t.user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.user?.name && t.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit"><CheckCircle2 size={10} /> Success</span>;
      case "failed":
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit"><XCircle size={10} /> Failed</span>;
      case "pending":
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit"><Clock size={10} /> Pending</span>;
      case "refunded":
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-blue-400 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit"><RefreshCw size={10} /> Refunded</span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300 rounded-md text-[9px] font-bold uppercase tracking-wider w-fit">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-[#F8FAFC] p-4 md:p-8 space-y-8 font-sans">
      
      {/* Header & Sticky Filter Bar */}
      <div className="sticky top-0 z-50 bg-slate-50/90 dark:bg-[#0F172A]/90 backdrop-blur-md pt-4 pb-4 border-b border-slate-200 dark:border-[#334155] space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              Master Ledger
              <span className="bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-blue-400 text-xs font-bold px-3 py-1 rounded-full border border-blue-200 dark:border-blue-500/20">
                {transactions.length} Records
              </span>
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Monitor all platform payments, track revenue, and issue refunds.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto bg-white dark:bg-[#1E293B] p-2 rounded-2xl border border-slate-200 dark:border-[#334155] shadow-sm">
            <div className="relative w-full sm:w-64 group px-2 py-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search TX Ref or Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-transparent border-none text-sm font-semibold text-slate-900 dark:text-white focus:outline-none placeholder-slate-400"
              />
            </div>
            
            <div className="w-full sm:w-[1px] h-[1px] sm:h-6 bg-slate-200 dark:bg-[#334155]" />
            
            <button 
              onClick={fetchTransactions} 
              className="w-full sm:w-auto bg-[#0F172A] dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity whitespace-nowrap flex items-center justify-center gap-2 shadow-md shrink-0"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* List Area */}
      <div className="w-full">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#1E293B] flex flex-col items-center justify-center py-32 rounded-3xl border border-slate-200 dark:border-[#334155] shadow-sm">
            <div className="w-16 h-16 bg-slate-50 dark:bg-[#0F172A] rounded-full flex items-center justify-center mb-4">
              <Receipt size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg">No transactions found.</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">Adjust your search or wait for new payments.</p>
          </div>
        ) : (
          <div className="w-full overflow-hidden">
            {/* Desktop Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 pb-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-[#334155] mb-4">
              <div className="col-span-4">Transaction Ref</div>
              <div className="col-span-3">Customer</div>
              <div className="col-span-2 text-right">Amount & Status</div>
              <div className="col-span-3 text-right">Actions & Date</div>
            </div>

            <div className="flex flex-col gap-4">
              {filtered.map((tx) => (
                <div
                  key={tx._id}
                  className="bg-white dark:bg-[#1E293B] rounded-[1.5rem] p-5 md:p-6 border border-slate-200 dark:border-[#334155] shadow-sm hover:shadow-md transition-shadow group"
                >
                  {/* Desktop Layout */}
                  <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4 flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-500/10 border border-slate-200 dark:border-blue-500/20 flex items-center justify-center shrink-0">
                        <CreditCard size={20} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Reference</p>
                        <span className="font-mono text-xs font-black text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 px-2.5 py-1 rounded-lg tracking-wider">
                          {tx.tx_ref}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-3 flex flex-col min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{tx.user?.name || "Unknown Traveler"}</p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">{tx.user?.email}</p>
                    </div>

                    <div className="col-span-2 text-right flex flex-col items-end">
                      <span className="text-base font-black text-slate-900 dark:text-white mb-1.5">
                        ETB {tx.amount.toLocaleString()}
                      </span>
                      {getStatusBadge(tx.status)}
                      
                      {tx.status === "refunded" && tx.refundAmount && (
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-widest mt-1">
                          Refund: ETB {tx.refundAmount}
                        </span>
                      )}
                    </div>

                    <div className="col-span-3 flex flex-col items-end gap-2">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {new Date(tx.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-xs font-medium text-slate-500 mb-2">
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>

                      {tx.status === "success" && (
                        <button
                          onClick={() => handleRefund(tx)}
                          disabled={refundingId === tx._id}
                          className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20 disabled:opacity-50 transition-colors border border-orange-200 dark:border-orange-500/20 flex items-center gap-1.5"
                        >
                          {refundingId === tx._id ? (
                            <><Loader2 size={12} className="animate-spin" /> Processing</>
                          ) : (
                            <><RefreshCw size={12} /> Refund</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="flex flex-col lg:hidden gap-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-500/10 border border-slate-200 dark:border-blue-500/20 flex items-center justify-center shrink-0">
                          <CreditCard size={18} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[150px]">{tx.user?.name || "Unknown Traveler"}</p>
                          <span className="font-mono text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 px-2 py-0.5 rounded-md mt-1 inline-block">
                            {tx.tx_ref}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-base font-black text-slate-900 dark:text-white">ETB {tx.amount.toLocaleString()}</span>
                        {getStatusBadge(tx.status)}
                      </div>
                    </div>

                    {tx.status === "refunded" && tx.refundAmount && (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 rounded-md self-start mt-1">
                        <span className="w-1 h-1 rounded-full bg-amber-500" />
                        <p className="text-[9px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-widest">
                          Refund: ETB {tx.refundAmount}
                        </p>
                      </div>
                    )}

                    <div className="bg-slate-50 dark:bg-[#0F172A] rounded-xl p-3 border border-slate-100 dark:border-[#334155] flex flex-col gap-2 mt-2">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                        <span>Date</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold">
                          {new Date(tx.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                        <span>Time</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold">
                          {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {tx.status === "success" && (
                      <div className="pt-2">
                        <button
                          onClick={() => handleRefund(tx)}
                          disabled={refundingId === tx._id}
                          className="w-full text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20 disabled:opacity-50 transition-colors border border-orange-200 dark:border-orange-500/20 flex items-center justify-center gap-1.5"
                        >
                          {refundingId === tx._id ? (
                            <><Loader2 size={12} className="animate-spin" /> Processing</>
                          ) : (
                            <><RefreshCw size={12} /> Process Refund</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
