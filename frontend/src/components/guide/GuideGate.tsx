"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, Users, ShieldAlert, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/utils/apiClient";
import { toast } from "react-hot-toast";

const PROFILE_PATH = "/guide-dashboard/profile";

export default function GuideGate({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!user || user.role !== "guide") {
    return <>{children}</>;
  }

  if (pathname === PROFILE_PATH || pathname?.startsWith(`${PROFILE_PATH}/`)) {
    return <>{children}</>;
  }

  const status = user.guideStatus || "none";

  const handleResubmit = async () => {
    try {
      const { data } = await apiClient.post("/guides/resubmit");
      const updated = { ...user, guideStatus: data.data.guideStatus };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not resubmit application");
      router.push(PROFILE_PATH);
    }
  };

  if (status === "none") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 mb-6 border-4 border-white dark:border-gray-800 shadow-xl">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Complete Your Expert Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto mb-6 font-medium">
          Your account is locked. To unlock the guide dashboard, the admin team requires you to complete the following:
        </p>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm max-w-md w-full text-left mx-auto mb-8">
          <ul className="space-y-3 text-sm font-medium text-gray-700 dark:text-gray-200">
            <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Write a Public Bio (50+ characters)</li>
            <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Add Phone Number & Location</li>
            <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Select at least 1 Specialization</li>
            <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Select at least 1 Spoken Language</li>
            <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Upload National ID</li>
            <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Upload Tour Guide License</li>
          </ul>
        </div>
        <Link
          href={PROFILE_PATH}
          className="bg-[#1A331B] text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-xl hover:bg-green-900 transition-all"
        >
          Go to Profile Setup
        </Link>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-500 mb-6 border-4 border-white dark:border-gray-800 shadow-xl">
          <Calendar size={40} />
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Pending Verification</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 font-medium">
          Your profile and documentation are being reviewed by the Kambata Travel admin team. You will be notified by email once approved.
        </p>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm max-w-sm w-full text-left">
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4">Security Checklist</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm font-bold text-gray-400">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" /> Profile submitted
            </li>
            {(user.nationalId || user.tourGuideLicense) ? (
              <li className="flex items-center gap-3 text-sm font-bold text-gray-400">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" /> Documents uploaded
              </li>
            ) : (
              <li className="flex items-center gap-3 text-sm font-bold text-red-500">
                <span className="w-2 h-2 bg-red-500 rounded-full" /> Documents missing (Action required)
              </li>
            )}
            <li className="flex items-center gap-3 text-sm font-bold text-amber-500">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" /> Admin vetting in progress
            </li>
          </ul>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="w-24 h-24 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500 mb-6 border-4 border-white dark:border-gray-800 shadow-xl">
          <Users size={40} />
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Verification Failed</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 font-medium">
          Your application was not approved. Review the email we sent, update your documents on your profile, then resubmit for review.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={PROFILE_PATH}
            className="bg-white dark:bg-gray-800 border-2 border-[#1A331B] dark:border-gray-600 text-[#1A331B] dark:text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-green-50 dark:hover:bg-gray-700 transition-all"
          >
            Update Profile
          </Link>
          <button
            type="button"
            onClick={handleResubmit}
            className="bg-[#1A331B] text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-xl hover:bg-green-900 transition-all"
          >
            Resubmit for Review
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {user.schedulingDisabled && status === "approved" && (
        <div className="mb-6 bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-amber-600 shrink-0" size={20} />
          <p className="text-sm text-amber-800 font-medium">
            Your field access has been limited by an administrator. Contact support if you believe this is an error.
          </p>
        </div>
      )}
      {children}
    </>
  );
}
