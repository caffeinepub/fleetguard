# FleetGuard

## Current State
Service Schedules page exists (`ServiceSchedulesPage.tsx`) but is entirely hardcoded with sample data. The backend has no `ServiceSchedule` type or any related methods. The "Add Schedule" dialog shows a placeholder "coming soon" message.

## Requested Changes (Diff)

### Add
- `ServiceSchedule` type in Motoko backend with fields: id, vehicleId, serviceType, intervalDays, nextDueDate, lastCompletedDate (optional), notes, status (Active/Inactive), createdAt
- Backend CRUD: `createServiceSchedule`, `getAllServiceSchedules`, `updateServiceSchedule`, `deleteServiceSchedule`, `markScheduleComplete`
- `markScheduleComplete` sets lastCompletedDate to now and auto-advances nextDueDate by intervalDays
- Frontend: full Create/Edit modal wired to backend
- Frontend: Delete with confirmation
- Frontend: "Mark Complete" action per row
- Frontend: Load real schedules from backend on mount; replace hardcoded sample data
- Frontend: Status auto-derived (Overdue if nextDueDate < now, Upcoming otherwise; Completed shown after mark)

### Modify
- `backend.d.ts` — add ServiceSchedule type and methods
- `backend.did.d.ts` — add ServiceSchedule type and _SERVICE methods
- `backend.did.js` — add IDL definitions
- `ServiceSchedulesPage.tsx` — wire to backend, replace sample data, implement real modal form

### Remove
- Hardcoded `sampleSchedules` array from ServiceSchedulesPage
- "Coming soon" placeholder in the Add Schedule dialog

## Implementation Plan
1. Generate Motoko backend with ServiceSchedule type and CRUD
2. Update frontend declarations (backend.d.ts, backend.did.d.ts, backend.did.js)
3. Rewrite ServiceSchedulesPage to load from backend, with create/edit/delete/complete actions
