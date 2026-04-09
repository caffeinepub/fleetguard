/**
 * DevPortalSections.tsx
 * New tab sections for the Dev Portal:
 *  - RevenueAnalyticsSection
 *  - CustomerHealthSection
 *  - AuditLogSection
 *  - SystemHealthSection
 */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  Download,
  Heart,
  RefreshCw,
  Server,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import React, { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import type {
  CompanySettings,
  SubscriptionWithVehicleCount,
} from "../backend.d";
import { SubscriptionTier } from "../backend.d";
import type {
  AuditLog,
  CompanyDashboardStats,
  SystemStats,
} from "../hooks/useQueries";
import {
  useAllCompaniesDashboardStats,
  useAllCompanyTags,
  useAllLastLogins,
  useAuditLogs,
  useCompanyNote,
  useExportAuditLogsCSV,
  usePingBackend,
  useSetCompanyNote,
  useSetCompanyTags,
  useSystemStats,
} from "../hooks/useQueries";

const TIER_PRICES: Record<string, number> = {
  [SubscriptionTier.starter]: 99,
  [SubscriptionTier.growth]: 225,
  [SubscriptionTier.enterprise]: 499,
};

const cardStyle = (darkMode: boolean) => ({
  background: darkMode ? "oklch(0.18 0.05 255)" : "white",
  border: `1px solid ${darkMode ? "oklch(0.26 0.06 255)" : "oklch(0.90 0.01 255)"}`,
});

const textPrimary = (darkMode: boolean) =>
  darkMode ? "white" : "oklch(0.18 0.08 255)";
const textMuted = (darkMode: boolean) =>
  darkMode ? "oklch(0.6 0.03 255)" : "oklch(0.5 0.03 255)";

function tooltipStyle(darkMode: boolean) {
  return {
    background: darkMode ? "oklch(0.22 0.06 255)" : "white",
    border: `1px solid ${darkMode ? "oklch(0.3 0.06 255)" : "oklch(0.88 0.01 255)"}`,
    borderRadius: 8,
    color: darkMode ? "white" : "oklch(0.18 0.08 255)",
  };
}

function formatDate(ns: bigint | undefined | null): string {
  if (!ns) return "—";
  return new Date(Number(ns) / 1_000_000).toLocaleDateString();
}

function formatRelativeTime(ns: bigint | null | undefined): string {
  if (!ns) return "Never";
  const ms = Number(ns) / 1_000_000;
  const diff = Date.now() - ms;
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function getActivityStatus(ns: bigint | null | undefined): {
  label: string;
  color: string;
  bg: string;
} {
  if (!ns)
    return {
      label: "No Login",
      color: "oklch(0.5 0.03 255)",
      bg: "oklch(0.5 0.03 255 / 0.1)",
    };
  const days = (Date.now() - Number(ns) / 1_000_000) / 86_400_000;
  if (days < 7)
    return {
      label: "Active",
      color: "oklch(0.65 0.2 150)",
      bg: "oklch(0.65 0.2 150 / 0.1)",
    };
  if (days < 30)
    return {
      label: "At Risk",
      color: "oklch(0.72 0.17 85)",
      bg: "oklch(0.72 0.17 85 / 0.1)",
    };
  return {
    label: "Churned",
    color: "oklch(0.58 0.18 22)",
    bg: "oklch(0.58 0.18 22 / 0.1)",
  };
}

function calcHealthScore(stats: CompanyDashboardStats | undefined): number {
  if (!stats) return 0;
  const score =
    Number(stats.vehicleCount) * 10 +
    Number(stats.maintenanceCount) * 5 +
    Number(stats.workOrderCount) * 3;
  return Math.min(100, score);
}

function HealthScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "oklch(0.65 0.2 150)"
      : score >= 40
        ? "oklch(0.72 0.17 85)"
        : "oklch(0.58 0.18 22)";
  return (
    <div className="flex items-center gap-1.5">
      <div className="text-sm font-bold tabular-nums" style={{ color }}>
        {score}
      </div>
      <div
        className="h-1.5 w-16 rounded-full overflow-hidden"
        style={{ background: "oklch(0.3 0.04 255 / 0.3)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Revenue Analytics ───────────────────────────────────────────────────────
export function RevenueAnalyticsSection({
  subscriptions,
  isLoading,
  darkMode,
}: {
  subscriptions: SubscriptionWithVehicleCount[];
  isLoading: boolean;
  darkMode: boolean;
}) {
  const active = subscriptions.filter((s) => s.record.status === "active");
  const trial = subscriptions.filter((s) => s.record.status === "trial");
  const cancelled = subscriptions.filter(
    (s) => s.record.status === "cancelled",
  );

  const mrr = active.reduce(
    (sum, s) => sum + (TIER_PRICES[s.record.tier] ?? 99),
    0,
  );
  const arr = mrr * 12;

  const totalWithSub = subscriptions.length;
  const churn =
    totalWithSub > 0
      ? ((cancelled.length / totalWithSub) * 100).toFixed(1)
      : "0.0";
  const conversion =
    active.length + trial.length > 0
      ? ((active.length / (active.length + trial.length)) * 100).toFixed(1)
      : "0.0";

  // Tier breakdown
  const tierBreakdown = [
    {
      tier: "Starter ($99)",
      companies: subscriptions.filter(
        (s) => s.record.tier === SubscriptionTier.starter,
      ).length,
      revenue:
        subscriptions.filter(
          (s) =>
            s.record.tier === SubscriptionTier.starter &&
            s.record.status === "active",
        ).length * 99,
      color: "#22c55e",
    },
    {
      tier: "Growth ($225)",
      companies: subscriptions.filter(
        (s) => s.record.tier === SubscriptionTier.growth,
      ).length,
      revenue:
        subscriptions.filter(
          (s) =>
            s.record.tier === SubscriptionTier.growth &&
            s.record.status === "active",
        ).length * 225,
      color: "#3b82f6",
    },
    {
      tier: "Enterprise ($499)",
      companies: subscriptions.filter(
        (s) => s.record.tier === SubscriptionTier.enterprise,
      ).length,
      revenue:
        subscriptions.filter(
          (s) =>
            s.record.tier === SubscriptionTier.enterprise &&
            s.record.status === "active",
        ).length * 499,
      color: "#a855f7",
    },
  ];

  const statusPie = [
    { name: "Active", value: active.length, color: "#22c55e" },
    { name: "Trial", value: trial.length, color: "#3b82f6" },
    { name: "Cancelled", value: cancelled.length, color: "#ef4444" },
    {
      name: "Inactive",
      value: subscriptions.filter((s) => s.record.status === "inactive").length,
      color: "#6b7280",
    },
  ].filter((d) => d.value > 0);

  const statCards = [
    {
      label: "MRR",
      value: `$${mrr.toLocaleString()}`,
      icon: TrendingUp,
      color: "oklch(0.72 0.17 85)",
    },
    {
      label: "ARR",
      value: `$${arr.toLocaleString()}`,
      icon: TrendingUp,
      color: "oklch(0.65 0.2 150)",
    },
    {
      label: "Churn Rate",
      value: `${churn}%`,
      icon: AlertTriangle,
      color: "oklch(0.58 0.18 22)",
    },
    {
      label: "Trial → Paid",
      value: `${conversion}%`,
      icon: Activity,
      color: "oklch(0.5 0.22 264)",
    },
  ];

  return (
    <div className="space-y-6" data-ocid="revenue.section">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-5"
              style={cardStyle(darkMode)}
              data-ocid={`revenue.stat.${i + 1}`}
            >
              {isLoading ? (
                <>
                  <Skeleton className="w-8 h-8 rounded-lg mb-3" />
                  <Skeleton className="w-16 h-7 mb-1" />
                  <Skeleton className="w-24 h-4" />
                </>
              ) : (
                <>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${stat.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <div
                    className="text-2xl font-bold tabular-nums"
                    style={{ color: textPrimary(darkMode) }}
                  >
                    {stat.value}
                  </div>
                  <div
                    className="text-sm mt-1"
                    style={{ color: textMuted(darkMode) }}
                  >
                    {stat.label}
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tier Breakdown Bar */}
        <div className="rounded-2xl p-6" style={cardStyle(darkMode)}>
          <h3
            className="font-semibold mb-4"
            style={{ color: textPrimary(darkMode) }}
          >
            Revenue by Tier
          </h3>
          {isLoading ? (
            <Skeleton className="w-full h-48" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={tierBreakdown}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={
                    darkMode ? "oklch(0.25 0.04 255)" : "oklch(0.88 0.01 255)"
                  }
                />
                <XAxis
                  dataKey="tier"
                  tick={{ fill: textMuted(darkMode), fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: textMuted(darkMode), fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={tooltipStyle(darkMode)}
                  formatter={(v) => [`$${v}`, "Revenue"]}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {tierBreakdown.map((entry, idx) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: recharts
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Subscription Status Donut */}
        <div className="rounded-2xl p-6" style={cardStyle(darkMode)}>
          <h3
            className="font-semibold mb-4"
            style={{ color: textPrimary(darkMode) }}
          >
            Subscription Status
          </h3>
          {isLoading ? (
            <Skeleton className="w-full h-48" />
          ) : statusPie.length === 0 ? (
            <div
              className="h-48 flex items-center justify-center text-sm"
              style={{ color: textMuted(darkMode) }}
            >
              No subscriptions yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusPie.map((entry, idx) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: recharts
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle(darkMode)} />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: textMuted(darkMode) }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Revenue Table */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle(darkMode)}>
        <div
          className="px-6 py-4 border-b"
          style={{
            borderColor: darkMode
              ? "oklch(0.26 0.06 255)"
              : "oklch(0.90 0.01 255)",
          }}
        >
          <h3
            className="font-semibold"
            style={{ color: textPrimary(darkMode) }}
          >
            Subscription Revenue Breakdown
          </h3>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-full h-12" />
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <div
            className="p-12 text-center text-sm"
            style={{ color: textMuted(darkMode) }}
            data-ocid="revenue.table.empty"
          >
            No subscription data
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">MRR</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trial Ends</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sw, i) => {
                const s = sw.record;
                const price = TIER_PRICES[s.tier] ?? 99;
                const isActive = s.status === "active";
                return (
                  <TableRow
                    key={s.companyName}
                    data-ocid={`revenue.table.row.${i + 1}`}
                  >
                    <TableCell className="font-medium text-sm">
                      {s.companyName}
                    </TableCell>
                    <TableCell>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                        style={{
                          background:
                            s.tier === SubscriptionTier.enterprise
                              ? "oklch(0.5 0.22 280 / 0.15)"
                              : s.tier === SubscriptionTier.growth
                                ? "oklch(0.5 0.22 264 / 0.15)"
                                : "oklch(0.65 0.2 150 / 0.15)",
                          color:
                            s.tier === SubscriptionTier.enterprise
                              ? "oklch(0.5 0.22 280)"
                              : s.tier === SubscriptionTier.growth
                                ? "oklch(0.5 0.22 264)"
                                : "oklch(0.65 0.2 150)",
                        }}
                      >
                        {s.tier}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-sm">
                      <span
                        style={{
                          color: isActive
                            ? "oklch(0.65 0.2 150)"
                            : textMuted(darkMode),
                        }}
                      >
                        {isActive ? `$${price}` : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full border font-medium"
                        style={{
                          background:
                            s.status === "active"
                              ? "oklch(0.65 0.2 150 / 0.1)"
                              : s.status === "trial"
                                ? "oklch(0.5 0.22 264 / 0.1)"
                                : "oklch(0.58 0.18 22 / 0.1)",
                          color:
                            s.status === "active"
                              ? "oklch(0.65 0.2 150)"
                              : s.status === "trial"
                                ? "oklch(0.5 0.22 264)"
                                : "oklch(0.58 0.18 22)",
                          borderColor:
                            s.status === "active"
                              ? "oklch(0.65 0.2 150 / 0.3)"
                              : s.status === "trial"
                                ? "oklch(0.5 0.22 264 / 0.3)"
                                : "oklch(0.58 0.18 22 / 0.3)",
                        }}
                      >
                        {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(s.trialEndsAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

// ─── Customer Health ─────────────────────────────────────────────────────────
const ALL_TAGS = [
  "Premium",
  "At-Risk",
  "Early Adopter",
  "High-Value",
  "Churning",
  "Support-Heavy",
];

function CompanyHealthRow({
  company,
  stats,
  lastLoginNs,
  devKey,
  darkMode,
  index,
}: {
  company: CompanySettings;
  stats: CompanyDashboardStats | undefined;
  lastLoginNs: bigint | undefined;
  devKey: string;
  darkMode: boolean;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");
  const [noteLoaded, setNoteLoaded] = useState(false);

  const noteQuery = useCompanyNote(devKey, company.companyName);
  const tagsQuery = useAllCompanyTags(devKey);
  const companyTags =
    tagsQuery.data?.find(([id]) => id === company.companyName)?.[1] ?? [];
  const setTagsMut = useSetCompanyTags();
  const setNoteMut = useSetCompanyNote();

  const healthScore = calcHealthScore(stats);
  const activityStatus = getActivityStatus(lastLoginNs);

  const handleNoteBlur = () => {
    if (!noteLoaded) return;
    setNoteMut.mutate({ devKey, companyId: company.companyName, note });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = companyTags.includes(tag)
      ? companyTags.filter((t) => t !== tag)
      : [...companyTags, tag];
    setTagsMut.mutate({
      devKey,
      companyId: company.companyName,
      tags: newTags,
    });
  };

  // Load note when expanded — populate from backend query result
  React.useEffect(() => {
    if (expanded && !noteLoaded && noteQuery.data != null) {
      setNote(noteQuery.data);
      setNoteLoaded(true);
    }
  }, [expanded, noteLoaded, noteQuery.data]);

  const vehicleLimit = stats ? Math.max(Number(stats.vehicleCount), 10) : 10;
  const vehicleUsagePct = stats
    ? Math.min(100, (Number(stats.vehicleCount) / vehicleLimit) * 100)
    : 0;

  return (
    <>
      <TableRow
        style={{
          borderColor: darkMode
            ? "oklch(0.24 0.06 255)"
            : "oklch(0.93 0.01 255)",
        }}
        data-ocid={`crm.table.row.${index + 1}`}
      >
        <TableCell>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-lg hover:opacity-70 transition-opacity"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                style={{ color: "oklch(0.55 0.04 255)" }}
              />
            </button>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
              style={{
                background: "oklch(0.65 0.2 150 / 0.15)",
                color: "oklch(0.65 0.2 150)",
              }}
            >
              {company.companyName?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div
                className="font-medium text-sm truncate"
                style={{ color: textPrimary(darkMode) }}
              >
                {company.companyName}
              </div>
              <div className="text-xs" style={{ color: textMuted(darkMode) }}>
                {company.industry}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <HealthScoreBadge score={healthScore} />
        </TableCell>
        <TableCell>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              background: activityStatus.bg,
              color: activityStatus.color,
            }}
          >
            {activityStatus.label}
          </span>
        </TableCell>
        <TableCell className="text-sm" style={{ color: textMuted(darkMode) }}>
          {formatRelativeTime(lastLoginNs)}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span
              className="text-xs tabular-nums"
              style={{ color: textMuted(darkMode) }}
            >
              {stats ? Number(stats.vehicleCount) : 0}
            </span>
            <div
              className="h-1.5 w-20 rounded-full overflow-hidden"
              style={{ background: "oklch(0.3 0.04 255 / 0.25)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${vehicleUsagePct}%`,
                  background:
                    vehicleUsagePct > 80
                      ? "oklch(0.58 0.18 22)"
                      : "oklch(0.65 0.2 150)",
                }}
              />
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {companyTags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  background: "oklch(0.5 0.22 264 / 0.1)",
                  color: "oklch(0.5 0.22 264)",
                }}
              >
                {tag}
              </span>
            ))}
            {companyTags.length > 2 && (
              <span className="text-xs" style={{ color: textMuted(darkMode) }}>
                +{companyTags.length - 2}
              </span>
            )}
          </div>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow
          style={{
            borderColor: darkMode
              ? "oklch(0.24 0.06 255)"
              : "oklch(0.93 0.01 255)",
          }}
        >
          <TableCell colSpan={6} className="p-0">
            <div
              className="px-6 py-5 space-y-4"
              style={{
                background: darkMode
                  ? "oklch(0.15 0.05 255)"
                  : "oklch(0.97 0.01 255)",
                borderTop: `1px solid ${darkMode ? "oklch(0.22 0.06 255)" : "oklch(0.90 0.01 255)"}`,
              }}
            >
              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  {
                    label: "Vehicles",
                    value: stats ? Number(stats.vehicleCount) : 0,
                  },
                  {
                    label: "Maintenance",
                    value: stats ? Number(stats.maintenanceCount) : 0,
                  },
                  {
                    label: "Work Orders",
                    value: stats ? Number(stats.workOrderCount) : 0,
                  },
                  {
                    label: "Users",
                    value: stats ? Number(stats.userCount) : 0,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: darkMode ? "oklch(0.18 0.05 255)" : "white",
                    }}
                  >
                    <div
                      className="text-lg font-bold tabular-nums"
                      style={{ color: textPrimary(darkMode) }}
                    >
                      {item.value}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: textMuted(darkMode) }}
                    >
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
              {/* Tags */}
              <div>
                <div
                  className="text-xs font-semibold mb-2"
                  style={{ color: textMuted(darkMode) }}
                >
                  Tags
                </div>
                <div className="flex flex-wrap gap-2">
                  {ALL_TAGS.map((tag) => {
                    const active = companyTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        className="text-xs px-2.5 py-1 rounded-full border transition-all"
                        style={{
                          background: active
                            ? "oklch(0.5 0.22 264 / 0.15)"
                            : "transparent",
                          color: active
                            ? "oklch(0.5 0.22 264)"
                            : textMuted(darkMode),
                          borderColor: active
                            ? "oklch(0.5 0.22 264 / 0.4)"
                            : darkMode
                              ? "oklch(0.28 0.05 255)"
                              : "oklch(0.88 0.01 255)",
                        }}
                        data-ocid={`crm.tag.${tag}`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Notes */}
              <div>
                <div
                  className="text-xs font-semibold mb-2"
                  style={{ color: textMuted(darkMode) }}
                >
                  Internal Notes
                </div>
                <Textarea
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    setNoteLoaded(true);
                  }}
                  onBlur={handleNoteBlur}
                  placeholder="Add internal notes about this company..."
                  rows={3}
                  className="resize-none text-sm"
                  data-ocid={`crm.notes.${index + 1}`}
                />
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function CustomerHealthSection({
  companies,
  devKey,
  isLoading,
  darkMode,
}: {
  companies: CompanySettings[];
  devKey: string;
  isLoading: boolean;
  darkMode: boolean;
}) {
  const [search, setSearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");

  const statsQuery = useAllCompaniesDashboardStats(devKey);
  const loginsQuery = useAllLastLogins(devKey);

  const statsMap = new Map<string, CompanyDashboardStats>(
    statsQuery.data ?? [],
  );
  const loginsMap = new Map<string, bigint>(loginsQuery.data ?? []);

  const filtered = companies.filter((c) => {
    const matchSearch =
      !search || c.companyName.toLowerCase().includes(search.toLowerCase());
    if (activityFilter === "all") return matchSearch;
    const loginNs = loginsMap.get(c.companyName);
    const status = getActivityStatus(loginNs)
      .label.toLowerCase()
      .replace(" ", "_");
    return matchSearch && status === activityFilter;
  });

  return (
    <div className="space-y-5" data-ocid="crm.section">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-ocid="crm.search_input"
          />
        </div>
        <Select value={activityFilter} onValueChange={setActivityFilter}>
          <SelectTrigger className="w-40" data-ocid="crm.activity.filter">
            <SelectValue placeholder="Activity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activity</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="at_risk">At Risk</SelectItem>
            <SelectItem value="churned">Churned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl overflow-hidden" style={cardStyle(darkMode)}>
        {isLoading || statsQuery.isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="w-full h-12" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="p-12 text-center text-sm"
            style={{ color: textMuted(darkMode) }}
            data-ocid="crm.empty"
          >
            No companies found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Health Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Vehicles</TableHead>
                <TableHead>Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c, i) => (
                <CompanyHealthRow
                  key={c.companyName}
                  company={c}
                  stats={statsMap.get(c.companyName)}
                  lastLoginNs={loginsMap.get(c.companyName)}
                  devKey={devKey}
                  darkMode={darkMode}
                  index={i}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

// ─── Audit Log ───────────────────────────────────────────────────────────────
const ACTION_STYLES: Record<string, { bg: string; color: string }> = {
  approved: { bg: "oklch(0.65 0.2 150 / 0.15)", color: "oklch(0.65 0.2 150)" },
  rejected: { bg: "oklch(0.58 0.18 22 / 0.15)", color: "oklch(0.58 0.18 22)" },
  deleted: { bg: "oklch(0.58 0.18 22 / 0.15)", color: "oklch(0.58 0.18 22)" },
  role_changed: {
    bg: "oklch(0.5 0.22 264 / 0.15)",
    color: "oklch(0.5 0.22 264)",
  },
  user_added: {
    bg: "oklch(0.65 0.2 150 / 0.15)",
    color: "oklch(0.65 0.2 150)",
  },
  user_removed: {
    bg: "oklch(0.72 0.17 85 / 0.15)",
    color: "oklch(0.72 0.17 85)",
  },
  tier_changed: {
    bg: "oklch(0.6 0.2 300 / 0.15)",
    color: "oklch(0.6 0.2 300)",
  },
  trial_started: {
    bg: "oklch(0.55 0.2 200 / 0.15)",
    color: "oklch(0.55 0.2 200)",
  },
  discount_created: {
    bg: "oklch(0.5 0.22 264 / 0.15)",
    color: "oklch(0.5 0.22 264)",
  },
  discount_deleted: {
    bg: "oklch(0.72 0.17 85 / 0.15)",
    color: "oklch(0.72 0.17 85)",
  },
};

function getActionStyle(action: string) {
  const key = action.toLowerCase().replace(/\s+/g, "_");
  return (
    ACTION_STYLES[key] ?? {
      bg: "oklch(0.5 0.03 255 / 0.15)",
      color: "oklch(0.55 0.04 255)",
    }
  );
}

export function AuditLogSection({
  devKey,
  darkMode,
}: {
  devKey: string;
  darkMode: boolean;
}) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const logsQuery = useAuditLogs(devKey);
  const exportMut = useExportAuditLogsCSV();

  const logs: AuditLog[] = logsQuery.data ?? [];

  // Get unique action types for filter
  const actionTypes = Array.from(new Set(logs.map((l) => l.action))).sort();

  const now = Date.now();
  const filtered = logs
    .filter((l) => {
      const matchSearch =
        !search ||
        l.entityName.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.actorPrincipal.toLowerCase().includes(search.toLowerCase());
      const matchAction = actionFilter === "all" || l.action === actionFilter;
      const ts = Number(l.timestamp) / 1_000_000;
      const matchDate =
        dateFilter === "all" ||
        (dateFilter === "today" && now - ts < 86_400_000) ||
        (dateFilter === "week" && now - ts < 7 * 86_400_000) ||
        (dateFilter === "month" && now - ts < 30 * 86_400_000);
      return matchSearch && matchAction && matchDate;
    })
    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

  const handleExport = () => {
    exportMut.mutate(
      { devKey },
      {
        onSuccess: () => toast.success("Audit logs exported"),
        onError: (e) => toast.error(`Export failed: ${e.message}`),
      },
    );
  };

  return (
    <div className="space-y-5" data-ocid="audit.section">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-48">
          <Input
            placeholder="Search by company, action, or principal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-ocid="audit.search_input"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-44" data-ocid="audit.action.filter">
            <SelectValue placeholder="Action type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actionTypes.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-36" data-ocid="audit.date.filter">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exportMut.isPending}
          data-ocid="audit.export.button"
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => logsQuery.refetch()}
          className="p-2"
          data-ocid="audit.refresh.button"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Summary */}
      <div className="text-xs" style={{ color: textMuted(darkMode) }}>
        Showing {filtered.length} of {logs.length} entries
      </div>

      {/* Timeline Table */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle(darkMode)}>
        {logsQuery.isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="w-full h-12" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3" data-ocid="audit.empty">
            <Shield className="w-10 h-10 mx-auto opacity-20" />
            <p className="text-sm" style={{ color: textMuted(darkMode) }}>
              No audit log entries found
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log, i) => {
                const style = getActionStyle(log.action);
                const ts = new Date(Number(log.timestamp) / 1_000_000);
                return (
                  <TableRow
                    key={String(log.id)}
                    style={{
                      borderColor: darkMode
                        ? "oklch(0.24 0.06 255)"
                        : "oklch(0.93 0.01 255)",
                    }}
                    data-ocid={`audit.table.row.${i + 1}`}
                  >
                    <TableCell
                      className="text-xs tabular-nums"
                      style={{ color: textMuted(darkMode) }}
                    >
                      <div>{ts.toLocaleDateString()}</div>
                      <div>{ts.toLocaleTimeString()}</div>
                    </TableCell>
                    <TableCell>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                        style={{ background: style.bg, color: style.color }}
                      >
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div
                        className="font-medium"
                        style={{ color: textPrimary(darkMode) }}
                      >
                        {log.entityName}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: textMuted(darkMode) }}
                      >
                        {log.entityType}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.oldValue || log.newValue ? (
                        <span style={{ color: textMuted(darkMode) }}>
                          {log.oldValue && (
                            <span className="line-through opacity-60">
                              {log.oldValue}
                            </span>
                          )}
                          {log.oldValue && log.newValue && " → "}
                          {log.newValue && (
                            <span style={{ color: "oklch(0.65 0.2 150)" }}>
                              {log.newValue}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span style={{ color: textMuted(darkMode) }}>—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <code
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          background: darkMode
                            ? "oklch(0.22 0.06 255)"
                            : "oklch(0.93 0.01 255)",
                          color: darkMode
                            ? "oklch(0.72 0.03 255)"
                            : "oklch(0.4 0.04 255)",
                        }}
                      >
                        {log.actorPrincipal.slice(0, 12)}…
                      </code>
                    </TableCell>
                    <TableCell>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background:
                            log.status === "success"
                              ? "oklch(0.65 0.2 150 / 0.1)"
                              : "oklch(0.58 0.18 22 / 0.1)",
                          color:
                            log.status === "success"
                              ? "oklch(0.65 0.2 150)"
                              : "oklch(0.58 0.18 22)",
                        }}
                      >
                        {log.status}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

// ─── System Health ────────────────────────────────────────────────────────────
export function SystemHealthSection({
  devKey,
  darkMode,
}: {
  devKey: string;
  darkMode: boolean;
}) {
  const statsQuery = useSystemStats(devKey);
  const pingQuery = usePingBackend(devKey);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const stats: SystemStats | null = statsQuery.data ?? null;
  const isOnline = !pingQuery.isError && !!pingQuery.data;

  const handleRefresh = () => {
    statsQuery.refetch();
    pingQuery.refetch();
    setLastCheck(new Date());
  };

  const entityCards = stats
    ? [
        {
          label: "Companies",
          value: Number(stats.totalCompanies),
          color: "oklch(0.65 0.2 150)",
          icon: Users,
        },
        {
          label: "Users",
          value: Number(stats.totalUsers),
          color: "oklch(0.5 0.22 264)",
          icon: Users,
        },
        {
          label: "Vehicles",
          value: Number(stats.totalVehicles),
          color: "oklch(0.72 0.17 85)",
          icon: Activity,
        },
        {
          label: "Maintenance Records",
          value: Number(stats.totalMaintenanceRecords),
          color: "oklch(0.6 0.2 300)",
          icon: Activity,
        },
        {
          label: "Work Orders",
          value: Number(stats.totalWorkOrders),
          color: "oklch(0.55 0.2 200)",
          icon: Activity,
        },
        {
          label: "Parts",
          value: Number(stats.totalParts),
          color: "oklch(0.58 0.18 22)",
          icon: Server,
        },
        {
          label: "Discount Codes",
          value: Number(stats.totalDiscountCodes),
          color: "oklch(0.65 0.2 150)",
          icon: TrendingUp,
        },
        {
          label: "Audit Logs",
          value: Number(stats.totalAuditLogs),
          color: "oklch(0.5 0.03 255)",
          icon: Shield,
        },
      ]
    : [];

  return (
    <div className="space-y-6" data-ocid="syshealth.section">
      {/* Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 flex items-center gap-4"
        style={cardStyle(darkMode)}
      >
        <div className="relative">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: isOnline
                ? "oklch(0.65 0.2 150 / 0.15)"
                : "oklch(0.58 0.18 22 / 0.15)",
            }}
          >
            <Server
              className="w-6 h-6"
              style={{
                color: isOnline ? "oklch(0.65 0.2 150)" : "oklch(0.58 0.18 22)",
              }}
            />
          </div>
          <div
            className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
            style={{
              background: isOnline
                ? "oklch(0.65 0.2 150)"
                : "oklch(0.58 0.18 22)",
              borderColor: darkMode ? "oklch(0.18 0.05 255)" : "white",
              boxShadow: `0 0 8px ${isOnline ? "oklch(0.65 0.2 150 / 0.5)" : "oklch(0.58 0.18 22 / 0.5)"}`,
            }}
          />
        </div>
        <div className="flex-1">
          <div
            className="font-semibold"
            style={{ color: textPrimary(darkMode) }}
          >
            {isOnline ? "All Systems Operational" : "Backend Unreachable"}
          </div>
          <div
            className="text-xs mt-0.5"
            style={{ color: textMuted(darkMode) }}
          >
            Last check: {lastCheck.toLocaleTimeString()}
            {stats?.backendVersion && ` · Version ${stats.backendVersion}`}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={statsQuery.isFetching || pingQuery.isFetching}
          data-ocid="syshealth.refresh.button"
          className="gap-2"
        >
          <RefreshCw
            className={`w-4 h-4 ${statsQuery.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </motion.div>

      {/* System Stats Grid */}
      {statsQuery.isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="w-full h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {entityCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl p-5"
                style={cardStyle(darkMode)}
                data-ocid={`syshealth.stat.${i + 1}`}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${card.color}20` }}
                >
                  <Icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
                <div
                  className="text-2xl font-bold tabular-nums"
                  style={{ color: textPrimary(darkMode) }}
                >
                  {card.value.toLocaleString()}
                </div>
                <div
                  className="text-xs mt-1"
                  style={{ color: textMuted(darkMode) }}
                >
                  {card.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Ping Response */}
      <div className="rounded-2xl p-6" style={cardStyle(darkMode)}>
        <h3
          className="font-semibold mb-4 flex items-center gap-2"
          style={{ color: textPrimary(darkMode) }}
        >
          <Heart className="w-4 h-4" style={{ color: "oklch(0.65 0.2 150)" }} />
          Backend Ping
        </h3>
        <div
          className="font-mono text-sm px-4 py-3 rounded-xl"
          style={{
            background: darkMode
              ? "oklch(0.14 0.04 255)"
              : "oklch(0.96 0.005 255)",
          }}
        >
          {pingQuery.isLoading ? (
            <Skeleton className="w-48 h-5" />
          ) : pingQuery.isError ? (
            <span style={{ color: "oklch(0.58 0.18 22)" }}>
              Connection failed
            </span>
          ) : (
            <span style={{ color: "oklch(0.65 0.2 150)" }}>
              {pingQuery.data}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
