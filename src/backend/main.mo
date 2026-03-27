import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Float "mo:core/Float";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Management
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
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

  let vehicles = List.empty<Vehicle.Vehicle>();
  let maintenanceRecords = List.empty<MaintenanceRecord.MaintenanceRecord>();

  let vehicleStore = Map.empty<Nat, Vehicle.Vehicle>();
  let maintenanceStore = Map.empty<Nat, MaintenanceRecord.MaintenanceRecord>();

  var nextVehicleId = 1;
  var nextMaintenanceId = 1;

  func getVehicleInternal(id : Nat) : Vehicle.Vehicle {
    switch (vehicleStore.get(id)) {
      case (null) { Runtime.trap("Vehicle not found") };
      case (?vehicle) { vehicle };
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

  public shared ({ caller }) func createMaintenanceRecord(record : MaintenanceRecord.MaintenanceRecord) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create maintenance records");
    };

    ignore getVehicleInternal(record.vehicleId);

    let newRecord : MaintenanceRecord.MaintenanceRecord = {
      record with
      id = nextMaintenanceId;
      createdAt = Time.now();
    };

    maintenanceStore.add(nextMaintenanceId, newRecord);
    maintenanceRecords.add(newRecord);
    nextMaintenanceId += 1;
    newRecord.id;
  };

  public shared ({ caller }) func updateMaintenanceRecord(id : Nat, record : MaintenanceRecord.MaintenanceRecord) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update maintenance records");
    };

    let existingRecord = switch (maintenanceStore.get(id)) {
      case (null) { Runtime.trap("Maintenance record not found") };
      case (?record) { record };
    };

    let updatedRecord : MaintenanceRecord.MaintenanceRecord = {
      record with
      createdAt = existingRecord.createdAt;
    };

    maintenanceStore.add(id, updatedRecord);
  };

  public query ({ caller }) func getMaintenanceRecord(id : Nat) : async MaintenanceRecord.MaintenanceRecord {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view maintenance records");
    };
    switch (maintenanceStore.get(id)) {
      case (null) { Runtime.trap("Maintenance record not found") };
      case (?record) { record };
    };
  };

  public query ({ caller }) func getAllMaintenanceRecords() : async [MaintenanceRecord.MaintenanceRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view maintenance records");
    };
    maintenanceStore.values().toArray().sort();
  };

  public query ({ caller }) func getMaintenanceRecordsByVehicle(vehicleId : Nat) : async [MaintenanceRecord.MaintenanceRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view maintenance records");
    };
    maintenanceStore.values().toArray().filter(func(record) { record.vehicleId == vehicleId });
  };

  public query ({ caller }) func getUpcomingMaintenance() : async [MaintenanceRecord.MaintenanceRecord] {
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
    ).sort();
  };

  public query ({ caller }) func getOverdueMaintenance() : async [MaintenanceRecord.MaintenanceRecord] {
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
    ).sort();
  };

  public type DashboardStats = {
    totalVehicles : Nat;
    activeVehicles : Nat;
    upcomingMaintenanceCount : Nat;
    overdueCount : Nat;
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

    {
      totalVehicles = totalVehicles;
      activeVehicles = activeVehicles;
      upcomingMaintenanceCount = upcomingMaintenanceCount;
      overdueCount = overdueCount;
    };
  };
};
