# FleetGuard

## Current State
- Work orders exist with auto-assigned `id` but no formatted number is displayed
- Maintenance history has no reference to which work order created the record
- Service schedules have a save bug (root cause: type issues with optional fields)
- No print option for work orders

## Requested Changes (Diff)

### Add
- `workOrderId: ?Nat` field to `MaintenanceRecordFull` (via a new `workOrderLinkStore` map, not touching the stored internal type)
- `workOrderLinkStore: Map<Nat, Nat>` in backend to map maintenanceRecordId -> workOrderId
- Work order number column in Maintenance History table showing `WO-XXXX` badge when record came from a work order
- Print button on Work Orders page that opens a print-friendly view

### Modify
- `completeWorkOrder` backend function: store the link in `workOrderLinkStore` after creating the maintenance record
- `toFull` backend function: look up `workOrderLinkStore` to populate `workOrderId`
- `WorkOrdersPage`: display `WO-XXXX` formatted number on each work order card
- `MaintenancePage`: add "Work Order #" column showing `WO-XXXX` badge when applicable
- Service schedule save: fix optional field handling — ensure `lastCompletedDate` and any optional bigint fields use `[] | [bigint]` Candid format, not `undefined`. Also fix work order `scheduledDate` and `completedDate` to use `[]` instead of `undefined`
- `backend.did.d.ts` and `backend.d.ts`: add `workOrderId: [] | [bigint]` to `MaintenanceRecordFull`

### Remove
- Nothing removed

## Implementation Plan
1. Update `main.mo`: add `workOrderLinkStore`, update `toFull`, update `completeWorkOrder`
2. Update `backend.did.d.ts` and `backend.d.ts`: add `workOrderId` to `MaintenanceRecordFull`
3. Update `WorkOrdersPage.tsx`: show `WO-XXXX` number, add print functionality
4. Update `MaintenancePage.tsx`: add Work Order # column
5. Fix `ServiceSchedulesPage.tsx`: ensure all optional fields use Candid `[] | [bigint]` format
