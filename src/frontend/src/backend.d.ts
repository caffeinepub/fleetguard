import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PartQuantity {
    partId: bigint;
    quantity: bigint;
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
    partQuantities: Array<PartQuantity>;
    laborHours?: number;
    laborCost?: number;
    description: string;
    workOrderId?: bigint;
    maintenanceType: MaintenanceType;
    vehicleId: bigint;
}
export type Time = bigint;
export interface WorkOrder {
    id: bigint;
    completedDate?: Time;
    status: WorkOrderStatus;
    title: string;
    scheduledDate?: Time;
    createdAt: Time;
    description: string;
    notes: string;
    priority: WorkOrderPriority;
    assignedMechanic: string;
    vehicleId: bigint;
}
export interface SubscriptionRecord {
    status: string;
    updatedAt: Time;
    companyName: string;
    startDate?: Time;
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
export interface ServiceSchedule {
    id: bigint;
    status: string;
    serviceType: string;
    lastCompletedDate?: Time;
    nextDueDate: Time;
    createdAt: Time;
    intervalDays: bigint;
    notes: string;
    vehicleId: bigint;
}
export interface DashboardStats {
    activeVehicles: bigint;
    totalVehicles: bigint;
    upcomingMaintenanceCount: bigint;
    overdueCount: bigint;
    lowStockPartsCount: bigint;
}
export interface PartFull {
    id: bigint;
    partNumber: string;
    quantityInStock: bigint;
    name: string;
    createdAt: Time;
    minStockLevel: bigint;
    price?: number;
    location: string;
}
export interface Warranty {
    id: bigint;
    provider: string;
    expiryDate: Time;
    cost: number;
    coverageDetails: string;
    createdAt: Time;
    description: string;
    notes: string;
    vehicleId: bigint;
    startDate: Time;
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
export interface ChatMessage {
    id: bigint;
    createdAt: Time;
    senderPrincipal: string;
    message: string;
    senderName: string;
}
export interface Vendor {
    id: bigint;
    contactName: string;
    name: string;
    createdAt: Time;
    email: string;
    address: string;
    notes: string;
    category: string;
    phone: string;
}
export interface UserProfile {
    name: string;
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
    High = "High",
    Medium = "Medium",
    Critical = "Critical"
}
export enum WorkOrderStatus {
    Open = "Open",
    Cancelled = "Cancelled",
    InProgress = "InProgress",
    Completed = "Completed"
}
export interface backendInterface {
    approveCompanyWithKey(devKey: string, companyName: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bulkCreateVehicles(vehicleList: Array<Vehicle>): Promise<Array<bigint>>;
    completeWorkOrder(id: bigint): Promise<bigint>;
    createInviteToken(email: string, role: FleetRole): Promise<string>;
    createMaintenanceRecord(record: MaintenanceRecordFull): Promise<bigint>;
    createPart(part: PartFull): Promise<bigint>;
    createServiceSchedule(schedule: ServiceSchedule): Promise<bigint>;
    createVehicle(vehicle: Vehicle): Promise<bigint>;
    createVendor(vendor: Vendor): Promise<bigint>;
    createWarranty(warranty: Warranty): Promise<bigint>;
    createWorkOrder(wo: WorkOrder): Promise<bigint>;
    deletePart(id: bigint): Promise<void>;
    deleteServiceSchedule(id: bigint): Promise<void>;
    deleteVehicle(id: bigint): Promise<void>;
    deleteVendor(id: bigint): Promise<void>;
    deleteWarranty(id: bigint): Promise<void>;
    deleteWorkOrder(id: bigint): Promise<void>;
    getAllCompanyApprovalsWithKey(devKey: string): Promise<Array<[string, string]>>;
    getAllCompanyRegistrations(): Promise<Array<CompanySettings>>;
    getAllCompanyRegistrationsWithKey(devKey: string): Promise<Array<CompanySettings>>;
    getAllMaintenanceRecords(): Promise<Array<MaintenanceRecordFull>>;
    getAllParts(): Promise<Array<PartFull>>;
    getAllServiceSchedules(): Promise<Array<ServiceSchedule>>;
    getAllSubscriptions(): Promise<Array<SubscriptionRecord>>;
    getAllSubscriptionsWithKey(devKey: string): Promise<Array<SubscriptionRecord>>;
    getAllVehicles(): Promise<Array<Vehicle>>;
    getAllVendors(): Promise<Array<Vendor>>;
    getAllWarranties(): Promise<Array<Warranty>>;
    getAllWorkOrders(): Promise<Array<WorkOrder>>;
    getCallerFleetRole(): Promise<FleetRole | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChatMessages(): Promise<Array<ChatMessage>>;
    getCompanyApprovalStatusWithKey(devKey: string, companyName: string): Promise<string>;
    getCompanySettings(): Promise<CompanySettings | null>;
    getDashboardStats(): Promise<DashboardStats>;
    getDefaultCurrency(): Promise<string>;
    getInviteTokens(): Promise<Array<InviteToken>>;
    getLowStockParts(): Promise<Array<PartFull>>;
    getMaintenanceRecord(id: bigint): Promise<MaintenanceRecordFull>;
    getMaintenanceRecordsByVehicle(vehicleId: bigint): Promise<Array<MaintenanceRecordFull>>;
    getOverdueMaintenance(): Promise<Array<MaintenanceRecordFull>>;
    getPart(id: bigint): Promise<PartFull>;
    getSubscriptionStatus(companyName: string): Promise<SubscriptionRecord | null>;
    getUpcomingMaintenance(): Promise<Array<MaintenanceRecordFull>>;
    getUserFleetRole(user: Principal): Promise<FleetRole | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVehicle(id: bigint): Promise<Vehicle>;
    getVendor(id: bigint): Promise<Vendor>;
    getWarrantiesByVehicle(vehicleId: bigint): Promise<Array<Warranty>>;
    getWarranty(id: bigint): Promise<Warranty>;
    getWorkOrder(id: bigint): Promise<WorkOrder>;
    getWorkOrdersByVehicle(vehicleId: bigint): Promise<Array<WorkOrder>>;
    isCallerAdmin(): Promise<boolean>;
    markScheduleComplete(id: bigint): Promise<void>;
    redeemInviteToken(token: string): Promise<FleetRole>;
    rejectCompanyWithKey(devKey: string, companyName: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveCompanySettings(settings: CompanySettings): Promise<void>;
    saveDefaultCurrency(currency: string): Promise<void>;
    sendChatMessage(senderName: string, message: string): Promise<bigint>;
    setUserFleetRole(user: Principal, role: FleetRole): Promise<void>;
    updateMaintenanceRecord(id: bigint, record: MaintenanceRecordFull): Promise<void>;
    updatePart(id: bigint, part: PartFull): Promise<void>;
    updateServiceSchedule(id: bigint, schedule: ServiceSchedule): Promise<void>;
    updateSubscriptionStatus(companyName: string, status: string, startDate: Time | null): Promise<void>;
    updateSubscriptionStatusWithKey(devKey: string, companyName: string, status: string, startDate: Time | undefined): Promise<void>;
    updateVehicle(id: bigint, vehicle: Vehicle): Promise<void>;
    updateVendor(id: bigint, vendor: Vendor): Promise<void>;
    updateWarranty(id: bigint, warranty: Warranty): Promise<void>;
    updateWorkOrder(id: bigint, wo: WorkOrder): Promise<void>;
}
