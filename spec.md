# FleetGuard

## Current State

- Service Schedules: when a schedule is marked complete, a work order is **immediately created as `Completed`** status, then `completeWorkOrder` is called again on save — redundant and wrong. The work order never appears as `Open` in the Work Orders section.
- Work Orders: when marked complete there, opens MaintenanceModal and the record is saved to Maintenance History.
- Work Orders page: functional flat card list but visually dated — plain cards with no visual hierarchy, no status columns, no modern table/kanban treatment.
- MaintenancePage: shows all saved maintenance records in a table (Maintenance History).

## Requested Changes (Diff)

### Add
- When a service schedule is completed: create the work order with `status: Open` (not Completed), assign it a WO number, and display it in the Work Orders section as **Open**. Do NOT create the maintenance record yet.
- When that work order is then marked Complete in the Work Orders section: open the MaintenanceModal, collect the maintenance record, and on save move the record to Maintenance History.
- Modern, visually appealing redesign of the Work Orders page: status-based visual grouping or a rich card/table layout with color-coded priority/status badges, better typography, action buttons, summary stats bar at the top.

### Modify
- `ServiceSchedulesPage.tsx` — `handleMarkComplete`: change work order creation to `status: Open`. Remove the immediate `completeWorkOrder` call from the `onSaved` callback. Do NOT open the MaintenanceModal from within the schedule completion flow — just create the Open work order, mark the schedule complete on backend, show a toast "Schedule completed — WO-XXXX created and added to Work Orders as Open", and close.
- `WorkOrdersPage.tsx` — `handleComplete`: keep existing flow (open MaintenanceModal, on save call `completeWorkOrder` and create maintenance record). Also improve the page UI significantly (see Add above).
- Cancel behavior in service schedule completion: if the schedule was marked complete but the user cancels before the work order was committed, revert the schedule status back to Open (existing logic is correct, just don't open the maintenance modal).

### Remove
- `onSaved` callback calling `actor.completeWorkOrder` from within ServiceSchedulesPage (that responsibility moves to WorkOrdersPage).
- Opening MaintenanceModal directly from service schedule completion flow.

## Implementation Plan

1. **ServiceSchedulesPage.tsx**: In `handleMarkComplete`, change `createWorkOrder` payload to `status: WorkOrderStatus.Open`. Remove `maintenanceModalOpen` state and all MaintenanceModal-related code from this page. After creating the open work order and calling `markScheduleComplete`, show toast "Schedule completed — WO-XXXX created in Work Orders as Open" and refresh schedules list. Keep the cancel/revert logic for reverting the schedule if user bails.

2. **WorkOrdersPage.tsx — logic**: The existing `handleComplete` flow is already correct — it opens MaintenanceModal, saves the record to maintenance history, and marks the WO as Completed. No functional changes needed here beyond ensuring the flow works when the WO originated from a service schedule.

3. **WorkOrdersPage.tsx — UI redesign**:
   - Add a summary stats bar: total WOs, Open count, In Progress count, Completed count — color-coded cards.
   - Redesign work order cards: larger priority color indicator on left edge, clearer status badge (color-coded), vehicle and mechanic info with icons, WO number in prominent monospace chip.
   - Add subtle hover states, smooth transitions.
   - Group or visually differentiate Open/In Progress vs Completed/Cancelled.
   - Keep all existing functionality (filters, search, complete button, edit, delete, print).
