# FleetGuard — Version 27

## Current State
FleetGuard is a full-stack fleet maintenance app with dashboard, service schedules, reports, and vehicle detail pages. Service Schedules fail to save due to a Candid encoding bug. Reports and dashboard charts are functional but not visually polished. Print functionality exists on VehicleDetailPage but doesn't respect applied filters.

## Requested Changes (Diff)

### Add
- Date range, service type, and status filters on VehicleDetailPage maintenance history table
- Print/export respects active filters (only filtered rows printed)
- Company logo + professional header in print output on all report pages

### Modify
- **Service Schedules bug fix**: In ServiceSchedulesPage, `lastCompletedDate` is passed as `[] | [bigint]` (Candid array style) to the Backend wrapper, but `to_candid_record_n26` expects `bigint | undefined`. An empty array `[]` is truthy in JS, causing `candid_some([])` instead of `candid_none()`. Fix: pass `undefined` when no date, pass `bigint` value directly when present.
- **ReportsPage**: Redesign with company logo in header, professional print layout with report metadata (date, company name), section headings, colored stat cards, clean table styling, better print CSS
- **DashboardPage charts**: Upgrade bar charts to use Cell-based coloring (each bar a different color), add gradient fills, better tooltips with formatted values, custom bar labels, improved chart margins and typography. Use a vibrant color palette.

### Remove
- Nothing removed

## Implementation Plan
1. Fix `ServiceSchedulesPage.tsx`: change `lastCompletedDate: []` to omit the field (undefined), and `lastCompletedDate: [val]` to `lastCompletedDate: val` when passing to the typed backend methods. The `handleSubmit` data objects must use `lastCompletedDate?: bigint` style.
2. Update `VehicleDetailPage.tsx`: add filter controls (date range inputs, service type select, status is not applicable here) above the maintenance table; filter `sortedRecords` by those inputs; print button already calls `window.print()` so filtered rows are what's on screen.
3. Redesign `ReportsPage.tsx`: add company logo to print header, professional styled print CSS, better stat card layouts with gradient/color accents, section dividers.
4. Redesign dashboard charts in `DashboardPage.tsx`: use Recharts `Cell` for multi-color bars, richer tooltips, gradient defs, modern color palette (blues, greens, purples, ambers).
