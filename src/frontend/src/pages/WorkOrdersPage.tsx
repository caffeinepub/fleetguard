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
import { Card, CardContent } from "@/components/ui/card";
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
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
  TrendingUp,
  Truck,
  User,
  Wrench,
  XCircle,
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

// ─── Priority config ──────────────────────────────────────────────────────────

const priorityConfig: Record<
  WorkOrderPriority,
  { label: string; badgeClass: string; borderColor: string; dotColor: string }
> = {
  [WorkOrderPriority.Low]: {
    label: "Low",
    badgeClass:
      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 dark:text-emerald-300",
    borderColor: "border-l-emerald-500",
    dotColor: "bg-emerald-500",
  },
  [WorkOrderPriority.Medium]: {
    label: "Medium",
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    borderColor: "border-l-blue-500",
    dotColor: "bg-blue-500",
  },
  [WorkOrderPriority.High]: {
    label: "High",
    badgeClass: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    borderColor: "border-l-orange-500",
    dotColor: "bg-orange-500",
  },
  [WorkOrderPriority.Critical]: {
    label: "Critical",
    badgeClass: "bg-red-500/15 text-red-400 border-red-500/30",
    borderColor: "border-l-red-500",
    dotColor: "bg-red-500",
  },
};

// ─── Status config ────────────────────────────────────────────────────────────

