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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { MaintenanceRecord, Vehicle } from "../backend";
import { MaintenanceType } from "../backend";
import {
  useCreateMaintenance,
  useUpdateMaintenance,
} from "../hooks/useQueries";
import { maintenanceTypeLabel, nowNs, nsToDate } from "../lib/helpers";

interface Props {
  open: boolean;
  onClose: () => void;
  record?: MaintenanceRecord | null;
  vehicles: Vehicle[];
  defaultVehicleId?: bigint;
}

const toInputDate = (ns: bigint) => {
  const d = nsToDate(ns);
  return d.toISOString().split("T")[0];
};
const fromInputDate = (s: string): bigint =>
  BigInt(new Date(`${s}T00:00:00`).getTime()) * 1_000_000n;

const today = new Date().toISOString().split("T")[0];

const defaultForm = {
  vehicleId: "",
  date: today,
  maintenanceType: MaintenanceType.OilChange,
  description: "",
  cost: "",
  mileage: "",
  technicianName: "",
  nextServiceDate: "",
};

export function MaintenanceModal({
  open,
  onClose,
  record,
  vehicles,
  defaultVehicleId,
}: Props) {
  const [form, setForm] = useState(defaultForm);
  const createM = useCreateMaintenance();
  const updateM = useUpdateMaintenance();
  const isPending = createM.isPending || updateM.isPending;

  useEffect(() => {
    if (record) {
      setForm({
        vehicleId: record.vehicleId.toString(),
        date: toInputDate(record.date),
        maintenanceType: record.maintenanceType,
        description: record.description,
        cost: record.cost.toString(),
        mileage: record.mileage.toString(),
        technicianName: record.technicianName,
        nextServiceDate: record.nextServiceDate
          ? toInputDate(record.nextServiceDate)
          : "",
      });
    } else {
      setForm({
        ...defaultForm,
        vehicleId:
          defaultVehicleId?.toString() ?? vehicles[0]?.id.toString() ?? "",
      });
    }
  }, [record, defaultVehicleId, vehicles]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (
      !form.vehicleId ||
      !form.description ||
      !form.technicianName ||
      !form.cost ||
      !form.mileage
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    const data: MaintenanceRecord = {
      id: record?.id ?? 0n,
      vehicleId: BigInt(form.vehicleId),
      date: fromInputDate(form.date),
      maintenanceType: form.maintenanceType as MaintenanceType,
      description: form.description,
      cost: Number.parseFloat(form.cost),
      mileage: BigInt(form.mileage),
      technicianName: form.technicianName,
      nextServiceDate: form.nextServiceDate
        ? fromInputDate(form.nextServiceDate)
        : undefined,
      createdAt: record?.createdAt ?? nowNs(),
    };
    try {
      if (record) {
        await updateM.mutateAsync({ id: record.id, record: data });
        toast.success("Maintenance record updated");
      } else {
        await createM.mutateAsync(data);
        toast.success("Maintenance record added");
      }
      onClose();
    } catch {
      toast.error("Failed to save maintenance record");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg" data-ocid="maintenance.modal">
        <DialogHeader>
          <DialogTitle>
            {record ? "Edit Maintenance Record" : "Add Maintenance Record"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Vehicle *</Label>
              <Select
                value={form.vehicleId}
                onValueChange={(v) => set("vehicleId", v)}
              >
                <SelectTrigger data-ocid="maintenance.select">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id.toString()} value={v.id.toString()}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Maintenance Type *</Label>
              <Select
                value={form.maintenanceType}
                onValueChange={(v) => set("maintenanceType", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MaintenanceType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {maintenanceTypeLabel[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-date">Date *</Label>
              <Input
                id="m-date"
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-cost">Cost ($) *</Label>
              <Input
                id="m-cost"
                data-ocid="maintenance.input"
                type="number"
                step="0.01"
                value={form.cost}
                onChange={(e) => set("cost", e.target.value)}
                placeholder="150.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-mileage">Mileage *</Label>
              <Input
                id="m-mileage"
                type="number"
                value={form.mileage}
                onChange={(e) => set("mileage", e.target.value)}
                placeholder="45000"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="m-tech">Technician Name *</Label>
              <Input
                id="m-tech"
                value={form.technicianName}
                onChange={(e) => set("technicianName", e.target.value)}
                placeholder="James Carter"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="m-next">Next Service Date</Label>
              <Input
                id="m-next"
                type="date"
                value={form.nextServiceDate}
                onChange={(e) => set("nextServiceDate", e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="m-desc">Description *</Label>
              <Textarea
                id="m-desc"
                data-ocid="maintenance.textarea"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Describe the maintenance work done..."
                rows={3}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="maintenance.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            data-ocid="maintenance.submit_button"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {record ? "Save Changes" : "Add Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
