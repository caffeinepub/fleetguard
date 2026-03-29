# FleetGuard

## Current State
FleetGuard is a full-stack fleet maintenance app with vehicles, maintenance records, work orders, service schedules, parts inventory, vendors, warranties, reports, and a developer portal. Role-based access (Admin, Fleet Manager, Mechanic). Backend in Motoko, frontend in React/TypeScript.

## Requested Changes (Diff)

### Add
- Filters & sorting on Equipment list, Maintenance History, Work Orders, Parts Inventory (search, type/status filters, sort by multiple columns)
- Print/export single asset's full maintenance record (print dialog, print-friendly layout)
- Dashboard widget: Top Reasons for Repair (bar chart of maintenance types from all records)
- Dashboard widget: Monthly Repair Cost chart (bar chart of repair costs grouped by month)
- Service Schedule scope selector: apply to All Assets, By Category (Truck/Trailer/etc.), or Individual vehicles — frontend creates one schedule per matching vehicle
- Corporate Group Chat page: all authenticated users can send/view messages in a company-wide group chat
- Backend: ChatMessage type with CRUD (sendChatMessage, getChatMessages)

### Modify
- Fix company settings save bug: ensure buildSavePayload produces a correctly typed CompanySettings object; add console.error logging on failure
- Fleet Manager permissions: ensure isAdmin OR isFleetManager check gates WO creation, Service Schedules, Vendors, Parts, Vehicles add-buttons (not just Admin)
- Add GroupChat to sidebar navigation and App.tsx routing

### Remove
- Nothing removed

## Implementation Plan
1. Add ChatMessage Motoko type + sendChatMessage/getChatMessages backend functions
2. Update backend.d.ts with chat interface methods
3. Add useQueries hooks for chat: useChatMessages, useSendChatMessage
4. Fix SettingsPage buildSavePayload type safety and error logging
5. Add filter/sort bars to VehiclesPage, MaintenancePage, WorkOrdersPage, PartsPage (local state filtering, no backend changes)
6. Add Print Asset Record button to VehicleDetailPage (window.print() with print-friendly CSS)
7. Add Top Repair Reasons widget and Monthly Repair Cost chart to DashboardPage using recharts
8. Update ServiceSchedulesPage create modal to include scope selector; on submit, iterate matching vehicles and create one schedule each
9. Ensure Fleet Manager role (isAdmin || fleetRole === FleetManager) can see add-buttons on all pages
10. Create GroupChatPage.tsx with message list, auto-scroll, send input
11. Add 'group-chat' page to App.tsx and Layout.tsx sidebar
