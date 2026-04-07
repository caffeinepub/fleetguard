# FleetGuard – Dev Portal Fix + Dashboard Work Orders Widget

## Current State
- Dev Portal loads company list and approvals, but `getCompanyUsersWithKey` calls fail in practice
- `isCallerAdmin` is declared in backend.d.ts and IDL but missing from main.mo, causing runtime traps
- Dev Portal company approvals list is incomplete: companies with no explicit approval entry are never shown in `getAllCompanyApprovalsWithKey`, but the portal expects all registered companies to have an entry
- DevPortalPage reads `devKey` once from localStorage; if somehow empty, all queries silently skip
- Dashboard has no work-order-by-priority widget

## Requested Changes (Diff)

### Add
- `isCallerAdmin` query function to backend main.mo (checks if caller has #Admin fleet role in their company)
- On-register approval entry: when `saveCompanySettings` is called for a new company, add a `"pending"` entry to `companyApprovalStore` so the company shows up immediately in dev portal approvals list
- **Open Work Orders by Priority** widget on DashboardPage — radial/donut chart showing counts by priority (Critical, High, Medium, Low), only counting Open/InProgress statuses, with a legend and count in center

### Modify
- DevPortalPage: re-read devKey from localStorage on every render rather than capturing once, add a guard that shows an error if devKey is missing
- DevPortalPage: improve user load retry — reload users immediately after role/add/remove mutations succeed
- DevPortalPage: Companies section — make the approval status match the full registered list (join company list with approvals map)

### Remove
- Duplicate method declarations in backend.d.ts interface (the 5 dev-portal methods appear twice)

## Implementation Plan
1. Add `isCallerAdmin` to `src/backend/main.mo`
2. Add pending approval entry on `saveCompanySettings` in `src/backend/main.mo`
3. Remove duplicate declarations from `src/frontend/src/backend.d.ts`
4. Update `DevPortalPage.tsx`: fix devKey read, improve user management UX
5. Add Open Work Orders by Priority donut widget to `DashboardPage.tsx`
