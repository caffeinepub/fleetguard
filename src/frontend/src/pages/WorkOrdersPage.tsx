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
  Printer,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FleetRole, WorkOrderPriority, WorkOrderStatus } from "../backend";
import type { MaintenanceRecordFull, Vehicle, WorkOrder } from "../backend";
import { MaintenanceModal } from "../components/MaintenanceModal";
import { useActor } from "../hooks/useActor";
import {
  useAllVehicles,
  useAllWorkOrders,
  useCallerFleetRole,
  useCallerProfile,
  useGetCompanySettings,
  useIsAdmin,
} from "../hooks/useQueries";
import { nowNs } from "../lib/helpers";

function formatWONumber(id: bigint): string {
  return `WO-${String(Number(id)).padStart(4, "0")}`;
}

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
  const { data: companySettings } = useGetCompanySettings();
  const { data: callerProfile } = useCallerProfile();
  const { actor } = useActor();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("date-desc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<WorkOrder | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState<bigint | null>(null);
  const [editMaintenanceRecord, setEditMaintenanceRecord] =
    useState<MaintenanceRecordFull | null>(null);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [completedByName, setCompletedByName] = useState<string>("");
  const [completingWorkOrder, setCompletingWorkOrder] =
    useState<WorkOrder | null>(null);

  const canCreate =
    isAdmin ||
    fleetRole === FleetRole.Admin ||
    fleetRole === FleetRole.FleetManager;

  const vehicleMap = Object.fromEntries(
    (vehicles ?? []).map((v: Vehicle) => [v.id.toString(), v.name]),
  );

  const priorityOrder: Record<string, number> = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };
  const filtered = (workOrders ?? [])
    .filter((wo: WorkOrder) => {
      const vName = vehicleMap[wo.vehicleId.toString()] ?? "";
      const q = search.toLowerCase();
      const matchSearch =
        wo.title.toLowerCase().includes(q) ||
        wo.assignedMechanic.toLowerCase().includes(q) ||
        vName.toLowerCase().includes(q) ||
        formatWONumber(wo.id).toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || wo.status === statusFilter;
      const matchPriority =
        priorityFilter === "all" || wo.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    })
    .sort((a, b) => {
      if (sortOrder === "date-desc") return Number(b.createdAt - a.createdAt);
      if (sortOrder === "date-asc") return Number(a.createdAt - b.createdAt);
      if (sortOrder === "priority-desc")
        return (
          (priorityOrder[b.priority] ?? 0) - (priorityOrder[a.priority] ?? 0)
        );
      if (sortOrder === "priority-asc")
        return (
          (priorityOrder[a.priority] ?? 0) - (priorityOrder[b.priority] ?? 0)
        );
      return 0;
    });

  const setF = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => {
    setEditOrder(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (wo: WorkOrder) => {
    setEditOrder(wo);
    const scheduledDateVal = wo.scheduledDate;
    setForm({
      title: wo.title,
      vehicleId: wo.vehicleId.toString(),
      description: wo.description,
      assignedMechanic: wo.assignedMechanic,
      priority: wo.priority,
      status: wo.status,
      scheduledDate: scheduledDateVal
        ? new Date(Number(scheduledDateVal) / 1_000_000)
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
        // Pass undefined (not []) so the Candid converter uses candid_none()
        scheduledDate: form.scheduledDate
          ? BigInt(new Date(form.scheduledDate).getTime()) * 1_000_000n
          : undefined,
        completedDate: editOrder ? editOrder.completedDate : undefined,
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
    } catch (err) {
      console.error("Work order save error:", err);
      toast.error("Failed to save work order");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (wo: WorkOrder) => {
    if (!actor) return;
    setCompleting(wo.id);
    try {
      await actor.completeWorkOrder(wo.id);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["workOrders"] }),
        qc.invalidateQueries({ queryKey: ["maintenanceRecords"] }),
      ]);
      // Fetch fresh maintenance records to find the newly created one
      const freshRecords = await actor.getAllMaintenanceRecords();
      const sorted = [...freshRecords].sort(
        (a, b) => Number(b.createdAt) - Number(a.createdAt),
      );
      const newRecord =
        sorted.find((r) => r.vehicleId === wo.vehicleId) ?? sorted[0];
      if (newRecord) {
        setEditMaintenanceRecord(newRecord);
        setCompletingWorkOrder(wo);
        setCompletedByName(
          callerProfile?.name ??
            (callerProfile as any)?.email ??
            "Unknown User",
        );
        setMaintenanceModalOpen(true);
        toast.info(
          "Work order completed! Add cost and parts to the maintenance record.",
        );
      } else {
        toast.success("Work order completed and maintenance record created.");
      }
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

  const getScheduledDate = (wo: WorkOrder): bigint | undefined => {
    return wo.scheduledDate as bigint | undefined;
  };

  const handlePrintAll = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const logoHtml = companySettings?.logoUrl
      ? `<img src="${companySettings.logoUrl}" alt="Logo" style="height:50px;object-fit:contain;" />`
      : "";
    const companyName = companySettings?.companyName ?? "FleetGuard";
    const rows = filtered
      .map(
        (wo: WorkOrder) => `
      <tr>
        <td>${formatWONumber(wo.id)}</td>
        <td>${wo.title}</td>
        <td>${vehicleMap[wo.vehicleId.toString()] ?? "Unknown"}</td>
        <td>${wo.assignedMechanic || "\u2014"}</td>
        <td>${priorityConfig[wo.priority].label}</td>
        <td>${statusConfig[wo.status].label}</td>
        <td>${getScheduledDate(wo) ? new Date(Number(getScheduledDate(wo)) / 1_000_000).toLocaleDateString() : "\u2014"}</td>
        <td>${wo.description || "\u2014"}</td>
      </tr>
    `,
      )
      .join("");
    printWindow.document.write(`
      <!DOCTYPE html><html><head>
      <title>Work Orders - ${companyName}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
        .header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; border-bottom: 2px solid #1e3a5f; padding-bottom: 12px; }
        .header-text h1 { font-size: 18px; margin: 0 0 2px; }
        .header-text p { color: #666; font-size: 11px; margin: 0; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1e3a5f; color: white; padding: 8px; text-align: left; font-size: 11px; }
        td { padding: 7px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
        tr:nth-child(even) td { background: #f9fafb; }
        @media print { body { padding: 0; } }
      </style>
      </head><body>
      <div class="header">
        ${logoHtml}
        <div class="header-text">
          <h1>Work Orders Report</h1>
          <p>${companyName} &bull; Printed ${new Date().toLocaleDateString()} &bull; ${filtered.length} work order(s)</p>
        </div>
      </div>
      <table>
        <thead><tr>
          <th>WO #</th><th>Title</th><th>Vehicle</th><th>Mechanic</th>
          <th>Priority</th><th>Status</th><th>Scheduled</th><th>Description</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handlePrintSingle = (wo: WorkOrder) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const logoHtml = companySettings?.logoUrl
      ? `<img src="${companySettings.logoUrl}" alt="Logo" style="height:60px;object-fit:contain;" />`
      : "";
    const companyName = companySettings?.companyName ?? "FleetGuard";
    const vName = vehicleMap[wo.vehicleId.toString()] ?? "Unknown Vehicle";
    const scheduledDate = getScheduledDate(wo);
    printWindow.document.write(`
      <!DOCTYPE html><html><head>
      <title>${formatWONumber(wo.id)} - ${companyName}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 13px; padding: 30px; max-width: 800px; margin: 0 auto; }
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #1e3a5f; padding-bottom: 16px; }
        .header-left { display: flex; align-items: center; gap: 16px; }
        .company-name { font-size: 20px; font-weight: bold; color: #1e3a5f; }
        .wo-number { font-size: 22px; font-weight: bold; color: #1e3a5f; text-align: right; }
        .wo-number span { display: block; font-size: 11px; font-weight: normal; color: #666; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #666; letter-spacing: 0.05em; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .field label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 2px; }
        .field span { font-size: 13px; font-weight: 500; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .badge-open { background: #dbeafe; color: #1d4ed8; }
        .badge-inprogress { background: #fef3c7; color: #92400e; }
        .badge-completed { background: #d1fae5; color: #065f46; }
        .badge-cancelled { background: #f3f4f6; color: #6b7280; }
        .badge-low { background: #f3f4f6; color: #6b7280; }
        .badge-medium { background: #dbeafe; color: #1d4ed8; }
        .badge-high { background: #ffedd5; color: #9a3412; }
        .badge-critical { background: #fee2e2; color: #991b1b; }
        .notes-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; min-height: 60px; font-size: 13px; white-space: pre-wrap; }
        .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 10px; font-size: 10px; color: #999; text-align: center; }
        @media print { body { padding: 20px; } }
      </style>
      </head><body>
      <div class="header">
        <div class="header-left">
          ${logoHtml}
          <div class="company-name">${companyName}</div>
        </div>
        <div class="wo-number">${formatWONumber(wo.id)}<span>WORK ORDER</span></div>
      </div>

      <div class="section">
        <div class="section-title">Work Order Details</div>
        <div class="grid">
          <div class="field"><label>Title</label><span>${wo.title}</span></div>
          <div class="field"><label>Vehicle</label><span>${vName}</span></div>
          <div class="field"><label>Assigned Mechanic</label><span>${wo.assignedMechanic || "\u2014"}</span></div>
          <div class="field"><label>Scheduled Date</label><span>${scheduledDate ? new Date(Number(scheduledDate) / 1_000_000).toLocaleDateString() : "\u2014"}</span></div>
          <div class="field"><label>Priority</label><span class="badge badge-${wo.priority.toLowerCase()}">${priorityConfig[wo.priority].label}</span></div>
          <div class="field"><label>Status</label><span class="badge badge-${wo.status.toLowerCase()}">${statusConfig[wo.status].label}</span></div>
          <div class="field"><label>Created</label><span>${new Date(Number(wo.createdAt) / 1_000_000).toLocaleDateString()}</span></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Description</div>
        <div class="notes-box">${wo.description || "No description provided."}</div>
      </div>

      <div class="section">
        <div class="section-title">Notes</div>
        <div class="notes-box">${wo.notes || "No additional notes."}</div>
      </div>

      <div class="section">
        <div class="section-title">Sign-Off</div>
        <div class="grid">
          <div class="field"><label>Mechanic Signature</label><div style="height:40px;border-bottom:1px solid #999;"></div></div>
          <div class="field"><label>Supervisor Signature</label><div style="height:40px;border-bottom:1px solid #999;"></div></div>
          <div class="field"><label>Date Completed</label><div style="height:40px;border-bottom:1px solid #999;"></div></div>
          <div class="field"><label>Authorized By</label><div style="height:40px;border-bottom:1px solid #999;"></div></div>
        </div>
      </div>

      <div class="footer">Printed ${new Date().toLocaleString()} &bull; ${companyName} &bull; Powered by FleetGuard</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            data-ocid="workorders.secondary_button"
            onClick={handlePrintAll}
            className="gap-2"
          >
            <Printer size={16} /> Print All
          </Button>
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
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger
            className="w-40"
            data-ocid="workorders.priority.select"
          >
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {Object.values(WorkOrderPriority).map((p) => (
              <SelectItem key={p} value={p}>
                {priorityConfig[p].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-44" data-ocid="workorders.sort.select">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Date: Newest First</SelectItem>
            <SelectItem value="date-asc">Date: Oldest First</SelectItem>
            <SelectItem value="priority-desc">Priority: Highest</SelectItem>
            <SelectItem value="priority-asc">Priority: Lowest</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground self-center whitespace-nowrap">
          {filtered.length} order{filtered.length !== 1 ? "s" : ""}
        </span>
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
            const scheduledDate = getScheduledDate(wo);
            return (
              <div
                key={wo.id.toString()}
                data-ocid={`workorders.item.${idx + 1}`}
                className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded px-2 py-0.5">
                      {formatWONumber(wo.id)}
                    </span>
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
                    {scheduledDate && (
                      <span>
                        📅{" "}
                        {new Date(
                          Number(scheduledDate) / 1_000_000,
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
                      onClick={() => handleComplete(wo)}
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
                    data-ocid={`workorders.print_button.${idx + 1}`}
                    onClick={() => handlePrintSingle(wo)}
                    title="Print this work order"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </Button>
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

      {/* Maintenance Record Modal (opened after completing a work order) */}
      {maintenanceModalOpen && editMaintenanceRecord && (
        <MaintenanceModal
          open={maintenanceModalOpen}
          onClose={() => {
            setMaintenanceModalOpen(false);
            setEditMaintenanceRecord(null);
            setCompletingWorkOrder(null);
          }}
          onCancel={async () => {
            // Revert work order back to Open on cancel
            if (actor && completingWorkOrder) {
              try {
                await actor.updateWorkOrder(completingWorkOrder.id, {
                  ...completingWorkOrder,
                  status: WorkOrderStatus.Open,
                });
                await qc.invalidateQueries({ queryKey: ["workOrders"] });
                toast.info("Work order reverted to Open");
              } catch (err) {
                console.error("Failed to revert work order:", err);
              }
            }
            setMaintenanceModalOpen(false);
            setEditMaintenanceRecord(null);
            setCompletingWorkOrder(null);
          }}
          record={editMaintenanceRecord}
          vehicles={vehicles ?? []}
          completedBy={completedByName}
          requireCompletion={true}
          completionType="work-order"
        />
      )}

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="workorders.modal"
        >
          <DialogHeader>
            <DialogTitle>
              {editOrder
                ? `Edit Work Order ${formatWONumber(editOrder.id)}`
                : "New Work Order"}
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
