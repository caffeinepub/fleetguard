# FleetGuard

## Current State
FleetGuard is a fleet maintenance management app with:
- Full backend (Motoko) with vehicles, maintenance records, parts, work orders, service schedules, vendors, warranties, chat, company settings, subscriptions
- `MaintenanceRecordFull` has: id, vehicleId, date, maintenanceType, description, cost, mileage, technicianName, nextServiceDate, partsUsed (Array<bigint>), createdAt, workOrderId
- Frontend with Dashboard, Vehicles, Maintenance, Parts, Work Orders, Service Schedules, Vendors, Warranties, Reports, Group Chat, Settings, Dev Portal
- Dev portal accessible via `?devKey=FLEETGUARD_DEV_2026` with subscription management
- Existing dark sidebar, light content area
- Maintenance records table has edit button per row (not clickable rows)
- Parts selection in maintenance modal has no quantity field
- No labor hours/cost fields in maintenance records
- Footer text "Built with caffeine.ai" in Settings, Onboarding, InviteAccept pages and Dev Portal
- Fleet Manager has some restrictions; no explicit full-access except user/delete
- No Privacy Policy or Terms of Service pages
- No dark mode

## Requested Changes (Diff)

### Add
- Dark mode toggle in header and Settings page (persist preference in localStorage)
- Labor Hours and Labor Cost fields to maintenance records (backend: optional fields `laborHours?: number`, `laborCost?: number`)
- Part quantity selection in MaintenanceModal: per-part quantity input (default 1), auto-calculate cost = sum(qty × price)
- `partQuantities: Array<{partId: bigint, quantity: bigint}>` field on MaintenanceRecordFull backend
- Approve/Reject company status in Dev Portal dashboard
- Privacy Policy page (`/privacy-policy` route, accessible from footer)
- Terms of Service page (`/terms` route, accessible from footer)

### Modify
- Maintenance record rows: make entire row clickable (cursor-pointer, opens modal for edit)
- MaintenanceModal: add Labor Hours + Labor Cost fields; update parts section to show quantity spinner per part
- Dev Portal: add Approve/Reject company actions alongside subscription management (store `approvalStatus` per company in `CompanySettings`)
- Fleet Manager role: update role checks so FleetManagers have full access to all features EXCEPT: cannot create/remove users (invite tokens) and cannot delete any data
- Footer text: replace "Built with ❤️ using caffeine.ai" with "© [year] FleetGuard. All rights reserved." in Settings, OnboardingPage, InviteAcceptPage, and DevPortalPage
- App.tsx: add routes for `privacy-policy` and `terms` pages

### Remove
- All references to caffeine.ai branding in user-visible footers (keep config.ts as-is)

## Implementation Plan
1. Regenerate backend with new optional fields on MaintenanceRecordFull: `laborHours`, `laborCost`, `partQuantities`; add `approvalStatus` to CompanySettings; add `approveCompany` / `rejectCompany` backend methods
2. Update backend.d.ts to match new types
3. Update MaintenanceModal: add quantity input per selected part, labor hours/cost fields, recalculate total cost automatically
4. Update MaintenancePage: make rows clickable to open edit modal
5. Add dark mode: CSS variables for dark theme in index.css, toggle in Layout header + Settings
6. Update DevPortalPage: add approve/reject buttons per company
7. Update Fleet Manager permission checks across all pages
8. Replace caffeine.ai footer text across all affected pages
9. Create PrivacyPolicyPage and TermsOfServicePage
10. Add page routes in App.tsx
