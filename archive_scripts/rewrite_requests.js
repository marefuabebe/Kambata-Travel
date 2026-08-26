const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/app/explorer-dashboard/my-requests/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find the start of the mapping function
const startToken = '{filteredRequests.map(req => (';
const startIndex = content.indexOf(startToken);
if (startIndex === -1) {
  console.log("Could not find map function start");
  process.exit(1);
}

const beforeContent = content.slice(0, startIndex + startToken.length);

const endToken = '            </motion.div>\n          ))}\n        </AnimatePresence>';
const endIndex = content.indexOf(endToken);
if (endIndex === -1) {
  console.log("Could not find map function end");
  process.exit(1);
}
const afterContent = content.slice(endIndex);

const newCardCode = `
            <motion.div 
              key={req._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1E293B]/60 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-[1.5rem] p-4 md:p-5 shadow-sm relative flex flex-col gap-4 overflow-hidden"
            >
              {/* Header Row: Title & Actions */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm">
                      {req.requestType?.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-bold text-gray-400">
                      Submitted on {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white tracking-tight">
                    {req.tourId ? req.tourId.title?.en : req.packageId?.name?.en || t("requests.travelExperience")}
                  </h3>
                </div>

                {/* Inline Status / Action Badges */}
                <div className="shrink-0 flex flex-wrap items-center justify-end gap-2">
                  {req.status === "awaiting_payment" && (
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A331B] text-emerald-400 border border-emerald-800/30 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm">
                        <CheckCircle2 size={12} /> {t("requests.status.actionRequired")}
                      </div>
                      <div className="flex items-center gap-2 bg-emerald-50 dark:bg-[#1E293B] border border-emerald-200 dark:border-white/10 px-3 py-1 rounded-lg shadow-sm">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Amount:</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                           {(req.finalPrice || req.customPrice * req.travelers).toLocaleString()} ETB
                        </span>
                      </div>
                      <div className="w-full sm:w-auto">
                        <PayNowButton request={req} t={t} compact={true} />
                      </div>
                    </div>
                  )}

                  {req.status === "guide_pending" && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-xs font-bold shadow-sm">
                      <CheckCircle2 size={14} /> {t("requests.status.assigningGuide")}
                    </div>
                  )}

                  {req.status === "pending_admin" && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-500 border border-amber-200 dark:border-amber-500/20 rounded-lg text-xs font-bold shadow-sm">
                      <Loader2 size={14} className="animate-spin" /> Under Review
                    </div>
                  )}

                  {(req.status === "declined_by_guide" || req.status === "rejected") && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-500 border border-red-200 dark:border-red-500/20 rounded-lg text-xs font-bold shadow-sm">
                      {t("requests.status.unavailable")}
                    </div>
                  )}

                  {req.status === "payment_expired" && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-500 border border-orange-200 dark:border-orange-500/20 rounded-lg text-xs font-bold shadow-sm">
                      {t("requests.status.expired")}
                    </div>
                  )}

                  {req.status === "confirmed" && (
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm">
                        <CheckCircle2 size={14} /> Payment Successful
                      </div>
                      <Link
                        href={\`/explorer-dashboard/bookings\`}
                        className="px-4 py-1.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white font-bold rounded-lg transition-colors text-xs shadow-sm"
                      >
                        {t("requests.status.viewDetails")}
                      </Link>
                    </div>
                  )}

                  {req.status === "expired" && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold shadow-sm">
                      {t("requests.status.expired")}
                    </div>
                  )}

                  {req.status === "cancelled" && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 border border-red-200 dark:border-red-500/20 rounded-lg text-xs font-bold shadow-sm">
                      {t("requests.status.cancelled")}
                    </div>
                  )}

                  {/* Cancel Button */}
                  {["pending_admin", "guide_pending", "awaiting_payment"].includes(req.status) && (
                    <button
                      onClick={async () => {
                        if (!confirm(t("requests.status.confirmCancel"))) return;
                        try {
                          await apiClient.patch(\`/requests/\${req._id}/cancel\`);
                          toast.success("Request cancelled successfully");
                          fetchRequests();
                        } catch (err: any) {
                          toast.error(err.response?.data?.message || "Failed to cancel request");
                        }
                      }}
                      className="px-3 py-1.5 text-[10px] font-bold text-red-600 hover:text-red-700 transition-colors bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-100 dark:border-red-500/20 rounded-lg shadow-sm"
                    >
                      {t("requests.status.cancelRequest")}
                    </button>
                  )}
                </div>
              </div>

              {/* Metadata Bar */}
              <div className="flex flex-wrap items-center gap-2 md:gap-3 bg-gray-50 dark:bg-white/5 px-3 py-2 rounded-xl border border-gray-100 dark:border-white/10 w-fit">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Calendar size={13} />
                  </div>
                  {(() => {
                    const startDate = new Date(req.preferredDate);
                    let endDate = null;
                    const duration = req.tourId?.duration || req.packageId?.duration;
                    
                    if (duration && duration.value && duration.unit === "days") {
                      endDate = new Date(startDate);
                      endDate.setDate(endDate.getDate() + duration.value - 1);
                    } else if (duration && duration.value && duration.unit === "weeks") {
                      endDate = new Date(startDate);
                      endDate.setDate(endDate.getDate() + (duration.value * 7) - 1);
                    }
                    
                    if (endDate && endDate.getTime() >= startDate.getTime()) {
                      if (endDate.getTime() === startDate.getTime()) {
                        return \`\${startDate.toLocaleDateString()} (1D)\`;
                      }
                      return \`\${startDate.toLocaleDateString()} - \${endDate.toLocaleDateString()}\`;
                    }
                    return startDate.toLocaleDateString();
                  })()}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 border-l border-gray-200 dark:border-gray-700 pl-2">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Clock size={13} />
                  </div>
                  {req.preferredTime || 'Flexible'}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 border-l border-gray-200 dark:border-gray-700 pl-2">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-[#FF8C00]">
                    <Users size={13} />
                  </div>
                  {req.travelers} {t("requests.travelers")}
                </div>
              </div>

              {/* Admin Notes */}
              {req.adminNotes && (
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl shadow-sm text-xs mt-2">
                  <p className="font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1"><Info size={12}/> {t("requests.messageFromAdmin")}</p>
                  <p className="font-medium text-blue-900 dark:text-blue-200 leading-relaxed">{req.adminNotes}</p>
                </div>
              )}

              {/* Horizontal Timeline */}
              <div className="mt-1 pt-3 border-t border-gray-100 dark:border-white/5 w-full">
                <RequestTimeline requestId={req._id} horizontal={true} />
              </div>
`;

fs.writeFileSync(filePath, beforeContent + '\n' + newCardCode + '\n' + afterContent, 'utf8');
console.log('Successfully rewrote layout');
