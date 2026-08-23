"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, ShieldCheck, Loader2, Clock, CheckCircle2 } from "lucide-react";
import apiClient from "@/utils/apiClient";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";

const CATEGORY_KEYS = [
  { value: "technical", labelKey: "guidePages.contact.catTechnical" },
  { value: "booking", labelKey: "guidePages.contact.catBooking" },
  { value: "payout", labelKey: "guidePages.contact.catPayout" },
  { value: "verification", labelKey: "guidePages.contact.catVerification" },
] as const;

export default function ContactPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    subject: "",
    category: "technical" as typeof CATEGORY_KEYS[number]["value"],
    message: ""
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myTickets, setMyTickets] = useState<any[]>([]);

  const getCategoryLabel = (key: string) => {
    const found = CATEGORY_KEYS.find((c) => c.value === key);
    return found ? t(found.labelKey) : key;
  };

  useEffect(() => {
    const fetchMyTickets = async () => {
      try {
        const { data } = await apiClient.get("/support/my-tickets");
        setMyTickets(data.data || []);
      } catch (err) {
        console.error("Failed to fetch tickets", err);
      }
    };
    fetchMyTickets();
  }, [isSubmitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post("/support", {
        subject: `[${getCategoryLabel(formData.category)}] ${formData.subject}`,
        message: formData.message,
      });
      setIsSubmitted(true);
      toast.success("Support ticket submitted");
      setFormData({ subject: "", category: "technical", message: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${myTickets.length > 0 ? 'max-w-7xl' : 'max-w-3xl'} mx-auto pb-24 transition-all duration-500`}
    >
      <div className="mb-10">
        <h1 className="font-black text-4xl text-gray-900 dark:text-white tracking-tight mb-2">{t("guidePages.contact.title")}</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium">{t("guidePages.contact.subtitle")}</p>
      </div>

      <div className={myTickets.length > 0 ? "grid grid-cols-1 lg:grid-cols-2 gap-8 items-start" : "flex flex-col"}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-[#1E293B] backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm flex-1"
        >
          <h2 className="font-black text-xl text-gray-900 dark:text-white mb-8 border-b border-gray-100 dark:border-white/5 pb-6">{t("guidePages.contact.submitTicket")}</h2>

          {isSubmitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mb-6">
                <ShieldCheck size={48} className="text-emerald-500" />
              </div>
              <h3 className="font-black text-2xl text-gray-900 dark:text-white mb-2">{t("guidePages.contact.ticketReceived")}</h3>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-10 max-w-sm">{t("guidePages.contact.responseTime").replace("{email}", user?.email || "")}</p>
              <button type="button" onClick={() => setIsSubmitted(false)} className="px-6 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold transition-all shadow-sm hover:scale-[1.02]">
                {t("guidePages.contact.submitAnother")}
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{t("guidePages.contact.inquiryCategory")}</label>
                <select
                  className="w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#1A331B] focus:ring-1 focus:ring-[#1A331B] transition-all appearance-none cursor-pointer"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as typeof formData.category })}
                >
                  {CATEGORY_KEYS.map((cat) => (
                    <option key={cat.value} value={cat.value}>{t(cat.labelKey)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{t("guidePages.contact.subject")}</label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#1A331B] focus:ring-1 focus:ring-[#1A331B] transition-all"
                  placeholder={t("guidePages.contact.subjectPlaceholder")}
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{t("guidePages.contact.message")}</label>
                <textarea
                  required
                  className="w-full bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#1A331B] focus:ring-1 focus:ring-[#1A331B] transition-all min-h-[160px] resize-y leading-relaxed"
                  placeholder={t("guidePages.contact.messagePlaceholder")}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <div className="pt-4">
                <button type="submit" disabled={submitting} className="w-full sm:w-auto bg-gradient-to-r from-[#FF8C00] to-[#E65100] hover:from-[#E65100] hover:to-[#FF8C00] text-white px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-[#FF8C00]/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {submitting ? t("guidePages.contact.sending") : t("guidePages.contact.submitTicketBtn")}
                </button>
              </div>
            </form>
          )}
        </motion.div>

        {myTickets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#1E293B] backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm mt-8 lg:mt-0"
          >
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">{t("guidePages.contact.myTickets")}</h3>

            <div className="space-y-4">
              {myTickets.map((ticket, idx) => (
                <div key={idx} className="border border-gray-100 dark:border-white/5 rounded-2xl p-5 bg-gray-50/50 dark:bg-[#0F172A]/50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#FF8C00]">{ticket.subject}</span>
                      <p className="text-xs text-gray-500 mt-1">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      {ticket.status === "open" && <span className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-lg text-xs font-bold flex w-max items-center gap-1"><Clock size={12}/> {t("guidePages.contact.statusOpen")}</span>}
                      {ticket.status === "in_progress" && <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-lg text-xs font-bold flex w-max items-center gap-1">{t("guidePages.contact.statusInProgress")}</span>}
                      {ticket.status === "resolved" && <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg text-xs font-bold flex w-max items-center gap-1"><CheckCircle2 size={12}/> {t("guidePages.contact.statusResolved")}</span>}
                      {ticket.status === "closed" && <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 rounded-lg text-xs font-bold flex w-max items-center gap-1">{t("guidePages.contact.statusClosed")}</span>}
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-4">{ticket.message}</p>

                  {ticket.adminResponse && (
                    <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/10 p-4 rounded-xl mt-6">
                      <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest w-max mb-2">{t("guidePages.contact.adminReply")}</div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{ticket.adminResponse}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
