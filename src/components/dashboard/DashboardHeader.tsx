"use client";

import { ActiveView } from "./types";
import { Menu, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePengaturan } from "@/context/PengaturanContext";

type DashboardHeaderProps = {
  activeView: ActiveView;
  tahun: number;
  tahunList: number[];
  onTahunChange: (tahun: number) => void;
  onMenuToggle: () => void;
  onNavigateDashboard: () => void;
};

const viewLabels: Record<ActiveView, string> = {
  dashboard: "Dashboard",
  apbd: "APBD",
  pendapatan: "Pendapatan",
  belanja: "Belanja",
  pembiayaan: "Pembiayaan",
  "realisasi-akun": "Realisasi Per-Akun",
  "realisasi-skpd": "Realisasi Per-SKPD",
  transparansi: "Transparansi",
  admin: "Admin",
};

export default function DashboardHeader({
  activeView,
  tahun,
  tahunList,
  onTahunChange,
  onMenuToggle,
  onNavigateDashboard,
}: DashboardHeaderProps) {
  const { pengaturan, logoSrc } = usePengaturan();

  return (
    <header
      className="sticky top-0 z-30 text-white shadow-lg animate-gradient"
      style={{
        background: `linear-gradient(to right, ${pengaturan.warnaPrimary}, ${pengaturan.warnaSecondary}, ${pengaturan.warnaPrimary})`,
      }}
    >
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        {/* Left: Menu + Logo + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-1.5 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <img
            src={logoSrc}
            alt="Logo Kabupaten Seruyan"
            width={36}
            height={36}
            className="w-9 h-9 rounded-full object-cover bg-white/20 p-0.5 hidden sm:block"
          />

          <div className="flex flex-col">
            <h1 className="text-base lg:text-lg font-bold tracking-wide uppercase">
              {viewLabels[activeView]}
            </h1>
            <p className="text-[10px] lg:text-xs text-emerald-200 hidden sm:block">
              {pengaturan.namaPemerintah}
            </p>
          </div>
        </div>

        {/* Right: Year Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
            <Calendar className="w-4 h-4" style={{ color: pengaturan.warnaAccent }} />
            <Select
              value={tahun.toString()}
              onValueChange={(val) => onTahunChange(parseInt(val))}
            >
              <SelectTrigger className="border-0 bg-transparent text-white text-sm font-semibold h-6 w-auto p-0 focus:ring-0 [&>svg]:text-[var(--gov-accent)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tahunList.map((t) => (
                  <SelectItem key={t} value={t.toString()}>
                    TA {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="px-4 lg:px-6 pb-2 flex items-center gap-1 text-xs text-emerald-200/70">
        <button
          onClick={onNavigateDashboard}
          className="hover:text-white transition-colors"
        >
          Dashboard
        </button>
        {activeView !== "dashboard" && (
          <>
            <span>/</span>
            <span className="font-medium" style={{ color: pengaturan.warnaAccent }}>
              {viewLabels[activeView]}
            </span>
          </>
        )}
      </div>
    </header>
  );
}
