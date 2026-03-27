# FleetGuard

## Current State
New project. Empty backend actor and default frontend scaffold.

## Requested Changes (Diff)

### Add
- Vehicle management: add/edit/delete vehicles (trucks, trailers, buses, vans) with fields: name, type, license plate, year, make, model, status (active/inactive)
- Maintenance record logging: log maintenance events per vehicle with fields: date, type (oil change, tire rotation, brake service, engine check, etc.), description, cost, mileage, technician name, next service date
- Dashboard overview: total vehicles, upcoming maintenance alerts, recent maintenance activity, vehicles by type breakdown
- Vehicle detail page: shows vehicle info + all maintenance history for that vehicle
- Maintenance status tracking: overdue, upcoming (within 30 days), up-to-date per vehicle
- Filter/search: filter vehicles by type/status, search by name or plate
- Authorization (role-based): admin can manage everything, staff can add records but not delete vehicles

### Modify
- None (new project)

### Remove
- None (new project)

## Implementation Plan
1. Select `authorization` component for role-based access
2. Generate Motoko backend with Vehicle and MaintenanceRecord data models, CRUD APIs
3. Build frontend with: sidebar nav, dashboard page, vehicles list page, vehicle detail/history page, add-vehicle form, add-maintenance-record form
4. Wire authorization so admin vs staff roles control delete/edit actions
