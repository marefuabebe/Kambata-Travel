// @ts-nocheck
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Label,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Star,
  Target,
  Clock,
  CheckCircle,
  Download,
  Minus,
} from "lucide-react";
import { motion } from "framer-motion";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";

const TIMEFRAMES = [
  { id: "7D", label: "7D" },
  { id: "30D", label: "30D" },
  { id: "90D", label: "90D" },
  { id: "YTD", label: "YTD" },
  { id: "ALL", label: "All" },
];

const TIMEFRAME_LABELS: Record<string, string> = {
  "7D": "Last 7 days",
  "30D": "Last 30 days",
  "90D": "Last 90 days",
  YTD: "Year to date",
  ALL: "All time",
};

const COLORS = ["#FF8C00", "#10B981", "#3B82F6", "#8B5CF6", "#EF4444", "#F59E0B"];

const KPI_GRADIENTS: Record<string, string> = {
  revenue: "bg-gradient-to-br from-emerald-50/80 via-white to-white dark:from-emerald-950/30 dark:via-[#1E293B] dark:to-[#1E293B]",
  bookings: "bg-gradient-to-br from-blue-50/80 via-white to-white dark:from-blue-950/30 dark:via-[#1E293B] dark:to-[#1E293B]",
  travelers: "bg-gradient-to-br from-violet-50/80 via-white to-white dark:from-violet-950/30 dark:via-[#1E293B] dark:to-[#1E293B]",
  rating: "bg-gradient-to-br from-amber-50/80 via-white to-white dark:from-amber-950/30 dark:via-[#1E293B] dark:to-[#1E293B]",
  conversion: "bg-gradient-to-br from-orange-50/80 via-white to-white dark:from-orange-950/20 dark:via-[#1E293B] dark:to-[#1E293B]",
  attendance: "bg-gradient-to-br from-teal-50/80 via-white to-white dark:from-teal-950/30 dark:via-[#1E293B] dark:to-[#1E293B]",
  guides: "bg-gradient-to-br from-slate-50/80 via-white to-white dark:from-slate-900/40 dark:via-[#1E293B] dark:to-[#1E293B]",
  trips: "bg-gradient-to-br from-indigo-50/80 via-white to-white dark:from-indigo-950/30 dark:via-[#1E293B] dark:to-[#1E293B]",
};

const SPARKLINE_COLORS: Record<string, string> = {
  revenue: "#10B981",
  bookings: "#3B82F6",
  travelers: "#8B5CF6",
  rating: "#FF8C00",
  conversion: "#FF8C00",
  attendance: "#14B8A6",
  guides: "#64748B",
  trips: "#6366F1",
};

