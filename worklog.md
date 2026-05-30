---
Task ID: 1
Agent: Main Agent
Task: Add CRUD for OPD (Organisasi Perangkat Daerah) with full admin management and public view

Work Log:
- Added OPD model to Prisma schema with fields: kodeOpd, namaOpd, kepalaOpd, alamat, telepon, email
- Added OPD relation to TahunAnggaran model
- Ran db:push to update the database schema
- Created API route /api/admin/opd with full CRUD (GET, POST, PUT, DELETE)
- Created OpdManager.tsx admin component with search, pagination, add/edit/delete functionality
- Updated AdminPanel.tsx to include OPD tab with Landmark icon
- Updated types.ts to add "opd" to ActiveView and AdminTab types
- Updated DashboardHeader.tsx to include OPD label
- Updated Sidebar.tsx to include OPD menu item with Landmark icon
- Created OpdView.tsx public view component with stats cards and table
- Updated page.tsx to render OpdView for "opd" active view
- Updated dashboard API to include OPD data in the response
- Updated DashboardData type to include OPD array
- Seeded 15 OPD entries for 4 fiscal years (2022-2025)
- Fixed currency formatting: replaced toLocaleString("id-ID") with manual formatWithDots() function for reliable dot thousand separators across all environments
- Updated CurrencyInput.tsx to use same manual formatWithDots() for consistency
- All CRUD operations verified working via API testing

Stage Summary:
- OPD CRUD is fully functional in admin panel (create, read, update, delete with search & pagination)
- OPD public view shows list of organizations with stats cards
- Currency formatting now uses reliable manual dot separator (e.g., Rp 994.200.000.000)
- All lint checks pass
