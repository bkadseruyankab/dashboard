# Task 2 - Seed OPD Users Script

## Task
Create a seed script at `/home/z/my-project/src/scripts/seed-opd-users.ts` that creates User accounts for each OPD in the active fiscal year.

## What was done
- Created `/src/scripts/seed-opd-users.ts` following the existing `seed-admin.ts` pattern
- Script finds the active TahunAnggaran, gets all OPDs, and creates User accounts
- Email format: `opd-{kodeOpd-without-dots}@seruyankab.go.id` (e.g., "1.01" → "opd-101@seruyankab.go.id")
- Default password: `seruyan2024` (hashed with `hashPassword` from `@/lib/password`)
- Skips existing users (idempotent)
- Prints summary at the end

## Results
- 12 OPD user accounts created successfully
- Idempotency verified (second run skipped all 12)
- Worklog appended to `/home/z/my-project/worklog.md`
