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
import type { Vehicle } from "../backend";
import { Status, VehicleType } from "../backend";
import { useCreateVehicle, useUpdateVehicle } from "../hooks/useQueries";
import { nowNs } from "../lib/helpers";

interface Props {
  open: boolean;
  onClose: () => void;
  vehicle?: Vehicle | null;
}

const defaultForm = {
  name: "",
  vehicleType: VehicleType.Truck,
  licensePlate: "",
  year: new Date().getFullYear().toString(),
  make: "",
  model: "",
  status: Status.Active,
  notes: "",
};

export function VehicleModal({ open, onClose, vehicle }: Props) {
  const [form, setForm] = useState(defaultForm);
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const isPending = createVehicle.isPending || updateVehicle.isPending;

  useEffect(() => {
    if (vehicle) {
      setForm({
        name: vehicle.name,
        vehicleType: vehicle.vehicleType,
        licensePlate: vehicle.licensePlate,
        year: vehicle.year.toString(),
        make: vehicle.make,
        model: vehicle.model,
        status: vehicle.status,
        notes: vehicle.notes,
      });
    } else {
      setForm(defaultForm);
    }
  }, [vehicle]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.licensePlate || !form.make || !form.model) {
      toast.error("Please fill in all required fields");
      return;
    }
    const data: Vehicle = {
      id: vehicle?.id ?? 0n,
      name: form.name,
      vehicleType: form.vehicleType as VehicleType,
      licensePlate: form.licensePlate,
      year: BigInt(form.year),
      make: form.make,
      model: form.model,
      status: form.status as Status,
      notes: form.notes,
      createdAt: vehicle?.createdAt ?? nowNs(),
    };
    try {
      if (vehicle) {
        await updateVehicle.mutateAsync({ id: vehicle.id, vehicle: data });
        toast.success("Vehicle updated successfully");
      } else {
        await createVehicle.mutateAsync(data);
        toast.success("Vehicle added successfully");
      }
      onClose();
    } catch {
      toast.error("Failed to save vehicle");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg" data-ocid="vehicle.modal">
        <DialogHeader>
          <DialogTitle>
            {vehicle ? "Edit Vehicle" : "Add New Vehicle"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="v-name">Vehicle Name *</Label>
              <Input
                id="v-name"
                data-ocid="vehicle.input"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Truck Alpha"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select
                value={form.vehicleType}
                onValueChange={(v) => set("vehicleType", v)}
              >
                <SelectTrigger data-ocid="vehicle.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(VehicleType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-plate">License Plate *</Label>
              <Input
                id="v-plate"
                value={form.licensePlate}
                onChange={(e) => set("licensePlate", e.target.value)}
                placeholder="TRK-001"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-year">Year *</Label>
              <Input
                id="v-year"
                type="number"
                value={form.year}
                onChange={(e) => set("year", e.target.value)}
                placeholder="2022"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-make">Make *</Label>
              <Input
                id="v-make"
                value={form.make}
                onChange={(e) => set("make", e.target.value)}
                placeholder="Ford"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-model">Model *</Label>
              <Input
                id="v-model"
                value={form.model}
                onChange={(e) => set("model", e.target.value)}
                placeholder="F-750"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Status.Active}>Active</SelectItem>
                  <SelectItem value={Status.Inactive}>Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="v-notes">Notes</Label>
              <Textarea
                id="v-notes"
                data-ocid="vehicle.textarea"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="vehicle.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            data-ocid="vehicle.submit_button"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {vehicle ? "Save Changes" : "Add Vehicle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
