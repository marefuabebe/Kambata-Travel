"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import {
  Calendar,
  Hotel,
  Package,
  Download,
  X,
  Loader2,
  CreditCard,
  User,
  AlertTriangle,
  QrCode,
  CheckCircle2,
  Smartphone,
  Clock,
  Copy,
} from "lucide-react";
import { PageHeader, LoadingCenter, EmptyState, StatusPill } from "@/components/explorer/ui";
import { tourTitle } from "@/utils/dashboardHelpers";
import { downloadInvoicePdf } from "@/utils/explorerTheme";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

type Tab = "tours" | "packages";

export default function MyBookingsPage() {
  const [tab, setTab] = useState<Tab>("tours");
  const [data, setData] = useState<{ tours: any[]; packages: any[] }>({
    tours: [],
    packages: [],
  });
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [passModal, setPassModal] = useState<{ id: string; type: "tour" | "package" } | null>(null);
  
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { t } = useLanguage();

  const fetchBookings = async () => {
    try {
      const { data: res } = await apiClient.get("/traveler/bookings");
      setData(res.data);
    } catch {
      toast.error("Could not load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const downloadInvoice = async (apiType: "tour" | "hotel" | "package", id: string) => {
    try {
      await downloadInvoicePdf(apiType, id);
      toast.success("Invoice downloaded");
    } catch {
      toast.error("Invoice download failed");
    }
  };

  const confirmCancel = async () => {
    if (!cancelId) return;
    setCanceling(true);
    try {
      await apiClient.patch(`/bookings/${cancelId}/status`, { status: "cancelled" });
      toast.success("Booking cancelled");
      setShowCancelModal(false);
      setCancelId(null);
      fetchBookings();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Cancel failed");
    } finally {
      setCanceling(false);
    }
  };

  const handleConfirmCompletion = async () => {
    if (!confirmId) return;
    setConfirming(true);
    try {
      await apiClient.post(`/bookings/${confirmId}/confirm-completion`);
      toast.success("Tour completion confirmed!");
      setShowConfirmModal(false);
      setConfirmId(null);
      fetchBookings();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to confirm completion");
    } finally {
      setConfirming(false);
    }
  };

  const handleOpenDispute = async (id: string) => {
    const reason = window.prompt("Please provide a reason for this dispute:");
    if (!reason) return;
    try {
      await apiClient.post(`/bookings/${id}/dispute`, { reason });
      toast.success("Dispute opened successfully. Admin will review.");
      fetchBookings();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to open dispute");
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof Calendar; count: number }[] = [
    { id: "tours", label: "Tour Bookings", icon: Calendar, count: data.tours.length },
    { id: "packages", label: "Package Bookings", icon: Package, count: data.packages.length },
  ];

  if (loading) return (
    <div className="flex-1 p-6 flex flex-col max-w-7xl mx-auto w-full">
      <PageHeader 
        title={t("bookings.title")} 
        subtitle={t("bookings.subtitle")} 
      />
      <LoadingCenter />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 pt-8 lg:pt-10 px-4 sm:px-0">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <PageHeader
          title={t("bookings.title")}
          subtitle={t("bookings.subtitle")}
          action={
            <Link
              href="/explorer-dashboard/explore-tours"
              className="group flex items-center gap-2 bg-[#FF8C00] hover:bg-[#e67e22] text-white px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg shadow-[#FF8C00]/20 hover:-translate-y-0.5"
            >
              Book New Adventure
            </Link>
          }
        />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2 }}
        className="flex bg-white dark:bg-[#1E293B] rounded-xl p-1 mb-8 w-max border border-gray-200 dark:border-white/10 shadow-sm relative z-[10]"
      >
        {(["tours", "packages"] as Tab[]).map((tName) => (
          <button
            key={tName}
            onClick={() => setTab(tName)}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold capitalize transition-all relative ${
              tab === tName 
                ? "text-gray-900 dark:text-white" 
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            {tab === tName && (
              <motion.div layoutId="bookings-tab" className="absolute inset-0 bg-gray-100 dark:bg-white/10 rounded-lg -z-10" />
            )}
            {t(`bookings.tabs.${tName}`)}
          </button>
        ))}
      </motion.div>

      {data[tab].length === 0 ? (
        <EmptyState 
          title={t("bookings.empty.title")}
          description={t("bookings.empty.subtitle")}
        />
      ) : (
        <ul className="grid gap-6">
          <AnimatePresence>
            {tab === "tours" &&
              data.tours.map((b, idx) => (
                <motion.div key={b._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                  <BookingCard
                    refLabel={b.referenceNumber || b._id.slice(-8).toUpperCase()}
                    title={tourTitle(b.tour)}
                    image={b.tour?.images?.[0]}
                    status={b.status}
                    paymentStatus={b.paymentStatus}
                    date={b.scheduleStartDate 
                      ? `${new Date(b.scheduleStartDate).toLocaleDateString()}${b.scheduleEndDate ? ` - ${new Date(b.scheduleEndDate).toLocaleDateString()}` : ''}`
                      : new Date(b.createdAt).toLocaleDateString()}
                    extra={
                      b.guide && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                          <p className="text-xs font-bold text-gray-900 dark:text-white">{b.guide.name}</p>
                        </div>
                      )
                    }
                    price={b.totalPrice}
                    actions={
                      <>
                        {b.status === "confirmed" && (
                          <div className="flex flex-wrap gap-2 pt-3 md:pt-0">
                            <button 
                              onClick={() => downloadInvoice("tour", b._id)}
                              className="text-xs font-bold bg-white dark:bg-[#2A2A2A] text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:border-primary/50 hover:text-primary transition-colors flex items-center gap-1.5"
                            >
                              <Download size={14} /> {t("bookings.actions.downloadInvoice")}
                            </button>
                            <button 
                              onClick={() => setPassModal({ id: b._id, type: "tour" })}
                              className="text-xs font-bold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-light transition-colors flex items-center gap-1.5 shadow-sm shadow-primary/20"
                            >
                              <QrCode size={14} /> {t("bookings.actions.digitalPass")}
                            </button>
                          </div>
                        )}

                        <div className="flex gap-2 flex-wrap pt-3 md:pt-0">
                          {b.status === 'pending' && (
                            <button
                              onClick={() => { setCancelId(b._id); setShowCancelModal(true); }}
                              className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                            >
                              {t("bookings.actions.cancelBooking")}
                            </button>
                          )}
                          {b.status === 'confirmed' && b.payoutStatus === 'pending_clearance' && (
                             <button
                               onClick={() => { setConfirmId(b._id); setShowConfirmModal(true); }}
                               className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                             >
                               {t("bookings.actions.confirmCompletion")}
                             </button>
                          )}
                        </div>
                      </>
                    }
                  />
                </motion.div>
              ))}

            {tab === "packages" &&
              data.packages.map((b, idx) => {
                const pkgName = typeof b.packageId?.name === "object" ? (b.packageId?.name?.en || b.packageId?.name?.am) : b.packageId?.name;
                return (
                <motion.div key={b._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                  <BookingCard
                    refLabel={b.referenceNumber || b.tx_ref || b._id.slice(-8).toUpperCase()}
                    title={pkgName || "Travel Package"}
                    image={b.packageId?.tour?.images?.[0]}
                    status={b.bookingStatus}
                    paymentStatus={b.paymentStatus}
                    date={b.packageScheduleId?.startDate 
                      ? `${new Date(b.packageScheduleId.startDate).toLocaleDateString()}${b.packageScheduleId.endDate ? ` - ${new Date(b.packageScheduleId.endDate).toLocaleDateString()}` : ''}`
                      : new Date(b.createdAt).toLocaleDateString()}
                    price={b.totalPrice}
                    actions={
                      <>
                        {((b.bookingStatus === "pending" || b.paymentStatus === "pending" || b.status === "pending_payment") && b.bookingStatus !== "expired" && b.bookingStatus !== "cancelled" && b.paymentStatus !== "failed") && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const { data } = await apiClient.post(`/payments/initiate-package/${b._id}`);
                                if (data?.data?.checkout_url) window.location.href = data.data.checkout_url;
                              } catch (e: any) {
                                toast.error(e.response?.data?.message || "Payment unavailable");
                              }
                            }}
                            className="text-xs font-bold text-[#FF8C00] bg-[#FF8C00]/10 hover:bg-[#FF8C00]/20 px-3 py-1.5 rounded-lg border border-[#FF8C00]/20 flex items-center gap-1.5 transition-colors"
                          >
                            <CreditCard size={14} /> Pay Now
                          </button>
                        )}
                        {b.paymentStatus === "paid" && (b.status === "confirmed" || b.status === "completed" || b.bookingStatus === "confirmed" || b.bookingStatus === "completed") && (
                          <button
                            type="button"
                            onClick={() => setPassModal({ id: b._id, type: "package" })}
                            className="text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                          >
                            <QrCode size={14} /> Show Pass
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => downloadInvoice("package", b._id)}
                          className="text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 transition-colors"
                        >
                          <Download size={14} /> Invoice
                        </button>
                        <Link
                          href={`/explorer-dashboard/bookings/${b._id}`}
                          className="text-xs font-bold bg-[#1A331B] text-white px-4 py-1.5 rounded-lg hover:-translate-y-0.5 transition-all shadow-md"
                        >
                          View Details
                        </Link>
                      </>
                    }
                  />
                </motion.div>
                );
              })}
          </AnimatePresence>
        </ul>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-white/10 rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-2xl"
          >
            <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={36} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Cancel booking?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">This action cannot be undone. Refunds will be processed according to our standard cancellation policy.</p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelId(null);
                }}
                className="flex-1 py-4 rounded-2xl font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={confirmCancel}
                disabled={canceling}
                className="flex-1 py-4 rounded-2xl font-black bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 shadow-lg shadow-red-600/20"
              >
                {canceling ? "Cancelling…" : "Yes, Cancel"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-white/10 rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-2xl"
          >
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Confirm Tour Completion</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
              Are you sure you want to confirm that this tour was completed successfully? This will finalize the booking and release payment to your guide.
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmId(null);
                }}
                className="flex-1 py-4 rounded-2xl font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCompletion}
                disabled={confirming}
                className="flex-1 py-4 rounded-2xl font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 shadow-lg shadow-emerald-600/20"
              >
                {confirming ? "Confirming…" : "Yes, Confirm"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Digital Pass Modal */}
      {passModal && (
        <DigitalPassModal
          id={passModal.id}
          type={passModal.type}
          onClose={() => setPassModal(null)}
        />
      )}
    </div>
  );
}

