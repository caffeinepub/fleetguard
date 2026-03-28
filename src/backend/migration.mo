import List "mo:core/List";
import Time "mo:core/Time";

module {
  // Old company settings type (pre-migration)
  type OldCompanySettings = {
    companyName : Text;
    logoUrl : Text;
  };

  // New company settings type (post-migration)
  type NewCompanySettings = {
    companyName : Text;
    industry : Text;
    fleetSize : Text;
    contactPhone : Text;
    logoUrl : Text;
    adminPrincipal : Text;
    createdAt : Time.Time;
  };

  // Convert old company settings to new
  func migrateCompanySettings(old : OldCompanySettings) : NewCompanySettings {
    {
      companyName = old.companyName;
      industry = "";
      fleetSize = "";
      contactPhone = "";
      logoUrl = old.logoUrl;
      adminPrincipal = "";
      createdAt = 0;
    };
  };

  type OldActor = {
    companySettings : ?OldCompanySettings;
  };

  type NewActor = {
    companySettings : ?NewCompanySettings;
    allCompanyRegistrations : List.List<NewCompanySettings>;
  };

  public func run(old : OldActor) : NewActor {
    {
      companySettings = switch (old.companySettings) {
        case (null) { null };
        case (?settings) { ?migrateCompanySettings(settings) };
      };
      allCompanyRegistrations = List.empty<NewCompanySettings>();
    };
  };
};
