# FleetGuard — Reports

## Current State
The app has a sidebar with Dashboard, Maintenance (expandable), Fleet, Parts, Vendors, Warranties, and Settings. There is no Reports section. The app tracks vehicles, maintenance records, parts inventory, work orders, and service schedules.

## Requested Changes (Diff)

### Add
- `ReportsPage` component with multiple printable/exportable report types
- "Reports" nav item in sidebar (between Warranties and Settings)
- `Page` type entry `"reports"` in App.tsx
- Route and import wired in App.tsx

### Modify
- `Layout.tsx`: add Reports nav item (use `BarChart2` or `FileText` icon) between Warranties and Settings
- `App.tsx`: add `"reports"` to Page type, import ReportsPage, render it in switch

### Remove
- Nothing

## Implementation Plan
1. Create `src/frontend/src/pages/ReportsPage.tsx` with these report tabs/sections:
   - **Fleet Summary**: Total vehicles, active/inactive, vehicles by type, table of all vehicles with status
   - **Maintenance Report**: Total records, total repair cost, breakdown by maintenance type (chart or table), top reasons for repair, records table filterable by vehicle
   - **Parts Inventory Report**: Total inventory value (qty × price), low stock parts list, parts table with value column
   - **Work Orders Report**: Total work orders, counts by status (Open/In Progress/Completed/Cancelled), list table
   - Export buttons: "Print" (window.print) and "Export CSV" for each report section
2. Update `Layout.tsx` to add Reports nav item
3. Update `App.tsx` to add the page type and render

Data comes from existing hooks: `useAllVehicles`, `useAllMaintenanceRecords`, `useAllParts`, `useAllWorkOrders`, `useGetCompanySettings`, `useGetDefaultCurrency`.
