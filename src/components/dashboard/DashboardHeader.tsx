"use client";

import { TahunAnggaranItem, ActiveView } from "./types";
import { Menu, Calendar, LogOut, User, ChevronDown, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { usePengaturan } from "@/context/PengaturanContext";
import { useAuth } from "@/hooks/use-auth";

type DashboardHeaderProps = {
  activeView: ActiveView;
  tahun: number;
  tahunList: TahunAnggaranItem[];
  activeTahun: number;
  onTahunChange: (tahun: number) => void;
  onMenuToggle: () => void;
  onNavigateDashboard: () => void;
};

const viewLabels: Record<ActiveView, string> = {
  dashboard: "Dashboard",
  "ringkasan-eksekutif": "Ringkasan Eksekutif",
  "analisis-risiko": "Analisis Risiko",
  apbd: "APBD",
  pendapatan: "Pendapatan",
  belanja: "Belanja",
  pembiayaan: "Pembiayaan",
  "realisasi-akun": "Realisasi Per-Akun",
  "realisasi-skpd": "Realisasi Per-SKPD",
  opd: "Organisasi Perangkat Daerah",
  transparansi: "Transparansi",
  admin: "Admin",
};

export default function DashboardHeader({
  activeView,
  tahun,
  tahunList,
  activeTahun,
  onTahunChange,
  onMenuToggle,
  onNavigateDashboard,
}: DashboardHeaderProps) {
  const { pengaturan, logoSrc } = usePengaturan();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

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
            className="w-9 h-9 object-contain hidden sm:block"
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

        {/* Right: Year Selector + User Menu */}
        <div className="flex items-center gap-2">
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
                  <SelectItem key={t.tahun} value={t.tahun.toString()}>
                    <span className="flex items-center gap-1.5">
                      TA {t.tahun}
                      {t.aktif && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded-full px-1.5 py-0.5">
                          <Check className="w-2.5 h-2.5" />
                          Aktif
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User Menu (shown when authenticated) */}
          {isAuthenticated && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 h-9 px-2 hover:bg-white/10 text-white"
                >
                  <Avatar className="w-7 h-7" style={{ backgroundColor: pengaturan.warnaAccent }}>
                    <AvatarFallback
                      className="text-xs font-bold"
                      style={{ color: pengaturan.warnaDark, backgroundColor: pengaturan.warnaAccent }}
                    >
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs mt-1">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        backgroundColor: `${pengaturan.warnaPrimary}15`,
                        color: pengaturan.warnaPrimary,
                      }}
                    >
                      {user.role === "superadmin" ? "Super Admin" : user.role === "opd" ? "OPD" : "Admin"}
                    </span>
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
