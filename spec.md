# FleetGuard

## Current State
All data stores (vehicles, parts, maintenance records, work orders, vendors, warranties, service schedules, chat messages, company settings, currency) are global. Every authenticated user across all companies sees and shares the same data. This is a critical security and privacy bug.

## Requested Changes (Diff)

### Add
- `userToCompany: Map<Principal, Text>` — tracks which company each user belongs to
- `companyId: Text` field on all per-company data types: Vehicle, Part, MaintenanceRecord, PartFull, MaintenanceRecordFull, WorkOrder, Vendor, Warranty, ServiceSchedule, ChatMessage
- `companySettingsStore: Map<Text, CompanySettings>` — per-company settings
- `defaultCurrencies: Map<Text, Text>` — per-company currency
- `getCallerCompanyId` helper that resolves caller → companyId
- Auto-register admin in `userToCompany` on first `saveCompanySettings` call
- Stamp invite tokens with the creating admin's companyId so redeemed users join the right company

### Modify
- All `create*` functions: stamp `companyId = callerCompanyId` before storing
- All `get*` / `getAll*` query functions: filter results by `callerCompanyId`
- `saveCompanySettings`: register caller as new company if not registered, store per-company
- `getCompanySettings`: return only the caller's company settings
- `getDefaultCurrency` / `saveDefaultCurrency`: per-company keyed by companyId
- `createInviteToken`: stamp token with admin's companyId
- `redeemInviteToken`: add new user to `userToCompany` with token's companyId
- All counter vars (nextVehicleId etc.) made per-company using `Map<Text, Nat>`

### Remove
- Global `var companySettings : ?CompanySettings` (replaced by per-company map)
- Global `var defaultCurrency : Text` (replaced by per-company map)

## Implementation Plan
1. Add `companyId: Text` to all data types
2. Add `var userToCompany = Map.empty<Principal, Text>()` and `getCallerCompanyId` helper
3. Change `companySettings` and `defaultCurrency` to per-company maps
4. Update all CRUD functions to stamp and filter by companyId
5. Update invite token to carry companyId, register users on redeem
6. Update per-company ID counters
7. Update backend.d.ts to include companyId fields
