import Iter "mo:core/Iter";
import List "mo:core/List";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";


import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  include MixinStorage();

  // Constants
  let DEV_PRINCIPAL = Principal.fromText("2vxsx-fae");

  // Fleet Roles
  public type FleetRole = {
    #Admin;
    #FleetManager;
    #Mechanic;
  };

  var fleetRoles = Map.empty<Principal, FleetRole>();

  func setFleetRoleInternal(user : Principal, role : FleetRole) {
    fleetRoles.add(user, role);
  };

  public shared ({ caller }) func setUserFleetRole(user : Principal, role : FleetRole) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set user fleet roles");
    };
    fleetRoles.add(user, role);
  };

  public query ({ caller }) func getCallerFleetRole() : async ?FleetRole {
    if (caller.isAnonymous()) { return null };
    fleetRoles.get(caller);
  };

  public query ({ caller }) func getUserFleetRole(user : Principal) : async ?FleetRole {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    fleetRoles.get(user);
  };

  public type InviteToken = {
    token : Text;
    role : FleetRole;
    email : Text;
    createdAt : Time.Time;
    usedBy : ?Principal;
  };

  var inviteTokens = Map.empty<Text, InviteToken>();
  var nextInviteTokenId = 1;

  public shared ({ caller }) func createInviteToken(email : Text, role : FleetRole) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin access required to create invite tokens");
    };
    let token = "INV-" # nextInviteTokenId.toText();
    let invite : InviteToken = {
      token;
      role;
      email;
      createdAt = Time.now();
      usedBy = null;
    };
    inviteTokens.add(token, invite);
    nextInviteTokenId += 1;
    token;
  };

  public shared ({ caller }) func redeemInviteToken(token : Text) : async FleetRole {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Authentication required to redeem invite tokens");
    };
    let existing = switch (inviteTokens.get(token)) {
      case (null) { Runtime.trap("Token does not exist, please try again") };
      case (?invite) { invite };
    };
    switch (existing.usedBy) {
      case (?_) { Runtime.trap("Token already used by another principal") };
      case (null) {};
    };
    let updatedToken = { existing with usedBy = ?caller };
    inviteTokens.add(token, updatedToken);
    setFleetRoleInternal(caller, existing.role);
    // Register the caller as a user without requiring admin permission
    if (accessControlState.userRoles.get(caller) == null) {
      accessControlState.userRoles.add(caller, #user);
    };
    existing.role;
  };

  public query ({ caller }) func getInviteTokens() : async [InviteToken] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin access required to view invite tokens");
    };
    inviteTokens.values().toArray();
  };

  public type UserProfile = { name : Text };
  var userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) { return null };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Authentication required");
    };
    userProfiles.add(caller, profile);
  };

  module Vehicle {
    public type VehicleType = {
      #Truck; #Trailer; #Bus; #Van; #Other;
    };
    public type Status = { #Active; #Inactive };
    public type Vehicle = {
      id : Nat;
      name : Text;
      vehicleType : VehicleType;
      licensePlate : Text;
      year : Nat;
      make : Text;
      model : Text;
      status : Status;
      notes : Text;
      createdAt : Time.Time;
    };
    public func compare(v1 : Vehicle, v2 : Vehicle) : Order.Order {
      Nat.compare(v1.id, v2.id);
    };
  };

  module MaintenanceRecord {
    public type MaintenanceType = {
      #OilChange; #TireRotation; #BrakeService; #EngineCheck;
      #Transmission; #Electrical; #Bodywork; #Inspection; #Other;
    };
    public type MaintenanceRecord = {
      id : Nat;
      vehicleId : Nat;
      date : Time.Time;
      maintenanceType : MaintenanceType;
      description : Text;
      cost : Float;
      mileage : Nat;
      technicianName : Text;
      nextServiceDate : ?Time.Time;
      createdAt : Time.Time;
    };
    public func compare(m1 : MaintenanceRecord, m2 : MaintenanceRecord) : Order.Order {
      switch (m1.nextServiceDate, m2.nextServiceDate) {
        case (null, null) { #equal };
        case (?d1, ?d2) { Int.compare(d1, d2) };
        case (null, ?_) { #greater };
        case (?_, null) { #less };
      };
    };
  };

  public type MaintenanceRecordFull = {
    id : Nat;
    vehicleId : Nat;
    date : Time.Time;
    maintenanceType : MaintenanceRecord.MaintenanceType;
    description : Text;
    cost : Float;
    mileage : Nat;
    technicianName : Text;
    nextServiceDate : ?Time.Time;
    partsUsed : [Nat];
    workOrderId : ?Nat;
    createdAt : Time.Time;
  };

  // Internal Part type -- UNCHANGED from original to preserve stable variable compatibility
  module Part {
    public type Part = {
      id : Nat;
      name : Text;
      partNumber : Text;
      quantityInStock : Nat;
      minStockLevel : Nat;
      location : Text;
      createdAt : Time.Time;
    };
    public func compare(p1 : Part, p2 : Part) : Order.Order {
      Nat.compare(p1.id, p2.id);
    };
  };

  // Public API type that includes price -- not stored in partStore directly
  public type PartFull = {
    id : Nat;
    name : Text;
    partNumber : Text;
    quantityInStock : Nat;
    minStockLevel : Nat;
    location : Text;
    price : ?Float;
    createdAt : Time.Time;
  };

  public type CompanySettings = {
    companyName : Text;
    industry : Text;
    fleetSize : Text;
    contactPhone : Text;
    logoUrl : Text;
    adminPrincipal : Text;
    createdAt : Time.Time;
  };

  // Subscription record (stored separately to avoid stable var migration issues)
  public type SubscriptionRecord = {
    companyName : Text;
    status : Text;        // "inactive" | "active" | "cancelled"
    startDate : ?Time.Time;
    updatedAt : Time.Time;
  };

  var subscriptionRecords = Map.empty<Text, SubscriptionRecord>();
  var defaultCurrency : Text = "CAD";

  // WorkOrder types
  public type WorkOrderPriority = { #Low; #Medium; #High; #Critical };
  public type WorkOrderStatus = { #Open; #InProgress; #Completed; #Cancelled };

  public type WorkOrder = {
    id : Nat;
    title : Text;
    vehicleId : Nat;
    description : Text;
    assignedMechanic : Text;
    priority : WorkOrderPriority;
    status : WorkOrderStatus;
    scheduledDate : ?Time.Time;
    completedDate : ?Time.Time;
    notes : Text;
    createdAt : Time.Time;
  };

  // Vendor type
  public type Vendor = {
    id : Nat;
    name : Text;
    contactName : Text;
    phone : Text;
    email : Text;
    address : Text;
    notes : Text;
    category : Text;
    createdAt : Time.Time;
  };

  // Warranty type
  public type Warranty = {
    id : Nat;
    vehicleId : Nat;
    description : Text;
    provider : Text;
    startDate : Time.Time;
    expiryDate : Time.Time;
    coverageDetails : Text;
    cost : Float;
    notes : Text;
    createdAt : Time.Time;
  };

  var companySettings : ?CompanySettings = null;
  var allCompanyRegistrations = List.empty<CompanySettings>();

  let vehicles = List.empty<Vehicle.Vehicle>();
  let maintenanceRecords = List.empty<MaintenanceRecord.MaintenanceRecord>();

  let vehicleStore = Map.empty<Nat, Vehicle.Vehicle>();
  let maintenanceStore = Map.empty<Nat, MaintenanceRecord.MaintenanceRecord>();
  let partStore = Map.empty<Nat, Part.Part>();
  let partPriceStore = Map.empty<Nat, Float>();
  let maintenancePartsStore = Map.empty<Nat, [Nat]>();
  let workOrderLinkStore = Map.empty<Nat, Nat>(); // maintenanceId -> workOrderId

  let workOrderStore = Map.empty<Nat, WorkOrder>();
  let vendorStore = Map.empty<Nat, Vendor>();
  let warrantyStore = Map.empty<Nat, Warranty>();

  var nextVehicleId = 1;
  var nextMaintenanceId = 1;
  var nextPartId = 1;
  var nextWorkOrderId = 1;
  var nextVendorId = 1;
  var nextWarrantyId = 1;

  func getVehicleInternal(id : Nat) : Vehicle.Vehicle {
    switch (vehicleStore.get(id)) {
      case (null) { Runtime.trap("Vehicle not found") };
      case (?vehicle) { vehicle };
    };
  };

  func toFullPart(part : Part.Part) : PartFull {
    {
      id = part.id;
      name = part.name;
      partNumber = part.partNumber;
      quantityInStock = part.quantityInStock;
      minStockLevel = part.minStockLevel;
      location = part.location;
      price = partPriceStore.get(part.id);
      createdAt = part.createdAt;
    };
  };

  func toFull(record : MaintenanceRecord.MaintenanceRecord) : MaintenanceRecordFull {
    let parts = switch (maintenancePartsStore.get(record.id)) {
      case (null) { [] };
      case (?p) { p };
    };
    {
      id = record.id;
      vehicleId = record.vehicleId;
      date = record.date;
      maintenanceType = record.maintenanceType;
      description = record.description;
      cost = record.cost;
      mileage = record.mileage;
      technicianName = record.technicianName;
      nextServiceDate = record.nextServiceDate;
      partsUsed = parts;
      workOrderId = workOrderLinkStore.get(record.id);
      createdAt = record.createdAt;
    };
  };

  public shared ({ caller }) func createVehicle(vehicle : Vehicle.Vehicle) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create vehicles");
    };
    let newVehicle : Vehicle.Vehicle = {
      vehicle with
      id = nextVehicleId;
      createdAt = Time.now();
    };
    vehicleStore.add(nextVehicleId, newVehicle);
    vehicles.add(newVehicle);
    nextVehicleId += 1;
    newVehicle.id;
  };

  public shared ({ caller }) func bulkCreateVehicles(vehicleList : [Vehicle.Vehicle]) : async [Nat] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can bulk import vehicles");
    };
    let ids = List.empty<Nat>();
    for (vehicle in vehicleList.vals()) {
      let newVehicle : Vehicle.Vehicle = {
        vehicle with
        id = nextVehicleId;
        createdAt = Time.now();
      };
      vehicleStore.add(nextVehicleId, newVehicle);
      vehicles.add(newVehicle);
      ids.add(nextVehicleId);
      nextVehicleId += 1;
    };
    ids.toArray();
  };

  public shared ({ caller }) func updateVehicle(id : Nat, vehicle : Vehicle.Vehicle) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update vehicles");
    };
    ignore getVehicleInternal(id);
    let updatedVehicle : Vehicle.Vehicle = { vehicle with createdAt = Time.now() };
    vehicleStore.add(id, updatedVehicle);
  };

  public shared ({ caller }) func deleteVehicle(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete vehicles");
    };
    ignore getVehicleInternal(id);
    vehicleStore.remove(id);
  };

  public query ({ caller }) func getVehicle(id : Nat) : async Vehicle.Vehicle {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view vehicles");
    };
    getVehicleInternal(id);
  };

  public query ({ caller }) func getAllVehicles() : async [Vehicle.Vehicle] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view vehicles");
    };
    vehicleStore.values().toArray().sort();
  };

  public shared ({ caller }) func createMaintenanceRecord(record : MaintenanceRecordFull) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create maintenance records");
    };
    ignore getVehicleInternal(record.vehicleId);
    for (partId in record.partsUsed.vals()) {
      switch (partStore.get(partId)) {
        case (null) {};
        case (?part) {
          if (part.quantityInStock > 0) {
            let updated : Part.Part = { part with quantityInStock = part.quantityInStock - 1 };
            partStore.add(partId, updated);
          };
        };
      };
    };
    let newRecord : MaintenanceRecord.MaintenanceRecord = {
      id = nextMaintenanceId;
      vehicleId = record.vehicleId;
      date = record.date;
      maintenanceType = record.maintenanceType;
      description = record.description;
      cost = record.cost;
      mileage = record.mileage;
      technicianName = record.technicianName;
      nextServiceDate = record.nextServiceDate;
      createdAt = Time.now();
    };
    maintenanceStore.add(nextMaintenanceId, newRecord);
    maintenanceRecords.add(newRecord);
    if (record.partsUsed.size() > 0) {
      maintenancePartsStore.add(nextMaintenanceId, record.partsUsed);
    };
    nextMaintenanceId += 1;
    newRecord.id;
  };

  public shared ({ caller }) func updateMaintenanceRecord(id : Nat, record : MaintenanceRecordFull) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update maintenance records");
    };
    let existingRecord = switch (maintenanceStore.get(id)) {
      case (null) { Runtime.trap("Maintenance record not found") };
      case (?r) { r };
    };
    let updatedRecord : MaintenanceRecord.MaintenanceRecord = {
      id = id;
      vehicleId = record.vehicleId;
      date = record.date;
      maintenanceType = record.maintenanceType;
      description = record.description;
      cost = record.cost;
      mileage = record.mileage;
      technicianName = record.technicianName;
      nextServiceDate = record.nextServiceDate;
      createdAt = existingRecord.createdAt;
    };
    maintenanceStore.add(id, updatedRecord);
    maintenancePartsStore.add(id, record.partsUsed);
  };

  public query ({ caller }) func getMaintenanceRecord(id : Nat) : async MaintenanceRecordFull {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view maintenance records");
    };
    switch (maintenanceStore.get(id)) {
      case (null) { Runtime.trap("Maintenance record not found") };
      case (?record) { toFull(record) };
    };
  };

  public query ({ caller }) func getAllMaintenanceRecords() : async [MaintenanceRecordFull] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view maintenance records");
    };
    maintenanceStore.values().toArray().sort().map(toFull);
  };

  public query ({ caller }) func getMaintenanceRecordsByVehicle(vehicleId : Nat) : async [MaintenanceRecordFull] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view maintenance records");
    };
    maintenanceStore.values().toArray().filter(func(r) { r.vehicleId == vehicleId }).map(toFull);
  };

  public query ({ caller }) func getUpcomingMaintenance() : async [MaintenanceRecordFull] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view maintenance records");
    };
    let currentTime = Time.now();
    let thirtyDays = 30 * 24 * 60 * 60 * 1000000000;
    maintenanceStore.values().toArray().filter(
      func(record) {
        switch (record.nextServiceDate) {
          case (null) { false };
          case (?date) { date > currentTime and date <= (currentTime + thirtyDays) };
        };
      }
    ).sort().map(toFull);
  };

  public query ({ caller }) func getOverdueMaintenance() : async [MaintenanceRecordFull] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view maintenance records");
    };
    let currentTime = Time.now();
    maintenanceStore.values().toArray().filter(
      func(record) {
        switch (record.nextServiceDate) {
          case (null) { false };
          case (?date) { date < currentTime };
        };
      }
    ).sort().map(toFull);
  };

  public type DashboardStats = {
    totalVehicles : Nat;
    activeVehicles : Nat;
    upcomingMaintenanceCount : Nat;
    overdueCount : Nat;
    lowStockPartsCount : Nat;
  };

  public query ({ caller }) func getDashboardStats() : async DashboardStats {
    if (caller.isAnonymous()) {
      return { totalVehicles = 0; activeVehicles = 0; upcomingMaintenanceCount = 0; overdueCount = 0; lowStockPartsCount = 0 };
    };
    let currentTime = Time.now();
    let thirtyDays = 30 * 24 * 60 * 60 * 1000000000;
    let allVehicles = vehicleStore.values().toArray();
    let totalVehicles = allVehicles.size();
    let activeVehicles = allVehicles.filter(func(v) { v.status == #Active }).size();
    let allRecords = maintenanceStore.values().toArray();
    let upcomingMaintenanceCount = allRecords.filter(
      func(record) {
        switch (record.nextServiceDate) {
          case (null) { false };
          case (?date) { date > currentTime and date <= (currentTime + thirtyDays) };
        };
      }
    ).size();
    let overdueCount = allRecords.filter(
      func(record) {
        switch (record.nextServiceDate) {
          case (null) { false };
          case (?date) { date < currentTime };
        };
      }
    ).size();
    let allParts = partStore.values().toArray();
    let lowStockPartsCount = allParts.filter(func(p) { p.quantityInStock <= p.minStockLevel }).size();
    {
      totalVehicles = totalVehicles;
      activeVehicles = activeVehicles;
      upcomingMaintenanceCount = upcomingMaintenanceCount;
      overdueCount = overdueCount;
      lowStockPartsCount = lowStockPartsCount;
    };
  };

  // Parts Inventory
  public shared ({ caller }) func createPart(part : PartFull) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create parts");
    };
    let newPart : Part.Part = {
      id = nextPartId;
      name = part.name;
      partNumber = part.partNumber;
      quantityInStock = part.quantityInStock;
      minStockLevel = part.minStockLevel;
      location = part.location;
      createdAt = Time.now();
    };
    partStore.add(nextPartId, newPart);
    switch (part.price) {
      case (?p) { partPriceStore.add(nextPartId, p) };
      case (null) {};
    };
    nextPartId += 1;
    newPart.id;
  };

  public shared ({ caller }) func updatePart(id : Nat, part : PartFull) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update parts");
    };
    let existing = switch (partStore.get(id)) {
      case (null) { Runtime.trap("Part not found") };
      case (?p) { p };
    };
    let updated : Part.Part = {
      id = id;
      name = part.name;
      partNumber = part.partNumber;
      quantityInStock = part.quantityInStock;
      minStockLevel = part.minStockLevel;
      location = part.location;
      createdAt = existing.createdAt;
    };
    partStore.add(id, updated);
    switch (part.price) {
      case (?p) { partPriceStore.add(id, p) };
      case (null) { partPriceStore.remove(id) };
    };
  };

  public shared ({ caller }) func deletePart(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete parts");
    };
    switch (partStore.get(id)) {
      case (null) { Runtime.trap("Part not found") };
      case (?_) {
        partStore.remove(id);
        partPriceStore.remove(id);
      };
    };
  };

  public query ({ caller }) func getPart(id : Nat) : async PartFull {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view parts");
    };
    switch (partStore.get(id)) {
      case (null) { Runtime.trap("Part not found") };
      case (?p) { toFullPart(p) };
    };
  };

  public query ({ caller }) func getAllParts() : async [PartFull] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view parts");
    };
    partStore.values().toArray().sort().map(toFullPart);
  };

  public query ({ caller }) func getLowStockParts() : async [PartFull] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view parts");
    };
    partStore.values().toArray().filter(func(p) { p.quantityInStock <= p.minStockLevel }).sort().map(toFullPart);
  };

  // Work Orders
  public shared ({ caller }) func createWorkOrder(wo : WorkOrder) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create work orders");
    };
    let newWO : WorkOrder = {
      wo with
      id = nextWorkOrderId;
      status = #Open;
      completedDate = null;
      createdAt = Time.now();
    };
    workOrderStore.add(nextWorkOrderId, newWO);
    nextWorkOrderId += 1;
    newWO.id;
  };

  public shared ({ caller }) func updateWorkOrder(id : Nat, wo : WorkOrder) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update work orders");
    };
    let existing = switch (workOrderStore.get(id)) {
      case (null) { Runtime.trap("Work order not found") };
      case (?w) { w };
    };
    let updated : WorkOrder = { wo with id = id; createdAt = existing.createdAt };
    workOrderStore.add(id, updated);
  };

  public shared ({ caller }) func deleteWorkOrder(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete work orders");
    };
    switch (workOrderStore.get(id)) {
      case (null) { Runtime.trap("Work order not found") };
      case (?_) { workOrderStore.remove(id) };
    };
  };

  public query ({ caller }) func getWorkOrder(id : Nat) : async WorkOrder {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view work orders");
    };
    switch (workOrderStore.get(id)) {
      case (null) { Runtime.trap("Work order not found") };
      case (?w) { w };
    };
  };

  public query ({ caller }) func getAllWorkOrders() : async [WorkOrder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view work orders");
    };
    workOrderStore.values().toArray();
  };

  public query ({ caller }) func getWorkOrdersByVehicle(vehicleId : Nat) : async [WorkOrder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view work orders");
    };
    workOrderStore.values().toArray().filter(func(w) { w.vehicleId == vehicleId });
  };

  // Complete a work order and auto-log a maintenance record
  public shared ({ caller }) func completeWorkOrder(id : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete work orders");
    };
    let wo = switch (workOrderStore.get(id)) {
      case (null) { Runtime.trap("Work order not found") };
      case (?w) { w };
    };
    let now = Time.now();
    let completed : WorkOrder = { wo with status = #Completed; completedDate = ?now };
    workOrderStore.add(id, completed);
    // Auto-create maintenance record
    let newRecord : MaintenanceRecord.MaintenanceRecord = {
      id = nextMaintenanceId;
      vehicleId = wo.vehicleId;
      date = now;
      maintenanceType = #Other;
      description = wo.title # ": " # wo.description;
      cost = 0.0;
      mileage = 0;
      technicianName = wo.assignedMechanic;
      nextServiceDate = null;
      createdAt = now;
    };
    maintenanceStore.add(nextMaintenanceId, newRecord);
    maintenanceRecords.add(newRecord);
    workOrderLinkStore.add(nextMaintenanceId, id);
    nextMaintenanceId += 1;
    newRecord.id;
  };

  // Vendors
  public shared ({ caller }) func createVendor(vendor : Vendor) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create vendors");
    };
    let newVendor : Vendor = { vendor with id = nextVendorId; createdAt = Time.now() };
    vendorStore.add(nextVendorId, newVendor);
    nextVendorId += 1;
    newVendor.id;
  };

  public shared ({ caller }) func updateVendor(id : Nat, vendor : Vendor) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update vendors");
    };
    let existing = switch (vendorStore.get(id)) {
      case (null) { Runtime.trap("Vendor not found") };
      case (?v) { v };
    };
    vendorStore.add(id, { vendor with id = id; createdAt = existing.createdAt });
  };

  public shared ({ caller }) func deleteVendor(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete vendors");
    };
    switch (vendorStore.get(id)) {
      case (null) { Runtime.trap("Vendor not found") };
      case (?_) { vendorStore.remove(id) };
    };
  };

  public query ({ caller }) func getVendor(id : Nat) : async Vendor {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view vendors");
    };
    switch (vendorStore.get(id)) {
      case (null) { Runtime.trap("Vendor not found") };
      case (?v) { v };
    };
  };

  public query ({ caller }) func getAllVendors() : async [Vendor] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view vendors");
    };
    vendorStore.values().toArray();
  };

  // Warranties
  public shared ({ caller }) func createWarranty(warranty : Warranty) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create warranties");
    };
    let newWarranty : Warranty = { warranty with id = nextWarrantyId; createdAt = Time.now() };
    warrantyStore.add(nextWarrantyId, newWarranty);
    nextWarrantyId += 1;
    newWarranty.id;
  };

  public shared ({ caller }) func updateWarranty(id : Nat, warranty : Warranty) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update warranties");
    };
    let existing = switch (warrantyStore.get(id)) {
      case (null) { Runtime.trap("Warranty not found") };
      case (?w) { w };
    };
    warrantyStore.add(id, { warranty with id = id; createdAt = existing.createdAt });
  };

  public shared ({ caller }) func deleteWarranty(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete warranties");
    };
    switch (warrantyStore.get(id)) {
      case (null) { Runtime.trap("Warranty not found") };
      case (?_) { warrantyStore.remove(id) };
    };
  };

  public query ({ caller }) func getWarranty(id : Nat) : async Warranty {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view warranties");
    };
    switch (warrantyStore.get(id)) {
      case (null) { Runtime.trap("Warranty not found") };
      case (?w) { w };
    };
  };

  public query ({ caller }) func getAllWarranties() : async [Warranty] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view warranties");
    };
    warrantyStore.values().toArray();
  };

  public query ({ caller }) func getWarrantiesByVehicle(vehicleId : Nat) : async [Warranty] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view warranties");
    };
    warrantyStore.values().toArray().filter(func(w) { w.vehicleId == vehicleId });
  };

  // Company Settings
  public query ({ caller }) func getCompanySettings() : async ?CompanySettings {
    if (caller.isAnonymous()) { return null };
    companySettings;
  };

  public shared ({ caller }) func saveCompanySettings(settings : CompanySettings) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Authentication required");
    };
    // Auto-register caller as a user if not yet registered (supports initial onboarding)
    if (accessControlState.userRoles.get(caller) == null) {
      accessControlState.userRoles.add(caller, #user);
    };
    companySettings := ?settings;
    switch (allCompanyRegistrations.filter(func(s) { s.companyName == settings.companyName }).isEmpty()) {
      case (true) { allCompanyRegistrations.add(settings) };
      case (false) {};
    };
  };

  public query ({ caller }) func getAllCompanyRegistrations() : async [CompanySettings] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin)) and caller != DEV_PRINCIPAL) {
      Runtime.trap("Unauthorized: Only admins and developers can view all company registrations");
    };
    allCompanyRegistrations.toArray();
  };

  public shared ({ caller }) func updateSubscriptionStatus(companyName : Text, status : Text, startDate : ?Time.Time) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin)) and caller != DEV_PRINCIPAL) {
      Runtime.trap("Unauthorized: Only admins and developers can update subscription status");
    };
    let rec : SubscriptionRecord = {
      companyName;
      status;
      startDate;
      updatedAt = Time.now();
    };
    subscriptionRecords.add(companyName, rec);
  };

  public query ({ caller }) func getSubscriptionStatus(companyName : Text) : async ?SubscriptionRecord {
    if (caller.isAnonymous()) { return null };
    subscriptionRecords.get(companyName);
  };

  public query ({ caller }) func getAllSubscriptions() : async [SubscriptionRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin)) and caller != DEV_PRINCIPAL) {
      Runtime.trap("Unauthorized: Only admins and developers can view all subscriptions");
    };
    subscriptionRecords.values().toArray();
  };

  public query ({ caller }) func getDefaultCurrency() : async Text {
    if (caller.isAnonymous()) { return "CAD" };
    defaultCurrency;
  };

  public shared ({ caller }) func saveDefaultCurrency(currency : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save default currency");
    };
    defaultCurrency := currency;
  };

  // ServiceSchedule
  public type ServiceSchedule = {
    id : Nat;
    vehicleId : Nat;
    serviceType : Text;
    intervalDays : Nat;
    nextDueDate : Time.Time;
    lastCompletedDate : ?Time.Time;
    notes : Text;
    status : Text;
    createdAt : Time.Time;
  };

  var serviceSchedules = Map.empty<Nat, ServiceSchedule>();
  var nextServiceScheduleId : Nat = 1;

  public shared ({ caller }) func createServiceSchedule(schedule : ServiceSchedule) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Authentication required");
    };
    let id = nextServiceScheduleId;
    nextServiceScheduleId += 1;
    let s : ServiceSchedule = {
      id;
      vehicleId = schedule.vehicleId;
      serviceType = schedule.serviceType;
      intervalDays = schedule.intervalDays;
      nextDueDate = schedule.nextDueDate;
      lastCompletedDate = schedule.lastCompletedDate;
      notes = schedule.notes;
      status = schedule.status;
      createdAt = Time.now();
    };
    serviceSchedules.add(id, s);
    id
  };

  public query ({ caller }) func getAllServiceSchedules() : async [ServiceSchedule] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Authentication required");
    };
    serviceSchedules.values().toArray();
  };

  public shared ({ caller }) func updateServiceSchedule(id : Nat, schedule : ServiceSchedule) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Authentication required");
    };
    switch (serviceSchedules.get(id)) {
      case null { Runtime.trap("Service schedule not found") };
      case (?existing) {
        let updated : ServiceSchedule = {
          id;
          vehicleId = schedule.vehicleId;
          serviceType = schedule.serviceType;
          intervalDays = schedule.intervalDays;
          nextDueDate = schedule.nextDueDate;
          lastCompletedDate = schedule.lastCompletedDate;
          notes = schedule.notes;
          status = schedule.status;
          createdAt = existing.createdAt;
        };
        serviceSchedules.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteServiceSchedule(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Authentication required");
    };
    serviceSchedules.remove(id);
  };

  public shared ({ caller }) func markScheduleComplete(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Authentication required");
    };
    switch (serviceSchedules.get(id)) {
      case null { Runtime.trap("Service schedule not found") };
      case (?existing) {
        let intervalNanos : Int = existing.intervalDays * 24 * 60 * 60 * 1_000_000_000;
        let newNextDue : Time.Time = existing.nextDueDate + intervalNanos;
        let updated : ServiceSchedule = {
          id;
          vehicleId = existing.vehicleId;
          serviceType = existing.serviceType;
          intervalDays = existing.intervalDays;
          nextDueDate = newNextDue;
          lastCompletedDate = ?Time.now();
          notes = existing.notes;
          status = existing.status;
          createdAt = existing.createdAt;
        };
        serviceSchedules.add(id, updated);
      };
    };
  };

  // Struct for Chat messages
  public type ChatMessage = {
    id : Nat;
    senderPrincipal : Text;
    senderName : Text;
    message : Text;
    createdAt : Time.Time;
  };

  var nextChatId = 1;
  var chatMessages = List.empty<ChatMessage>();

  public shared ({ caller }) func sendChatMessage(senderName : Text, message : Text) : async Nat {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Authentication required");
    };
    let chatMessage : ChatMessage = {
      id = nextChatId;
      senderPrincipal = caller.toText();
      senderName;
      message;
      createdAt = Time.now();
    };
    chatMessages.add(chatMessage);
    nextChatId += 1;
    chatMessage.id;
  };

  public query ({ caller }) func getChatMessages() : async [ChatMessage] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Authentication required");
    };
    chatMessages.toArray().sort(func(a : ChatMessage, b : ChatMessage) : Order.Order {
      Int.compare(a.createdAt, b.createdAt)
    });
  };
};