const statusConfig: Record<
  WorkOrderStatus,
  {
    label: string;
    badgeClass: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  [WorkOrderStatus.Open]: {
    label: "Open",
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    icon: Clock,
  },
  [WorkOrderStatus.InProgress]: {
    label: "In Progress",
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    icon: Wrench,
  },
  [WorkOrderStatus.Completed]: {
    label: "Completed",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: CheckCircle2,
  },
  [WorkOrderStatus.Cancelled]: {
    label: "Cancelled",
    badgeClass: "bg-muted text-muted-foreground border-border",
    icon: XCircle,
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

// ─── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
}

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  bgClass,
}: StatCardProps) {
  return (
    <Card className="fleet-card border border-border/60 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-4 p-4">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${bgClass}`}
          >
            <Icon className={`w-5 h-5 ${colorClass}`} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {value}
            </p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              {label}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Work Order Card ──────────────────────────────────────────────────────────

interface WOCardProps {
  wo: WorkOrder;
  idx: number;
  vName: string;
  isActive: boolean;
  completing: bigint | null;
  isAdmin: boolean | undefined;
  onEdit: (wo: WorkOrder) => void;
  onComplete: (wo: WorkOrder) => void;
  onDelete: (id: bigint) => void;
  onPrint: (wo: WorkOrder) => void;
}

function WOCard({
  wo,
  idx,
  vName,
  isActive,
  completing,
  isAdmin,
  onEdit,
  onComplete,
  onDelete,
  onPrint,
}: WOCardProps) {
  const pCfg = priorityConfig[wo.priority];
  const sCfg = statusConfig[wo.status];
  const StatusIcon = sCfg.icon;
  const scheduledDate = wo.scheduledDate as bigint | undefined;

  return (
    <div
      key={wo.id.toString()}
      data-ocid={`workorders.item.${idx + 1}`}
      className={`relative bg-card border border-border/60 border-l-4 ${pCfg.borderColor} rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-black/10 hover:-translate-y-px hover:border-border cursor-pointer group`}
      onClick={() => onEdit(wo)}
      onKeyDown={(e) => e.key === "Enter" && onEdit(wo)}
    >
      <div className="p-4 sm:p-5">
        {/* Top row */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          {/* Left: WO info */}
          <div className="flex-1 min-w-0 space-y-2.5">
            {/* WO number + title + badges */}
            <div className="flex items-start gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold bg-muted/60 text-foreground/70 border border-border/60 rounded-md px-2 py-1 tracking-wider flex-shrink-0">
                {formatWONumber(wo.id)}
              </span>
              <h3 className="text-base font-semibold text-foreground leading-snug mt-0.5 flex-1 min-w-0">
                {wo.title}
              </h3>
            </div>

            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={`gap-1 text-xs font-medium ${sCfg.badgeClass}`}
              >
                <StatusIcon className="w-3 h-3" />
                {sCfg.label}
              </Badge>
              <Badge
                variant="outline"
                className={`gap-1 text-xs font-medium ${pCfg.badgeClass}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${pCfg.dotColor} inline-block`}
                />
                {pCfg.label}
              </Badge>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{vName}</span>
              </span>
              {wo.assignedMechanic && (
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{wo.assignedMechanic}</span>
                </span>
              )}
              {scheduledDate && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    {new Date(
                      Number(scheduledDate) / 1_000_000,
                    ).toLocaleDateString()}
                  </span>
                </span>
              )}
            </div>

            {/* Description */}
            {wo.description && (
              <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">
                {wo.description}
              </p>
            )}
          </div>

          {/* Right: actions */}
          <div
            className="flex items-center gap-1.5 flex-shrink-0 self-start"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {isActive && (
              <Button
                size="sm"
                data-ocid={`workorders.confirm_button.${idx + 1}`}
                disabled={completing === wo.id}
                onClick={() => onComplete(wo)}
                className="gap-1.5 h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm"
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
              onClick={() => onPrint(wo)}
              title="Print this work order"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <Printer className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              data-ocid={`workorders.edit_button.${idx + 1}`}
              onClick={() => onEdit(wo)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
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
                    className="h-8 w-8 p-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent data-ocid="workorders.dialog">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Work Order?</AlertDialogTitle>
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
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => onDelete(wo.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

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

  // ─── Stats ────────────────────────────────────────────────────────────────
  const allOrders = workOrders ?? [];
  const totalCount = allOrders.length;
  const openCount = allOrders.filter(
    (w: WorkOrder) => w.status === WorkOrderStatus.Open,
  ).length;
  const inProgressCount = allOrders.filter(
    (w: WorkOrder) => w.status === WorkOrderStatus.InProgress,
  ).length;
  const completedCount = allOrders.filter(
    (w: WorkOrder) => w.status === WorkOrderStatus.Completed,
  ).length;

  // ─── Filter + sort ────────────────────────────────────────────────────────
  const priorityOrder: Record<string, number> = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };
  const filtered = allOrders
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

  const activeOrders = filtered.filter(
    (wo: WorkOrder) =>
      wo.status === WorkOrderStatus.Open ||
      wo.status === WorkOrderStatus.InProgress,
  );
  const resolvedOrders = filtered.filter(
    (wo: WorkOrder) =>
      wo.status === WorkOrderStatus.Completed ||
      wo.status === WorkOrderStatus.Cancelled,
  );
  const showSections = statusFilter === "all" && filtered.length > 0;

  // ─── Handlers ─────────────────────────────────────────────────────────────

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
        .badge-high { background: #ffedd5; color: #c2410c; }
        .badge-critical { background: #fee2e2; color: #b91c1c; }
        .notes-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 10px; min-height: 40px; color: #374151; }
        .footer { margin-top: 40px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 10px; }
        @media print { body { padding: 0; } }
      </style>
      </head><body>
      <div class="header">
        <div class="header-left">
          ${logoHtml}
          <div class="company-name">${companyName}</div>
        </div>
        <div class="wo-number">
          ${formatWONumber(wo.id)}
          <span>Work Order</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Work Order Details</div>
        <div class="grid">
          <div class="field"><label>Title</label><span>${wo.title}</span></div>
          <div class="field"><label>Vehicle</label><span>${vName}</span></div>
          <div class="field"><label>Assigned Mechanic</label><span>${wo.assignedMechanic || "\u2014"}</span></div>
          <div class="field"><label>Scheduled Date</label><span>${scheduledDate ? new Date(Number(scheduledDate) / 1_000_000).toLocaleDateString() : "\u2014"}</span></div>
          <div class="field"><label>Priority</label><span class="badge badge-${wo.priority.toLowerCase()}">${priorityConfig[wo.priority].label}</span></div>
          <div class="field"><label>Status</label><span class="badge badge-${wo.status === WorkOrderStatus.InProgress ? "inprogress" : wo.status.toLowerCase()}">${statusConfig[wo.status].label}</span></div>
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

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 animate-fade-in" data-ocid="workorders.page">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Work Orders</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalCount} total &bull; {openCount + inProgressCount} active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            data-ocid="workorders.secondary_button"
            onClick={handlePrintAll}
            className="gap-2 hidden sm:flex"
          >
            <Printer size={16} /> Print All
          </Button>
          {canCreate && (
            <Button
              data-ocid="workorders.primary_button"
              onClick={openAdd}
              className="gap-2"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New Work Order</span>
              <span className="sm:hidden">New</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Work Orders"
          value={totalCount}
          icon={TrendingUp}
          colorClass="text-foreground/60"
          bgClass="bg-muted/60"
        />
        <StatCard
          label="Open"
          value={openCount}
          icon={Clock}
          colorClass="text-blue-400"
          bgClass="bg-blue-500/10"
        />
        <StatCard
          label="In Progress"
          value={inProgressCount}
          icon={Wrench}
          colorClass="text-amber-400"
          bgClass="bg-amber-500/10"
        />
        <StatCard
          label="Completed"
          value={completedCount}
          icon={CheckCircle2}
          colorClass="text-emerald-400"
          bgClass="bg-emerald-500/10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5">
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
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          data-ocid="workorders.empty_state"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-foreground/80 text-lg">
            {search || statusFilter !== "all" || priorityFilter !== "all"
              ? "No work orders match your filters"
              : "No work orders yet"}
          </p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            {search || statusFilter !== "all" || priorityFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Create your first work order to get started."}
          </p>
          {canCreate &&
            !search &&
            statusFilter === "all" &&
            priorityFilter === "all" && (
              <Button className="mt-5 gap-2" onClick={openAdd}>
                <Plus size={16} /> New Work Order
              </Button>
            )}
        </div>
      ) : showSections ? (
        <div className="space-y-6">
          {/* Active section */}
          {activeOrders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Active ({activeOrders.length})
                </h2>
              </div>
              {activeOrders.map((wo: WorkOrder, idx: number) => (
                <WOCard
                  key={wo.id.toString()}
                  wo={wo}
                  idx={idx}
                  vName={
                    vehicleMap[wo.vehicleId.toString()] ?? "Unknown Vehicle"
                  }
                  isActive={true}
                  completing={completing}
                  isAdmin={isAdmin}
                  onEdit={openEdit}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                  onPrint={handlePrintSingle}
                />
              ))}
            </div>
          )}

          {/* Separator */}
          {activeOrders.length > 0 && resolvedOrders.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                Resolved
              </span>
              <div className="flex-1 h-px bg-border/60" />
            </div>
          )}

          {/* Resolved section */}
          {resolvedOrders.length > 0 && (
            <div className="space-y-3">
              {activeOrders.length === 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Resolved ({resolvedOrders.length})
                  </h2>
                </div>
              )}
              {resolvedOrders.map((wo: WorkOrder, idx: number) => (
                <WOCard
                  key={wo.id.toString()}
                  wo={wo}
                  idx={activeOrders.length + idx}
                  vName={
                    vehicleMap[wo.vehicleId.toString()] ?? "Unknown Vehicle"
                  }
                  isActive={false}
                  completing={completing}
                  isAdmin={isAdmin}
                  onEdit={openEdit}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                  onPrint={handlePrintSingle}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((wo: WorkOrder, idx: number) => (
            <WOCard
              key={wo.id.toString()}
              wo={wo}
              idx={idx}
              vName={vehicleMap[wo.vehicleId.toString()] ?? "Unknown Vehicle"}
              isActive={
                wo.status === WorkOrderStatus.Open ||
                wo.status === WorkOrderStatus.InProgress
              }
              completing={completing}
              isAdmin={isAdmin}
              onEdit={openEdit}
              onComplete={handleComplete}
              onDelete={handleDelete}
              onPrint={handlePrintSingle}
            />
          ))}
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
