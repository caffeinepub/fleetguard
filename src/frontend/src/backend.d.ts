import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CompanyUserInfo {
    principal: Principal;
    role: FleetRole;
    profile?: UserProfile;
}
export interface AuditLog {
    id: bigint;
    status: string;
    action: string;
    oldValue?: string;
    newValue?: string;
    entityId: string;
    timestamp: bigint;
    entityName: string;
    actorPrincipal: string;
    entityType: string;
}
export type Time = bigint;
export interface SubscriptionRecord {
    status: string;
    plan: string;
    tier: SubscriptionTier;
    updatedAt: Time;
    companyName: string;
    vehicleLimit: bigint;
    trialEndsAt?: Time;
    startDate?: Time;
}
export interface DiscountCode {
    id: bigint;
    expiresAt?: bigint;
    value: bigint;
    code: string;
    maxUsageCount?: bigint;
    createdAt: Time;
    discountType: string;
    usedCount: bigint;
    description: string;
    isActive: boolean;
    applicableTiers: Array<string>;
}
export interface Vehicle {
    id: bigint;
    status: VehicleStatus;
    model: string;
    vehicleType: VehicleType;
    licensePlate: string;
    make: string;
    name: string;
    createdAt: Time;
    year: bigint;
    notes: string;
}
export interface PartFull {
    id: bigint;
    partNumber: string;
    quantityInStock: bigint;
    name: string;
    createdAt: Time;
    minStockLevel: bigint;
    category?: string;
    price?: number;
    location: string;
}
export interface TaxSettings {
    taxEnabled: boolean;
    taxLabel: string;
    taxRate: number;
}
export interface InviteToken {
    token: string;
    usedBy?: Principal;
    createdAt: Time;
    role: FleetRole;
    email: string;
    companyId: string;
}
export interface DiscountCodeRedemption {
    redeemedAt: bigint;
    companyName: string;
    companyId: string;
}
export interface CompanySettings {
    adminPrincipal: string;
    createdAt: Time;
    logoUrl: string;
    contactEmail: string;
    companyName: string;
    fleetSize: string;
    industry: string;
    contactPhone: string;
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
export interface MaintenanceRecordFull {
    id: bigint;
    mileage: bigint;
    technicianName: string;
    partQuantities: Array<PartQuantity>;
    nextServiceDate?: Time;
    cost: number;
    date: Time;
    createdAt: Time;
    partsUsed: Array<bigint>;
    laborHours?: number;
    description: string;
    workOrderId?: bigint;
    maintenanceType: MaintenanceType;
    laborCost?: number;
    vehicleId: bigint;
}
export interface SubscriptionWithVehicleCount {
    vehicleCount: bigint;
    record: SubscriptionRecord;
}
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
export interface DashboardStats {
    activeVehicles: bigint;
    totalVehicles: bigint;
    upcomingMaintenanceCount: bigint;
    overdueCount: bigint;
    lowStockPartsCount: bigint;
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
export interface VehicleImportValidationResult {
    parsedVehicle?: Vehicle;
    errors: Array<string>;
    rowIndex: bigint;
    warnings: Array<string>;
    isValid: boolean;
}
export interface Notification {
    id: bigint;
    title: string;
    relatedEntityType?: string;
    createdAt: Time;
    isRead: boolean;
    relatedEntityId?: bigint;
    message: string;
    severity: NotificationSeverity;
}
export interface InspectionChecklist {
    id: bigint;
    mileage: bigint;
    inspectorName: string;
    createdAt: Time;
    notes: string;
    items: Array<ChecklistItem>;
    overallStatus: string;
    vehicleId: bigint;
}
export interface ChecklistItem {
    id: bigint;
    status: ChecklistItemStatus;
    itemLabel: string;
    notes: string;
    category: string;
}
export interface PartQuantity {
    quantity: bigint;
    partId: bigint;
}
export interface VehicleImportRow {
    model: string;
    vehicleType: string;
    licensePlate: string;
    make: string;
    name: string;
    year: bigint;
    rowIndex: bigint;
    notes: string;
}
export interface UserProfile {
    name: string;
}
export enum ChecklistItemStatus {
    NA = "NA",
    Fail = "Fail",
    Pass = "Pass"
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
export enum NotificationSeverity {
    Info = "Info",
    Critical = "Critical",
    Warning = "Warning"
}
export enum SubscriptionTier {
    growth = "growth",
    enterprise = "enterprise",
    starter = "starter"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum VehicleStatus {
    Inactive = "Inactive",
    Active = "Active"
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
    addUserToCompanyWithKey(devKey: string, companyId: string, user: Principal, role: FleetRole): Promise<void>;
    applyDiscountCode(code: string): Promise<void>;
    approveCompany(companyName: string): Promise<void>;
    approveCompanyWithKey(devKey: string, companyName: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bulkCreateVehicles(vehicleList: Array<Vehicle>): Promise<{
        __kind__: "ok";
        ok: Array<bigint>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    cancelSubscription(companyName: string): Promise<void>;
    completeWorkOrder(id: bigint): Promise<bigint>;
    createDiscountCode(discount: DiscountCode): Promise<bigint>;
    createDiscountCodeWithKey(devKey: string, discount: DiscountCode): Promise<bigint>;
    createInspectionChecklist(checklist: InspectionChecklist): Promise<bigint>;
    createInviteToken(email: string, role: FleetRole): Promise<string>;
    createMaintenanceRecord(record: MaintenanceRecordFull): Promise<bigint>;
    createNotification(notif: Notification): Promise<bigint>;
    createPart(part: PartFull): Promise<bigint>;
    createServiceSchedule(schedule: ServiceSchedule): Promise<bigint>;
    createVehicle(vehicle: Vehicle): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createVendor(vendor: Vendor): Promise<bigint>;
    createWarranty(warranty: Warranty): Promise<bigint>;
    createWorkOrder(wo: WorkOrder): Promise<bigint>;
    deleteCompanyWithKey(devKey: string, companyId: string): Promise<void>;
    deleteDiscountCode(code: string): Promise<void>;
    deleteDiscountCodeWithKey(devKey: string, id: bigint): Promise<void>;
    deleteInspectionChecklist(id: bigint): Promise<void>;
    deleteNotification(id: bigint): Promise<void>;
    deletePart(id: bigint): Promise<void>;
    deleteServiceSchedule(id: bigint): Promise<void>;
    deleteVehicle(id: bigint): Promise<void>;
    deleteVendor(id: bigint): Promise<void>;
    deleteWarranty(id: bigint): Promise<void>;
    deleteWorkOrder(id: bigint): Promise<void>;
    exportAuditLogsCSVWithKey(devKey: string): Promise<string>;
    getAllCompaniesDashboardStatsWithKey(devKey: string): Promise<Array<[string, {
            maintenanceCount: bigint;
            workOrderCount: bigint;
            vehicleCount: bigint;
            partCount: bigint;
            userCount: bigint;
        }]>>;
    getAllCompanyApprovalsWithKey(devKey: string): Promise<Array<[string, string]>>;
    getAllCompanyRegistrations(): Promise<Array<CompanySettings>>;
    getAllCompanyRegistrationsWithKey(devKey: string): Promise<Array<CompanySettings>>;
    getAllCompanyTagsWithKey(devKey: string): Promise<Array<[string, Array<string>]>>;
    getAllDiscountCodesWithKey(devKey: string): Promise<Array<DiscountCode>>;
    getAllInspectionChecklists(): Promise<Array<InspectionChecklist>>;
    getAllLastLoginsWithKey(devKey: string): Promise<Array<[string, bigint]>>;
    getAllMaintenanceRecords(): Promise<Array<MaintenanceRecordFull>>;
    getAllNotifications(): Promise<Array<Notification>>;
    getAllParts(): Promise<Array<PartFull>>;
    getAllServiceSchedules(): Promise<Array<ServiceSchedule>>;
    getAllSubscriptions(): Promise<Array<SubscriptionRecord>>;
    getAllSubscriptionsWithKey(devKey: string): Promise<Array<SubscriptionWithVehicleCount>>;
    getAllVehicles(): Promise<Array<Vehicle>>;
    getAllVendors(): Promise<Array<Vendor>>;
    getAllWarranties(): Promise<Array<Warranty>>;
    getAllWorkOrders(): Promise<Array<WorkOrder>>;
    getAuditLogsByCompanyWithKey(devKey: string, companyId: string): Promise<Array<AuditLog>>;
    getAuditLogsWithKey(devKey: string): Promise<Array<AuditLog>>;
    getCallerCompanyId(): Promise<string | null>;
    getCallerFleetRole(): Promise<FleetRole | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCompanyApprovalStatus(companyName: string): Promise<string>;
    getCompanyApprovalStatusWithKey(devKey: string, companyName: string): Promise<string>;
    getCompanyDashboardStatsWithKey(devKey: string, companyId: string): Promise<{
        maintenanceCount: bigint;
        workOrderCount: bigint;
        vehicleCount: bigint;
        partCount: bigint;
        userCount: bigint;
        documentCount: bigint;
    }>;
    getCompanyNoteWithKey(devKey: string, companyId: string): Promise<string | null>;
    getCompanySettings(): Promise<CompanySettings | null>;
    getCompanyTagsWithKey(devKey: string, companyId: string): Promise<Array<string>>;
    getCompanyUsers(): Promise<Array<CompanyUserInfo>>;
    getCompanyUsersWithKey(devKey: string, companyId: string): Promise<Array<CompanyUserInfo>>;
    getDashboardStats(): Promise<DashboardStats>;
    getDefaultCurrency(): Promise<string>;
    getDevLastLoginWithKey(devKey: string): Promise<bigint | null>;
    getDiscountCodeRedemptionsWithKey(devKey: string, id: bigint): Promise<Array<DiscountCodeRedemption>>;
    getDiscountCodes(): Promise<Array<DiscountCode>>;
    getInspectionChecklist(id: bigint): Promise<InspectionChecklist>;
    getInspectionChecklistsByVehicle(vehicleId: bigint): Promise<Array<InspectionChecklist>>;
    getInviteTokens(): Promise<Array<InviteToken>>;
    getLastLoginTimestampWithKey(devKey: string, companyId: string): Promise<bigint | null>;
    getLowStockParts(): Promise<Array<PartFull>>;
    getMaintenanceRecord(id: bigint): Promise<MaintenanceRecordFull>;
    getMaintenanceRecordsByVehicle(vehicleId: bigint): Promise<Array<MaintenanceRecordFull>>;
    getOverdueMaintenance(): Promise<Array<MaintenanceRecordFull>>;
    getPart(id: bigint): Promise<PartFull>;
    getSubscriptionStatus(companyName: string): Promise<SubscriptionRecord | null>;
    getSystemStatsWithKey(devKey: string): Promise<{
        totalAuditLogs: bigint;
        totalVehicles: bigint;
        backendVersion: string;
        totalDiscountCodes: bigint;
        totalMaintenanceRecords: bigint;
        totalUsers: bigint;
        totalParts: bigint;
        totalCompanies: bigint;
        totalWorkOrders: bigint;
    }>;
    getTaxSettings(): Promise<TaxSettings | null>;
    getUnreadNotificationCount(): Promise<bigint>;
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
    markAllNotificationsRead(): Promise<void>;
    markNotificationRead(id: bigint): Promise<void>;
    markScheduleComplete(id: bigint): Promise<void>;
    pingWithKey(devKey: string): Promise<string>;
    recordDevLoginWithKey(devKey: string): Promise<void>;
    recordLastLogin(): Promise<void>;
    redeemInviteToken(token: string): Promise<FleetRole>;
    rejectCompany(companyName: string): Promise<void>;
    rejectCompanyWithKey(devKey: string, companyName: string): Promise<void>;
    removeUserFromCompanyWithKey(devKey: string, companyId: string, user: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveCompanySettings(settings: CompanySettings): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    saveDefaultCurrency(currency: string): Promise<void>;
    saveTaxSettings(settings: TaxSettings): Promise<void>;
    setCompanyNoteWithKey(devKey: string, companyId: string, note: string): Promise<void>;
    setCompanyTagsWithKey(devKey: string, companyId: string, tags: Array<string>): Promise<void>;
    setCompanyTierWithKey(devKey: string, companyId: string, tier: SubscriptionTier): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setMySubscriptionTier(tier: SubscriptionTier): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setUserFleetRole(user: Principal, role: FleetRole): Promise<void>;
    setUserFleetRoleWithKey(devKey: string, companyId: string, user: Principal, role: FleetRole): Promise<void>;
    startTrial(companyName: string): Promise<void>;
    startTrialWithKey(devKey: string, companyName: string, trialDays: bigint): Promise<void>;
    toggleDiscountCodeActiveWithKey(devKey: string, id: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateInspectionChecklist(id: bigint, checklist: InspectionChecklist): Promise<void>;
    updateMaintenanceRecord(id: bigint, record: MaintenanceRecordFull): Promise<void>;
    updatePart(id: bigint, part: PartFull): Promise<void>;
    updateServiceSchedule(id: bigint, schedule: ServiceSchedule): Promise<void>;
    updateSubscriptionStatus(companyName: string, status: string, startDate: Time | null): Promise<void>;
    updateSubscriptionStatusWithKey(devKey: string, companyName: string, status: string, startDate: Time | null): Promise<void>;
    updateVehicle(id: bigint, vehicle: Vehicle): Promise<void>;
    updateVendor(id: bigint, vendor: Vendor): Promise<void>;
    updateWarranty(id: bigint, warranty: Warranty): Promise<void>;
    updateWorkOrder(id: bigint, wo: WorkOrder): Promise<void>;
    validateBulkVehicleImport(rows: Array<VehicleImportRow>): Promise<Array<VehicleImportValidationResult>>;
    validateDiscountCode(code: string): Promise<DiscountCode | null>;
}
