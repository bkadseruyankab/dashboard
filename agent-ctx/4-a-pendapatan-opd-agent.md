# Task 4-a: Update Pendapatan API Route for OPD Role

## Summary
Successfully updated `/src/app/api/admin/pendapatan/route.ts` to support OPD role-based access control.

## Changes Made

### 1. `/src/app/api/admin/pendapatan/route.ts`
- Added `getOpdIdForTahun(opdKode, tahunAnggaranId)` helper — looks up OPD record id by kodeOpd within a specific tahunAnggaran
- Added `getUserOpdInfo(session)` helper — extracts user role and resolves opdKode from session's opdId via database lookup
- **GET**: OPD users only see records matching their OPD; admin/superadmin see all
- **POST**: OPD users have opdId auto-set; admin/superadmin can optionally provide opdId
- **PUT**: OPD users can only update records belonging to their OPD; admin/superadmin can change opdId
- **DELETE**: OPD users can only delete records belonging to their OPD

### 2. `/src/components/admin/PendapatanManager.tsx`
- Added `opdId: string | null` to Pendapatan type

### 3. `/src/components/dashboard/types.ts`
- Added `opdId: string | null` to pendapatan array in DashboardData type

### 4. `/src/app/api/dashboard/route.ts`
- Added `opdId: p.opdId` to pendapatan mapping in dashboard response

## Verification
- Lint passes
- Dev server running without errors
- Database schema in sync (opdId already existed on Pendapatan model)
