"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LifeBuoy, MessageSquare, Phone, Mail, FileText, 
  ChevronDown, AlertCircle, Send, CheckCircle2, Search, Clock
} from "lucide-react";
import { PageHeader } from "@/components/explorer/ui";
import Link from "next/link";
import toast from "react-hot-toast";

const getFaqs = (t: any) => [
  {
    category: t("support.catBookings"),
    items: [
      { q: t("support.q1"), a: t("support.a1") },
      { q: t("support.q2"), a: t("support.a2") },
      { q: t("support.q3"), a: t("support.a3") }
    ]
  },
  {
    category: t("support.catTours"),
    items: [
      { q: t("support.q4"), a: t("support.a4") },
      { q: t("support.q5"), a: t("support.a5") },
    ]
  }
];

export default function SupportPage() {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({ subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myTickets, setMyTickets] = useState<any[]>([]);

  useEffect(() => {
    const fetchMyTickets = async () => {
      try {
        const apiClient = (await import("@/utils/apiClient")).default;
        const { data } = await apiClient.get("/support/my-tickets");
        setMyTickets(data.data || []);
      } catch (err) {
        console.error("Failed to fetch tickets", err);
      }
    };
    fetchMyTickets();
  }, [submitted]);

  const toggleFaq = (idx: string) => {
    if (openFaq === idx) setOpenFaq(null);
    else setOpenFaq(idx);
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.message) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    try {
      const apiClient = (await import("@/utils/apiClient")).default;
      await apiClient.post("/support", form);
      setSubmitting(false);
      setSubmitted(true);
      toast.success("Support ticket created!");
      setForm({ subject: "", message: "" });
    } catch (err: any) {
      setSubmitting(false);
      toast.error(err.response?.data?.message || "Failed to create ticket");
    }
  };

  const filteredFaqs = getFaqs(t).map(category => ({
    ...category,
    items: category.items.filter(item => 
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <PageHeader
          title="Help & Support"
          subtitle={t("support.subtitle")}
          showBackButton={true}
        />
      </motion.div>

      {/* ── Emergency Alert Banner ── */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-black text-red-600 dark:text-red-400">{t("support.currentEmergency")}</h3>
            <p className="text-sm font-medium text-red-600/80 dark:text-red-400/80">{t("support.emergencyDesc")}</p>
          </div>
        </div>
        <a href="tel:+251111234567" className="w-full md:w-auto text-center px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black transition-colors shrink-0 shadow-lg shadow-red-500/20">
          +251 11 123 4567
        </a>
      </motion.div>

      {/* ── Horizontal Contact Us (PC/Tablet) ── */}
      <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-[2.5rem] border border-white/10 p-8 shadow-xl text-white relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8 mt-8">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF8C00]/10 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <LifeBuoy size={32} className="text-[#FF8C00]" /> 
          <h3 className="text-2xl font-black">{t("support.contactUs")}</h3>
        </div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Phone size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{t("support.generalInquiries")}</p>
              <p className="font-bold text-lg">+251 11 987 6543</p>
              <p className="text-xs text-gray-400 mt-0.5">{t("support.hours")}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Mail size={18} className="text-[#FF8C00]" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{t("support.emailSupport")}</p>
              <p className="font-bold text-lg text-white hover:text-[#FF8C00] transition-colors cursor-pointer">support@kambata.travel</p>
              <p className="text-xs text-gray-400 mt-0.5">{t("support.replyTime")}</p>
            </div>
          </div>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8 relative z-10 shrink-0 flex flex-col items-center">
          <Link href="/explorer-dashboard/messages" className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors whitespace-nowrap">
            <MessageSquare size={18} /> {t("support.openMessages")}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        
        {/* ── Left Column: FAQs & Search ── */}
        <div className="col-span-1 lg:col-span-6 space-y-8">
          <div className="bg-white dark:bg-[#1E293B] backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6">{t("support.faqs")}</h3>
            
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder={t("support.searchAnswers")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-200 dark:border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm bg-gray-50 dark:bg-[#0F172A] text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-bold">{t("support.noResults")}</p>
                <p className="text-sm">{t("support.tryDifferent")}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredFaqs.map((category, cIdx) => (
                  <div key={cIdx} className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 ml-2 mb-4">{category.category}</h4>
                    {category.items.map((item, iIdx) => {
                      const id = `${cIdx}-${iIdx}`;
                      const isOpen = openFaq === id;
                      return (
                        <div key={iIdx} className="border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden transition-all bg-gray-50/50 dark:bg-[#0F172A]/50">
                          <button 
                            onClick={() => toggleFaq(id)}
                            className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                          >
                            <span className="font-bold text-sm text-gray-900 dark:text-white pr-4">{item.q}</span>
                            <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                          </button>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-5 pt-0 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-white/5 mt-2">
                                  {item.a}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
  </div>
        </div>

        {/* ── Right Column: Send Message ── */}
        <div className="col-span-1 lg:col-span-6 space-y-8 h-full">
          
          <div className="bg-white dark:bg-[#1E293B] backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm flex flex-col h-full">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">{t("support.sendMessage")}</h3>
            
            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="font-black text-xl text-gray-900 dark:text-white mb-2">{t("support.messageSent")}</h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-6">{t("support.receivedRequest")}</p>
                <button onClick={() => setSubmitted(false)} className="px-6 py-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white rounded-xl text-sm font-bold transition-colors">
                  {t("support.sendAnother")}
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-5 flex-1 flex flex-col">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{t("support.subject")}</label>
                  <select 
                    value={form.subject}
                    onChange={e => setForm({...form, subject: e.target.value})}
                    className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm bg-gray-50 dark:bg-[#0F172A] text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-colors appearance-none"
                  >
                    <option value="" disabled>{t("support.selectTopic")}</option>
                    <option value="booking">{t("support.topicBooking")}</option>
                    <option value="payment">{t("support.topicPayment")}</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">{t("support.topicOther")}</option>
                  </select>
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{t("support.message")}</label>
                  <textarea 
                    value={form.message}
                    onChange={e => setForm({...form, message: e.target.value})}
                    placeholder="How can we help you today?"
                    className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm bg-gray-50 dark:bg-[#0F172A] text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-colors min-h-[120px] flex-1 resize-none"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-[#FF8C00] hover:bg-[#e67e22] text-white rounded-xl font-black transition-all shadow-lg shadow-[#FF8C00]/20 disabled:opacity-50 mt-4"
                >
                  {submitting ? "Sending..." : <><Send size={18} /> Submit Ticket</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

{/* My Tickets Section */}
          {myTickets.length > 0 && (
            <div className="bg-white dark:bg-[#1E293B] backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm">
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">{t("support.mySupportTickets")}</h3>
              
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">
                {myTickets.map((ticket, idx) => (
                  <div key={idx} className="border border-gray-100 dark:border-white/5 rounded-2xl p-5 bg-gray-50/50 dark:bg-[#0F172A]/50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#FF8C00]">{ticket.subject}</span>
                        <p className="text-xs text-gray-500 mt-1">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        {ticket.status === "open" && <span className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-lg text-xs font-bold flex w-max items-center gap-1"><Clock size={12}/> Open</span>}
                        {ticket.status === "in_progress" && <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-lg text-xs font-bold flex w-max items-center gap-1">In Progress</span>}
                        {ticket.status === "resolved" && <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg text-xs font-bold flex w-max items-center gap-1"><CheckCircle2 size={12}/> Resolved</span>}
                        {ticket.status === "closed" && <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 rounded-lg text-xs font-bold flex w-max items-center gap-1">Closed</span>}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-700 dark:text-gray-300 font-medium whitespace-pre-wrap break-words max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">{ticket.message}</div>
                    
                    {ticket.adminResponse && (
                      <div className="mt-5 pt-5 border-t border-gray-200 dark:border-white/5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-[4px] text-[10px] font-black uppercase tracking-widest flex w-max items-center gap-1.5">
                            <CheckCircle2 size={12}/> Admin Reply
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words leading-relaxed pl-3 border-l-[3px] border-emerald-500/30 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10 pr-2">
                          {ticket.adminResponse}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}


    </div>
  );
}
