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
import { Info, Loader2, Package } from "lucide-react";
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
  laborHours: "",
  laborCost: "",
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
  const [partQuantityMap, setPartQuantityMap] = useState<
    Record<string, number>
  >({});
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
        laborHours:
          (record as any).laborHours != null
            ? String((record as any).laborHours)
            : "",
        laborCost:
          (record as any).laborCost != null
            ? String((record as any).laborCost)
            : "",
      });
      setSelectedPartIds(record.partsUsed ?? []);
      // Build quantity map from partQuantities if available
      const qtyMap: Record<string, number> = {};
      if (
        (record as any).partQuantities &&
        (record as any).partQuantities.length > 0
      ) {
        for (const pq of (record as any).partQuantities) {
          qtyMap[pq.partId.toString()] = Number(pq.quantity);
        }
      } else {
        // Fallback: default qty 1 for each selected part
        for (const id of (record as any).partsUsed ?? []) {
          qtyMap[id.toString()] = 1;
        }
      }
      setPartQuantityMap(qtyMap);
    } else {
      setForm({
        ...defaultForm,
        vehicleId:
          defaultVehicleId?.toString() ?? vehicles[0]?.id.toString() ?? "",
      });
      setSelectedPartIds([]);
      setPartQuantityMap({});
    }
  }, [record, defaultVehicleId, vehicles]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const calcPartsCost = (ids: bigint[], qtyMap: Record<string, number>) => {
    return ids.reduce((sum, id) => {
      const part = parts.find((p) => p.id === id);
      const price = part ? getPartPrice(part) : 0;
      const qty = qtyMap[id.toString()] ?? 1;
      return sum + price * qty;
    }, 0);
  };

  const updateTotalCost = (
    ids: bigint[],
    qtyMap: Record<string, number>,
    laborCostStr: string,
  ) => {
    const partsCost = calcPartsCost(ids, qtyMap);
    const laborCostVal = laborCostStr ? Number.parseFloat(laborCostStr) : 0;
    const total = partsCost + laborCostVal;
    if (total > 0) {
      setForm((f) => ({ ...f, cost: total.toFixed(2) }));
    }
  };

  const togglePart = (id: bigint) => {
    setSelectedPartIds((prev) => {
      const isRemoving = prev.some((p) => p === id);
      let next: bigint[];
      let newQtyMap: Record<string, number>;
      if (isRemoving) {
        next = prev.filter((p) => p !== id);
        newQtyMap = { ...partQuantityMap };
        delete newQtyMap[id.toString()];
      } else {
        next = [...prev, id];
        newQtyMap = { ...partQuantityMap, [id.toString()]: 1 };
      }
      setPartQuantityMap(newQtyMap);
      updateTotalCost(next, newQtyMap, form.laborCost);
      return next;
    });
  };

  const setPartQty = (id: bigint, qty: number) => {
    const newQtyMap = { ...partQuantityMap, [id.toString()]: qty };
    setPartQuantityMap(newQtyMap);
    updateTotalCost(selectedPartIds, newQtyMap, form.laborCost);
  };

  const handleLaborCostChange = (val: string) => {
    set("laborCost", val);
    updateTotalCost(selectedPartIds, partQuantityMap, val);
  };

  const partsCost = calcPartsCost(selectedPartIds, partQuantityMap);
  const laborCostVal = form.laborCost ? Number.parseFloat(form.laborCost) : 0;

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
    const data = {
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
      partQuantities: selectedPartIds.map((id) => ({
        partId: id,
        quantity: BigInt(partQuantityMap[id.toString()] ?? 1),
      })),
      laborHours: form.laborHours
        ? Number.parseFloat(form.laborHours)
        : undefined,
      laborCost: form.laborCost ? Number.parseFloat(form.laborCost) : undefined,
      createdAt: record?.createdAt ?? nowNs(),
    } as MaintenanceRecordFull;
    try {
      if (record) {
        await updateM.mutateAsync({
          id: record.id,
          record: data,
          previousPartIds: record.partsUsed ?? [],
        });
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
                <Label htmlFor="m-mileage">Mileage *</Label>
                <Input
                  id="m-mileage"
                  type="number"
                  value={form.mileage}
                  onChange={(e) => set("mileage", e.target.value)}
                  placeholder="45000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-labor-hours">Labor Hours</Label>
                <Input
                  id="m-labor-hours"
                  type="number"
                  step="0.5"
                  value={form.laborHours}
                  onChange={(e) => set("laborHours", e.target.value)}
                  placeholder="2.5"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-labor-cost">Labor Cost ($)</Label>
                <Input
                  id="m-labor-cost"
                  type="number"
                  step="0.01"
                  value={form.laborCost}
                  onChange={(e) => handleLaborCostChange(e.target.value)}
                  placeholder="120.00"
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
                      const qty = partQuantityMap[part.id.toString()] ?? 1;
                      const maxQty = Number(part.quantityInStock);
                      const unitPrice = getPartPrice(part);
                      return (
                        <div
                          key={part.id.toString()}
                          className={`flex items-start gap-3 px-3 py-2.5 ${
                            outOfStock ? "opacity-50" : ""
                          }`}
                        >
                          <div
                            className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-muted/50 transition-colors rounded"
                            onClick={() => !outOfStock && togglePart(part.id)}
                            onKeyDown={(e) =>
                              e.key === " " &&
                              !outOfStock &&
                              togglePart(part.id)
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
                                {unitPrice > 0 && (
                                  <> &bull; ${unitPrice.toFixed(2)}/unit</>
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
                          {isSelected && (
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex flex-col items-end gap-0.5">
                                <div className="flex items-center gap-1.5">
                                  <Label className="text-xs text-muted-foreground">
                                    Qty
                                  </Label>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={maxQty}
                                    value={qty}
                                    onChange={(e) =>
                                      setPartQty(
                                        part.id,
                                        Math.min(
                                          maxQty,
                                          Math.max(
                                            1,
                                            Number.parseInt(e.target.value) ||
                                              1,
                                          ),
                                        ),
                                      )
                                    }
                                    className="w-16 h-7 text-xs"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                {unitPrice > 0 && (
                                  <p className="text-xs text-primary font-medium">
                                    {qty} × ${unitPrice.toFixed(2)} = $
                                    {(qty * unitPrice).toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cost summary */}
              <div className="col-span-2 space-y-2">
                {(selectedPartIds.length > 0 || form.laborCost) && (
                  <div className="bg-muted/40 rounded-lg p-3 space-y-1.5 text-sm">
                    <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      Cost Breakdown
                    </p>
                    {selectedPartIds.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Parts cost
                        </span>
                        <span className="font-medium">
                          ${partsCost.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {form.laborCost && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Labor cost
                        </span>
                        <span className="font-medium">
                          ${Number.parseFloat(form.laborCost || "0").toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
                      <span>Total</span>
                      <span className="text-primary">
                        ${(partsCost + laborCostVal).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="m-cost">Total Cost ($) *</Label>
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
                {selectedPartIds.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      Total cost is auto-calculated from parts and labor above
                    </span>
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
