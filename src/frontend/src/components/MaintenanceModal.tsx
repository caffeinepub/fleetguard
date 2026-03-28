import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { MaintenanceRecordFull, Vehicle } from "../backend";
import { MaintenanceType } from "../backend";
import {
  useAllParts,
  useCreateMaintenance,
  useUpdateMaintenance,
} from "../hooks/useQueries";
import { maintenanceTypeLabel, nowNs, nsToDate } from "../lib/helpers";

function getPartPrice(p: { price?: number | null | number[] | [] }): number {
  if (p.price == null) return 0;
  if (Array.isArray(p.price))
    return p.price.length > 0 ? Number((p.price as number[])[0]) : 0;
  return Number(p.price);
}

interface Props {
  open: boolean;
  onClose: () => void;
  record?: MaintenanceRecordFull | null;
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
  const [selectedPartIds, setSelectedPartIds] = useState<bigint[]>([]);
  const createM = useCreateMaintenance();
  const updateM = useUpdateMaintenance();
  const { data: parts = [] } = useAllParts();
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
      setSelectedPartIds(record.partsUsed ?? []);
    } else {
      setForm({
        ...defaultForm,
        vehicleId:
          defaultVehicleId?.toString() ?? vehicles[0]?.id.toString() ?? "",
      });
      setSelectedPartIds([]);
    }
  }, [record, defaultVehicleId, vehicles]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const togglePart = (id: bigint) => {
    setSelectedPartIds((prev) =>
      prev.some((p) => p === id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

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
    const data: MaintenanceRecordFull = {
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
      partsUsed: selectedPartIds,
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
        <ScrollArea className="max-h-[70vh] pr-2">
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

              {/* Parts Used */}
              <div className="col-span-2 space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <Label>Parts Used</Label>
                  {selectedPartIds.length > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {selectedPartIds.length} selected
                    </Badge>
                  )}
                </div>
                {parts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No parts in inventory yet.
                  </p>
                ) : (
                  <div className="border rounded-md divide-y">
                    {parts.map((part) => {
                      const checkboxId = `part-check-${part.id.toString()}`;
                      const isSelected = selectedPartIds.some(
                        (id) => id === part.id,
                      );
                      const outOfStock = part.quantityInStock === 0n;
                      return (
                        <div
                          key={part.id.toString()}
                          className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors ${
                            outOfStock ? "opacity-50" : ""
                          }`}
                          onClick={() => !outOfStock && togglePart(part.id)}
                          onKeyDown={(e) =>
                            e.key === " " && !outOfStock && togglePart(part.id)
                          }
                        >
                          <Checkbox
                            id={checkboxId}
                            checked={isSelected}
                            onCheckedChange={() =>
                              !outOfStock && togglePart(part.id)
                            }
                            disabled={outOfStock && !isSelected}
                          />
                          <Label
                            htmlFor={checkboxId}
                            className="flex-1 min-w-0 cursor-pointer font-normal"
                          >
                            <p className="text-sm font-medium truncate">
                              {part.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              #{part.partNumber} &bull; Stock:{" "}
                              {part.quantityInStock.toString()}
                              {getPartPrice(part) > 0 && (
                                <> &bull; ${getPartPrice(part).toFixed(2)}</>
                              )}
                            </p>
                          </Label>
                          {outOfStock && (
                            <Badge
                              variant="destructive"
                              className="text-xs shrink-0"
                            >
                              Out of stock
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
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
