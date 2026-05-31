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
