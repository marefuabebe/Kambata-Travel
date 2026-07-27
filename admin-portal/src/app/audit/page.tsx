"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, Loader2 } from "lucide-react";
import apiClient from "@/utils/apiClient";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/admin/audit-logs?page=${page}&limit=50`);
      setLogs(data.logs);
      setPages(data.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <ShieldAlert className="text-[#FF8C00]" />
          Immutable Audit Trail
        </h1>
        <p className="text-gray-500 font-medium mt-2">
          Every critical admin action is logged here and cannot be edited or deleted.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin text-[#1A331B]" size={40} />
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-gray-50 overflow-hidden">
          <table className="w-full text-left table-responsive">
            <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <tr>
                <th className="px-6 py-4">When</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log) => (
                <tr key={log._id} className="text-sm">
                  <td className="px-6 py-4 font-medium text-gray-500 whitespace-nowrap" data-label="When">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900" data-label="Actor">
                    {log.actor?.name || "—"}
                    <span className="block text-[10px] text-gray-400 font-medium">
                      {log.actor?.email}
                    </span>
                  </td>
                  <td className="px-6 py-4" data-label="Action">
                    <span className="px-2 py-1 bg-[#1A331B]/10 text-[#1A331B] rounded text-[10px] font-black uppercase">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium" data-label="Target">
                    {log.targetType}
                    {log.targetId && (
                      <span className="block text-[10px] text-gray-400 font-mono">
                        {String(log.targetId).slice(-8)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate" data-label="Details">
                    {log.metadata ? JSON.stringify(log.metadata) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <p className="p-12 text-center text-gray-400 font-bold">No audit entries yet.</p>
          )}
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center gap-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-xl bg-white border font-bold text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="py-2 font-bold text-sm text-gray-500">
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-xl bg-white border font-bold text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
