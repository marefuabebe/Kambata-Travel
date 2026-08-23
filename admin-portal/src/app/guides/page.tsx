"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  CheckCircle,
  XCircle,
  FileText,
  Loader2,
  Award,
  Mail,
  Phone,
  MapPin,
  ShieldAlert,
  BadgeCheck,
  MessageCircle,
  ShieldCheck,
  Clock,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";

interface GuideProfile {
  _id: string;
  bio?: { en: string; am: string };
  languages?: string[];
  experienceYears?: number;
  age?: number;
  nationalId?: { url: string; status: string };
  license?: { url: string; status: string };
  isVerified?: boolean;
}

interface GuideApplicant {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  guideStatus: string;
  isEmailVerified: boolean;
  createdAt: string;
  profilePicture?: string;
  guideProfile?: GuideProfile;
}

type TabKey = "pending" | "approved";

function getStatusBadge(app: GuideApplicant, tab: TabKey) {
  if (tab === "pending") {
    return {
      label: "Pending Review",
      className:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
    };
  }
  if (app.guideProfile?.isVerified) {
    return {
      label: "Verified",
      className:
        "bg-orange-50 text-[#FF8C00] border-orange-200 dark:bg-[#FF8C00]/10 dark:text-orange-300 dark:border-[#FF8C00]/30",
    };
  }
  if (app.isEmailVerified) {
    return {
      label: "Active",
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
    };
  }
  return {
    label: "Unverified",
    className:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#0A0F1C] dark:text-slate-300 dark:border-slate-600",
  };
}

function GuideAvatar({ name, src, size = "md" }: { name: string; src?: string; size?: "md" | "lg" }) {
  const dim = size === "lg" ? "w-20 h-20 text-3xl" : "w-14 h-14 text-xl";
  const inner = size === "lg" ? "rounded-[22px]" : "rounded-[18px]";

  if (src) {
    return (
      <div
        className={`${dim} shrink-0 rounded-[20px] p-[2px] bg-gradient-to-br from-[#FF8C00] via-orange-300 to-amber-200 dark:from-[#FF8C00] dark:via-orange-600 dark:to-amber-900 shadow-sm`}
      >
        <img src={src} alt={name} className={`${inner} w-full h-full object-cover border border-white/80 dark:border-[#1E293B]`} />
      </div>
    );
  }

  return (
    <div
      className={`${dim} shrink-0 rounded-[20px] p-[2px] bg-gradient-to-br from-[#FF8C00] via-orange-300 to-amber-100 dark:from-[#FF8C00] dark:via-orange-700 dark:to-amber-950 shadow-sm`}
    >
      <div
        className={`${inner} w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-white dark:from-[#1E293B] dark:to-[#0F172A] text-[#FF8C00] font-black border border-white/60 dark:border-[#334155]`}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    </div>
  );
}

