import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  BarChart3,
  Box,
  Car,
  ClipboardList,
  Download,
  Printer,
  TrendingUp,
  Wrench,
} from "lucide-react";
import {
  MaintenanceType,
  Status,
  WorkOrderPriority,
  WorkOrderStatus,
} from "../backend";
import {
  useAllMaintenanceRecords,
  useAllParts,
  useAllVehicles,
  useAllWorkOrders,
  useGetCompanySettings,
  useGetDefaultCurrency,
} from "../hooks/useQueries";

function exportCSV(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) =>
          typeof cell === "string" && cell.includes(",")
            ? `"${cell}"`
            : String(cell),
        )
        .join(","),
    ),
  ].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function StatCard({
  title,
  value,
  icon: Icon,
  accent = "#6366f1",
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <div className="h-1 w-full" style={{ background: accent }} />
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl"
            style={{ background: `${accent}18` }}
          >
            <Icon size={20} style={{ color: accent }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider truncate">
              {title}
            </p>
            <p className="text-xl font-bold text-foreground mt-0.5 truncate">
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatMtType(type: MaintenanceType): string {
  const labels: Record<MaintenanceType, string> = {
    [MaintenanceType.OilChange]: "Oil Change",
    [MaintenanceType.Inspection]: "Inspection",
    [MaintenanceType.TireRotation]: "Tire Rotation",
    [MaintenanceType.Transmission]: "Transmission",
    [MaintenanceType.Bodywork]: "Bodywork",
    [MaintenanceType.BrakeService]: "Brake Service",
    [MaintenanceType.Electrical]: "Electrical",
    [MaintenanceType.EngineCheck]: "Engine Check",
    [MaintenanceType.Other]: "Other",
  };
  return labels[type] ?? String(type);
}

function priorityBadge(priority: WorkOrderPriority) {
  const map: Record<WorkOrderPriority, string> = {
    [WorkOrderPriority.Low]: "bg-slate-100 text-slate-700",
    [WorkOrderPriority.Medium]: "bg-amber-100 text-amber-700",
    [WorkOrderPriority.High]: "bg-orange-100 text-orange-700",
    [WorkOrderPriority.Critical]: "bg-red-100 text-red-700",
  };
  return (
    <Badge className={`${map[priority] ?? ""} border-0 text-xs font-semibold`}>
      {priority}
    </Badge>
  );
}

function statusBadgeWO(status: WorkOrderStatus) {
  const map: Record<WorkOrderStatus, string> = {
    [WorkOrderStatus.Open]: "bg-blue-100 text-blue-700",
    [WorkOrderStatus.InProgress]: "bg-yellow-100 text-yellow-700",
    [WorkOrderStatus.Completed]: "bg-green-100 text-green-700",
    [WorkOrderStatus.Cancelled]: "bg-gray-100 text-gray-500",
  };
  return (
    <Badge className={`${map[status] ?? ""} border-0 text-xs font-semibold`}>
      {status === WorkOrderStatus.InProgress ? "In Progress" : status}
    </Badge>
  );
}

const SKELETON_KEYS = ["sk-a", "sk-b", "sk-c", "sk-d"];

export function ReportsPage() {
  const { data: vehicles = [], isLoading: vLoading } = useAllVehicles();
  const { data: maintenanceRecords = [], isLoading: mLoading } =
    useAllMaintenanceRecords();
  const { data: parts = [], isLoading: pLoading } = useAllParts();
  const { data: workOrders = [], isLoading: woLoading } = useAllWorkOrders();
  const { data: companySettings } = useGetCompanySettings();
  const { data: currency = "CAD" } = useGetDefaultCurrency();

  const isLoading = vLoading || mLoading || pLoading || woLoading;

  // Fleet Summary stats
  const activeVehicles = vehicles.filter((v) => v.status === Status.Active);
  const inactiveVehicles = vehicles.filter((v) => v.status === Status.Inactive);
  const vehicleTypeBreakdown = vehicles.reduce(
    (acc, v) => {
      acc[String(v.vehicleType)] = (acc[String(v.vehicleType)] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Maintenance stats
  const totalRepairCost = maintenanceRecords.reduce(
    (sum, r) => sum + r.cost,
    0,
  );
  const avgCost =
    maintenanceRecords.length > 0
      ? totalRepairCost / maintenanceRecords.length
      : 0;
  const mtTypeCounts = maintenanceRecords.reduce(
    (acc, r) => {
      const key = String(r.maintenanceType);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const top5Types = Object.entries(mtTypeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const vehicleMap = new Map(vehicles.map((v) => [v.id.toString(), v.name]));

  // Parts stats
  const totalInventoryValue = parts.reduce(
    (sum, p) => sum + (p.price ?? 0) * Number(p.quantityInStock),
    0,
  );
  const lowStockCount = parts.filter(
    (p) => p.quantityInStock <= p.minStockLevel && p.quantityInStock > 0n,
  ).length;
  const outOfStockCount = parts.filter((p) => p.quantityInStock === 0n).length;

  // Work orders stats
  const openWOs = workOrders.filter(
    (wo) => wo.status === WorkOrderStatus.Open,
  ).length;
  const inProgressWOs = workOrders.filter(
    (wo) => wo.status === WorkOrderStatus.InProgress,
  ).length;
  const completedWOs = workOrders.filter(
    (wo) => wo.status === WorkOrderStatus.Completed,
  ).length;

  const formatDate = (ts: bigint) => {
    const ms = Number(ts / 1_000_000n);
    return new Date(ms).toLocaleDateString("en-CA");
  };

  const exportFleet = () => {
    exportCSV(
      "fleet-summary.csv",
      ["Name", "Type", "Make", "Model", "Year", "Status", "License Plate"],
      vehicles.map((v) => [
        v.name,
        String(v.vehicleType),
        v.make,
        v.model,
        Number(v.year),
        String(v.status),
        v.licensePlate,
      ]),
    );
  };

  const exportMaintenance = () => {
    exportCSV(
      "maintenance-report.csv",
      ["Date", "Vehicle", "Type", "Technician", `Cost (${currency})`],
      maintenanceRecords.map((r) => [
        formatDate(r.date),
        vehicleMap.get(r.vehicleId.toString()) ?? "Unknown",
        formatMtType(r.maintenanceType),
        r.technicianName,
        r.cost.toFixed(2),
      ]),
    );
  };

  const exportParts = () => {
    exportCSV(
      "parts-inventory.csv",
      [
        "Part Name",
        "Part #",
        "Qty",
        "Min Stock",
        `Unit Price (${currency})`,
        `Total Value (${currency})`,
        "Status",
      ],
      parts.map((p) => {
        let stockStatus = "In Stock";
        if (p.quantityInStock === 0n) stockStatus = "Out of Stock";
        else if (p.quantityInStock <= p.minStockLevel)
          stockStatus = "Low Stock";
        return [
          p.name,
          p.partNumber,
          Number(p.quantityInStock),
          Number(p.minStockLevel),
          (p.price ?? 0).toFixed(2),
          ((p.price ?? 0) * Number(p.quantityInStock)).toFixed(2),
          stockStatus,
        ];
      }),
    );
  };

  const exportWorkOrders = () => {
    exportCSV(
      "work-orders.csv",
      ["ID", "Title", "Vehicle", "Mechanic", "Priority", "Status", "Created"],
      workOrders.map((wo) => [
        Number(wo.id),
        wo.title,
        vehicleMap.get(wo.vehicleId.toString()) ?? "Unknown",
        wo.assignedMechanic,
        String(wo.priority),
        String(wo.status),
        formatDate(wo.createdAt),
      ]),
    );
  };

  return (
    <>
      <style>{`
        @media print {
          aside, .no-print, nav, header { display: none !important; }
          .print-all-tabs > [role="tabpanel"] { display: block !important; page-break-before: auto; }
          .print-all-tabs [role="tablist"] { display: none !important; }
          .print-header { display: flex !important; }
          body { font-size: 11pt; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 6px 10px; }
          th { background: #f0f4f8 !important; font-weight: 600; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          tr:nth-child(even) td { background: #f9fafb !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .shadow-sm, .shadow-card { box-shadow: none !important; }
          .overflow-hidden { overflow: visible !important; }
        }
      `}</style>

      {/* Print header — hidden on screen */}
      <div
        className="print-header hidden items-start justify-between mb-8 pb-5 border-b-2 border-gray-300"
        style={{ display: "none" }}
      >
        <div className="flex items-center gap-4">
          {companySettings?.logoUrl && (
            <img
              src={companySettings.logoUrl}
              alt="Logo"
              className="h-16 w-auto object-contain"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">
              {companySettings?.companyName ?? "FleetGuard"}
            </h1>
            <p className="text-sm text-gray-500">Fleet Intelligence Report</p>
          </div>
        </div>
        <div className="text-right text-sm text-gray-500">
          <p className="font-semibold">
            Generated: {new Date().toLocaleDateString()}
          </p>
          <p>{new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {companySettings?.logoUrl && (
              <img
                src={companySettings.logoUrl}
                alt="Logo"
                className="h-10 w-auto object-contain rounded-lg no-print"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="text-primary" size={26} />
                Reports
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {companySettings?.companyName
                  ? `${companySettings.companyName} — `
                  : ""}
                Fleet intelligence and operational insights
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="no-print gap-2"
            onClick={() => window.print()}
            data-ocid="reports.primary_button"
          >
            <Printer size={16} />
            Print Report
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4" data-ocid="reports.loading_state">
            {SKELETON_KEYS.map((k) => (
              <Skeleton key={k} className="h-32 w-full" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="fleet" className="print-all-tabs">
            <TabsList
              className="no-print grid w-full grid-cols-4 mb-6"
              data-ocid="reports.tab"
            >
              <TabsTrigger
                value="fleet"
                data-ocid="reports.fleet.tab"
                className="gap-1.5"
              >
                <Car size={14} /> Fleet
              </TabsTrigger>
              <TabsTrigger
                value="maintenance"
                data-ocid="reports.maintenance.tab"
                className="gap-1.5"
              >
                <Wrench size={14} /> Maintenance
              </TabsTrigger>
              <TabsTrigger
                value="parts"
                data-ocid="reports.parts.tab"
                className="gap-1.5"
              >
                <Box size={14} /> Parts
              </TabsTrigger>
              <TabsTrigger
                value="workorders"
                data-ocid="reports.workorders.tab"
                className="gap-1.5"
              >
                <ClipboardList size={14} /> Work Orders
              </TabsTrigger>
            </TabsList>

            {/* Fleet Summary */}
            <TabsContent value="fleet" className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  title="Total Vehicles"
                  value={vehicles.length}
                  icon={Car}
                  accent="#6366f1"
                />
                <StatCard
                  title="Active"
                  value={activeVehicles.length}
                  icon={TrendingUp}
                  accent="#10b981"
                />
                <StatCard
                  title="Inactive"
                  value={inactiveVehicles.length}
                  icon={AlertTriangle}
                  accent="#f59e0b"
                />
                <Card>
                  <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      By Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-4">
                    <div className="space-y-1">
                      {Object.entries(vehicleTypeBreakdown).map(
                        ([type, count]) => (
                          <div
                            key={type}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-muted-foreground">
                              {type}
                            </span>
                            <span className="font-semibold">{count}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between px-5 py-4">
                  <CardTitle className="text-base">Vehicle Fleet</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={exportFleet}
                    className="no-print gap-1.5"
                    data-ocid="reports.fleet.secondary_button"
                  >
                    <Download size={14} /> Export CSV
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table data-ocid="reports.fleet.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Make / Model</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>License Plate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicles.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center text-muted-foreground py-8"
                            data-ocid="reports.fleet.empty_state"
                          >
                            No vehicles found
                          </TableCell>
                        </TableRow>
                      ) : (
                        vehicles.map((v, i) => (
                          <TableRow
                            key={v.id.toString()}
                            data-ocid={`reports.fleet.row.${i + 1}`}
                          >
                            <TableCell className="font-medium">
                              {v.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {String(v.vehicleType)}
                            </TableCell>
                            <TableCell>
                              {v.make} {v.model}
                            </TableCell>
                            <TableCell>{Number(v.year)}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  v.status === Status.Active
                                    ? "bg-green-100 text-green-700 border-0"
                                    : "bg-gray-100 text-gray-600 border-0"
                                }
                              >
                                {String(v.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {v.licensePlate}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Maintenance Report */}
            <TabsContent value="maintenance" className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  title="Total Records"
                  value={maintenanceRecords.length}
                  icon={Wrench}
                />
                <StatCard
                  title={`Total Repair Cost (${currency})`}
                  value={`$${totalRepairCost.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  icon={TrendingUp}
                />
                <StatCard
                  title={`Avg Cost / Record (${currency})`}
                  value={`$${avgCost.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  icon={BarChart3}
                />
              </div>

              {top5Types.length > 0 && (
                <Card>
                  <CardHeader className="px-5 py-4">
                    <CardTitle className="text-base">
                      Top Maintenance Types
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 space-y-3">
                    {top5Types.map(([type, count]) => (
                      <div key={type} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">
                            {formatMtType(type as MaintenanceType)}
                          </span>
                          <span className="text-muted-foreground">
                            {count} records (
                            {Math.round(
                              (count / maintenanceRecords.length) * 100,
                            )}
                            %)
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${
                                (count / maintenanceRecords.length) * 100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="flex flex-row items-center justify-between px-5 py-4">
                  <CardTitle className="text-base">
                    Maintenance Records
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={exportMaintenance}
                    className="no-print gap-1.5"
                    data-ocid="reports.maintenance.secondary_button"
                  >
                    <Download size={14} /> Export CSV
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table data-ocid="reports.maintenance.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Technician</TableHead>
                        <TableHead>Cost ({currency})</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenanceRecords.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center text-muted-foreground py-8"
                            data-ocid="reports.maintenance.empty_state"
                          >
                            No records found
                          </TableCell>
                        </TableRow>
                      ) : (
                        maintenanceRecords.map((r, i) => (
                          <TableRow
                            key={r.id.toString()}
                            data-ocid={`reports.maintenance.row.${i + 1}`}
                          >
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(r.date)}
                            </TableCell>
                            <TableCell className="font-medium">
                              {vehicleMap.get(r.vehicleId.toString()) ??
                                "Unknown"}
                            </TableCell>
                            <TableCell>
                              {formatMtType(r.maintenanceType)}
                            </TableCell>
                            <TableCell>{r.technicianName}</TableCell>
                            <TableCell className="font-mono">
                              $
                              {r.cost.toLocaleString("en-CA", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Parts Inventory */}
            <TabsContent value="parts" className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Total Parts" value={parts.length} icon={Box} />
                <StatCard
                  title={`Total Inventory Value (${currency})`}
                  value={`$${totalInventoryValue.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  icon={TrendingUp}
                />
                <StatCard
                  title="Low / Out of Stock"
                  value={`${lowStockCount} / ${outOfStockCount}`}
                  icon={AlertTriangle}
                />
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between px-5 py-4">
                  <CardTitle className="text-base">Parts Inventory</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={exportParts}
                    className="no-print gap-1.5"
                    data-ocid="reports.parts.secondary_button"
                  >
                    <Download size={14} /> Export CSV
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table data-ocid="reports.parts.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part Name</TableHead>
                        <TableHead>Part #</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Min Stock</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total Value</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parts.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center text-muted-foreground py-8"
                            data-ocid="reports.parts.empty_state"
                          >
                            No parts found
                          </TableCell>
                        </TableRow>
                      ) : (
                        parts.map((p, i) => {
                          let stockStatus = "In Stock";
                          let badgeClass =
                            "bg-green-100 text-green-700 border-0";
                          if (p.quantityInStock === 0n) {
                            stockStatus = "Out of Stock";
                            badgeClass = "bg-red-100 text-red-700 border-0";
                          } else if (p.quantityInStock <= p.minStockLevel) {
                            stockStatus = "Low Stock";
                            badgeClass = "bg-amber-100 text-amber-700 border-0";
                          }
                          return (
                            <TableRow
                              key={p.id.toString()}
                              data-ocid={`reports.parts.row.${i + 1}`}
                            >
                              <TableCell className="font-medium">
                                {p.name}
                              </TableCell>
                              <TableCell className="font-mono text-sm text-muted-foreground">
                                {p.partNumber}
                              </TableCell>
                              <TableCell>{Number(p.quantityInStock)}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {Number(p.minStockLevel)}
                              </TableCell>
                              <TableCell className="font-mono">
                                ${(p.price ?? 0).toFixed(2)}
                              </TableCell>
                              <TableCell className="font-mono">
                                $
                                {(
                                  (p.price ?? 0) * Number(p.quantityInStock)
                                ).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Badge className={badgeClass}>
                                  {stockStatus}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Work Orders */}
            <TabsContent value="workorders" className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  title="Total"
                  value={workOrders.length}
                  icon={ClipboardList}
                />
                <StatCard title="Open" value={openWOs} icon={AlertTriangle} />
                <StatCard
                  title="In Progress"
                  value={inProgressWOs}
                  icon={Wrench}
                />
                <StatCard
                  title="Completed"
                  value={completedWOs}
                  icon={TrendingUp}
                />
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between px-5 py-4">
                  <CardTitle className="text-base">Work Orders</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={exportWorkOrders}
                    className="no-print gap-1.5"
                    data-ocid="reports.workorders.secondary_button"
                  >
                    <Download size={14} /> Export CSV
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table data-ocid="reports.workorders.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Mechanic</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workOrders.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center text-muted-foreground py-8"
                            data-ocid="reports.workorders.empty_state"
                          >
                            No work orders found
                          </TableCell>
                        </TableRow>
                      ) : (
                        workOrders.map((wo, i) => (
                          <TableRow
                            key={wo.id.toString()}
                            data-ocid={`reports.workorders.row.${i + 1}`}
                          >
                            <TableCell className="font-mono text-sm text-muted-foreground">
                              #{Number(wo.id)}
                            </TableCell>
                            <TableCell className="font-medium">
                              {wo.title}
                            </TableCell>
                            <TableCell>
                              {vehicleMap.get(wo.vehicleId.toString()) ??
                                "Unknown"}
                            </TableCell>
                            <TableCell>{wo.assignedMechanic}</TableCell>
                            <TableCell>{priorityBadge(wo.priority)}</TableCell>
                            <TableCell>{statusBadgeWO(wo.status)}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(wo.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}
