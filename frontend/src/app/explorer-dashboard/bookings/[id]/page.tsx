"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import apiClient from "@/utils/apiClient";
import { downloadInvoicePdf } from "@/utils/explorerTheme";
import toast from "react-hot-toast";
import { 
  ArrowLeft, CheckCircle2, Clock, MapPin, Download, QrCode, 
  MessageSquare, LifeBuoy, FileText, Star, X, AlertTriangle, 
  Users, Hotel, CreditCard, Hash, Calendar, Loader2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<any>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [qrError, setQrError] = useState("");
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchDigitalPass = async () => {
    setLoadingQR(true);
    setShowQR(true);
    setQrError("");
    try {
      // Try fetching as tour first
      let res;
      try {
        res = await apiClient.get(`/traveler/bookings/tour/${params.id}/pass?t=${Date.now()}`);
      } catch (e) {
        // Fallback to package
        res = await apiClient.get(`/traveler/bookings/package/${params.id}/pass?t=${Date.now()}`);
      }
      setQrCodeData(res.data.data);
    } catch (e: any) {
      setQrError(e.response?.data?.message || "Failed to generate pass");
    } finally {
      setLoadingQR(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!bookingData) return;
    try {
      setDownloadingInvoice(true);
      const apiType = bookingData._type === "Tour" ? "tour" : bookingData._type === "Package" ? "package" : "hotel";
      await downloadInvoicePdf(apiType, bookingData._id);
      toast.success("Invoice downloaded successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to download invoice");
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const [bookingData, setBookingData] = useState<any>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  React.useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data } = await apiClient.get("/traveler/bookings");
        
        let foundBooking = null;
        let type = "";
        
        const tour = data.data.tours.find((b: any) => b._id === params.id);
        if (tour) { foundBooking = tour; type = "Tour"; }
        
        const pkg = data.data.packages.find((b: any) => b._id === params.id);
        if (pkg) { foundBooking = pkg; type = "Package"; }
        
        const hotel = data.data.hotels.find((b: any) => b._id === params.id);
        if (hotel) { foundBooking = hotel; type = "Hotel"; }
        
        if (foundBooking) {
           setBookingData({ ...foundBooking, _type: type });
        } else {
           const availableIds = [
             ...(data.data.tours || []).map((t: any) => t._id),
             ...(data.data.packages || []).map((p: any) => p._id)
           ];
           setErrorMsg(`Booking ${params.id} not found. Available IDs: ${availableIds.join(', ')}`);
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "Network error fetching booking");
      } finally {
        setLoadingBooking(false);
      }
    };
    if (params.id) {
      fetchBooking();
    }
  }, [params.id]);

  const booking = bookingData ? {
    id: bookingData.referenceNumber || bookingData.tx_ref || bookingData._id.slice(-8).toUpperCase(),
    title: bookingData._type === "Tour" ? (bookingData.tour?.title?.en || bookingData.tour?.title) 
      : bookingData._type === "Package" ? (bookingData.packageId?.name?.en || bookingData.packageId?.name) 
      : bookingData.hotel?.name || "Booking",
    type: bookingData._type,
    date: bookingData._type === "Tour" ? new Date(bookingData.scheduleStartDate || bookingData.createdAt).toLocaleDateString() 
      : bookingData._type === "Package" ? new Date(bookingData.packageScheduleId?.startDate || bookingData.createdAt).toLocaleDateString()
      : `${new Date(bookingData.checkInDate).toLocaleDateString()} - ${new Date(bookingData.checkOutDate).toLocaleDateString()}`,
    duration: (() => {
      if (bookingData._type === "Tour") {
        const d = bookingData.tour?.duration;
        const val = typeof d === "object" ? (d?.value || d?.days || 1) : (d || 1);
        return `${val} Days`;
      }
      if (bookingData._type === "Package") {
        const d = bookingData.packageId?.duration;
        const val = typeof d === "object" ? (d?.value || d?.days || 1) : (d || 1);
        return `${val} Days`;
      }
      return "N/A";
    })(),
    travelers: bookingData.travelersCount || bookingData.groupSize || 1,
    roomsBooked: bookingData.roomsBooked,
    roomType: bookingData.roomType?.name,
    status: bookingData.status || bookingData.bookingStatus,
    paymentStatus: bookingData.paymentStatus,
    paymentMethod: bookingData.paymentMethod || (bookingData.chapaPaymentDetails ? "Chapa" : "Telebirr / Card"),
    txRef: bookingData.tx_ref || bookingData.referenceNumber || bookingData._id.slice(-8).toUpperCase(),
    paidDate: (bookingData.paidAt || bookingData.updatedAt) 
      ? new Date(bookingData.paidAt || bookingData.updatedAt).toLocaleDateString() 
      : "N/A",
    price: `${bookingData.totalPrice?.toLocaleString() || 0} ETB`,
    guide: bookingData.guide ? {
      name: bookingData.guide.name,
      rating: typeof bookingData.guide.rating === 'object' ? bookingData.guide.rating?.average : (bookingData.guide.rating || "4.9"),
      reviews: typeof bookingData.guide.rating === 'object' ? bookingData.guide.rating?.numReviews : (bookingData.guide.reviews || "128"),
      photo: bookingData.guide.profilePicture || `https://ui-avatars.com/api/?name=${bookingData.guide.name}&background=random`,
      bio: bookingData.guide.bio || "Local expert."
    } : null,
    timeline: [
      { step: t("bookings.timeline.bookingConfirmed"), date: new Date(bookingData.createdAt).toLocaleDateString(), completed: true },
      { step: t("bookings.timeline.paymentReceived"), date: new Date(bookingData.updatedAt).toLocaleDateString(), completed: bookingData.paymentStatus === 'paid' },
      { step: t("bookings.timeline.guideAssigned"), date: "N/A", completed: !!bookingData.guide },
      { step: t("bookings.timeline.tourCompleted"), date: "N/A", completed: bookingData.status === 'completed' || bookingData.bookingStatus === 'completed' },
    ],
    documents: [
      { name: "Booking Invoice", type: "PDF", size: "1.2 MB" },
    ]
  } : null;

  if (loadingBooking) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF8C00]"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <AlertTriangle size={48} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Booking not found</h2>
        {errorMsg && <p className="text-sm mt-2 text-red-500 max-w-md text-center">{errorMsg}</p>}
        <button onClick={() => router.back()} className="mt-4 text-[#FF8C00] font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto pb-12 space-y-8 pt-8 lg:pt-10 px-4 sm:px-0"
    >
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold text-sm transition-colors"
      >
        <ArrowLeft size={16} /> {t("bookings.details.backToBookings")}
      </button>

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              <CheckCircle2 size={12} /> {booking.status}
            </span>
            <span className="text-gray-400 dark:text-gray-500 font-bold text-sm">{booking.id}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter mb-2">{booking.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-600 dark:text-gray-300">
            <p className="flex items-center gap-2"><Clock size={16} className="text-[#FF8C00]" /> {booking.date} ({booking.duration})</p>
            <p className="flex items-center gap-2"><MapPin size={16} className="text-emerald-500" /> {booking.type}</p>
            <p className="flex items-center gap-2"><Users size={16} className="text-blue-500" /> {booking.travelers} Travelers</p>
            {booking.type === 'Package' && booking.roomsBooked && (
              <p className="flex items-center gap-2">
                <Hotel size={16} className="text-purple-500" /> 
                {booking.roomsBooked} Room{booking.roomsBooked > 1 ? 's' : ''} ({booking.roomType || 'Standard'})
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchDigitalPass}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FF8C00] text-white font-black text-sm hover:bg-[#e67e00] hover:-translate-y-0.5 transition-all shadow-lg shadow-[#FF8C00]/20"
          >
            <QrCode size={18} /> {t("bookings.actions.digitalPass")}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 mt-8">
        
        {/* ── Left Column ── */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* {t("bookings.details.bookingTimeline")} */}
          <div className="bg-white dark:bg-[#1E293B] backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-8 flex items-center gap-2">
              <Clock size={14} className="text-[#FF8C00]" /> {t("bookings.details.bookingTimeline")}
            </h2>
            <div className="relative border-l-2 border-emerald-500/20 ml-4 space-y-8 pb-4">
              {booking.timeline.map((item, idx) => (
                <div key={idx} className="relative pl-8">
                  <span className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-white dark:border-[#1E293B] flex items-center justify-center ${item.completed ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    {item.completed && <CheckCircle2 size={10} className="text-white" />}
                  </span>
                  <div>
                    <h4 className={`font-bold text-sm ${item.completed ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                      {item.step}
                    </h4>
                    {item.completed && (
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1.5">{item.date}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guide Profile Card or Package Coordinator */}
          <div className="bg-white dark:bg-[#1E293B] backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm">
             <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6 flex items-center gap-2">
              <MapPin size={14} className="text-[#FF8C00]" /> {booking.guide ? t("bookings.details.yourGuide") : "Package Coordinator"}
            </h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <img loading="lazy" src={booking.guide ? booking.guide.photo : "https://ui-avatars.com/api/?name=Kambata+Support&background=0D8ABC&color=fff"} alt={booking.guide ? booking.guide.name : "Support"} className="w-24 h-24 rounded-2xl object-cover shrink-0 shadow-md" />
              <div className="flex-1">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{booking.guide ? booking.guide.name : "Kambata Travel Team"}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <Star size={16} className="text-amber-400 fill-amber-400" />
                  <span className="font-bold text-gray-900 dark:text-white text-sm">{booking.guide ? booking.guide.rating : "5.0"}</span>
                  <span className="text-gray-400 text-sm">({booking.guide ? booking.guide.reviews : "24/7"} support)</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{booking.guide ? booking.guide.bio : "Your dedicated support team for this package. We coordinate all your tours and hotel stays."}</p>
              </div>
              <Link
                href={`/explorer-dashboard/messages?support=true`}
                className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 font-bold text-sm text-gray-900 dark:text-white hover:border-[#145A41] transition-all"
              >
                <MessageSquare size={16} className="text-[#FF8C00]" /> {booking.guide ? t("bookings.actions.messageGuide") : "Message Support"}
              </Link>
            </div>
          </div>

        </div>

        {/* ── Right Column ── */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Unified Payment & Documents Card */}
          <div className="bg-white dark:bg-[#1E293B] backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm space-y-6">
            {/* ── Section 1: Payment Summary ── */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-2">
                  <CreditCard size={14} className="text-emerald-500" /> Payment Summary
                </h2>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${
                  booking.paymentStatus === 'paid' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' 
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                }`}>
                  {booking.paymentStatus === 'paid' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                  {booking.paymentStatus}
                </span>
              </div>

              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Total Amount</span>
                  <span className="font-black text-xl text-gray-900 dark:text-white tracking-tight">{booking.price}</span>
                </div>
                
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-white/5 pt-3">
                  <span className="font-medium flex items-center gap-1.5 text-xs text-gray-500"><CreditCard size={13} className="text-gray-400" /> Method</span>
                  <span className="font-bold text-gray-900 dark:text-white text-xs">{booking.paymentMethod}</span>
                </div>

                <div className="flex justify-between items-center text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-white/5 pt-3">
                  <span className="font-medium flex items-center gap-1.5 text-xs text-gray-500"><Hash size={13} className="text-gray-400" /> Transaction Ref</span>
                  <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#0F172A] px-2 py-0.5 rounded-md border border-gray-100 dark:border-white/5">
                    {booking.txRef}
                  </span>
                </div>

                <div className="flex justify-between items-center text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-white/5 pt-3">
                  <span className="font-medium flex items-center gap-1.5 text-xs text-gray-500"><Calendar size={13} className="text-gray-400" /> Paid Date</span>
                  <span className="font-bold text-gray-900 dark:text-white text-xs">{booking.paidDate}</span>
                </div>
              </div>
            </div>

            {/* ── Section 2: Documents & Receipts Divider ── */}
            <div className="border-t border-dashed border-gray-200 dark:border-white/10 pt-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-2">
                <FileText size={14} className="text-[#FF8C00]" /> {t("bookings.details.documentsReceipts")}
              </h3>

              <div className="space-y-3">
                {/* Official Booking Invoice (PDF) */}
                <button
                  type="button"
                  onClick={handleDownloadInvoice}
                  disabled={downloadingInvoice}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-[#FF8C00]/30 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-500 shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-gray-900 dark:text-white group-hover:text-[#FF8C00] transition-colors truncate">
                        Official Tax Invoice & Receipt
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-0.5">
                        PDF • Official Receipt
                      </p>
                    </div>
                  </div>
                  <div className="p-1.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-400 group-hover:text-[#FF8C00] group-hover:bg-[#FF8C00]/10 transition-all shrink-0 ml-2">
                    {downloadingInvoice ? (
                      <Loader2 size={14} className="animate-spin text-[#FF8C00]" />
                    ) : (
                      <Download size={14} />
                    )}
                  </div>
                </button>

                {/* Digital Travel Pass quick launch */}
                <button
                  type="button"
                  onClick={fetchDigitalPass}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-emerald-500/30 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-500 shrink-0">
                      <QrCode size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors truncate">
                        Digital Boarding Pass
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mt-0.5">
                        QR Code • Verification Pass
                      </p>
                    </div>
                  </div>
                  <div className="p-1.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-400 group-hover:text-emerald-500 group-hover:bg-emerald-500/10 transition-all shrink-0 ml-2">
                    <QrCode size={14} />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Help & Support */}
          <div className="bg-gradient-to-br from-[#FF8C00] to-orange-500 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2" />
            <h2 className="text-xs font-black uppercase tracking-widest text-white/70 mb-4 flex items-center gap-2 relative z-10">
              <LifeBuoy size={14} /> Need Help?
            </h2>
            <h3 className="text-2xl font-black mb-2 relative z-10">24/7 Support</h3>
            <p className="text-white/80 text-sm font-medium mb-6 relative z-10">
              Have a question about your upcoming trip? We're here to help.
            </p>
            <Link
              href="/explorer-dashboard/messages?support=true"
              className="inline-flex w-full items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-[#FF8C00] font-black text-sm hover:bg-gray-50 transition-colors relative z-10"
            >
              Contact Support
            </Link>
          </div>

        </div>
      </div>

      {/* ── Digital Pass Modal (Portal to body to prevent stacking context overlap) ── */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {showQR && (
            <div
              className="fixed inset-0 z-[99999] overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
              onClick={() => setShowQR(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm my-auto relative"
              >
                {/* Boarding Pass Container */}
                <div className="bg-white dark:bg-[#1E293B] rounded-[2rem] shadow-2xl overflow-hidden relative border border-white/20">
                  
                  {/* Header */}
                  <div className={`p-6 text-center ${qrCodeData?.checkedInAt ? 'bg-emerald-600' : 'bg-[#1A331B]'} relative`}>
                    <p className="text-white/80 text-[10px] uppercase tracking-[0.3em] font-black mb-1">Kambata Travel</p>
                    <h2 className="text-white font-black text-xl tracking-wide">DIGITAL TRAVEL PASS</h2>
                    <button 
                      onClick={() => setShowQR(false)} 
                      aria-label="Close"
                      className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-black/20 hover:bg-black/40 p-1.5 rounded-full"
                    >
                      <X size={18} />
                    </button>
                    {/* Ticket Notches Top */}
                    <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-white dark:bg-[#1E293B] rounded-full" />
                    <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-white dark:bg-[#1E293B] rounded-full" />
                  </div>

                  <div className="border-b-2 border-dashed border-gray-200 dark:border-white/10 relative" />

                  {/* Body Content */}
                  <div className="p-6">
                    {loadingQR && (
                      <div className="h-64 flex flex-col items-center justify-center gap-4">
                        <Loader2 size={36} className="animate-spin text-[#1A331B] dark:text-emerald-400" />
                        <p className="text-sm font-bold text-gray-500">Generating secure pass...</p>
                      </div>
                    )}
                    
                    {qrError && (
                      <div className="h-64 flex flex-col items-center justify-center gap-3 text-center">
                        <AlertTriangle size={32} className="text-red-500" />
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{qrError}</p>
                      </div>
                    )}
                    
                    {qrCodeData && !loadingQR && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Traveler</p>
                            <p className="font-bold text-gray-900 dark:text-white truncate">{qrCodeData.travelerName || "Guest"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Guide</p>
                            <p className="font-bold text-gray-900 dark:text-white truncate">{qrCodeData.guideName || "Assigned Soon"}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Tour</p>
                            <p className="font-black text-lg text-gray-900 dark:text-white truncate">{qrCodeData.tourName || booking.title}</p>
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl text-center border border-gray-100 dark:border-white/5">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Booking Code</p>
                          <p className="font-black text-2xl text-gray-900 dark:text-white font-mono tracking-wider">
                            {qrCodeData.referenceNumber}
                          </p>
                        </div>

                        {/* QR Code */}
                        <div className="flex justify-center">
                          <div className={`p-3 rounded-2xl bg-white shadow-inner ${qrCodeData.checkedInAt ? 'opacity-60' : ''}`}>
                            <img loading="lazy" src={qrCodeData.qrCodeImage} alt="Digital Pass QR" className="w-48 h-48 rounded-xl object-contain" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 items-center">
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Valid Until</p>
                            <p className="font-bold text-gray-900 dark:text-white text-sm">
                              {qrCodeData.validUntil ? new Date(qrCodeData.validUntil).toLocaleDateString() : "End of Tour"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Status</p>
                            {qrCodeData.checkedInAt ? (
                              <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm flex items-center justify-end gap-1">
                                <CheckCircle2 size={14} /> Checked In
                              </p>
                            ) : (
                              <p className="font-black text-amber-600 dark:text-amber-400 text-sm flex items-center justify-end gap-1">
                                <Clock size={14} /> Ready
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </motion.div>
  );
}
