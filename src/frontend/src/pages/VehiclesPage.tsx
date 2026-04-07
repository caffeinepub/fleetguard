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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  AlertTriangle,
  Check,
  Download,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Truck,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Page } from "../App";
import type {
  Vehicle,
  VehicleImportRow,
  VehicleImportValidationResult,
} from "../backend";
import { VehicleStatus, VehicleType } from "../backend";
import { FleetRole } from "../backend";
import { VehicleModal } from "../components/VehicleModal";
import {
  useAllVehicles,
  useBulkCreateVehicles,
  useCallerFleetRole,
  useDeleteVehicle,
  useIsAdmin,
  useValidateBulkVehicleImport,
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

interface PreviewRow {
  vehicle: Vehicle;
  importRow: VehicleImportRow;
  validation?: VehicleImportValidationResult;
}

interface ImportPreviewModalProps {
  open: boolean;
  rows: PreviewRow[];
  isValidating: boolean;
  onConfirm: (validRows: Vehicle[]) => void;
  onCancel: () => void;
}

function ImportPreviewModal({
  open,
  rows,
  isValidating,
  onConfirm,
  onCancel,
}: ImportPreviewModalProps) {
  const validRows = rows.filter((r) => r.validation?.isValid !== false);
  const invalidCount = rows.filter(
    (r) => r.validation?.isValid === false,
  ).length;
  const warnCount = rows.filter(
    (r) =>
      r.validation?.isValid !== false &&
      (r.validation?.warnings?.length ?? 0) > 0,
  ).length;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload size={18} className="text-primary" />
            CSV Import Preview
          </DialogTitle>
        </DialogHeader>

        {/* Summary */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border text-sm">
          <span className="flex items-center gap-1.5 text-success font-medium">
            <Check size={14} />
            {validRows.length} ready to import
          </span>
          {invalidCount > 0 && (
            <span className="flex items-center gap-1.5 text-destructive font-medium">
              <X size={14} />
              {invalidCount} with errors (will be skipped)
            </span>
          )}
          {warnCount > 0 && (
            <span className="flex items-center gap-1.5 text-amber-500 font-medium">
              <AlertTriangle size={14} />
              {warnCount} with warnings
            </span>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-border">
          {isValidating ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 size={18} className="animate-spin" />
              Validating rows...
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-muted/40 sticky top-0 z-10">
                <tr>
                  {[
                    "Row",
                    "Name",
                    "Type",
                    "License Plate",
                    "Year",
                    "Make / Model",
                    "Status",
                    "Validation",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {rows.map((row) => {
                  const valid = row.validation?.isValid !== false;
                  const errors = row.validation?.errors ?? [];
                  const warnings = row.validation?.warnings ?? [];
                  return (
                    <tr
                      key={`${row.vehicle.name}-${row.importRow.rowIndex}`}
                      className={`transition-colors ${
                        !valid
                          ? "bg-destructive/5 hover:bg-destructive/8"
                          : warnings.length > 0
                            ? "bg-amber-500/5 hover:bg-amber-500/8"
                            : "hover:bg-muted/20"
                      }`}
                      data-ocid={`vehicles.import.row.${row.importRow.rowIndex}`}
                    >
                      <td className="px-3 py-2.5 text-muted-foreground font-mono">
                        {Number(row.importRow.rowIndex)}
                      </td>
                      <td className="px-3 py-2.5 font-medium">
                        {row.vehicle.name}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {vehicleTypeLabel[row.vehicle.vehicleType]}
                      </td>
                      <td className="px-3 py-2.5">
                        <code className="bg-muted px-1.5 py-0.5 rounded font-mono">
                          {row.vehicle.licensePlate || "—"}
                        </code>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {row.vehicle.year.toString()}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {row.vehicle.make} {row.vehicle.model}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            row.vehicle.status === VehicleStatus.Active
                              ? "bg-success/10 text-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {row.vehicle.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {!row.validation ? (
                          <span className="text-muted-foreground">Pending</span>
                        ) : !valid ? (
                          <div className="flex items-start gap-1 text-destructive">
                            <X size={13} className="mt-0.5 shrink-0" />
                            <span>{errors[0] ?? "Invalid"}</span>
                          </div>
                        ) : warnings.length > 0 ? (
                          <div className="flex items-start gap-1 text-amber-600">
                            <AlertTriangle
                              size={13}
                              className="mt-0.5 shrink-0"
                            />
                            <span>{warnings[0]}</span>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-success">
                            <Check size={13} />
                            Valid
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            data-ocid="vehicles.import.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(validRows.map((r) => r.vehicle))}
            disabled={validRows.length === 0 || isValidating}
            className="gap-2"
            data-ocid="vehicles.import.confirm_button"
          >
            <Upload size={15} />
            Import {validRows.length} Valid Row
            {validRows.length !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function VehiclesPage({ onNavigate }: Props) {
  const { data: vehicles, isLoading } = useAllVehicles();
  const { data: isAdmin } = useIsAdmin();
  const { data: fleetRole } = useCallerFleetRole();
  const canCreate = isAdmin || fleetRole === FleetRole.FleetManager;
  const canEdit = isAdmin || fleetRole === FleetRole.FleetManager;
  const deleteVehicle = useDeleteVehicle();
  const bulkCreate = useBulkCreateVehicles();
  const validateImport = useValidateBulkVehicleImport();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("name-asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);

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

    const parsedRows: PreviewRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVRow(lines[i]);
      const name = cols[nameIdx] ?? "";
      if (!name) continue;
      const vType =
        typeIdx >= 0 ? mapVehicleType(cols[typeIdx] ?? "") : VehicleType.Other;
      const year =
        yearIdx >= 0
          ? BigInt(Number.parseInt(cols[yearIdx] ?? "2020") || 2020)
          : 2020n;
      const vehicle: Vehicle = {
        id: 0n,
        name,
        vehicleType: vType,
        licensePlate: plateIdx >= 0 ? (cols[plateIdx] ?? "") : "",
        year,
        make: makeIdx >= 0 ? (cols[makeIdx] ?? "") : "",
        model: modelIdx >= 0 ? (cols[modelIdx] ?? "") : "",
        status:
          statusIdx >= 0 && (cols[statusIdx] ?? "").toLowerCase() === "inactive"
            ? VehicleStatus.Inactive
            : VehicleStatus.Active,
        notes: notesIdx >= 0 ? (cols[notesIdx] ?? "") : "",
        createdAt: nowNs(),
      };
      const importRow: VehicleImportRow = {
        name,
        vehicleType: vType,
        licensePlate: vehicle.licensePlate,
        year,
        make: vehicle.make,
        model: vehicle.model,
        rowIndex: BigInt(i),
        notes: vehicle.notes,
      };
      parsedRows.push({ vehicle, importRow });
    }

    if (parsedRows.length === 0) {
      toast.error("No valid vehicles found in CSV");
      return;
    }

    // Show preview modal while validating
    setPreviewRows(parsedRows);
    setPreviewOpen(true);

    // Run validation
    try {
      const validationResults = await validateImport.mutateAsync(
        parsedRows.map((r) => r.importRow),
      );
      setPreviewRows((prev) =>
        prev.map((row, idx) => ({
          ...row,
          validation: validationResults[idx],
        })),
      );
    } catch {
      // Validation failed — allow import without per-row validation
      setPreviewRows((prev) =>
        prev.map((row) => ({
          ...row,
          validation: {
            isValid: true,
            errors: [],
            warnings: [],
            rowIndex: row.importRow.rowIndex,
          },
        })),
      );
    }
  };

  const handleConfirmImport = async (validRows: Vehicle[]) => {
    setPreviewOpen(false);
    const importToast = toast.loading(
      `Importing ${validRows.length} vehicle(s)...`,
    );
    try {
      await bulkCreate.mutateAsync(validRows);
      toast.dismiss(importToast);
      toast.success(`Successfully imported ${validRows.length} vehicle(s)`);
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
                disabled={bulkCreate.isPending || validateImport.isPending}
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
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>

            <SelectItem value={VehicleStatus.Active}>Active</SelectItem>
            <SelectItem value={VehicleStatus.Inactive}>Inactive</SelectItem>
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
                          v.status === VehicleStatus.Active
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            v.status === VehicleStatus.Active
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

      <ImportPreviewModal
        open={previewOpen}
        rows={previewRows}
        isValidating={validateImport.isPending}
        onConfirm={handleConfirmImport}
        onCancel={() => setPreviewOpen(false)}
      />
    </div>
  );
}
