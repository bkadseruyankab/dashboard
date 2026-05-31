# Task 4-c: Update Pembiayaan API Route for OPD Role

## Summary
Updated `/src/app/api/admin/pembiayaan/route.ts` to support OPD role-based access control.

## Changes Made

### New Helper Functions
1. **`getOpdIdForTahun(opdKode, tahunAnggaranId)`** - Finds the OPD record id for a given kodeOpd and tahunAnggaranId combination. Used to filter/create records scoped to an OPD.
2. **`getUserRoleAndOpdKode(session)`** - Extracts the user's role and opdKode from the session. Returns null opdKode for non-OPD users.

### Endpoint Changes

#### GET
- If the authenticated user has "opd" role, filters pembiayaan records by `opdId` matching their OPD record for the selected tahun anggaran
- Non-OPD users and unauthenticated users see all records (no change from before)

#### POST
- If user has "opd" role: automatically sets `opdId` to their OPD record id for the selected tahun anggaran
  - Returns 403 if their OPD is not found in that tahun anggaran
- Admin/superadmin users: can optionally provide `opdId` in the request body, or leave it null for global data

#### PUT
- If user has "opd" role: verifies the existing record's `opdId` matches their OPD before allowing update
  - Returns 403 ("Anda tidak memiliki akses untuk mengubah data ini") if mismatch

#### DELETE
- If user has "opd" role: verifies the existing record's `opdId` matches their OPD before allowing delete
  - Returns 403 ("Anda tidak memiliki akses untuk menghapus data ini") if mismatch

## Verification
- Lint check passes
- Dev server running without errors
- All existing functionality (search, pagination, validation, auto-sync) preserved