function BookingCard({
  refLabel,
  title,
  image,
  status,
  paymentStatus,
  date,
  extra,
  price,
  actions,
}: {
  refLabel: string;
  title: string;
  image?: string;
  status: string;
  paymentStatus?: string;
  date: string;
  extra?: React.ReactNode;
  price?: number;
  actions?: React.ReactNode;
}) {
  return (
    <li className="bg-white dark:bg-[#1E293B] backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-white/5 p-3 flex flex-col sm:flex-row shadow-sm hover:shadow-xl dark:shadow-none hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all group overflow-hidden relative">
      
      
      <div className="w-full h-40 sm:h-auto sm:max-h-44 sm:w-48 shrink-0 rounded-2xl overflow-hidden relative">
        <img loading="lazy"
          src={image || "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037994/kambata/xbsw2ajsabbtz4tuwjvl.jpg"}
          alt="Image"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
      </div>
      
      <div className="p-3 sm:px-5 sm:py-2 flex-1 flex flex-col relative z-10">
        <div className="flex flex-col gap-1 mb-2">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="bg-gray-100 dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
              REF: {refLabel}
            </span>
            <StatusPill status={status} />
            {paymentStatus && <StatusPill status={paymentStatus} />}
          </div>
          <h3 className="font-black text-xl md:text-2xl text-gray-900 dark:text-white tracking-tight group-hover:text-[#1A331B] dark:group-hover:text-emerald-400 transition-colors leading-tight">{title}</h3>
          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1.5 mt-0.5">
            <Calendar size={12} /> {date}
          </span>
        </div>
        
        {extra}
        
        <div className="mt-auto pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 dark:border-white/5">
          {price != null ? (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Total Amount</p>
              <p className="font-black text-lg text-[#1A331B] dark:text-emerald-400 leading-none">ETB {price.toLocaleString()}</p>
            </div>
          ) : <div />}
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        </div>
      </div>
    </li>
  );
}

