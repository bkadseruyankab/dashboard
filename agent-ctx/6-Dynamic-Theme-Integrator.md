# Task 6 - Dynamic Theme Integrator

## Task: Update all dashboard and admin components to use dynamic theme colors and logo from PengaturanContext

### Work Completed

#### 1. Sidebar.tsx
- Added `import { usePengaturan } from "@/context/PengaturanContext"`
- Added `const { pengaturan, logoSrc } = usePengaturan();`
- Replaced `bg-[#1B5E20]` on `<aside>` with `style={{ backgroundColor: pengaturan.warnaPrimary }}`
- Replaced `src="/logo-seruyan.png"` with `src={logoSrc}`
- Replaced `text-[#F9A825]` (parent active state) with `style={isChildActive ? { color: pengaturan.warnaAccent } : undefined}`
- Replaced `bg-[#F9A825]/20 text-[#F9A825]` (child active) with `style={activeView === child.id ? { backgroundColor: \`${pengaturan.warnaAccent}33\`, color: pengaturan.warnaAccent } : undefined}`
- Replaced `bg-[#F9A825]/20 text-[#F9A825]` (simple active) with same pattern

#### 2. DashboardHeader.tsx
- Added `import { usePengaturan } from "@/context/PengaturanContext"`
- Added `const { pengaturan, logoSrc } = usePengaturan();`
- Replaced `bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#1B5E20]` with inline `style={{ background: \`linear-gradient(to right, ${pengaturan.warnaPrimary}, ${pengaturan.warnaSecondary}, ${pengaturan.warnaPrimary})\` }}`
- Replaced `src="/logo-seruyan.png"` with `src={logoSrc}`
- Replaced hardcoded "Pemerintah Kabupaten Seruyan, Kalimantan Tengah" with `{pengaturan.namaPemerintah}`
- Replaced `text-[#F9A825]` on Calendar icon with `style={{ color: pengaturan.warnaAccent }}`
- Replaced `[&>svg]:text-[#F9A825]` on SelectTrigger with `[&>svg]:text-[var(--gov-accent)]`
- Replaced `text-[#F9A825]` in breadcrumb with `style={{ color: pengaturan.warnaAccent }}`

#### 3. page.tsx
- Added `import { usePengaturan } from "@/context/PengaturanContext"`
- Added `const { pengaturan, logoSrc } = usePengaturan();` to Home component
- Replaced footer gradient `from-[#1B5E20] to-[#2E7D32]` with inline style
- Replaced `src="/logo-seruyan.png"` in footer with `src={logoSrc}`
- Replaced "BPKPD Kabupaten Seruyan - Kalimantan Tengah" with `{pengaturan.namaPemerintah}`
- Added `const { pengaturan, logoSrc } = usePengaturan();` to DashboardView
- Replaced banner gradient `from-[#1B5E20] via-[#2E7D32] to-[#388E3C]` with inline style
- Replaced `src="/logo-seruyan.png"` in DashboardView with `src={logoSrc}`

#### 4. SummaryCards.tsx
- Added `import { usePengaturan } from "@/context/PengaturanContext"`
- Added `const { pengaturan } = usePengaturan();`
- Replaced `color: "from-[#1B5E20] to-[#2E7D32]"` with `gradientFrom: pengaturan.warnaPrimary, gradientTo: pengaturan.warnaSecondary`
- Replaced all 4 cards' `color` property with `gradientFrom/gradientTo`
- Replaced `className={`h-1.5 bg-gradient-to-r ${card.color}`}` with inline `style={{ background: \`linear-gradient(to right, ${card.gradientFrom}, ${card.gradientTo})\` }}`

#### 5. AdminPanel.tsx
- Added `import { usePengaturan } from "@/context/PengaturanContext"`
- Added `const { pengaturan } = usePengaturan();`
- Replaced gradient `from-[#1B5E20] via-[#2E7D32] to-[#388E3C]` with inline style
- Replaced `text-[#F9A825]` on Shield icon with `style={{ color: pengaturan.warnaAccent }}`
- Replaced `data-[state=active]:bg-[#1B5E20]` with `data-[state=active]:bg-[var(--gov-primary)]`

#### 6. SettingsManager.tsx
- Added `import { usePengaturan } from "@/context/PengaturanContext"`
- Added `const { pengaturan: currentPengaturan, logoSrc, refetch: refetchPengaturan } = usePengaturan();`
- Replaced `border-l-[#1B5E20]` with `style={{ borderLeftColor: currentPengaturan.warnaPrimary }}`
- Replaced `text-[#1B5E20]` (Info icon) with `style={{ color: currentPengaturan.warnaPrimary }}`
- Replaced `border-l-[#2E7D32]` with `style={{ borderLeftColor: currentPengaturan.warnaSecondary }}`
- Replaced `text-[#2E7D32]` (Palette icon) with `style={{ color: currentPengaturan.warnaSecondary }}`
- Replaced `border-l-[#F9A825]` with `style={{ borderLeftColor: currentPengaturan.warnaAccent }}`
- Replaced `text-[#F9A825]` (ImageIcon) with `style={{ color: currentPengaturan.warnaAccent }}`
- Replaced `border-l-[#0D3B12]` with `style={{ borderLeftColor: currentPengaturan.warnaDark }}`
- Replaced `text-[#0D3B12]` (Building2 icon) with `style={{ color: currentPengaturan.warnaDark }}`
- Replaced `src="/logo-seruyan.png"` (default logo) with `src={logoSrc}`
- Replaced `text-[#1B5E20]` on Loader2 with `style={{ color: currentPengaturan.warnaPrimary }}`
- Replaced `bg-[#1B5E20] hover:bg-[#2E7D32]` on save button with inline style + onMouseEnter/onMouseLeave hover
- Added `refetchPengaturan()` call after successful save to refresh global theme

### Verification
- PengaturanProvider confirmed present in layout.tsx (no changes needed)
- ESLint passes with zero errors
- Dev server runs without errors
