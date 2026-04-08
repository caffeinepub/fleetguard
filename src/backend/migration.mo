import Map "mo:core/Map";
import Time "mo:core/Time";

module {
  // ── Old types (from previous deployed version) ──────────────────────────────
  type OldSubscriptionRecord = {
    companyName : Text; status : Text; startDate : ?Time.Time;
    trialEndsAt : ?Time.Time; plan : Text; updatedAt : Time.Time;
  };

  // ── New types ─────────────────────────────────────────────────────────────────
  type SubscriptionTier = { #starter; #growth; #enterprise };
  type NewSubscriptionRecord = {
    companyName : Text; status : Text; startDate : ?Time.Time;
    trialEndsAt : ?Time.Time; plan : Text; updatedAt : Time.Time;
    tier : SubscriptionTier; vehicleLimit : Nat;
  };

  // ── State record shapes ───────────────────────────────────────────────────────
  type OldActor = {
    subscriptionRecords : Map.Map<Text, OldSubscriptionRecord>;
  };

  type NewActor = {
    subscriptionRecords : Map.Map<Text, NewSubscriptionRecord>;
  };

  public func run(old : OldActor) : NewActor {
    let subscriptionRecords = old.subscriptionRecords.map<Text, OldSubscriptionRecord, NewSubscriptionRecord>(
      func(_key, r) {
        { r with tier = #starter; vehicleLimit = 10 }
      }
    );
    { subscriptionRecords };
  };
};
