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
  Building2,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Store,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Vendor } from "../backend";
import { FleetRole } from "../backend";
import { useActor } from "../hooks/useActor";
import {
  useAllVendors,
  useCallerFleetRole,
  useIsAdmin,
} from "../hooks/useQueries";
import { nowNs } from "../lib/helpers";

const CATEGORIES = [
  "Parts Supplier",
  "Service Provider",
  "Equipment",
  "Fuel",
  "Other",
];

const categoryColors: Record<string, string> = {
  "Parts Supplier": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Service Provider": "bg-success/15 text-success border-success/30",
  Equipment: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  Fuel: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Other: "bg-muted text-muted-foreground border-border",
};

const defaultForm = {
  name: "",
  category: "Parts Supplier",
  contactName: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

export function VendorsPage() {
  const { data: vendors, isLoading } = useAllVendors();
  const { data: isAdmin } = useIsAdmin();
  const { data: fleetRole } = useCallerFleetRole();
  const canCreate = isAdmin || fleetRole === FleetRole.FleetManager;
  const { actor } = useActor();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const filtered = (vendors ?? []).filter((v: Vendor) => {
    const q = search.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.contactName.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q)
    );
  });

  const setF = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => {
    setEditVendor(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (v: Vendor) => {
    setEditVendor(v);
    setForm({
      name: v.name,
      category: v.category,
      contactName: v.contactName,
      phone: v.phone,
      email: v.email,
      address: v.address,
      notes: v.notes,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name) {
      toast.error("Vendor name is required");
      return;
    }
    if (!actor) return;
    setSaving(true);
    try {
      const data: Vendor = {
        id: editVendor?.id ?? 0n,
        name: form.name,
        category: form.category,
        contactName: form.contactName,
        phone: form.phone,
        email: form.email,
        address: form.address,
        notes: form.notes,
        createdAt: editVendor?.createdAt ?? nowNs(),
      };
      if (editVendor) {
        await actor.updateVendor(editVendor.id, data);
        toast.success("Vendor updated");
      } else {
        await actor.createVendor(data);
        toast.success("Vendor added");
      }
      await qc.invalidateQueries({ queryKey: ["vendors"] });
      setModalOpen(false);
    } catch {
      toast.error("Failed to save vendor");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: bigint) => {
    if (!actor) return;
    try {
      await actor.deleteVendor(id);
      await qc.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor deleted");
    } catch {
      toast.error("Failed to delete vendor");
    }
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in" data-ocid="vendors.page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Store className="w-6 h-6 text-primary" />
            Vendors
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {vendors?.length ?? 0} vendors in directory
          </p>
        </div>
        {canCreate && (
          <Button
            data-ocid="vendors.primary_button"
            onClick={openAdd}
            className="gap-2"
          >
            <Plus size={16} /> Add Vendor
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          data-ocid="vendors.search_input"
          className="pl-9"
          placeholder="Search vendors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          data-ocid="vendors.loading_state"
        >
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="vendors.empty_state"
        >
          <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No vendors found</p>
          <p className="text-sm mt-1">Add a vendor to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v: Vendor, idx: number) => (
            <div
              key={v.id.toString()}
              data-ocid={`vendors.item.${idx + 1}`}
              className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="font-semibold text-foreground">
                      {v.name}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      categoryColors[v.category] ?? categoryColors.Other
                    }
                  >
                    {v.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    data-ocid={`vendors.edit_button.${idx + 1}`}
                    onClick={() => openEdit(v)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  {canCreate && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          data-ocid={`vendors.delete_button.${idx + 1}`}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent data-ocid="vendors.dialog">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Vendor?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove this vendor.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-ocid="vendors.cancel_button">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            data-ocid="vendors.confirm_button"
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => handleDelete(v.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                {v.contactName && (
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{v.contactName}</span>
                  </div>
                )}
                {v.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{v.phone}</span>
                  </div>
                )}
                {v.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{v.email}</span>
                  </div>
                )}
                {v.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="line-clamp-1">{v.address}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="vendors.modal"
        >
          <DialogHeader>
            <DialogTitle>
              {editVendor ? "Edit Vendor" : "Add Vendor"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="v-name">Vendor Name *</Label>
              <Input
                id="v-name"
                data-ocid="vendors.input"
                placeholder="e.g. ABC Parts Co."
                value={form.name}
                onChange={(e) => setF("name", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setF("category", v)}
              >
                <SelectTrigger data-ocid="vendors.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-contact">Contact Name</Label>
              <Input
                id="v-contact"
                data-ocid="vendors.input"
                placeholder="Contact person"
                value={form.contactName}
                onChange={(e) => setF("contactName", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="v-phone">Phone</Label>
                <Input
                  id="v-phone"
                  data-ocid="vendors.input"
                  placeholder="+1 555 000 0000"
                  value={form.phone}
                  onChange={(e) => setF("phone", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-email">Email</Label>
                <Input
                  id="v-email"
                  type="email"
                  data-ocid="vendors.input"
                  placeholder="vendor@example.com"
                  value={form.email}
                  onChange={(e) => setF("email", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-addr">Address</Label>
              <Input
                id="v-addr"
                data-ocid="vendors.input"
                placeholder="123 Main St, City, Province"
                value={form.address}
                onChange={(e) => setF("address", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-notes">Notes</Label>
              <Textarea
                id="v-notes"
                data-ocid="vendors.textarea"
                rows={3}
                placeholder="Additional notes..."
                value={form.notes}
                onChange={(e) => setF("notes", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="vendors.cancel_button"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="vendors.submit_button"
              disabled={saving}
              onClick={handleSubmit}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : editVendor ? "Update" : "Add Vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
