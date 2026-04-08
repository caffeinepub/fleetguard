import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";

module {
  // ── Old types (from previous deployed version) ──────────────────────────────
  // subscriptionRecords already has tier/vehicleLimit from a prior migration pass
  type SubscriptionTier = { #starter; #growth; #enterprise };
  type OldSubscriptionRecord = {
    companyName : Text; status : Text; startDate : ?Time.Time;
    trialEndsAt : ?Time.Time; plan : Text; updatedAt : Time.Time;
    tier : SubscriptionTier; vehicleLimit : Nat;
  };

  type OldCompanySettings = {
    companyName : Text; industry : Text; fleetSize : Text;
    contactPhone : Text; logoUrl : Text; adminPrincipal : Text; createdAt : Time.Time;
  };

  // ── New types ─────────────────────────────────────────────────────────────────
  type NewCompanySettings = {
    companyName : Text; industry : Text; fleetSize : Text;
    contactPhone : Text; contactEmail : Text; logoUrl : Text; adminPrincipal : Text; createdAt : Time.Time;
  };

  // ── State record shapes ───────────────────────────────────────────────────────
  type OldActor = {
    companySettings : ?OldCompanySettings;
    subscriptionRecords : Map.Map<Text, OldSubscriptionRecord>;
    cSettings : Map.Map<Text, OldCompanySettings>;
    allCompanyRegistrations : List.List<OldCompanySettings>;
  };

  type NewActor = {
    companySettings : ?NewCompanySettings;
    subscriptionRecords : Map.Map<Text, OldSubscriptionRecord>;
    cSettings : Map.Map<Text, NewCompanySettings>;
    allCompanyRegistrations : List.List<NewCompanySettings>;
  };

  public func run(old : OldActor) : NewActor {
    let companySettings = switch (old.companySettings) {
      case (null) { null };
      case (?s) { ?{ s with contactEmail = "" } };
    };
    let cSettings = old.cSettings.map<Text, OldCompanySettings, NewCompanySettings>(
      func(_key, s) {
        { s with contactEmail = "" }
      }
    );
    let allCompanyRegistrations = old.allCompanyRegistrations.map<OldCompanySettings, NewCompanySettings>(
      func(s) {
        { s with contactEmail = "" }
      }
    );
    { companySettings; subscriptionRecords = old.subscriptionRecords; cSettings; allCompanyRegistrations };
  };
};
