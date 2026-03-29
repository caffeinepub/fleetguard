import Map "mo:core/Map";
import Time "mo:core/Time";
import Nat "mo:core/Nat";

module {
  type OldSubscriptionRecord = {
    companyName : Text;
    status : Text;
    startDate : ?Time.Time;
    updatedAt : Time.Time;
  };

  type NewSubscriptionRecord = {
    companyName : Text;
    status : Text;
    startDate : ?Time.Time;
    trialEndsAt : ?Time.Time;
    plan : Text;
    updatedAt : Time.Time;
  };

  type OldActor = {
    subscriptionRecords : Map.Map<Text, OldSubscriptionRecord>;
  };

  type NewActor = {
    subscriptionRecords : Map.Map<Text, NewSubscriptionRecord>;
  };

  public func run(old : OldActor) : NewActor {
    let newSubs = old.subscriptionRecords.map<Text, OldSubscriptionRecord, NewSubscriptionRecord>(
      func(_companyName, oldRecord) {
        {
          oldRecord with
          trialEndsAt = null;
          plan = "standard";
        };
      }
    );
    {
      old with
      subscriptionRecords = newSubs;
    };
  };
};
