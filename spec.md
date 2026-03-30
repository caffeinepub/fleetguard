# FleetGuard - Developer Dashboard Enhancement

## Current State
The DevPortalPage.tsx exists (~1221 lines) with a dark-themed panel using tabs for Companies, Discount Codes, and Stripe Settings. It renders as a full-page overlay (no sidebar navigation) with basic card/table layout. It uses amber/dark styling. Access is gated by devKey in localStorage + II authentication enforced in App.tsx.

Existing backend APIs: getAllCompanyRegistrationsWithKey, getAllCompanyApprovalsWithKey, getAllSubscriptionsWithKey, approveCompanyWithKey, rejectCompanyWithKey, createDiscountCodeWithKey, deleteDiscountCodeWithKey, updateSubscriptionStatusWithKey, startTrialWithKey.

## Requested Changes (Diff)

### Add
- Full sidebar navigation layout (separate from main app Layout) with sections: Dashboard/Analytics, Companies, Subscriptions, Discount Codes, Stripe Settings, Email Tool
- Analytics section: stat cards (total companies, active/trial/pending/rejected counts, estimated MRR), simple charts
- Subscriptions section: dedicated page showing all subscriptions with trial end dates, status, cancel ability
- Email Tool section: compose interface with To (all companies / individual), Subject, Body, Send button
- Dark/light mode support within dev dashboard
- Navy blue + green accent color scheme

### Modify
- Replace flat tab layout with proper sidebar nav layout
- Companies section: show Pending/Approved/Rejected/Active status badges clearly, one-click approve/reject buttons inline
- Stripe Settings: keep existing key management, improve layout/UX
- Discount Codes: keep existing create/delete, add edit capability

### Remove
- Old flat tab-based layout
- Amber color scheme (replace with navy/green)

## Implementation Plan
1. Rebuild DevPortalPage.tsx as a standalone dashboard with its own sidebar navigation
2. Implement 7 sections as separate view states: Analytics, Companies, Subscriptions, Discount Codes, Stripe Settings, Email Tool
3. Analytics: compute stats from company + subscription data, show stat cards and simple bar/donut charts using recharts
4. Subscriptions: dedicated table with trial end countdown, status badge, cancel button per row
5. Email Tool: form with recipient selector (all / select companies), subject, body textarea, send action (frontend-only toast for now since email is disabled)
6. Design: navy sidebar (oklch dark blue), green accent buttons, dark/light mode toggle, Stripe/Linear-inspired card layout
7. Maintain all existing devKey + II auth gating from App.tsx
