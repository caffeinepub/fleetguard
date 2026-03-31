# FleetGuard — New Signup & User Management

## Current State
- New company onboarding is a 4-step wizard. In Step 2, `saveCompanySettings` is called, which automatically assigns the first caller as `#Admin` in both the system ACL and the company fleet role map. This already works.
- Admins can invite users via `createInviteToken(email, role)` (Fleet Manager or Mechanic only). Invited users redeem via `redeemInviteToken(token)` on `InviteAcceptPage`.
- **Critical bug:** `redeemInviteToken` only sets the redeemed user as `#user` in `accessControlState` — it never registers them to the company in `userCompanyMap`, and never adds their fleet role to `cFleetRoles`. This means invited users land in the app with no company or role.
- **No user list:** There is no `getCompanyUsers()` backend function and no UI for admins to view or manage existing team members' roles.
- **DevPortal has no exit button.** The sidebar has no way to navigate back to the main app.

## Requested Changes (Diff)

### Add
- `companyId: Text` field to the `InviteToken` type (set when the admin creates the token from their own `userCompanyMap` entry)
- `getCompanyUsers()` backend query: returns `[{principal; profile; role}]` for all principals registered in the caller's company's `cFleetRoles` map
- `CompanyUserInfo` type: `{ principal: Principal; profile: ?UserProfile; role: FleetRole }`
- **Manage Team** card in SettingsPage (admin only): table of all company users showing name, role badge, and a dropdown to change their role (Admin / Fleet Manager / Mechanic)
- **Exit to App** button in DevPortalPage sidebar footer

### Modify
- `redeemInviteToken` backend: after marking the token used, also register caller in `userCompanyMap` (using the token's `companyId`) and add their fleet role to `cFleetRoles` for that company
- `createInviteToken` backend: derive `companyId` from `userCompanyMap.get(caller)` and store it in the token
- `setUserFleetRole` backend: ensure it updates `cFleetRoles` for the caller's company (not a global map)
- `SettingsPage` invite form: add `Admin` as a role option so admins can directly invite other admins
- DevPortalPage sidebar: add an "Exit Developer Portal" link at the bottom that navigates to `window.location.origin` (strips the devKey param)

### Remove
- Nothing removed

## Implementation Plan
1. **Backend (Motoko):** Add `companyId` to `InviteToken`, fix `createInviteToken` to store it, fix `redeemInviteToken` to register user in `userCompanyMap` and `cFleetRoles`, add `getCompanyUsers()` function returning `[CompanyUserInfo]`.
2. **Frontend types (backend.d.ts):** Add `CompanyUserInfo` type and `getCompanyUsers` function signature.
3. **Frontend hooks (useQueries.ts):** Add `useGetCompanyUsers` query hook and `useSetUserFleetRole` mutation hook.
4. **SettingsPage:** Add "Manage Team" card above "Invite Team Members" (admin only) showing a table of all users with name, principal (truncated), role badge, and a role selector. Saving calls `setUserFleetRole`.
5. **SettingsPage invite form:** Add `Admin` to the role selector options.
6. **DevPortalPage:** Add an "Exit to App" button at the bottom of the sidebar that calls `window.location.replace(window.location.origin)`.
