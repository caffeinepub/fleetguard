# FleetGuard

## Current State
FleetGuard is a fleet maintenance app with:
- Internet Identity authentication
- 4-step onboarding wizard (any user who logs in for the first time completes it)
- Roles: admin / user (fleet manager) / guest — stored via the authorization mixin
- Admin assigns roles by entering Principal IDs in Settings
- Company settings stored as { companyName, logoUrl }
- Parts inventory, maintenance records, vehicles, dashboard
- Bug: company settings save can fail during onboarding

## Requested Changes (Diff)

### Add
- **Custom fleet roles**: `Admin`, `FleetManager`, `Mechanic` — stored per user in backend alongside the ACL permission level
- **Invite link system**: Admin generates a signed token (UUID-like) linked to an email + fleet role. Token stored in backend. User opens the app URL with `?inviteToken=TOKEN`, logs in with Internet Identity, enters their name, and their fleet role is auto-assigned.
- **Extended company info**: `companyName`, `industry`, `fleetSize`, `contactPhone`, `logoUrl`, `adminPrincipal`, `createdAt` — stored on save during onboarding
- **App developer portal**: A special route `/dev-portal` unlocked by appending `?devKey=FLEETGUARD_DEV_2026` to the URL. Shows a table of all registered companies with: company name, industry, fleet size, contact phone, admin principal, signup date, and placeholder payment schedule (Pending). Only rendered if dev key is in localStorage/URL.
- **Invite management UI in Settings**: Admin can enter email + pick a role (Fleet Manager / Mechanic), generate an invite link, copy it to clipboard. Shows a list of pending/used invites.
- **Invite acceptance page**: When URL has `?inviteToken=TOKEN`, authenticated users see a special onboarding page to enter their name and redeem the token (skipping company setup).

### Modify
- **Onboarding flow**: Only for the account admin (first-time login, no profile). Admin completes company info (name, industry, fleet size, contact phone) + their own name. They become `Admin` role automatically.
- **Roles throughout app**: Replace `user/guest` labels with `Fleet Manager` / `Mechanic`. The ACL permission level: Admin = #admin, FleetManager = #user, Mechanic = #user.
- **Settings page — Team Management**: Replace Principal ID assignment with the invite-link generator. Admin enters email + selects role → generates link → copies it.
- **Role display in sidebar/UI**: Show correct role label (Admin, Fleet Manager, Mechanic).

### Remove
- Old role assignment by Principal ID entry in Settings (replaced by invite links)
- `guest` role references
- Driver role

## Implementation Plan
1. Backend: Add `FleetRole` variant `{#Admin; #FleetManager; #Mechanic}`. Store per-user fleet role in a Map. Add invite token store: `Map<Text, InviteToken>` where `InviteToken = { token, role, email, createdAt, usedBy: ?Principal }`.
2. Backend: Add `createInviteToken(email, role) → Text` (admin only). Add `redeemInviteToken(token) → FleetRole` (any authenticated user — assigns fleet role and ACL permission, marks token used). Add `getInviteTokens() → [InviteToken]` (admin only). Add `getCallerFleetRole() → ?FleetRole`.
3. Backend: Update `saveCompanySettings` to accept and persist extended fields. Add `getAllCompanyRegistrations() → [CompanyRegistration]` gated by a hardcoded developer principal check.
4. Frontend: Update `types.ts` and role enums to use Admin/FleetManager/Mechanic.
5. Frontend: Update `OnboardingPage` — admin onboarding with extended company fields + name. Auto-assigns Admin fleet role on completion.
6. Frontend: Add `InviteAcceptPage` — shown when URL has `?inviteToken=TOKEN` and user is authenticated but has no profile yet. Enter name → redeem token → land on dashboard.
7. Frontend: Update `SettingsPage` — replace Principal ID role assignment with invite link generator. Show invite list.
8. Frontend: Add `DevPortalPage` — unlocked by `?devKey=FLEETGUARD_DEV_2026`. Table of all company registrations.
9. Frontend: Update `App.tsx` — detect `?inviteToken` in URL, route to `InviteAcceptPage`. Detect `?devKey` for dev portal route. Update role labels everywhere.
