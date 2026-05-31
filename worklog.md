---
Task ID: 1
Agent: Main Agent
Task: Implement login feature for the government financial dashboard

Work Log:
- Added User model to Prisma schema (id, name, email, password, role, aktif)
- Ran prisma db push to sync schema with database
- Created /src/lib/password.ts - custom PBKDF2 password hashing (avoids bcryptjs native module issues)
- Created /src/lib/auth.ts - NextAuth.js v4 configuration with Credentials provider
- Created /src/app/api/auth/[...nextauth]/route.ts - NextAuth API route
- Created /src/components/auth/AuthProvider.tsx - SessionProvider wrapper
- Created /src/components/auth/LoginForm.tsx - Beautiful government-themed login page
- Created /src/hooks/use-auth.ts - Custom hook for auth state (useAuth)
- Updated /src/app/layout.tsx - Added AuthProvider wrapping PengaturanProvider
- Updated /src/app/page.tsx - Shows LoginForm when accessing admin without auth
- Updated /src/components/dashboard/DashboardHeader.tsx - Added user avatar dropdown with logout
- Created /src/app/api/admin/users/route.ts - User listing API
- Created /src/app/api/admin/change-password/route.ts - Change password API
- Created /src/components/admin/UserManager.tsx - Account info + change password UI
- Updated /src/components/admin/AdminPanel.tsx - Added "Akun" tab for user management
- Updated /src/components/dashboard/types.ts - Added "akun" to AdminTab type
- Added auth checks (requireAuth) to all admin API write routes (POST, PUT, DELETE)
- Created /src/scripts/seed-admin.ts - Script to seed default admin user
- Seeded default admin user: admin@seruyankab.go.id / admin123

Stage Summary:
- Login feature fully implemented using NextAuth.js v4 with JWT sessions
- Admin panel is now protected - requires login to access
- When clicking "Admin" in sidebar without being logged in, a beautiful login form is shown
- After login, user sees the admin panel with a user avatar dropdown in the header
- User can logout from the dropdown menu
- User can change password from the "Akun" tab in admin
- All admin API write operations (POST/PUT/DELETE) are protected with auth checks
- Default credentials: admin@seruyankab.go.id / admin123
- Password hashing uses PBKDF2 (Node.js built-in crypto) instead of bcryptjs to avoid native module issues in sandbox

---
Task ID: 1
Agent: Main Agent
Task: Implement auto-fill kodeAkun & namaAkun when kategori is selected

Work Log:
- Analyzed existing codebase: DataFormDialog, PendapatanManager, BelanjaManager, PembiayaanManager, RealisasiAkunManager
- Identified that Kategori model has `kodeKategori` and `namaKategori` fields that should auto-fill `kodeAkun` and `namaAkun`
- Added `onSelect` callback to `FormField` type in DataFormDialog.tsx for regular `select` fields
- Modified DataFormDialog to call `onSelect` callback when a select value changes
- Updated PendapatanManager: added `kategoriData` state, reordered fields (kategori first), added `onSelect` callback
- Updated BelanjaManager: same changes as PendapatanManager
- Updated PembiayaanManager: same changes as PendapatanManager
- Updated RealisasiAkunManager: same changes (uses `jenis` field instead of `kategori`)
- All kategori fetch functions now store full kategori data (including `kodeKategori`) in `kategoriData` state
- Lint check passes, dev server running fine

Stage Summary:
- When a user selects a Kategori/Jenis from the dropdown in any manager form, the `kodeAkun` field auto-fills with the kategori's `kodeKategori` and `namaAkun` auto-fills with the kategori's `namaKategori`
- The Kategori/Jenis field is now the first field in the form (before kodeAkun and namaAkun) so auto-fill makes sense visually
- If `kodeKategori` is null/empty, kodeAkun keeps its current value
- Users can still manually edit kodeAkun and namaAkun after auto-fill

---
Task ID: 2
Agent: Main Agent
Task: Implement auto-sync Realisasi Akun from Pendapatan/Belanja/Pembiayaan with kode induk 2 digit grouping

