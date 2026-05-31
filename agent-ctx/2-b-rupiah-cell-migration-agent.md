# Task 2-b: Migrate Admin Manager Components to RupiahCell

## Summary
Replaced all `formatRupiahFull` usages with `RupiahCell` component across 5 admin manager files for consistent "Rp" alignment with nominal values.

## Files Modified

### 1. PendapatanManager.tsx
- Changed import from `{ safePercentage, formatRupiahFull }` to `{ safePercentage }` + added `import RupiahCell`
- Replaced 6 instances of `formatRupiahFull` with `<RupiahCell>`:
  - `updateItem.anggaran` → `<RupiahCell value={updateItem.anggaran} className="text-sm font-medium" />`
  - `updateItem.realisasi` → `<RupiahCell value={updateItem.realisasi} className="text-sm font-medium text-blue-600" />`
  - `record.realisasiLama` → `<RupiahCell value={record.realisasiLama} className="text-muted-foreground line-through" />`
  - `record.realisasiBaru` → `<RupiahCell value={record.realisasiBaru} className="font-medium" />`
  - `+{formatRupiahFull(Math.abs(diff))}` → `<RupiahCell value={Math.abs(diff)} prefix="+" />`
  - `-{formatRupiahFull(Math.abs(diff))}` → `<RupiahCell value={Math.abs(diff)} prefix="-" />`
- Removed `font-mono` from parent spans (RupiahCell handles it internally)

### 2. BelanjaManager.tsx
- Same pattern as PendapatanManager
- Replaced `import { formatRupiahFull }` with `import RupiahCell`
- All 6 replacements applied identically

### 3. PembiayaanManager.tsx
- Same pattern as PendapatanManager
- Replaced `import { formatRupiahFull }` with `import RupiahCell`
- All 6 replacements applied identically

### 4. RealisasiAkunManager.tsx
- Changed import from `{ safePercentage, formatRupiahFull }` to `{ safePercentage }` + added `import RupiahCell`
- All 6 replacements applied identically

### 5. RealisasiSkpdManager.tsx
- Changed import from `{ safePercentage, formatRupiahFull }` to `{ safePercentage }` + added `import RupiahCell`
- All 6 replacements applied identically

### ImportDialog.tsx
- No changes needed — uses a local `formatRupiah` function (abbreviated format like "31.5 T", "28.5 M"), not `formatRupiahFull`

## Verification
- `bun run lint` passed with no errors
- No remaining `formatRupiahFull` references in any Manager file
- All 5 files properly import `RupiahCell`
- Dev server compiles successfully
