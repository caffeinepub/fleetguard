# FleetGuard

## Current State

FleetGuard is a production-ready multi-tenant fleet maintenance SaaS. The current build includes:
- Parts inventory with fields: name, partNumber, quantityInStock, minStockLevel, location (category), price
- Service Schedules form with fields in order: Apply To, Vehicle/Category, Service Type, Interval, Next Due Date, Notes, Active toggle
- Sidebar navigation: Dashboard, Maintenance (expandable), Fleet, Parts, Vendors, Warranties, Reports, Settings
- No Documents section exists yet
- Backend Part types (`PartCore`, `PartFull`) do not include `manufacturerName` or `inventoryLocation`
- Blob storage component not yet selected

## Requested Changes (Diff)

### Add
- `manufacturerName` (optional text) field to Parts add/edit dialog
- `inventoryLocation` (optional text, e.g. "Shelf B2") field to Parts add/edit dialog
- `manufacturerName` and `inventoryLocation` optional fields to `PartFull` backend type and IDL
- Side-maps in backend for storing manufacturer name and inventory location per part per company
- New `"documents"` page type in App.tsx Page union
- Documents nav item in sidebar, positioned immediately after Reports
- New `DocumentsPage.tsx` with: file upload (PDFs, images, documents), document list with search, filter by asset/vehicle, click to view/download, print selected
- Backend document storage using blob-storage component (upload, list, delete, associate with vehicle/asset)

### Modify
- Parts `PartCore` and `PartFull` types in `main.mo`: add `manufacturerName : ?Text` and `inventoryLocation : ?Text` as optional side-map fields
- `toFullPart` function: merge `manufacturerName` and `inventoryLocation` from side-maps
- `createPart` and `updatePart` backend functions: side-store new optional fields
- `backend.ts` `PartFull` interface: add `manufacturerName?: [] | [string]` and `inventoryLocation?: [] | [string]`
- `backend.ts` Candid encoders/decoders for `PartFull`: include new optional fields
- Parts form `defaultForm` state: add `manufacturerName: ""` and `inventoryLocation: ""`
- Parts form `openEdit`: populate new fields from part data
- Parts form `handleSubmit`: pass new fields to backend
- Parts dialog JSX: add two new Input fields for Manufacturer Name and Inventory Location after Category
- Service Schedules dialog: move Service Type field block to be the first rendered field (before Apply Schedule To / Vehicle selector)
- Layout.tsx `topNavItemsAfter`: add Documents item after Reports

### Remove
- Nothing removed

## Implementation Plan

1. Select `blob-storage` component
2. Update backend `main.mo`:
   - Add `manufacturerName` and `inventoryLocation` side-maps (`cManufacturers`, `cInventoryLocations`)
   - Extend `PartFull` type with two optional fields
   - Update `toFullPart` to merge them
   - Update `createPart` / `updatePart` to side-store them
3. Update `backend.ts`:
   - Add fields to `PartFull` interface
   - Update Candid encoder/decoder for PartFull
4. Update `PartsPage.tsx`:
   - Add `manufacturerName` and `inventoryLocation` to form state
   - Populate on edit
   - Pass to handleSubmit
   - Add two Input fields in dialog (after Category)
5. Update `ServiceSchedulesPage.tsx`:
   - Move Service Type JSX block to be first in the form
6. Update `App.tsx`:
   - Add `"documents"` to Page union type
7. Update `Layout.tsx`:
   - Add Documents nav item after Reports
8. Create `DocumentsPage.tsx`:
   - File upload (uses blob-storage)
   - Document list: name, type icon, associated vehicle, upload date, uploader
   - Search bar (filter by filename)
   - Filter by vehicle dropdown
   - Click row → opens file in new tab or triggers download
   - Print button for selected documents
9. Wire DocumentsPage into App.tsx router
