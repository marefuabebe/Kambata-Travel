"use client";

import { useEffect, useState } from "react";
import apiClient from "@/utils/apiClient";
import { Download, CheckCircle, XCircle, Clock, RotateCcw, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";

interface Transaction {
  _id: string;
  tx_ref: string;
  amount: number;
  status: "pending" | "success" | "failed" | "refunded";
  createdAt: string;
  booking?: {
    tour?: { title?: string | { en?: string } };
    scheduleStartDate?: string;
    scheduleEndDate?: string;
  };
  refundAmount?: number;
}

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data } = await apiClient.get("/payments/my-transactions");
      setTransactions(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async (tx_ref: string) => {
    try {
      const response = await apiClient.get(`/payments/invoice/${tx_ref}`, {
        responseType: "blob",
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${tx_ref}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Receipt downloaded");
    } catch (error) {
      toast.error("Failed to download receipt");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* ── Mobile Back Button ── */}
      <div className="lg:hidden mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0A0F1C] border border-gray-200 dark:border-white/10 rounded-xl text-gray-600 dark:text-gray-300 font-bold shadow-sm active:scale-95 transition-transform w-fit">
          <ChevronLeft size={18} />
          Back
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pt-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400 mb-2">Finance</p>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">{t("payments.title")}</h1>
          <p className="text-gray-400 dark:text-gray-500 mt-2 text-sm">{t("payments.subtitle")}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0A0F1C] backdrop-blur-xl rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {t("payments.noTransactions")}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t("payments.table.transactionRef")}</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t("payments.table.item")}</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t("payments.table.amount")}</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t("payments.table.status")}</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t("payments.table.date")}</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">{t("payments.table.receipt")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {transactions.map((tx) => {
                    let tourTitle = tx.booking?.tour?.title;
                    if (typeof tourTitle === "object" && tourTitle !== null) {
                       tourTitle = tourTitle.en;
                    }
                    if (!tourTitle) {
                       tourTitle = tx.tx_ref.includes("-PKG-") ? t("payments.packageBooking") : t("payments.tourBooking");
                    }

                    return (
                      <tr key={tx._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                            {tx.tx_ref}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900 dark:text-white max-w-[200px] truncate">
                            {tourTitle}
                          </p>
                          {(tx.booking?.scheduleStartDate || tx.booking?.scheduleEndDate) && (
                             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                               <Clock className="w-3.5 h-3.5 text-[#FF8C00]" />
                               {tx.booking.scheduleStartDate ? new Date(tx.booking.scheduleStartDate).toLocaleDateString() : ""}
                               {tx.booking.scheduleEndDate ? ` - ${new Date(tx.booking.scheduleEndDate).toLocaleDateString()}` : ""}
                             </p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            ETB {tx.amount.toLocaleString()}
                          </p>
                          {tx.status === "refunded" && tx.refundAmount && (
                             <p className="text-xs text-amber-600">{t("payments.refunded")} {tx.refundAmount}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {tx.status === "success" && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                            {tx.status === "failed" && <XCircle className="w-4 h-4 text-red-500" />}
                            {tx.status === "pending" && <Clock className="w-4 h-4 text-amber-500" />}
                            {tx.status === "refunded" && <RotateCcw className="w-4 h-4 text-blue-500" />}
                            
                            <span className={`text-xs font-medium capitalize
                              ${tx.status === "success" ? "text-emerald-700 dark:text-emerald-400" : ""}
                              ${tx.status === "failed" ? "text-red-700 dark:text-red-400" : ""}
                              ${tx.status === "pending" ? "text-amber-700 dark:text-amber-400" : ""}
                              ${tx.status === "refunded" ? "text-blue-700 dark:text-blue-400" : ""}
                            `}>
                              {tx.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {tx.status === "success" && (
                            <button
                              onClick={() => downloadReceipt(tx.tx_ref)}
                              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                              title={t("payments.downloadReceipt")}
                            >
                              <Download className="w-5 h-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-4 p-4">
              {transactions.map((tx) => {
                let tourTitle = tx.booking?.tour?.title;
                if (typeof tourTitle === "object" && tourTitle !== null) {
                   tourTitle = tourTitle.en;
                }
                if (!tourTitle) {
                   tourTitle = tx.tx_ref.includes("-PKG-") ? t("payments.packageBooking") : t("payments.tourBooking");
                }

                return (
                  <div key={tx._id} className="bg-white dark:bg-[#0A0F1C] p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-[10px] text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                          {tx.tx_ref}
                        </span>
                        <p className="text-sm font-bold text-gray-900 dark:text-white mt-2 leading-tight">
                          {tourTitle}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-900 px-2.5 py-1 rounded-full">
                        {tx.status === "success" && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                        {tx.status === "failed" && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                        {tx.status === "pending" && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                        {tx.status === "refunded" && <RotateCcw className="w-3.5 h-3.5 text-blue-500" />}
                        <span className={`text-[10px] font-bold uppercase tracking-wider
                          ${tx.status === "success" ? "text-emerald-700 dark:text-emerald-400" : ""}
                          ${tx.status === "failed" ? "text-red-700 dark:text-red-400" : ""}
                          ${tx.status === "pending" ? "text-amber-700 dark:text-amber-400" : ""}
                          ${tx.status === "refunded" ? "text-blue-700 dark:text-blue-400" : ""}
                        `}>
                          {tx.status}
                        </span>
                      </div>
                    </div>

                    {(tx.booking?.scheduleStartDate || tx.booking?.scheduleEndDate) && (
                       <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                         <Clock className="w-3 h-3 text-[#FF8C00]" />
                         {tx.booking.scheduleStartDate ? new Date(tx.booking.scheduleStartDate).toLocaleDateString() : ""}
                         {tx.booking.scheduleEndDate ? ` - ${new Date(tx.booking.scheduleEndDate).toLocaleDateString()}` : ""}
                       </p>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100 dark:border-slate-700">
                      <div>
                        <p className="text-sm font-black text-gray-900 dark:text-white">
                          ETB {tx.amount.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {tx.status === "success" && (
                        <button
                          onClick={() => downloadReceipt(tx.tx_ref)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {t("payments.downloadReceipt")}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
