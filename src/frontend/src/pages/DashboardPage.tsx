import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Package,
  Plus,
  Truck,
} from "lucide-react";
import type { Page } from "../App";
import type { Vehicle } from "../backend";
import { Status } from "../backend";
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

interface Props {
  onNavigate: (page: Page, params?: Record<string, unknown>) => void;
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        status === Status.Active
          ? "bg-success/10 text-success"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}

export function DashboardPage({ onNavigate }: Props) {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: vehicles, isLoading: vehiclesLoading } = useAllVehicles();
  const { data: upcoming, isLoading: upcomingLoading } =
    useUpcomingMaintenance();
  const { data: allRecords } = useAllMaintenanceRecords();
  const { data: profile } = useCallerProfile();
  const { data: companySettings } = useGetCompanySettings();

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
    </div>
  );
}
