import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Package,
  Plus,
  Truck,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import type { Page } from "../App";
import type { Vehicle } from "../backend";
import { VehicleStatus } from "../backend";
import { useActor } from "../hooks/useActor";
import {
  useAllMaintenanceRecords,
  useAllVehicles,
  useCallerProfile,
  useDashboardStats,
  useGetCompanySettings,
  useUpcomingMaintenance,
} from "../hooks/useQueries";
import {
  formatCurrency,
  formatDate,
  maintenanceTypeLabel,
  vehicleTypeLabel,
} from "../lib/helpers";

interface ServiceSchedule {
  id: bigint;
  vehicleId: bigint;
  serviceType: string;
  intervalDays: bigint;
  nextDueDate: bigint;
  lastCompletedDate?: bigint;
  notes: string;
  status: string;
  createdAt: bigint;
}

interface Props {
  onNavigate: (page: Page, params?: Record<string, unknown>) => void;
}

function StatusBadge({ status }: { status: VehicleStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        status === VehicleStatus.Active
          ? "bg-success/10 text-success"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}

export function DashboardPage({ onNavigate }: Props) {
  const { actor, isFetching: actorFetching } = useActor();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: vehicles, isLoading: vehiclesLoading } = useAllVehicles();
  const { data: upcoming, isLoading: upcomingLoading } =
    useUpcomingMaintenance();
  const { data: allRecords } = useAllMaintenanceRecords();
  const { data: profile } = useCallerProfile();
  const { data: companySettings } = useGetCompanySettings();

  const { data: serviceSchedules } = useQuery<ServiceSchedule[]>({
    queryKey: ["serviceSchedules"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllServiceSchedules() as Promise<
        ServiceSchedule[]
      >;
    },
    enabled: !!actor && !actorFetching,
  });

  const now = Date.now();

  const overdueSchedules = useMemo(
    () =>
      (serviceSchedules ?? []).filter(
        (s) => s.status === "Active" && Number(s.nextDueDate) / 1_000_000 < now,
      ),
    [serviceSchedules, now],
  );

  const dueSoonSchedules = useMemo(
    () =>
      (serviceSchedules ?? []).filter((s) => {
        const dueDateMs = Number(s.nextDueDate) / 1_000_000;
        const sevenDaysLater = now + 7 * 24 * 60 * 60 * 1000;
        return (
          s.status === "Active" &&
          dueDateMs >= now &&
          dueDateMs <= sevenDaysLater
        );
      }),
    [serviceSchedules, now],
  );

  // One-time session toast notifications
  useEffect(() => {
    if (!serviceSchedules || serviceSchedules.length === 0) return;
    if (sessionStorage.getItem("scheduleAlertsShown")) return;
    if (overdueSchedules.length === 0 && dueSoonSchedules.length === 0) return;

    for (const s of overdueSchedules.slice(0, 3)) {
      const vehicle = vehicles?.find((v: Vehicle) => v.id === s.vehicleId);
      const vehicleName = vehicle?.name ?? "Unknown Vehicle";
      toast.error(`Overdue: ${s.serviceType} on ${vehicleName}`);
    }

    for (const s of dueSoonSchedules.slice(0, 3)) {
      const vehicle = vehicles?.find((v: Vehicle) => v.id === s.vehicleId);
      const vehicleName = vehicle?.name ?? "Unknown Vehicle";
      const dueDateMs = Number(s.nextDueDate) / 1_000_000;
      const daysUntil = Math.ceil((dueDateMs - now) / (24 * 60 * 60 * 1000));
      toast(
        `Due soon: ${s.serviceType} on ${vehicleName} (${daysUntil} day${
          daysUntil !== 1 ? "s" : ""
        })`,
        { style: { background: "hsl(45 93% 47%)", color: "#fff" } },
      );
    }

    sessionStorage.setItem("scheduleAlertsShown", "1");
  }, [serviceSchedules, overdueSchedules, dueSoonSchedules, vehicles, now]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const recentRecords =
    allRecords
      ?.slice()
      .sort((a, b) => Number(b.createdAt - a.createdAt))
      .slice(0, 5) ?? [];

  const lowStockCount = Number(stats?.lowStockPartsCount ?? 0n);

  // Top repair reasons
  const repairReasonData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of allRecords ?? []) {
      const label =
        maintenanceTypeLabel[r.maintenanceType] ?? r.maintenanceType;
      counts[label] = (counts[label] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));
  }, [allRecords]);

  // Monthly repair cost (last 6 months)
  const monthlyRepairData = useMemo(() => {
    const now = new Date();
    const months: { label: string; year: number; month: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleString("default", { month: "short" }),
        year: d.getFullYear(),
        month: d.getMonth(),
      });
    }
    return months.map(({ label, year, month }) => {
      const total = (allRecords ?? []).reduce((sum, r) => {
        const d = new Date(Number(r.date) / 1_000_000);
        if (d.getFullYear() === year && d.getMonth() === month) {
          return sum + r.cost;
        }
        return sum;
      }, 0);
      return { name: label, cost: Math.round(total) };
    });
  }, [allRecords]);

  const kpis = [
    {
      label: "Total Vehicles",
      value: stats?.totalVehicles ?? 0n,
      icon: Truck,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Active Vehicles",
      value: stats?.activeVehicles ?? 0n,
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Upcoming Service",
      value: stats?.upcomingMaintenanceCount ?? 0n,
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Overdue",
      value: stats?.overdueCount ?? 0n,
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Low Stock Parts",
      value: stats?.lowStockPartsCount ?? 0n,
      icon: Package,
      color: "text-warning",
      bg: "bg-warning/10",
    },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in" data-ocid="dashboard.page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {companySettings?.logoUrl && (
            <img
              src={companySettings.logoUrl}
              alt="Company Logo"
              className="h-10 w-10 rounded-lg object-cover"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {greeting()}
              {profile?.name ? `, ${profile.name}` : ""} 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Here's what's happening with your fleet today.
            </p>
          </div>
        </div>
        <Button
          data-ocid="dashboard.primary_button"
          onClick={() => onNavigate("vehicles")}
          className="gap-2"
        >
          <Plus size={16} /> Add Vehicle
        </Button>
      </div>

      {/* Low Stock Alert */}
      {!statsLoading && lowStockCount > 0 && (
        <div
          data-ocid="dashboard.lowstock.card"
          className="flex items-center gap-3 px-5 py-4 rounded-xl bg-warning/10 border border-warning/30"
        >
          <Package className="w-5 h-5 text-warning flex-shrink-0" />
          <p className="text-sm font-medium text-warning flex-1">
            <span className="font-bold">
              {lowStockCount} part{lowStockCount !== 1 ? "s" : ""}
            </span>{" "}
            running low on stock — reorder soon.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="border-warning/40 text-warning hover:bg-warning/10 h-8 text-xs"
            onClick={() => onNavigate("parts")}
            data-ocid="dashboard.lowstock.button"
          >
            View Parts
          </Button>
        </div>
      )}

      {/* Overdue Schedules Alert */}
      {overdueSchedules.length > 0 && (
        <div
          data-ocid="dashboard.overdue.card"
          className="flex items-center gap-3 px-5 py-4 rounded-xl bg-destructive/10 border border-destructive/30"
        >
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
          <p className="text-sm font-medium text-destructive flex-1">
            <span className="font-bold">
              {overdueSchedules.length} service schedule
              {overdueSchedules.length !== 1 ? "s" : ""}
            </span>{" "}
            are overdue — immediate attention required.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="border-destructive/40 text-destructive hover:bg-destructive/10 h-8 text-xs"
            onClick={() => onNavigate("service-schedules")}
            data-ocid="dashboard.overdue.button"
          >
            View Schedules
          </Button>
        </div>
      )}

      {/* Due Soon Alert */}
      {dueSoonSchedules.length > 0 && (
        <div
          data-ocid="dashboard.duesoon.card"
          className="flex items-center gap-3 px-5 py-4 rounded-xl bg-warning/10 border border-warning/30"
        >
          <Clock className="w-5 h-5 text-warning flex-shrink-0" />
          <p className="text-sm font-medium text-warning flex-1">
            <span className="font-bold">
              {dueSoonSchedules.length} service
              {dueSoonSchedules.length !== 1 ? "s" : ""}
            </span>{" "}
            due within the next 7 days.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="border-warning/40 text-warning hover:bg-warning/10 h-8 text-xs"
            onClick={() => onNavigate("service-schedules")}
            data-ocid="dashboard.duesoon.button"
          >
            View Schedules
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div
        className="grid grid-cols-2 lg:grid-cols-5 gap-4"
        data-ocid="dashboard.section"
      >
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={kpi.label}
              className="shadow-card border-0"
              data-ocid={`dashboard.card.${i + 1}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {kpi.label}
                    </p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      <p className="text-3xl font-bold text-foreground">
                        {kpi.value.toString()}
                      </p>
                    )}
                  </div>
                  <div
                    className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Fleet Overview */}
        <Card className="shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">
              Fleet Overview
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary text-xs gap-1 h-7"
              onClick={() => onNavigate("vehicles")}
              data-ocid="dashboard.vehicles.link"
            >
              View all <ChevronRight size={14} />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            {vehiclesLoading ? (
              ["a", "b", "c", "d"].map((k) => (
                <Skeleton key={k} className="h-12 w-full" />
              ))
            ) : vehicles?.length === 0 ? (
              <div
                data-ocid="dashboard.empty_state"
                className="text-center py-8 text-muted-foreground text-sm"
              >
                No vehicles yet
              </div>
            ) : (
              vehicles?.slice(0, 5).map((v: Vehicle, i: number) => (
                <button
                  type="button"
                  key={v.id.toString()}
                  data-ocid={`dashboard.vehicles.item.${i + 1}`}
                  onClick={() =>
                    onNavigate("vehicle-detail", { vehicleId: v.id })
                  }
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{v.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {vehicleTypeLabel[v.vehicleType]} · {v.licensePlate}
                    </p>
                  </div>
                  <StatusBadge status={v.status} />
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming Maintenance */}
        <Card className="shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">
              Upcoming Maintenance
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary text-xs gap-1 h-7"
              onClick={() => onNavigate("maintenance")}
              data-ocid="dashboard.maintenance.link"
            >
              View all <ChevronRight size={14} />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            {upcomingLoading ? (
              ["a", "b", "c"].map((k) => (
                <Skeleton key={k} className="h-12 w-full" />
              ))
            ) : upcoming?.length === 0 ? (
              <div
                data-ocid="dashboard.upcoming.empty_state"
                className="text-center py-8 text-muted-foreground text-sm"
              >
                No upcoming maintenance
              </div>
            ) : (
              upcoming?.slice(0, 5).map((r, i) => {
                const vehicle = vehicles?.find(
                  (v: Vehicle) => v.id === r.vehicleId,
                );
                return (
                  <div
                    key={r.id.toString()}
                    data-ocid={`dashboard.upcoming.item.${i + 1}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-warning/5 border border-warning/20"
                  >
                    <Clock className="w-4 h-4 text-warning flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {maintenanceTypeLabel[r.maintenanceType]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {vehicle?.name ?? "Unknown"}
                      </p>
                    </div>
                    {r.nextServiceDate && (
                      <span className="text-xs text-warning font-medium">
                        {formatDate(r.nextServiceDate)}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue Service Schedules Card */}
      {overdueSchedules.length > 0 && (
        <Card className="shadow-card border-0 border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <CardTitle className="text-base font-semibold text-destructive">
                Overdue Service Schedules
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive text-xs gap-1 h-7"
              onClick={() => onNavigate("service-schedules")}
              data-ocid="dashboard.overdue.schedules.link"
            >
              View All <ChevronRight size={14} />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            {overdueSchedules.slice(0, 5).map((s, i) => {
              const vehicle = vehicles?.find(
                (v: Vehicle) => v.id === s.vehicleId,
              );
              const dueDateMs = Number(s.nextDueDate) / 1_000_000;
              const daysOverdue = Math.floor(
                (now - dueDateMs) / (24 * 60 * 60 * 1000),
              );
              return (
                <div
                  key={s.id.toString()}
                  data-ocid={`dashboard.overdue.schedules.item.${i + 1}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-destructive/5 border border-destructive/20"
                >
                  <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {s.serviceType}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {vehicle?.name ?? "Unknown Vehicle"}
                    </p>
                  </div>
                  <Badge variant="destructive" className="text-xs shrink-0">
                    {daysOverdue} day{daysOverdue !== 1 ? "s" : ""} overdue
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="shadow-card border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentRecords.length === 0 ? (
            <div
              data-ocid="dashboard.activity.empty_state"
              className="text-center py-8 text-muted-foreground text-sm"
            >
              No recent activity
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-ocid="dashboard.table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">
                      Vehicle
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                      Type
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                      Date
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                      Cost
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">
                      Technician
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentRecords.map((r, i) => {
                    const vehicle = vehicles?.find(
                      (v: Vehicle) => v.id === r.vehicleId,
                    );
                    return (
                      <tr
                        key={r.id.toString()}
                        data-ocid={`dashboard.activity.row.${i + 1}`}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-3 font-medium">
                          {vehicle?.name ?? "Unknown"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="text-xs">
                            {maintenanceTypeLabel[r.maintenanceType]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(r.date)}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {formatCurrency(r.cost)}
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">
                          {r.technicianName}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Row: Top Repair Reasons + Monthly Repair Cost */}
      {(allRecords ?? []).length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Repair Reasons — upgraded donut with legend */}
          <Card
            className="shadow-card border-0"
            data-ocid="dashboard.repair_reasons.card"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Top Repair Reasons
              </CardTitle>
            </CardHeader>
            <CardContent>
              {repairReasonData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground text-sm gap-2">
                  <span className="text-3xl">🔧</span>
                  <span>No maintenance records yet</span>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Donut chart — centered with total label */}
                  <div className="relative flex justify-center">
                    <ResponsiveContainer width={200} height={200}>
                      <PieChart>
                        <Pie
                          data={repairReasonData}
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="count"
                          strokeWidth={0}
                        >
                          {repairReasonData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={
                                [
                                  "#3b82f6",
                                  "#7c3aed",
                                  "#f59e0b",
                                  "#10b981",
                                  "#f43f5e",
                                  "#06b6d4",
                                ][index % 6]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 8,
                            fontSize: 12,
                            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                          }}
                          formatter={(value: number) => [
                            `${value} records`,
                            "",
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-foreground">
                        {repairReasonData.reduce((s, r) => s + r.count, 0)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        records
                      </span>
                    </div>
                  </div>
                  {/* Legend rows */}
                  <div className="space-y-2">
                    {repairReasonData.map((entry, index) => {
                      const colors = [
                        "#3b82f6",
                        "#7c3aed",
                        "#f59e0b",
                        "#10b981",
                        "#f43f5e",
                        "#06b6d4",
                      ];
                      const total = repairReasonData.reduce(
                        (s, r) => s + r.count,
                        0,
                      );
                      const pct =
                        total > 0 ? Math.round((entry.count / total) * 100) : 0;
                      return (
                        <div
                          key={entry.name}
                          className="flex items-center gap-2.5"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: colors[index % 6] }}
                          />
                          <span className="text-sm flex-1 truncate text-foreground">
                            {entry.name}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {entry.count} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Repair Cost — multi-color bars */}
          <Card
            className="shadow-card border-0"
            data-ocid="dashboard.monthly_cost.card"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Monthly Repair Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyRepairData.every((d) => d.cost === 0) ? (
                <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground text-sm gap-2">
                  <span className="text-3xl">📊</span>
                  <span>No cost data yet</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={monthlyRepairData}
                    margin={{ left: 0, right: 8, top: 20, bottom: 4 }}
                    barCategoryGap="28%"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                      opacity={0.35}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{
                        fontSize: 12,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{
                        fontSize: 11,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) =>
                        v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                      }
                      width={44}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                      formatter={(value: number) => [
                        `$${value.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        "Total Cost",
                      ]}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 10,
                        fontSize: 12,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                      }}
                      labelStyle={{
                        color: "hsl(var(--foreground))",
                        fontWeight: 600,
                      }}
                    />
                    <Bar dataKey="cost" radius={[6, 6, 0, 0]} maxBarSize={56}>
                      {monthlyRepairData.map((entry, index) => (
                        <Cell
                          key={`bar-${entry.name}`}
                          fill={
                            [
                              "#3b82f6",
                              "#7c3aed",
                              "#f59e0b",
                              "#10b981",
                              "#f43f5e",
                              "#06b6d4",
                            ][index % 6]
                          }
                        />
                      ))}
                      <LabelList
                        dataKey="cost"
                        position="top"
                        formatter={(v: number) =>
                          v > 0
                            ? v >= 1000
                              ? `$${(v / 1000).toFixed(0)}k`
                              : `$${v}`
                            : ""
                        }
                        style={{
                          fontSize: 10,
                          fill: "hsl(var(--muted-foreground))",
                          fontWeight: 500,
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
