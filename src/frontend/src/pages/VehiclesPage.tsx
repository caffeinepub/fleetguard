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
import { Eye, Pencil, Plus, Search, Trash2, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Vehicle } from "../backend";
import { Status, VehicleType } from "../backend";
import { VehicleModal } from "../components/VehicleModal";
import {
  useAllVehicles,
  useDeleteVehicle,
  useIsAdmin,
} from "../hooks/useQueries";
import { vehicleTypeLabel } from "../lib/helpers";

type Page = "dashboard" | "vehicles" | "maintenance" | "vehicle-detail";
interface Props {
  onNavigate: (page: Page, params?: Record<string, unknown>) => void;
}

export function VehiclesPage({ onNavigate }: Props) {
  const { data: vehicles, isLoading } = useAllVehicles();
  const { data: isAdmin } = useIsAdmin();
  const deleteVehicle = useDeleteVehicle();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);

  const filtered =
    vehicles?.filter((v: Vehicle) => {
      const matchSearch =
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
        v.make.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || v.vehicleType === typeFilter;
      const matchStatus = statusFilter === "all" || v.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    }) ?? [];

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

  return (
    <div className="p-6 space-y-5 animate-fade-in" data-ocid="vehicles.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fleet Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {vehicles?.length ?? 0} vehicles in your fleet
          </p>
        </div>
        <Button
          data-ocid="vehicles.primary_button"
          onClick={openAdd}
          className="gap-2"
        >
          <Plus size={16} /> Add Vehicle
        </Button>
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
            <Button className="mt-4 gap-2" onClick={openAdd}>
              <Plus size={16} /> Add Vehicle
            </Button>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          data-ocid={`vehicles.edit_button.${i + 1}`}
                          onClick={() => openEdit(v)}
                        >
                          <Pencil size={14} />
                        </Button>
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
