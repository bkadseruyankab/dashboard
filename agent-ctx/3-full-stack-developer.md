# Task 3: Add Auto-Refresh Interval Setting

## Agent: full-stack-developer

## Summary
Successfully implemented a configurable auto-refresh interval setting for the government financial dashboard. The feature allows administrators to configure a timer that automatically refreshes dashboard data in the background without showing any loading indicators.

## Changes Made

### 1. Prisma Schema (`prisma/schema.prisma`)
- Added `autoRefreshInterval Int @default(0)` field to `PengaturanAplikasi` model
- Ran `bun run db:push` to sync database

### 2. PengaturanContext (`src/context/PengaturanContext.tsx`)
- Added `autoRefreshInterval: number` to `PengaturanData` type
- Added `autoRefreshInterval: 0` to `DEFAULT_PENGATURAN`
- Added `autoRefreshInterval: raw.autoRefreshInterval ?? 0` in fetchSettings

### 3. Settings API (`src/app/api/admin/pengaturan/route.ts`)
- Added validation for `autoRefreshInterval`: must be number between 0 and 1440

### 4. SettingsManager (`src/components/admin/SettingsManager.tsx`)
- Added `autoRefreshInterval: number` to interface and defaults
- Added Select dropdown with 7 preset options (0, 5, 10, 15, 30, 60, 120 minutes)
- Added status indicator and info banner
- Added RefreshCw icon and Select component imports

### 5. Dashboard Page (`src/app/page.tsx`)
- Created `silentRefresh` callback for background data updates
- Added `useEffect` with setInterval for auto-refresh and countdown
- Added countdown indicator badge showing remaining time

## Key Decisions
- Silent refresh does NOT trigger loading skeleton — updates data seamlessly
- Countdown indicator only visible when auto-refresh is active and data is loaded
- Backward compatible: `autoRefreshInterval ?? 0` handles undefined/null from older DB
