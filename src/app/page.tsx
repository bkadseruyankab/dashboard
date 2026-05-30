"use client";

import { useState, useEffect } from "react";
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
import {
  DashboardData,
  ActiveView,
  formatRupiahFull,
  formatPersentase,
} from "@/components/dashboard/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tahun, setTahun] = useState(2024);
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchData = async (tahunParam: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard?tahun=${tahunParam}`);
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(tahun);
  }, [tahun]);

  const handleTahunChange = (newTahun: number) => {
    setTahun(newTahun);
  };

  const handleViewChange = (view: ActiveView) => {
    setActiveView(view);
  };

  const renderContent = () => {
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
      case "transparansi":
        return <TransparansiView data={data} />;
      default:
        return <DashboardView data={data} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          activeView={activeView}
          tahun={tahun}
          tahunList={data?.tahunList || [2022, 2023, 2024]}
          onTahunChange={handleTahunChange}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {renderContent()}
        </main>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] text-white px-4 lg:px-6 py-3 mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <img
                src="/logo-seruyan.png"
                alt="Logo"
                className="w-6 h-6 rounded-full bg-white/20 p-0.5"
              />
              <p className="text-xs text-emerald-100">
                © 2024 BPKPD Kabupaten Seruyan - Kalimantan Tengah
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
  return (
    <div className="space-y-6">
      {/* Title banner */}
      <div className="text-center py-4">
        <h2 className="text-lg lg:text-xl font-bold text-foreground tracking-wide uppercase">
          Anggaran Pendapatan dan Belanja Daerah
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pemerintah Kabupaten Seruyan, Kalimantan Tengah — Tahun Anggaran{" "}
          {data.tahun}
        </p>
      </div>

      <SummaryCards data={data} />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PendapatanChart data={data} />
        <BelanjaChart data={data} />
      </div>

      {/* Trend & Realisasi */}
      <div className="grid grid-cols-1 gap-4">
        <TrendChart data={data} />
        <RealisasiBarChart data={data} />
      </div>

      {/* Quick SKPD summary */}
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

// ============ GENERIC ACCOUNT TABLE ============
function AccountTable({
  items,
  title,
  colorClass,
  headerColor,
  tahun,
}: {
  items: Array<{
    id: string;
    kodeAkun: string;
    namaAkun: string;
    kategori: string;
    anggaran: number;
    realisasi: number;
    persentase: number;
  }>;
  title: string;
  colorClass: string;
  headerColor: string;
  tahun: number;
}) {
  // Group by kategori
  const grouped = items.reduce(
    (acc, item) => {
      if (!acc[item.kategori]) acc[item.kategori] = [];
      acc[item.kategori].push(item);
      return acc;
    },
    {} as Record<string, typeof items>
  );

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px]">
            TA {tahun}
          </Badge>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          {Object.entries(grouped).map(([kategori, groupItems]) => (
            <div key={kategori}>
              <div className={`px-4 py-2 border-b ${colorClass}`}>
                <h3 className={`text-xs font-bold ${headerColor} uppercase tracking-wide`}>
                  {kategori}
                </h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold w-[50px]">
                      Kode
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold">
                      Nama Akun
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">
                      Anggaran
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">
                      Realisasi
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-center w-[80px]">
                      %
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="text-[11px] text-muted-foreground font-mono">
                        {item.kodeAkun}
                      </TableCell>
                      <TableCell className="text-[11px] font-medium">
                        {item.namaAkun}
                      </TableCell>
                      <TableCell className="text-[11px] text-right font-mono">
                        {formatRupiahFull(item.anggaran)}
                      </TableCell>
                      <TableCell className="text-[11px] text-right font-mono">
                        {formatRupiahFull(item.realisasi)}
                      </TableCell>
                      <TableCell className="text-[11px] text-center">
                        <Badge
                          className={`text-[10px] px-1.5 py-0 h-5 ${
                            item.persentase >= 90
                              ? "bg-emerald-100 text-emerald-800"
                              : item.persentase >= 75
                                ? "bg-amber-100 text-amber-800"
                                : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {formatPersentase(item.persentase)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Subtotal */}
              <div className={`px-4 py-2 ${colorClass} border-t font-semibold text-xs flex justify-between`}>
                <span>Subtotal {kategori}</span>
                <div className="flex gap-6">
                  <span className="font-mono">
                    {formatRupiahFull(groupItems.reduce((s, i) => s + i.anggaran, 0))}
                  </span>
                  <span className="font-mono">
                    {formatRupiahFull(groupItems.reduce((s, i) => s + i.realisasi, 0))}
                  </span>
                  <span className="w-[60px] text-center">
                    {formatPersentase(
                      groupItems.reduce((s, i) => s + i.realisasi, 0) /
                        groupItems.reduce((s, i) => s + i.anggaran, 0) *
                        100
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ============ SKPD QUICK SUMMARY ============
function SKPDQuickSummary({ data }: { data: DashboardData }) {
  return (
    <Card className="shadow-md border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#F9A825]" />
          Ringkasan Realisasi Per-SKPD/OPD
          <Badge variant="secondary" className="ml-auto text-[10px]">
            TA {data.tahun}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {data.realisasiSkpd
            .sort((a, b) => b.anggaran - a.anggaran)
            .map((skpd) => (
              <div
                key={skpd.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {skpd.namaSkpd}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          skpd.persentase >= 90
                            ? "bg-emerald-500"
                            : skpd.persentase >= 75
                              ? "bg-amber-500"
                              : "bg-orange-500"
                        }`}
                        style={{
                          width: `${Math.min(skpd.persentase, 100)}%`,
                        }}
                      />
                    </div>
                    <Badge
                      className={`text-[10px] px-1.5 py-0 h-5 ${
                        skpd.persentase >= 90
                          ? "bg-emerald-100 text-emerald-800"
                          : skpd.persentase >= 75
                            ? "bg-amber-100 text-amber-800"
                            : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {formatPersentase(skpd.persentase)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-mono text-muted-foreground">
                    Anggaran
                  </p>
                  <p className="text-[11px] font-mono font-semibold">
                    {formatRupiahFull(skpd.anggaran)}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
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
