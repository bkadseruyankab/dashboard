---
Task ID: 1
Agent: Main
Task: Fix Realisasi Akun — Data Keseluruhan for OPD role to only show their own OPD data

Work Log:
- Analyzed the existing code: RealisasiAkunManager fetched ALL data from `/api/admin/realisasi-akun` for all users including OPD
- Discovered the existing `/api/admin/realisasi-akun/opd` endpoint that computes RealisasiAkun for a specific OPD
- Modified RealisasiAkunManager to:
  - Add `OpdRealisasiAkun` type for OPD-computed data (no id, autoSync, tanggalUpdate)
  - Split fetch logic: `fetchOpdData` (OPD users) and `fetchAdminData` (admin users)
  - OPD users fetch from `/api/admin/realisasi-akun/opd` endpoint (only their OPD data)
  - Admin users continue to fetch from `/api/admin/realisasi-akun` (all data with server-side pagination)
  - OPD data uses client-side search/pagination (since the OPD endpoint doesn't support those)
  - Hide "autoSync" and "tanggalUpdate" columns for OPD users
  - Remove "Update Realisasi" and "Riwayat Realisasi" row actions for OPD users
  - Update info banner text: "Ringkasan Realisasi Akun OPD Anda" with description about OPD-specific data
- Fixed `/api/admin/realisasi-akun/opd/route.ts`: removed reference to non-existent `namaAkunDefault` field in Kategori model
- Verified with browser testing: OPD user sees only their OPD data, admin sees all data with full CRUD

Stage Summary:
- OPD users now see only their own OPD data in Realisasi Akun view
- Admin users still see all data with full CRUD capabilities
- Fixed a Prisma error in the OPD endpoint (namaAkunDefault field doesn't exist)

---
Task ID: 2
Agent: Main
Task: Add Executive Summary feature to dashboard

Work Log:
- Created `src/components/dashboard/ExecutiveSummaryView.tsx` — new component with 6 KPI metric cards
- Updated `src/components/dashboard/types.ts` — added `"ringkasan-eksekutif"` to `ActiveView` union
- Updated `src/components/dashboard/Sidebar.tsx` — added "Ringkasan Eksekutif" menu item with BarChart3 icon
- Updated `src/components/dashboard/DashboardHeader.tsx` — added label for `ringkasan-eksekutif` view
- Updated `src/app/page.tsx` — added import, route case, and quick navigation card

Stage Summary:
- Executive Summary view shows 6 key metrics:
  1. Realisasi Pendapatan — with animated counter, progress bar, anggaran/sisa breakdown
  2. Realisasi Belanja — with animated counter, progress bar, anggaran/sisa breakdown
  3. SILPA Prediksi — Surplus/Deficit badge, formula breakdown
  4. Cash Position — Anggaran Pendapatan vs Realisasi Belanja calculation
  5. OPD Terbaik — Top 5 by realisasi percentage with ranked list and progress bars
  6. OPD Terburuk — Bottom 5 by realisasi percentage with ranked list and progress bars
- Detailed breakdown section at bottom: Pendapatan, Belanja, Pembiayaan, SILPA summary
- All data computed from existing DashboardData API (no API changes needed)
- Sidebar and quick navigation both link to the new view
- Browser tested: all 6 metrics render correctly with animations
