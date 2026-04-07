import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, ClipboardCheck, Loader2, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChecklistItemStatus, MaintenanceType, type Vehicle } from "../backend";
import { useCallerProfile, useCreateMaintenance } from "../hooks/useQueries";
import { nowNs } from "../lib/helpers";

const DEFAULT_ITEMS = [
  { itemLabel: "Tires & Wheels", category: "Safety" },
  { itemLabel: "Brakes", category: "Safety" },
  { itemLabel: "Headlights & Taillights", category: "Electrical" },
  { itemLabel: "Turn Signals", category: "Electrical" },
  { itemLabel: "Windshield & Wipers", category: "Visibility" },
  { itemLabel: "Engine Oil", category: "Fluids" },
  { itemLabel: "Coolant Level", category: "Fluids" },
  { itemLabel: "Brake Fluid", category: "Fluids" },
  { itemLabel: "Battery", category: "Electrical" },
  { itemLabel: "Belts & Hoses", category: "Engine" },
  { itemLabel: "Suspension", category: "Mechanical" },
  { itemLabel: "Exhaust System", category: "Mechanical" },
  { itemLabel: "Horn", category: "Safety" },
  { itemLabel: "Mirrors", category: "Visibility" },
  { itemLabel: "Seatbelts", category: "Safety" },
];

interface LocalChecklistItem {
  id: string;
  itemLabel: string;
  category: string;
  status: ChecklistItemStatus;
  notes: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle;
}

