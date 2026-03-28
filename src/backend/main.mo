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
import Migration "migration";

(with migration = Migration.run)
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

  // Internal function to set fleet role - only used during invite redemption
  func setFleetRoleInternal(user : Principal, role : FleetRole) {
    fleetRoles.add(user, role);
  };

  // Admin-only function to manually set a user's fleet role
  public shared ({ caller }) func setUserFleetRole(user : Principal, role : FleetRole) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set user fleet roles");
    };
    fleetRoles.add(user, role);
  };

  public query ({ caller }) func getCallerFleetRole() : async ?FleetRole {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their role");
    };
    fleetRoles.get(caller);
  };

  public query ({ caller }) func getUserFleetRole(user : Principal) : async ?FleetRole {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    fleetRoles.get(user);
  };

  // Invite Token System
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
    // Allow any authenticated principal (not anonymous) to redeem
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

    let updatedToken = {
      existing with
      usedBy = ?caller;
    };
    inviteTokens.add(token, updatedToken);

    // Assign the fleet role
    setFleetRoleInternal(caller, existing.role);
    
    // Also assign #user ACL permission so they can use the system
    AccessControl.assignRole(accessControlState, caller, caller, #user);
    
    existing.role;
  };

  public query ({ caller }) func getInviteTokens() : async [InviteToken] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin access required to view invite tokens");
    };
    inviteTokens.values().toArray();
  };

  // User Profile Management (existing)
  public type UserProfile = {
    name : Text;
  };

  var userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  module Vehicle {
    public type VehicleType = {
      #Truck;
      #Trailer;
      #Bus;
      #Van;
      #Other;
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

  // Internal stable type -- does NOT include partsUsed to preserve upgrade compatibility
  module MaintenanceRecord {
    public type MaintenanceType = {
      #OilChange;
      #TireRotation;
      #BrakeService;
      #EngineCheck;
      #Transmission;
      #Electrical;
      #Bodywork;
      #Inspection;
      #Other;
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

  // Public API type that includes partsUsed -- not stored in stable vars directly
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
    createdAt : Time.Time;
  };

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

  public type CompanySettings = {
    companyName : Text;
    industry : Text;
    fleetSize : Text;
    contactPhone : Text;
    logoUrl : Text;
    adminPrincipal : Text;
    createdAt : Time.Time;
  };

  // Store expanded company settings separately to preserve migration
  var companySettings : ?CompanySettings = null;
  var allCompanyRegistrations = List.empty<CompanySettings>();

  let vehicles = List.empty<Vehicle.Vehicle>();
  let maintenanceRecords = List.empty<MaintenanceRecord.MaintenanceRecord>();

  let vehicleStore = Map.empty<Nat, Vehicle.Vehicle>();
  let maintenanceStore = Map.empty<Nat, MaintenanceRecord.MaintenanceRecord>();
  let partStore = Map.empty<Nat, Part.Part>();

  // Separate stable store for parts used per maintenance record
  let maintenancePartsStore = Map.empty<Nat, [Nat]>();

  var nextVehicleId = 1;
  var nextMaintenanceId = 1;
  var nextPartId = 1;

  func getVehicleInternal(id : Nat) : Vehicle.Vehicle {
    switch (vehicleStore.get(id)) {
      case (null) { Runtime.trap("Vehicle not found") };
      case (?vehicle) { vehicle };
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

    let updatedVehicle : Vehicle.Vehicle = {
      vehicle with
      createdAt = Time.now();
    };

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

    // Deduct stock for each part used
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view dashboard stats");
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
  public shared ({ caller }) func createPart(part : Part.Part) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create parts");
    };
    let newPart : Part.Part = {
      part with
      id = nextPartId;
      createdAt = Time.now();
    };
    partStore.add(nextPartId, newPart);
    nextPartId += 1;
    newPart.id;
  };

  public shared ({ caller }) func updatePart(id : Nat, part : Part.Part) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update parts");
    };
    let existing = switch (partStore.get(id)) {
      case (null) { Runtime.trap("Part not found") };
      case (?p) { p };
    };
    let updated : Part.Part = { part with createdAt = existing.createdAt };
    partStore.add(id, updated);
  };

  public shared ({ caller }) func deletePart(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete parts");
    };
    switch (partStore.get(id)) {
      case (null) { Runtime.trap("Part not found") };
      case (?_) { partStore.remove(id) };
    };
  };

  public query ({ caller }) func getPart(id : Nat) : async Part.Part {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view parts");
    };
    switch (partStore.get(id)) {
      case (null) { Runtime.trap("Part not found") };
      case (?p) { p };
    };
  };

  public query ({ caller }) func getAllParts() : async [Part.Part] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view parts");
    };
    partStore.values().toArray().sort();
  };

  public query ({ caller }) func getLowStockParts() : async [Part.Part] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view parts");
    };
    partStore.values().toArray().filter(func(p) { p.quantityInStock <= p.minStockLevel }).sort();
  };

  // Company Settings
  public query ({ caller }) func getCompanySettings() : async ?CompanySettings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    companySettings;
  };

  // Allow any authenticated user to save company settings (admin check handled in UI)
  public shared ({ caller }) func saveCompanySettings(settings : CompanySettings) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be logged in to update company settings");
    };
    companySettings := ?settings;

    // Add to all company registrations if new company
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
};
