import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  FilterX,
  Hash,
  Pencil,
  Plus,
  Printer,
  Truck,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { MaintenanceType, VehicleStatus } from "../backend";
import type { MaintenanceRecordFull } from "../backend";
import { MaintenanceModal } from "../components/MaintenanceModal";
import { VehicleModal } from "../components/VehicleModal";
import {
  useGetCompanySettings,
  useIsAdmin,
  useMaintenanceByVehicle,
  useVehicle,
} from "../hooks/useQueries";
import {
  formatCurrency,
  formatDate,
  maintenanceTypeLabel,
  vehicleTypeLabel,
} from "../lib/helpers";

type Page = "dashboard" | "vehicles" | "maintenance" | "vehicle-detail";
interface Props {
  vehicleId: bigint;
  onNavigate: (page: Page, params?: Record<string, unknown>) => void;
}

export function VehicleDetailPage({ vehicleId, onNavigate }: Props) {
  const { data: vehicle, isLoading: vLoading } = useVehicle(vehicleId);
  const { data: records, isLoading: rLoading } =
    useMaintenanceByVehicle(vehicleId);
  const { data: isAdmin } = useIsAdmin();
  const { data: companySettings } = useGetCompanySettings();
  const [mModalOpen, setMModalOpen] = useState(false);
  const [vModalOpen, setVModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<MaintenanceRecordFull | null>(
    null,
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const sortedRecords =
    records?.slice().sort((a, b) => Number(b.date - a.date)) ?? [];

  const filteredRecords = useMemo(() => {
    return sortedRecords.filter((r) => {
      const recDate = new Date(Number(r.date) / 1_000_000);
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (recDate < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (recDate > to) return false;
      }
      if (typeFilter && String(r.maintenanceType) !== typeFilter) return false;
      return true;
    });
  }, [sortedRecords, dateFrom, dateTo, typeFilter]);

  const hasActiveFilters = dateFrom || dateTo || typeFilter;

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setTypeFilter("");
  };

  const maintenanceTypes = Object.values(MaintenanceType) as MaintenanceType[];

  return (
    <>
      <style>{`
        @media print {
          aside, .no-print, nav, header, .print-hide { display: none !important; }
          body { font-size: 11pt; color: #111; }
          .print-header { display: flex !important; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
          th { background: #f0f4f8 !important; font-weight: 600; font-size: 10pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          tr:nth-child(even) td { background: #fafafa !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .badge-print { border: 1px solid #aaa; border-radius: 4px; padding: 1px 6px; font-size: 9pt; }
        }
      `}</style>

      {/* Print header — hidden on screen, shown in print */}
      <div
        className="print-header hidden items-start justify-between mb-6 pb-4 border-b-2 border-gray-300"
        style={{ display: "none" }}
      >
        <div className="flex items-center gap-4">
          {companySettings?.logoUrl && (
            <img
              src={companySettings.logoUrl}
              alt="Company Logo"
              className="h-14 w-auto object-contain"
            />
          )}
          <div>
            <h1 className="text-xl font-bold">
              {companySettings?.companyName ?? "Fleet Maintenance"}
            </h1>
            <p className="text-sm text-gray-500">Vehicle Maintenance Report</p>
          </div>
        </div>
        <div className="text-right text-sm text-gray-500">
          <p>Generated: {new Date().toLocaleDateString()}</p>
          {hasActiveFilters && (
            <p>
              Filters: {dateFrom ? `From ${dateFrom}` : ""}
              {dateTo ? ` To ${dateTo}` : ""}
              {typeFilter
                ? ` · ${maintenanceTypeLabel[typeFilter as MaintenanceType] ?? typeFilter}`
                : ""}
            </p>
          )}
          <p>Records: {filteredRecords.length}</p>
        </div>
      </div>

      <div
        className="p-6 space-y-5 animate-fade-in"
        data-ocid="vehicle_detail.page"
      >
        <div className="flex items-center gap-3 no-print">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => onNavigate("vehicles")}
            data-ocid="vehicle_detail.link"
          >
            <ArrowLeft size={16} /> Back to Fleet
          </Button>
        </div>

        {vLoading ? (
          <Skeleton
            className="h-48 w-full"
            data-ocid="vehicle_detail.loading_state"
          />
        ) : !vehicle ? (
          <div
            data-ocid="vehicle_detail.error_state"
            className="text-center py-16 text-muted-foreground"
          >
            Vehicle not found
          </div>
        ) : (
          <Card className="shadow-card border-0">
            <CardHeader className="flex flex-row items-start justify-between pb-3">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Truck className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{vehicle.name}</h1>
                  <p className="text-muted-foreground">
                    {vehicle.year.toString()} {vehicle.make} {vehicle.model}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 no-print">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                    vehicle.status === VehicleStatus.Active
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      vehicle.status === VehicleStatus.Active
                        ? "bg-success"
                        : "bg-muted-foreground"
                    }`}
                  />
                  {vehicle.status}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => window.print()}
                  data-ocid="vehicle_detail.secondary_button"
                >
                  <Printer size={14} /> Print Record
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setVModalOpen(true)}
                  data-ocid="vehicle_detail.edit_button"
                >
                  <Pencil size={14} /> Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    icon: Hash,
                    label: "License Plate",
                    value: vehicle.licensePlate,
                  },
                  {
                    icon: Truck,
                    label: "Vehicle Type",
                    value: vehicleTypeLabel[vehicle.vehicleType],
                  },
                  {
                    icon: Calendar,
                    label: "Added",
                    value: formatDate(vehicle.createdAt),
                  },
                  { icon: User, label: "Notes", value: vehicle.notes || "—" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {label}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Maintenance History */}
        <div className="flex items-center justify-between no-print">
          <h2 className="text-lg font-semibold">Maintenance History</h2>
          <Button
            className="gap-2"
            onClick={() => {
              setEditRecord(null);
              setMModalOpen(true);
            }}
            data-ocid="vehicle_detail.primary_button"
          >
            <Plus size={16} /> Add Record
          </Button>
        </div>

        {/* Filter Row */}
        {sortedRecords.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 no-print p-4 bg-muted/30 rounded-xl border border-border/40">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-muted-foreground" />
              <label
                htmlFor="filter-from"
                className="text-xs text-muted-foreground font-medium"
              >
                From
              </label>
              <input
                id="filter-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-sm px-2 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-ocid="vehicle_detail.input"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="filter-to"
                className="text-xs text-muted-foreground font-medium"
              >
                To
              </label>
              <input
                id="filter-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-sm px-2 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-ocid="vehicle_detail.input"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="filter-type"
                className="text-xs text-muted-foreground font-medium"
              >
                Type
              </label>
              <select
                id="filter-type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-sm px-2 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-ocid="vehicle_detail.select"
              >
                <option value="">All Types</option>
                {maintenanceTypes.map((t) => (
                  <option key={t} value={String(t)}>
                    {maintenanceTypeLabel[t]}
                  </option>
                ))}
              </select>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground h-8"
                onClick={clearFilters}
                data-ocid="vehicle_detail.secondary_button"
              >
                <FilterX size={14} /> Clear Filters
              </Button>
            )}
            {hasActiveFilters && (
              <span className="text-xs text-muted-foreground ml-auto">
                Showing {filteredRecords.length} of {sortedRecords.length}{" "}
                records
              </span>
            )}
          </div>
        )}

        <div className="bg-card rounded-xl shadow-card border-0 overflow-hidden">
          {rLoading ? (
            <div
              className="p-6 space-y-3"
              data-ocid="vehicle_detail.loading_state"
            >
              {["a", "b", "c"].map((k) => (
                <Skeleton key={k} className="h-14 w-full" />
              ))}
            </div>
          ) : sortedRecords.length === 0 ? (
            <div
              data-ocid="vehicle_detail.empty_state"
              className="text-center py-16"
            >
              <p className="text-muted-foreground font-medium">
                No maintenance records yet
              </p>
              <Button
                className="mt-4 gap-2"
                onClick={() => {
                  setEditRecord(null);
                  setMModalOpen(true);
                }}
              >
                <Plus size={16} /> Add First Record
              </Button>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div
              data-ocid="vehicle_detail.empty_state"
              className="text-center py-12"
            >
              <p className="text-muted-foreground font-medium">
                No records match your filters
              </p>
              <Button
                variant="ghost"
                className="mt-3 gap-1.5"
                onClick={clearFilters}
              >
                <FilterX size={14} /> Clear Filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="w-full text-sm"
                data-ocid="vehicle_detail.table"
              >
                <thead className="bg-muted/50">
                  <tr>
                    {[
                      "Type",
                      "Date",
                      "Description",
                      "Mileage",
                      "Cost",
                      "Technician",
                      "Next Service",
                      isAdmin ? "Actions" : "",
                    ]
                      .filter(Boolean)
                      .map((h) => (
                        <th
                          key={h}
                          className="text-left text-xs font-semibold text-muted-foreground px-5 py-3.5 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredRecords.map(
                    (r: MaintenanceRecordFull, i: number) => (
                      <tr
                        key={r.id.toString()}
                        data-ocid={`vehicle_detail.item.${i + 1}`}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <Badge
                            variant="secondary"
                            className="text-xs whitespace-nowrap"
                          >
                            {maintenanceTypeLabel[r.maintenanceType]}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">
                          {formatDate(r.date)}
                        </td>
                        <td className="px-5 py-4 max-w-xs">
                          <p className="truncate">{r.description}</p>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {r.mileage.toLocaleString()} mi
                        </td>
                        <td className="px-5 py-4 font-medium">
                          {formatCurrency(r.cost)}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">
                          {r.technicianName}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">
                          {r.nextServiceDate
                            ? formatDate(r.nextServiceDate)
                            : "—"}
                        </td>
                        {isAdmin && (
                          <td className="px-5 py-4 no-print">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              data-ocid={`vehicle_detail.edit_button.${i + 1}`}
                              onClick={() => {
                                setEditRecord(r);
                                setMModalOpen(true);
                              }}
                            >
                              <Pencil size={14} />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {vehicle && (
          <>
            <MaintenanceModal
              open={mModalOpen}
              onClose={() => {
                setMModalOpen(false);
                setEditRecord(null);
              }}
              record={editRecord}
              vehicles={[vehicle]}
              defaultVehicleId={vehicle.id}
            />
            <VehicleModal
              open={vModalOpen}
              onClose={() => setVModalOpen(false)}
              vehicle={vehicle}
            />
          </>
        )}
      </div>
    </>
  );
}