Work Log:
- Added `autoSync` boolean field to RealisasiAkun Prisma schema (default: false)
- Ran `bun run db:push` to sync schema to database
- Created `/src/lib/sync-realisasi-akun.ts` with `syncRealisasiAkun(tahunAnggaranId)` function
  - Extracts kode induk (first 2 segments of kodeAkun, e.g., "4.1.01" → "4.1")
  - Groups Pendapatan/Belanja/Pembiayaan by (kodeInduk, jenis)
  - Aggregates anggaran and realisasi per group
  - Uses kategori name as namaAkun for the parent level
  - Deletes previous auto-synced records then creates new ones
  - Leaves manually entered records (autoSync=false) untouched
- Integrated auto-sync into Pendapatan, Belanja, Pembiayaan API routes
  - Calls `syncRealisasiAkun(tahunAnggaranId)` after POST, PUT, DELETE
- Updated RealisasiAkun API route:
  - Added sync endpoint: POST /api/admin/realisasi-akun?action=sync&tahunAnggaranId=xxx
  - Blocked editing/deleting of auto-synced records (returns 403)
  - Fixed PUT to auto-recalculate persentase when anggaran/realisasi changes
  - Records ordered by jenis then kodeAkun
- Updated RealisasiAkunManager UI:
  - Added info banner explaining auto-sync feature
  - Added "Sync Sekarang" button for manual sync trigger
  - Auto-synced records show "Auto" badge, manual records show "Manual" badge
  - Edit/delete blocked for auto-synced records with toast notification
  - Form labels updated: "Kode Induk (2 digit)" instead of "Kode Akun"
- Added `customActions` prop to GenericCrudTable component
- Added special rendering for autoSync column in GenericCrudTable
- Updated DashboardData type to include autoSync field in realisasiAkun
- Updated dashboard API to include autoSync in realisasiAkun response

Stage Summary:
- Realisasi Akun now auto-syncs in real-time whenever Pendapatan/Belanja/Pembiayaan data changes
- Grouping uses kode induk (first 2 segments of kodeAkun, e.g., "4.1")
- Auto-synced records are protected from manual editing/deletion
- Manual entry is still possible (autoSync=false) but will not override auto-synced records
- All lint checks pass, dev server running without errors

---
Task ID: 3
Agent: Auth Agent
Task: Update authentication system to support OPD role

Work Log:
- Updated /src/lib/auth.ts - NextAuth configuration:
  - Added `opdId: user.opdId ?? null` to the returned user object in `authorize` function
  - Added `token.opdId = (user as { opdId?: string | null }).opdId ?? null` in `jwt` callback
  - Added `(session.user as { opdId?: string | null }).opdId = token.opdId as string | null` in `session` callback
- Updated /src/hooks/use-auth.ts - useAuth hook:
  - Added `opdId: (session.user as { opdId?: string | null }).opdId ?? null` to the user object
- Updated /src/lib/auth-helpers.ts - Auth helpers:
  - Added `import { db } from "@/lib/db"` for database access
  - Added `requireOpdAuth()` function that:
    - Checks if user is authenticated (returns 401 if not)
    - Checks if user has "opd" role and has opdId (returns 403 if not)
    - Looks up the OPD record in the database to get `kodeOpd` (returns 404 if OPD not found)
    - Returns `{ session, opdKode, error: null }` on success
- All lint checks pass
- Dev server running without errors

Stage Summary:
- The authentication system now fully supports the OPD role
- `opdId` flows through the entire auth chain: authorize → JWT token → session
- Client-side `useAuth()` hook exposes `opdId` in the user object
- API routes can use `requireOpdAuth()` to verify OPD role and get the OPD's `kodeOpd`
- Non-OPD users will have `opdId: null` in their session

---
Task ID: 2
Agent: Main Agent
Task: Create seed script for OPD user accounts

Work Log:
- Created `/src/scripts/seed-opd-users.ts` following the pattern of existing `seed-admin.ts`
- Script logic:
  - Finds the active TahunAnggaran (fiscal year) — exits with error if none found
  - Gets all OPD records for that fiscal year
  - For each OPD, generates email: `opd-{kodeOpd-without-dots}@seruyankab.go.id` (e.g., kodeOpd "1.01" → email "opd-101@seruyankab.go.id")
  - Creates User with hashed password (`seruyan2024`), name from OPD's namaOpd, role "opd", opdId linked
  - Skips creation if user with that email already exists (idempotent)
  - Prints summary with total OPDs, created count, skipped count
