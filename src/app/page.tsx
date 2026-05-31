"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SummaryCards from "@/components/dashboard/SummaryCards";
import PendapatanChart from "@/components/dashboard/PendapatanChart";
import BelanjaChart from "@/components/dashboard/BelanjaChart";
import TrendChart from "@/components/dashboard/TrendChart";
import RealisasiBarChart from "@/components/dashboard/RealisasiBarChart";
import DataTable from "@/components/dashboard/DataTable";
import APBDTable from "@/components/dashboard/APBDTable";
import TransparansiView from "@/components/dashboard/TransparansiView";
import SKPDQuickSummary from "@/components/dashboard/SKPDQuickSummary";
import AccountTable from "@/components/dashboard/AccountTable";
import OpdView from "@/components/dashboard/OpdView";
import {
  DashboardData,
  ActiveView,
  formatRupiahShort,
} from "@/components/dashboard/types";
import AdminPanel from "@/components/admin/AdminPanel";
import OpdPanel from "@/components/admin/OpdPanel";
import LoginForm from "@/components/auth/LoginForm";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  RefreshCw,
  Clock,
  Info,
} from "lucide-react";
import { usePengaturan } from "@/context/PengaturanContext";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const { pengaturan, logoSrc } = usePengaturan();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tahun, setTahun] = useState<number>(0); // 0 = not yet initialized
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchData = useCallback(async (tahunParam: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard?tahun=${tahunParam}`);
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const json = await res.json();
      setData(json);
      // Auto-set tahun to the latest/active year on first load
      if (tahun === 0 && json.tahunList?.length > 0) {
        setTahun(json.tahun);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [tahun]);

  useEffect(() => {
    // On first load, fetch the latest/active year from the API
    if (tahun === 0) {
      fetch('/api/dashboard').then(res => res.json()).then(json => {
        if (json.tahun) {
          setTahun(json.tahun);
        }
      }).catch(() => {
        setTahun(2024); // fallback
      });
    } else {
      fetchData(tahun);
    }
  }, [tahun, fetchData]);

  const handleTahunChange = (newTahun: number) => {
    setTahun(newTahun);
  };

  const handleViewChange = (view: ActiveView) => {
    // If trying to access admin and not authenticated, don't change view
    // The login form will be shown instead
    setActiveView(view);
  };

  const renderContent = () => {
    // Admin/OPD view: show login if not authenticated, panel if authenticated
    if (activeView === "admin") {
      if (authLoading) {
        return (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        );
      }
      if (!isAuthenticated) {
        return <LoginForm />;
      }
      // Show OPD Panel for OPD role, Admin Panel for admin/superadmin
      if (user?.role === "opd") {
        return <OpdPanel tahun={tahun} tahunList={data?.tahunList || [2022, 2023, 2024]} />;
      }
      return <AdminPanel tahun={tahun} tahunList={data?.tahunList || [2022, 2023, 2024]} />;
    }

    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorState error={error} onRetry={() => fetchData(tahun)} />;
    if (!data) return null;

    switch (activeView) {
      case "dashboard":
        return <DashboardView data={data} />;
      case "apbd":
        return <APBDTable data={data} />;
      case "pendapatan":
        return <PendapatanView data={data} />;
      case "belanja":
        return <BelanjaView data={data} />;
      case "pembiayaan":
        return <PembiayaanView data={data} />;
      case "realisasi-akun":
        return <DataTable data={data} type="akun" />;
      case "realisasi-skpd":
        return <DataTable data={data} type="skpd" />;
      case "opd":
        return <OpdView data={data} />;
      case "transparansi":
        return <TransparansiView data={data} />;
      default:
        return <DashboardView data={data} />;
    }
  };

  // When showing login form for admin, don't show the sidebar/header layout
  if (activeView === "admin" && !authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-[60px]">
        <DashboardHeader
          activeView={activeView}
          tahun={tahun}
          tahunList={data?.tahunList || [2022, 2023, 2024]}
          onTahunChange={handleTahunChange}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onNavigateDashboard={() => setActiveView("dashboard")}
        />

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {renderContent()}
        </main>

        {/* Footer */}
        <footer
          className="text-white px-4 lg:px-6 py-3 mt-auto"
          style={{
            background: `linear-gradient(to right, ${pengaturan.warnaPrimary}, ${pengaturan.warnaSecondary})`,
          }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <img
                src={logoSrc}
                alt="Logo Kabupaten Seruyan"
                width={24}
                height={24}
                className="w-6 h-6 rounded-full bg-white/20 p-0.5"
              />
              <p className="text-xs text-emerald-100">
                © {new Date().getFullYear()} {pengaturan.namaPemerintah}
              </p>
            </div>
            <p className="text-[10px] text-emerald-200/60">
              Dashboard Monitoring Pengelolaan Keuangan Daerah
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ============ DASHBOARD VIEW ============
function DashboardView({ data }: { data: DashboardData }) {
  const { pengaturan, logoSrc } = usePengaturan();

  return (
    <div className="space-y-6">
      {/* Title banner */}
      <div
        className="relative overflow-hidden rounded-xl text-white p-6 animate-gradient"
        style={{
          background: `linear-gradient(to right, ${pengaturan.warnaPrimary}, ${pengaturan.warnaSecondary}, ${pengaturan.warnaSecondary}cc)`,
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        <div className="relative flex flex-col sm:flex-row items-center gap-4">
          <img
            src={logoSrc}
            alt="Logo Kabupaten Seruyan"
            width={64}
            height={64}
            className="w-16 h-16 rounded-full bg-white/20 p-1 shrink-0"
          />
          <div className="text-center sm:text-left">
            <h2 className="text-lg lg:text-xl font-bold tracking-wide uppercase">
              Anggaran Pendapatan dan Belanja Daerah
            </h2>
            <p className="text-sm text-emerald-100 mt-1">
              {pengaturan.namaPemerintah} — Tahun Anggaran{" "}
              {data.tahun}
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-xs text-emerald-200">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Data Tahun Anggaran {data.tahun}
              </span>
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                Total APBD: {formatRupiahShort(data.ringkasan.totalAnggaran)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <SummaryCards data={data} />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PendapatanChart data={data} />
        <BelanjaChart data={data} />
      </div>

      {/* Trend */}
      <TrendChart data={data} />

      {/* Realisasi Bar Chart */}
      <RealisasiBarChart data={data} />

      {/* SKPD Quick Summary */}
      <SKPDQuickSummary data={data} />
    </div>
  );
}

// ============ PENDAPATAN VIEW ============
function PendapatanView({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-4">
      <PendapatanChart data={data} />
      <AccountTable
        items={data.pendapatan}
        title="Detail Pendapatan Daerah"
        colorClass="bg-emerald-50/50"
        headerColor="text-emerald-800"
        tahun={data.tahun}
      />
    </div>
  );
}

// ============ BELANJA VIEW ============
function BelanjaView({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-4">
      <BelanjaChart data={data} />
      <AccountTable
        items={data.belanja}
        title="Detail Belanja Daerah"
        colorClass="bg-red-50/50"
        headerColor="text-red-800"
        tahun={data.tahun}
      />
    </div>
  );
}

// ============ PEMBIAYAAN VIEW ============
function PembiayaanView({ data }: { data: DashboardData }) {
  return (
    <AccountTable
      items={data.pembiayaan}
      title="Detail Pembiayaan"
      colorClass="bg-amber-50/50"
      headerColor="text-amber-800"
      tahun={data.tahun}
    />
  );
}

// ============ LOADING SKELETON ============
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <Skeleton className="h-7 w-96 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto mt-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

// ============ ERROR STATE ============
function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="p-4 rounded-full bg-destructive/10 mb-4">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">
        Gagal Memuat Data Dashboard
      </h3>
      <p className="text-sm text-muted-foreground mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
      >
        <RefreshCw className="w-4 h-4" />
        Coba Lagi
      </button>
    </div>
  );
}
