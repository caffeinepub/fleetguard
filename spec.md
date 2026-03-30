# FleetGuard

## Current State
The backend has a single global data store for all companies. `vehicleStore`, `maintenanceStore`, `partStore`, `workOrderStore`, `vendorStore`, `warrantyStore`, and `serviceSchedules` are all single Maps shared across every user from every company. There is no `companyId` field on any record and no per-company filtering in any query. Any authenticated principal passes the `#user` permission check and reads data from all companies.

Additional issues:
- `companySettings` is a single `var` — the last company to save overwrites everyone else's settings.
- No rejected-account enforcement on login.
- Fleet roles are global, not per-company.
- First user is not automatically made Admin for their company.

## Requested Changes (Diff)

### Add
- `userCompanyMap: Map<Principal, Text>` — maps each principal to their companyId (using companyName as the ID).
- Per-company stores for all data: vehicles, parts, maintenance, work orders, vendors, warranties, service schedules — keyed by `companyId` as outer key.
- `companySettingsStore: Map<Text, CompanySettings>` — per-company settings.
- `companyFleetRoles: Map<Text, Map<Principal, FleetRole>>` — fleet roles per company.
- `getCallerCompanyId()` public query — frontend can check if user is registered to a company.
- `getCompanyApprovalStatus(companyName)` public query — frontend checks rejection status on login.
- On `saveCompanySettings`, register the caller in `userCompanyMap`; if first user for that company, assign #Admin fleet role.
- Frontend: on login, check approval status and force logout if rejected.
- Frontend: Dev Dashboard only accessible via Internet Identity.

### Modify
- All CRUD functions use `getCompanyId(caller)` to scope reads/writes to the caller's company.
- `getDashboardStats` scoped to caller's company.
- `getCompanySettings` returns the caller's own company settings.
- Fleet role functions scoped per company.

### Remove
- Global single `companySettings` variable.
- Global shared vehicle/part/maintenance/workorder/vendor/warranty/schedule stores.

## Implementation Plan
1. Rewrite `main.mo` with per-company data stores (nested Maps keyed by companyId).
2. Update `backend.d.ts` to reflect new function signatures (mostly unchanged).
3. Update frontend to call `getCompanyApprovalStatus` on login and block rejected companies.
4. Ensure Dev Dashboard requires Internet Identity login.
5. Validate and deploy.