- Ran the script successfully: created 12 OPD user accounts
- Verified idempotency: second run correctly skipped all 12 existing accounts

Stage Summary:
- 12 OPD user accounts seeded successfully for Tahun Anggaran 2024
- Email pattern: opd-{kode}@seruyankab.go.id (dots removed from kodeOpd)
- Default password: seruyan2024
- Script is idempotent — safe to re-run without creating duplicates
- Created accounts:
  - opd-101@seruyankab.go.id — BPKPD
  - opd-102@seruyankab.go.id — Bappeda
  - opd-103@seruyankab.go.id — Dinas Pendidikan
  - opd-104@seruyankab.go.id — Dinas Kesehatan
  - opd-105@seruyankab.go.id — Dinas PUPR
  - opd-106@seruyankab.go.id — Dinas Sosial
  - opd-107@seruyankab.go.id — Dinas Kependudukan dan Catatan Sipil
  - opd-108@seruyankab.go.id — Dinas Komunikasi dan Informatika
  - opd-109@seruyankab.go.id — Dinas Lingkungan Hidup
  - opd-110@seruyankab.go.id — Dinas Pertanian
  - opd-111@seruyankab.go.id — Satpol PP
  - opd-112@seruyankab.go.id — Inspektorat

---
Task ID: 4-c
Agent: Pembiayaan OPD Agent
Task: Update Pembiayaan API route to support OPD role

Work Log:
- Updated `/src/app/api/admin/pembiayaan/route.ts` with full OPD role support:
  - Added `getOpdIdForTahun()` helper: finds OPD record id by kodeOpd + tahunAnggaranId
  - Added `getUserRoleAndOpdKode()` helper: extracts role and opdKode from session
  - **GET endpoint**: If authenticated user has "opd" role, filters pembiayaan records by the OPD's id for the selected tahun anggaran. Non-OPD/unauthenticated users see all records.
  - **POST endpoint**: If user has "opd" role, automatically sets `opdId` based on their OPD record for the selected tahun anggaran (returns 403 if OPD not found in that tahun). Admin/superadmin can optionally provide `opdId` in the request body.
  - **PUT endpoint**: If user has "opd" role, verifies the existing record's `opdId` matches their OPD before allowing update (returns 403 if mismatch).
  - **DELETE endpoint**: If user has "opd" role, verifies the existing record's `opdId` matches their OPD before allowing delete (returns 403 if mismatch).
- All existing functionality (search, pagination, validation, auto-sync) preserved
- Lint check passes
- Dev server running without errors

Stage Summary:
- Pembiayaan API route now fully supports OPD role-based access control
- OPD users can only see, create, update, and delete pembiayaan records belonging to their own OPD
- Admin/superadmin users retain full access to all records and can optionally assign opdId
- The `opdId` field is included in POST creation data, making it part of API responses via Prisma

---
Task ID: 4-b
Agent: Backend Agent
Task: Update Belanja API route to support OPD role

Work Log:
- Updated /src/app/api/admin/belanja/route.ts with full OPD role support:
  - Added `getOpdIdForTahun(opdKode, tahunAnggaranId)` helper function — looks up OPD record by kodeOpd within a specific tahunAnggaran
  - Added `getUserRoleAndOpdKode(session)` helper function — extracts user role and resolves opdKode from session's opdId
  - **GET endpoint**: If authenticated user has role "opd", filters belanja records by opdId (resolved via getOpdIdForTahun). Non-OPD users (admin/superadmin) see all records.
  - **POST endpoint**: If user has role "opd", automatically sets opdId to the OPD record matching their kodeOpd for the selected tahunAnggaran. Returns 403 if OPD not found in that tahunAnggaran. Admin/superadmin can optionally provide opdId in request body.
  - **PUT endpoint**: If user has role "opd", verifies the existing record's opdId matches their OPD before allowing update. Returns 403 with Indonesian error message if ownership check fails.
  - **DELETE endpoint**: If user has role "opd", verifies the existing record's opdId matches their OPD before allowing delete. Returns 403 with Indonesian error message if ownership check fails.
