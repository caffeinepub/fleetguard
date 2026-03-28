import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PartFull {
    id: bigint;
    partNumber: string;
    quantityInStock: bigint;
    name: string;
    createdAt: Time;
    minStockLevel: bigint;
    location: string;
    price?: number | null;
}
export type Part = PartFull;
export type Time = bigint;
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
export interface DashboardStats {
    activeVehicles: bigint;
    totalVehicles: bigint;
    upcomingMaintenanceCount: bigint;
    overdueCount: bigint;
    lowStockPartsCount: bigint;
}
export interface InviteToken {
    token: string;
    usedBy?: Principal;
    createdAt: Time;
    role: FleetRole;
    email: string;
}
export interface CompanySettings {
    adminPrincipal: string;
    createdAt: Time;
    logoUrl: string;
    companyName: string;
    fleetSize: string;
    industry: string;
    contactPhone: string;
}
export interface UserProfile {
    name: string;
}
export interface MaintenanceRecordFull {
    id: bigint;
    mileage: bigint;
    technicianName: string;
    nextServiceDate?: Time;
    cost: number;
    date: Time;
    createdAt: Time;
    partsUsed: Array<bigint>;
    description: string;
    maintenanceType: MaintenanceType;
    vehicleId: bigint;
}
export interface WorkOrder {
    id: bigint;
    title: string;
    vehicleId: bigint;
    description: string;
    assignedMechanic: string;
    priority: WorkOrderPriority;
    status: WorkOrderStatus;
    scheduledDate?: Time;
    completedDate?: Time;
    notes: string;
    createdAt: Time;
}
export interface Vendor {
    id: bigint;
    name: string;
    contactName: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
    category: string;
    createdAt: Time;
}
export interface Warranty {
    id: bigint;
    vehicleId: bigint;
    description: string;
    provider: string;
    startDate: Time;
    expiryDate: Time;
    coverageDetails: string;
    cost: number;
    notes: string;
    createdAt: Time;
}
export enum FleetRole {
    FleetManager = "FleetManager",
    Mechanic = "Mechanic",
    Admin = "Admin"
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
export enum WorkOrderPriority {
    Low = "Low",
    Medium = "Medium",
    High = "High",
    Critical = "Critical"
}
export enum WorkOrderStatus {
    Open = "Open",
    InProgress = "InProgress",
    Completed = "Completed",
    Cancelled = "Cancelled"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bulkCreateVehicles(vehicleList: Array<Vehicle>): Promise<Array<bigint>>;
    completeWorkOrder(id: bigint): Promise<bigint>;
    createInviteToken(email: string, role: FleetRole): Promise<string>;
    createMaintenanceRecord(record: MaintenanceRecordFull): Promise<bigint>;
    createPart(part: Part): Promise<bigint>;
    createVehicle(vehicle: Vehicle): Promise<bigint>;
    createVendor(vendor: Vendor): Promise<bigint>;
    createWarranty(warranty: Warranty): Promise<bigint>;
    createWorkOrder(wo: WorkOrder): Promise<bigint>;
    deletePart(id: bigint): Promise<void>;
    deleteVehicle(id: bigint): Promise<void>;
    deleteVendor(id: bigint): Promise<void>;
    deleteWarranty(id: bigint): Promise<void>;
    deleteWorkOrder(id: bigint): Promise<void>;
    getAllCompanyRegistrations(): Promise<Array<CompanySettings>>;
    getAllMaintenanceRecords(): Promise<Array<MaintenanceRecordFull>>;
    getAllParts(): Promise<Array<Part>>;
    getAllVehicles(): Promise<Array<Vehicle>>;
    getAllVendors(): Promise<Array<Vendor>>;
    getAllWarranties(): Promise<Array<Warranty>>;
    getAllWorkOrders(): Promise<Array<WorkOrder>>;
    getCallerFleetRole(): Promise<FleetRole | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCompanySettings(): Promise<CompanySettings | null>;
    getDashboardStats(): Promise<DashboardStats>;
    getInviteTokens(): Promise<Array<InviteToken>>;
    getLowStockParts(): Promise<Array<Part>>;
    getMaintenanceRecord(id: bigint): Promise<MaintenanceRecordFull>;
    getMaintenanceRecordsByVehicle(vehicleId: bigint): Promise<Array<MaintenanceRecordFull>>;
    getOverdueMaintenance(): Promise<Array<MaintenanceRecordFull>>;
    getPart(id: bigint): Promise<Part>;
    getUpcomingMaintenance(): Promise<Array<MaintenanceRecordFull>>;
    getUserFleetRole(user: Principal): Promise<FleetRole | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVehicle(id: bigint): Promise<Vehicle>;
    getVendor(id: bigint): Promise<Vendor>;
    getWarranty(id: bigint): Promise<Warranty>;
    getWarrantiesByVehicle(vehicleId: bigint): Promise<Array<Warranty>>;
    getWorkOrder(id: bigint): Promise<WorkOrder>;
    getWorkOrdersByVehicle(vehicleId: bigint): Promise<Array<WorkOrder>>;
    isCallerAdmin(): Promise<boolean>;
    redeemInviteToken(token: string): Promise<FleetRole>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveCompanySettings(settings: CompanySettings): Promise<void>;
    setUserFleetRole(user: Principal, role: FleetRole): Promise<void>;
    updateMaintenanceRecord(id: bigint, record: MaintenanceRecordFull): Promise<void>;
    updatePart(id: bigint, part: Part): Promise<void>;
    updateVehicle(id: bigint, vehicle: Vehicle): Promise<void>;
    updateVendor(id: bigint, vendor: Vendor): Promise<void>;
    updateWarranty(id: bigint, warranty: Warranty): Promise<void>;
    updateWorkOrder(id: bigint, wo: WorkOrder): Promise<void>;
}