function InfoChip({
  icon: Icon,
  label,
  tone = "neutral",
}: {
  icon: React.ElementType;
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const tones = {
    neutral: "bg-[#F8FAFC] text-slate-600 border-[#E2E8F0] dark:bg-[#0F172A] dark:text-slate-300 dark:border-[#334155]",
    success:
      "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
    warning:
      "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
    danger:
      "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 max-w-full px-2.5 py-1 rounded-full text-[11px] font-semibold border truncate ${tones[tone]}`}
      title={label}
    >
      <Icon size={12} className="shrink-0 opacity-70" />
      <span className="truncate">{label}</span>
    </span>
  );
}

export default function GuideAppsPage() {
  const [applications, setApplications] = useState<GuideApplicant[]>([]);
  const [approvedGuides, setApprovedGuides] = useState<GuideApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<GuideApplicant | null>(null);
  const router = useRouter();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingRes, approvedRes] = await Promise.all([
        apiClient.get("/guides/applications"),
        apiClient.get("/guides"),
      ]);
      setApplications(pendingRes.data || []);
      setApprovedGuides(approvedRes.data || []);
    } catch {
      toast.error("Failed to load guide data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id);
      await apiClient.post(`/guides/${id}/approve`);
      toast.success("Guide approved successfully");
      fetchData();
    } catch {
      toast.error("Failed to approve guide");
    } finally {
      setProcessingId(null);
    }
  };

  const handleVerify = async (id: string, isVerified: boolean) => {
    try {
      setProcessingId(id);
      await apiClient.patch(`/guides/${id}/verify`, {
        isVerified,
        badge: isVerified ? "Top Rated Local" : "",
      });
      toast.success(isVerified ? "Guide successfully verified" : "Verification badge revoked");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to verify guide. Ensure they uploaded their documents.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt("Enter reason for rejection (sent to applicant):");
    if (reason === null) return;

    try {
      setProcessingId(id);
      await apiClient.post(`/guides/${id}/reject`, { reason });
      toast.success("Guide application rejected");
      fetchData();
    } catch {
      toast.error("Failed to reject guide");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRequestDocuments = async (id: string) => {
    try {
      setProcessingId(id);
      await apiClient.post(`/guides/${id}/request-documents`);
      toast.success("Document request sent to the guide");
    } catch {
      toast.error("Failed to send document request");
    } finally {
      setProcessingId(null);
    }
  };

  const currentList = activeTab === "pending" ? applications : approvedGuides;
  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "pending", label: "Pending Review", count: applications.length },
    { key: "approved", label: "Active Guides", count: approvedGuides.length },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-[#F8FAFC] dark:bg-[#0F172A]">
        <Loader2 className="animate-spin text-[#FF8C00]" size={36} />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading verification queue…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] pb-24 overflow-x-hidden">
      {/* Sticky header + tabs */}
      <div className="sticky top-0 z-30 border-b border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC]/90 dark:bg-[#0F172A]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Guide Onboarding
                </h1>
                {applications.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-[#FF8C00] text-white shadow-sm shadow-[#FF8C00]/25">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {applications.length} pending
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl">
                Enterprise verification dashboard — review credentials, approve guides, and manage trust badges.
              </p>
            </div>

            <div className="flex p-1 rounded-2xl bg-white dark:bg-[#0A0F1C] border border-[#E2E8F0] dark:border-[#334155] shadow-sm relative w-full lg:w-auto overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex-1 lg:flex-none min-w-[140px] px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                    activeTab === tab.key
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="guideOnboardingTab"
                      className="absolute inset-0 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {tab.label}
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                        activeTab === tab.key
                          ? "bg-[#FF8C00]/15 text-[#FF8C00]"
                          : "bg-slate-100 dark:bg-[#334155] text-slate-500"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <AnimatePresence mode="wait">
          {currentList.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-[24px] border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0A0F1C] shadow-sm p-10 sm:p-14 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-[20px] bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center">
                <Award className="text-slate-300 dark:text-slate-600" size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {activeTab === "pending" ? "Inbox zero" : "No active guides"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                {activeTab === "pending"
                  ? "There are no pending guide applications to review at this moment."
                  : "There are currently no approved guides on the platform. Review pending applications to add more."}
              </p>
            </motion.div>
          ) : (
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {currentList.map((app, index) => {
                const status = getStatusBadge(app, activeTab);
                const isProcessing = processingId === app._id;
                const hasNationalId = !!app.guideProfile?.nationalId?.url;
                const hasLicense = !!app.guideProfile?.license?.url;

                return (
                  <motion.article
                    key={app._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.25 }}
                    className="group rounded-[24px] border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0A0F1C] shadow-sm hover:shadow-md hover:border-[#FF8C00]/30 dark:hover:border-[#FF8C00]/40 transition-all duration-200 overflow-hidden"
                  >
                    <div className="p-4 sm:p-5">
                      {/* Header row */}
                      <div className="flex gap-3 sm:gap-4 min-w-0">
                        <GuideAvatar name={app.name} src={app.profilePicture} />

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                                  {app.name}
                                </h3>
                                {app.guideProfile?.isVerified && (
                                  <BadgeCheck className="text-[#FF8C00] shrink-0" size={18} />
                                )}
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${status.className}`}
                                >
                                  {status.label}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                                <Clock size={11} />
                                Applied {new Date(app.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                              </p>
                            </div>
                          </div>

                          {/* Info chips */}
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            <InfoChip icon={Mail} label={app.email} />
                            <InfoChip icon={Phone} label={app.phone || "No phone"} tone={app.phone ? "neutral" : "warning"} />
                            <InfoChip icon={MapPin} label={app.location || "No location"} tone={app.location ? "neutral" : "warning"} />
                            <InfoChip
                              icon={app.isEmailVerified ? ShieldCheck : ShieldAlert}
                              label={app.isEmailVerified ? "Email verified" : "Email unverified"}
                              tone={app.isEmailVerified ? "success" : "danger"}
                            />
                          </div>

                          {/* Documents — compact inline for pending */}
                          {activeTab === "pending" && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              <DocumentPill label="National ID" ready={hasNationalId} url={app.guideProfile?.nationalId?.url} />
                              <DocumentPill label="Tour License" ready={hasLicense} url={app.guideProfile?.license?.url} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 pt-4 border-t border-[#E2E8F0] dark:border-[#334155]">
                        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                          <ActionBtn
                            onClick={() => router.push(`/messages?guideId=${app._id}`)}
                            icon={MessageCircle}
                            label="Message"
                            variant="success"
                          />
                          <ActionBtn onClick={() => setSelectedGuide(app)} icon={Users} label="Profile" variant="neutral" />

                          {activeTab === "pending" ? (
                            <>
                              <ActionBtn
                                onClick={() => handleRequestDocuments(app._id)}
                                disabled={isProcessing}
                                loading={isProcessing}
                                icon={Mail}
                                label="Request Docs"
                                variant="info"
                              />
                              <ActionBtn
                                onClick={() => handleReject(app._id)}
                                disabled={isProcessing}
                                icon={XCircle}
                                label="Reject"
                                variant="danger"
                              />
                              <ActionBtn
                                onClick={() => handleApprove(app._id)}
                                disabled={isProcessing}
                                loading={isProcessing}
                                icon={BadgeCheck}
                                label="Verify & Activate"
                                variant="primary"
                                className="sm:ml-auto"
                              />
                            </>
                          ) : !app.guideProfile?.isVerified ? (
                            <>
                              <ActionBtn
                                onClick={() => handleRequestDocuments(app._id)}
                                disabled={isProcessing}
                                loading={isProcessing}
                                icon={Mail}
                                label="Request Docs"
                                variant="info"
                              />
                              <ActionBtn
                                onClick={() => handleVerify(app._id, true)}
                                disabled={isProcessing}
                                loading={isProcessing}
                                icon={BadgeCheck}
                                label="Verify Guide"
                                variant="primary"
                                className="sm:ml-auto"
                              />
                            </>
                          ) : (
                            <ActionBtn
                              onClick={() => handleVerify(app._id, false)}
                              disabled={isProcessing}
                              loading={isProcessing}
                              icon={XCircle}
                              label="Revoke Badge"
                              variant="neutral"
                              className="sm:ml-auto"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile modal — preserved workflow */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {selectedGuide && (
              <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center sm:p-4 md:p-6 lg:p-8">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm"
                  onClick={() => setSelectedGuide(null)}
                />

                <motion.div
                  initial={{ opacity: 0, y: "100%", scale: 1 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: "100%", scale: 0.95 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="bg-white/95 dark:bg-[#0A0F1C] backdrop-blur-2xl w-full max-w-4xl md:rounded-[24px] rounded-t-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden border-t md:border border-[#E2E8F0] dark:border-[#334155] h-[90vh] md:h-auto md:max-h-[85vh]"
                >
                  <div className="sticky top-0 z-20 px-6 py-5 md:px-8 md:py-6 border-b border-[#E2E8F0] dark:border-[#334155] bg-white/80 dark:bg-[#0A0F1C] backdrop-blur-xl flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 md:gap-5 min-w-0 flex-1">
                      <GuideAvatar name={selectedGuide.name} src={selectedGuide.profilePicture} size="lg" />
                      <div className="min-w-0 flex-1">
                        <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2 truncate tracking-tight">
                          <span className="truncate capitalize">{selectedGuide.name}</span>
                          {selectedGuide.guideProfile?.isVerified && (
                            <BadgeCheck className="text-[#FF8C00] flex-shrink-0 drop-shadow-sm" size={24} />
                          )}
                        </h2>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusBadge(selectedGuide, selectedGuide.guideStatus === "approved" ? "approved" : "pending").className}`}
                          >
                            {getStatusBadge(selectedGuide, selectedGuide.guideStatus === "approved" ? "approved" : "pending").label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedGuide(null)}
                      className="w-10 h-10 flex-shrink-0 bg-[#F8FAFC] hover:bg-[#E2E8F0] dark:bg-[#0F172A] dark:hover:bg-[#334155] rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white shadow-sm border border-[#E2E8F0] dark:border-[#334155] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF8C00]/40"
                    >
                      <XCircle size={22} />
                    </button>
                  </div>

                  <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8 md:space-y-10 bg-[#F8FAFC]/50 dark:bg-[#0F172A]/50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
                      <div className="space-y-8 md:space-y-10">
                        <section>
                          <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 pl-1 flex items-center gap-2">
                            <MapPin size={14} /> Contact Details
                          </h4>
                          <div className="bg-white dark:bg-[#0A0F1C] rounded-[24px] border border-[#E2E8F0] dark:border-[#334155] shadow-sm overflow-hidden flex flex-col divide-y divide-[#E2E8F0] dark:divide-[#334155]">
                            {[
                              ["Email Address", selectedGuide.email],
                              ["Phone Number", selectedGuide.phone || "Not provided"],
                              ["Location", selectedGuide.location || "Not provided"],
                              [
                                "Member Since",
                                new Date(selectedGuide.createdAt).toLocaleDateString(undefined, {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }),
                              ],
                            ].map(([label, value]) => (
                              <div
                                key={label}
                                className="p-4 flex flex-col hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A]/50 transition-colors group"
                              >
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-[#FF8C00] transition-colors">
                                  {label}
                                </span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{value}</span>
                              </div>
                            ))}
                          </div>
                        </section>

                        <section>
                          <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 pl-1 flex items-center gap-2">
                            <ShieldAlert size={14} /> Verification Documents
                          </h4>
                          <div className="space-y-3">
                            <ModalDocRow
                              title="National ID"
                              subtitle="Identity Verification"
                              url={selectedGuide.guideProfile?.nationalId?.url}
                              icon={FileText}
                              tone="orange"
                            />
                            <ModalDocRow
                              title="Professional License"
                              subtitle="Tour Guide License"
                              url={selectedGuide.guideProfile?.license?.url}
                              icon={Award}
                              tone="blue"
                            />
                          </div>
                        </section>
                      </div>

                      <div className="space-y-8 md:space-y-10">
                        <section className="h-full">
                          <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 pl-1 flex items-center gap-2">
                            <Users size={14} /> Professional Profile
                          </h4>
                          <div className="bg-white dark:bg-[#0A0F1C] rounded-[24px] border border-[#E2E8F0] dark:border-[#334155] shadow-sm overflow-hidden flex flex-col h-full">
                            <div className="p-6 border-b border-[#E2E8F0] dark:border-[#334155] flex-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">
                                Biography (English)
                              </span>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed bg-[#F8FAFC] dark:bg-[#0F172A] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155]">
                                {selectedGuide.guideProfile?.bio?.en || "No bio provided."}
                              </p>
                            </div>

                            <div className="p-6 border-b border-[#E2E8F0] dark:border-[#334155]">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">
                                Languages Spoken
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {selectedGuide.guideProfile?.languages?.map((lang) => (
                                  <span
                                    key={lang}
                                    className="bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm flex items-center gap-1.5"
                                  >
                                    <MessageCircle size={12} className="text-[#FF8C00]" /> {lang}
                                  </span>
                                )) || <span className="text-sm text-slate-500 italic">Not specified</span>}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 divide-x divide-[#E2E8F0] dark:divide-[#334155] bg-[#F8FAFC]/50 dark:bg-[#0F172A]">
                              <div className="p-6 flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Age</span>
                                <span className="text-2xl font-black text-slate-900 dark:text-white">
                                  {selectedGuide.guideProfile?.age ?? "-"}
                                </span>
                              </div>
                              <div className="p-6 flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Experience</span>
                                <span className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
                                  {selectedGuide.guideProfile?.experienceYears || 0}{" "}
                                  <span className="text-xs font-bold text-[#FF8C00] uppercase tracking-wider">Yrs</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </section>
                      </div>
                    </div>
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

function DocumentPill({ label, ready, url }: { label: string; ready: boolean; url?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
        ready
          ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
          : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-[#0F172A] dark:text-slate-400 dark:border-[#334155]"
      }`}
    >
      <FileText size={11} />
      {label}
      {ready && url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="ml-0.5 text-[#FF8C00] hover:underline inline-flex items-center gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          View <ExternalLink size={10} />
        </a>
      ) : (
        <span className="text-[10px] uppercase font-black opacity-60">· Missing</span>
      )}
    </span>
  );
}

function ActionBtn({
  onClick,
  icon: Icon,
  label,
  variant,
  disabled,
  loading,
  className = "",
}: {
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  variant: "primary" | "success" | "danger" | "info" | "neutral";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  const styles = {
    primary:
      "bg-[#FF8C00] text-white border-[#FF8C00] hover:bg-[#E67E00] shadow-sm shadow-[#FF8C00]/20 focus:ring-[#FF8C00]/40",
    success:
      "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20 focus:ring-emerald-500/30",
    danger:
      "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20 dark:hover:bg-rose-500/20 focus:ring-rose-500/30",
    info:
      "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20 dark:hover:bg-blue-500/20 focus:ring-blue-500/30",
    neutral:
      "bg-white text-slate-700 border-[#E2E8F0] hover:bg-[#F8FAFC] dark:bg-[#0F172A] dark:text-slate-300 dark:border-[#334155] dark:hover:bg-[#334155] focus:ring-slate-400/30",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 ${styles[variant]} ${className}`}
    >
      {loading ? <Loader2 className="animate-spin" size={15} /> : <Icon size={15} />}
      {label}
    </button>
  );
}

function ModalDocRow({
  title,
  subtitle,
  url,
  icon: Icon,
  tone,
}: {
  title: string;
  subtitle: string;
  url?: string;
  icon: React.ElementType;
  tone: "orange" | "blue";
}) {
  const iconTone =
    tone === "orange"
      ? "bg-orange-50 dark:bg-[#FF8C00]/10 text-[#FF8C00]"
      : "bg-blue-50 dark:bg-blue-500/10 text-blue-500";

  return (
    <div className="bg-white dark:bg-[#0A0F1C] rounded-[20px] p-4 border border-[#E2E8F0] dark:border-[#334155] shadow-sm flex items-center justify-between group hover:border-[#FF8C00]/30 dark:hover:border-[#FF8C00]/40 transition-all">
      <div className="flex items-center gap-4 min-w-0">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconTone}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <h5 className="text-sm font-bold text-slate-900 dark:text-white truncate">{title}</h5>
          <p className="text-xs font-medium text-slate-500 mt-0.5 truncate">{subtitle}</p>
        </div>
      </div>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 px-3 py-1.5 bg-[#F8FAFC] hover:bg-[#E2E8F0] dark:bg-[#0F172A] dark:hover:bg-[#334155] text-slate-700 dark:text-white border border-[#E2E8F0] dark:border-[#334155] rounded-lg text-xs font-bold transition-colors"
        >
          View
        </a>
      ) : (
        <span className="shrink-0 px-2.5 py-1 bg-slate-100 dark:bg-black/20 text-slate-400 rounded-lg text-[10px] uppercase tracking-widest font-black">
          Missing
        </span>
      )}
    </div>
  );
}