function MiniSparkline({ data, color = "#10B981" }: { data: number[]; color?: string }) {
  if (!data?.length || data.length < 2) return null;
  const w = 64;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - 3 - ((v - min) / range) * (h - 6);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
const KPI_ACCENTS = {
  revenue: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-500/20" },
  bookings: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", ring: "ring-blue-500/20" },
  travelers: { bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400", ring: "ring-violet-500/20" },
  rating: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", ring: "ring-amber-500/20" },
  conversion: { bg: "bg-orange-500/10", text: "text-[#FF8C00]", ring: "ring-orange-500/20" },
  attendance: { bg: "bg-teal-500/10", text: "text-teal-600 dark:text-teal-400", ring: "ring-teal-500/20" },
  guides: { bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-300", ring: "ring-slate-500/20" },
  trips: { bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", ring: "ring-indigo-500/20" },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 mb-3">
      {children}
    </p>
  );
}

/** 2-column grid on mobile; 4-column from lg */
function MetricGrid({ children, insight = false }: { children: React.ReactNode; insight?: boolean }) {
  return (
    <div
      className={`grid grid-cols-2 gap-3 ${
        insight
          ? "lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-[#E2E8F0] dark:lg:divide-[#334155]"
          : "sm:grid-cols-2 lg:grid-cols-4"
      }`}
    >
      {children}
    </div>
  );
}

function ChangeBadge({ change, mode = "percent" }: { change: number; mode?: "percent" | "points" | "none" }) {
  const isFlat = Math.abs(change) < 0.05;
  const isPositive = change >= 0;

  if (isFlat) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
        <Minus size={10} /> Flat
      </span>
    );
  }

  const suffix = mode === "percent" ? "%" : mode === "points" ? "" : "";
  const prefix = isPositive ? "+" : "";

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
        isPositive
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
          : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
      }`}
    >
      {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {prefix}
      {Math.abs(change).toFixed(1)}
      {suffix}
    </span>
  );
}

function KPICard({
  title,
  current,
  change,
  changeMode = "percent",
  format,
  icon: Icon,
  accent,
  sparkData,
}: any) {
  const a = KPI_ACCENTS[accent] || KPI_ACCENTS.guides;
  const grad = KPI_GRADIENTS[accent] || KPI_GRADIENTS.guides;
  const sparkColor = SPARKLINE_COLORS[accent] || "#64748B";

  return (
    <div className={`group relative overflow-hidden rounded-xl border border-[#E2E8F0]/90 dark:border-[#334155] p-4 h-full transition-all hover:border-[#FF8C00]/25 hover:shadow-sm ${grad}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg ${a.bg} ring-1 ${a.ring} flex items-center justify-center ${a.text}`}>
          <Icon size={16} strokeWidth={2.25} />
        </div>
        <MiniSparkline data={sparkData} color={sparkColor} />
      </div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <div className="flex items-end justify-between gap-1.5 mt-1">
        <p className="text-sm sm:text-lg lg:text-[1.75rem] font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight tabular-nums leading-tight min-w-0">
          {format(current)}
        </p>
        <ChangeBadge change={change} mode={changeMode} />
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, stat, statLabel, children, loading }: any) {
  return (
    <div className={`bg-white dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] overflow-hidden ${loading ? "opacity-60 pointer-events-none" : ""}`}>
      <div className="px-5 py-4 md:px-6 md:py-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-[#E2E8F0] dark:border-[#334155]">
        <div>
          <h3 className="text-[15px] font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {stat != null && (
          <div className="sm:text-right shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{statLabel}</p>
            <p className="text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC] tabular-nums mt-0.5">{stat}</p>
          </div>
        )}
      </div>
      <div className="p-4 md:p-6">{children}</div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [timeframe, setTimeframe] = useState("30D");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [overview, setOverview] = useState<any>(null);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe]);

  const fetchAnalyticsData = async () => {
    const isInitial = !overview;
    if (isInitial) setLoading(true);
    else setRefreshing(true);

    try {
      const [overviewRes, revenueRes, bookingsRes, perfRes] = await Promise.all([
        apiClient.get(`/analytics/overview?timeframe=${timeframe}`),
        apiClient.get(`/analytics/revenue?timeframe=${timeframe}`),
        apiClient.get(`/analytics/bookings?timeframe=${timeframe}`),
        apiClient.get(`/analytics/performance?timeframe=${timeframe}`),
      ]);

      setOverview(overviewRes.data.data);
      setRevenue(revenueRes.data.data);
      setBookings(bookingsRes.data.data);
      setPerformance(perfRes.data.data);
    } catch {
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const exportCSV = () => {
    if (!performance) return;
    const guideHeaders = ["Guide Name", "Completed Trips", "Attendance Rate", "Average Rating", "Incidents"];
    const guideRows = performance.guides.map((g: any) => [
      `"${g.name}"`, g.completedTrips, `${g.attendanceRate}%`, g.avgRating, g.incidentCount,
    ]);
    let csvContent = "data:text/csv;charset=utf-8,GUIDE PERFORMANCE\n";
    csvContent += guideHeaders.join(",") + "\n";
    guideRows.forEach((r: any) => (csvContent += r.join(",") + "\n"));
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `analytics_${timeframe}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("CSV exported");
  };

  const pieData = useMemo(
    () => (bookings ? Object.entries(bookings.statusDistribution).map(([name, value]) => ({ name, value })) : []),
    [bookings]
  );

  const funnelData = useMemo(
    () =>
      bookings
        ? [
            { name: "Submitted", value: bookings.funnel.submitted, fill: "#3B82F6" },
            { name: "Approved", value: bookings.funnel.approved, fill: "#8B5CF6" },
            { name: "Converted", value: bookings.funnel.converted, fill: "#10B981" },
          ]
        : [],
    [bookings]
  );

  const totalRevenue = useMemo(() => revenue.reduce((s, r) => s + (r.total || 0), 0), [revenue]);
  const totalTourRev = useMemo(() => revenue.reduce((s, r) => s + (r.tours || 0), 0), [revenue]);
  const totalPkgRev = useMemo(() => revenue.reduce((s, r) => s + (r.packages || 0), 0), [revenue]);
  const totalBookings = useMemo(() => pieData.reduce((s, d) => s + (d.value as number), 0), [pieData]);
  const funnelRate = bookings?.funnel?.submitted
    ? ((bookings.funnel.converted / bookings.funnel.submitted) * 100).toFixed(1)
    : "0.0";

  const tooltipStyle = {
    borderRadius: 10,
    border: "1px solid #E2E8F0",
    boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
    fontSize: 12,
    fontWeight: 500,
  };

  if (loading && !overview) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-6 animate-pulse">
        <div className="h-24 bg-[#E2E8F0] dark:bg-[#334155] rounded-xl" />
        <div className="h-32 bg-[#E2E8F0] dark:bg-[#334155] rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-[#E2E8F0] dark:bg-[#334155] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const insights = overview
    ? [
        {
          label: "Revenue",
          current: `ETB ${overview.current.revenue.toLocaleString()}`,
          change: overview.changes.revenue,
          mode: "percent" as const,
          spark: revenue.length >= 2 ? revenue.map((r) => r.total || 0) : [overview.previous.revenue, overview.current.revenue],
          color: "#10B981",
        },
        {
          label: "Bookings",
          current: overview.current.bookingsCount.toLocaleString(),
          change: overview.changes.bookingsCount,
          mode: "percent" as const,
          spark: [overview.previous.bookingsCount, overview.current.bookingsCount],
          color: "#3B82F6",
        },
        {
          label: "Attendance",
          current: `${overview.current.attendanceRate.toFixed(1)}%`,
          change: overview.changes.attendanceRate,
          mode: "points" as const,
          spark: [overview.previous.attendanceRate, overview.current.attendanceRate],
          color: "#14B8A6",
        },
        {
          label: "Avg Rating",
          current: <span className="inline-flex items-center gap-1">{overview.current.avgRating.toFixed(1)} <Star size={24} className="text-[#FF8C00] fill-[#FF8C00] shrink-0" /></span>,
          change: overview.changes.avgRating,
          mode: "points" as const,
          spark: [overview.previous.avgRating, overview.current.avgRating],
          color: "#FF8C00",
        },
      ]
    : [];

  const kpiSpark = (prev: number, curr: number, series?: number[]) =>
    series && series.length >= 2 ? series : [prev, curr];

  const revenueSpark = revenue.length >= 2 ? revenue.map((r) => r.total || 0) : undefined;

  return (
    <div className="max-w-[1400px] mx-auto pb-16 space-y-7 overflow-x-hidden">

      {/* ── Page header + toolbar (tight grouping) ── */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl md:text-[1.75rem] font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
            Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 max-w-lg">
            Revenue, bookings, guide performance, and conversion metrics.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="inline-flex items-center p-1 rounded-lg bg-[#F1F5F9] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] w-fit max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <span className="shrink-0 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 border-r border-[#E2E8F0] dark:border-[#334155] mr-1">
              {TIMEFRAME_LABELS[timeframe]}
            </span>
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`shrink-0 min-h-[36px] px-3 text-xs font-semibold rounded-md transition-all ${
                  timeframe === tf.id
                    ? "bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
          <button
            onClick={exportCSV}
            disabled={!performance || refreshing}
            className="inline-flex items-center justify-center gap-2 min-h-[36px] px-3.5 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-[#FF8C00]/40 hover:text-[#FF8C00] transition-colors disabled:opacity-40 shrink-0"
          >
            <Download size={15} />
            Export
          </button>
        </div>

        {/* ── Executive Insights (directly below toolbar) ── */}
        {overview && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative rounded-xl border border-[#E2E8F0]/80 dark:border-[#334155] bg-gradient-to-br from-white via-white to-orange-50/40 dark:from-[#1E293B] dark:via-[#1E293B] dark:to-[#FF8C00]/[0.06] backdrop-blur-sm ${refreshing ? "opacity-70" : ""}`}
          >
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#FF8C00] to-orange-400" />
            <div className="px-5 py-4 md:px-6 md:py-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">Executive Insights</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">vs previous equivalent period</p>
                </div>
                {refreshing && (
                  <div className="w-4 h-4 border-2 border-[#FF8C00] border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <MetricGrid insight>
                {insights.map((item, i) => (
                  <div key={item.label} className={`min-w-0 ${i > 0 ? "lg:px-6" : "lg:pr-6"}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">{item.label}</p>
                    <div className="flex items-end justify-between gap-1.5 mt-1.5">
                      <p className="text-sm sm:text-xl lg:text-[1.85rem] font-bold text-[#0F172A] dark:text-[#F8FAFC] tabular-nums leading-tight tracking-tight min-w-0">
                        {item.current}
                      </p>
                      <MiniSparkline data={item.spark} color={item.color} />
                    </div>
                    <div className="mt-2">
                      <ChangeBadge change={item.change} mode={item.mode} />
                    </div>
                  </div>
                ))}
              </MetricGrid>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── KPI: Revenue & Volume ── */}
      {overview && (
        <section className={refreshing ? "opacity-70 transition-opacity" : ""}>
          <SectionLabel>Revenue &amp; Volume</SectionLabel>
          <MetricGrid>
            <KPICard
              title="Total Revenue"
              current={overview.current.revenue}
              change={overview.changes.revenue}
              format={(v: number) => `ETB ${Number(v).toLocaleString()}`}
              icon={DollarSign}
              accent="revenue"
              sparkData={kpiSpark(overview.previous.revenue, overview.current.revenue, revenueSpark)}
            />
            <KPICard
              title="Total Bookings"
              current={overview.current.bookingsCount}
              change={overview.changes.bookingsCount}
              format={(v: number) => Number(v).toLocaleString()}
              icon={Calendar}
              accent="bookings"
              sparkData={kpiSpark(overview.previous.bookingsCount, overview.current.bookingsCount)}
            />
            <KPICard
              title="Total Travelers"
              current={overview.current.travelersCount}
              change={overview.changes.travelersCount}
              format={(v: number) => Number(v).toLocaleString()}
              icon={Users}
              accent="travelers"
              sparkData={kpiSpark(overview.previous.travelersCount, overview.current.travelersCount)}
            />
            <KPICard
              title="Average Rating"
              current={overview.current.avgRating}
              change={overview.changes.avgRating}
              changeMode="points"
              format={(v: number) => (
                <span className="inline-flex items-center gap-1">
                  {Number(v).toFixed(1)} <Star size={14} className="text-[#FF8C00] fill-[#FF8C00]" />
                </span>
              )}
              icon={Star}
              accent="rating"
              sparkData={kpiSpark(overview.previous.avgRating, overview.current.avgRating)}
            />
          </MetricGrid>
        </section>
      )}

      {/* ── KPI: Operations ── */}
      {overview && (
        <section className={refreshing ? "opacity-70 transition-opacity" : ""}>
          <SectionLabel>Operations &amp; Quality</SectionLabel>
          <MetricGrid>
            <KPICard
              title="Conversion Rate"
              current={overview.current.conversionRate}
              change={overview.changes.conversionRate}
              changeMode="points"
              format={(v: number) => `${Number(v).toFixed(1)}%`}
              icon={Target}
              accent="conversion"
              sparkData={kpiSpark(overview.previous.conversionRate, overview.current.conversionRate)}
            />
            <KPICard
              title="Attendance Success"
              current={overview.current.attendanceRate}
              change={overview.changes.attendanceRate}
              changeMode="points"
              format={(v: number) => `${Number(v).toFixed(1)}%`}
              icon={CheckCircle}
              accent="attendance"
              sparkData={kpiSpark(overview.previous.attendanceRate, overview.current.attendanceRate)}
            />
            <KPICard
              title="Active Guides"
              current={overview.current.activeGuides}
              change={overview.changes.activeGuides}
              format={(v: number) => Number(v).toLocaleString()}
              icon={Users}
              accent="guides"
              sparkData={kpiSpark(overview.previous.activeGuides, overview.current.activeGuides)}
            />
            <KPICard
              title="Completed Trips"
              current={overview.current.completedTrips}
              change={overview.changes.completedTrips}
              format={(v: number) => Number(v).toLocaleString()}
              icon={Clock}
              accent="trips"
              sparkData={kpiSpark(overview.previous.completedTrips, overview.current.completedTrips)}
            />
          </MetricGrid>
        </section>
      )}

      {/* ── Charts ── */}
      <section>
        <SectionLabel>Trends</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <ChartCard
              title="Revenue Trend (Paid Transactions)"
              subtitle="Paid transactions over time"
              stat={`ETB ${totalRevenue.toLocaleString()}`}
              statLabel="Period total"
              loading={refreshing}
            >
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenue}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      dx={-10}
                      width={72}
                      tickFormatter={(val) => `ETB ${val.toLocaleString()}`}
                    />
                    <RechartsTooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => [`ETB ${value.toLocaleString()}`, "Revenue"]}
                    />
                    <Area type="monotone" dataKey="total" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <div className="lg:col-span-2">
            <ChartCard title="Booking Status" subtitle="Distribution by status" stat={totalBookings} statLabel="Total bookings" loading={refreshing}>
              <div className="h-72 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={62} outerRadius={88} paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                      <Label
                        value={totalBookings}
                        position="center"
                        content={({ viewBox }) => {
                          if (!viewBox || !("cx" in viewBox)) return null;
                          const { cx, cy } = viewBox as { cx: number; cy: number };
                          return (
                            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={cx} dy="-4" fill="#94a3b8" fontSize={10} fontWeight={500}>Total</tspan>
                              <tspan x={cx} dy={18} fill="#64748b" fontSize={20} fontWeight={600}>{totalBookings}</tspan>
                            </text>
                          );
                        }}
                      />
                    </Pie>
                    <RechartsTooltip contentStyle={tooltipStyle} />
                    <Legend verticalAlign="bottom" height={32} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </div>
      </section>

      <section>
        <SectionLabel>Conversion &amp; Mix</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="Request Funnel" subtitle="Custom date request pipeline" stat={`${funnelRate}%`} statLabel="Conversion rate" loading={refreshing}>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ left: 0, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#94a3b8" opacity={0.12} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} width={80} />
                  <RechartsTooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                    {funnelData.map((e, i) => (
                      <Cell key={i} fill={e.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard
            title="Revenue Breakdown"
            subtitle="Tours vs travel packages"
            stat={`${totalTourRev > 0 ? Math.round((totalTourRev / (totalRevenue || 1)) * 100) : 0}% tours`}
            statLabel="Tours share"
            loading={refreshing}
          >
            <div className="flex gap-4 mb-4">
              <div className="flex-1 rounded-lg bg-[#F8FAFC] dark:bg-[#0F172A] px-3 py-2 border border-[#E2E8F0] dark:border-[#334155]">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Tours</p>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 tabular-nums">ETB {totalTourRev.toLocaleString()}</p>
              </div>
              <div className="flex-1 rounded-lg bg-[#F8FAFC] dark:bg-[#0F172A] px-3 py-2 border border-[#E2E8F0] dark:border-[#334155]">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Packages</p>
                <p className="text-sm font-semibold text-violet-600 dark:text-violet-400 tabular-nums">ETB {totalPkgRev.toLocaleString()}</p>
              </div>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.12} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} width={48} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <RechartsTooltip contentStyle={tooltipStyle} />
                  <Legend verticalAlign="top" height={28} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="tours" name="Tours" stackId="a" fill="#3B82F6" radius={[0, 0, 3, 3]} />
                  <Bar dataKey="packages" name="Packages" stackId="a" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </section>

      {/* ── Performance tables ── */}
      {performance && (
        <section className={refreshing ? "opacity-70 transition-opacity" : ""}>
          <SectionLabel>Performance</SectionLabel>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Guides */}
            <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-[#334155] flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-semibold text-[#0F172A] dark:text-[#F8FAFC]">Guide Performance</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Ranked by completed trips</p>
                </div>
                <span className="text-xs font-medium text-slate-400 tabular-nums">{performance.guides.length} guides</span>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block max-h-[360px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-[#F8FAFC] dark:bg-[#0F172A] z-10">
                    <tr className="border-b border-[#E2E8F0] dark:border-[#334155]">
                      {["Guide", "Trips", "Attendance", "Rating", "Incidents"].map((h, i) => (
                        <th key={h} className={`px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 ${i > 0 ? "text-right" : "text-left"}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {performance.guides.length === 0 ? (
                      <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">No data for this period</td></tr>
                    ) : (
                      performance.guides.map((g: any) => (
                        <tr key={g._id} className="border-b border-[#E2E8F0]/60 dark:border-[#334155]/60 last:border-0 hover:bg-slate-50/80 dark:hover:bg-[#0F172A]/40">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#F1F5F9] dark:bg-[#0F172A] overflow-hidden shrink-0">
                                {g.profilePicture ? (
                                  <img src={g.profilePicture} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-slate-400">{g.name.charAt(0)}</div>
                                )}
                              </div>
                              <span className="text-sm font-medium text-[#0F172A] dark:text-[#F8FAFC] truncate max-w-[140px]">{g.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right text-sm font-medium tabular-nums">{g.completedTrips}</td>
                          <td className="px-5 py-3 text-right text-sm font-medium text-emerald-600 tabular-nums">{g.attendanceRate}%</td>
                          <td className="px-5 py-3 text-right text-sm font-medium text-[#FF8C00] tabular-nums">
                            <span className="inline-flex items-center gap-1 justify-end">
                              {g.avgRating} <Star size={12} className="fill-[#FF8C00]" />
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right text-sm tabular-nums">
                            <span className={g.incidentCount > 0 ? "text-red-500 font-medium" : "text-slate-400"}>{g.incidentCount}</span>
                          </td>
                        </tr>
                      ))
                    )}

                    
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden p-4 space-y-3">
                {performance.guides.map((g: any) => (
                  <div key={g._id} className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0F172A]">
                    <div className="w-9 h-9 rounded-full bg-white dark:bg-[#1E293B] overflow-hidden shrink-0">
                      {g.profilePicture ? <img src={g.profilePicture} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-slate-400">{g.name.charAt(0)}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{g.name}</p>
                      <p className="text-xs text-slate-400">{g.completedTrips} trips · {g.attendanceRate}% attendance</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-[#FF8C00] inline-flex items-center gap-1 justify-end">
                        {g.avgRating} <Star size={12} className="fill-[#FF8C00]" />
                      </p>
                      <p className={`text-xs ${g.incidentCount > 0 ? "text-red-500" : "text-slate-400"}`}>{g.incidentCount} incidents</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top tours */}
            <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-[#334155] flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-semibold text-[#0F172A] dark:text-[#F8FAFC]">Top Tours</h3>
                  <p className="text-xs text-slate-500 mt-0.5">By revenue generated</p>
                </div>
                <span className="text-xs font-medium text-slate-400 tabular-nums">{performance.topTours.length} tours</span>
              </div>

              <div className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A]">
                      {["Tour", "Revenue", "Bookings"].map((h, i) => (
                        <th key={h} className={`px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 ${i > 0 ? "text-right" : "text-left"}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {performance.topTours.length === 0 ? (
                      <tr><td colSpan={3} className="px-5 py-10 text-center text-sm text-slate-400">No data for this period</td></tr>
                    ) : (
                      performance.topTours.map((t: any, i: number) => (
                        <tr key={t._id?._id || i} className="border-b border-[#E2E8F0]/60 dark:border-[#334155]/60 last:border-0 hover:bg-slate-50/80 dark:hover:bg-[#0F172A]/40">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-[#FF8C00]/10 text-[#FF8C00] text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                              <span className="text-sm font-medium text-[#0F172A] dark:text-[#F8FAFC] truncate max-w-[180px]">{t._id?.title?.en || t._id?.title || "Unknown"}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right text-sm font-semibold text-emerald-600 tabular-nums">ETB {t.revenue.toLocaleString()}</td>
                          <td className="px-5 py-3.5 text-right text-sm text-slate-500 tabular-nums">{t.bookings}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden p-4 space-y-3">
                {performance.topTours.map((t: any, i: number) => (
                  <div key={t._id?._id || i} className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0F172A]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-[#FF8C00]/10 text-[#FF8C00] text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <span className="text-sm font-medium text-[#0F172A] dark:text-[#F8FAFC] truncate">{t._id?.title?.en || t._id?.title || "Unknown"}</span>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-semibold text-emerald-600">ETB {t.revenue.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">{t.bookings} bookings</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
