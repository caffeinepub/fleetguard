# FleetGuard

## Current State
FleetGuard is a fleet maintenance SaaS app with:
- Service Schedules page with mark-complete flow that opens MaintenanceModal
- Cancel-revert logic using completionSnapshot and completionSavedRef
- Parts page with usage history dialog
- Role-based access (Admin/FleetManager/Mechanic)
- CSV export on all list pages (PDF already removed from UI buttons)
- exportPDF function exists in exportUtils.ts but is unused

## Requested Changes (Diff)

### Add
- Parts Usage History: ensure each entry shows Work Order #, Date, Mechanic name, Qty used, and is clickable to open full maintenance record (already partially implemented — verify and complete)

### Modify
- Service Schedule Completion: when user marks schedule complete, auto-open the MaintenanceModal with `requireCompletion=true`; record must be saved to Maintenance History with all costs (parts + labor); if user cancels, revert schedule back to Open status using updateServiceSchedule with original snapshot data. **Critical bug to fix**: the `updateServiceSchedule` call in the cancel-revert passes `lastCompletedDate` as `[] | [bigint]` array but the backend type expects `Time | undefined`. Fix the Candid encoding of the revert call so it uses the correct format — pass `lastCompletedDate` as `undefined` when the array is empty, or unwrap the first element.
- User Role Permissions: confirm and enforce — all roles EXCEPT Mechanic (Admin + FleetManager) can add/edit/delete Fleet/Vehicles, Parts, Vendors, Warranties. Mechanics can only log maintenance and view data. Add canCreate/canEdit guards on all Add/Edit buttons in VehiclesPage, PartsPage, VendorsPage, WarrantiesPage.
- Export: remove the `exportPDF` function from exportUtils.ts and ensure no PDF export buttons exist anywhere in the app.

### Remove
- `exportPDF` function from `src/frontend/src/lib/exportUtils.ts`
- Any remaining PDF export buttons or options in any page

## Implementation Plan
1. Fix the cancel-revert in ServiceSchedulesPage.tsx: in the `onClose` handler's `updateServiceSchedule` call, convert `lastCompletedDate` from `[] | [bigint]` to `bigint | undefined` before sending
2. Verify role guards (canCreate/canEdit) are present in VehiclesPage, PartsPage, VendorsPage, WarrantiesPage — all should check `isAdmin || fleetRole === FleetRole.FleetManager`
3. Remove exportPDF from exportUtils.ts
4. Verify Parts Usage History dialog: shows WO#, date, mechanic, qty; rows are clickable; opens maintenance record modal
5. Validate and build