- Verified database schema is in sync (opdId field already exists on Belanja model)
- Lint check passes with no errors
- Dev server running without issues

Stage Summary:
- Belanja API now fully supports OPD role-based access control
- OPD users can only see, create, update, and delete belanja records belonging to their own OPD
- Admin/superadmin users retain full access to all records and can optionally set opdId
- The opdId field is included in all API responses (Prisma returns all model fields by default)
- Same pattern as Pendapatan route, ready for consistency across all data routes

---
Task ID: 4-a
Agent: Pendapatan OPD Agent
Task: Update Pendapatan API route to support OPD role

Work Log:
- Updated `/src/app/api/admin/pendapatan/route.ts` with full OPD role support:
  - Added `getOpdIdForTahun(opdKode, tahunAnggaranId)` helper: finds OPD record id by kodeOpd + tahunAnggaranId
  - Added `getUserOpdInfo(session)` helper: extracts role from session and resolves opdKode from session's opdId via DB lookup
  - **GET endpoint**: Added auth check. If authenticated user has role "opd", filters pendapatan records by opdId (resolved via getOpdIdForTahun for the selected tahunAnggaran). Returns 403 if OPD not found or kodeOpd missing. Admin/superadmin/unauthenticated see all records (unauthenticated still returns 401).
  - **POST endpoint**: If user has role "opd", automatically sets opdId based on their OPD record for the selected tahunAnggaran (returns 403 if OPD not found). Admin/superadmin can optionally provide opdId in the request body; if omitted, opdId is null (global data).
  - **PUT endpoint**: If user has role "opd", verifies the existing record's opdId matches their OPD before allowing update (returns 403 with Indonesian error message if mismatch). Only admin/superadmin can change opdId on update.
  - **DELETE endpoint**: If user has role "opd", verifies the existing record's opdId matches their OPD before allowing delete (returns 403 with Indonesian error message if mismatch).
- Updated Pendapatan type in `/src/components/admin/PendapatanManager.tsx` to include `opdId: string | null`
- Updated DashboardData type in `/src/components/dashboard/types.ts` to include `opdId: string | null` in pendapatan array
- Updated `/src/app/api/dashboard/route.ts` to include `opdId` in the pendapatan mapping response
- Verified database schema is in sync (opdId field already exists on Pendapatan model)
- Lint check passes with no errors
- Dev server running without issues

Stage Summary:
- Pendapatan API now fully supports OPD role-based access control
- OPD users can only see, create, update, and delete pendapatan records belonging to their own OPD
- Admin/superadmin users retain full access to all records and can optionally set opdId
- The opdId field is included in all API responses (both admin CRUD and dashboard)
- Client-side types updated to reflect opdId field
- Consistent with the Belanja and Pembiayaan OPD implementations

---
Task ID: 5-7
Agent: Main Agent
Task: Create OPD Panel, update page rendering, create User Management, and wire everything together

Work Log:
- Updated Prisma schema:
  - Added `opdId` (String?, optional) to Pendapatan, Belanja, Pembiayaan models with relation to Opd
  - Added `opdId` (String?, optional) to User model with relation to Opd
  - Added reverse relations on Opd model: `pendapatan[]`, `belanja[]`, `pembiayaan[]`, `users[]`
  - Updated User role comment to include "opd"
  - Ran `bun run db:push` successfully
- Created 12 OPD user accounts via seed script:
  - Email format: opd-{kode}@seruyankab.go.id (e.g., opd-101@seruyankab.go.id)
  - Password: seruyan2024
  - Role: "opd" with opdId linked to their OPD record
- Updated auth system:
  - auth.ts: Added opdId to authorize return, JWT token, and session callback
  - use-auth.ts: Added opdId to user object
  - auth-helpers.ts: Added requireOpdAuth() function
