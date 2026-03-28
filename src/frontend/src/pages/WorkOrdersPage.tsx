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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ClipboardList,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FleetRole, WorkOrderPriority, WorkOrderStatus } from "../backend";
import type { Vehicle, WorkOrder } from "../backend";
import { useActor } from "../hooks/useActor";
import {
  useAllVehicles,
  useAllWorkOrders,
  useCallerFleetRole,
  useIsAdmin,
} from "../hooks/useQueries";
import { nowNs } from "../lib/helpers";

const priorityConfig: Record<
  WorkOrderPriority,
  { label: string; className: string }
> = {
  [WorkOrderPriority.Low]: {
    label: "Low",
    className: "bg-muted text-muted-foreground border-border",
  },
  [WorkOrderPriority.Medium]: {
    label: "Medium",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  [WorkOrderPriority.High]: {
    label: "High",
    className: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  },
  [WorkOrderPriority.Critical]: {
    label: "Critical",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

const statusConfig: Record<
  WorkOrderStatus,
  { label: string; className: string }
> = {
  [WorkOrderStatus.Open]: {
    label: "Open",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  [WorkOrderStatus.InProgress]: {
    label: "In Progress",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  [WorkOrderStatus.Completed]: {
    label: "Completed",
    className: "bg-success/15 text-success border-success/30",
  },
  [WorkOrderStatus.Cancelled]: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground border-border",
  },
};

const defaultForm = {
  title: "",
  vehicleId: "",
  description: "",
  assignedMechanic: "",
  priority: WorkOrderPriority.Medium,
  status: WorkOrderStatus.Open,
  scheduledDate: "",
  notes: "",
};

export function WorkOrdersPage() {
  const { data: workOrders, isLoading } = useAllWorkOrders();
  const { data: vehicles } = useAllVehicles();
  const { data: fleetRole } = useCallerFleetRole();
  const { data: isAdmin } = useIsAdmin();
  const { actor } = useActor();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<WorkOrder | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState<bigint | null>(null);

  const canCreate =
    isAdmin ||
    fleetRole === FleetRole.Admin ||
    fleetRole === FleetRole.FleetManager;

  const vehicleMap = Object.fromEntries(
    (vehicles ?? []).map((v: Vehicle) => [v.id.toString(), v.name]),
  );

  const filtered = (workOrders ?? []).filter((wo: WorkOrder) => {
    const vName = vehicleMap[wo.vehicleId.toString()] ?? "";
    const q = search.toLowerCase();
    const matchSearch =
      wo.title.toLowerCase().includes(q) ||
      wo.assignedMechanic.toLowerCase().includes(q) ||
      vName.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || wo.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const setF = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => {
    setEditOrder(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (wo: WorkOrder) => {
    setEditOrder(wo);
    setForm({
      title: wo.title,
      vehicleId: wo.vehicleId.toString(),
      description: wo.description,
      assignedMechanic: wo.assignedMechanic,
      priority: wo.priority,
      status: wo.status,
      scheduledDate: wo.scheduledDate
        ? new Date(Number(wo.scheduledDate) / 1_000_000)
            .toISOString()
            .split("T")[0]
        : "",
      notes: wo.notes,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.vehicleId) {
      toast.error("Title and vehicle are required");
      return;
    }
    if (!actor) return;
    setSaving(true);
    try {
      const data: WorkOrder = {
        id: editOrder?.id ?? 0n,
        title: form.title,
        vehicleId: BigInt(form.vehicleId),
        description: form.description,
        assignedMechanic: form.assignedMechanic,
        priority: form.priority as WorkOrderPriority,
        status: form.status as WorkOrderStatus,
        scheduledDate: form.scheduledDate
          ? BigInt(new Date(form.scheduledDate).getTime()) * 1_000_000n
          : undefined,
        completedDate: editOrder?.completedDate,
        notes: form.notes,
        createdAt: editOrder?.createdAt ?? nowNs(),
      };
      if (editOrder) {
        await actor.updateWorkOrder(editOrder.id, data);
        toast.success("Work order updated");
      } else {
        await actor.createWorkOrder(data);
        toast.success("Work order created");
      }
      await qc.invalidateQueries({ queryKey: ["workOrders"] });
      setModalOpen(false);
    } catch {
      toast.error("Failed to save work order");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (id: bigint) => {
    if (!actor) return;
    setCompleting(id);
    try {
      await actor.completeWorkOrder(id);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["workOrders"] }),
        qc.invalidateQueries({ queryKey: ["maintenanceRecords"] }),
      ]);
      toast.success(
        "Work order completed and maintenance record created automatically",
      );
    } catch {
      toast.error("Failed to complete work order");
    } finally {
      setCompleting(null);
    }
  };

  const handleDelete = async (id: bigint) => {
    if (!actor) return;
    try {
      await actor.deleteWorkOrder(id);
      await qc.invalidateQueries({ queryKey: ["workOrders"] });
      toast.success("Work order deleted");
    } catch {
      toast.error("Failed to delete work order");
    }
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in" data-ocid="workorders.page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            Work Orders
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {workOrders?.length ?? 0} total &bull;{" "}
            {
              (workOrders ?? []).filter(
                (w: WorkOrder) =>
                  w.status === WorkOrderStatus.Open ||
                  w.status === WorkOrderStatus.InProgress,
              ).length
            }{" "}
            open
          </p>
        </div>
        {canCreate && (
          <Button
            data-ocid="workorders.primary_button"
            onClick={openAdd}
            className="gap-2"
          >
            <Plus size={16} /> New Work Order
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            data-ocid="workorders.search_input"
            className="pl-9"
            placeholder="Search work orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-ocid="workorders.select">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.values(WorkOrderStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {statusConfig[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3" data-ocid="workorders.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="workorders.empty_state"
        >
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No work orders found</p>
          <p className="text-sm mt-1">Create a work order to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((wo: WorkOrder, idx: number) => {
            const vName =
              vehicleMap[wo.vehicleId.toString()] ?? "Unknown Vehicle";
            const pCfg = priorityConfig[wo.priority];
            const sCfg = statusConfig[wo.status];
            const isActive =
              wo.status === WorkOrderStatus.Open ||
              wo.status === WorkOrderStatus.InProgress;
            return (
              <div
                key={wo.id.toString()}
                data-ocid={`workorders.item.${idx + 1}`}
                className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">
                      {wo.title}
                    </span>
                    <Badge variant="outline" className={pCfg.className}>
                      {pCfg.label}
                    </Badge>
                    <Badge variant="outline" className={sCfg.className}>
                      {sCfg.label}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-0.5">
                    <span>🚛 {vName}</span>
                    {wo.assignedMechanic && (
                      <span>🔧 {wo.assignedMechanic}</span>
                    )}
                    {wo.scheduledDate && (
                      <span>
                        📅{" "}
                        {new Date(
                          Number(wo.scheduledDate) / 1_000_000,
                        ).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {wo.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {wo.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      data-ocid={`workorders.confirm_button.${idx + 1}`}
                      disabled={completing === wo.id}
                      onClick={() => handleComplete(wo.id)}
                      className="gap-1.5 text-success border-success/40 hover:bg-success/10"
                    >
                      {completing === wo.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      Complete
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    data-ocid={`workorders.edit_button.${idx + 1}`}
                    onClick={() => openEdit(wo)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  {isAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          data-ocid={`workorders.delete_button.${idx + 1}`}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent data-ocid="workorders.dialog">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete Work Order?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-ocid="workorders.cancel_button">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            data-ocid="workorders.confirm_button"
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => handleDelete(wo.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="workorders.modal"
        >
          <DialogHeader>
            <DialogTitle>
              {editOrder ? "Edit Work Order" : "New Work Order"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="wo-title">Title *</Label>
              <Input
                id="wo-title"
                data-ocid="workorders.input"
                placeholder="e.g. Oil change & brake inspection"
                value={form.title}
                onChange={(e) => setF("title", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-vehicle">Vehicle *</Label>
              <Select
                value={form.vehicleId}
                onValueChange={(v) => setF("vehicleId", v)}
              >
                <SelectTrigger id="wo-vehicle" data-ocid="workorders.select">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {(vehicles ?? []).map((v: Vehicle) => (
                    <SelectItem key={v.id.toString()} value={v.id.toString()}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-mechanic">Assigned Mechanic</Label>
              <Input
                id="wo-mechanic"
                data-ocid="workorders.input"
                placeholder="Mechanic name"
                value={form.assignedMechanic}
                onChange={(e) => setF("assignedMechanic", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setF("priority", v)}
                >
                  <SelectTrigger data-ocid="workorders.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(WorkOrderPriority).map((p) => (
                      <SelectItem key={p} value={p}>
                        {priorityConfig[p].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setF("status", v)}
                >
                  <SelectTrigger data-ocid="workorders.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(WorkOrderStatus).map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusConfig[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-date">Scheduled Date</Label>
              <Input
                id="wo-date"
                type="date"
                data-ocid="workorders.input"
                value={form.scheduledDate}
                onChange={(e) => setF("scheduledDate", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-desc">Description</Label>
              <Textarea
                id="wo-desc"
                data-ocid="workorders.textarea"
                placeholder="Describe the work to be done..."
                rows={3}
                value={form.description}
                onChange={(e) => setF("description", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-notes">Notes</Label>
              <Textarea
                id="wo-notes"
                data-ocid="workorders.textarea"
                placeholder="Additional notes..."
                rows={2}
                value={form.notes}
                onChange={(e) => setF("notes", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="workorders.cancel_button"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="workorders.submit_button"
              disabled={saving}
              onClick={handleSubmit}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : editOrder ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
