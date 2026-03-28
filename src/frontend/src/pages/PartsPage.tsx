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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Part } from "../backend";
import {
  useAllParts,
  useCreatePart,
  useDeletePart,
  useIsAdmin,
  useUpdatePart,
} from "../hooks/useQueries";
import { exportCSV, exportPDF } from "../lib/exportUtils";
import { nowNs } from "../lib/helpers";

const defaultForm = {
  name: "",
  partNumber: "",
  quantityInStock: "",
  minStockLevel: "",
  location: "",
  price: "",
};

function getPartPrice(p: { price?: number | null | number[] | [] }): number {
  if (p.price == null) return 0;
  if (Array.isArray(p.price))
    return p.price.length > 0 ? Number((p.price as number[])[0]) : 0;
  return Number(p.price);
}

export function PartsPage() {
  const { data: parts, isLoading } = useAllParts();
  const { data: isAdmin } = useIsAdmin();
  const createPart = useCreatePart();
  const updatePart = useUpdatePart();
  const deletePart = useDeletePart();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editPart, setEditPart] = useState<Part | null>(null);
  const [form, setForm] = useState(defaultForm);

  const filtered =
    parts?.filter((p: Part) => {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.partNumber.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
      );
    }) ?? [];

  const totalInventoryValue = (parts ?? []).reduce((sum: number, p: Part) => {
    return sum + getPartPrice(p) * Number(p.quantityInStock);
  }, 0);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => {
    setEditPart(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (p: Part) => {
    setEditPart(p);
    setForm({
      name: p.name,
      partNumber: p.partNumber,
      quantityInStock: p.quantityInStock.toString(),
      minStockLevel: p.minStockLevel.toString(),
      location: p.location,
      price: getPartPrice(p) > 0 ? getPartPrice(p).toString() : "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.partNumber ||
      !form.quantityInStock ||
      !form.minStockLevel ||
      !form.location ||
      !form.price
    ) {
      toast.error("Please fill in all required fields including price");
      return;
    }
    const priceVal = Number.parseFloat(form.price);
    if (Number.isNaN(priceVal) || priceVal < 0) {
      toast.error("Please enter a valid price");
      return;
    }
    const data: Part = {
      id: editPart?.id ?? 0n,
      name: form.name,
      partNumber: form.partNumber,
      quantityInStock: BigInt(form.quantityInStock),
      minStockLevel: BigInt(form.minStockLevel),
      location: form.location,
      price: [priceVal] as unknown as number,
      createdAt: editPart?.createdAt ?? nowNs(),
    };
    try {
      if (editPart) {
        await updatePart.mutateAsync({ id: editPart.id, part: data });
        toast.success("Part updated");
      } else {
        await createPart.mutateAsync(data);
        toast.success("Part added");
      }
      setModalOpen(false);
    } catch {
      toast.error("Failed to save part");
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deletePart.mutateAsync(id);
      toast.success("Part deleted");
    } catch {
      toast.error("Failed to delete part");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Part Name",
      "Part Number",
      "Unit Price",
      "Qty In Stock",
      "Min Stock",
      "Location",
      "Status",
    ];
    const rows = (parts ?? []).map((p: Part) => [
      p.name,
      p.partNumber,
      `$${getPartPrice(p).toFixed(2)}`,
      p.quantityInStock.toString(),
      p.minStockLevel.toString(),
      p.location,
      p.quantityInStock <= p.minStockLevel ? "Low Stock" : "In Stock",
    ]);
    exportCSV("parts-inventory", headers, rows);
  };

  const handleExportPDF = () => {
    const headers = [
      "Part Name",
      "Part Number",
      "Unit Price",
      "Qty In Stock",
      "Min Stock",
      "Location",
      "Status",
    ];
    const rows = (parts ?? []).map((p: Part) => [
      p.name,
      p.partNumber,
      `$${getPartPrice(p).toFixed(2)}`,
      p.quantityInStock.toString(),
      p.minStockLevel.toString(),
      p.location,
      p.quantityInStock <= p.minStockLevel ? "Low Stock" : "In Stock",
    ]);
    exportPDF("Parts Inventory Report", headers, rows);
  };

  const isPending = createPart.isPending || updatePart.isPending;

  return (
    <div className="p-6 space-y-5 animate-fade-in" data-ocid="parts.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Parts Inventory</h1>
          <div className="flex items-center gap-4 mt-0.5">
            <p className="text-muted-foreground text-sm">
              {parts?.length ?? 0} parts tracked
            </p>
            <span className="text-muted-foreground text-sm">•</span>
            <p className="text-sm font-semibold text-primary">
              Total Inventory Value: $
              {totalInventoryValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            data-ocid="parts.secondary_button"
            onClick={handleExportCSV}
          >
            <Download size={15} /> CSV
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            data-ocid="parts.toggle"
            onClick={handleExportPDF}
          >
            <Download size={15} /> PDF
          </Button>
          <Button
            data-ocid="parts.primary_button"
            onClick={openAdd}
            className="gap-2"
          >
            <Plus size={16} /> Add Part
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-ocid="parts.search_input"
          className="pl-9"
          placeholder="Search parts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-card border-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3" data-ocid="parts.loading_state">
            {["a", "b", "c", "d"].map((k) => (
              <Skeleton key={k} className="h-14 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div data-ocid="parts.empty_state" className="text-center py-16">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No parts found</p>
            <p className="text-muted-foreground/60 text-sm mt-1">
              Add spare parts to start tracking inventory
            </p>
            <Button className="mt-4 gap-2" onClick={openAdd}>
              <Plus size={16} /> Add Part
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-ocid="parts.table">
              <thead className="bg-muted/40">
                <tr>
                  {[
                    "Part Name",
                    "Part Number",
                    "Unit Price",
                    "Quantity",
                    "Min Stock",
                    "Location",
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
                {filtered.map((p: Part, i: number) => {
                  const isLow = p.quantityInStock <= p.minStockLevel;
                  const price = getPartPrice(p);
                  return (
                    <tr
                      key={p.id.toString()}
                      data-ocid={`parts.item.${i + 1}`}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-5 py-4 font-medium">{p.name}</td>
                      <td className="px-5 py-4">
                        <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">
                          {p.partNumber}
                        </code>
                      </td>
                      <td className="px-5 py-4 font-medium">
                        {price > 0 ? (
                          `$${price.toFixed(2)}`
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        {p.quantityInStock.toString()}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {p.minStockLevel.toString()}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {p.location}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            isLow
                              ? "bg-destructive/10 text-destructive"
                              : "bg-success/10 text-success"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isLow ? "bg-destructive" : "bg-success"
                            }`}
                          />
                          {isLow ? "Low Stock" : "In Stock"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            data-ocid={`parts.edit_button.${i + 1}`}
                            onClick={() => openEdit(p)}
                          >
                            <Pencil size={14} />
                          </Button>
                          {isAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  data-ocid={`parts.delete_button.${i + 1}`}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent data-ocid="parts.dialog">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Part?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete "{p.name}" from
                                    inventory.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel data-ocid="parts.cancel_button">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    data-ocid="parts.confirm_button"
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => handleDelete(p.id)}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={(o) => !o && setModalOpen(false)}>
        <DialogContent className="max-w-md" data-ocid="parts.modal">
          <DialogHeader>
            <DialogTitle>{editPart ? "Edit Part" : "Add Part"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="p-name">Part Name *</Label>
                <Input
                  id="p-name"
                  data-ocid="parts.input"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Air Filter"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="p-num">Part Number *</Label>
                <Input
                  id="p-num"
                  value={form.partNumber}
                  onChange={(e) => set("partNumber", e.target.value)}
                  placeholder="AF-1234"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-qty">Quantity in Stock *</Label>
                <Input
                  id="p-qty"
                  type="number"
                  min="0"
                  value={form.quantityInStock}
                  onChange={(e) => set("quantityInStock", e.target.value)}
                  placeholder="50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-min">Min Stock Level *</Label>
                <Input
                  id="p-min"
                  type="number"
                  min="0"
                  value={form.minStockLevel}
                  onChange={(e) => set("minStockLevel", e.target.value)}
                  placeholder="10"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="p-price">Unit Price ($) *</Label>
                <Input
                  id="p-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="29.99"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="p-loc">Location *</Label>
                <Input
                  id="p-loc"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="Shelf A-3"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              data-ocid="parts.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              data-ocid="parts.submit_button"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editPart ? "Save Changes" : "Add Part"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
