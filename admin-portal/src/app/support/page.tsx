"use client";

import React, { useState, useEffect } from "react";
import { LifeBuoy, Search, Eye, CheckCircle, Clock, Calendar, X, User } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [responseMsg, setResponseMsg] = useState("");
  const [status, setStatus] = useState("");

  const fetchTickets = async () => {
    try {
      const apiClient = (await import("@/utils/apiClient")).default;
      const { data } = await apiClient.get("/support");
      setTickets(data.data || []);
      setLoading(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch tickets");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleRespond = async () => {
    try {
      const apiClient = (await import("@/utils/apiClient")).default;
      await apiClient.patch(`/support/${selectedTicket._id}/respond`, {
        adminResponse: responseMsg,
        status: status,
      });
      toast.success("Ticket updated successfully");
      setSelectedTicket(null);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update ticket");
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.user?.name?.toLowerCase().includes(search.toLowerCase()) || 
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-[#F8FAFC] p-4 md:p-8 space-y-8 font-sans">
      
      {/* Header & Sticky Filter Bar */}
      <div className="sticky top-0 z-50 bg-slate-50/90 dark:bg-[#0F172A]/90 backdrop-blur-md pt-4 pb-4 border-b border-slate-200 dark:border-[#334155] space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">Support Tickets</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Manage traveler inquiries, issues, and feedback.</p>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or subject..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] rounded-2xl outline-none focus:border-[#FF8C00] dark:focus:border-[#FF8C00] text-sm shadow-sm transition-colors text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      <div className="w-full">
        {loading ? (
          <div className="flex justify-center py-32">
            <div className="w-10 h-10 border-4 border-slate-200 dark:border-[#334155] border-t-[#FF8C00] rounded-full animate-spin" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white dark:bg-[#1E293B] flex flex-col items-center justify-center py-32 rounded-3xl border border-slate-200 dark:border-[#334155] shadow-sm">
            <div className="w-16 h-16 bg-slate-50 dark:bg-[#0F172A] rounded-full flex items-center justify-center mb-4">
              <LifeBuoy size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-semibold">No tickets found for "{search}".</p>
          </div>
        ) : (
          <div className="w-full overflow-hidden">
            {/* Desktop & Tablet Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 pb-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-[#334155] mb-4">
              <div className="col-span-3">User</div>
              <div className="col-span-4">Subject</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            <motion.div 
              initial="hidden" 
              animate="show" 
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.05 } }
              }}
              className="flex flex-col gap-4"
            >
              {filteredTickets.map((ticket) => {
                const isResolved = ticket.status === "resolved";
                const isClosed = ticket.status === "closed";
                const isOpen = ticket.status === "open";
                const isInProgress = ticket.status === "in_progress";

                return (
                  <motion.div
                    key={ticket._id}
                    variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                    className="bg-white dark:bg-[#1E293B] rounded-2xl md:rounded-[20px] p-5 md:p-6 border border-slate-200 dark:border-[#334155] shadow-sm hover:shadow-md transition-shadow relative group"
                  >
                    {/* Desktop & Tablet Layout (Grid) */}
                    <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-3 flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#0F172A] flex items-center justify-center shrink-0 border border-slate-200 dark:border-[#334155] text-slate-500 font-bold text-sm">
                          {ticket.user?.name ? ticket.user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{ticket.user?.name || "Unknown"}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{ticket.user?.email}</p>
                        </div>
                      </div>

                      <div className="col-span-4 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate capitalize">{ticket.subject}</p>
                      </div>

                      <div className="col-span-2">
                        {isOpen && <span className="px-2 py-1 bg-[#FF8C00]/10 text-[#FF8C00] rounded-lg text-[10px] font-bold flex w-max items-center gap-1 uppercase tracking-wider"><Clock size={12}/> Open</span>}
                        {isInProgress && <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-[10px] font-bold flex w-max items-center gap-1 uppercase tracking-wider">In Progress</span>}
                        {isResolved && <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-bold flex w-max items-center gap-1 uppercase tracking-wider"><CheckCircle size={12}/> Resolved</span>}
                        {isClosed && <span className="px-2 py-1 bg-slate-500/10 text-slate-500 rounded-lg text-[10px] font-bold flex w-max items-center gap-1 uppercase tracking-wider">Closed</span>}
                      </div>

                      <div className="col-span-2">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>

                      <div className="col-span-1 flex justify-end">
                        <button 
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setResponseMsg(ticket.adminResponse || "");
                            setStatus(ticket.status);
                          }}
                          className="p-2 bg-slate-50 dark:bg-[#0F172A] text-[#FF8C00] hover:bg-[#FF8C00] hover:text-white rounded-xl transition-colors border border-slate-200 dark:border-[#334155]"
                          title="View Ticket"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Mobile Layout (Stacked per User Spec) */}
                    <div className="flex flex-col md:hidden">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-base text-slate-500"><User size={16} /></div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 dark:text-white truncate">{ticket.user?.name || "Unknown"}</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate capitalize">{ticket.subject}</p>
                      </div>

                      <div className="w-full h-[1px] bg-slate-100 dark:bg-[#334155] mb-4" />

                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4">
                        <span className="text-slate-500"><Calendar size={16} /></span>
                        {new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-2">
                          {isOpen && <span className="flex items-center gap-1 text-sm font-bold text-[#FF8C00]"><span className="w-3 h-3 rounded-full bg-[#FF8C00] animate-pulse"/> Open</span>}
                          {isInProgress && <span className="flex items-center gap-1 text-sm font-bold text-blue-500"><span className="w-3 h-3 rounded-full bg-blue-500"/> In Progress</span>}
                          {isResolved && <span className="flex items-center gap-1 text-sm font-bold text-emerald-500"><CheckCircle size={14} /> Resolved</span>}
                          {isClosed && <span className="flex items-center gap-1 text-sm font-bold text-slate-500"><span className="w-3 h-3 rounded-full bg-slate-500"/> Closed</span>}
                        </div>
                        
                        <button 
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setResponseMsg(ticket.adminResponse || "");
                            setStatus(ticket.status);
                          }}
                          className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-[#FF8C00] dark:hover:text-[#FF8C00] transition-colors"
                        >
                          <span><Eye size={16} /></span>
                          View Ticket
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        )}
      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[100] bg-[#0F172A] backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-[#1E293B] rounded-[24px] p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-[#334155] shadow-xl"
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">Support Ticket</h2>
              <button onClick={() => setSelectedTicket(null)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-[#0F172A] rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-[#0F172A] p-5 rounded-2xl border border-slate-200 dark:border-[#334155]">
                <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-[#334155] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-[#1E293B] flex items-center justify-center shrink-0 border border-slate-200 dark:border-[#334155] text-slate-500 font-bold text-sm">
                      {selectedTicket.user?.name ? selectedTicket.user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{selectedTicket.user?.name}</p>
                      <p className="text-xs font-semibold text-slate-500">{selectedTicket.user?.email}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white capitalize mb-2">Subject: {selectedTicket.subject}</h4>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{selectedTicket.message}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Update Status</label>
                  <select 
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] px-4 py-3 rounded-xl outline-none text-sm font-semibold text-slate-900 dark:text-white focus:border-[#FF8C00] dark:focus:border-[#FF8C00] transition-colors cursor-pointer"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Admin Response</label>
                <textarea 
                  value={responseMsg}
                  onChange={e => setResponseMsg(e.target.value)}
                  placeholder="Type a response to the traveler..."
                  className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] px-4 py-3 rounded-xl outline-none min-h-[120px] text-sm font-medium resize-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#FF8C00] dark:focus:border-[#FF8C00] transition-colors"
                />
                <p className="text-xs font-semibold text-slate-400 mt-2">Note: This updates the ticket record.</p>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-200 dark:border-[#334155]">
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="px-6 py-3 bg-slate-100 dark:bg-[#0F172A] hover:bg-slate-200 dark:hover:bg-[#1E293B] text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors text-sm w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRespond}
                  className="px-6 py-3 bg-[#FF8C00] hover:bg-[#e67e00] text-white rounded-xl font-black transition-colors text-sm shadow-md w-full sm:w-auto flex justify-center items-center"
                >
                  Save Updates
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
