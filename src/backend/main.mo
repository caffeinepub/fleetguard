import List "mo:core/List";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Map "mo:core/Map";
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

  let DEV_KEY : Text = "FLEETGUARD_DEV_2026";
  let DEV_PRINCIPAL = Principal.fromText("2vxsx-fae");

  // ─── Public Types ───────────────────────────────────────────────────────────
  public type FleetRole = { #Admin; #FleetManager; #Mechanic };
  public type VehicleType = { #Truck; #Trailer; #Bus; #Van; #Other };
  public type VehicleStatus = { #Active; #Inactive };
  public type Vehicle = {
    id : Nat; name : Text; vehicleType : VehicleType; licensePlate : Text;
    year : Nat; make : Text; model : Text; status : VehicleStatus;
    notes : Text; createdAt : Time.Time;
  };
  public type MaintenanceType = {
    #OilChange; #TireRotation; #BrakeService; #EngineCheck;
    #Transmission; #Electrical; #Bodywork; #Inspection; #Other;
  };
  public type PartQuantity = { partId : Nat; quantity : Nat };
  public type MaintenanceRecordFull = {
    id : Nat; vehicleId : Nat; date : Time.Time; maintenanceType : MaintenanceType;
    description : Text; cost : Float; mileage : Nat; technicianName : Text;
    nextServiceDate : ?Time.Time; partsUsed : [Nat]; partQuantities : [PartQuantity];
    laborHours : ?Float; laborCost : ?Float; workOrderId : ?Nat; createdAt : Time.Time;
  };
  // Internal part type without price/category
  type PartCore = {
    id : Nat; name : Text; partNumber : Text; quantityInStock : Nat;
    minStockLevel : Nat; location : Text; createdAt : Time.Time;
  };
  public type PartFull = {
    id : Nat; name : Text; partNumber : Text; quantityInStock : Nat;
    minStockLevel : Nat; location : Text; price : ?Float; createdAt : Time.Time; category : ?Text;
  };
  public type WorkOrderPriority = { #Low; #Medium; #High; #Critical };
  public type WorkOrderStatus = { #Open; #InProgress; #Completed; #Cancelled };
  public type WorkOrder = {
    id : Nat; title : Text; vehicleId : Nat; description : Text;
    assignedMechanic : Text; priority : WorkOrderPriority; status : WorkOrderStatus;
    scheduledDate : ?Time.Time; completedDate : ?Time.Time; notes : Text; createdAt : Time.Time;
  };
  public type Vendor = {
    id : Nat; name : Text; contactName : Text; phone : Text; email : Text;
    address : Text; notes : Text; category : Text; createdAt : Time.Time;
  };
  public type Warranty = {
    id : Nat; vehicleId : Nat; description : Text; provider : Text;
    startDate : Time.Time; expiryDate : Time.Time; coverageDetails : Text;
    cost : Float; notes : Text; createdAt : Time.Time;
  };
  public type ServiceSchedule = {
    id : Nat; vehicleId : Nat; serviceType : Text; intervalDays : Nat;
    nextDueDate : Time.Time; lastCompletedDate : ?Time.Time;
    notes : Text; status : Text; createdAt : Time.Time;
  };
  public type CompanySettings = {
    companyName : Text; industry : Text; fleetSize : Text;
    contactPhone : Text; logoUrl : Text; adminPrincipal : Text; createdAt : Time.Time;
  };
  public type SubscriptionRecord = {
    companyName : Text; status : Text; startDate : ?Time.Time;
    trialEndsAt : ?Time.Time; plan : Text; updatedAt : Time.Time;
  };
  public type DiscountCode = {
    id : Nat; code : Text; discountType : Text; value : Nat;
    description : Text; createdAt : Time.Time; usedCount : Nat;
  };
  public type DashboardStats = {
    totalVehicles : Nat; activeVehicles : Nat; upcomingMaintenanceCount : Nat;
    overdueCount : Nat; lowStockPartsCount : Nat;
  };
  public type TaxSettings = { taxLabel : Text; taxRate : Float; taxEnabled : Bool };
  public type UserProfile = { name : Text };
  public type InviteToken = {
    token : Text; role : FleetRole; email : Text;
    companyId : Text;  // NEW: the company the admin belongs to
    createdAt : Time.Time; usedBy : ?Principal;
  };
  public type CompanyUserInfo = {
    principal : Principal;
    profile : ?UserProfile;
    role : FleetRole;
  };
  // Internal maintenance type (no extra fields)
  type MaintCore = {
    id : Nat; vehicleId : Nat; date : Time.Time; maintenanceType : MaintenanceType;
    description : Text; cost : Float; mileage : Nat; technicianName : Text;
    nextServiceDate : ?Time.Time; createdAt : Time.Time;
  };
  // Old chat type kept for migration compatibility
  type ChatMessage = {
    id : Nat; senderPrincipal : Text; senderName : Text; message : Text; createdAt : Time.Time;
  };

  // ─── LEGACY STABLE VARIABLES (kept for upgrade compatibility, migrated in postupgrade) ───
  // These match the exact variable names from the previous version of this actor.
  // They are populated once on upgrade from the old single-tenant data, then cleared.
  var vehicleStore = Map.empty<Nat, Vehicle>();
  var vehicles = List.empty<Vehicle>();
  var maintenanceStore = Map.empty<Nat, MaintCore>();
  var maintenanceRecords = List.empty<MaintCore>();
  var maintenancePartsStore = Map.empty<Nat, [Nat]>();
  var maintenancePartQuantitiesStore = Map.empty<Nat, [PartQuantity]>();
  var maintenanceLaborHoursStore = Map.empty<Nat, Float>();
  var maintenanceLaborCostStore = Map.empty<Nat, Float>();
  var workOrderLinkStore = Map.empty<Nat, Nat>();
  var partStore = Map.empty<Nat, PartCore>();
  var partPriceStore = Map.empty<Nat, Float>();
  var workOrderStore = Map.empty<Nat, WorkOrder>();
  var vendorStore = Map.empty<Nat, Vendor>();
  var warrantyStore = Map.empty<Nat, Warranty>();
  var serviceSchedules = Map.empty<Nat, ServiceSchedule>();
  var fleetRoles = Map.empty<Principal, FleetRole>();
  var companySettings : ?CompanySettings = null;
  var defaultCurrency : Text = "CAD";
  var discountCodeMap = Map.empty<Text, Nat>();
  var nextVehicleId = 1;
  var nextMaintenanceId = 1;
  var nextPartId = 1;
  var nextWorkOrderId = 1;
  var nextVendorId = 1;
  var nextWarrantyId = 1;
  var nextServiceScheduleId : Nat = 1;
  var nextChatId = 1;
  var chatMessages = List.empty<ChatMessage>();

  // ─── Multi-tenant: principal → companyId ────────────────────────────────────
  var userCompanyMap = Map.empty<Principal, Text>();

  func requireCompanyId(caller : Principal) : Text {
    switch (userCompanyMap.get(caller)) {
      case (?cid) { cid };
      case (null) { Runtime.trap("Company not registered. Please complete onboarding.") };
    };
  };

  public query ({ caller }) func getCallerCompanyId() : async ?Text {
    if (caller.isAnonymous()) { return null };
    userCompanyMap.get(caller);
  };

  // ─── Per-company stores (NEW multi-tenant stores) ────────────────────────────────
  var cVehicles   = Map.empty<Text, Map.Map<Nat, Vehicle>>();
  var cVehCounters = Map.empty<Text, Nat>();
  var cParts      = Map.empty<Text, Map.Map<Nat, PartCore>>();
  var cPrices     = Map.empty<Text, Map.Map<Nat, Float>>();
  var cCategories = Map.empty<Text, Map.Map<Nat, Text>>();
  var cPartCounters = Map.empty<Text, Nat>();
  var cMaint      = Map.empty<Text, Map.Map<Nat, MaintCore>>();
  var cMParts     = Map.empty<Text, Map.Map<Nat, [Nat]>>();
  var cMPartQty   = Map.empty<Text, Map.Map<Nat, [PartQuantity]>>();
  var cMLaborH    = Map.empty<Text, Map.Map<Nat, Float>>();
  var cMLaborC    = Map.empty<Text, Map.Map<Nat, Float>>();
  var cWOLinks    = Map.empty<Text, Map.Map<Nat, Nat>>();
  var cMaintCounters = Map.empty<Text, Nat>();
  var cWO         = Map.empty<Text, Map.Map<Nat, WorkOrder>>();
  var cWOCounters  = Map.empty<Text, Nat>();
  var cVendors    = Map.empty<Text, Map.Map<Nat, Vendor>>();
  var cVendorCounters = Map.empty<Text, Nat>();
  var cWarranties = Map.empty<Text, Map.Map<Nat, Warranty>>();
  var cWarrantyCounters = Map.empty<Text, Nat>();
  var cSchedules  = Map.empty<Text, Map.Map<Nat, ServiceSchedule>>();
  var cScheduleCounters = Map.empty<Text, Nat>();
  var cFleetRoles = Map.empty<Text, Map.Map<Principal, FleetRole>>();
  var cSettings   = Map.empty<Text, CompanySettings>();
  var cCurrency   = Map.empty<Text, Text>();
  var cTax        = Map.empty<Text, TaxSettings>();

  // ─── Global stores ────────────────────────────────────────────────────────────
  var allCompanyRegistrations = List.empty<CompanySettings>();
  var companyApprovalStore = Map.empty<Text, Text>();
  var subscriptionRecords = Map.empty<Text, SubscriptionRecord>();
  var discountCodes = Map.empty<Nat, DiscountCode>();
  var nextDiscountCodeId = 1;
  // (discountCodeMap is the legacy var reused as the global code->id lookup)

  var userProfiles = Map.empty<Principal, UserProfile>();
  var inviteTokens = Map.empty<Text, InviteToken>();
  var nextInviteTokenId = 1;

  // ─── Store accessor helpers ──────────────────────────────────────────────────────
  func getOrCreate<V>(outer : Map.Map<Text, Map.Map<Nat, V>>, cid : Text) : Map.Map<Nat, V> {
    switch (outer.get(cid)) {
      case (?m) { m };
      case (null) { let m = Map.empty<Nat, V>(); outer.add(cid, m); m };
    };
  };
  func getOrCreateP<V>(outer : Map.Map<Text, Map.Map<Principal, V>>, cid : Text) : Map.Map<Principal, V> {
    switch (outer.get(cid)) {
      case (?m) { m };
      case (null) { let m = Map.empty<Principal, V>(); outer.add(cid, m); m };
    };
  };
  func nextId(counters : Map.Map<Text, Nat>, cid : Text) : Nat {
    let n = switch (counters.get(cid)) { case (?n) n; case null 1 };
    counters.add(cid, n + 1); n;
  };

  func toFullPart(cid : Text, p : PartCore) : PartFull {
    { id = p.id; name = p.name; partNumber = p.partNumber;
      quantityInStock = p.quantityInStock; minStockLevel = p.minStockLevel;
      location = p.location; createdAt = p.createdAt;
      price = getOrCreate(cPrices, cid).get(p.id);
      category = getOrCreate(cCategories, cid).get(p.id) };
  };

  func toFullMaint(cid : Text, r : MaintCore) : MaintenanceRecordFull {
    let parts = switch (cMParts.get(cid)) {
      case (?m) { switch (m.get(r.id)) { case (?p) p; case null [] } }; case null [];
    };
    let qtys = switch (cMPartQty.get(cid)) {
      case (?m) { switch (m.get(r.id)) { case (?q) q; case null [] } }; case null [];
    };
    let lh = switch (cMLaborH.get(cid)) { case (?m) { m.get(r.id) }; case null null };
    let lc = switch (cMLaborC.get(cid)) { case (?m) { m.get(r.id) }; case null null };
    let wol = switch (cWOLinks.get(cid)) { case (?m) { m.get(r.id) }; case null null };
    { id = r.id; vehicleId = r.vehicleId; date = r.date;
      maintenanceType = r.maintenanceType; description = r.description;
      cost = r.cost; mileage = r.mileage; technicianName = r.technicianName;
      nextServiceDate = r.nextServiceDate; partsUsed = parts;
      partQuantities = qtys; laborHours = lh; laborCost = lc;
      workOrderId = wol; createdAt = r.createdAt };
  };

  // ─── Migration: postupgrade moves legacy single-tenant data into per-company stores ───
  system func postupgrade() {
    // Determine the legacy company ID from old companySettings
    let cidOpt : ?Text = switch (companySettings) {
      case (null) {
        // Try allCompanyRegistrations as fallback
        if (allCompanyRegistrations.isEmpty()) { null }
        else { ?allCompanyRegistrations.toArray()[0].companyName };
      };
      case (?s) { ?s.companyName };
    };

    switch (cidOpt) {
      case (null) {}; // No legacy data to migrate
      case (?cid) {
        // Migrate company settings
        switch (companySettings) {
          case (?s) {
            cSettings.add(cid, s);
            // Register admin principal
            let adminP = Principal.fromText(s.adminPrincipal);
            if (not adminP.isAnonymous()) {
              userCompanyMap.add(adminP, cid);
              if (accessControlState.userRoles.get(adminP) == null) {
                accessControlState.userRoles.add(adminP, #admin);
              };
              getOrCreateP(cFleetRoles, cid).add(adminP, #Admin);
            };
          };
          case (null) {};
        };

        // Register all users from legacy fleetRoles into this company
        for ((p, role) in fleetRoles.entries()) {
          if (userCompanyMap.get(p) == null) {
            userCompanyMap.add(p, cid);
            if (accessControlState.userRoles.get(p) == null) {
              accessControlState.userRoles.add(p, #user);
            };
          };
          getOrCreateP(cFleetRoles, cid).add(p, role);
        };

        // Migrate default currency
        cCurrency.add(cid, defaultCurrency);

        // Migrate vehicles
        let vm = getOrCreate(cVehicles, cid);
        for ((id, v) in vehicleStore.entries()) { vm.add(id, v) };
        cVehCounters.add(cid, nextVehicleId);

        // Migrate parts
        let pm = getOrCreate(cParts, cid);
        let ppm = getOrCreate(cPrices, cid);
        for ((id, p) in partStore.entries()) { pm.add(id, p) };
        for ((id, price) in partPriceStore.entries()) { ppm.add(id, price) };
        cPartCounters.add(cid, nextPartId);

        // Migrate maintenance records
        let mm = getOrCreate(cMaint, cid);
        for ((id, r) in maintenanceStore.entries()) { mm.add(id, r) };
        let mpm = getOrCreate(cMParts, cid);
        for ((id, arr) in maintenancePartsStore.entries()) { mpm.add(id, arr) };
        let mpqm = getOrCreate(cMPartQty, cid);
        for ((id, arr) in maintenancePartQuantitiesStore.entries()) { mpqm.add(id, arr) };
        let mlhm = getOrCreate(cMLaborH, cid);
        for ((id, h) in maintenanceLaborHoursStore.entries()) { mlhm.add(id, h) };
        let mlcm = getOrCreate(cMLaborC, cid);
        for ((id, c) in maintenanceLaborCostStore.entries()) { mlcm.add(id, c) };
        let wolm = getOrCreate(cWOLinks, cid);
        for ((id, woid) in workOrderLinkStore.entries()) { wolm.add(id, woid) };
        cMaintCounters.add(cid, nextMaintenanceId);

        // Migrate work orders
        let wom = getOrCreate(cWO, cid);
        for ((id, wo) in workOrderStore.entries()) { wom.add(id, wo) };
        cWOCounters.add(cid, nextWorkOrderId);

        // Migrate vendors
        let vnm = getOrCreate(cVendors, cid);
        for ((id, v) in vendorStore.entries()) { vnm.add(id, v) };
        cVendorCounters.add(cid, nextVendorId);

        // Migrate warranties
        let wrm = getOrCreate(cWarranties, cid);
        for ((id, w) in warrantyStore.entries()) { wrm.add(id, w) };
        cWarrantyCounters.add(cid, nextWarrantyId);

        // Migrate service schedules
        let ssm = getOrCreate(cSchedules, cid);
        for ((id, s) in serviceSchedules.entries()) { ssm.add(id, s) };
        cScheduleCounters.add(cid, nextServiceScheduleId);

        // Migrate company registrations
        if (allCompanyRegistrations.isEmpty()) {
          switch (companySettings) {
            case (?s) { allCompanyRegistrations.add(s) };
            case (null) {};
          };
        };

        // Clear legacy stores to free stable memory
        vehicleStore := Map.empty<Nat, Vehicle>();
        vehicles := List.empty<Vehicle>();
        maintenanceStore := Map.empty<Nat, MaintCore>();
        maintenanceRecords := List.empty<MaintCore>();
        maintenancePartsStore := Map.empty<Nat, [Nat]>();
        maintenancePartQuantitiesStore := Map.empty<Nat, [PartQuantity]>();
        maintenanceLaborHoursStore := Map.empty<Nat, Float>();
        maintenanceLaborCostStore := Map.empty<Nat, Float>();
        workOrderLinkStore := Map.empty<Nat, Nat>();
        partStore := Map.empty<Nat, PartCore>();
        partPriceStore := Map.empty<Nat, Float>();
        workOrderStore := Map.empty<Nat, WorkOrder>();
        vendorStore := Map.empty<Nat, Vendor>();
        warrantyStore := Map.empty<Nat, Warranty>();
        serviceSchedules := Map.empty<Nat, ServiceSchedule>();
        fleetRoles := Map.empty<Principal, FleetRole>();
        chatMessages := List.empty<ChatMessage>();
        companySettings := null;
      };
    };
  };

  // ─── Fleet Roles (per company) ──────────────────────────────────────────────
  public shared ({ caller }) func setUserFleetRole(user : Principal, role : FleetRole) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set fleet roles");
    };
    let cid = requireCompanyId(caller);
    let roleMap = getOrCreateP(cFleetRoles, cid);
    // Verify caller is Admin in their company
    switch (roleMap.get(caller)) {
      case (?#Admin) {};
      case (_) { Runtime.trap("Unauthorized: Only company admins can set user fleet roles") };
    };
    roleMap.add(user, role);
  };

  public query ({ caller }) func getCallerFleetRole() : async ?FleetRole {
    if (caller.isAnonymous()) { return null };
    switch (userCompanyMap.get(caller)) {
      case (null) { null };
      case (?cid) { getOrCreateP(cFleetRoles, cid).get(caller) };
    };
  };

  public query ({ caller }) func getUserFleetRole(user : Principal) : async ?FleetRole {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: User access required");
    };
    let cid = requireCompanyId(caller);
    getOrCreateP(cFleetRoles, cid).get(user);
  };

  public query ({ caller }) func getCompanyUsers() : async [CompanyUserInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: User access required");
    };
    let cid = requireCompanyId(caller);
    let roleMap = getOrCreateP(cFleetRoles, cid);
    let result = List.empty<CompanyUserInfo>();
    for ((p, role) in roleMap.entries()) {
      result.add({
        principal = p;
        profile = userProfiles.get(p);
        role = role;
      });
    };
    result.toArray();
  };

  // ─── Invite Tokens ──────────────────────────────────────────────────────────
  public shared ({ caller }) func createInviteToken(email : Text, role : FleetRole) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: User access required to create invite tokens");
    };
    let cid = requireCompanyId(caller);
    // Verify caller is Admin in their company
    let roleMap = getOrCreateP(cFleetRoles, cid);
    switch (roleMap.get(caller)) {
      case (?#Admin) {};
      case (_) { Runtime.trap("Unauthorized: Only company admins can create invite tokens") };
    };
    let token = "INV-" # nextInviteTokenId.toText();
    inviteTokens.add(token, { token; role; email; companyId = cid; createdAt = Time.now(); usedBy = null });
    nextInviteTokenId += 1;
    token;
  };

  public shared ({ caller }) func redeemInviteToken(token : Text) : async FleetRole {
    if (caller.isAnonymous()) Runtime.trap("Unauthorized: Authentication required");
    let existing = switch (inviteTokens.get(token)) {
      case (null) { Runtime.trap("Token does not exist") }; case (?t) t;
    };
    switch (existing.usedBy) { case (?_) { Runtime.trap("Token already used") }; case (null) {} };
    inviteTokens.add(token, { existing with usedBy = ?caller });
    
    // Register user in the token's company
    userCompanyMap.add(caller, existing.companyId);
    
    // Add user to system ACL as #user if not already registered
    if (accessControlState.userRoles.get(caller) == null) {
      accessControlState.userRoles.add(caller, #user);
    };
    
    // Add user to company's fleet roles
    getOrCreateP(cFleetRoles, existing.companyId).add(caller, existing.role);
    
    existing.role;
  };

  public query ({ caller }) func getInviteTokens() : async [InviteToken] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: User access required");
    };
    let cid = requireCompanyId(caller);
    // Verify caller is Admin in their company
    let roleMap = getOrCreateP(cFleetRoles, cid);
    switch (roleMap.get(caller)) {
      case (?#Admin) {};
      case (_) { Runtime.trap("Unauthorized: Only company admins can view invite tokens") };
    };
    // Return only tokens for caller's company
    inviteTokens.values().toArray().filter(func(t : InviteToken) : Bool { t.companyId == cid });
  };

  // ─── User Profiles ──────────────────────────────────────────────────────────
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) { return null };
    userProfiles.get(caller);
  };
  
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.get(user);
  };
  
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) Runtime.trap("Unauthorized: Authentication required");
    userProfiles.add(caller, profile);
  };

  // ─── Company Settings ────────────────────────────────────────────────────────
  public shared ({ caller }) func saveCompanySettings(settings : CompanySettings) : async () {
    if (caller.isAnonymous()) Runtime.trap("Unauthorized: Authentication required");
    let cid = settings.companyName;
    if (accessControlState.userRoles.get(caller) == null) {
      accessControlState.userRoles.add(caller, #admin);
    };
    userCompanyMap.add(caller, cid);
    cSettings.add(cid, settings);
    let roleMap = getOrCreateP(cFleetRoles, cid);
    if (roleMap.get(caller) == null) { roleMap.add(caller, #Admin) };
    let alreadyExists = not allCompanyRegistrations
      .filter(func(s : CompanySettings) : Bool { s.companyName == cid }).isEmpty();
    if (not alreadyExists) { allCompanyRegistrations.add(settings); if (companyApprovalStore.get(cid) == null) { companyApprovalStore.add(cid, "pending") } };
  };

  public query ({ caller }) func getCompanySettings() : async ?CompanySettings {
    if (caller.isAnonymous()) { return null };
    switch (userCompanyMap.get(caller)) {
      case (null) { null }; case (?cid) { cSettings.get(cid) };
    };
  };

  public query func getCompanyApprovalStatus(companyName : Text) : async Text {
    switch (companyApprovalStore.get(companyName)) { case (?s) s; case (null) "approved" };
  };

  public shared ({ caller }) func approveCompany(companyName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    companyApprovalStore.add(companyName, "approved");
  };

  public shared ({ caller }) func rejectCompany(companyName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    companyApprovalStore.add(companyName, "rejected");
  };

  public query ({ caller }) func getDefaultCurrency() : async Text {
    if (caller.isAnonymous()) { return "CAD" };
    switch (userCompanyMap.get(caller)) {
      case (null) { "CAD" };
      case (?cid) { switch (cCurrency.get(cid)) { case (?c) c; case null "CAD" } };
    };
  };

  public shared ({ caller }) func saveDefaultCurrency(currency : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    cCurrency.add(requireCompanyId(caller), currency);
  };

  public query ({ caller }) func getTaxSettings() : async ?TaxSettings {
    if (caller.isAnonymous()) { return null };
    switch (userCompanyMap.get(caller)) { case (null) null; case (?cid) { cTax.get(cid) } };
  };

  public shared ({ caller }) func saveTaxSettings(settings : TaxSettings) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    cTax.add(requireCompanyId(caller), settings);
  };

  // ─── Vehicles ────────────────────────────────────────────────────────────────
  public shared ({ caller }) func createVehicle(vehicle : Vehicle) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    let id = nextId(cVehCounters, cid);
    getOrCreate(cVehicles, cid).add(id, { vehicle with id; createdAt = Time.now() });
    id;
  };

  public shared ({ caller }) func bulkCreateVehicles(vehicleList : [Vehicle]) : async [Nat] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    // Verify caller is Admin or FleetManager
    let roleMap = getOrCreateP(cFleetRoles, cid);
    switch (roleMap.get(caller)) {
      case (?#Admin) {};
      case (?#FleetManager) {};
      case (_) { Runtime.trap("Unauthorized: Only admins and fleet managers can bulk create vehicles") };
    };
    let ids = List.empty<Nat>();
    for (v in vehicleList.vals()) {
      let id = nextId(cVehCounters, cid);
      getOrCreate(cVehicles, cid).add(id, { v with id; createdAt = Time.now() });
      ids.add(id);
    };
    ids.toArray();
  };

  public shared ({ caller }) func updateVehicle(id : Nat, vehicle : Vehicle) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    let m = getOrCreate(cVehicles, cid);
    switch (m.get(id)) {
      case (null) { Runtime.trap("Vehicle not found") };
      case (?e) { m.add(id, { vehicle with id; createdAt = e.createdAt }) };
    };
  };

  public shared ({ caller }) func deleteVehicle(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    // Verify caller is Admin or FleetManager
    let roleMap = getOrCreateP(cFleetRoles, cid);
    switch (roleMap.get(caller)) {
      case (?#Admin) {};
      case (?#FleetManager) {};
      case (_) { Runtime.trap("Unauthorized: Only admins and fleet managers can delete vehicles") };
    };
    getOrCreate(cVehicles, cid).remove(id);
  };

  public query ({ caller }) func getVehicle(id : Nat) : async Vehicle {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    switch (getOrCreate(cVehicles, cid).get(id)) {
      case (null) { Runtime.trap("Vehicle not found") }; case (?v) v;
    };
  };

  public query ({ caller }) func getAllVehicles() : async [Vehicle] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    getOrCreate(cVehicles, requireCompanyId(caller)).values().toArray();
  };

  // ─── Parts ───────────────────────────────────────────────────────────────────
  public shared ({ caller }) func createPart(part : PartFull) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    let id = nextId(cPartCounters, cid);
    getOrCreate(cParts, cid).add(id, { id; name = part.name; partNumber = part.partNumber;
      quantityInStock = part.quantityInStock; minStockLevel = part.minStockLevel;
      location = part.location; createdAt = Time.now() });
    switch (part.price) { case (?p) { getOrCreate(cPrices, cid).add(id, p) }; case null {} };
    switch (part.category) { case (?c) { getOrCreate(cCategories, cid).add(id, c) }; case null {} };
    id;
  };

  public shared ({ caller }) func updatePart(id : Nat, part : PartFull) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    let m = getOrCreate(cParts, cid);
    let e = switch (m.get(id)) { case (null) { Runtime.trap("Part not found") }; case (?p) p };
    m.add(id, { id; name = part.name; partNumber = part.partNumber;
      quantityInStock = part.quantityInStock; minStockLevel = part.minStockLevel;
      location = part.location; createdAt = e.createdAt });
    switch (part.price) { case (?p) { getOrCreate(cPrices, cid).add(id, p) }; case null { getOrCreate(cPrices, cid).remove(id) } };
    switch (part.category) { case (?c) { getOrCreate(cCategories, cid).add(id, c) }; case null { getOrCreate(cCategories, cid).remove(id) } };
  };

  public shared ({ caller }) func deletePart(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    // Verify caller is Admin or FleetManager
    let roleMap = getOrCreateP(cFleetRoles, cid);
    switch (roleMap.get(caller)) {
      case (?#Admin) {};
      case (?#FleetManager) {};
      case (_) { Runtime.trap("Unauthorized: Only admins and fleet managers can delete parts") };
    };
    getOrCreate(cParts, cid).remove(id);
    getOrCreate(cPrices, cid).remove(id);
    getOrCreate(cCategories, cid).remove(id);
  };

  public query ({ caller }) func getPart(id : Nat) : async PartFull {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    switch (getOrCreate(cParts, cid).get(id)) {
      case (null) { Runtime.trap("Part not found") }; case (?p) { toFullPart(cid, p) };
    };
  };

  public query ({ caller }) func getAllParts() : async [PartFull] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    getOrCreate(cParts, cid).values().toArray().map(func(p : PartCore) : PartFull { toFullPart(cid, p) });
  };

  public query ({ caller }) func getLowStockParts() : async [PartFull] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    getOrCreate(cParts, cid).values().toArray()
      .filter(func(p : PartCore) : Bool { p.quantityInStock <= p.minStockLevel })
      .map(func(p : PartCore) : PartFull { toFullPart(cid, p) });
  };

  // ─── Maintenance Records ─────────────────────────────────────────────────────
  public shared ({ caller }) func createMaintenanceRecord(record : MaintenanceRecordFull) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    let ps = getOrCreate(cParts, cid);
    if (record.partQuantities.size() > 0) {
      for (pq in record.partQuantities.vals()) {
        switch (ps.get(pq.partId)) {
          case (null) {};
          case (?p) {
            let deduct = if (pq.quantity > p.quantityInStock) p.quantityInStock else pq.quantity;
            ps.add(pq.partId, { p with quantityInStock = p.quantityInStock - deduct });
          };
        };
      };
    } else {
      for (pid in record.partsUsed.vals()) {
        switch (ps.get(pid)) {
          case (null) {};
          case (?p) {
            if (p.quantityInStock > 0) { ps.add(pid, { p with quantityInStock = p.quantityInStock - 1 }) };
          };
        };
      };
    };
    let id = nextId(cMaintCounters, cid);
    getOrCreate(cMaint, cid).add(id, { id; vehicleId = record.vehicleId; date = record.date;
      maintenanceType = record.maintenanceType; description = record.description;
      cost = record.cost; mileage = record.mileage; technicianName = record.technicianName;
      nextServiceDate = record.nextServiceDate; createdAt = Time.now() });
    if (record.partsUsed.size() > 0) { getOrCreate(cMParts, cid).add(id, record.partsUsed) };
    if (record.partQuantities.size() > 0) { getOrCreate(cMPartQty, cid).add(id, record.partQuantities) };
    switch (record.laborHours) { case (?h) { getOrCreate(cMLaborH, cid).add(id, h) }; case null {} };
    switch (record.laborCost) { case (?c) { getOrCreate(cMLaborC, cid).add(id, c) }; case null {} };
    switch (record.workOrderId) { case (?woid) { getOrCreate(cWOLinks, cid).add(id, woid) }; case null {} };
    id;
  };

  public shared ({ caller }) func updateMaintenanceRecord(id : Nat, record : MaintenanceRecordFull) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    let m = getOrCreate(cMaint, cid);
    let e = switch (m.get(id)) { case (null) { Runtime.trap("Not found") }; case (?r) r };
    m.add(id, { id; vehicleId = record.vehicleId; date = record.date;
      maintenanceType = record.maintenanceType; description = record.description;
      cost = record.cost; mileage = record.mileage; technicianName = record.technicianName;
      nextServiceDate = record.nextServiceDate; createdAt = e.createdAt });
    getOrCreate(cMParts, cid).add(id, record.partsUsed);
    if (record.partQuantities.size() > 0) { getOrCreate(cMPartQty, cid).add(id, record.partQuantities) };
    switch (record.laborHours) { case (?h) { getOrCreate(cMLaborH, cid).add(id, h) }; case null { getOrCreate(cMLaborH, cid).remove(id) } };
    switch (record.laborCost) { case (?c) { getOrCreate(cMLaborC, cid).add(id, c) }; case null { getOrCreate(cMLaborC, cid).remove(id) } };
    switch (record.workOrderId) { case (?woid) { getOrCreate(cWOLinks, cid).add(id, woid) }; case null {} };
  };

  public query ({ caller }) func getMaintenanceRecord(id : Nat) : async MaintenanceRecordFull {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    switch (getOrCreate(cMaint, cid).get(id)) {
      case (null) { Runtime.trap("Not found") }; case (?r) { toFullMaint(cid, r) };
    };
  };

  public query ({ caller }) func getAllMaintenanceRecords() : async [MaintenanceRecordFull] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    getOrCreate(cMaint, cid).values().toArray().map(func(r : MaintCore) : MaintenanceRecordFull { toFullMaint(cid, r) });
  };

  public query ({ caller }) func getMaintenanceRecordsByVehicle(vehicleId : Nat) : async [MaintenanceRecordFull] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    getOrCreate(cMaint, cid).values().toArray()
      .filter(func(r : MaintCore) : Bool { r.vehicleId == vehicleId })
      .map(func(r : MaintCore) : MaintenanceRecordFull { toFullMaint(cid, r) });
  };

  public query ({ caller }) func getUpcomingMaintenance() : async [MaintenanceRecordFull] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    let now = Time.now(); let thirtyDays = 30 * 24 * 60 * 60 * 1000000000;
    getOrCreate(cMaint, cid).values().toArray()
      .filter(func(r : MaintCore) : Bool {
        switch (r.nextServiceDate) { case (null) false; case (?d) { d > now and d <= (now + thirtyDays) } };
      })
      .map(func(r : MaintCore) : MaintenanceRecordFull { toFullMaint(cid, r) });
  };

  public query ({ caller }) func getOverdueMaintenance() : async [MaintenanceRecordFull] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    let now = Time.now();
    getOrCreate(cMaint, cid).values().toArray()
      .filter(func(r : MaintCore) : Bool {
        switch (r.nextServiceDate) { case (null) false; case (?d) { d < now } };
      })
      .map(func(r : MaintCore) : MaintenanceRecordFull { toFullMaint(cid, r) });
  };

  public query ({ caller }) func getDashboardStats() : async DashboardStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return { totalVehicles = 0; activeVehicles = 0; upcomingMaintenanceCount = 0; overdueCount = 0; lowStockPartsCount = 0 };
    };
    let cid = requireCompanyId(caller);
    let now = Time.now(); let thirtyDays = 30 * 24 * 60 * 60 * 1000000000;
    let allV = getOrCreate(cVehicles, cid).values().toArray();
    let allR = getOrCreate(cMaint, cid).values().toArray();
    let allP = getOrCreate(cParts, cid).values().toArray();
    { totalVehicles = allV.size();
      activeVehicles = allV.filter(func(v : Vehicle) : Bool { v.status == #Active }).size();
      upcomingMaintenanceCount = allR.filter(func(r : MaintCore) : Bool {
        switch (r.nextServiceDate) { case (null) false; case (?d) { d > now and d <= (now + thirtyDays) } };
      }).size();
      overdueCount = allR.filter(func(r : MaintCore) : Bool {
        switch (r.nextServiceDate) { case (null) false; case (?d) { d < now } };
      }).size();
      lowStockPartsCount = allP.filter(func(p : PartCore) : Bool { p.quantityInStock <= p.minStockLevel }).size() };
  };

  // ─── Work Orders ─────────────────────────────────────────────────────────────
  public shared ({ caller }) func createWorkOrder(wo : WorkOrder) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    // Use max(counter, maxExistingId+1) to guarantee no duplicate WO numbers
    let existing = getOrCreate(cWO, cid);
    var maxExisting : Nat = 0;
    for ((eid, _) in existing.entries()) {
      if (eid > maxExisting) { maxExisting := eid };
    };
    let counterVal = switch (cWOCounters.get(cid)) { case (?n) n; case null 1 };
    let id = if (counterVal > maxExisting) counterVal else maxExisting + 1;
    cWOCounters.add(cid, id + 1);
    existing.add(id, { wo with id; status = #Open; completedDate = null; createdAt = Time.now() });
    id;
  };

  public shared ({ caller }) func updateWorkOrder(id : Nat, wo : WorkOrder) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    let m = getOrCreate(cWO, cid);
    let e = switch (m.get(id)) { case (null) { Runtime.trap("Not found") }; case (?w) w };
    m.add(id, { wo with id; createdAt = e.createdAt });
  };

  public shared ({ caller }) func deleteWorkOrder(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    // Verify caller is Admin or FleetManager
    let roleMap = getOrCreateP(cFleetRoles, cid);
    switch (roleMap.get(caller)) {
      case (?#Admin) {};
      case (?#FleetManager) {};
      case (_) { Runtime.trap("Unauthorized: Only admins and fleet managers can delete work orders") };
    };
    getOrCreate(cWO, cid).remove(id);
  };

  public query ({ caller }) func getWorkOrder(id : Nat) : async WorkOrder {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    switch (getOrCreate(cWO, cid).get(id)) { case (null) { Runtime.trap("Not found") }; case (?w) w };
  };

  public query ({ caller }) func getAllWorkOrders() : async [WorkOrder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    getOrCreate(cWO, requireCompanyId(caller)).values().toArray();
  };

  public query ({ caller }) func getWorkOrdersByVehicle(vehicleId : Nat) : async [WorkOrder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    getOrCreate(cWO, cid).values().toArray().filter(func(w : WorkOrder) : Bool { w.vehicleId == vehicleId });
  };

  public shared ({ caller }) func completeWorkOrder(id : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    let wom = getOrCreate(cWO, cid);
    let wo = switch (wom.get(id)) { case (null) { Runtime.trap("Not found") }; case (?w) w };
    let now = Time.now();
    wom.add(id, { wo with status = #Completed; completedDate = ?now });
    let mid = nextId(cMaintCounters, cid);
    getOrCreate(cMaint, cid).add(mid, { id = mid; vehicleId = wo.vehicleId; date = now;
      maintenanceType = #Other; description = wo.title # ": " # wo.description;
      cost = 0.0; mileage = 0; technicianName = wo.assignedMechanic;
      nextServiceDate = null; createdAt = now });
    getOrCreate(cWOLinks, cid).add(mid, id);
    mid;
  };

  // ─── Vendors ─────────────────────────────────────────────────────────────────
  public shared ({ caller }) func createVendor(vendor : Vendor) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    let id = nextId(cVendorCounters, cid);
    getOrCreate(cVendors, cid).add(id, { vendor with id; createdAt = Time.now() });
    id;
  };

  public shared ({ caller }) func updateVendor(id : Nat, vendor : Vendor) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    let m = getOrCreate(cVendors, cid);
    let e = switch (m.get(id)) { case (null) { Runtime.trap("Not found") }; case (?v) v };
    m.add(id, { vendor with id; createdAt = e.createdAt });
  };

  public shared ({ caller }) func deleteVendor(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    // Verify caller is Admin or FleetManager
    let roleMap = getOrCreateP(cFleetRoles, cid);
    switch (roleMap.get(caller)) {
      case (?#Admin) {};
      case (?#FleetManager) {};
      case (_) { Runtime.trap("Unauthorized: Only admins and fleet managers can delete vendors") };
    };
    getOrCreate(cVendors, cid).remove(id);
  };

  public query ({ caller }) func getVendor(id : Nat) : async Vendor {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    switch (getOrCreate(cVendors, cid).get(id)) { case (null) { Runtime.trap("Not found") }; case (?v) v };
  };

  public query ({ caller }) func getAllVendors() : async [Vendor] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    getOrCreate(cVendors, requireCompanyId(caller)).values().toArray();
  };

  // ─── Warranties ──────────────────────────────────────────────────────────────
  public shared ({ caller }) func createWarranty(warranty : Warranty) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    let id = nextId(cWarrantyCounters, cid);
    getOrCreate(cWarranties, cid).add(id, { warranty with id; createdAt = Time.now() });
    id;
  };

  public shared ({ caller }) func updateWarranty(id : Nat, warranty : Warranty) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    let m = getOrCreate(cWarranties, cid);
    let e = switch (m.get(id)) { case (null) { Runtime.trap("Not found") }; case (?w) w };
    m.add(id, { warranty with id; createdAt = e.createdAt });
  };

  public shared ({ caller }) func deleteWarranty(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    // Verify caller is Admin or FleetManager
    let roleMap = getOrCreateP(cFleetRoles, cid);
    switch (roleMap.get(caller)) {
      case (?#Admin) {};
      case (?#FleetManager) {};
      case (_) { Runtime.trap("Unauthorized: Only admins and fleet managers can delete warranties") };
    };
    getOrCreate(cWarranties, cid).remove(id);
  };

  public query ({ caller }) func getWarranty(id : Nat) : async Warranty {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    switch (getOrCreate(cWarranties, cid).get(id)) { case (null) { Runtime.trap("Not found") }; case (?w) w };
  };

  public query ({ caller }) func getAllWarranties() : async [Warranty] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    getOrCreate(cWarranties, requireCompanyId(caller)).values().toArray();
  };

  public query ({ caller }) func getWarrantiesByVehicle(vehicleId : Nat) : async [Warranty] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    getOrCreate(cWarranties, cid).values().toArray().filter(func(w : Warranty) : Bool { w.vehicleId == vehicleId });
  };

  // ─── Service Schedules ───────────────────────────────────────────────────────
  public shared ({ caller }) func createServiceSchedule(schedule : ServiceSchedule) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    let id = nextId(cScheduleCounters, cid);
    getOrCreate(cSchedules, cid).add(id, { schedule with id; createdAt = Time.now() });
    id;
  };

  public query ({ caller }) func getAllServiceSchedules() : async [ServiceSchedule] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    getOrCreate(cSchedules, requireCompanyId(caller)).values().toArray();
  };

  public shared ({ caller }) func updateServiceSchedule(id : Nat, schedule : ServiceSchedule) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    let m = getOrCreate(cSchedules, cid);
    let e = switch (m.get(id)) { case null { Runtime.trap("Not found") }; case (?s) s };
    m.add(id, { schedule with id; createdAt = e.createdAt });
  };

  public shared ({ caller }) func deleteServiceSchedule(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    getOrCreate(cSchedules, requireCompanyId(caller)).remove(id);
  };

  public shared ({ caller }) func markScheduleComplete(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let cid = requireCompanyId(caller);
    let m = getOrCreate(cSchedules, cid);
    switch (m.get(id)) {
      case null { Runtime.trap("Not found") };
      case (?e) {
        let intervalNanos : Int = e.intervalDays * 24 * 60 * 60 * 1_000_000_000;
        m.add(id, { e with nextDueDate = e.nextDueDate + intervalNanos; lastCompletedDate = ?Time.now() });
      };
    };
  };

  // ─── Company Registrations & Dev Portal ─────────────────────────────────────
  public query ({ caller }) func getAllCompanyRegistrations() : async [CompanySettings] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    allCompanyRegistrations.toArray();
  };

  public query func getAllCompanyRegistrationsWithKey(devKey : Text) : async [CompanySettings] {
    if (devKey != DEV_KEY) Runtime.trap("Unauthorized: Invalid developer key");
    allCompanyRegistrations.toArray();
  };

  public shared func updateSubscriptionStatusWithKey(devKey : Text, companyName : Text, status : Text, startDate : ?Time.Time) : async () {
    if (devKey != DEV_KEY) Runtime.trap("Unauthorized: Invalid developer key");
    subscriptionRecords.add(companyName, { companyName; status; startDate; trialEndsAt = null; plan = "standard"; updatedAt = Time.now() });
  };

  public shared ({ caller }) func updateSubscriptionStatus(companyName : Text, status : Text, startDate : ?Time.Time) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    subscriptionRecords.add(companyName, { companyName; status; startDate; trialEndsAt = null; plan = "standard"; updatedAt = Time.now() });
  };

  public query ({ caller }) func getSubscriptionStatus(companyName : Text) : async ?SubscriptionRecord {
    if (caller.isAnonymous()) { return null };
    subscriptionRecords.get(companyName);
  };

  public query ({ caller }) func getAllSubscriptions() : async [SubscriptionRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    subscriptionRecords.values().toArray();
  };

  public query func getAllSubscriptionsWithKey(devKey : Text) : async [SubscriptionRecord] {
    if (devKey != DEV_KEY) Runtime.trap("Unauthorized: Invalid developer key");
    subscriptionRecords.values().toArray();
  };

  public shared func approveCompanyWithKey(devKey : Text, companyName : Text) : async () {
    if (devKey != DEV_KEY) Runtime.trap("Unauthorized: Invalid developer key");
    companyApprovalStore.add(companyName, "approved");
  };

  public shared func rejectCompanyWithKey(devKey : Text, companyName : Text) : async () {
    if (devKey != DEV_KEY) Runtime.trap("Unauthorized: Invalid developer key");
    companyApprovalStore.add(companyName, "rejected");
  };

  public query func getCompanyApprovalStatusWithKey(devKey : Text, companyName : Text) : async Text {
    if (devKey != DEV_KEY) Runtime.trap("Unauthorized: Invalid developer key");
    switch (companyApprovalStore.get(companyName)) { case (?s) s; case null "approved" };
  };

  public query func getAllCompanyApprovalsWithKey(devKey : Text) : async [(Text, Text)] {
    if (devKey != DEV_KEY) Runtime.trap("Unauthorized: Invalid developer key");
    companyApprovalStore.entries().toArray();
  };

  public shared func startTrialWithKey(devKey : Text, companyName : Text, trialDays : Nat) : async () {
    if (devKey != DEV_KEY) Runtime.trap("Unauthorized: Invalid developer key");
    let now = Time.now();
    subscriptionRecords.add(companyName, { companyName; status = "trial"; startDate = ?now;
      trialEndsAt = ?(now + (trialDays * 24 * 60 * 60 * 1000000000)); plan = "standard"; updatedAt = now });
  };

  public shared ({ caller }) func startTrial(companyName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    let now = Time.now();
    subscriptionRecords.add(companyName, { companyName; status = "trial"; startDate = ?now;
      trialEndsAt = ?(now + (7 * 24 * 60 * 60 * 1000000000)); plan = "standard"; updatedAt = now });
  };

  public shared ({ caller }) func cancelSubscription(companyName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    let existing = switch (subscriptionRecords.get(companyName)) {
      case (null) { Runtime.trap("Subscription not found") };
      case (?s) s;
    };
    subscriptionRecords.add(companyName, { existing with status = "cancelled"; updatedAt = Time.now() });
  };

  // ─── Discount Codes ──────────────────────────────────────────────────────────
  public shared ({ caller }) func createDiscountCode(discount : DiscountCode) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    let id = nextDiscountCodeId;
    nextDiscountCodeId += 1;
    discountCodes.add(id, { id; code = discount.code; discountType = discount.discountType;
      value = discount.value; description = discount.description; createdAt = Time.now(); usedCount = 0 });
    discountCodeMap.add(discount.code, id);
    id;
  };

  public shared func createDiscountCodeWithKey(devKey : Text, discount : DiscountCode) : async Nat {
    if (devKey != DEV_KEY) Runtime.trap("Unauthorized: Invalid developer key");
    let id = nextDiscountCodeId;
    nextDiscountCodeId += 1;
    discountCodes.add(id, { id; code = discount.code; discountType = discount.discountType;
      value = discount.value; description = discount.description; createdAt = Time.now(); usedCount = 0 });
    discountCodeMap.add(discount.code, id);
    id;
  };

  public query ({ caller }) func getDiscountCodes() : async [DiscountCode] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    discountCodes.values().toArray();
  };

  public query func getAllDiscountCodesWithKey(devKey : Text) : async [DiscountCode] {
    if (devKey != DEV_KEY) Runtime.trap("Unauthorized: Invalid developer key");
    discountCodes.values().toArray();
  };

  public shared ({ caller }) func deleteDiscountCode(code : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    switch (discountCodeMap.get(code)) {
      case (null) { Runtime.trap("Discount code not found") };
      case (?id) {
        discountCodes.remove(id);
        discountCodeMap.remove(code);
      };
    };
  };

  public shared func deleteDiscountCodeWithKey(devKey : Text, id : Nat) : async () {
    if (devKey != DEV_KEY) Runtime.trap("Unauthorized: Invalid developer key");
    let d = switch (discountCodes.get(id)) { case (null) { Runtime.trap("Not found") }; case (?d) d };
    discountCodes.remove(id);
    discountCodeMap.remove(d.code);
  };

  public query func validateDiscountCode(code : Text) : async ?DiscountCode {
    switch (discountCodeMap.get(code)) { case (null) null; case (?id) { discountCodes.get(id) } };
  };

  public shared ({ caller }) func applyDiscountCode(code : Text) : async () {
    if (caller.isAnonymous()) Runtime.trap("Unauthorized: Authentication required");
    switch (discountCodeMap.get(code)) {
      case (null) { Runtime.trap("Invalid discount code") };
      case (?id) {
        let d = switch (discountCodes.get(id)) { case (null) { Runtime.trap("Not found") }; case (?d) d };
        discountCodes.add(id, { d with usedCount = d.usedCount + 1 });
      };
    };
  };
  // ─── Developer User Management (devKey-bypass) ───────────────────────────────

  // Get all users for any company (dev portal use)
  public query func getCompanyUsersWithKey(devKey : Text, companyId : Text) : async [CompanyUserInfo] {
    if (devKey != DEV_KEY) Runtime.trap("Unauthorized: Invalid developer key");
    let roleMap = getOrCreateP(cFleetRoles, companyId);
    let result = List.empty<CompanyUserInfo>();
    for ((p, role) in roleMap.entries()) {
      result.add({
        principal = p;
        profile = userProfiles.get(p);
        role = role;
      });
    };
    result.toArray();
  };

  // Remove a user from a company — immediate access revocation
  public shared func removeUserFromCompanyWithKey(devKey : Text, companyId : Text, user : Principal) : async () {
    if (devKey != DEV_KEY) Runtime.trap("Unauthorized: Invalid developer key");
    getOrCreateP(cFleetRoles, companyId).remove(user);
    userCompanyMap.remove(user);
    accessControlState.userRoles.remove(user);
  };

  // Change a user's fleet role in any company
  public shared func setUserFleetRoleWithKey(devKey : Text, companyId : Text, user : Principal, role : FleetRole) : async () {
    if (devKey != DEV_KEY) Runtime.trap("Unauthorized: Invalid developer key");
    getOrCreateP(cFleetRoles, companyId).add(user, role);
  };

  // Add a user directly to a company (dev-initiated enrollment)
  public shared func addUserToCompanyWithKey(devKey : Text, companyId : Text, user : Principal, role : FleetRole) : async () {
    if (devKey != DEV_KEY) Runtime.trap("Unauthorized: Invalid developer key");
    switch (cSettings.get(companyId)) {
      case (null) { Runtime.trap("Company not found") };
      case (_) {};
    };
    userCompanyMap.add(user, companyId);
    getOrCreateP(cFleetRoles, companyId).add(user, role);
    if (accessControlState.userRoles.get(user) == null) {
      accessControlState.userRoles.add(user, #user);
    };
  };

  // Fully delete a company and immediately revoke access for all its users
  public shared func deleteCompanyWithKey(devKey : Text, companyId : Text) : async () {
    if (devKey != DEV_KEY) Runtime.trap("Unauthorized: Invalid developer key");
    let roleMap = getOrCreateP(cFleetRoles, companyId);
    for ((p, _) in roleMap.entries()) {
      userCompanyMap.remove(p);
      accessControlState.userRoles.remove(p);
    };
    cVehicles.remove(companyId);
    cVehCounters.remove(companyId);
    cParts.remove(companyId);
    cPrices.remove(companyId);
    cCategories.remove(companyId);
    cPartCounters.remove(companyId);
    cMaint.remove(companyId);
    cMParts.remove(companyId);
    cMPartQty.remove(companyId);
    cMLaborH.remove(companyId);
    cMLaborC.remove(companyId);
    cWOLinks.remove(companyId);
    cMaintCounters.remove(companyId);
    cWO.remove(companyId);
    cWOCounters.remove(companyId);
    cVendors.remove(companyId);
    cVendorCounters.remove(companyId);
    cWarranties.remove(companyId);
    cWarrantyCounters.remove(companyId);
    cSchedules.remove(companyId);
    cScheduleCounters.remove(companyId);
    cFleetRoles.remove(companyId);
    cSettings.remove(companyId);
    cCurrency.remove(companyId);
    cTax.remove(companyId);
    companyApprovalStore.add(companyId, "deleted");
  };

};