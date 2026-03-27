import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface MaintenanceRecord {
    id: bigint;
    mileage: bigint;
    technicianName: string;
    nextServiceDate?: Time;
    cost: number;
    date: Time;
    createdAt: Time;
    description: string;
    maintenanceType: MaintenanceType;
    vehicleId: bigint;
}
export interface Vehicle {
    id: bigint;
    status: Status;
    model: string;
    vehicleType: VehicleType;
    licensePlate: string;
    make: string;
    name: string;
    createdAt: Time;
    year: bigint;
    notes: string;
}
export interface UserProfile {
    name: string;
}
export interface DashboardStats {
    activeVehicles: bigint;
    totalVehicles: bigint;
    upcomingMaintenanceCount: bigint;
    overdueCount: bigint;
}
export enum MaintenanceType {
    OilChange = "OilChange",
    Inspection = "Inspection",
    TireRotation = "TireRotation",
    Transmission = "Transmission",
    Bodywork = "Bodywork",
    BrakeService = "BrakeService",
    Electrical = "Electrical",
    Other = "Other",
    EngineCheck = "EngineCheck"
}
export enum Status {
    Inactive = "Inactive",
    Active = "Active"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum VehicleType {
    Bus = "Bus",
    Van = "Van",
    Trailer = "Trailer",
    Truck = "Truck",
    Other = "Other"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createMaintenanceRecord(record: MaintenanceRecord): Promise<bigint>;
    createVehicle(vehicle: Vehicle): Promise<bigint>;
    deleteVehicle(id: bigint): Promise<void>;
    getAllMaintenanceRecords(): Promise<Array<MaintenanceRecord>>;
    getAllVehicles(): Promise<Array<Vehicle>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardStats(): Promise<DashboardStats>;
    getMaintenanceRecord(id: bigint): Promise<MaintenanceRecord>;
    getMaintenanceRecordsByVehicle(vehicleId: bigint): Promise<Array<MaintenanceRecord>>;
    getOverdueMaintenance(): Promise<Array<MaintenanceRecord>>;
    getUpcomingMaintenance(): Promise<Array<MaintenanceRecord>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVehicle(id: bigint): Promise<Vehicle>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateMaintenanceRecord(id: bigint, record: MaintenanceRecord): Promise<void>;
    updateVehicle(id: bigint, vehicle: Vehicle): Promise<void>;
}
