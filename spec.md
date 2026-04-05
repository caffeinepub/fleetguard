# FleetGuard

## Current State
The signup flow is:
1. LoginPage collects company name, industry, fleet size, phone, email
2. User clicks "Continue with Internet Identity" → II login triggers
3. After II auth, OnboardingPage runs steps 1-4 (confirm details → profile name → billing/payment → dashboard)

Billing (Stripe card form) is currently step 3 of the OnboardingPage — it happens AFTER the user has already logged in via Internet Identity.

## Requested Changes (Diff)

### Add
- A billing/payment step in the **LoginPage signup form** (step 3 of the pre-login flow, after company info is collected)
- The payment step shows a card form (simulated for test mode, real Stripe CardElement when Stripe PK is configured)
- A test-mode banner indicating "Test Mode: use any card details to proceed"
- `fleetguard_billing_completed` flag stored in sessionStorage after successful billing step
- II login is only triggered after billing step passes

### Modify
- LoginPage: Add a multi-step signup wizard — Step 1: company details, Step 2: contact info, Step 3: billing/payment
- OnboardingPage: Skip billing step (Step 3) if `fleetguard_billing_completed` is set in sessionStorage (already paid during signup). Clear the flag after reading it.
- The simulated card form validates that card holder, card number (16 digits), expiry (MM/YY), and CVV are filled before allowing proceed
- When Stripe PK is set in localStorage, use real Stripe CardElement; otherwise show the simulated form
- "Start Free Trial" / "Activate" button in billing step calls `startTrial` on backend (or just proceeds if no actor yet, deferring to onboarding)

### Remove
- Nothing removed from existing functionality

## Implementation Plan
1. Refactor LoginPage signup section into a 3-step mini-wizard: Step 1 (company/industry/fleet), Step 2 (phone/email), Step 3 (billing)
2. In Step 3, render billing card form with test-mode notice
3. On billing success, set `sessionStorage.setItem('fleetguard_billing_completed', '1')` and then call `login()` for II
4. In OnboardingPage, check for `fleetguard_billing_completed` flag; if present, skip the payment step (step 3) — auto-advance past it — and clear the flag
5. Validate build passes
