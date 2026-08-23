"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import apiClient from "@/utils/apiClient";
import { Wallet, DollarSign, Clock, ArrowRightLeft, CreditCard, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function GuideWalletPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [wallet, setWallet] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [telebirr, setTelebirr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const { data } = await apiClient.get("/wallets/me");
      setWallet(data.wallet);
      setHistory(data.history);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) < 500) {
      return toast.error("Minimum withdrawal amount is 500 ETB");
    }
    if (!bankName && !telebirr) {
      return toast.error("Please provide Bank Info or Telebirr");
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/wallets/payout", {
        amount: Number(amount),
        bankName,
        accountNumber,
        accountHolder,
        telebirr
      });
      toast.success("Payout request submitted successfully!");
      setAmount("");
      setBankName("");
      setAccountNumber("");
      setAccountHolder("");
      setTelebirr("");
      fetchWallet();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit payout request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPayout = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this payout request?")) return;
    try {
      await apiClient.patch(`/wallets/payout/${id}/cancel`);
      toast.success("Payout request cancelled");
      fetchWallet();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to cancel request");
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      completed: t("guidePages.wallet.statusCompleted"),
      rejected: t("guidePages.wallet.statusRejected"),
      approved: t("guidePages.wallet.statusApproved"),
      cancelled: t("guidePages.wallet.statusCancelled"),
      pending: t("guidePages.wallet.statusPending"),
    };
    return map[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 mb-2">
          <Wallet className="text-emerald-500" /> {t("guidePages.wallet.title")}
        </h1>
        <p className="text-gray-500">{t("guidePages.wallet.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-3xl p-4 md:p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 md:gap-3 text-emerald-600 dark:text-emerald-400 mb-3 md:mb-4">
            <DollarSign size={18} className="md:w-6 md:h-6" />
            <h3 className="font-bold text-xs md:text-lg leading-tight">{t("guidePages.wallet.availableBalance")}</h3>
          </div>
          <p className="text-2xl md:text-4xl font-black text-emerald-700 dark:text-emerald-300">
            {wallet?.balance?.toLocaleString()} <span className="text-sm md:text-lg">ETB</span>
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-3xl p-4 md:p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 md:gap-3 text-amber-600 dark:text-amber-400 mb-3 md:mb-4">
            <Clock size={18} className="md:w-6 md:h-6" />
            <h3 className="font-bold text-xs md:text-lg leading-tight">{t("guidePages.wallet.pendingEarnings")}</h3>
          </div>
          <p className="text-2xl md:text-4xl font-black text-amber-700 dark:text-amber-300">
            {wallet?.pendingEarnings?.toLocaleString() || 0} <span className="text-sm md:text-lg">ETB</span>
          </p>
          <p className="text-[10px] md:text-xs text-amber-600/70 mt-1 md:mt-2 font-medium">{t("guidePages.wallet.awaitingClearance")}</p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-3xl p-4 md:p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 md:gap-3 text-blue-600 dark:text-blue-400 mb-3 md:mb-4">
            <ArrowRightLeft size={18} className="md:w-6 md:h-6" />
            <h3 className="font-bold text-xs md:text-lg leading-tight">{t("guidePages.wallet.pendingWithdrawals")}</h3>
          </div>
          <p className="text-2xl md:text-4xl font-black text-blue-700 dark:text-blue-300">
            {wallet?.pendingPayout?.toLocaleString()} <span className="text-sm md:text-lg">ETB</span>
          </p>
          <p className="text-[10px] md:text-xs text-blue-600/70 mt-1 md:mt-2 font-medium">{t("guidePages.wallet.awaitingApproval")}</p>
        </div>

        <div className="bg-gray-50 dark:bg-[#161B26]/50 border border-gray-200 dark:border-white/5 rounded-3xl p-4 md:p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 md:gap-3 text-gray-600 dark:text-gray-400 mb-3 md:mb-4">
            <Wallet size={18} className="md:w-6 md:h-6" />
            <h3 className="font-bold text-xs md:text-lg leading-tight">{t("guidePages.wallet.lifetimeEarnings")}</h3>
          </div>
          <p className="text-2xl md:text-4xl font-black text-gray-800 dark:text-gray-200">
            {wallet?.totalEarned?.toLocaleString()} <span className="text-sm md:text-lg">ETB</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-[#161B26]/60 border border-gray-100 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <CreditCard className="text-emerald-500" /> {t("guidePages.wallet.requestWithdrawal")}
          </h2>
          <form onSubmit={handlePayoutRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t("guidePages.wallet.amount")}</label>
              <input
                type="number"
                min="500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t("guidePages.wallet.minAmount")}
                className="w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-white/5">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-3">{t("guidePages.wallet.bankTransfer")}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t("guidePages.wallet.bankName")}</label>
                  <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder={t("guidePages.wallet.bankPlaceholder")} className="w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t("guidePages.wallet.accountNumber")}</label>
                  <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t("guidePages.wallet.accountHolder")}</label>
                  <input type="text" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} className="w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-white/5">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-3">{t("guidePages.wallet.telebirr")}</h4>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t("guidePages.wallet.phoneNumber")}</label>
                <input type="text" value={telebirr} onChange={(e) => setTelebirr(e.target.value)} placeholder={t("guidePages.wallet.telebirrPlaceholder")} className="w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white" />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting || !wallet || wallet.balance < 500} className="w-full mt-6 bg-[#1A331B] hover:bg-[#0F172A] disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all">
              {isSubmitting ? t("guidePages.wallet.submitting") : t("guidePages.wallet.submitRequest")}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-[#161B26]/60 border border-gray-100 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">{t("guidePages.wallet.recentRequests")}</h2>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t("guidePages.wallet.noHistory")}</p>
            ) : (
              history.map((req) => (
                <div key={req._id} className="p-4 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{req.amount.toLocaleString()} ETB</p>
                    <p className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</p>
                    {req.transactionReference && (
                      <p className="text-xs text-emerald-600 mt-1">{t("guidePages.wallet.ref")} {req.transactionReference}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      req.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                      req.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                      req.status === 'approved' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                      req.status === 'cancelled' ? 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                    }`}>
                      {statusLabel(req.status)}
                    </span>
                    {req.status === 'pending' && (
                      <button onClick={() => handleCancelPayout(req._id)} className="text-[10px] font-bold text-red-500 hover:text-red-600 dark:text-red-400 transition-colors">
                        {t("guidePages.wallet.cancelRequest")}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
