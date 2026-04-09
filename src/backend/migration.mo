import Map "mo:core/Map";
import Time "mo:core/Time";

module {

  // ─── Stored type (already upgraded in previous deployment) ───────────────────
  // The previous migration already added expiresAt/maxUsageCount/applicableTiers/isActive.
  // The stored snapshot already has this full shape — so OldActor must match it exactly.
  type StoredDiscountCode = {
    id : Nat; code : Text; discountType : Text; value : Nat;
    description : Text; createdAt : Time.Time; usedCount : Nat;
    expiresAt : ?Int; maxUsageCount : ?Nat; applicableTiers : [Text]; isActive : Bool;
  };

  // ─── Migration input/output types ────────────────────────────────────────────
  type OldActor = {
    discountCodes : Map.Map<Nat, StoredDiscountCode>;
  };

  type NewActor = {
    discountCodes : Map.Map<Nat, StoredDiscountCode>;
  };

  // Pass-through: stored shape already matches new shape, no transformation needed.
  public func run(old : OldActor) : NewActor {
    { discountCodes = old.discountCodes };
  };
};