- Updated all three data API routes (Pendapatan, Belanja, Pembiayaan):
  - GET: OPD users only see their own data (filtered by opdId)
  - POST: OPD users get opdId auto-set; admin can optionally provide opdId
  - PUT/DELETE: OPD users can only modify their own data (403 if not their OPD)
- Created OpdPanel component (simplified admin view):
  - Shows OPD info card (kode, nama, kepala)
  - Tabs: Pendapatan, Belanja, Pembiayaan, Akun (password change)
  - Year selector for data filtering
  - Uses same manager components as admin
- Updated page.tsx:
  - Added import for OpdPanel
  - When user role is "opd", renders OpdPanel instead of AdminPanel
- Updated LoginForm:
  - Changed badge text from "Login Admin" to "Login Admin / OPD"
  - Updated help text to mention both admin and OPD
- Updated DashboardHeader:
  - Role badge now shows "OPD" for opd role users
- Updated UserManager:
  - Role display now shows "OPD" for opd role users
- Created UserManagementManager component (Admin can CRUD all users including OPD):
  - Full user listing table with role badges, OPD info, status
  - Create/Edit dialog with role selector and OPD dropdown
  - Delete confirmation
  - OPD users linked to their OPD with auto-complete dropdown
- Created /api/admin/opd-list API endpoint for OPD dropdown in user management
- Updated /api/admin/users with full CRUD:
  - GET: Lists all users with opd relation data
  - POST: Create user with role/opdId support
  - PUT: Update user with role/opdId support
  - DELETE: Delete user
  - All protected with admin/superadmin auth check
- Updated AdminPanel to use UserManagementManager instead of UserManager
- Changed AdminPanel tab label from "Akun" to "Pengguna"
- All lint checks pass, dev server running without errors

Stage Summary:
- Full OPD role implementation complete:
  - OPD users can log in and see only their own Pendapatan/Belanja/Pembiayaan data
  - OPD users get opdId auto-set when creating records
  - OPD users cannot access other OPDs' data
  - Admin can manage OPD users from the "Pengguna" tab
  - OPD Panel shows simplified view with OPD info card
  - 12 OPD accounts seeded: opd-101 through opd-112@seruyankab.go.id / seruyan2024
## Task 3 - Create OPD Generate API Endpoint

**Date**: 2026-03-04
**File created**: `src/app/api/admin/opd/generate/route.ts`

### Summary
Created a new POST API endpoint at `/api/admin/opd/generate` that generates OPD data from a previous fiscal year.

### Endpoint behavior:
1. **Auth check** — Requires admin or superadmin role
2. **Input** — Accepts `{ tahunAnggaranId: string }` identifying the target fiscal year
3. **Lookup** — Finds the previous fiscal year (`tahun - 1`) relative to the target
4. **Copy** — Copies all OPDs from the previous year to the target year, skipping duplicates by `kodeOpd`
5. **User accounts** — Creates OPD user accounts (email: `opd-{kode}@seruyankab.go.id`, password: `seruyan2024`) for newly created OPDs, or updates existing users to point to the new OPD record
6. **Cache** — Invalidates dashboard cache after generation
7. **Response** — Returns summary with counts of created, skipped OPDs and created users

### Validation:
- Lint passed with no errors
- Dev server running normally

---
Task ID: 2
Agent: Seed Update Agent
Task: Update prisma/seed.ts to replace 12 OPDs with correct 31 OPDs for Kabupaten Seruyan

Work Log:
- Read existing seed.ts file to understand current structure
- Updated `opdList` array: replaced 12 OPDs with 31 OPDs organized by proper government kode structure:
  - 1.xx: Sekretariat & Inspektorat (3 OPDs: Sekretariat Daerah, Sekretariat DPRD, Inspektorat Daerah)
  - 2.xx: Dinas (17 OPDs: Pendidikan, Kesehatan, PUPR, Perumahan, Sosial, Ketahanan Pangan & Pertanian, Lingkungan Hidup, Kependudukan, PMD, Perhubungan, Kominfo, DPMPTSP, Pemuda Olahraga Pariwisata, Perpustakaan, Perikanan, Koperasi UKM, Tenaga Kerja)
  - 3.xx: Badan (6 OPDs: Bappeda, BPKAD, BKPSDM, BPBD, Kesbangpol, Bapenda)
  - 4.xx: Kecamatan (10 OPDs: Seruyan Hilir, Hilir Timur, Danau Sembuluh, Hanau, Seruyan Raya, Danau Seluluk, Batu Ampar, Seruyan Tengah, Seruyan Hulu, Suling Tambun)
