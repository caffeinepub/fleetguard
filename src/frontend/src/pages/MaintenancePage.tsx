import { Badge } from "@/components/ui/badge";
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
import { Download, Filter, Pencil, Plus, Search } from "lucide-react";
import { useState } from "react";
import { MaintenanceType } from "../backend";
import type { MaintenanceRecordFull, Vehicle } from "../backend";
import { MaintenanceModal } from "../components/MaintenanceModal";
import { useAllMaintenanceRecords, useAllVehicles } from "../hooks/useQueries";
import { exportCSV, exportPDF } from "../lib/exportUtils";
import {
  formatCurrency,
  formatDate,
  maintenanceTypeLabel,
} from "../lib/helpers";

export function MaintenancePage() {
  const { data: records, isLoading: rLoading } = useAllMaintenanceRecords();
  const { data: vehicles } = useAllVehicles();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<MaintenanceRecordFull | null>(
    null,
  );

  const filtered =
    records
      ?.filter((r: MaintenanceRecordFull) => {
        const vehicle = vehicles?.find((v: Vehicle) => v.id === r.vehicleId);
        const matchSearch =
          r.description.toLowerCase().includes(search.toLowerCase()) ||
          r.technicianName.toLowerCase().includes(search.toLowerCase()) ||
          (vehicle?.name ?? "").toLowerCase().includes(search.toLowerCase());
        const matchType =
          typeFilter === "all" || r.maintenanceType === typeFilter;
        return matchSearch && matchType;
      })
      .sort((a, b) =>
        sortOrder === "desc"
          ? Number(b.date - a.date)
          : Number(a.date - b.date),
      ) ?? [];

  const openAdd = () => {
    setEditRecord(null);
    setModalOpen(true);
  };
  const openEdit = (r: MaintenanceRecordFull) => {
    setEditRecord(r);
    setModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = [
      "Vehicle",
      "Type",
      "Date",
      "Description",
      "Mileage",
      "Cost",
      "Technician",
      "Next Service",
    ];
    const rows = (records ?? []).map((r: MaintenanceRecordFull) => {
      const vehicle = vehicles?.find((v: Vehicle) => v.id === r.vehicleId);
      return [
        vehicle?.name ?? "Unknown",
        maintenanceTypeLabel[r.maintenanceType],
        formatDate(r.date),
        r.description,
        `${r.mileage.toString()} mi`,
        formatCurrency(r.cost),
        r.technicianName,
        r.nextServiceDate ? formatDate(r.nextServiceDate) : "",
      ];
    });
    exportCSV("maintenance-history", headers, rows);
  };

  const handleExportPDF = () => {
    const headers = [
      "Vehicle",
      "Type",
      "Date",
      "Description",
      "Cost",
      "Technician",
    ];
    const rows = (records ?? []).map((r: MaintenanceRecordFull) => {
      const vehicle = vehicles?.find((v: Vehicle) => v.id === r.vehicleId);
      return [
        vehicle?.name ?? "Unknown",
        maintenanceTypeLabel[r.maintenanceType],
        formatDate(r.date),
        r.description,
        formatCurrency(r.cost),
        r.technicianName,
      ];
    });
    exportPDF("Maintenance History Report", headers, rows);
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in" data-ocid="maintenance.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Maintenance Records</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {records?.length ?? 0} total records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            data-ocid="maintenance.secondary_button"
            onClick={handleExportCSV}
          >
            <Download size={15} /> CSV
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            data-ocid="maintenance.toggle"
            onClick={handleExportPDF}
          >
            <Download size={15} /> PDF
          </Button>
          <Button
            data-ocid="maintenance.primary_button"
            onClick={openAdd}
            className="gap-2"
          >
            <Plus size={16} /> Add Record
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="maintenance.search_input"
            className="pl-9"
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger data-ocid="maintenance.type.select" className="w-44">
            <Filter size={14} className="mr-1 text-muted-foreground" />
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.values(MaintenanceType).map((t) => (
              <SelectItem key={t} value={t}>
                {maintenanceTypeLabel[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger data-ocid="maintenance.sort.select" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest First</SelectItem>
            <SelectItem value="asc">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl shadow-card border-0 overflow-hidden">
        {rLoading ? (
          <div className="p-6 space-y-3" data-ocid="maintenance.loading_state">
            {["a", "b", "c", "d", "e"].map((k) => (
              <Skeleton key={k} className="h-14 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            data-ocid="maintenance.empty_state"
            className="text-center py-16"
          >
            <p className="text-muted-foreground font-medium">
              No maintenance records found
            </p>
            <Button className="mt-4 gap-2" onClick={openAdd}>
              <Plus size={16} /> Add Record
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-ocid="maintenance.table">
              <thead className="bg-muted/40">
                <tr>
                  {[
                    "Vehicle",
                    "Type",
                    "Date",
                    "Description",
                    "Mileage",
                    "Cost",
                    "Technician",
                    "Next Service",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-muted-foreground px-5 py-3.5"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((r: MaintenanceRecordFull, i: number) => {
                  const vehicle = vehicles?.find(
                    (v: Vehicle) => v.id === r.vehicleId,
                  );
                  return (
                    <tr
                      key={r.id.toString()}
                      data-ocid={`maintenance.item.${i + 1}`}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-5 py-4 font-medium whitespace-nowrap">
                        {vehicle?.name ?? "Unknown"}
                      </td>
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
                        <p className="truncate text-muted-foreground">
                          {r.description}
                        </p>
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
                        {r.nextServiceDate ? (
                          <span className="text-warning font-medium">
                            {formatDate(r.nextServiceDate)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          data-ocid={`maintenance.edit_button.${i + 1}`}
                          onClick={() => openEdit(r)}
                        >
                          <Pencil size={14} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MaintenanceModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditRecord(null);
        }}
        record={editRecord}
        vehicles={vehicles ?? []}
      />
    </div>
  );
}
