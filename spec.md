# FleetGuard

## Current State
The backend has all required types and functions in main.mo (vehicles, maintenance, parts, work orders, vendors, warranties, currency, roles, invite tokens, user profiles, company settings), but the deployed canister's DID declarations are outdated — they don't include work orders, vendors, warranties, or the newer features. The frontend's backend.ts already has wrappers for all these features but the ICP actor silently returns early because the methods don't exist on the actor.

## Requested Changes (Diff)

### Add
- Nothing new — all features are already coded in main.mo

### Modify
- Regenerate backend to produce correct DID declarations matching the full main.mo

### Remove
- Nothing

## Implementation Plan
1. Regenerate backend Motoko code to ensure correct compilation and DID generation
2. All data types and functions must match the current backend.d.ts exactly