function PayButton({ bookingId }: { bookingId: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          const { data } = await apiClient.post(`/payments/initiate/${bookingId}`);
          if (data?.data?.checkout_url) window.location.href = data.data.checkout_url;
        } catch (e: any) {
          toast.error(e.response?.data?.message || "Payment failed");
        }
      }}
      className="text-xs font-bold text-[#FF8C00] bg-[#FF8C00]/10 hover:bg-[#FF8C00]/20 px-4 py-2.5 rounded-xl border border-[#FF8C00]/20 flex items-center gap-2 transition-colors"
    >
      <CreditCard size={14} /> Pay Now
    </button>
  );
}

function PayHotelButton({ bookingId }: { bookingId: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          const { data } = await apiClient.post(`/payments/initiate-hotel/${bookingId}`);
          if (data?.data?.checkout_url) window.location.href = data.data.checkout_url;
        } catch (e: any) {
          toast.error(e.response?.data?.message || "Payment failed");
        }
      }}
      className="text-xs font-bold text-[#FF8C00] bg-[#FF8C00]/10 hover:bg-[#FF8C00]/20 px-4 py-2.5 rounded-xl border border-[#FF8C00]/20 flex items-center gap-2 transition-colors"
    >
      <CreditCard size={14} /> Pay Now
    </button>
  );
}

