import type { backendInterface } from "../backend";
import { MaintenanceType, Status, VehicleType } from "../backend";
import { nowNs } from "./helpers";

const daysAgoNs = (days: number): bigint =>
  BigInt(Date.now() - days * 24 * 60 * 60 * 1000) * 1_000_000n;

const daysFromNowNs = (days: number): bigint =>
  BigInt(Date.now() + days * 24 * 60 * 60 * 1000) * 1_000_000n;

export async function seedData(actor: backendInterface): Promise<void> {
  const now = nowNs();

  // Create vehicles
  const v1 = await actor.createVehicle({
    id: 0n,
    name: "Truck Alpha",
    vehicleType: VehicleType.Truck,
    licensePlate: "TRK-001",
    year: 2021n,
    make: "Ford",
    model: "F-750",
    status: Status.Active,
    notes: "Primary long-haul truck",
    createdAt: now,
  });
  const v2 = await actor.createVehicle({
    id: 0n,
    name: "Bus Route 7",
    vehicleType: VehicleType.Bus,
    licensePlate: "BUS-007",
    year: 2019n,
    make: "Mercedes",
    model: "Sprinter",
    status: Status.Active,
    notes: "City transit bus",
    createdAt: now,
  });
  const v3 = await actor.createVehicle({
    id: 0n,
    name: "Van Delivery 3",
    vehicleType: VehicleType.Van,
    licensePlate: "VAN-033",
    year: 2022n,
    make: "Toyota",
    model: "HiAce",
    status: Status.Active,
    notes: "Last-mile delivery van",
    createdAt: now,
  });
  const v4 = await actor.createVehicle({
    id: 0n,
    name: "Trailer H20",
    vehicleType: VehicleType.Trailer,
    licensePlate: "TRL-020",
    year: 2020n,
    make: "Utility",
    model: "XL-Series",
    status: Status.Inactive,
    notes: "Awaiting inspection clearance",
    createdAt: now,
  });

  // Maintenance records for Truck Alpha
  await actor.createMaintenanceRecord({
    id: 0n,
    vehicleId: v1,
    date: daysAgoNs(60),
    maintenanceType: MaintenanceType.OilChange,
    description: "Full synthetic oil change, filter replaced",
    cost: 120,
    mileage: 45200n,
    technicianName: "James Carter",
    nextServiceDate: daysFromNowNs(30),
    createdAt: now,
  });
  await actor.createMaintenanceRecord({
    id: 0n,
    vehicleId: v1,
    date: daysAgoNs(180),
    maintenanceType: MaintenanceType.BrakeService,
    description: "Replaced front brake pads and rotors",
    cost: 850,
    mileage: 38000n,
    technicianName: "Maria Lopez",
    nextServiceDate: daysFromNowNs(180),
    createdAt: now,
  });
  await actor.createMaintenanceRecord({
    id: 0n,
    vehicleId: v1,
    date: daysAgoNs(10),
    maintenanceType: MaintenanceType.TireRotation,
    description: "Tire rotation and pressure check",
    cost: 75,
    mileage: 47800n,
    technicianName: "James Carter",
    nextServiceDate: daysFromNowNs(90),
    createdAt: now,
  });

  // Maintenance records for Bus Route 7
  await actor.createMaintenanceRecord({
    id: 0n,
    vehicleId: v2,
    date: daysAgoNs(45),
    maintenanceType: MaintenanceType.Inspection,
    description: "Annual DOT inspection - passed",
    cost: 300,
    mileage: 92000n,
    technicianName: "Robert Kim",
    nextServiceDate: daysFromNowNs(5),
    createdAt: now,
  });
  await actor.createMaintenanceRecord({
    id: 0n,
    vehicleId: v2,
    date: daysAgoNs(90),
    maintenanceType: MaintenanceType.OilChange,
    description: "Oil and filter change",
    cost: 150,
    mileage: 88000n,
    technicianName: "Robert Kim",
    nextServiceDate: daysFromNowNs(15),
    createdAt: now,
  });

  // Maintenance records for Van Delivery 3
  await actor.createMaintenanceRecord({
    id: 0n,
    vehicleId: v3,
    date: daysAgoNs(20),
    maintenanceType: MaintenanceType.EngineCheck,
    description: "Engine diagnostic - check engine light",
    cost: 200,
    mileage: 31500n,
    technicianName: "Sarah Patel",
    createdAt: now,
  });
  await actor.createMaintenanceRecord({
    id: 0n,
    vehicleId: v3,
    date: daysAgoNs(120),
    maintenanceType: MaintenanceType.Electrical,
    description: "Alternator replacement",
    cost: 680,
    mileage: 27000n,
    technicianName: "Sarah Patel",
    nextServiceDate: daysFromNowNs(60),
    createdAt: now,
  });

  // Maintenance records for Trailer H20
  await actor.createMaintenanceRecord({
    id: 0n,
    vehicleId: v4,
    date: daysAgoNs(5),
    maintenanceType: MaintenanceType.Bodywork,
    description: "Rear panel dent repair and repaint",
    cost: 1200,
    mileage: 0n,
    technicianName: "Carlos Ruiz",
    createdAt: now,
  });
}
