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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  List,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { FleetRole, WorkOrderPriority, WorkOrderStatus } from "../backend";
import type { Vehicle, WorkOrder } from "../backend";
import { VehicleType } from "../backend";
import { MaintenanceModal } from "../components/MaintenanceModal";
import { useActor } from "../hooks/useActor";
import {
  useAllVehicles,
  useCallerFleetRole,
  useCallerProfile,
  useIsAdmin,
} from "../hooks/useQueries";

// ─── Local type ───────────────────────────────────────────────────────────────

interface ServiceSchedule {
  id: bigint;
  vehicleId: bigint;
  serviceType: string;
  intervalDays: bigint;
  nextDueDate: bigint;
  lastCompletedDate: [] | [bigint];
  notes: string;
  status: string;
  createdAt: bigint;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nsToDate(ns: bigint): Date {
  return new Date(Number(ns) / 1_000_000);
}

function dateToNs(dateStr: string): bigint {
  return BigInt(new Date(`${dateStr}T12:00:00`).getTime()) * 1_000_000n;
}

function formatDate(ns: bigint): string {
  return nsToDate(ns).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function intervalLabel(days: bigint): string {
  const n = Number(days);
  if (n === 30) return "Every month";
  if (n === 90) return "Every 3 months";
  if (n === 180) return "Every 6 months";
  if (n === 365) return "Every year";
  return `Every ${n} days`;
}

function deriveStatus(s: ServiceSchedule): "Upcoming" | "Overdue" {
  const now = Date.now();
  const due = Number(s.nextDueDate) / 1_000_000;
  return due < now ? "Overdue" : "Upcoming";
}

function isJustCompleted(s: ServiceSchedule): boolean {
  const lcd = s.lastCompletedDate;
  if (!Array.isArray(lcd) || lcd.length === 0) return false;
  const last = Number(lcd[0]) / 1_000_000;
  return Date.now() - last < 24 * 60 * 60 * 1000;
}

function getLastCompletedDate(s: ServiceSchedule): bigint | null {
  if (Array.isArray(s.lastCompletedDate) && s.lastCompletedDate.length > 0) {
    return s.lastCompletedDate[0] ?? null;
  }
  return null;
}

// Helper to convert Candid optional array [] | [bigint] → bigint | undefined
function lcdToOptional(lcd: [] | [bigint]): bigint | undefined {
  return Array.isArray(lcd) && lcd.length > 0 ? lcd[0] : undefined;
}

function formatWONumber(id: bigint): string {
  return `WO-${String(Number(id)).padStart(4, "0")}`;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ schedule }: { schedule: ServiceSchedule }) {
  if (isJustCompleted(schedule)) {
    return (
      <Badge className="bg-success/20 text-emerald-400 border-success/30 gap-1">
        <CheckCircle2 size={11} />
        Just Completed
      </Badge>
    );
  }
  if (schedule.status === "Inactive") {
    return (
      <Badge className="bg-muted text-muted-foreground border-border gap-1">
        Inactive
      </Badge>
    );
  }
  const derived = deriveStatus(schedule);
  if (derived === "Overdue") {
    return (
      <Badge className="bg-destructive/20 text-red-400 border-destructive/30 gap-1">
        <AlertTriangle size={11} />
        Overdue
      </Badge>
    );
  }
  return (
    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 gap-1">
      <Clock size={11} />
      Upcoming
    </Badge>
  );
}

// ─── Calendar view ────────────────────────────────────────────────────────────

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function CalendarView({ schedules }: { schedules: ServiceSchedule[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dueDays = new Set<number>();
  const overdueDays = new Set<number>();

  for (const s of schedules) {
    const d = nsToDate(s.nextDueDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      dueDays.add(day);
      if (s.status === "Active" && deriveStatus(s) === "Overdue") {
        overdueDays.add(day);
      }
    }
  }

  const cells = [
    ...Array.from({ length: firstDay }, (_, i) => ({
      key: `e-${i}`,
      day: null as number | null,
    })),
    ...Array.from({ length: daysInMonth }, (_, i) => ({
      key: `d-${i + 1}`,
      day: i + 1,
    })),
  ];

  const today = now.getDate();

  return (
    <Card className="fleet-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <CalendarDays size={18} className="text-primary" />
          {MONTHS[month]} {year}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="text-xs text-muted-foreground font-medium py-1"
            >
              {d}
            </div>
          ))}
          {cells.map((cell) => (
            <div
              key={cell.key}
              className={`h-9 flex items-center justify-center rounded-lg text-sm font-medium relative
                ${
                  cell.day === null
                    ? ""
                    : cell.day === today
                      ? "bg-primary text-primary-foreground"
                      : overdueDays.has(cell.day)
                        ? "bg-destructive/20 text-red-400 ring-1 ring-destructive/40"
                        : dueDays.has(cell.day)
                          ? "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30"
                          : "text-foreground/60 hover:bg-muted"
                }`}
            >
              {cell.day}
              {cell.day !== null &&
                (overdueDays.has(cell.day) || dueDays.has(cell.day)) && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current opacity-70" />
                )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-primary inline-block" /> Today
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-500/30 inline-block" />{" "}
            Scheduled
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-destructive/30 inline-block" />{" "}
            Overdue
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICE_TYPES = [
  "Oil & Filter Change",
  "Brake Inspection",
  "Tire Rotation & Alignment",
  "Transmission Fluid",
  "Air Filter Replacement",
  "Coolant Flush",
  "DEF System Inspection",
  "Differential Service",
  "Custom",
];

const INTERVAL_OPTIONS = [
  { label: "Every month (30 days)", value: "30" },
  { label: "Every 3 months (90 days)", value: "90" },
  { label: "Every 6 months (180 days)", value: "180" },
  { label: "Every year (365 days)", value: "365" },
  { label: "Custom", value: "custom" },
];

const defaultForm = {
  vehicleId: "",
  vehicleIds: [] as string[],
  scope: "individual" as "individual" | "category" | "all",
  categoryScope: "" as string,
  serviceType: "",
  customServiceType: "",
  intervalPreset: "90",
  customIntervalDays: "",
  nextDueDate: "",
  notes: "",
  status: "Active",
};

// ─── Main page ────────────────────────────────────────────────────────────────

export function ServiceSchedulesPage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  const { data: vehicles } = useAllVehicles();
  const { data: isAdmin } = useIsAdmin();
  const { data: fleetRole } = useCallerFleetRole();
  const { data: callerProfile } = useCallerProfile();

  const { data: schedules, isLoading } = useQuery<ServiceSchedule[]>({
    queryKey: ["serviceSchedules"],
    queryFn: async () => {
      if (!actor) return [];
      const raw = await (actor as any).getAllServiceSchedules();
      // Normalize lastCompletedDate to always be [] | [bigint]
      return (raw as any[]).map((s) => ({
        ...s,
        lastCompletedDate: Array.isArray(s.lastCompletedDate)
          ? s.lastCompletedDate
          : s.lastCompletedDate != null
            ? [s.lastCompletedDate]
            : [],
      })) as ServiceSchedule[];
    },
    enabled: !!actor,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState<ServiceSchedule | null>(
    null,
  );
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState<bigint | null>(null);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [completionRecord, setCompletionRecord] = useState<any>(null);
  const [completedByName, setCompletedByName] = useState("");
  const completionSavedRef = useRef(false);
  const [newWorkOrderNumber, setNewWorkOrderNumber] = useState("");
  const [completionSnapshot, setCompletionSnapshot] = useState<null | {
    id: bigint;
    nextDueDate: bigint;
    lastCompletedDate: [] | [bigint];
    status: string;
    intervalDays: bigint;
    serviceType: string;
    notes: string;
    vehicleId: bigint;
    createdAt: bigint;
  }>(null);

  const canCreate =
    isAdmin ||
    fleetRole === FleetRole.Admin ||
    fleetRole === FleetRole.FleetManager;

  const vehicleMap = Object.fromEntries(
    (vehicles ?? []).map((v: Vehicle) => [v.id.toString(), v]),
  );

  const list = schedules ?? [];
  const upcoming = list.filter(
    (s) => s.status === "Active" && deriveStatus(s) === "Upcoming",
  ).length;
  const overdue = list.filter(
    (s) => s.status === "Active" && deriveStatus(s) === "Overdue",
  ).length;
  const completed = list.filter((s) => isJustCompleted(s)).length;

  const setF = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => {
    setEditSchedule(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const toggleVehicle = (id: string) => {
    setForm((f) => ({
      ...f,
      vehicleIds: f.vehicleIds.includes(id)
        ? f.vehicleIds.filter((v) => v !== id)
        : [...f.vehicleIds, id],
    }));
  };

  const openEdit = (s: ServiceSchedule) => {
    setEditSchedule(s);
    const days = Number(s.intervalDays);
    const preset = [30, 90, 180, 365].includes(days) ? String(days) : "custom";
    setForm({
      vehicleId: s.vehicleId.toString(),
      vehicleIds: [],
      scope: "individual",
      categoryScope: "",
      serviceType: SERVICE_TYPES.includes(s.serviceType)
        ? s.serviceType
        : "Custom",
      customServiceType: SERVICE_TYPES.includes(s.serviceType)
        ? ""
        : s.serviceType,
      intervalPreset: preset,
      customIntervalDays: preset === "custom" ? String(days) : "",
      nextDueDate: nsToDate(s.nextDueDate).toISOString().split("T")[0],
      notes: s.notes,
      status: s.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const isEditing = !!editSchedule;
    if (isEditing && !form.vehicleId) {
      toast.error("Vehicle is required");
      return;
    }
    const svcType =
      form.serviceType === "Custom" ? form.customServiceType : form.serviceType;
    if (!svcType) {
      toast.error("Service type is required");
      return;
    }
    if (!form.nextDueDate) {
      toast.error("Next due date is required");
      return;
    }
    const days =
      form.intervalPreset === "custom"
        ? Number(form.customIntervalDays)
        : Number(form.intervalPreset);
    if (Number.isNaN(days) || days < 1) {
      toast.error("Interval must be at least 1 day");
      return;
    }
    if (!actor) return;

    // Determine target vehicle IDs based on scope
    let targetVehicleIds: string[] = [];
    if (!editSchedule) {
      if (form.scope === "all") {
        targetVehicleIds = (vehicles ?? []).map((v: Vehicle) =>
          v.id.toString(),
        );
      } else if (form.scope === "category") {
        if (!form.categoryScope) {
          toast.error("Select a vehicle category");
          return;
        }
        targetVehicleIds = (vehicles ?? [])
          .filter((v: Vehicle) => v.vehicleType === form.categoryScope)
          .map((v: Vehicle) => v.id.toString());
        if (targetVehicleIds.length === 0) {
          toast.error("No vehicles found in that category");
          return;
        }
      } else {
        targetVehicleIds = form.vehicleIds;
        if (targetVehicleIds.length === 0) {
          toast.error("Select at least one vehicle");
          return;
        }
      }
    }

    setSaving(true);
    try {
      if (editSchedule) {
        // Preserve existing lastCompletedDate as bigint | undefined
        const lastCompletedDate: bigint | undefined = lcdToOptional(
          editSchedule.lastCompletedDate,
        );

        const data: {
          id: bigint;
          vehicleId: bigint;
          serviceType: string;
          intervalDays: bigint;
          nextDueDate: bigint;
          lastCompletedDate?: bigint;
          notes: string;
          status: string;
          createdAt: bigint;
        } = {
          id: editSchedule.id,
          vehicleId: BigInt(form.vehicleId),
          serviceType: svcType,
          intervalDays: BigInt(days),
          nextDueDate: dateToNs(form.nextDueDate),
          lastCompletedDate,
          notes: form.notes,
          status: form.status,
          createdAt: editSchedule.createdAt,
        };
        console.log("[ServiceSchedules] updateServiceSchedule payload:", data);
        await (actor as any).updateServiceSchedule(editSchedule.id, data);
        toast.success("Schedule updated");
      } else {
        // Create: one schedule per target vehicle
        await Promise.all(
          targetVehicleIds.map((vid) => {
            const data: {
              id: bigint;
              vehicleId: bigint;
              serviceType: string;
              intervalDays: bigint;
              nextDueDate: bigint;
              lastCompletedDate?: bigint;
              notes: string;
              status: string;
              createdAt: bigint;
            } = {
              id: 0n,
              vehicleId: BigInt(vid),
              serviceType: svcType,
              intervalDays: BigInt(days),
              nextDueDate: dateToNs(form.nextDueDate),
              lastCompletedDate: undefined,
              notes: form.notes,
              status: form.status,
              createdAt: 0n,
            };
            console.log(
              "[ServiceSchedules] createServiceSchedule payload:",
              data,
            );
            return (actor as any).createServiceSchedule(data);
          }),
        );
        const count = targetVehicleIds.length;
        toast.success(
          count > 1 ? `${count} schedules created` : "Schedule created",
        );
      }
      await qc.invalidateQueries({ queryKey: ["serviceSchedules"] });
      setModalOpen(false);
    } catch (err) {
      console.error("[ServiceSchedules] save error:", err);
      toast.error(
        "Failed to save schedule — check browser console for details",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleMarkComplete = async (id: bigint) => {
    if (!actor) return;
    setCompleting(id);
    try {
      const schedule = schedules?.find((s) => s.id === id);
      if (schedule) {
        setCompletionSnapshot({
          id: schedule.id,
          nextDueDate: schedule.nextDueDate,
          lastCompletedDate: schedule.lastCompletedDate,
          status: schedule.status,
          intervalDays: schedule.intervalDays,
          serviceType: schedule.serviceType,
          notes: schedule.notes,
          vehicleId: schedule.vehicleId,
          createdAt: schedule.createdAt,
        });
      }
      completionSavedRef.current = false;

      // Auto-create a work order for this service schedule completion
      let newWoId: bigint | undefined;
      try {
        const woPayload: WorkOrder = {
          id: 0n,
          title: schedule?.serviceType ?? "Scheduled Service",
          vehicleId: schedule?.vehicleId ?? 0n,
          description: schedule?.notes
            ? `Scheduled service: ${schedule.serviceType}. ${schedule.notes}`
            : `Scheduled service: ${schedule?.serviceType ?? ""}`,
          assignedMechanic:
            callerProfile?.name ?? (callerProfile as any)?.email ?? "",
          priority: WorkOrderPriority.Medium,
          status: WorkOrderStatus.Completed,
          scheduledDate: schedule?.nextDueDate,
          completedDate: BigInt(Date.now()) * 1_000_000n,
          notes: "",
          createdAt: 0n,
        };
        newWoId = await actor.createWorkOrder(woPayload);
        if (newWoId !== undefined) {
          setNewWorkOrderNumber(formatWONumber(newWoId));
          qc.invalidateQueries({ queryKey: ["workOrders"] });
        }
      } catch (err) {
        console.error("[ServiceSchedules] failed to create work order:", err);
      }

      await (actor as any).markScheduleComplete(id);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["serviceSchedules"] }),
        qc.invalidateQueries({ queryKey: ["maintenanceRecords"] }),
      ]);
      // Fetch fresh maintenance records to find the newly created one
      const freshRecords = await actor.getAllMaintenanceRecords();
      const sorted = [...freshRecords].sort(
        (a, b) => Number(b.createdAt) - Number(a.createdAt),
      );
      const vehicleId = schedule?.vehicleId;
      const newRecord = vehicleId
        ? (sorted.find((r) => r.vehicleId === vehicleId) ?? sorted[0])
        : sorted[0];
      const name =
        callerProfile?.name ?? (callerProfile as any)?.email ?? "Unknown User";
      setCompletedByName(name);
      if (newRecord) {
        setCompletionRecord({ ...newRecord, workOrderId: newWoId });
      } else {
        // Open modal with blank record pre-filled with vehicleId
        setCompletionRecord(
          vehicleId
            ? {
                vehicleId,
                id: 0n,
                description: "",
                cost: 0,
                mileage: 0n,
                technicianName: "",
                date: BigInt(Date.now()) * 1_000_000n,
                maintenanceType: "OilChange",
                createdAt: BigInt(Date.now()) * 1_000_000n,
                partsUsed: [],
                workOrderId: newWoId,
              }
            : null,
        );
      }
      setMaintenanceModalOpen(true);
      toast.info(
        newWoId !== undefined
          ? `Schedule completed! ${formatWONumber(newWoId)} auto-assigned. Fill in the maintenance record.`
          : "Schedule completed! Please fill in the maintenance record.",
      );
    } catch {
      toast.error("Failed to mark complete");
    } finally {
      setCompleting(null);
    }
  };

  const handleDelete = async (id: bigint) => {
    if (!actor) return;
    try {
      await (actor as any).deleteServiceSchedule(id);
      await qc.invalidateQueries({ queryKey: ["serviceSchedules"] });
      toast.success("Schedule deleted");
    } catch {
      toast.error("Failed to delete schedule");
    }
  };

  return (
    <div className="p-6 space-y-6" data-ocid="service-schedules.page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarClock size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Service Schedules
            </h1>
            <p className="text-sm text-muted-foreground">
              Preventive maintenance schedules &amp; recurring services
            </p>
          </div>
        </div>
        {canCreate && (
          <Button
            data-ocid="service-schedules.open_modal_button"
            className="gap-2"
            onClick={openAdd}
          >
            <Plus size={16} />
            Add Schedule
          </Button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="fleet-card">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Upcoming
            </p>
            <p className="text-3xl font-bold text-blue-400">{upcoming}</p>
          </CardContent>
        </Card>
        <Card className="fleet-card">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Overdue
            </p>
            <p className="text-3xl font-bold text-red-400">{overdue}</p>
          </CardContent>
        </Card>
        <Card className="fleet-card">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Completed
            </p>
            <p className="text-3xl font-bold text-emerald-400">{completed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="list">
        <TabsList className="mb-4">
          <TabsTrigger
            value="list"
            data-ocid="service-schedules.list.tab"
            className="gap-2"
          >
            <List size={15} /> List View
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            data-ocid="service-schedules.calendar.tab"
            className="gap-2"
          >
            <CalendarDays size={15} /> Calendar View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {isLoading ? (
            <div
              className="space-y-3"
              data-ocid="service-schedules.loading_state"
            >
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div
              className="text-center py-16 text-muted-foreground"
              data-ocid="service-schedules.empty_state"
            >
              <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No service schedules yet</p>
              <p className="text-sm mt-1">
                Add a recurring schedule to get started
              </p>
            </div>
          ) : (
            <Card className="fleet-card">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        {[
                          "Vehicle",
                          "Service Type",
                          "Next Due",
                          "Interval",
                          "Last Done",
                          "Status",
                          "Actions",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((s, idx) => {
                        const vehicle = vehicleMap[s.vehicleId.toString()];
                        const vehicleLabel = vehicle
                          ? `${vehicle.name} — ${vehicle.licensePlate}`
                          : `Vehicle #${s.vehicleId}`;
                        const isActive =
                          s.status === "Active" && !isJustCompleted(s);
                        const lastDone = getLastCompletedDate(s);
                        return (
                          <tr
                            key={s.id.toString()}
                            data-ocid={`service-schedules.item.${idx + 1}`}
                            className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                            onClick={() => openEdit(s)}
                            onKeyDown={(e) => e.key === "Enter" && openEdit(s)}
                          >
                            <td className="px-5 py-3.5 font-medium text-foreground">
                              {vehicleLabel}
                            </td>
                            <td className="px-5 py-3.5 text-foreground/80">
                              {s.serviceType}
                            </td>
                            <td className="px-5 py-3.5 text-foreground/80">
                              {formatDate(s.nextDueDate)}
                            </td>
                            <td className="px-5 py-3.5 text-muted-foreground">
                              {intervalLabel(s.intervalDays)}
                            </td>
                            <td className="px-5 py-3.5 text-muted-foreground">
                              {lastDone != null ? formatDate(lastDone) : "—"}
                            </td>
                            <td className="px-5 py-3.5">
                              <StatusBadge schedule={s} />
                            </td>
                            <td
                              className="px-5 py-3.5"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center gap-1">
                                {isActive && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    data-ocid={`service-schedules.confirm_button.${idx + 1}`}
                                    disabled={completing === s.id}
                                    onClick={() => handleMarkComplete(s.id)}
                                    className="gap-1.5 text-success border-success/40 hover:bg-success/10 text-xs h-7 px-2"
                                  >
                                    {completing === s.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="w-3 h-3" />
                                    )}
                                    Done
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  data-ocid={`service-schedules.edit_button.${idx + 1}`}
                                  onClick={() => openEdit(s)}
                                  className="h-7 w-7 p-0"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      data-ocid={`service-schedules.delete_button.${idx + 1}`}
                                      className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent data-ocid="service-schedules.dialog">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete Schedule?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently remove the service
                                        schedule for{" "}
                                        <strong>{s.serviceType}</strong>. This
                                        action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel data-ocid="service-schedules.cancel_button">
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        data-ocid="service-schedules.confirm_button"
                                        className="bg-destructive hover:bg-destructive/90"
                                        onClick={() => handleDelete(s.id)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <CalendarView schedules={list} />
        </TabsContent>
      </Tabs>

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="service-schedules.modal"
        >
          <DialogHeader>
            <DialogTitle>
              {editSchedule ? "Edit Service Schedule" : "Add Service Schedule"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Scope selector (new schedules only) */}
            {!editSchedule && (
              <div className="space-y-1.5">
                <Label>Apply Schedule To *</Label>
                <Select
                  value={form.scope}
                  onValueChange={(v) => setF("scope", v)}
                >
                  <SelectTrigger data-ocid="service-schedules.scope.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">
                      Individual Vehicles
                    </SelectItem>
                    <SelectItem value="category">
                      All Vehicles in a Category
                    </SelectItem>
                    <SelectItem value="all">
                      All Vehicles ({(vehicles ?? []).length})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Vehicle */}
            <div className="space-y-1.5">
              <Label>
                {editSchedule
                  ? "Vehicle *"
                  : form.scope === "individual"
                    ? "Vehicles * (select one or more)"
                    : form.scope === "category"
                      ? "Vehicle Category *"
                      : null}
              </Label>
              {editSchedule ? (
                <Select
                  value={form.vehicleId}
                  onValueChange={(v) => setF("vehicleId", v)}
                >
                  <SelectTrigger
                    id="ss-vehicle"
                    data-ocid="service-schedules.select"
                  >
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {(vehicles ?? []).map((v: Vehicle) => (
                      <SelectItem key={v.id.toString()} value={v.id.toString()}>
                        {v.name} — {v.licensePlate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : form.scope === "all" ? (
                <p className="text-sm text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
                  Will apply to all {(vehicles ?? []).length} vehicle
                  {(vehicles ?? []).length !== 1 ? "s" : ""} in the fleet.
                </p>
              ) : form.scope === "category" ? (
                <Select
                  value={form.categoryScope}
                  onValueChange={(v) => setF("categoryScope", v)}
                >
                  <SelectTrigger data-ocid="service-schedules.category.select">
                    <SelectValue placeholder="Select vehicle category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(VehicleType).map((t) => {
                      const count = (vehicles ?? []).filter(
                        (v: Vehicle) => v.vehicleType === t,
                      ).length;
                      return (
                        <SelectItem key={t} value={t}>
                          {t} ({count})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <div className="border border-border rounded-md max-h-44 overflow-y-auto p-2 space-y-1.5">
                  {(vehicles ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground px-1">
                      No vehicles found
                    </p>
                  ) : (
                    (vehicles ?? []).map((v: Vehicle) => {
                      const checked = form.vehicleIds.includes(v.id.toString());
                      return (
                        <label
                          key={v.id.toString()}
                          className={`flex items-center gap-2.5 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors ${
                            checked
                              ? "bg-primary/10 text-foreground"
                              : "hover:bg-muted/50 text-foreground/80"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="accent-primary w-3.5 h-3.5"
                            checked={checked}
                            onChange={() => toggleVehicle(v.id.toString())}
                            data-ocid="service-schedules.checkbox"
                          />
                          <span className="font-medium">{v.name}</span>
                          <span className="text-muted-foreground text-xs">
                            {v.licensePlate}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              )}
              {!editSchedule &&
                form.scope === "individual" &&
                form.vehicleIds.length > 0 && (
                  <p className="text-xs text-primary font-medium">
                    {form.vehicleIds.length} vehicle
                    {form.vehicleIds.length > 1 ? "s" : ""} selected
                  </p>
                )}
            </div>

            {/* Service type */}
            <div className="space-y-1.5">
              <Label htmlFor="ss-svctype">Service Type *</Label>
              <Select
                value={form.serviceType}
                onValueChange={(v) => setF("serviceType", v)}
              >
                <SelectTrigger
                  id="ss-svctype"
                  data-ocid="service-schedules.select"
                >
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.serviceType === "Custom" && (
                <Input
                  data-ocid="service-schedules.input"
                  placeholder="Enter custom service type"
                  value={form.customServiceType}
                  onChange={(e) => setF("customServiceType", e.target.value)}
                />
              )}
            </div>

            {/* Interval */}
            <div className="space-y-1.5">
              <Label>Interval *</Label>
              <Select
                value={form.intervalPreset}
                onValueChange={(v) => setF("intervalPreset", v)}
              >
                <SelectTrigger data-ocid="service-schedules.select">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  {INTERVAL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.intervalPreset === "custom" && (
                <Input
                  type="number"
                  min="1"
                  data-ocid="service-schedules.input"
                  placeholder="Number of days"
                  value={form.customIntervalDays}
                  onChange={(e) => setF("customIntervalDays", e.target.value)}
                />
              )}
            </div>

            {/* Next due date */}
            <div className="space-y-1.5">
              <Label htmlFor="ss-due">Next Due Date *</Label>
              <Input
                id="ss-due"
                type="date"
                data-ocid="service-schedules.input"
                value={form.nextDueDate}
                onChange={(e) => setF("nextDueDate", e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="ss-notes">Notes</Label>
              <Textarea
                id="ss-notes"
                data-ocid="service-schedules.textarea"
                placeholder="Optional notes..."
                rows={3}
                value={form.notes}
                onChange={(e) => setF("notes", e.target.value)}
              />
            </div>

            {/* Status toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="ss-status">Active</Label>
              <Switch
                id="ss-status"
                data-ocid="service-schedules.switch"
                checked={form.status === "Active"}
                onCheckedChange={(checked) =>
                  setF("status", checked ? "Active" : "Inactive")
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="service-schedules.cancel_button"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="service-schedules.submit_button"
              disabled={saving}
              onClick={handleSubmit}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : editSchedule ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Maintenance Record Modal (opened after completing a schedule) */}
      <MaintenanceModal
        open={maintenanceModalOpen}
        onSaved={() => {
          completionSavedRef.current = true;
        }}
        onClose={() => {
          if (!completionSavedRef.current && completionSnapshot) {
            // Revert the schedule back to its pre-completion state.
            // Convert lastCompletedDate from Candid [] | [bigint] → bigint | undefined
            // so the Candid encoder doesn't get a type mismatch.
            const revertLcd: bigint | undefined = lcdToOptional(
              completionSnapshot.lastCompletedDate,
            );
            const revertData: {
              id: bigint;
              vehicleId: bigint;
              serviceType: string;
              intervalDays: bigint;
              nextDueDate: bigint;
              lastCompletedDate?: bigint;
              notes: string;
              status: string;
              createdAt: bigint;
            } = {
              id: completionSnapshot.id,
              vehicleId: completionSnapshot.vehicleId,
              serviceType: completionSnapshot.serviceType,
              intervalDays: completionSnapshot.intervalDays,
              nextDueDate: completionSnapshot.nextDueDate,
              lastCompletedDate: revertLcd,
              notes: completionSnapshot.notes,
              status: completionSnapshot.status,
              createdAt: completionSnapshot.createdAt,
            };
            console.log(
              "[ServiceSchedules] reverting schedule to pre-completion state:",
              revertData,
            );
            (actor as any)
              .updateServiceSchedule(completionSnapshot.id, revertData)
              .then(() => {
                qc.invalidateQueries({ queryKey: ["serviceSchedules"] });
                toast.info("Service schedule reverted to Open.");
              })
              .catch((err: unknown) => {
                console.error("[ServiceSchedules] revert failed:", err);
              });
          }
          setMaintenanceModalOpen(false);
          setCompletionRecord(null);
          setCompletionSnapshot(null);
          setNewWorkOrderNumber("");
          completionSavedRef.current = false;
        }}
        record={completionRecord}
        vehicles={vehicles ?? []}
        completedBy={completedByName}
        workOrderNumber={newWorkOrderNumber || undefined}
        requireCompletion={true}
        completionType="schedule"
      />
    </div>
  );
}