export function DigitalPassModal({
  id,
  type = "tour",
  onClose,
}: {
  id: string;
  type?: "tour" | "package";
  onClose: () => void;
}) {
  const [qrData, setQrData] = useState<{
    qrCodeImage: string | null;
    referenceNumber: string;
    status: string;
    tourStatus?: string;
    checkedInAt?: string;
    travelerName?: string;
    travelerEmail?: string;
    travelerImage?: string;
    tourName?: string;
    tourImage?: string;
    guideName?: string;
    guideEmail?: string;
    guideImage?: string;
    validUntil?: string;
    completedAt?: string;
    tourDate?: string;
    endDate?: string;
    meetingTime?: string;
    meetingPoint?: string;
    isLocked?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const passRef = React.useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient
      .get(`/qr/pass/${id}?type=${type}&t=${Date.now()}`)
      .then(({ data }) => setQrData(data.data))
      .catch((e) => setError(e?.response?.data?.message || "Could not load pass"))
      .finally(() => setLoading(false));
  }, [id, type]);

  const isCheckedIn = !!qrData?.checkedInAt;
  const isCompleted = qrData?.tourStatus === 'completed';

  const handleDownload = async () => {
    if (!qrData || !passRef.current || isDownloading) return;
    
    setIsDownloading(true);
    toast.loading("Generating PDF Ticket...", { id: "pdf-toast" });
    
    try {
      // Small delay to ensure styles are fully applied
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(passRef.current, {
        scale: 2, // Higher resolution
        useCORS: true, // Allow loading external images
        backgroundColor: "#ffffff",
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height], // Match canvas dimensions precisely
      });
      
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`Kambata-Pass-${qrData.referenceNumber}.pdf`);
      
      toast.success("Ticket downloaded successfully!", { id: "pdf-toast" });
    } catch (err) {
      console.error("PDF generation failed", err);
      toast.error("Failed to generate PDF.", { id: "pdf-toast" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopy = () => {
    if (!qrData) return;
    navigator.clipboard.writeText(qrData.referenceNumber);
    toast.success("Booking code copied!");
  };

  return (
    <div
      className="fixed inset-0 z-[200] overflow-y-auto bg-black/40 backdrop-blur-xl"
      onClick={onClose}
    >
      <div className="flex min-h-full items-start justify-center p-4 pt-24 pb-32 md:pb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg relative shrink-0"
        >
        
        {/* Main Card */}
        <div ref={passRef} className={`rounded-[2rem] shadow-2xl overflow-hidden relative border border-white/20 ${isCompleted ? 'bg-[#0f172a]' : 'bg-white dark:bg-[#1E293B]'}`}>
          
          {/* Header Area */}
          {isCompleted ? (
            <div className="relative h-32 sm:h-40 w-full overflow-hidden">
              <img loading="lazy" src={qrData?.tourImage || "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037994/kambata/xbsw2ajsabbtz4tuwjvl.jpg"} alt={qrData?.tourName} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/0 via-amber-500/10 to-amber-500/0 translate-x-[-100%] animate-[shimmer_3s_infinite]" />
              
              <div className="absolute top-0 left-0 right-0 p-4 text-center">
                <p className="text-white/80 text-[10px] uppercase tracking-[0.4em] font-black mb-1 drop-shadow-md">Kambata Travel</p>
                <h2 className="text-white font-black text-xl tracking-[0.2em] drop-shadow-lg leading-tight mt-1">
                  DIGITAL SOUVENIR
                </h2>
              </div>
              
              <button onClick={onClose} aria-label="Close modal" className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-20 bg-black/40 hover:bg-black/60 p-1.5 rounded-full backdrop-blur-md">
                <X size={18} />
              </button>

              <div className="absolute bottom-4 left-6 right-6 flex flex-col justify-end">
                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-0.5">Epic Journey</p>
                <p className="text-white font-black text-2xl leading-tight drop-shadow-lg line-clamp-2">{qrData?.tourName}</p>
              </div>

              {/* Ticket Notches Top */}
              <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-[#0f172a] rounded-full shadow-inner z-10" />
              <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-[#0f172a] rounded-full shadow-inner z-10" />
            </div>
          ) : (
            <div className={`p-5 text-center ${isCheckedIn ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-[#1A331B] to-[#2C522D]'} relative overflow-hidden`}>
              <p className="text-white/80 text-[10px] uppercase tracking-[0.4em] font-black mb-1 relative z-10">Kambata Travel</p>
              <h2 className="text-white font-black text-xl sm:text-2xl tracking-[0.2em] relative z-10 drop-shadow-md leading-tight">
                DIGITAL TRAVEL PASS
              </h2>
              <button onClick={onClose} aria-label="Close modal" className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-20 bg-black/20 hover:bg-black/40 p-1.5 rounded-full backdrop-blur-sm">
                <X size={18} />
              </button>
              
              {/* Ticket Notches Top */}
              <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-white dark:bg-[#1E293B] rounded-full shadow-inner z-10" />
              <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-white dark:bg-[#1E293B] rounded-full shadow-inner z-10" />
            </div>
          )}

          {/* Dotted separator line */}
          <div className="border-b-[3px] border-dashed border-gray-200 dark:border-white/10 relative z-20" />

          {/* Body Content */}
          <div className={`px-5 sm:px-8 pt-5 pb-6 sm:pb-8 ${isCompleted ? 'bg-[#0f172a] text-white' : ''} relative`}>
            
            {/* Confetti overlay for souvenir */}
            {isCompleted && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[10%] left-[20%] w-3 h-3 bg-amber-500 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute top-[40%] right-[15%] w-2 h-2 bg-pink-500 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1s' }} />
                <div className="absolute bottom-[20%] left-[30%] w-4 h-4 bg-cyan-500 rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
              </div>
            )}

            {loading && (
              <div className="h-64 flex flex-col items-center justify-center gap-4">
                <Loader2 size={40} className="animate-spin text-emerald-500" />
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Generating Secure Pass...</p>
              </div>
            )}
            
            {error && (
              <div className="h-64 flex flex-col items-center justify-center gap-4 text-center">
                <AlertTriangle size={40} className="text-red-500" />
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{error}</p>
              </div>
            )}

            {qrData && !loading && (
              <div className="space-y-4 relative z-10">
                
                {/* Active Pass Title */}
                {!isCompleted && (
                  <div className="text-center mb-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tour Experience</p>
                    <p className="font-black text-xl sm:text-2xl text-gray-900 dark:text-white leading-tight">{qrData.tourName || "Kambata Experience"}</p>
                  </div>
                )}

                {/* 2-Column Grid for Traveler and Guide */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <img loading="lazy" src={qrData.travelerImage || "/images/default-avatar.png"} alt={qrData.travelerName || "Traveler"} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-white/20 shrink-0 bg-white" />
                    <div className="flex flex-col overflow-hidden">
                      <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${isCompleted ? 'text-white/50' : 'text-gray-400'}`}>Traveler</p>
                      <p className={`font-black text-sm truncate ${isCompleted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{qrData.travelerName || "Guest"}</p>
                      {qrData.travelerEmail && <p className={`text-[10px] font-bold truncate ${isCompleted ? 'text-white/60' : 'text-gray-500'}`}>{qrData.travelerEmail}</p>}
                    </div>
                  </div>
                  <div className="flex items-center sm:flex-row-reverse gap-3 sm:text-right">
                    <img loading="lazy" src={qrData.guideImage || "/images/default-avatar.png"} alt={qrData.guideName || "Guide"} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-white/20 shrink-0 bg-white" />
                    <div className="flex flex-col overflow-hidden sm:items-end">
                      <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${isCompleted ? 'text-white/50' : 'text-gray-400'}`}>Guide</p>
                      <p className={`font-black text-sm truncate ${isCompleted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{qrData.guideName || "Assigned Soon"}</p>
                      {qrData.guideEmail && <p className={`text-[10px] font-bold truncate ${isCompleted ? 'text-white/60' : 'text-gray-500'}`}>{qrData.guideEmail}</p>}
                    </div>
                  </div>
                </div>

                {/* Booking Code with Copy Icon */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 px-4 rounded-xl border border-dashed border-gray-300 dark:border-white/20 bg-white/50 dark:bg-black/20">
                  <div className="flex flex-col text-center sm:text-left">
                    <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${isCompleted ? 'text-white/50' : 'text-gray-400'}`}>Booking Code</p>
                    <p className={`font-black text-xl font-mono tracking-widest ${isCompleted ? 'text-amber-400 drop-shadow-md' : 'text-gray-900 dark:text-white'}`}>
                      {qrData.referenceNumber}
                    </p>
                  </div>
                  <button 
                    onClick={handleCopy}
                    className={`p-3 rounded-xl transition-colors ${isCompleted ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300'}`}
                    aria-label="Copy booking code"
                  >
                    <Copy size={20} />
                  </button>
                </div>

                {/* Status Badges */}
                <div className="flex flex-col items-center py-2">
                  <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${isCompleted ? 'text-white/50' : 'text-gray-400'}`}>Current Status</p>
                  {isCompleted ? (
                    <div className="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-amber-500" />
                      <span className="font-black text-xs uppercase tracking-widest text-amber-500">Completed</span>
                    </div>
                  ) : isCheckedIn ? (
                    <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span className="font-black text-xs uppercase tracking-widest text-emerald-500">Checked In</span>
                    </div>
                  ) : qrData?.isLocked ? (
                    <div className="px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-500" />
                      <span className="font-black text-xs uppercase tracking-widest text-red-500">Expired</span>
                    </div>
                  ) : (
                    <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center gap-2">
                      <Clock size={14} className="text-blue-500" />
                      <span className="font-black text-xs uppercase tracking-widest text-blue-500">Ready for Check-In</span>
                    </div>
                  )}
                </div>

                {/* 3-Column Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-dashed border-gray-200 dark:border-white/10">
                  <div className="flex flex-col text-center sm:text-left">
                    <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${isCompleted ? 'text-white/50' : 'text-gray-400'}`}>
                      {isCompleted ? "Tour Dates" : "Tour Dates"}
                    </p>
                    <p className={`font-bold text-sm ${isCompleted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {qrData.tourDate ? new Date(qrData.tourDate).toLocaleDateString() : "TBD"}
                      {qrData.endDate ? ` - ${new Date(qrData.endDate).toLocaleDateString()}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-col text-center">
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isCompleted ? 'text-white/50' : 'text-gray-400'}`}>
                      {isCompleted ? "Check-In Date" : "Meeting Time"}
                    </p>
                    <p className={`font-bold text-sm ${isCompleted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {isCompleted 
                        ? (qrData.checkedInAt ? new Date(qrData.checkedInAt).toLocaleDateString() : "N/A") 
                        : (qrData.meetingTime || "See Itinerary")}
                    </p>
                  </div>

                  <div className="flex flex-col text-center sm:text-right">
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isCompleted ? 'text-white/50' : 'text-gray-400'}`}>
                      {isCompleted ? "Completed Date" : "Meeting Point"}
                    </p>
                    <p className={`font-bold text-sm ${isCompleted ? 'text-amber-400' : 'text-gray-900 dark:text-white'} ${!isCompleted ? 'truncate max-w-[150px] sm:max-w-full sm:ml-auto' : ''}`} title={!isCompleted ? qrData.meetingPoint : undefined}>
                      {isCompleted 
                        ? (qrData.completedAt ? new Date(qrData.completedAt).toLocaleDateString() : "N/A") 
                        : (qrData.meetingPoint || "See Itinerary")}
                    </p>
                  </div>
                </div>

                {/* QR Code or Stamp Area */}
                <div className="flex justify-center pt-4 pb-1">
                  {isCompleted ? (
                    <motion.div 
                      initial={{ scale: 0.8, rotate: -5, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.2 }}
                      className="relative px-8 py-4 rounded-3xl border-4 border-amber-500/80 shadow-[0_0_50px_rgba(245,158,11,0.2)] bg-amber-500/10 backdrop-blur-md overflow-hidden group flex items-center justify-center flex-col"
                    >
                      <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-20 mix-blend-overlay"></div>
                      <div className="flex items-center gap-2 relative z-10">
                        <CheckCircle2 size={24} className="text-amber-400" strokeWidth={3} />
                        <p className="font-black text-2xl sm:text-3xl text-amber-400 uppercase tracking-widest drop-shadow-md">
                          COMPLETED
                        </p>
                      </div>
                    </motion.div>
                  ) : qrData?.isLocked && !isCheckedIn ? (
                    <motion.div 
                      initial={{ scale: 0.8, rotate: -5, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.2 }}
                      className="relative px-8 py-4 rounded-3xl border-4 border-red-500/80 shadow-[0_0_50px_rgba(239,68,68,0.2)] bg-red-500/10 backdrop-blur-md overflow-hidden group flex items-center justify-center flex-col"
                    >
                      <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-20 mix-blend-overlay"></div>
                      <div className="flex items-center gap-2 relative z-10">
                        <AlertTriangle size={24} className="text-red-500" strokeWidth={3} />
                        <p className="font-black text-2xl sm:text-3xl text-red-500 uppercase tracking-widest drop-shadow-md">
                          EXPIRED
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className={`p-3 rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 ${isCheckedIn ? 'opacity-40 grayscale-[0.8]' : ''}`}>
                      <img loading="lazy" src={qrData.qrCodeImage || ""} alt="Digital Pass QR" className="w-40 h-40 sm:w-48 sm:h-48 rounded-xl object-contain" />
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Section */}
        {qrData && !loading && (
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/10 text-gray-900 dark:text-white p-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-all shadow-xl hover:-translate-y-1 disabled:opacity-50"
            >
              {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} 
              {isDownloading ? "Generating PDF..." : "Download Pass (PDF)"}
            </button>
            <button 
              onClick={handleCopy}
              className="flex-1 bg-black text-white dark:bg-white dark:text-black p-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl hover:-translate-y-1"
            >
              <Copy size={18} /> Copy Booking Code
            </button>
          </div>
        )}
        
        <style jsx global>{`
          @keyframes shimmer {
            100% {
              transform: translateX(100%);
            }
          }
        `}</style>
        
        </motion.div>
      </div>
    </div>
  );
}