export function InspectionChecklistModal({ open, onClose, vehicle }: Props) {
  const { data: profile } = useCallerProfile();
  const createMaintenance = useCreateMaintenance();

  const [items, setItems] = useState<LocalChecklistItem[]>(() =>
    DEFAULT_ITEMS.map((item, i) => ({
      id: String(i),
      itemLabel: item.itemLabel,
      category: item.category,
      status: ChecklistItemStatus.NA,
      notes: "",
    })),
  );
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [completedBy, setCompletedBy] = useState(profile?.name ?? "");
  const [newItemLabel, setNewItemLabel] = useState("");
  const [showAddItem, setShowAddItem] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset checklist state every time the modal opens so prior selections never persist
  useEffect(() => {
    if (open) {
      setItems(
        DEFAULT_ITEMS.map((item, i) => ({
          id: String(i),
          itemLabel: item.itemLabel,
          category: item.category,
          status: ChecklistItemStatus.NA,
          notes: "",
        })),
      );
      setAdditionalNotes("");
      setCompletedBy(profile?.name ?? "");
      setNewItemLabel("");
      setShowAddItem(false);
    }
  }, [open, profile?.name]);

  const updateItemStatus = (id: string, status: ChecklistItemStatus) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  };

  const updateItemNotes = (id: string, notes: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes } : item)),
    );
  };

  const addCustomItem = () => {
    if (!newItemLabel.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        itemLabel: newItemLabel.trim(),
        category: "Custom",
        status: ChecklistItemStatus.NA,
        notes: "",
      },
    ]);
    setNewItemLabel("");
    setShowAddItem(false);
  };

  const removeItem = (id: string) => {
    if (!id.startsWith("custom-")) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const passCount = items.filter(
    (i) => i.status === ChecklistItemStatus.Pass,
  ).length;
  const failCount = items.filter(
    (i) => i.status === ChecklistItemStatus.Fail,
  ).length;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const summaryLines = items.map((item) => {
        const statusStr =
          item.status === ChecklistItemStatus.Pass
            ? "✓ PASS"
            : item.status === ChecklistItemStatus.Fail
              ? "✗ FAIL"
              : "— N/A";
        const noteStr = item.notes ? ` (${item.notes})` : "";
        return `${item.itemLabel}: ${statusStr}${noteStr}`;
      });

      const description = [
        `Vehicle Inspection — ${passCount} passed, ${failCount} failed`,
        "",
        ...summaryLines,
        ...(additionalNotes
          ? ["", `Additional Notes: ${additionalNotes}`]
          : []),
      ].join("\n");

      await createMaintenance.mutateAsync({
        id: 0n,
        vehicleId: vehicle.id,
        maintenanceType: MaintenanceType.Inspection,
        description,
        date: nowNs(),
        createdAt: nowNs(),
        mileage: 0n,
        cost: 0,
        technicianName: completedBy || profile?.name || "Unknown",
        partsUsed: [],
        partQuantities: [],
      });
      toast.success("Inspection saved to maintenance history");
      onClose();
    } catch {
      toast.error("Failed to save inspection");
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusButton = (
    item: LocalChecklistItem,
    status: ChecklistItemStatus,
    label: string,
  ) => {
    const isActive = item.status === status;
    const colorClass =
      status === ChecklistItemStatus.Pass
        ? isActive
          ? "bg-success text-white border-success"
          : "border-border text-muted-foreground hover:border-success hover:text-success"
        : status === ChecklistItemStatus.Fail
          ? isActive
            ? "bg-destructive text-white border-destructive"
            : "border-border text-muted-foreground hover:border-destructive hover:text-destructive"
          : isActive
            ? "bg-muted text-foreground border-border"
            : "border-border text-muted-foreground hover:bg-muted";

    return (
      <button
        type="button"
        onClick={() => updateItemStatus(item.id, status)}
        className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${colorClass}`}
      >
        {label}
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck size={18} className="text-primary" />
            Vehicle Inspection — {vehicle.name}
          </DialogTitle>
        </DialogHeader>

        {/* Summary badges */}
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/10">
            <Check size={12} className="mr-1" /> {passCount} Pass
          </Badge>
          <Badge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/10">
            <X size={12} className="mr-1" /> {failCount} Fail
          </Badge>
          <Badge variant="secondary">
            {items.length - passCount - failCount} N/A
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">
            {items.length} items
          </span>
        </div>

        {/* Checklist grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-lg border transition-colors ${
                item.status === ChecklistItemStatus.Pass
                  ? "border-success/30 bg-success/5"
                  : item.status === ChecklistItemStatus.Fail
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-border bg-muted/20"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug">
                    {item.itemLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.category}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {statusButton(item, ChecklistItemStatus.Pass, "Pass")}
                  {statusButton(item, ChecklistItemStatus.Fail, "Fail")}
                  {statusButton(item, ChecklistItemStatus.NA, "N/A")}
                  {item.id.startsWith("custom-") && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
              <Input
                placeholder="Notes (optional)"
                value={item.notes}
                onChange={(e) => updateItemNotes(item.id, e.target.value)}
                className="h-7 text-xs bg-background/60"
              />
            </div>
          ))}
        </div>

        {/* Add custom item */}
        <div className="border-t border-border pt-3">
          {showAddItem ? (
            <div className="flex gap-2">
              <Input
                autoFocus
                placeholder="Custom item name..."
                value={newItemLabel}
                onChange={(e) => setNewItemLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addCustomItem();
                  if (e.key === "Escape") setShowAddItem(false);
                }}
                className="h-9"
              />
              <Button size="sm" onClick={addCustomItem} className="h-9">
                Add
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddItem(false)}
                className="h-9"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddItem(true)}
              className="gap-1.5 text-muted-foreground"
            >
              <Plus size={14} /> Add Custom Item
            </Button>
          )}
        </div>

        {/* Footer fields */}
        <div className="space-y-3 border-t border-border pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="inspection-notes">Additional Notes</Label>
            <Textarea
              id="inspection-notes"
              placeholder="Any additional observations or notes..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="min-h-[70px] resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="completed-by">Completed By</Label>
            <Input
              id="completed-by"
              placeholder="Inspector name"
              value={completedBy}
              onChange={(e) => setCompletedBy(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              className="flex-1 gap-2"
              onClick={handleSubmit}
              disabled={isSubmitting}
              data-ocid="inspection.submit_button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check size={16} /> Submit Inspection
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