- Updated `skpdList` array: matched the same 31 OPDs with same kode and nama
- Updated `skpdAnggaranBase`: replaced 12 budget entries with 31 entries with realistic budget allocations
- Updated `skpdRealisasiRange`: replaced 12 realisasi range entries with 31 entries
- Updated final console.log: changed "12 organisations" → "31 organisations" and "12 OPD" → "31 OPD"
- Did NOT modify Pendapatan, Belanja, Pembiayaan, or RealisasiAkun seed data (as instructed)

Stage Summary:
- seed.ts now seeds 31 OPDs for Kabupaten Seruyan instead of 12
- OPDs use proper government kode structure (1.xx Sekretariat, 2.xx Dinas, 3.xx Badan, 4.xx Kecamatan)
- Budget allocations are realistic for a Kabupaten-level government
- Realisasi ranges reflect typical absorption rates per OPD type
- All non-OPD seed data (Pendapatan, Belanja, Pembiayaan, RealisasiAkun) remains unchanged


---
Task ID: 4
Agent: Main Agent
Task: Add OPD seed data (36 OPDs) and Generate OPD feature for new fiscal year

Work Log:
- Updated prisma/seed.ts with 36 OPDs for Kabupaten Seruyan:
  - 1.xx: Sekretariat & Inspektorat (3 OPDs)
  - 2.xx: Dinas (17 OPDs)
  - 3.xx: Badan (6 OPDs)
  - 4.xx: Kecamatan (10 OPDs)
- Updated skpdList, skpdAnggaranBase, skpdRealisasiRange to match all 36 OPDs
- Created /src/app/api/admin/opd/generate/route.ts (POST endpoint):
  - Copies OPDs from previous fiscal year (tahun - 1) to target year
  - Skips OPDs that already exist in target year (by kodeOpd matching)
  - Auto-creates OPD user accounts with default password seruyan2024
  - Updates existing user opdId if user already exists
  - Protected with admin/superadmin auth check
- Updated /src/components/admin/OpdManager.tsx:
  - Added "Generate OPD" button with CopyPlus icon
  - Added confirmation dialog with warning info box
  - Shows loading state during generation
  - Refreshes OPD list after successful generation
- Re-seeded database successfully with 36 OPDs × 3 years
- Seeded 36 OPD user accounts for 2024 (3 skipped from old data, 33 newly created)
- Lint passes, dev server running

Stage Summary:
- 36 OPD organizations seeded across 3 fiscal years (2022, 2023, 2024)
- 36 OPD user accounts created: opd-101 through opd-410@seruyankab.go.id / seruyan2024
- Generate OPD feature allows admin to copy OPDs from previous year to new fiscal year
- OPD structure follows Indonesian government kode system:
  - 1.xx: Sekretariat & Inspektorat
  - 2.xx: Dinas
  - 3.xx: Badan
  - 4.xx: Kecamatan

---
Task ID: 2
Agent: Main Agent
Task: Make all Tahun Anggaran active and realtime sync without exception

Work Log:
- Added `autoSync` boolean field to RealisasiSkpd model in prisma schema
- Ran `db:push` to apply schema changes
- Created `src/lib/sync-realisasi-skpd.ts` - auto-sync function that aggregates Pendapatan/Belanja/Pembiayaan data per OPD
- Updated pendapatan, belanja, pembiayaan API routes to call `syncRealisasiSkpd()` after every CUD operation
- Removed the "only one aktif" constraint from tahun-anggaran API route - all years are now always aktif
- Updated TahunAnggaranManager UI to remove aktif switch, show "Aktif — Realtime" badge for all years
- Fixed page.tsx to default to latest year instead of hardcoded 2024
- Updated dashboard API to default to latest year (not aktif year)
- Updated AdminPanel and OpdPanel to auto-select latest year instead of aktif year
- Updated opd-list API to use latest year instead of aktif year
- Added `renderCustomCell` support to GenericCrudTable for custom column rendering
- Added `autoSync` field to RealisasiSkpdManager columns and API response
- Added manual sync endpoint to realisasi-skpd API (`?action=sync`)
- Set all existing TahunAnggaran records to aktif=true in database
- Updated types.ts to include autoSync in realisasiSkpd type

