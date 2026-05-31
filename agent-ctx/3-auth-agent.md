# Task 3 - Auth Agent: Update Authentication System for OPD Role

## Summary
Updated the authentication system to fully support the OPD role by propagating `opdId` through the entire auth chain and adding a `requireOpdAuth()` helper for API routes.

## Changes Made

### 1. `/src/lib/auth.ts`
- **authorize function**: Added `opdId: user.opdId ?? null` to the returned user object
- **jwt callback**: Added `token.opdId = (user as { opdId?: string | null }).opdId ?? null`
- **session callback**: Added `(session.user as { opdId?: string | null }).opdId = token.opdId as string | null`

### 2. `/src/hooks/use-auth.ts`
- Added `opdId: (session.user as { opdId?: string | null }).opdId ?? null` to the client-side user object

### 3. `/src/lib/auth-helpers.ts`
- Added `import { db } from "@/lib/db"` for database access
- Added `requireOpdAuth()` function:
  - Returns 401 if not authenticated
  - Returns 403 if role is not "opd" or opdId is missing
  - Returns 404 if OPD record not found in database
  - Returns `{ session, opdKode, error: null }` on success

## Verification
- Lint check passes (`bun run lint` - no errors)
- Dev server running without errors
- Work log appended to `/home/z/my-project/worklog.md`
