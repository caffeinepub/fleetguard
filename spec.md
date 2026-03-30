# FleetGuard

## Current State

- Work Orders page: rows have separate edit (pencil) button — the row card itself is not clickable
- Service Schedules page: table rows have separate edit (pencil) button — rows themselves are not clickable
- Service Schedule completion flow: calls `markScheduleComplete()`, then finds/opens an existing maintenance record in `MaintenanceModal`. No work order number is auto-assigned to the resulting maintenance record — the record's `workOrderId` is only set when coming from work order completion
- `MaintenanceModal` accepts `workOrderNumber?: string` — this prop does not currently exist

## Requested Changes (Diff)

### Add
- Clickable row behavior on work order cards (entire card opens edit modal on click)
- Clickable row behavior on service schedule table rows (entire row opens edit modal on click)
- Auto-created work order when marking a service schedule complete: call `actor.createWorkOrder()` before `markScheduleComplete()`, get the returned ID, attach it to the completion record so `workOrderId` is saved on the maintenance record
- `workOrderNumber` optional prop on `MaintenanceModal` — displayed in the completion banner so user can see the auto-assigned WO number

### Modify
- `WorkOrdersPage`: add `cursor-pointer` and `onClick={() => openEdit(wo)}` to the card div; wrap action buttons in a container that stops click propagation
- `ServiceSchedulesPage`: add `cursor-pointer` and `onClick={() => openEdit(s)}` to each `<tr>`; wrap the Actions `<td>` content with `onClick stopPropagation`; in `handleMarkComplete`, create a work order first, then pass `workOrderId` and `workOrderNumber` through to the modal
- `MaintenanceModal`: accept optional `workOrderNumber?: string` prop; when set, display the auto-assigned WO number in the completion banner alongside the "Completed by" info

### Remove
- Nothing removed

## Implementation Plan

1. **WorkOrdersPage.tsx**
   - Add `cursor-pointer` class to each work order card div
   - Add `onClick={() => openEdit(wo)}` to the card div
   - Wrap the action buttons div in a `<div onClick={(e) => e.stopPropagation()}>` to prevent row click from firing when buttons are clicked

2. **ServiceSchedulesPage.tsx**
   - Import `WorkOrderPriority`, `WorkOrderStatus`, `WorkOrder` from `../backend`
   - Add `formatWONumber` helper
   - Add `newWorkOrderNumber` state (string)
   - Add `cursor-pointer` style to each `<tr>` and `onClick={() => openEdit(s)}`
   - Wrap the Actions `<td>` in a container that stops propagation: `<td onClick={(e) => e.stopPropagation()} ...>`
   - In `handleMarkComplete`:
     a. Before `markScheduleComplete`, call `actor.createWorkOrder({ title: schedule.serviceType, vehicleId, status: WorkOrderStatus.Completed, ... })` and capture `newWoId`
     b. After fetching fresh records, set `workOrderId: newWoId` on the `completionRecord`
     c. Set `newWorkOrderNumber(formatWONumber(newWoId))` state
   - Pass `workOrderNumber={newWorkOrderNumber}` to `MaintenanceModal`
   - Clear `newWorkOrderNumber` in `onClose`

3. **MaintenanceModal.tsx**
   - Add `workOrderNumber?: string` to Props interface
   - In the completion banner section: if `workOrderNumber` is provided, add a second line showing "Auto-assigned Work Order: [WO-XXXX]"
