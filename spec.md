# FleetGuard

## Current State

The Developer Portal (accessed via `?devKey=FLEETGUARD_DEV_2026`, restricted to the developer's principal ID) has a Companies tab that shows all registered companies with Approve/Reject actions. There is no way to view, add, remove, or change the role of users within a company from the Dev Portal. Removing a company only changes its status to "rejected" — it does not delete the company or its users.

The backend has:
- `getCompanyUsers()` — lists users in the **caller's** company only (not usable from the dev portal)
- `setUserFleetRole()` — changes a user's role within the **caller's** company only
- `rejectCompany()` / `approveCompany()` — change company status
- No function to remove a user from a company
- No function to delete a company entirely
- No devKey-bypass versions of user management functions

## Requested Changes (Diff)

### Add
- **Backend:** `getCompanyUsersWithKey(devKey, companyId)` — returns all users in any company
- **Backend:** `removeUserFromCompanyWithKey(devKey, companyId, user: Principal)` — removes a user from the company's fleet roles map, userCompanyMap, and ACL; immediate access revocation
- **Backend:** `setUserFleetRoleWithKey(devKey, companyId, user: Principal, role: FleetRole)` — changes a user's role in any company
- **Backend:** `deleteCompanyWithKey(devKey, companyId)` — fully removes the company, all its data, and all its users; sets approval to rejected so any cached session is immediately invalidated
- **Backend:** `addUserToCompanyWithKey(devKey, companyId, user: Principal, role: FleetRole)` — directly enrolls a principal into a company with a given role
- **Frontend:** Companies tab in DevPortalPage gets an expandable user list per company row showing each user's principal (truncated), display name, and role
- **Frontend:** Role-change dropdown per user row that calls `setUserFleetRoleWithKey`
- **Frontend:** Remove user button per user row that calls `removeUserFromCompanyWithKey`; user is immediately logged out on next action
- **Frontend:** "Add User" form per company (principal ID + role) that calls `addUserToCompanyWithKey`
- **Frontend:** "Delete Company" button at the company row level that calls `deleteCompanyWithKey`; confirms before executing; all that company's users lose access immediately

### Modify
- **Frontend:** Companies tab row — add expand/collapse toggle to show user list panel below the row
- **Frontend:** Rejection flow — keep existing reject button but also allow full deletion

### Remove
- Nothing removed

## Implementation Plan

1. **Backend (main.mo):** Add 5 new public functions with devKey validation:
   - `getCompanyUsersWithKey` — reads `cFleetRoles[companyId]` and cross-references `userCompanyMap` to build `[CompanyUserInfo]`
   - `removeUserFromCompanyWithKey` — deletes user from `cFleetRoles[companyId]`, removes `userCompanyMap[user]`, removes from `accessControlState.userRoles[user]`
   - `setUserFleetRoleWithKey` — updates `cFleetRoles[companyId][user]` with the new role
   - `deleteCompanyWithKey` — removes all company data stores, removes all users belonging to the company, sets approval status to "rejected", removes from `allCompanyRegistrations`
   - `addUserToCompanyWithKey` — sets `userCompanyMap[user] = companyId`, sets `cFleetRoles[companyId][user] = role`, sets `accessControlState.userRoles[user] = #user`

2. **Frontend (backend.d.ts + backend.did.js):** Add type declarations and Candid IDL entries for the 5 new functions

3. **Frontend (DevPortalPage.tsx):** 
   - Add expand/collapse state per company row
   - Expandable panel shows a table of users with name, truncated principal, role dropdown, and remove button
   - "Add User" row at the bottom of the panel with principal ID input and role selector
   - "Delete Company" button in the company row actions
   - All mutations call `...WithKey(DEV_KEY, companyId, ...)` and refresh the user list on success
   - Immediate visual feedback via toast notifications
