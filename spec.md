# FleetGuard

## Current State
FleetGuard is a fleet maintenance management app. The MaintenanceModal component handles creating and editing maintenance records. It uses `useCreateMaintenance` and `useUpdateMaintenance` hooks. The backend Candid type for `MaintenanceRecordFull` includes fields: id, mileage, technicianName, nextServiceDate, cost, date, createdAt, partsUsed, description, workOrderId, maintenanceType, vehicleId. Additional frontend-only fields (laborHours, laborCost, partQuantities) are cast on but not persisted. The cancel flow for work order completion blocks canceling. No tax rate exists. Dashboard has repair reasons and cost charts.

## Requested Changes (Diff)

### Add
- Tax rate setting in SettingsPage (stored in localStorage): user can define a tax label (e.g. "GST", "HST") and a percentage rate
- Tax is applied to total cost display in maintenance records, work orders cost summary, parts inventory total, and repairs page header
- Tax breakdown shown in maintenance modal cost summary

### Modify
- Fix maintenance record save: preserve `workOrderId` from original record in the update data object; add inventory decrement on CREATE maintenance (currently only on update); improve error logging
- Cancel on Complete Work Order/Schedule: allow cancel, but revert work order status back to "Open" via `updateWorkOrder`
- Dashboard: update charts to match uploaded image style (pie chart for top repair reasons with legend, bar chart for total costs by month)
- Apply tax rate to cost totals displayed in MaintenancePage header, PartsPage header, and MaintenanceModal cost breakdown

### Remove
- Nothing removed

## Implementation Plan
1. Add `useTaxSettings` hook (localStorage-backed) with `taxLabel` (e.g. "GST") and `taxRate` (0-100 number)
2. Add tax settings UI in SettingsPage — label input, rate input, save button
3. Update MaintenanceModal: add `workOrderId` preservation in save data; add tax line in cost breakdown; add inventory decrement on create (same logic as update)
4. Update MaintenancePage: apply tax to the total repair cost header display
5. Update PartsPage: apply tax label/rate info display
6. Fix cancel flow in WorkOrdersPage: call `actor.updateWorkOrder` to revert status to Open on cancel
7. Update DashboardPage charts to match uploaded image layout (pie + bar side-by-side, clean legend)