Stage Summary:
- All tahun anggaran are now aktif simultaneously
- Realisasi SKPD auto-syncs when data is entered in Pendapatan/Belanja/Pembiayaan
- Dashboard defaults to latest year instead of hardcoded 2024
- "Aktif — Realtime" badge shown in Tahun Anggaran manager
- No more single-aktif constraint

---
Task ID: 6
Agent: Main Agent
Task: Fix Tahun Anggaran Aktif - only one active at a time, auto-switch to active year

Work Log:
- Analyzed current implementation: `aktif` field was forced to `true` for all years, defeating its purpose
- Updated `/src/app/api/admin/tahun-anggaran/route.ts`:
  - POST: When creating with `aktif: true`, deactivates all other years first in a transaction
  - PUT: When setting `aktif: true`, deactivates all other years first; when deactivating, auto-activates the latest remaining year (must always have one active)
  - DELETE: If deleting active year, auto-activates the latest remaining year
- Updated `/src/app/api/dashboard/route.ts`:
  - Default year now uses the `aktif` year instead of the latest year
  - Added `activeTahun` field to response
  - Changed `tahunList` from `number[]` to `{tahun: number, aktif: boolean}[]`
- Updated `/src/components/dashboard/types.ts`:
  - Added `TahunAnggaranItem` type with `tahun` and `aktif` fields
  - Changed `tahunList` type from `number[]` to `TahunAnggaranItem[]`
  - Added `activeTahun` field to `DashboardData`
- Updated `/src/app/page.tsx`:
  - Initial load uses `activeTahun` from API response
  - Passes `TahunAnggaranItem[]` to AdminPanel/OpdPanel/DashboardHeader
  - Calculates `activeTahunFromData` from tahunList
- Updated `/src/components/dashboard/DashboardHeader.tsx`:
  - Accepts `tahunList: TahunAnggaranItem[]` and `activeTahun: number` props
  - Year selector shows "TA 2024 ✓ Aktif" badge for active year
- Updated `/src/components/admin/TahunAnggaranManager.tsx`:
  - Replaced "Aktif — Realtime" badge with Switch toggle
  - Clicking switch on inactive year activates it (deactivates all others)
  - Clicking switch on active year shows toast: "Must have one active year"
  - New tahun anggaran automatically becomes active
  - Description updated to explain only one year can be active at a time
- Updated `/src/components/admin/AdminPanel.tsx`:
  - Accepts `tahunList: TahunAnggaranItem[]` prop
  - Auto-selects the active year on load
  - Auto-follows when active year changes from prop
  - Year selector shows "Aktif" badge for active year
- Updated `/src/components/admin/OpdPanel.tsx`:
  - Same changes as AdminPanel
  - Auto-selects active year, auto-follows changes
- Updated `/prisma/seed.ts`:
  - Added comment: "Only one year can be active at a time"
  - 2024 remains the only active year (2022 and 2023 are aktif: false)
- Fixed existing database records:
  - Set all years to aktif=false, then set only 2024 to aktif=true
- All lint checks pass
- Dev server running without errors

Stage Summary:
- Only one Tahun Anggaran can be "aktif" at a time (exclusive active)
- When a year is activated, all others are automatically deactivated
- Dashboard and all panels auto-switch to the active year
- Year selector dropdowns show "✓ Aktif" badge for the active year
- Deleting the active year auto-activates the latest remaining year
- Must always have at least one active year (prevents accidental deactivation)
- API returns `activeTahun` and `tahunList` with aktif status
- Database fixed: only 2024 is active, 2022 and 2023 are inactive
