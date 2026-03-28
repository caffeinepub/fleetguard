# FleetGuard

## Current State
The app has company settings (save, get), onboarding, roles (Admin/Fleet Manager/Mechanic), work orders, vendors, warranties, and a developer portal. `saveCompanySettings` requires `#user` permission, but during onboarding the admin caller may not yet have that role assigned — causing the save to fail silently with a trap. `CompanySettings` has no `currency` or subscription fields. The dev portal shows company sign-ups but has minimal business management capability.

## Requested Changes (Diff)

### Add
- `currency : Text` field to `CompanySettings` (default "CAD")
- `subscriptionStatus : Text` field to `CompanySettings` (default "inactive")
- `subscriptionStartDate : ?Time` field to `CompanySettings`
- `updateSubscriptionStatus(principal, status, startDate)` backend function — dev/admin only
- Dev portal: business dashboard section with total signups, active subscriptions, monthly recurring revenue ($499 × active count), and per-company subscription management (activate/deactivate)
- Settings page: currency selector (CAD/USD) and subscription status display with plan info

### Modify
- `saveCompanySettings`: change permission check from `#user` to a simple non-anonymous check (`caller.isAnonymous()`) AND auto-assign `#user` role to caller if not already a user — fixes the settings save failure during onboarding
- `getAllCompanyRegistrations`: already dev/admin restricted — keep as is
- `CompanySettings` type in backend and both DID files (did.js and did.d.ts)
- Dev portal page: add subscription management UI, revenue summary cards
- Settings page: add currency field saving, show subscription status badge

### Remove
- Nothing removed

## Implementation Plan
1. Update `CompanySettings` Motoko type with `currency`, `subscriptionStatus`, `subscriptionStartDate` fields
2. Fix `saveCompanySettings` permission logic — allow any non-anonymous caller, auto-assign `#user`
3. Add `updateSubscriptionStatus` function to backend
4. Update `backend.did.js` and `backend.did.d.ts` to reflect new type and function
5. Update `SettingsPage.tsx` — add currency selector, subscription status display, pass currency in save calls
6. Update `DevPortalPage.tsx` — add revenue/subscription summary cards and per-company subscription toggle
