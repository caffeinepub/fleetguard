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
  Loader2,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Vehicle, Warranty } from "../backend";
import { useActor } from "../hooks/useActor";
import {
  useAllVehicles,
  useAllWarranties,
  useIsAdmin,
} from "../hooks/useQueries";
import { nowNs } from "../lib/helpers";

function getWarrantyStatus(expiryDate: bigint): {
  label: string;
  className: string;
} {
  const now = Date.now();
  const expiry = Number(expiryDate) / 1_000_000;
  const daysLeft = (expiry - now) / (1000 * 60 * 60 * 24);
  if (daysLeft < 0)
    return {
      label: "Expired",
      className: "bg-destructive/15 text-destructive border-destructive/30",
    };
  if (daysLeft <= 30)
    return {
      label: "Expiring Soon",
      className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    };
  return {
    label: "Active",
    className: "bg-success/15 text-success border-success/30",
  };
}

const defaultForm = {
  vehicleId: "",
  description: "",
  provider: "",
  startDate: "",
  expiryDate: "",
  coverageDetails: "",
  cost: "",
  notes: "",
};

export function WarrantiesPage() {
  const { data: warranties, isLoading } = useAllWarranties();
  const { data: vehicles } = useAllVehicles();
  const { data: isAdmin } = useIsAdmin();
  const { actor } = useActor();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editWarranty, setEditWarranty] = useState<Warranty | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const vehicleMap = Object.fromEntries(
    (vehicles ?? []).map((v: Vehicle) => [v.id.toString(), v.name]),
  );

  const filtered = (warranties ?? []).filter((w: Warranty) => {
    const vName = vehicleMap[w.vehicleId.toString()] ?? "";
    const q = search.toLowerCase();
    return (
      w.description.toLowerCase().includes(q) ||
      w.provider.toLowerCase().includes(q) ||
      vName.toLowerCase().includes(q)
    );
  });

  const setF = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const tsToDateStr = (ts: bigint) =>
    new Date(Number(ts) / 1_000_000).toISOString().split("T")[0];

  const openAdd = () => {
    setEditWarranty(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (w: Warranty) => {
    setEditWarranty(w);
    setForm({
      vehicleId: w.vehicleId.toString(),
      description: w.description,
      provider: w.provider,
      startDate: tsToDateStr(w.startDate),
      expiryDate: tsToDateStr(w.expiryDate),
      coverageDetails: w.coverageDetails,
      cost: w.cost > 0 ? w.cost.toString() : "",
      notes: w.notes,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (
      !form.vehicleId ||
      !form.description ||
      !form.provider ||
      !form.expiryDate
    ) {
      toast.error(
        "Vehicle, description, provider, and expiry date are required",
      );
      return;
    }
    if (!actor) return;
    setSaving(true);
    try {
      const data: Warranty = {
        id: editWarranty?.id ?? 0n,
        vehicleId: BigInt(form.vehicleId),
        description: form.description,
        provider: form.provider,
        startDate: form.startDate
          ? BigInt(new Date(form.startDate).getTime()) * 1_000_000n
          : nowNs(),
        expiryDate: BigInt(new Date(form.expiryDate).getTime()) * 1_000_000n,
        coverageDetails: form.coverageDetails,
        cost: form.cost ? Number.parseFloat(form.cost) : 0,
        notes: form.notes,
        createdAt: editWarranty?.createdAt ?? nowNs(),
      };
      if (editWarranty) {
        await actor.updateWarranty(editWarranty.id, data);
        toast.success("Warranty updated");
      } else {
        await actor.createWarranty(data);
        toast.success("Warranty added");
      }
      await qc.invalidateQueries({ queryKey: ["warranties"] });
      setModalOpen(false);
    } catch {
      toast.error("Failed to save warranty");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: bigint) => {
    if (!actor) return;
    try {
      await actor.deleteWarranty(id);
      await qc.invalidateQueries({ queryKey: ["warranties"] });
      toast.success("Warranty deleted");
    } catch {
      toast.error("Failed to delete warranty");
    }
  };

  const activeCount = (warranties ?? []).filter(
    (w: Warranty) => getWarrantyStatus(w.expiryDate).label === "Active",
  ).length;
  const expiringCount = (warranties ?? []).filter(
    (w: Warranty) => getWarrantyStatus(w.expiryDate).label === "Expiring Soon",
  ).length;

  return (
    <div className="p-6 space-y-5 animate-fade-in" data-ocid="warranties.page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Warranties
          </h1>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-muted-foreground text-sm">
              {warranties?.length ?? 0} total
            </p>
            {activeCount > 0 && (
              <span className="text-sm text-success font-medium">
                {activeCount} active
              </span>
            )}
            {expiringCount > 0 && (
              <span className="text-sm text-amber-400 font-medium">
                {expiringCount} expiring soon
              </span>
            )}
          </div>
        </div>
        <Button
          data-ocid="warranties.primary_button"
          onClick={openAdd}
          className="gap-2"
        >
          <Plus size={16} /> Add Warranty
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          data-ocid="warranties.search_input"
          className="pl-9"
          placeholder="Search warranties..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3" data-ocid="warranties.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="warranties.empty_state"
        >
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No warranties found</p>
          <p className="text-sm mt-1">Add a warranty to track coverage</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((w: Warranty, idx: number) => {
            const vName =
              vehicleMap[w.vehicleId.toString()] ?? "Unknown Vehicle";
            const status = getWarrantyStatus(w.expiryDate);
            return (
              <div
                key={w.id.toString()}
                data-ocid={`warranties.item.${idx + 1}`}
                className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">
                      {w.description}
                    </span>
                    <Badge variant="outline" className={status.className}>
                      {status.label}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-0.5">
                    <span>🚛 {vName}</span>
                    <span>🏢 {w.provider}</span>
                    <span>
                      Expires:{" "}
                      {new Date(
                        Number(w.expiryDate) / 1_000_000,
                      ).toLocaleDateString()}
                    </span>
                    {w.cost > 0 && <span>${w.cost.toFixed(2)}</span>}
                  </div>
                  {w.coverageDetails && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {w.coverageDetails}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    data-ocid={`warranties.edit_button.${idx + 1}`}
                    onClick={() => openEdit(w)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  {isAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          data-ocid={`warranties.delete_button.${idx + 1}`}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent data-ocid="warranties.dialog">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Warranty?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove this warranty record.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-ocid="warranties.cancel_button">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            data-ocid="warranties.confirm_button"
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => handleDelete(w.id)}
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

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="warranties.modal"
        >
          <DialogHeader>
            <DialogTitle>
              {editWarranty ? "Edit Warranty" : "Add Warranty"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Vehicle *</Label>
              <Select
                value={form.vehicleId}
                onValueChange={(v) => setF("vehicleId", v)}
              >
                <SelectTrigger data-ocid="warranties.select">
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
              <Label htmlFor="w-desc">Description *</Label>
              <Input
                id="w-desc"
                data-ocid="warranties.input"
                placeholder="e.g. Engine warranty"
                value={form.description}
                onChange={(e) => setF("description", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-provider">Provider *</Label>
              <Input
                id="w-provider"
                data-ocid="warranties.input"
                placeholder="e.g. Ford Motor Company"
                value={form.provider}
                onChange={(e) => setF("provider", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="w-start">Start Date</Label>
                <Input
                  id="w-start"
                  type="date"
                  data-ocid="warranties.input"
                  value={form.startDate}
                  onChange={(e) => setF("startDate", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="w-expiry">Expiry Date *</Label>
                <Input
                  id="w-expiry"
                  type="date"
                  data-ocid="warranties.input"
                  value={form.expiryDate}
                  onChange={(e) => setF("expiryDate", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-cost">Cost ($)</Label>
              <Input
                id="w-cost"
                type="number"
                min="0"
                step="0.01"
                data-ocid="warranties.input"
                placeholder="0.00"
                value={form.cost}
                onChange={(e) => setF("cost", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-coverage">Coverage Details</Label>
              <Textarea
                id="w-coverage"
                data-ocid="warranties.textarea"
                rows={3}
                placeholder="What is covered under this warranty..."
                value={form.coverageDetails}
                onChange={(e) => setF("coverageDetails", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-notes">Notes</Label>
              <Textarea
                id="w-notes"
                data-ocid="warranties.textarea"
                rows={2}
                placeholder="Additional notes..."
                value={form.notes}
                onChange={(e) => setF("notes", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="warranties.cancel_button"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="warranties.submit_button"
              disabled={saving}
              onClick={handleSubmit}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : editWarranty ? "Update" : "Add Warranty"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
