# Task 5 — API Routes Updater

## Task: Update users API route with CRUD and role-based access

### Work Log
- Read existing `/src/app/api/admin/users/route.ts` (only had basic GET with no auth, no pagination, no OPD info)
- Read Prisma schema to understand User model with opd relation (opdId FK, Opd model with kodeOpd/namaOpd)
- Read `@/lib/password` (hashPassword, verifyPassword using PBKDF2)
- Read `@/lib/cache` (invalidateDashboardCache clears in-memory cache)
- Read `@/lib/auth` (NextAuth config with JWT strategy, session includes role/opdId)
- Read `@/lib/db` (singleton PrismaClient)
- Completely rewrote route.ts with full CRUD and role-based access control
- Lint check passes with no errors
- Appended work log to `/home/z/my-project/worklog.md`

### Key Results
- Full CRUD API at `/api/admin/users` with GET/POST/PUT/DELETE
- Role-based access: only admin/superadmin can access (checkAuth helper)
- GET: search, pagination, role filter, includes OPD relation data, excludes passwords
- POST: validates required fields, enforces opdId for opd role, hashes password, checks email uniqueness
- PUT: partial updates, password only hashed if provided, opdId cleared for non-opd roles
- DELETE: prevents self-deletion, validates user exists
- All mutations call invalidateDashboardCache()
