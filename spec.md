# FleetGuard

## Current State
FleetGuard is a production fleet maintenance SaaS. The app has:
- Full backend: vehicles, maintenance records, parts, work orders, service schedules, vendors, warranties, group chat, company settings, subscriptions, approvals
- Onboarding wizard (multi-step) for new companies
- Developer portal (devKey-protected) for viewing companies, approvals, subscriptions
- Sample/seed data auto-loaded on first login (vehicles + parts)
- No trial period tracking
- No discount codes
- No CC collection during signup
- DevPortalPage has company table with subscription/approval management but no discount codes and no promo email section

## Requested Changes (Diff)

### Add
- Backend: `DiscountCode` type with id, code (text), discountType ("percent" | "months_free"), value (nat), description, createdAt, usedCount; stored in `discountCodes` map
- Backend: `createDiscountCodeWithKey(devKey, code)` mutation
- Backend: `getAllDiscountCodesWithKey(devKey)` query
- Backend: `deleteDiscountCodeWithKey(devKey, id)` mutation
- Backend: `validateDiscountCode(code)` public query — returns discount info or null
- Backend: `applyDiscountCode(code)` increments usedCount
- Backend: `SubscriptionRecord` extended with `trialEndsAt?: Time` and `plan: string` fields
- Backend: `startTrial(companyName, trialDays)` - sets subscription to "trial" status with trialEndsAt = now + 7 days
- Backend: `startTrialWithKey(devKey, companyName)` for dev-initiated trial
- Onboarding: final step "Activate Free Trial" — collects card holder name + card number/expiry/CVV (UI only, stored as intent), shows 7-day trial terms, calls startTrial on completion
- DevPortalPage: "Discount Codes" tab/section — list all codes, create new code form (code text, type, value, description), delete button per code
- DevPortalPage: "Send Email" button per company (shows compose modal with subject/body, simulates send with toast since email is disabled)
- DevPortalPage: trial status badge ("Trial" in blue) in addition to active/inactive/cancelled
- DevPortalPage: show trialEndsAt date when status is "trial"

### Modify
- App.tsx: Remove both `useEffect` blocks that call `seedData` and `seedParts`. Remove `seedData` and `seedParts` imports. Remove `seeded`, `partsSeeded` state variables. Remove `vehiclesLoading`/`partsLoading` and related `useAllVehicles`/`useAllParts` imports used only for seeding (keep if used elsewhere).
- `SubscriptionRecord` in backend.d.ts: add optional `trialEndsAt?: Time` and `plan?: string`
- SubBadge in DevPortalPage: add "trial" variant (blue badge)
- `updateSubscriptionStatusWithKey`: accept new "trial" status

### Remove
- `src/frontend/src/lib/seed.ts` contents: replace with empty exports (keep file to avoid import errors, but make functions no-ops)
- All sample data seeding from App.tsx

## Implementation Plan
1. Generate new Motoko backend with DiscountCode type + CRUD + trial tracking
2. Update backend.d.ts and backend.did.js to include new types/methods
3. Strip seed.ts to empty no-op functions
4. Remove seed useEffects and imports from App.tsx
5. Add CC/trial step to OnboardingPage (last step before completion)
6. Add Discount Codes section to DevPortalPage
7. Add promotional email compose modal to DevPortalPage
8. Update SubBadge to handle "trial" status
9. Validate and deploy
