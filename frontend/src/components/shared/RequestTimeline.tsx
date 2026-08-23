"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Circle, Clock, AlertCircle, Loader2 } from "lucide-react";
import apiClient from "@/utils/apiClient";

interface TimelineStep {
  key: string;
  label: string;
  status: "completed" | "active" | "pending";
}

interface RequestTimelineProps {
  requestId: string;
  apiBase?: string;
  compact?: boolean;
  horizontal?: boolean;
}

export default function RequestTimeline({ requestId, apiBase = "/requests", compact = false, horizontal = false }: RequestTimelineProps) {
  const [steps, setSteps] = useState<TimelineStep[]>([]);
  const [failed, setFailed] = useState(false);
  const [failureLabel, setFailureLabel] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requestId) return;
    apiClient
      .get(`${apiBase}/${requestId}/timeline`)
      .then((res) => {
        const data = res.data.data;
        setSteps(data.timeline?.steps || []);
        setFailed(data.timeline?.failed || false);
        setFailureLabel(data.timeline?.failureLabel || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [requestId, apiBase]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
        <Loader2 size={14} className="animate-spin" /> Loading timeline…
      </div>
    );
  }

  if (failed) {
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm font-bold bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-xl">
        <AlertCircle size={16} />
        {failureLabel || "Request failed"}
      </div>
    );
  }

  return (
    <div className={`${compact ? "space-y-2" : "space-y-0"} ${horizontal ? "flex flex-row items-start gap-1 overflow-x-auto pb-2 scrollbar-hide w-full" : ""}`}>
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const Icon =
          step.status === "completed" ? CheckCircle2 :
          step.status === "active" ? Clock : Circle;

        if (horizontal) {
          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5 shrink-0 relative flex-1 min-w-[80px]">
              {!isLast && (
                <div
                  className={`absolute left-[50%] top-[12px] w-[100%] h-0.5 z-0 ${
                    step.status === "completed" ? "bg-emerald-400" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
              <div
                className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-white dark:bg-[#161B26] relative z-10 ${
                  step.status === "completed"
                    ? "text-emerald-500"
                    : step.status === "active"
                    ? "text-[#FF8C00]"
                    : "text-gray-300 dark:text-gray-600"
                }`}
              >
                <Icon size={16} />
              </div>
              <div className="text-center px-1">
                <p
                  className={`text-[10px] font-bold leading-tight ${
                    step.status === "active"
                      ? "text-[#FF8C00]"
                      : step.status === "completed"
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
              </div>
            </div>
          );
        }

        return (
          <div key={step.key} className={`flex gap-3 ${compact ? "" : "pb-2.5 md:pb-3 relative"}`}>
            {!isLast && !compact && (
              <div
                className={`absolute left-[11px] top-5 md:top-6 w-0.5 h-full z-0 ${
                  step.status === "completed" ? "bg-emerald-400" : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
            <div
              className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center relative z-10 bg-white dark:bg-transparent ${
                step.status === "completed"
                  ? "text-emerald-500"
                  : step.status === "active"
                  ? "text-[#FF8C00]"
                  : "text-gray-300 dark:text-gray-600"
              }`}
            >
              <Icon size={compact ? 14 : 18} />
            </div>
            <div className="pt-0.5">
              <p
                className={`text-sm font-bold ${
                  step.status === "active"
                    ? "text-[#FF8C00]"
                    : step.status === "completed"
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-400"
                }`}
              >
                {step.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
