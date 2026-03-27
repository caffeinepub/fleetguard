import { MaintenanceType, Status, VehicleType } from "../backend";

export const nowNs = (): bigint => BigInt(Date.now()) * 1_000_000n;

export const nsToDate = (ns: bigint): Date => new Date(Number(ns / 1_000_000n));

export const formatDate = (ns: bigint): string =>
  nsToDate(ns).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount,
  );

export const vehicleTypeLabel: Record<VehicleType, string> = {
  [VehicleType.Truck]: "Truck",
  [VehicleType.Trailer]: "Trailer",
  [VehicleType.Bus]: "Bus",
  [VehicleType.Van]: "Van",
  [VehicleType.Other]: "Other",
};

export const maintenanceTypeLabel: Record<MaintenanceType, string> = {
  [MaintenanceType.OilChange]: "Oil Change",
  [MaintenanceType.TireRotation]: "Tire Rotation",
  [MaintenanceType.BrakeService]: "Brake Service",
  [MaintenanceType.EngineCheck]: "Engine Check",
  [MaintenanceType.Transmission]: "Transmission",
  [MaintenanceType.Electrical]: "Electrical",
  [MaintenanceType.Bodywork]: "Bodywork",
  [MaintenanceType.Inspection]: "Inspection",
  [MaintenanceType.Other]: "Other",
};

export const statusLabel: Record<Status, string> = {
  [Status.Active]: "Active",
  [Status.Inactive]: "Inactive",
};

export const daysFromNow = (ns: bigint): number => {
  const diff = nsToDate(ns).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
