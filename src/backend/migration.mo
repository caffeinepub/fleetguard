import Map "mo:core/Map";
import Time "mo:core/Time";

module {

  // ─── Old types (from previous deployment) ────────────────────────────────────
  type OldDiscountCode = {
    id : Nat; code : Text; discountType : Text; value : Nat;
    description : Text; createdAt : Time.Time; usedCount : Nat;
  };

  // ─── New types (current version) ─────────────────────────────────────────────
  type NewDiscountCode = {
    id : Nat; code : Text; discountType : Text; value : Nat;
    description : Text; createdAt : Time.Time; usedCount : Nat;
    expiresAt : ?Int; maxUsageCount : ?Nat; applicableTiers : [Text]; isActive : Bool;
  };

  // ─── Migration input/output types ────────────────────────────────────────────
  type OldActor = {
    discountCodes : Map.Map<Nat, OldDiscountCode>;
  };

  type NewActor = {
    discountCodes : Map.Map<Nat, NewDiscountCode>;
  };

  public func run(old : OldActor) : NewActor {
    let discountCodes = old.discountCodes.map<Nat, OldDiscountCode, NewDiscountCode>(
      func(_id, dc) {
        {
          dc with
          expiresAt = null : ?Int;
          maxUsageCount = null : ?Nat;
          applicableTiers = [] : [Text];
          isActive = true;
        }
      }
    );
    { discountCodes };
  };
};
