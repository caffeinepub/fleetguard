import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Time "mo:core/Time";

module {
  type OldInviteToken = {
    token : Text;
    role : { #Admin; #FleetManager; #Mechanic };
    email : Text;
    createdAt : Time.Time;
    usedBy : ?Principal;
  };

  type OldActor = {
    inviteTokens : Map.Map<Text, OldInviteToken>;
  };

  type NewInviteToken = {
    token : Text;
    role : { #Admin; #FleetManager; #Mechanic };
    email : Text;
    companyId : Text;
    createdAt : Time.Time;
    usedBy : ?Principal;
  };

  type NewActor = {
    inviteTokens : Map.Map<Text, NewInviteToken>;
  };

  public func run(old : OldActor) : NewActor {
    let newInviteTokens = old.inviteTokens.map<Text, OldInviteToken, NewInviteToken>(
      func(_token, oldToken) {
        {
          oldToken with
          companyId = "";
        };
      }
    );
    { inviteTokens = newInviteTokens };
  };
};
