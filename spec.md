# FleetGuard

## Current State
FleetGuard is a fleet maintenance app with sidebar navigation, parts inventory, work orders, and service schedules. The backend has `ServiceSchedule` with `lastCompletedDate: ?Time` (Candid optional), `PartFull` with a `location` field, and a collapsible sidebar in Layout.tsx.

## Requested Changes (Diff)

### Add
- Sidebar collapse/hide toggle button so users can view data full-width. State persists in localStorage.
- Part categories: predefined list of categories in parts form (repurpose the existing `location` field in the UI as "Category" with a dropdown of common part categories). Add category filter on the parts list page.
- Category search/filter in parts page: a dropdown to filter visible parts by category.

### Modify
- **Service schedule save fix**: The save in `ServiceSchedulesPage.tsx` uses `(actor as any).createServiceSchedule(data)`. The `lastCompletedDate` field must always be passed as `[] | [bigint]` (Candid optional array format), never `undefined`. Ensure the data object passed exactly matches the Candid did.d.ts shape for `ServiceSchedule`. Also ensure `createServiceSchedule` and `updateServiceSchedule` are called directly on the actor (using the Candid-typed actor, not `actor as any`) to ensure proper encoding. If needed, cast data to `ServiceSchedule` type from did.d.ts.
- **Layout.tsx**: Add a collapse toggle button (chevron icon) to the sidebar. When collapsed, the sidebar shows only icons (or hides entirely). Add a floating toggle button visible when sidebar is hidden. Store collapse state in localStorage.
- **PartsPage.tsx**: Replace the text `location` input with a category dropdown. Add a category filter at the top of the parts list. Keep the field name `location` when storing data (maps to backend `location` field) but label it "Category" in the UI. Pre-defined categories: Engine, Brakes, Electrical, Suspension, Transmission, Exhaust, Tires & Wheels, Filters, Body & Frame, Hydraulics, HVAC, Safety, Other.

### Remove
- Nothing removed.

## Implementation Plan
1. Fix `ServiceSchedulesPage.tsx` save: import `ServiceSchedule` from `../declarations/backend.did.d.ts`, cast data to that type, remove `(actor as any)` casts for createServiceSchedule/updateServiceSchedule, ensure `lastCompletedDate` is always `[] | [bigint]`.
2. Update `Layout.tsx`: add `sidebarCollapsed` state (localStorage), add a toggle button, render a collapsed sidebar (icon-only or hidden) when collapsed, add a floating expand button when fully hidden.
3. Update `PartsPage.tsx`: change location input to a Select dropdown with part categories, add a category filter select above the table, filter displayed parts by selected category.
