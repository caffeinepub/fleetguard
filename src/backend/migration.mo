import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type OldActor = {
    fleetRoles : Map.Map<Principal.Principal, { #Admin; #FleetManager; #Mechanic }>;
    inviteTokens : Map.Map<Text, { token : Text; role : { #Admin; #FleetManager; #Mechanic }; email : Text; createdAt : Int; usedBy : ?Principal.Principal }>;
    userProfiles : Map.Map<Principal.Principal, { name : Text }>;
    vehicles : List.List<{ id : Nat; name : Text; vehicleType : { #Truck; #Trailer; #Bus; #Van; #Other }; licensePlate : Text; year : Nat; make : Text; model : Text; status : { #Active; #Inactive }; notes : Text; createdAt : Int }>;
    vehicleStore : Map.Map<Nat, { id : Nat; name : Text; vehicleType : { #Truck; #Trailer; #Bus; #Van; #Other }; licensePlate : Text; year : Nat; make : Text; model : Text; status : { #Active; #Inactive }; notes : Text; createdAt : Int }>;
    maintenanceStore : Map.Map<Nat, { id : Nat; vehicleId : Nat; date : Int; maintenanceType : { #OilChange; #TireRotation; #BrakeService; #EngineCheck; #Transmission; #Electrical; #Bodywork; #Inspection; #Other }; description : Text; cost : Float; mileage : Nat; technicianName : Text; nextServiceDate : ?Int; createdAt : Int }>;
    partStore : Map.Map<Nat, { id : Nat; name : Text; partNumber : Text; quantityInStock : Nat; minStockLevel : Nat; location : Text; createdAt : Int }>;
    partPriceStore : Map.Map<Nat, Float>;
    maintenancePartsStore : Map.Map<Nat, [Nat]>;
    workOrderLinkStore : Map.Map<Nat, Nat>;
    workOrderStore : Map.Map<Nat, { id : Nat; title : Text; vehicleId : Nat; description : Text; assignedMechanic : Text; priority : { #Low; #Medium; #High; #Critical }; status : { #Open; #InProgress; #Completed; #Cancelled }; scheduledDate : ?Int; completedDate : ?Int; notes : Text; createdAt : Int }>;
    vendorStore : Map.Map<Nat, { id : Nat; name : Text; contactName : Text; phone : Text; email : Text; address : Text; notes : Text; category : Text; createdAt : Int }>;
    warrantyStore : Map.Map<Nat, { id : Nat; vehicleId : Nat; description : Text; provider : Text; startDate : Int; expiryDate : Int; coverageDetails : Text; cost : Float; notes : Text; createdAt : Int }>;
    companySettings : ?{ companyName : Text; industry : Text; fleetSize : Text; contactPhone : Text; logoUrl : Text; adminPrincipal : Text; createdAt : Int };
    subscriptionRecords : Map.Map<Text, { companyName : Text; status : Text; startDate : ?Int; updatedAt : Int }>;
    defaultCurrency : Text;
    serviceSchedules : Map.Map<Nat, { id : Nat; vehicleId : Nat; serviceType : Text; intervalDays : Nat; nextDueDate : Int; lastCompletedDate : ?Int; notes : Text; status : Text; createdAt : Int }>;
  };

  type NewActor = {
    fleetRoles : Map.Map<Principal.Principal, { #Admin; #FleetManager; #Mechanic }>;
    inviteTokens : Map.Map<Text, { token : Text; role : { #Admin; #FleetManager; #Mechanic }; email : Text; createdAt : Int; usedBy : ?Principal.Principal }>;
    userProfiles : Map.Map<Principal.Principal, { name : Text }>;
    vehicles : List.List<{ id : Nat; name : Text; vehicleType : { #Truck; #Trailer; #Bus; #Van; #Other }; licensePlate : Text; year : Nat; make : Text; model : Text; status : { #Active; #Inactive }; notes : Text; createdAt : Int }>;
    vehicleStore : Map.Map<Nat, { id : Nat; name : Text; vehicleType : { #Truck; #Trailer; #Bus; #Van; #Other }; licensePlate : Text; year : Nat; make : Text; model : Text; status : { #Active; #Inactive }; notes : Text; createdAt : Int }>;
    maintenanceStore : Map.Map<Nat, { id : Nat; vehicleId : Nat; date : Int; maintenanceType : { #OilChange; #TireRotation; #BrakeService; #EngineCheck; #Transmission; #Electrical; #Bodywork; #Inspection; #Other }; description : Text; cost : Float; mileage : Nat; technicianName : Text; nextServiceDate : ?Int; createdAt : Int }>;
    partStore : Map.Map<Nat, { id : Nat; name : Text; partNumber : Text; quantityInStock : Nat; minStockLevel : Nat; location : Text; createdAt : Int }>;
    partPriceStore : Map.Map<Nat, Float>;
    maintenancePartsStore : Map.Map<Nat, [Nat]>;
    workOrderLinkStore : Map.Map<Nat, Nat>;
    workOrderStore : Map.Map<Nat, { id : Nat; title : Text; vehicleId : Nat; description : Text; assignedMechanic : Text; priority : { #Low; #Medium; #High; #Critical }; status : { #Open; #InProgress; #Completed; #Cancelled }; scheduledDate : ?Int; completedDate : ?Int; notes : Text; createdAt : Int }>;
    vendorStore : Map.Map<Nat, { id : Nat; name : Text; contactName : Text; phone : Text; email : Text; address : Text; notes : Text; category : Text; createdAt : Int }>;
    warrantyStore : Map.Map<Nat, { id : Nat; vehicleId : Nat; description : Text; provider : Text; startDate : Int; expiryDate : Int; coverageDetails : Text; cost : Float; notes : Text; createdAt : Int }>;
    companySettings : ?{ companyName : Text; industry : Text; fleetSize : Text; contactPhone : Text; logoUrl : Text; adminPrincipal : Text; createdAt : Int };
    subscriptionRecords : Map.Map<Text, { companyName : Text; status : Text; startDate : ?Int; updatedAt : Int }>;
    defaultCurrency : Text;
    serviceSchedules : Map.Map<Nat, { id : Nat; vehicleId : Nat; serviceType : Text; intervalDays : Nat; nextDueDate : Int; lastCompletedDate : ?Int; notes : Text; status : Text; createdAt : Int }>;
    chatMessages : List.List<{ id : Nat; senderPrincipal : Text; senderName : Text; message : Text; createdAt : Int }>;
    nextChatId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      chatMessages = List.empty<{ id : Nat; senderPrincipal : Text; senderName : Text; message : Text; createdAt : Int }>();
      nextChatId = 1;
    };
  };
};

