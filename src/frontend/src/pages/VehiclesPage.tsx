import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import {
  Download,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  Truck,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Page } from "../App";
import type { Vehicle } from "../backend";
import { Status, VehicleType } from "../backend";
import { FleetRole } from "../backend";
import { VehicleModal } from "../components/VehicleModal";
import {
  useAllVehicles,
  useBulkCreateVehicles,
  useCallerFleetRole,
  useDeleteVehicle,
  useIsAdmin,
} from "../hooks/useQueries";
import { exportCSV } from "../lib/exportUtils";
import { nowNs, vehicleTypeLabel } from "../lib/helpers";

interface Props {
  onNavigate: (page: Page, params?: Record<string, unknown>) => void;
}

function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function mapVehicleType(raw: string): VehicleType {
  const r = raw.toLowerCase();
  if (r === "truck") return VehicleType.Truck;
  if (r === "trailer") return VehicleType.Trailer;
  if (r === "bus") return VehicleType.Bus;
  if (r === "van") return VehicleType.Van;
  return VehicleType.Other;
}

export function VehiclesPage({ onNavigate }: Props) {
  const { data: vehicles, isLoading } = useAllVehicles();
  const { data: isAdmin } = useIsAdmin();
  const { data: fleetRole } = useCallerFleetRole();
  const canCreate = isAdmin || fleetRole === FleetRole.FleetManager;
  const canEdit = isAdmin || fleetRole === FleetRole.FleetManager;
  const deleteVehicle = useDeleteVehicle();
  const bulkCreate = useBulkCreateVehicles();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("name-asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const filtered = (
    vehicles?.filter((v: Vehicle) => {
      const matchSearch =
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
        v.make.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || v.vehicleType === typeFilter;
      const matchStatus = statusFilter === "all" || v.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    }) ?? []
  ).sort((a, b) => {
    if (sortOrder === "name-asc") return a.name.localeCompare(b.name);
    if (sortOrder === "name-desc") return b.name.localeCompare(a.name);
    if (sortOrder === "year-desc") return Number(b.year - a.year);
    if (sortOrder === "year-asc") return Number(a.year - b.year);
    return 0;
  });

  const handleDelete = async (id: bigint) => {
    try {
      await deleteVehicle.mutateAsync(id);
      toast.success("Vehicle deleted");
    } catch {
      toast.error("Failed to delete vehicle");
    }
  };

  const openAdd = () => {
    setEditVehicle(null);
    setModalOpen(true);
  };
  const openEdit = (v: Vehicle) => {
    setEditVehicle(v);
    setModalOpen(true);
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      toast.error("CSV file must have a header row and at least one data row");
      return;
    }

    const headers = parseCSVRow(lines[0]).map((h) => h.toLowerCase());
    const nameIdx = headers.indexOf("name");
    const typeIdx = headers.indexOf("vehicletype");
    const plateIdx = headers.indexOf("licenseplate");
    const yearIdx = headers.indexOf("year");
    const makeIdx = headers.indexOf("make");
    const modelIdx = headers.indexOf("model");
    const statusIdx = headers.indexOf("status");
    const notesIdx = headers.indexOf("notes");

    if (nameIdx === -1) {
      toast.error("CSV must have a 'name' column");
      return;
    }

    const vehiclesToImport: Vehicle[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVRow(lines[i]);
      const name = cols[nameIdx] ?? "";
      if (!name) continue;
      vehiclesToImport.push({
        id: 0n,
        name,
        vehicleType:
          typeIdx >= 0
            ? mapVehicleType(cols[typeIdx] ?? "")
            : VehicleType.Other,
        licensePlate: plateIdx >= 0 ? (cols[plateIdx] ?? "") : "",
        year:
          yearIdx >= 0
            ? BigInt(Number.parseInt(cols[yearIdx] ?? "2020") || 2020)
            : 2020n,
        make: makeIdx >= 0 ? (cols[makeIdx] ?? "") : "",
        model: modelIdx >= 0 ? (cols[modelIdx] ?? "") : "",
        status:
          statusIdx >= 0 && (cols[statusIdx] ?? "").toLowerCase() === "inactive"
            ? Status.Inactive
            : Status.Active,
        notes: notesIdx >= 0 ? (cols[notesIdx] ?? "") : "",
        createdAt: nowNs(),
      });
    }

    if (vehiclesToImport.length === 0) {
      toast.error("No valid vehicles found in CSV");
      return;
    }

    const importToast = toast.loading(
      `Importing ${vehiclesToImport.length} vehicle(s)...`,
    );
    try {
      await bulkCreate.mutateAsync(vehiclesToImport);
      toast.dismiss(importToast);
      toast.success(
        `Successfully imported ${vehiclesToImport.length} vehicle(s)`,
      );
    } catch {
      toast.dismiss(importToast);
      toast.error("Failed to import vehicles");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Name",
      "Make",
      "Model",
      "Year",
      "Type",
      "License Plate",
      "Status",
    ];
    const rows = (vehicles ?? []).map((v: Vehicle) => [
      v.name,
      v.make,
      v.model,
      v.year.toString(),
      vehicleTypeLabel[v.vehicleType],
      v.licensePlate,
      v.status,
    ]);
    exportCSV("fleet-equipment-list", headers, rows);
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in" data-ocid="vehicles.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fleet Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {vehicles?.length ?? 0} vehicles in your fleet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            data-ocid="vehicles.secondary_button"
            onClick={handleExportCSV}
          >
            <Download size={15} /> CSV
          </Button>
          {canCreate && (
            <>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCSVImport}
                data-ocid="vehicles.upload_button"
              />
              <Button
                variant="outline"
                className="gap-2"
                data-ocid="vehicles.dropzone"
                onClick={() => csvInputRef.current?.click()}
                disabled={bulkCreate.isPending}
              >
                <Upload size={15} /> Import CSV
              </Button>
            </>
          )}
          {canCreate && (
            <Button
              data-ocid="vehicles.primary_button"
              onClick={openAdd}
              className="gap-2"
            >
              <Plus size={16} /> Add Vehicle
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="vehicles.search_input"
            className="pl-9"
            placeholder="Search vehicles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger data-ocid="vehicles.type.select" className="w-36">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.values(VehicleType).map((t) => (
              <SelectItem key={t} value={t}>
                {vehicleTypeLabel[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger data-ocid="vehicles.status.select" className="w-36">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value={Status.Active}>Active</SelectItem>
            <SelectItem value={Status.Inactive}>Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger data-ocid="vehicles.sort.select" className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name A-Z</SelectItem>
            <SelectItem value="name-desc">Name Z-A</SelectItem>
            <SelectItem value="year-desc">Year (Newest)</SelectItem>
            <SelectItem value="year-asc">Year (Oldest)</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground self-center">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-card border-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3" data-ocid="vehicles.loading_state">
            {["a", "b", "c", "d"].map((k) => (
              <Skeleton key={k} className="h-14 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div data-ocid="vehicles.empty_state" className="text-center py-16">
            <Truck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              No vehicles found
            </p>
            <p className="text-muted-foreground/60 text-sm mt-1">
              Try adjusting your filters or add a new vehicle
            </p>
            {canCreate && (
              <Button className="mt-4 gap-2" onClick={openAdd}>
                <Plus size={16} /> Add Vehicle
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-ocid="vehicles.table">
              <thead className="bg-muted/40">
                <tr>
                  {[
                    "Vehicle",
                    "Type",
                    "Year",
                    "License Plate",
                    "Status",
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
                {filtered.map((v: Vehicle, i: number) => (
                  <tr
                    key={v.id.toString()}
                    data-ocid={`vehicles.item.${i + 1}`}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Truck className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{v.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {v.make} {v.model}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {vehicleTypeLabel[v.vehicleType]}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {v.year.toString()}
                    </td>
                    <td className="px-5 py-4">
                      <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">
                        {v.licensePlate}
                      </code>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          v.status === Status.Active
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            v.status === Status.Active
                              ? "bg-success"
                              : "bg-muted-foreground"
                          }`}
                        />
                        {v.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            data-ocid={`vehicles.edit_button.${i + 1}`}
                            onClick={() => openEdit(v)}
                          >
                            <Pencil size={14} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          data-ocid={`vehicles.secondary_button.${i + 1}`}
                          onClick={() =>
                            onNavigate("vehicle-detail", { vehicleId: v.id })
                          }
                        >
                          <Eye size={14} />
                        </Button>
                        {isAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                data-ocid={`vehicles.delete_button.${i + 1}`}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent data-ocid="vehicles.dialog">
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Vehicle?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{v.name}" and
                                  all its maintenance records. This action
                                  cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-ocid="vehicles.cancel_button">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  data-ocid="vehicles.confirm_button"
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDelete(v.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <VehicleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        vehicle={editVehicle}
      />
    </div>
  );
}
